import { useState } from 'react';
import { Link } from 'react-router';
import { useAppData } from '../store/AppContext';

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const WORK_LABELS: Record<string, string> = {
  rideshare: 'Rideshare Driver',
  delivery: 'Delivery Worker',
  freelance: 'Freelancer',
  contract: 'Contractor',
};

function fmt(n: number) { return n.toLocaleString(); }
function fmtK(n: number) { return n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${fmt(n)}`; }

// ─── SUB-FACTOR SCORES derived from computeDerived inputs ─────────────────────
function deriveSubScores(data: NonNullable<ReturnType<typeof useAppData>['userData']>) {
  const { derived, income, financials } = data;

  // Income stability: 0-100 (inverted volatility)
  const incomeStability = Math.max(0, Math.round(100 - derived.income_volatility_score * 80));

  // Tax reserve: gig workers should set aside ~25% of avg income per quarter
  // We have no separate tax account so score is always 0 unless savings > 1 month expenses * 1.25
  const estimatedQTax = Math.round(income.avg_monthly_income * 3 * 0.25);
  const taxReserveScore = financials.savings > financials.fixed_expenses * 4 ? 60 : 0;

  // Savings buffer: savings vs 6-month goal
  const sixMonthGoal = financials.fixed_expenses * 6;
  const savingsBuffer = Math.min(100, Math.round((financials.savings / sixMonthGoal) * 100));

  // Coverage gaps: 100 if insured, 25 if not
  const coverageScore = financials.has_insurance ? 75 : 25;

  return { incomeStability, taxReserveScore, savingsBuffer, coverageScore, estimatedQTax };
}

// "Do this now" — dynamically built from real gaps
function buildActions(data: NonNullable<ReturnType<typeof useAppData>['userData']>) {
  const { derived, income, financials, profile } = data;
  const actions: { title: string; body: string; tags: { label: string; color: string }[] }[] = [];

  // 1. Tax reserve — always critical for gig workers
  const qTax = Math.round(income.avg_monthly_income * 3 * 0.25);
  const monthlyTaxSave = Math.round(income.avg_monthly_income * 0.25);
  actions.push({
    title: `Save $${fmt(monthlyTaxSave)}/mo for your quarterly tax bill`,
    body: `As a gig worker you owe ~$${fmt(qTax)} in self-employment tax every quarter. Open a separate "taxes" savings account and auto-transfer $${fmt(monthlyTaxSave)} every month starting now.`,
    tags: [{ label: `$${fmt(qTax)} due quarterly`, color: 'red' }, { label: 'Critical', color: 'amber' }],
  });

  // 2. Health insurance if missing
  if (!financials.has_insurance) {
    actions.push({
      title: 'Get health insurance — marketplace plans start at $0/mo',
      body: `You have no health insurance. One ER visit costs $3,000–$8,000 out of pocket. At your income of $${fmt(income.avg_monthly_income)}/mo you likely qualify for a subsidized ACA plan at healthcare.gov.`,
      tags: [{ label: '~$0–50/mo', color: 'blue' }, { label: '+20 score pts', color: 'blue' }],
    });
  }

  // 3. Platform diversification for drivers
  if (profile.work_type === 'rideshare' || profile.work_type === 'delivery') {
    actions.push({
      title: 'Add a backup income platform — 20 minutes to sign up',
      body: `100% of your income comes from one platform. One deactivation = $0 overnight. Adding a backup platform takes 20 minutes and activates in 1–3 days. Protects your full income from a single point of failure.`,
      tags: [{ label: 'Adds income buffer', color: 'green' }, { label: '+8 score pts', color: 'green' }],
    });
  }

  // 4. Emergency fund if runway < 45 days
  if (derived.cash_runway_days < 45) {
    const needed = financials.fixed_expenses * 3 - financials.savings;
    actions.push({
      title: `Build emergency fund — need $${fmt(Math.max(needed, 0))} more for 3-month buffer`,
      body: `You have ${derived.cash_runway_days} days of runway. Goal is 90 days ($${fmt(financials.fixed_expenses * 3)}). Even adding $200/mo consistently will get you there in ${Math.ceil(needed / 200)} months.`,
      tags: [{ label: `${derived.cash_runway_days}d runway`, color: 'red' }, { label: 'High priority', color: 'amber' }],
    });
  }

  return actions.slice(0, 4); // max 4 actions
}

// ─── TAG BADGE ────────────────────────────────────────────────────────────────
const tagColors: Record<string, string> = {
  red:   'bg-red-100 text-red-700 border border-red-200',
  amber: 'bg-amber-100 text-amber-700 border border-amber-200',
  blue:  'bg-blue-100 text-blue-700 border border-blue-200',
  green: 'bg-green-100 text-green-700 border border-green-200',
};

// ─── SCORE RING ───────────────────────────────────────────────────────────────
function ScoreRing({ score }: { score: number }) {
  const r = 42;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 65 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative flex-shrink-0" style={{ width: 100, height: 100 }}>
      <svg width="100" height="100" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="50" cy="50" r={r} fill="none" stroke="#e2e8f0" strokeWidth="8" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <strong className="text-3xl font-black leading-none" style={{ color }}>{score}</strong>
        <span className="text-[10px] text-slate-400 font-medium">/ 100</span>
      </div>
    </div>
  );
}

// ─── SUB FACTOR BAR ───────────────────────────────────────────────────────────
function SubFactor({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-slate-50 rounded-lg p-2.5">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-[11px] font-semibold text-slate-500">{label}</span>
        <span className="text-[11px] font-bold" style={{ color }}>{value}</span>
      </div>
      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export function Dashboard() {
  const { userData } = useAppData();
  const [checked, setChecked] = useState<number[]>([]);

  if (!userData) return null; // layout redirects to onboarding if not onboarded

  const { income, financials, derived, profile, monthly_spending } = userData;
  const sub = deriveSubScores(userData);
  const actions = buildActions(userData);

  // Survival stats
  const runwayWeeks = Math.round(derived.cash_runway_days / 7);
  const runwayMonths = (derived.cash_runway_days / 30).toFixed(1);
  const worstMonthSurplus = income.low_monthly_income - financials.fixed_expenses;
  const qTax = Math.round(income.avg_monthly_income * 3 * 0.25);

  // Total monthly spend from spending breakdown
  const bd = financials.spending_breakdown;
  const totalMonthlySpend = Object.values(bd).reduce((a, b) => a + b, 0);

  // Verdict
  const verdictConfig = {
    high:   { cls: 'bg-red-50 border border-red-200',    icon: '🚨', titleColor: 'text-red-800',   msgColor: 'text-red-700' },
    medium: { cls: 'bg-amber-50 border border-amber-200', icon: '⚠️', titleColor: 'text-amber-800', msgColor: 'text-amber-700' },
    low:    { cls: 'bg-green-50 border border-green-200', icon: '✅', titleColor: 'text-green-800', msgColor: 'text-green-700' },
  }[derived.risk_level];

  const verdictTitle = {
    high:   "You're heading toward a crisis — but you still have time",
    medium: "You're managing, but one bad month could hurt",
    low:    "You're in a solid position — keep building your buffer",
  }[derived.risk_level];

  const verdictMsg = {
    high:   `Your income swings ${Math.round(derived.income_volatility_score * 100)}% and you have only ${runwayWeeks} week${runwayWeeks !== 1 ? 's' : ''} of savings. ${!financials.has_insurance ? 'No insurance means one emergency could wipe everything. ' : ''}Start with the actions below.`,
    medium: `Income volatility is ${Math.round(derived.income_volatility_score * 100)}% and your buffer covers ${runwayWeeks} weeks. Build toward 90 days of runway to absorb a slow stretch.`,
    low:    `You have ${runwayWeeks} weeks of runway and manageable volatility. Keep saving and make sure your insurance coverage is complete.`,
  }[derived.risk_level];

  // Source label for AI findings
  const statementLabel = monthly_spending.length > 0
    ? `Based on ${monthly_spending.length} months of statements · ${monthly_spending[monthly_spending.length - 1]?.month ?? ''} to ${monthly_spending[0]?.month ?? ''}`
    : 'Based on your financial profile';

  return (
    <div className="p-7 space-y-5 max-w-6xl">

      {/* ── AI Findings Banner ── */}
      <div className="rounded-2xl p-6 text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg,#2d3dbd 0%,#1a237e 100%)' }}>
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/5 -translate-y-8 translate-x-8" />
        <div className="absolute bottom-0 right-24 w-20 h-20 rounded-full bg-white/3 translate-y-6" />
        <div className="flex items-center gap-2 mb-1 text-white/60 text-xs font-bold uppercase tracking-wider relative">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          AI Analysis · from your bank statements
        </div>
        <h2 className="text-xl font-bold mb-1 relative">Here's what we found in your statements</h2>
        <p className="text-sm text-white/60 mb-5 relative">{statementLabel}</p>
        <div className="grid grid-cols-5 gap-3 relative">
          {[
            { label: 'Avg monthly income', val: `$${fmt(income.avg_monthly_income)}`,                                                        sub: '12-month average' },
            { label: 'Avg monthly spend',  val: `$${fmt(totalMonthlySpend > 0 ? totalMonthlySpend : financials.fixed_expenses)}`,             sub: 'All categories' },
            { label: 'Savings balance',    val: `$${fmt(financials.savings)}`,                                                                sub: 'From savings statement' },
            { label: 'Debt payments',      val: `$${fmt(financials.debt_payments)}/mo`,                                                       sub: 'Credit & loans', warn: financials.debt_payments > income.avg_monthly_income * 0.2 },
            { label: 'Insurance',          val: financials.has_insurance ? '✓ Covered' : '✗ None',                                           sub: financials.has_insurance ? 'Detected in statements' : 'Not found — high risk', warn: !financials.has_insurance },
          ].map(s => (
            <div key={s.label} className="bg-white/10 rounded-xl p-3">
              <div className="text-[10px] text-white/60 font-semibold uppercase tracking-wide mb-1">{s.label}</div>
              <div className="text-lg font-black" style={{ color: s.warn ? '#fca5a5' : '#fff' }}>{s.val}</div>
              <div className="text-[10px] text-white/50 mt-0.5">{s.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Score Card ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center gap-6">
        <ScoreRing score={derived.financial_health_score} />
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-slate-900 mb-1">
            Financial survival score: {derived.financial_health_score} —{' '}
            {derived.financial_health_score >= 65 ? 'Stable' : derived.financial_health_score >= 40 ? 'Needs work' : 'Critical'}
          </h3>
          <p className="text-sm text-slate-500 mb-3 leading-relaxed">
            {derived.financial_health_score >= 65
              ? 'You have a solid base. Keep building your runway and close any coverage gaps.'
              : derived.financial_health_score >= 40
              ? 'You\'re one slow month away from real trouble. Three specific fixes will raise this score significantly.'
              : 'Your situation is critical. Immediate action on the items below is essential.'}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <SubFactor label="Income stability"
              value={sub.incomeStability}
              color={sub.incomeStability >= 60 ? '#22c55e' : sub.incomeStability >= 35 ? '#f59e0b' : '#ef4444'} />
            <SubFactor label="Tax reserve"
              value={sub.taxReserveScore}
              color={sub.taxReserveScore >= 50 ? '#22c55e' : '#ef4444'} />
            <SubFactor label="Savings buffer"
              value={sub.savingsBuffer}
              color={sub.savingsBuffer >= 60 ? '#22c55e' : sub.savingsBuffer >= 30 ? '#f59e0b' : '#ef4444'} />
            <SubFactor label="Coverage gaps"
              value={sub.coverageScore}
              color={sub.coverageScore >= 60 ? '#22c55e' : sub.coverageScore >= 40 ? '#f59e0b' : '#ef4444'} />
          </div>
        </div>
      </div>

      {/* ── Plain-English Survival Stats ── */}
      <div className="grid grid-cols-3 gap-4">
        {/* Runway */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">If you stopped working today</div>
          <div className="text-3xl font-black mb-1" style={{ color: derived.cash_runway_days < 30 ? '#ef4444' : derived.cash_runway_days < 60 ? '#f59e0b' : '#22c55e', letterSpacing: '-1px' }}>
            {runwayWeeks < 1 ? `${derived.cash_runway_days}d` : runwayWeeks < 8 ? `${runwayWeeks} weeks` : `${runwayMonths} months`}
          </div>
          <div className="text-xs text-slate-500 leading-relaxed">
            Your <strong className="text-slate-700">${fmt(financials.savings)} in savings</strong> would last {runwayWeeks} week{runwayWeeks !== 1 ? 's' : ''} at your spending level. Goal is 6 months.
          </div>
        </div>

        {/* Worst month */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">On your worst month</div>
          <div className="text-3xl font-black mb-1" style={{ color: worstMonthSurplus < 0 ? '#ef4444' : '#f59e0b', letterSpacing: '-1px' }}>
            {worstMonthSurplus < 0
              ? `-$${fmt(Math.abs(worstMonthSurplus))}`
              : `+$${fmt(worstMonthSurplus)}`}
          </div>
          <div className="text-xs text-slate-500 leading-relaxed">
            Your lowest month was <strong className="text-slate-700">${fmt(income.low_monthly_income)}</strong>.{' '}
            {worstMonthSurplus < 0
              ? `After expenses you run a $${fmt(Math.abs(worstMonthSurplus))} deficit — savings drain fast.`
              : `After expenses you have $${fmt(worstMonthSurplus)} left — a thin cushion.`}
          </div>
        </div>

        {/* Tax bill */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Quarterly tax estimate</div>
          <div className="text-3xl font-black text-red-500 mb-1" style={{ letterSpacing: '-1px' }}>
            ${fmt(qTax)}
          </div>
          <div className="text-xs text-slate-500 leading-relaxed">
            Self-employment tax is ~25% of quarterly income. At your average of <strong className="text-slate-700">${fmt(income.avg_monthly_income)}/mo</strong>, you owe ~${fmt(qTax)} every quarter.
          </div>
        </div>
      </div>

      {/* ── Verdict Banner ── */}
      <div className={`rounded-2xl p-5 flex items-start gap-4 ${verdictConfig.cls}`}>
        <div className="text-3xl flex-shrink-0">{verdictConfig.icon}</div>
        <div className="flex-1 min-w-0">
          <h3 className={`text-base font-bold mb-1 ${verdictConfig.titleColor}`}>{verdictTitle}</h3>
          <p className={`text-sm leading-relaxed ${verdictConfig.msgColor}`}>{verdictMsg}</p>
        </div>
        {derived.risk_level !== 'low' && (
          <Link
            to="/crisis"
            className="flex-shrink-0 flex items-center gap-1.5 text-sm font-bold text-white px-4 py-2 rounded-xl transition-colors"
            style={{ background: '#2d3dbd' }}
          >
            Crisis Advisor
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
        )}
      </div>

      {/* ── Do This Now ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-base font-black text-slate-900">Do this now</span>
          <span className="text-xs font-bold bg-red-100 text-red-700 border border-red-200 px-2.5 py-1 rounded-full">
            {actions.length} critical
          </span>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {actions.map((action, i) => {
            const done = checked.includes(i);
            return (
              <div
                key={i}
                className={`flex items-start gap-4 px-5 py-4 border-b border-slate-100 last:border-b-0 transition-colors ${done ? 'bg-slate-50' : 'hover:bg-slate-50/50'}`}
              >
                {/* Number */}
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5 text-white"
                  style={{ background: done ? '#22c55e' : '#2d3dbd' }}>
                  {done ? '✓' : i + 1}
                </div>

                {/* Body */}
                <div className="flex-1 min-w-0">
                  <h4 className={`text-sm font-bold mb-1 ${done ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                    {action.title}
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed mb-2">{action.body}</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {action.tags.map(tag => (
                      <span key={tag.label} className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${tagColors[tag.color]}`}>
                        {tag.label}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Checkbox */}
                <button
                  onClick={() => setChecked(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i])}
                  className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 border-2 transition-all ${
                    done ? 'border-green-500 bg-green-500 text-white text-[10px]' : 'border-slate-300 hover:border-slate-400'
                  }`}
                >
                  {done && '✓'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
