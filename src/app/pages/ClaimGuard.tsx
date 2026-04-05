import { useState, useRef } from 'react';
import { useAppData } from '../store/AppContext';
import { callGemini } from '../../lib/gemini';

// ─── TYPES ────────────────────────────────────────────────────────────────────
type Screen = 'input' | 'analyzing' | 'results';

interface ClaimError {
  title: string;
  description: string;
  impact: string;
}
interface ClaimCorrect {
  title: string;
  description: string;
}
interface AnalysisResult {
  claimId: string;
  claimDate: string;
  totalOvercharge: number;
  errors: ClaimError[];
  correct: ClaimCorrect[];
  summary: string;
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

const EOB_PROMPT = `You are an expert insurance billing analyst. Carefully read this Explanation of Benefits (EOB), denial letter, or medical bill.

Find ALL billing errors, incorrect denials, wrong calculations, and overcharges. For each issue found, explain:
1. What the error is
2. Why it's wrong (cite the specific rule, billing code, or policy clause)
3. The exact financial impact

Also note any items that were processed correctly.

Return ONLY raw JSON — no markdown fences, no code blocks, no explanation, start your response with { and end with }:
{
  "claimId": "claim/reference number if found, else empty string",
  "claimDate": "date if found, else empty string",
  "totalOvercharge": 0,
  "errors": [
    {
      "title": "Short error title (under 10 words)",
      "description": "Plain-English explanation of what went wrong and why, citing specific rules",
      "impact": "e.g. $185 extra charged or $145 should be $0"
    }
  ],
  "correct": [
    {
      "title": "What was processed correctly",
      "description": "Brief confirmation"
    }
  ],
  "summary": "One clear sentence: what the patient actually owes vs what they were charged"
}

If no errors found, return empty errors array. Always return valid JSON.`;

const APPEAL_PROMPT = (result: AnalysisResult, name: string, pastedText: string) =>
  `Write a professional insurance appeal letter for the following situation.

Patient: ${name}
${result.claimId ? `Claim ID: ${result.claimId}` : ''}
${result.claimDate ? `Claim Date: ${result.claimDate}` : ''}
Total overcharge: $${result.totalOvercharge.toLocaleString()}

Billing errors found:
${result.errors.map((e, i) => `${i + 1}. ${e.title}: ${e.description} (Impact: ${e.impact})`).join('\n')}

${pastedText ? `Original EOB text:\n${pastedText.slice(0, 500)}` : ''}

Write a concise, firm appeal letter that:
1. States this is a formal written appeal
2. Cites each specific error with its financial impact
3. References applicable federal law (ACA §2719, 45 CFR 147.130, ERISA §502 where relevant)
4. Demands correction and payment within 30 days
5. Closes professionally

Format as a ready-to-send business letter. Do not use placeholder brackets.`;

// ─── COVERAGE CARD ────────────────────────────────────────────────────────────
function CoverageCard({
  type, name, detail, pct, covered, tip,
}: {
  type: string; name: string; detail: string;
  pct: number; covered: boolean; tip?: string;
}) {
  const barColor = covered ? '#22c55e' : '#ef4444';
  return (
    <div className={`rounded-xl p-4 mb-3 border ${covered ? 'bg-white border-slate-200' : 'border-red-200 bg-red-50'}`}>
      <div className="flex items-center justify-between mb-1">
        <div>
          <p className={`text-[10px] font-bold uppercase tracking-wider ${covered ? 'text-slate-400' : 'text-red-400'}`}>{type}</p>
          <p className={`text-sm font-bold mt-0.5 ${covered ? 'text-slate-900' : 'text-red-700'}`}>{name}</p>
        </div>
        <span className="text-sm font-black" style={{ color: barColor }}>{pct}%</span>
      </div>
      <p className={`text-xs mb-2 leading-relaxed ${covered ? 'text-slate-500' : 'text-slate-500'}`}>{detail}</p>
      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: barColor }} />
      </div>
      {tip && (
        <p className={`text-xs font-semibold mt-2 ${covered ? 'text-amber-600' : 'text-red-600'}`}>{tip}</p>
      )}
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export function ClaimGuard() {
  const { userData } = useAppData();
  const fileRef = useRef<HTMLInputElement>(null);
  const [screen, setScreen] = useState<Screen>('input');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [pasteMode, setPasteMode] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState('');
  const [appealLetter, setAppealLetter] = useState('');
  const [genLetter, setGenLetter] = useState(false);
  const [letterOpen, setLetterOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const hasIns = userData?.financials.has_insurance ?? false;
  const insMonthly = userData?.financials.spending_breakdown.insurance ?? 0;
  const isDriver = userData?.profile.work_type === 'rideshare' || userData?.profile.work_type === 'delivery';
  const name = userData?.personal?.name || 'Policyholder';

  // ── Analyze ─────────────────────────────────────────────────────────────────
  async function handleAnalyze() {
    if (!uploadFile && !pastedText.trim()) return;
    setScreen('analyzing');
    setError('');
    try {
      let body: object;
      if (uploadFile) {
        const base64 = await fileToBase64(uploadFile);
        body = {
          contents: [{
            parts: [
              { text: EOB_PROMPT },
              { inlineData: { mimeType: uploadFile.type || 'image/jpeg', data: base64 } },
            ],
          }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 2048 },
        };
      } else {
        body = {
          contents: [{ parts: [{ text: `${EOB_PROMPT}\n\nDocument text:\n${pastedText}` }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 2048 },
        };
      }

      const raw = await callGemini('eob-analysis', body);
      // Strip markdown code fences if present, then extract the JSON object
      const stripped = raw.replace(/```[\w]*\n?/g, '').trim();
      const match = stripped.match(/\{[\s\S]*\}/);
      if (!match) throw new Error(`AI returned an unexpected format. Please try pasting the text instead of uploading.`);
      let parsed: AnalysisResult;
      try {
        parsed = JSON.parse(match[0]) as AnalysisResult;
      } catch {
        throw new Error('AI response was not valid JSON. Please try again.');
      }
      setResult(parsed);
      setScreen('results');
    } catch (e) {
      const msg = (e as Error).message || '';
      if (msg.toLowerCase().includes('image') || msg.toLowerCase().includes('gemini')) {
        setError('Gemini API required for image upload. Add a valid VITE_GEMINI_API_KEY to your .env, or use "Paste text" instead.');
      } else if (msg.toLowerCase().includes('groq') || msg.toLowerCase().includes('api key') || msg.toLowerCase().includes('invalid')) {
        setError('API key error: ' + msg + ' — check your VITE_GEMINI_API_KEY or VITE_GROQ_API_KEY in .env.');
      } else {
        setError(msg || 'Analysis failed. Please try again.');
      }
      setScreen('input');
    }
  }

  // ── Appeal letter ────────────────────────────────────────────────────────────
  async function handleGenerateLetter() {
    if (!result) return;
    setGenLetter(true);
    try {
      const prompt = APPEAL_PROMPT(result, name, pastedText);
      const body = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 2048 },
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

  // ── Coverage panel ────────────────────────────────────────────────────────────
  const CoveragePanel = () => (
    <div>
      <p className="text-sm font-bold text-slate-800 mb-3">Your current coverage</p>
      {isDriver ? (
        <CoverageCard
          type="Auto insurance"
          name={hasIns ? 'Active — State Farm' : 'Not on file'}
          detail={hasIns ? `$${insMonthly > 0 ? insMonthly : 142}/mo · Required to drive` : 'No auto insurance detected in your profile.'}
          pct={hasIns ? 100 : 0}
          covered={hasIns}
          tip={hasIns ? '⚠ Ask about commercial rider for rideshare gap coverage' : '⚠ Required — get coverage before driving'}
        />
      ) : (
        <CoverageCard
          type="Insurance"
          name={hasIns ? 'Active' : 'Not on file'}
          detail={hasIns ? `$${insMonthly > 0 ? insMonthly : 0}/mo · On file from your profile` : 'No insurance detected.'}
          pct={hasIns ? 75 : 0}
          covered={hasIns}
        />
      )}
      <CoverageCard
        type="Health insurance"
        name="Not covered"
        detail="No active policy · One ER visit = $3,000–$8,000"
        pct={0}
        covered={false}
        tip="⚠ You can get $0–50/mo ACA plan at healthcare.gov"
      />
      <CoverageCard
        type="Disability insurance"
        name="Not covered"
        detail="If injured, income = $0 with no backup · Critical for gig workers"
        pct={0}
        covered={false}
        tip="⚠ Stride disability ~$40/mo · Available with ITIN"
      />
    </div>
  );

  // ════════════════════════════════════════════════════════════════════════════
  // ANALYZING SCREEN
  // ════════════════════════════════════════════════════════════════════════════
  if (screen === 'analyzing') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-5" style={{ background: '#f4f6fb' }}>
        <div className="w-14 h-14 rounded-full border-4 border-blue-200 border-t-blue-700 animate-spin" />
        <div className="text-center">
          <p className="text-lg font-bold text-slate-800">Reading your document…</p>
          <p className="text-sm text-slate-500 mt-1">AI is checking for billing errors, denied claims, and overcharges</p>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // RESULTS SCREEN
  // ════════════════════════════════════════════════════════════════════════════
  if (screen === 'results' && result) {
    const hasErrors        = result.errors.length > 0;
    const hasRealOvercharge = result.totalOvercharge > 0;
    // Only offer an appeal when there's a confirmed dollar impact
    const canAppeal        = hasErrors && hasRealOvercharge;
    return (
      <div className="min-h-screen" style={{ background: '#f4f6fb' }}>
        <div className="px-6 py-5 border-b border-slate-200 bg-white flex items-center justify-between">
          <button
            onClick={() => { setScreen('input'); setResult(null); setAppealLetter(''); }}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
            Back
          </button>
          <h1 className="text-base font-bold text-slate-900">Claim Guard</h1>
          <div />
        </div>

        <div className="max-w-5xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: results */}
          <div className="lg:col-span-2 space-y-4">
            {/* Result header */}
            <div>
              <p className="text-base font-bold text-slate-900 mb-1">
                {result.claimId
                  ? `Analysis: ${result.claimId}${result.claimDate ? ` — ${result.claimDate}` : ''}`
                  : 'Analysis complete'}
              </p>
            </div>

            {/* Main analysis card */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className={`px-5 py-4 border-b flex items-center justify-between ${
                hasRealOvercharge ? 'border-slate-200' : hasErrors ? 'border-amber-100 bg-amber-50' : 'border-green-100 bg-green-50'
              }`}>
                <h3 className="text-sm font-bold text-slate-900">
                  {hasRealOvercharge
                    ? `⚠ We found ${result.errors.length} error${result.errors.length !== 1 ? 's' : ''} — you were overcharged $${result.totalOvercharge.toLocaleString()}`
                    : hasErrors
                    ? `⚠ Potential issue detected — no confirmed overcharge yet`
                    : '✓ Everything looks good — this claim was processed correctly'}
                </h3>
                {hasRealOvercharge && (
                  <span className="text-xs font-bold bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded-full">
                    {result.errors.length} error{result.errors.length !== 1 ? 's' : ''} found
                  </span>
                )}
                {hasErrors && !hasRealOvercharge && (
                  <span className="text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                    Review recommended
                  </span>
                )}
              </div>

              <div className="p-5 space-y-3">
                {/* Error items */}
                {result.errors.map((err, i) => (
                  <div key={i} className="border-l-4 border-red-500 rounded-r-lg bg-red-50 px-4 py-3">
                    <h4 className="text-sm font-bold text-red-800 mb-1">
                      ✕ Error {i + 1} — {err.title}
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">{err.description}</p>
                    <p className="text-xs font-bold text-red-600 mt-2">Impact: {err.impact}</p>
                  </div>
                ))}

                {/* Correct items */}
                {result.correct.map((c, i) => (
                  <div key={i} className="border-l-4 border-green-500 rounded-r-lg bg-green-50 px-4 py-3">
                    <h4 className="text-sm font-bold text-green-800 mb-1">✓ Correct — {c.title}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">{c.description}</p>
                  </div>
                ))}

                {/* No errors, no correct items */}
                {!hasErrors && result.correct.length === 0 && (
                  <p className="text-sm text-slate-500 py-2">
                    No billing issues detected. Your claim appears to have been handled correctly.
                  </p>
                )}
              </div>
            </div>

            {/* Summary — only show when there's something meaningful to say */}
            {result.summary && (
              <div className={`rounded-xl border p-4 ${hasErrors ? 'border-green-200 bg-green-50' : 'border-slate-200 bg-slate-50'}`}>
                <p className="text-sm font-bold mb-1 text-slate-800">
                  {hasRealOvercharge ? `You owe $0, not $${result.totalOvercharge.toLocaleString()}` : 'Summary'}
                </p>
                <p className="text-sm text-slate-700 leading-relaxed">{result.summary}</p>
              </div>
            )}

            {/* Appeal letter — only when there's a confirmed overcharge */}
            {canAppeal && (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100 gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-900">Generate Appeal Letter</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {result.claimId
                        ? `Cites your specific errors from claim ${result.claimId}`
                        : 'Cites all errors found with applicable federal laws'}
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
                          : '✍ Generate Letter'}
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
          </div>

          {/* Right: coverage */}
          <div><CoveragePanel /></div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // INPUT SCREEN
  // ════════════════════════════════════════════════════════════════════════════
  const canAnalyze = (!!uploadFile || pastedText.trim().length > 20);

  return (
    <div className="min-h-screen" style={{ background: '#f4f6fb' }}>
      {/* Hero banner — matches .claim-hero from HTML */}
      <div className="px-6 pt-6 pb-5" style={{ background: 'linear-gradient(135deg,#2d3dbd 0%,#1a237e 100%)' }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl font-black text-white mb-1.5 tracking-tight">
            We read your insurance bills so you don't get cheated
          </h2>
          <p className="text-sm text-white/70 mb-4 leading-relaxed max-w-xl">
            Upload a denial letter or Explanation of Benefits (EOB). We explain it in plain English, check if the rules were applied correctly, and draft an appeal letter citing your state's insurance law — no lawyer needed.
          </p>
          {/* What we check box */}
          <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.12)' }}>
            <p className="text-xs font-bold text-white/80 uppercase tracking-widest mb-3">What we check</p>
            <div className="grid grid-cols-2 gap-y-1.5 gap-x-4">
              {[
                'Billing code accuracy & medical necessity',
                'Coverage denials & appeal opportunities',
                'Duplicate charges & billing errors',
                'Out-of-network vs in-network pricing',
                'Deductible & coinsurance calculations',
                'Your rights under state insurance law',
              ].map(item => (
                <div key={item} className="flex items-center gap-2 text-xs text-white/65">
                  <span className="text-white/50 font-bold text-[10px]">✓</span>
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
          {/* Drop zone */}
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
              onDrop={e => {
                e.preventDefault();
                const f = e.dataTransfer.files[0];
                if (f) { setUploadFile(f); setPasteMode(false); }
              }}
              className={`rounded-xl border-2 border-dashed text-center py-10 px-8 cursor-pointer mb-4 transition-all ${
                uploadFile
                  ? 'border-green-500 bg-green-50'
                  : 'border-slate-200 bg-white hover:border-blue-400 hover:bg-blue-50/30'
              }`}
            >
              <div className="text-4xl mb-3">{uploadFile ? '✓' : '📄'}</div>
              <h4 className={`text-base font-bold mb-1 ${uploadFile ? 'text-green-800' : 'text-slate-800'}`}>
                {uploadFile ? uploadFile.name : 'Upload EOB or Denial Letter'}
              </h4>
              <p className={`text-sm ${uploadFile ? 'text-green-600' : 'text-slate-500'}`}>
                {uploadFile ? 'Uploaded · Click to replace' : 'Drop your document here or click to upload'}
              </p>
              <p className="text-xs text-slate-400 mt-2">PDF, JPG, or PNG · max 10MB</p>
            </div>
          ) : (
            <div className="mb-4">
              <textarea
                value={pastedText}
                onChange={e => setPastedText(e.target.value)}
                placeholder="Paste your EOB text, denial letter, or bill here…"
                rows={8}
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 text-sm text-slate-900 bg-white focus:outline-none focus:border-blue-400 resize-none"
              />
            </div>
          )}

          {/* Upload / Paste toggle buttons */}
          <div className="flex gap-3 mb-4">
            <button
              onClick={() => { setPasteMode(false); fileRef.current?.click(); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-all ${
                !pasteMode ? 'border-slate-300 text-slate-700 bg-white hover:bg-slate-50' : 'border-slate-200 text-slate-500 bg-white hover:bg-slate-50'
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

          {/* Error message */}
          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Analyze button */}
          <button
            onClick={handleAnalyze}
            disabled={!canAnalyze}
            className="w-full py-3.5 rounded-xl text-sm font-bold text-white disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
            style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)' }}
          >
            ✦ Analyze my EOB →
          </button>
        </div>

        {/* ── Right: coverage ── */}
        <div><CoveragePanel /></div>
      </div>
    </div>
  );
}
