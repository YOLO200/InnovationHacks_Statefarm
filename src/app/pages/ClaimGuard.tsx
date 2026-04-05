import { useState, useRef, useEffect } from 'react';
import { useAppData } from '../store/AppContext';
import { analyzeEOB, streamClaimChat, callGemini, type EOBAnalysis } from '../../lib/gemini';
import { enrichWithCARCData, detectStateFromText, STATE_DOI } from '../../lib/claimGuardRules';

// ─── TYPES ────────────────────────────────────────────────────────────────────
type Screen = 'input' | 'analyzing' | 'results';

interface EnrichedError {
  title: string;
  description: string;
  impact: string;
  carcCode?: string;
  winRate?: number;
  lawCitation?: string;
  actionSummary?: string;
  isPreventiveCare?: boolean;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  streaming?: boolean;
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
  });
}

const APPEAL_PROMPT = (result: EOBAnalysis, errors: EnrichedError[], name: string, pastedText: string) =>
  `Write a professional insurance appeal letter for the following situation.

Patient: ${name}
${result.claimId ? `Claim ID: ${result.claimId}` : ''}
${result.claimDate ? `Claim Date: ${result.claimDate}` : ''}
${result.detectedInsurer ? `Insurer: ${result.detectedInsurer}` : ''}
Total overcharge: $${result.totalOvercharge.toLocaleString()}

Billing errors found:
${errors.map((e, i) => `${i + 1}. ${e.title}${e.carcCode ? ` [${e.carcCode}]` : ''}: ${e.description} (Impact: ${e.impact})${e.lawCitation ? ` — cites ${e.lawCitation}` : ''}`).join('\n')}

${pastedText ? `Original EOB text:\n${pastedText.slice(0, 600)}` : ''}

Write a concise, firm appeal letter that:
1. States this is a formal written appeal under ${result.detectedState ? `${STATE_DOI[result.detectedState]?.appealStatute ?? '45 CFR 147.130'} and` : ''} ACA §2719
2. Cites each specific error with its financial impact and the reason code
3. References applicable federal law (ACA §2719, 45 CFR 147.130, ERISA §502 where relevant)
4. Demands correction and reimbursement within 30 days
5. Closes professionally

Format as a ready-to-send business letter. Do not use placeholder brackets.`;

