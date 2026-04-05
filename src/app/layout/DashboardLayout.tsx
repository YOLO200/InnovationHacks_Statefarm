import { useEffect, useState, useRef, useCallback } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import { useAppData } from '../store/AppContext';
import { streamCrisisChat } from '../../lib/gemini';

// ─── NAV ITEMS ────────────────────────────────────────────────────────────────
const NAV_MAIN = [
  {
    path: '/',
    label: 'Dashboard',
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-4 h-4">
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
  },
  {
    path: '/prepare',
    label: 'Prepare',
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-4 h-4">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/>
      </svg>
    ),
  },
  {
    path: '/crisis',
    label: 'Crisis Advisor',
    dot: true,
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-4 h-4">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    ),
  },
  {
    path: '/spending',
    label: 'Spending',
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-4 h-4">
        <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
      </svg>
    ),
  },
];

const NAV_TOOLS = [
  {
    path: '/claim-guard',
    label: 'Claim Guard',
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-4 h-4">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
  },
];

const NAV_ACCOUNT = [
  {
    path: '/settings',
    label: 'Settings',
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-4 h-4">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    ),
  },
];

// ─── AI COACH OVERLAY ─────────────────────────────────────────────────────────
type ChatMsg = { role: 'user' | 'assistant'; content: string };

const INIT_MSG: ChatMsg = {
  role: 'assistant',
  content: "Hi! I'm your AI financial coach.\n\nI'm here to help you build a stronger financial future — no judgment, just real advice tailored to your situation.\n\nWhat's on your mind today?",
};

const QUICK_PROMPTS = [
  'How do I start saving for taxes?',
  'What is coinsurance?',
  'How do I appeal an insurance denial?',
  'What programs can I get with ITIN?',
  'How do I build an emergency fund?',
];

