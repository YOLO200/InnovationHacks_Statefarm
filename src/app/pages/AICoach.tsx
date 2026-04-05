import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Trash2, AlertTriangle } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { callGemini, QuotaExceededError, isQuotaExceeded } from '../lib/gemini';
import { useLanguage, LANGUAGES } from '../store/LanguageContext';
import { useAppData } from '../store/AppContext';
import { speak, SpeechController } from '../lib/elevenlabs';

// ─── QUICK PROMPTS ────────────────────────────────────────────────────────────
const QUICK_PROMPTS = [
  'How do I start an emergency fund?',
  'Explain credit scores simply',
  'What is the 50/30/20 rule?',
  'How do I stop living paycheck to paycheck?',
  'Fastest way to pay off debt?',
  'How much should I save each month?',
];

// ─── TYPING INDICATOR ─────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex gap-1.5 items-center py-1">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="w-2 h-2 rounded-full bg-gray-400 inline-block animate-bounce"
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: '0.9s' }}
        />
      ))}
    </div>
  );
}

// ─── SPEAK BUTTON ─────────────────────────────────────────────────────────────
function SpeakButton({ text }: { text: string }) {
  const { lang } = useLanguage();
  const [state, setState] = useState<'idle' | 'loading' | 'playing'>('idle');
  const ctrlRef = useRef<SpeechController | null>(null);

  const stop = () => {
    ctrlRef.current?.stop();
    ctrlRef.current = null;
    setState('idle');
  };

  const handleClick = async () => {
    if (state !== 'idle') { stop(); return; }
    setState('loading');
    try {
      const ctrl = await speak(
        text,
        lang,
        () => setState('playing'),
        () => { ctrlRef.current = null; setState('idle'); },
      );
      ctrlRef.current = ctrl;
    } catch {
      setState('idle');
    }
  };

  return (
    <button
      onClick={handleClick}
      title={state === 'playing' ? 'Stop audio' : 'Listen'}
      className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center border transition-all hover:scale-110 ${
        state === 'playing'
          ? 'bg-red-50 border-red-200 text-red-500'
          : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-blue-500 hover:border-blue-300'
      }`}
    >
      {state === 'loading' ? (
        <div className="w-3 h-3 rounded-full border-2 border-slate-300 border-t-blue-500 animate-spin" />
      ) : state === 'playing' ? (
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
          <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
        </svg>
      )}
    </button>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
type Message = { role: 'user' | 'assistant'; content: string };

const INIT_MESSAGE: Message = {
  role: 'assistant',
  content: `Hi, I'm Crunch Guide.\n\nAsk me about your runway, spending pressure, upcoming bills, or what to do today. I'll answer using your actual data — nothing generic.`,
};

export function AICoach() {
  const { lang, setLang, geminiLangName } = useLanguage();
  const currentLang = LANGUAGES.find(l => l.code === lang) ?? LANGUAGES[0];
  const { userData } = useAppData();

  const [msgs, setMsgs] = useState<Message[]>([INIT_MESSAGE]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [quotaHit, setQuotaHit] = useState(isQuotaExceeded());
  const [showLangs, setShowLangs] = useState(false);
  const [showQuick, setShowQuick] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const historyRef = useRef<{ role: string; content: string }[]>([]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs]);

  const send = useCallback(async (overrideText?: string) => {
    const txt = (overrideText !== undefined ? overrideText : input).trim();
    if (!txt || streaming) return;
    setInput('');
    setShowQuick(false);

    historyRef.current = [...historyRef.current, { role: 'user', content: txt }];
    setMsgs(prev => [...prev, { role: 'user', content: txt }, { role: 'assistant', content: '' }]);
    setStreaming(true);

    const dataBlock = userData ? `
User's current financial data:
- Work type: ${userData.profile.work_type}
- Avg monthly income: $${userData.income.avg_monthly_income.toLocaleString()}
- Lowest monthly income: $${userData.income.low_monthly_income.toLocaleString()}
- Monthly expenses: $${userData.financials.fixed_expenses.toLocaleString()}
- Savings: $${userData.financials.savings.toLocaleString()} (${userData.derived.cash_runway_days} days runway)
- Health score: ${userData.derived.financial_health_score}/100 — ${userData.derived.risk_level} risk
- Income volatility: ${Math.round(userData.derived.income_volatility_score * 100)}%
- Insurance: ${userData.financials.has_insurance ? 'yes' : 'no'}` : 'No financial data available.';

    const systemPrompt = `You are Crunch Guide, a financial crisis prevention assistant for gig workers.
${dataBlock}

Respond in ${geminiLangName}.
Only answer using the user's data above. Never guess or hallucinate. If data is missing say: "I can't verify that from your current data."

Help with: runway, spending pressure, volatility, bills, what to do today, whether things are improving, dashboard numbers, alerts, trends.
Do NOT help with: insurance product recommendations, investment advice, legal advice, tax filing advice, medical advice, or unrelated topics. If asked, reply: "That's outside what I can help with. Ask me about your runway, spending, or what to do today."

Style: plain English, direct, 1–4 sentences max, one practical action when relevant. Never exceed 4 sentences.`;

    const contents = historyRef.current.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    try {
      const text = await callGemini('chat', {
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: { maxOutputTokens: 200 },
      });

      let streamed = '';
      const words = text.split(' ');
      for (let i = 0; i < words.length; i++) {
        streamed += (i === 0 ? '' : ' ') + words[i];
        setMsgs(prev => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: 'assistant', content: streamed };
          return copy;
        });
        await new Promise(r => setTimeout(r, 18));
      }
      historyRef.current = [...historyRef.current, { role: 'assistant', content: streamed }];
      setQuotaHit(false);
    } catch (err) {
      const isQuota = err instanceof QuotaExceededError;
      if (isQuota) setQuotaHit(true);
      const msg = isQuota
        ? '⚠️ API quota exceeded. Your Gemini free-tier limit has been reached. Check console.cloud.google.com to review usage or upgrade your plan.'
        : `⚠️ ${(err as Error).message}`;
      setMsgs(prev => {
        const copy = [...prev];
        copy[copy.length - 1] = { role: 'assistant', content: msg };
        return copy;
      });
    } finally {
      setStreaming(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [input, streaming, geminiLangName]);

  const clearChat = () => {
    historyRef.current = [];
    setMsgs([{ role: 'assistant', content: 'Fresh start! Ask me anything about your finances.' }]);
    setShowQuick(true);
  };

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Coach</h1>
            <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full inline-block ${streaming ? 'bg-amber-400' : 'bg-green-500'}`} />
              {streaming ? 'Responding…' : 'Live AI · Streaming'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Language selector — syncs with global LanguageContext */}
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLangs(v => !v)}
                className="flex items-center gap-1.5 text-sm"
              >
                <span>{currentLang.flag}</span>
                <span className="text-gray-500">{currentLang.label}</span>
                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="2" y1="12" x2="22" y2="12"/>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
              </Button>
              {showLangs && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 min-w-[160px] overflow-hidden">
                  {LANGUAGES.map(l => (
                    <button
                      key={l.code}
                      onClick={() => { setLang(l.code); setShowLangs(false); }}
                      className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left hover:bg-gray-50 border-b border-gray-100 last:border-0 ${l.code === lang ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700'}`}
                    >
                      {l.flag} {l.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Button variant="outline" size="sm" onClick={clearChat} className="flex items-center gap-1.5">
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </Button>
          </div>
        </div>

        {/* Quick prompts */}
        {showQuick && (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {QUICK_PROMPTS.map(p => (
              <button
                key={p}
                onClick={() => send(p)}
                className="flex-shrink-0 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 rounded-full px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap"
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quota banner */}
      {quotaHit && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 mb-3">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-500" />
          <span>
            <strong>Gemini quota exceeded.</strong> Your free-tier API limit has been reached.
            Visit <span className="font-mono text-xs">console.cloud.google.com</span> to check usage or upgrade your plan.
          </span>
        </div>
      )}

      {/* Messages */}
      <Card className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {msgs.map((m, i) => {
          const isUser = m.role === 'user';
          const isLastAI = i === msgs.length - 1 && !isUser;
          const isEmpty = m.content === '' && streaming && isLastAI;
          const isCursor = isLastAI && streaming && m.content.length > 0;
          const isDone = !isUser && !streaming && m.content.length > 0;

          return (
            <div key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'} items-end gap-2`}>
              {!isUser && (
                <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-sm flex-shrink-0">
                  🤖
                </div>
              )}
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                  isUser
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'
                }`}
              >
                {isEmpty ? <TypingDots /> : m.content}
                {isCursor && (
                  <span className="inline-block w-0.5 h-3.5 bg-blue-400 ml-0.5 align-text-bottom animate-pulse" />
                )}
              </div>
              {/* ElevenLabs speak button — only on completed assistant messages */}
              {isDone && <SpeakButton text={m.content} />}
            </div>
          );
        })}
        <div ref={endRef} />
      </Card>

      {/* Input */}
      <div className="mt-3">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => {
              setInput(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
            }}
            placeholder={streaming ? 'AI is responding…' : `Ask your coach… (${currentLang.flag})`}
            disabled={streaming}
            rows={1}
            className="flex-1 resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 overflow-hidden"
            style={{ minHeight: 46, lineHeight: '1.5' }}
          />
          <button
            onClick={() => send()}
            disabled={streaming || !input.trim()}
            className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-colors disabled:cursor-not-allowed disabled:opacity-40 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {streaming
              ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              : <Send className="w-4 h-4" />
            }
          </button>
        </div>
        <p className="text-xs text-gray-400 text-center mt-1.5">Shift+Enter for new line · Enter to send</p>
      </div>
    </div>
  );
}
