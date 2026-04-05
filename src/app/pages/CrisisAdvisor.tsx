import { useState, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import { AlertCircle, Activity, Sparkles, ArrowRight, MessageCircle, Send, User, Bot } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ImmediateActions } from '../components/crisis/ImmediateActions';
import { FinancialImpact } from '../components/crisis/FinancialImpact';
import { SmartRecommendations } from '../components/crisis/SmartRecommendations';
import { RiskWarning } from '../components/crisis/RiskWarning';
import { SurvivalPlan } from '../components/crisis/SurvivalPlan';
import { analyzeCrisis, streamCrisisChat, type CrisisAIResponse } from '../../lib/gemini';
import { useAppData } from '../store/AppContext';

const QUICK_CRISES = [
  { label: 'Medical Emergency',  color: 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100' },
  { label: 'Job Loss',           color: 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100' },
  { label: 'Car Breakdown',      color: 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100' },
  { label: 'Natural Disaster',   color: 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100' },
  { label: 'Home Emergency',     color: 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100' },
  { label: 'Legal Issue',        color: 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100' },
];

const QUICK_QUESTIONS = [
  'How do I apply for financial aid?',
  'What documents do I need?',
  'Can I negotiate my bills?',
  'What if I can\'t pay rent this month?',
];

type View = 'input' | 'loading' | 'result';
type ChatMessage = { role: 'user' | 'assistant'; content: string };

function SkeletonCard({ height = 'h-40' }: { height?: string }) {
  return <div className={`${height} rounded-2xl bg-gray-100 animate-pulse`} />;
}

export function CrisisAdvisor() {
  const { userData } = useAppData();
  const [view, setView] = useState<View>('input');
  const [text, setText] = useState('');
  const [aiData, setAiData] = useState<CrisisAIResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Chat state
  const [chatMsgs, setChatMsgs] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatStreaming, setChatStreaming] = useState(false);
  const chatHistoryRef = useRef<{ role: string; content: string }[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const userCtx = userData
    ? {
        savings: userData.financials.savings,
        monthlyExpenses: userData.financials.fixed_expenses,
        avgMonthlyIncome: userData.income.avg_monthly_income,
        runwayDays: userData.derived.cash_runway_days,
        hasInsurance: userData.financials.has_insurance,
        workType: userData.profile.work_type,
      }
    : null;

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setError(null);
    setView('loading');
    setChatMsgs([]);
    chatHistoryRef.current = [];

    try {
      const result = await analyzeCrisis(text.trim(), userCtx);
      setAiData(result);
      setView('result');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setView('input');
    }
  };

  const sendChat = useCallback(async (overrideText?: string) => {
    const q = (overrideText ?? chatInput).trim();
    if (!q || chatStreaming) return;
    setChatInput('');

    chatHistoryRef.current = [...chatHistoryRef.current, { role: 'user', content: q }];
    setChatMsgs(prev => [...prev, { role: 'user', content: q }, { role: 'assistant', content: '' }]);
    setChatStreaming(true);

    const chatUserCtx = userCtx
      ? { savings: userCtx.savings, monthlyExpenses: userCtx.monthlyExpenses, hasInsurance: userCtx.hasInsurance }
      : null;

    let streamed = '';
    await streamCrisisChat(
      q,
      aiData?.crisisTitle ?? text,
      chatUserCtx,
      chatHistoryRef.current.slice(0, -1),
      (token) => {
        streamed += token;
        setChatMsgs(prev => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: 'assistant', content: streamed };
          return copy;
        });
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      },
      () => {
        chatHistoryRef.current = [...chatHistoryRef.current, { role: 'assistant', content: streamed }];
        setChatStreaming(false);
      },
      (err) => {
        setChatMsgs(prev => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: 'assistant', content: `⚠️ ${err}` };
          return copy;
        });
        setChatStreaming(false);
      }
    );
  }, [chatInput, chatStreaming, aiData, text, userCtx]);

  // ── INPUT VIEW ────────────────────────────────────────────────────────────────
  if (view === 'input') {
    return (
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="text-center py-8">
            <motion.div
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 mb-4 shadow-lg"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <AlertCircle className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">What's your crisis?</h1>
            <p className="text-gray-500 text-sm">
              Tell us what's happening — we'll build your personalized response plan
            </p>
          </div>

          <Card className="p-6 space-y-5">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Quick select</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_CRISES.map(c => (
                  <button
                    key={c.label}
                    onClick={() => setText(c.label)}
                    className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${c.color} ${
                      text === c.label ? 'ring-2 ring-offset-1 ring-red-400 shadow-sm' : ''
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-100" />

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Describe what's happening
              </p>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) handleSubmit(); }}
                placeholder='e.g. "My landlord is evicting me and I only have $500 left…"'
                rows={4}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400 resize-none transition-all"
              />
              <p className="text-xs text-gray-400 mt-1">The more detail you give, the better the plan</p>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-xl">
                ⚠️ {error}
              </p>
            )}

            <Button
              onClick={handleSubmit}
              disabled={!text.trim()}
              className="w-full bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 text-white font-semibold py-6 text-base rounded-xl group disabled:opacity-40 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Get My Crisis Plan
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Card>
        </motion.div>
      </div>
    );
  }

  // ── LOADING VIEW ──────────────────────────────────────────────────────────────
  if (view === 'loading') {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <Card className="p-6 bg-gradient-to-r from-red-600 to-orange-600 border-none text-white">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <div className="w-8 h-8 rounded-full border-4 border-white/30 border-t-white animate-spin" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-4 h-4 opacity-80" />
                <span className="text-sm font-medium uppercase tracking-wide opacity-80">AI is working</span>
              </div>
              <h1 className="text-2xl font-bold">Building your crisis plan…</h1>
              <p className="text-white/80 text-sm mt-0.5">Personalizing recommendations to your financial situation</p>
            </div>
          </div>
        </Card>
        <SkeletonCard height="h-56" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SkeletonCard height="h-48" />
          <SkeletonCard height="h-48" />
        </div>
        <SkeletonCard height="h-24" />
        <SkeletonCard height="h-64" />
      </div>
    );
  }

  // ── RESULT VIEW ───────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Crisis header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="p-6 bg-gradient-to-r from-red-600 to-orange-600 border-none text-white">
          <div className="flex items-center gap-4">
            <motion.div
              className="p-3 bg-white/20 backdrop-blur-sm rounded-xl"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <AlertCircle className="w-8 h-8 text-white" />
            </motion.div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-4 h-4" />
                <span className="text-sm font-medium uppercase tracking-wide">Active Crisis Scenario</span>
              </div>
              <h1 className="text-3xl font-bold mb-1">{aiData?.crisisTitle}</h1>
              <p className="text-white/90 text-sm">Here's what you should do immediately</p>
            </div>
            <div className="text-right">
              <button
                onClick={() => { setView('input'); setAiData(null); setText(''); }}
                className="text-white/70 hover:text-white text-sm underline underline-offset-2 transition-colors"
              >
                ← New crisis
              </button>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Personalization banner */}
      {userCtx && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm">
            <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
            <span className="text-green-700 font-medium">Personalized to your profile</span>
            <span className="text-green-600 ml-auto hidden sm:flex gap-4">
              <span>Savings: <strong>${userCtx.savings.toLocaleString()}</strong></span>
              <span>Expenses: <strong>${userCtx.monthlyExpenses.toLocaleString()}/mo</strong></span>
              <span>Insurance: <strong>{userCtx.hasInsurance ? 'Yes' : 'No'}</strong></span>
            </span>
          </div>
        </motion.div>
      )}

      <ImmediateActions actions={aiData?.immediateActions} />
      <FinancialImpact data={aiData?.financialImpact} savings={userCtx?.savings} />
      <SmartRecommendations recommendations={aiData?.smartRecommendations} />
      <RiskWarning runoutMonths={aiData?.runoutMonths} />
      <SurvivalPlan
        optimizations={aiData?.survivalPlan}
        runoutMonths={aiData?.runoutMonths}
        extendedMonths={aiData?.extendedRunwayMonths}
      />

      {/* Follow-up chat */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MessageCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Ask About Your Plan</h3>
              <p className="text-sm text-gray-500">Get specific answers about your situation</p>
            </div>
          </div>

          {/* Quick question chips */}
          {chatMsgs.length === 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {QUICK_QUESTIONS.map(q => (
                <button
                  key={q}
                  onClick={() => sendChat(q)}
                  disabled={chatStreaming}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 rounded-full text-xs font-medium transition-colors disabled:opacity-40"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Messages */}
          {chatMsgs.length > 0 && (
            <div className="space-y-3 mb-4 max-h-80 overflow-y-auto pr-1">
              {chatMsgs.map((m, i) => {
                const isUser = m.role === 'user';
                const isStreaming = chatStreaming && i === chatMsgs.length - 1 && !isUser;
                return (
                  <div key={i} className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
                    {!isUser && (
                      <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Bot className="w-4 h-4 text-blue-600" />
                      </div>
                    )}
                    <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                      isUser
                        ? 'bg-blue-600 text-white rounded-br-sm'
                        : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                    }`}>
                      {m.content === '' && isStreaming
                        ? <span className="flex gap-1">
                            {[0,1,2].map(i => <span key={i} className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}
                          </span>
                        : m.content}
                      {isStreaming && m.content.length > 0 && (
                        <span className="inline-block w-0.5 h-3.5 bg-gray-400 ml-0.5 align-text-bottom animate-pulse" />
                      )}
                    </div>
                    {isUser && (
                      <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <User className="w-4 h-4 text-gray-600" />
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>
          )}

          {/* Input */}
          <div className="flex gap-2 items-end">
            <textarea
              value={chatInput}
              onChange={e => {
                setChatInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
              }}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); } }}
              placeholder={chatStreaming ? 'AI is responding…' : 'Ask a follow-up question…'}
              disabled={chatStreaming}
              rows={1}
              className="flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 overflow-hidden"
              style={{ minHeight: 44 }}
            />
            <button
              onClick={() => sendChat()}
              disabled={chatStreaming || !chatInput.trim()}
              className="w-11 h-11 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {chatStreaming
                ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                : <Send className="w-4 h-4" />}
            </button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