function AICoachOverlay({ open, onClose, userData }: {
  open: boolean;
  onClose: () => void;
  userData: ReturnType<typeof useAppData>['userData'];
}) {
  const [msgs, setMsgs] = useState<ChatMsg[]>([INIT_MSG]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const historyRef = useRef<{ role: string; content: string }[]>([]);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs]);

  const send = useCallback(async (overrideText?: string) => {
    const txt = (overrideText ?? input).trim();
    if (!txt || streaming) return;
    setInput('');

    historyRef.current = [...historyRef.current, { role: 'user', content: txt }];
    setMsgs(prev => [...prev, { role: 'user', content: txt }, { role: 'assistant', content: '' }]);
    setStreaming(true);

    const userCtx = userData ? {
      savings: userData.financials.savings,
      monthlyExpenses: userData.financials.fixed_expenses,
      hasInsurance: userData.financials.has_insurance,
    } : null;

    let streamed = '';
    await streamCrisisChat(
      txt,
      'General Financial Coaching',
      userCtx,
      historyRef.current.slice(0, -1),
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
  }, [input, streaming, userData]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Modal */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85%] max-w-2xl h-[82vh] bg-white rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg,#2d3dbd,#1a237e)' }} className="px-5 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-lg">💬</div>
            <div>
              <div className="text-sm font-bold text-white">AI Financial Coach</div>
              <div className="flex items-center gap-1.5 text-xs text-white/60">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                Live · Ready to help
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/15 text-white flex items-center justify-center text-lg hover:bg-white/25 transition-colors"
          >
            ×
          </button>
        </div>

        {/* Quick prompts */}
        <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex gap-2 overflow-x-auto scrollbar-hide flex-shrink-0">
          <span className="text-xs text-slate-400 whitespace-nowrap self-center">Ask:</span>
          {QUICK_PROMPTS.map(p => (
            <button
              key={p}
              onClick={() => send(p)}
              disabled={streaming}
              className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full border border-slate-200 bg-white text-slate-700 hover:border-blue-400 hover:text-blue-700 transition-colors whitespace-nowrap disabled:opacity-40"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {msgs.map((m, i) => {
            const isUser = m.role === 'user';
            const isStreaming = streaming && i === msgs.length - 1 && !isUser;
            return (
              <div key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  isUser
                    ? 'text-white rounded-br-sm'
                    : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                }`} style={isUser ? { background: '#2d3dbd' } : {}}>
                  {m.content === '' && isStreaming
                    ? <span className="flex gap-1 py-0.5">{[0,1,2].map(j => <span key={j} className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: `${j*0.15}s` }} />)}</span>
                    : m.content}
                  {isStreaming && m.content.length > 0 && (
                    <span className="inline-block w-0.5 h-3.5 bg-slate-400 ml-0.5 align-text-bottom animate-pulse" />
                  )}
                </div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-slate-200 flex gap-2 items-end flex-shrink-0 bg-white">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => { setInput(e.target.value); e.target.style.height = '44px'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'; }}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder={streaming ? 'AI is responding…' : 'Ask your coach…'}
            disabled={streaming}
            rows={1}
            className="flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 overflow-hidden"
            style={{ minHeight: 44 }}
          />
          <button
            onClick={() => send()}
            disabled={streaming || !input.trim()}
            className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            style={{ background: '#2d3dbd' }}
          >
            {streaming
              ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              : <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── SIDEBAR NAV LINK ─────────────────────────────────────────────────────────
function NavLink({ item, active }: { item: typeof NAV_MAIN[0] & { dot?: boolean }; active: boolean }) {
  return (
    <Link
      to={item.path}
      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all relative ${
        active
          ? 'bg-white/18 text-white'
          : 'text-white/55 hover:bg-white/10 hover:text-white/85'
      }`}
    >
      {item.icon}
      <span>{item.label}</span>
      {'dot' in item && item.dot && !active && (
        <span className="absolute right-2 w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
      )}
    </Link>
  );
}

// ─── MAIN LAYOUT ──────────────────────────────────────────────────────────────
export function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isOnboarded, resetData, userData } = useAppData();
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    if (!isOnboarded) navigate('/onboarding', { replace: true });
  }, [isOnboarded, navigate]);

  if (!isOnboarded) return null;

  const initials = userData
    ? (userData as any).profile?.name
      ? (userData as any).profile.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
      : 'GW'
    : 'GW';

  const workLabel: Record<string, string> = {
    rideshare: 'Rideshare Driver',
    delivery: 'Delivery Worker',
    freelance: 'Freelancer',
    contract: 'Contractor',
  };

  return (
    <div className="flex min-h-screen" style={{ background: '#f4f6fb' }}>
      {/* ── Sidebar ── */}
      <aside
        className="w-60 flex-shrink-0 flex flex-col sticky top-0 h-screen overflow-y-auto"
        style={{ background: 'linear-gradient(160deg,#2d3dbd 0%,#1a237e 100%)' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 pt-5 pb-2">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">C</div>
          <span className="text-lg font-bold text-white">Crunch</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest px-3 pb-1 pt-2">Main</div>
          {NAV_MAIN.map(item => (
            <NavLink key={item.path} item={item} active={location.pathname === item.path} />
          ))}

          <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest px-3 pb-1 pt-4">Tools</div>
          {NAV_TOOLS.map(item => (
            <NavLink key={item.path} item={item} active={location.pathname === item.path} />
          ))}

          <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest px-3 pb-1 pt-4">Account</div>
          {NAV_ACCOUNT.map(item => (
            <NavLink key={item.path} item={item} active={location.pathname === item.path} />
          ))}
        </nav>

        {/* User + Reset */}
        <div className="px-3 pb-4 border-t border-white/10 pt-3 space-y-2">
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/10 cursor-pointer transition-colors">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-white truncate">
                {(userData as any)?.profile?.name ?? 'Gig Worker'}
              </div>
              <div className="text-[10px] text-white/50 truncate">
                {userData ? workLabel[userData.profile.work_type] : ''}
              </div>
            </div>
          </div>
          <button
            onClick={() => { resetData(); navigate('/onboarding', { replace: true }); }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-white/50 hover:text-white/80 hover:bg-white/10 transition-colors border border-white/15"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Reset Profile
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        <Outlet />
      </main>

      {/* ── AI Coach floating button ── */}
      <button
        onClick={() => setChatOpen(true)}
        className="fixed bottom-6 right-6 w-13 h-13 rounded-full shadow-lg flex items-center justify-center text-xl transition-transform hover:scale-110 z-40"
        style={{ background: 'linear-gradient(135deg,#2d3dbd,#1a237e)', width: 52, height: 52 }}
        title="Ask your AI coach"
      >
        💬
      </button>

      {/* ── AI Coach overlay ── */}
      <AICoachOverlay open={chatOpen} onClose={() => setChatOpen(false)} userData={userData} />
    </div>
  );
}
