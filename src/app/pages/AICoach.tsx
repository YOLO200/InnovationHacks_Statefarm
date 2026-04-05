import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Globe, Trash2 } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';

// ─── STREAMING ────────────────────────────────────────────────────────────────
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
const GEMINI_MODEL = 'gemini-2.5-flash';

const streamMessage = async (
  system: string,
  messages: { role: string; content: string }[],
  onToken: (t: string) => void,
  onDone: () => void,
  onError: (e: string) => void
) => {
  if (!API_KEY) { onError('API key not set. Add VITE_GEMINI_API_KEY to your .env file and restart the dev server.'); return; }
  try {
    const contents = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents,
          generationConfig: { maxOutputTokens: 1024 },
        }),
      }
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      onError(err?.error?.message || `Request failed (${res.status}). Check your API key.`);
      return;
    }
    const data = await res.json();
    const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    if (!text) { onError('No response received from Gemini.'); return; }

    // Simulate streaming by revealing the response word by word
    const words = text.split(' ');
    for (let i = 0; i < words.length; i++) {
      onToken((i === 0 ? '' : ' ') + words[i]);
      await new Promise(r => setTimeout(r, 18));
    }
    onDone();
  } catch {
    onError('Network error. Check your connection.');
  }
};

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const LANGS = [
  { code: 'English',      label: 'EN', flag: '🇺🇸' },
  { code: 'Español',      label: 'ES', flag: '🇲🇽' },
  { code: '中文',          label: 'ZH', flag: '🇨🇳' },
  { code: 'Tiếng Việt',   label: 'VI', flag: '🇻🇳' },
  { code: 'العربية',      label: 'AR', flag: '🇸🇦' },
  { code: 'Français',     label: 'FR', flag: '🇫🇷' },
];

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

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
type Message = { role: 'user' | 'assistant'; content: string };

const INIT_MESSAGE: Message = {
  role: 'assistant',
  content: `Hi! I'm your AI financial coach.\n\nI'm here to help you build a stronger financial future — no judgment, just real advice tailored to your situation.\n\nWhat's on your mind today?`,
};

export function AICoach() {
  const [msgs, setMsgs] = useState<Message[]>([INIT_MESSAGE]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [lang, setLang] = useState(LANGS[0]);
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

    const systemPrompt = `You are a warm, empathetic, and knowledgeable financial wellness coach. Help users build financial resilience with practical, actionable advice.

Coaching style:
- Respond in ${lang.code}
- Be warm, empathetic, never condescending
- Use plain language — explain any financial terms you use
- Give specific, actionable advice
- Keep responses to 2–4 paragraphs with line breaks for readability
- Acknowledge feelings before giving advice on emotional topics`;

    let streamed = '';
    await streamMessage(
      systemPrompt,
      historyRef.current,
      (token) => {
        streamed += token;
        setMsgs(prev => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: 'assistant', content: streamed };
          return copy;
        });
      },
      () => {
        historyRef.current = [...historyRef.current, { role: 'assistant', content: streamed }];
        setStreaming(false);
        setTimeout(() => inputRef.current?.focus(), 100);
      },
      (err) => {
        setMsgs(prev => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: 'assistant', content: `⚠️ ${err}` };
          return copy;
        });
        setStreaming(false);
      }
    );
  }, [input, streaming, lang]);

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
            {/* Language selector */}
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLangs(v => !v)}
                className="flex items-center gap-1.5 text-sm"
              >
                <span>{lang.flag}</span>
                <span className="text-gray-500">{lang.label}</span>
                <Globe className="w-3.5 h-3.5 text-gray-400" />
              </Button>
              {showLangs && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 min-w-[160px] overflow-hidden">
                  {LANGS.map(l => (
                    <button
                      key={l.code}
                      onClick={() => { setLang(l); setShowLangs(false); }}
                      className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left hover:bg-gray-50 border-b border-gray-100 last:border-0 ${l.code === lang.code ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700'}`}
                    >
                      {l.flag} {l.code}
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

      {/* Messages */}
      <Card className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {msgs.map((m, i) => {
          const isUser = m.role === 'user';
          const isLastAI = i === msgs.length - 1 && !isUser;
          const isEmpty = m.content === '' && streaming && isLastAI;
          const isCursor = isLastAI && streaming && m.content.length > 0;

          return (
            <div key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'} items-end gap-2`}>
              {!isUser && (
                <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-sm flex-shrink-0">
                  🤖
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words ${
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
            placeholder={streaming ? 'AI is responding…' : `Ask your coach… (${lang.flag})`}
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