// ─── WIN RATE BADGE ───────────────────────────────────────────────────────────
function WinBadge({ rate }: { rate: number }) {
  const color = rate >= 65 ? '#16a34a' : rate >= 40 ? '#d97706' : '#dc2626';
  const label = rate >= 65 ? 'High chance' : rate >= 40 ? 'Good chance' : 'Lower chance';
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border"
      style={{ color, borderColor: color, background: `${color}15` }}
    >
      {rate}% appeal win rate · {label}
    </span>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export function ClaimGuard() {
  const { userData } = useAppData();
  const fileRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [screen, setScreen] = useState<Screen>('input');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [pasteMode, setPasteMode] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [rawAnalysis, setRawAnalysis] = useState<EOBAnalysis | null>(null);
  const [errors, setErrors] = useState<EnrichedError[]>([]);
  const [error, setError] = useState('');
  const [appealLetter, setAppealLetter] = useState('');
  const [genLetter, setGenLetter] = useState(false);
  const [letterOpen, setLetterOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const name = userData?.personal?.name || 'Policyholder';

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // ── Analyze ────────────────────────────────────────────────────────────────
  async function handleAnalyze() {
    if (!uploadFile && !pastedText.trim()) return;
    setScreen('analyzing');
    setError('');
    try {
      let content: Parameters<typeof analyzeEOB>[0];
      if (uploadFile) {
        const base64 = await fileToBase64(uploadFile);
        content = { type: 'image', base64, mimeType: uploadFile.type || 'image/jpeg' };
      } else {
        content = { type: 'text', text: pastedText };
      }

      const analysis = await analyzeEOB(content);

      // Enrich errors with CARC rules data
      const enriched = enrichWithCARCData(analysis.errors);

      // If state not detected by AI, try to detect from pasted text
      if (!analysis.detectedState && pastedText) {
        const detected = detectStateFromText(pastedText);
        if (detected) analysis.detectedState = detected;
      }

      setRawAnalysis(analysis);
      setErrors(enriched);
      setScreen('results');
    } catch (e) {
      const msg = (e as Error).message || '';
      if (msg.toLowerCase().includes('image') || msg.toLowerCase().includes('gemini')) {
        setError('Gemini API required for image upload. Add VITE_GEMINI_API_KEY to your .env, or use "Paste text" instead.');
      } else if (msg.toLowerCase().includes('api key') || msg.toLowerCase().includes('no ai')) {
        setError('No API key found. Add VITE_GEMINI_API_KEY or VITE_GROQ_API_KEY to your .env file.');
      } else {
        setError(msg || 'Analysis failed. Please try again.');
      }
      setScreen('input');
    }
  }

  // ── Appeal letter ──────────────────────────────────────────────────────────
  async function handleGenerateLetter() {
    if (!rawAnalysis) return;
    setGenLetter(true);
    try {
      const prompt = APPEAL_PROMPT(rawAnalysis, errors, name, pastedText);
      const body = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 4096 },
      };
      const letter = await callGemini('appeal-letter', body);
      setAppealLetter(letter);
      setLetterOpen(true);
    } catch {
      setAppealLetter('Unable to generate letter. Please check your API key and try again.');
    } finally {
      setGenLetter(false);
    }
  }

  async function copyLetter() {
    await navigator.clipboard.writeText(appealLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ── Chat ───────────────────────────────────────────────────────────────────
  async function handleChat(e: React.FormEvent) {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading || !rawAnalysis) return;
    const question = chatInput.trim();
    setChatInput('');
    const userMsg: ChatMessage = { role: 'user', content: question };
    setChatMessages(prev => [...prev, userMsg, { role: 'assistant', content: '', streaming: true }]);
    setChatLoading(true);

    let buffer = '';
    await streamClaimChat(
      question,
      { analysis: rawAnalysis, originalText: pastedText },
      chatMessages.map(m => ({ role: m.role, content: m.content })),
      (token) => {
        buffer += token;
        setChatMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: buffer, streaming: true };
          return updated;
        });
      },
      () => {
        setChatMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: buffer, streaming: false };
          return updated;
        });
        setChatLoading(false);
      },
      (err) => {
        setChatMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: `Error: ${err}`, streaming: false };
          return updated;
        });
        setChatLoading(false);
      }
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ANALYZING SCREEN
  // ════════════════════════════════════════════════════════════════════════════
  if (screen === 'analyzing') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-5" style={{ background: '#f4f6fb' }}>
        <div className="w-14 h-14 rounded-full border-4 border-blue-200 border-t-blue-700 animate-spin" />
        <div className="text-center">
          <p className="text-lg font-bold text-slate-800">Reading your document…</p>
          <p className="text-sm text-slate-500 mt-1">Checking codes, math, and coverage rules</p>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // RESULTS SCREEN
  // ════════════════════════════════════════════════════════════════════════════
  if (screen === 'results' && rawAnalysis) {
    const hasErrors = errors.length > 0;
    const hasOvercharge = rawAnalysis.totalOvercharge > 0;
    const canAppeal = hasErrors && hasOvercharge;
    const doi = rawAnalysis.detectedState ? STATE_DOI[rawAnalysis.detectedState] : null;

    return (
      <div className="min-h-screen" style={{ background: '#f4f6fb' }}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-white flex items-center justify-between">
          <button
            onClick={() => { setScreen('input'); setRawAnalysis(null); setErrors([]); setAppealLetter(''); setChatMessages([]); }}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6" /></svg>
            New analysis
          </button>
          <h1 className="text-base font-bold text-slate-900">Claim Guard</h1>
          <div className="text-xs text-slate-400">{rawAnalysis.claimId || ''}</div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-5 grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* ── Left: main results ── */}
          <div className="lg:col-span-2 space-y-4">

            {/* Hero summary card */}
            <div className={`rounded-xl border p-5 ${hasOvercharge ? 'bg-red-50 border-red-200' : hasErrors ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${hasOvercharge ? 'text-red-500' : hasErrors ? 'text-amber-500' : 'text-green-600'}`}>
                    {hasOvercharge ? 'Overcharge detected' : hasErrors ? 'Issues found' : 'Looks correct'}
                  </p>
                  {hasOvercharge ? (
                    <>
                      <p className="text-2xl font-black text-red-800">${rawAnalysis.totalOvercharge.toLocaleString()} overcharged</p>
                      <p className="text-sm text-red-700 mt-0.5">You may owe significantly less than billed</p>
                    </>
                  ) : hasErrors ? (
                    <p className="text-lg font-bold text-amber-800">Potential issues — review recommended</p>
                  ) : (
                    <p className="text-lg font-bold text-green-800">Claim processed correctly</p>
                  )}
                </div>
                <div className="text-right text-xs text-slate-500 flex-shrink-0">
                  {rawAnalysis.claimDate && <p>{rawAnalysis.claimDate}</p>}
                  {rawAnalysis.detectedInsurer && <p className="font-semibold text-slate-700 mt-0.5">{rawAnalysis.detectedInsurer}</p>}
                </div>
              </div>
              {rawAnalysis.summary && (
                <p className="text-sm text-slate-700 mt-3 pt-3 border-t border-slate-200/60 leading-relaxed">{rawAnalysis.summary}</p>
              )}
            </div>

            {/* Error cards */}
            {errors.map((err, i) => (
              <div key={i} className="bg-white rounded-xl border border-red-200 overflow-hidden shadow-sm">
                <div className="px-5 py-3 bg-red-50 border-b border-red-100 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-red-500 uppercase tracking-wider">Error {i + 1}</span>
                      {err.carcCode && (
                        <span className="text-[10px] font-bold bg-red-100 text-red-700 border border-red-200 px-1.5 py-0.5 rounded font-mono">
                          {err.carcCode}
                        </span>
                      )}
                      {err.isPreventiveCare && (
                        <span className="text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded">
                          ACA §2713 — must be $0
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-bold text-red-900 mt-0.5">{err.title}</p>
                  </div>
                  {err.winRate !== undefined && <WinBadge rate={err.winRate} />}
                </div>
                <div className="px-5 py-4 space-y-2">
                  <p className="text-xs text-slate-600 leading-relaxed">{err.description}</p>
                  <p className="text-xs font-bold text-red-600">Impact: {err.impact}</p>
                  {err.actionSummary && (
                    <p className="text-xs text-blue-700 leading-relaxed border-l-2 border-blue-300 pl-3 mt-2">{err.actionSummary}</p>
                  )}
                  {err.lawCitation && !err.actionSummary && (
                    <p className="text-[10px] text-slate-400 font-mono mt-1">{err.lawCitation}</p>
                  )}
                </div>
              </div>
            ))}

            {/* Correct items */}
            {rawAnalysis.correct.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="px-5 py-3 bg-green-50 border-b border-green-100">
                  <p className="text-xs font-bold text-green-700 uppercase tracking-wider">Processed correctly</p>
                </div>
                <div className="p-5 space-y-2">
                  {rawAnalysis.correct.map((c, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-green-500 font-bold text-sm flex-shrink-0">✓</span>
                      <div>
                        <p className="text-xs font-semibold text-slate-700">{c.title}</p>
                        <p className="text-xs text-slate-500">{c.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* State DOI info */}
            {doi && (
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Your appeal rights — {doi.state}</p>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-slate-400">Health appeal deadline</p>
                    <p className="font-bold text-slate-800">{doi.healthAppealDays} days from denial</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Statute</p>
                    <p className="font-bold text-slate-800 font-mono">{doi.appealStatute}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Insurance regulator</p>
                    <p className="font-bold text-slate-800">{doi.doiName}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Complaint / external appeal</p>
                    <a href={doi.complaintUrl} target="_blank" rel="noopener noreferrer"
                      className="font-bold text-blue-600 hover:underline break-all">
                      File complaint →
                    </a>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-3">Phone: {doi.phone}</p>
              </div>
            )}

            {/* Appeal letter */}
            {(canAppeal || errors.length > 0) && (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100 gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-900">Generate Appeal Letter</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Cites every error with the applicable federal law — ready to send
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {!appealLetter ? (
                      <button
                        onClick={handleGenerateLetter}
                        disabled={genLetter}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
                        style={{ background: 'linear-gradient(135deg,#2d3dbd,#1a237e)' }}
                      >
                        {genLetter
                          ? <><div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />Generating…</>
                          : '✍ Write Letter'}
                      </button>
                    ) : (
                      <>
                        <button onClick={() => setLetterOpen(v => !v)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50">
                          {letterOpen ? 'Collapse' : 'View'}
                        </button>
                        <button onClick={copyLetter}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                          style={{ background: copied ? '#16a34a' : '#1a237e' }}>
                          {copied ? '✓ Copied' : '📋 Copy'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
                {letterOpen && appealLetter && (
                  <div className="p-5 max-h-[500px] overflow-y-auto">
                    <pre className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed font-sans">{appealLetter}</pre>
                  </div>
                )}
              </div>
            )}

            {/* Ask ClaimGuard chatbot */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
                <p className="text-sm font-bold text-slate-900">Ask ClaimGuard</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Ask anything about your EOB — what codes mean, next steps, what to say when you call
                </p>
              </div>

              {/* Messages */}
              {chatMessages.length > 0 && (
                <div className="px-5 py-4 space-y-3 max-h-80 overflow-y-auto">
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {msg.content || (msg.streaming ? <span className="opacity-50">Thinking…</span> : '')}
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
              )}

              {/* Suggested questions (only before first message) */}
              {chatMessages.length === 0 && (
                <div className="px-5 py-3 flex flex-wrap gap-2">
                  {[
                    'What does CO-50 mean for me?',
                    'How do I appeal this?',
                    'What should I say when I call?',
                    'How long do I have to appeal?',
                  ].map(q => (
                    <button key={q} onClick={() => setChatInput(q)}
                      className="text-xs px-3 py-1.5 rounded-full border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors">
                      {q}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <form onSubmit={handleChat} className="px-4 py-3 border-t border-slate-100 flex gap-2">
                <input
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  placeholder="Ask about your EOB…"
                  disabled={chatLoading}
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-900 bg-white focus:outline-none focus:border-blue-400 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || chatLoading}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-40"
                  style={{ background: '#1a237e' }}
                >
                  {chatLoading ? '…' : 'Send'}
                </button>
              </form>
            </div>
          </div>

          {/* ── Right: appeal steps + rights ── */}
          <div className="space-y-4">
            {/* Appeal process */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">3-step appeal process</p>
              {[
                { step: '1', label: 'Internal appeal', detail: 'Send letter to insurer. They must respond within 30 days.', active: true },
                { step: '2', label: 'External review', detail: `Request independent review through ${doi ? doi.doiName : 'your state DOI'}.`, active: false },
                { step: '3', label: 'File a complaint', detail: 'File with your state Department of Insurance.', active: false },
              ].map(s => (
                <div key={s.step} className={`flex gap-3 mb-3 ${!s.active ? 'opacity-50' : ''}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 mt-0.5 ${s.active ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-500'}`}>
                    {s.step}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">{s.label}</p>
                    <p className="text-[11px] text-slate-500 leading-relaxed">{s.detail}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Know your rights */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Know your rights</p>
              {[
                { law: 'ACA §2713', right: 'Preventive care must be covered at $0' },
                { law: '45 CFR 147.130', right: 'Diagnostic services during preventive visit cannot be denied as unnecessary' },
                { law: 'ACA §2719', right: 'You have the right to internal appeal + external review' },
                { law: 'ERISA §502', right: 'You can sue to recover benefits wrongfully denied' },
              ].map(r => (
                <div key={r.law} className="mb-2.5 last:mb-0">
                  <p className="text-[10px] font-bold text-blue-600 font-mono">{r.law}</p>
                  <p className="text-xs text-slate-600 leading-relaxed">{r.right}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // INPUT SCREEN
  // ════════════════════════════════════════════════════════════════════════════
  const canAnalyze = !!uploadFile || pastedText.trim().length > 20;

  return (
    <div className="min-h-screen" style={{ background: '#f4f6fb' }}>
      {/* Hero */}
      <div className="px-6 pt-6 pb-5" style={{ background: 'linear-gradient(135deg,#2d3dbd 0%,#1a237e 100%)' }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl font-black text-white mb-1.5 tracking-tight">
            Upload your EOB or denial letter. We find the errors.
          </h2>
          <p className="text-sm text-white/70 mb-4 leading-relaxed max-w-xl">
            We check denial codes against federal rules, calculate overcharges, and write the appeal letter — no lawyer needed.
          </p>
          <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.12)' }}>
            <p className="text-xs font-bold text-white/80 uppercase tracking-widest mb-3">What we check</p>
            <div className="grid grid-cols-2 gap-y-1.5 gap-x-4">
              {[
                'CARC denial codes & whether they were applied correctly',
                'ACA 2713 preventive care violations (must be $0)',
                'Duplicate charges & billing code errors',
                'Deductible & coinsurance math',
                'Out-of-network vs in-network rate errors',
                'Your appeal rights under state insurance law',
              ].map(item => (
                <div key={item} className="flex items-start gap-2 text-xs text-white/65">
                  <span className="text-white/50 font-bold text-[10px] mt-0.5 flex-shrink-0">✓</span>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left: upload ── */}
        <div className="lg:col-span-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) { setUploadFile(f); setPasteMode(false); } }}
          />

          {!pasteMode ? (
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) { setUploadFile(f); } }}
              className={`rounded-xl border-2 border-dashed text-center py-10 px-8 cursor-pointer mb-4 transition-all ${
                uploadFile ? 'border-green-500 bg-green-50' : 'border-slate-200 bg-white hover:border-blue-400 hover:bg-blue-50/30'
              }`}
            >
              <div className="text-4xl mb-3">{uploadFile ? '✓' : '📄'}</div>
              <h4 className={`text-base font-bold mb-1 ${uploadFile ? 'text-green-800' : 'text-slate-800'}`}>
                {uploadFile ? uploadFile.name : 'Upload EOB or Denial Letter'}
              </h4>
              <p className={`text-sm ${uploadFile ? 'text-green-600' : 'text-slate-500'}`}>
                {uploadFile ? 'Uploaded · Click to replace' : 'Drop your document here or click to upload'}
              </p>
              <p className="text-xs text-slate-400 mt-2">PDF, JPG, or PNG · requires Gemini API key</p>
            </div>
          ) : (
            <div className="mb-4">
              <textarea
                value={pastedText}
                onChange={e => setPastedText(e.target.value)}
                placeholder="Paste your EOB text, denial letter, or bill here…"
                rows={9}
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 text-sm text-slate-900 bg-white focus:outline-none focus:border-blue-400 resize-none"
              />
            </div>
          )}

          <div className="flex gap-3 mb-4">
            <button
              onClick={() => { setPasteMode(false); fileRef.current?.click(); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-all ${
                !pasteMode ? 'border-blue-400 text-blue-700 bg-blue-50' : 'border-slate-200 text-slate-500 bg-white hover:bg-slate-50'
              }`}
            >
              📎 Upload file
            </button>
            <button
              onClick={() => { setPasteMode(true); setUploadFile(null); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-all ${
                pasteMode ? 'border-blue-400 text-blue-700 bg-blue-50' : 'border-slate-200 text-slate-500 bg-white hover:bg-slate-50'
              }`}
            >
              📋 Paste text
            </button>
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            onClick={handleAnalyze}
            disabled={!canAnalyze}
            className="w-full py-3.5 rounded-xl text-sm font-bold text-white disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
            style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)' }}
          >
            Analyze my document →
          </button>

          <p className="text-xs text-slate-400 text-center mt-3">
            Don't have an EOB? Log into your insurer's member portal → Claims → Explanation of Benefits
          </p>
        </div>

        {/* ── Right: what an EOB is ── */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">What is an EOB?</p>
            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              An Explanation of Benefits is a document your insurance company sends after processing a claim. It is <strong>not a bill</strong> — it shows what was billed, what insurance paid, and what you owe.
            </p>
            <p className="text-xs font-semibold text-slate-700 mb-1.5">Where to find yours:</p>
            {[
              'Log into your insurer\'s member portal → "Claims"',
              'Check your email from around your visit date',
              'Check physical mail (white envelope, often mistaken for junk)',
              'Call the number on your insurance card',
            ].map((s, i) => (
              <div key={i} className="flex items-start gap-2 mb-1.5">
                <span className="text-blue-500 font-bold text-[10px] mt-0.5 flex-shrink-0">{i + 1}.</span>
                <p className="text-[11px] text-slate-600 leading-relaxed">{s}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">A real example</p>
            <p className="text-xs text-slate-600 leading-relaxed">
              A family received a $195,000 hospital bill. Using AI to check the CPT and CARC codes, they found duplicate charges and billing errors. The bill was reduced to $33,000 — an 83% reduction.
            </p>
            <p className="text-[10px] text-slate-400 mt-2">Source: Fox News / Komando.com, Oct 2025</p>
          </div>
        </div>
      </div>
    </div>
  );
}
