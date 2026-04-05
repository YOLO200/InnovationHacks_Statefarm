import { useState } from 'react';
import { Link } from 'react-router';
import { useAppData } from '../store/AppContext';

function fmt(n: number) { return n.toLocaleString(); }

// ─── PREP SCORE ───────────────────────────────────────────────────────────────
function calcPrepScore(data: NonNullable<ReturnType<typeof useAppData>['userData']>) {
  const { financials, income, profile, derived } = data;

  // Savings buffer: 0–30 pts → goal is 3-month runway
  const threeMonthGoal = financials.fixed_expenses * 3;
  const savingsScore = Math.min(30, Math.round((financials.savings / (threeMonthGoal || 1)) * 30));

  // Tax reserve: 0–20 pts → goal is having 1 quarter of taxes saved
  const quarterlyTax = income.avg_monthly_income * 3 * 0.25;
  const taxScore = Math.min(20, Math.round((financials.savings / (quarterlyTax || 1)) * 20));

  // Platform diversification: 0–20 pts → drivers have single-platform risk
  const isDriver = profile.work_type === 'rideshare' || profile.work_type === 'delivery';
  const platformScore = isDriver ? 0 : 15;

  // Insurance: 0–20 pts
  const insuranceScore = financials.has_insurance ? 20 : 0;

  // Crisis cut capacity: 0–10 pts → non-essential spending relative to total
  const bd = financials.spending_breakdown;
  const total = Object.values(bd).reduce((a, b) => a + b, 0);
  const nonEssential = (bd.other ?? 0) + Math.round((bd.food ?? 0) * 0.4);
  const cutScore = total > 0 ? Math.min(10, Math.round((nonEssential / total) * 18)) : 5;

  const prepScore = Math.min(100, savingsScore + taxScore + platformScore + insuranceScore + cutScore);

  return {
    prepScore,
    savingsScore, savingsMax: 30,
    taxScore, taxMax: 20,
    platformScore, platformMax: 20,
    insuranceScore, insuranceMax: 20,
    cutScore, cutMax: 10,
    quarterlyTax: Math.round(quarterlyTax),
    threeMonthGoal: Math.round(threeMonthGoal),
    isDriver,
    derived,
  };
}

// ─── THIS WEEK'S TASKS ────────────────────────────────────────────────────────
function buildTasks(data: NonNullable<ReturnType<typeof useAppData>['userData']>) {
  const { financials, income, profile, derived } = data;
  const tasks: {
    title: string; time: string; impact: string; impactColor: 'red' | 'amber' | 'blue'; description: string;
  }[] = [];

  const monthlyTax = Math.round(income.avg_monthly_income * 0.25);
  tasks.push({
    title: `Set up $${fmt(monthlyTax)}/mo automatic tax transfer`,
    time: '10 min',
    impact: 'Critical',
    impactColor: 'red',
    description: `Open a savings account labeled "Taxes" and auto-transfer $${fmt(monthlyTax)} each month. You owe ~$${fmt(monthlyTax * 3)} every quarter.`,
  });

  if (!financials.has_insurance) {
    tasks.push({
      title: 'Apply for ACA marketplace health insurance',
      time: '30 min',
      impact: 'Critical',
      impactColor: 'red',
      description: `At your income of $${fmt(income.avg_monthly_income)}/mo you likely qualify for a subsidized plan at healthcare.gov — some plans start at $0/mo.`,
    });
  }

  if (derived.cash_runway_days < 60) {
    const needed = financials.fixed_expenses * 3 - financials.savings;
    tasks.push({
      title: 'Open a dedicated emergency fund account',
      time: '20 min',
      impact: 'High',
      impactColor: 'amber',
      description: `You have ${Math.round(derived.cash_runway_days)} days of runway. You need $${fmt(Math.max(0, Math.round(needed)))} more to reach 3 months. Open a high-yield savings account and set an auto-deposit.`,
    });
  }

  if (profile.work_type === 'rideshare' || profile.work_type === 'delivery') {
    const backup = profile.work_type === 'rideshare' ? 'DoorDash or Instacart' : 'Uber or Lyft';
    tasks.push({
      title: `Sign up for ${backup} as a backup platform`,
      time: '20 min',
      impact: 'High',
      impactColor: 'amber',
      description: `100% of your income is from one platform. One deactivation = $0 overnight. ${backup} activates in 1–3 days and requires no upfront cost.`,
    });
  } else {
    tasks.push({
      title: 'Add your profile to one more freelance platform',
      time: '30 min',
      impact: 'Medium',
      impactColor: 'amber',
      description: `Reduce single-client dependency by listing on Upwork, Toptal, or LinkedIn. Diversified pipelines cut income gaps by up to 60%.`,
    });
  }

  if (financials.debt_payments > income.avg_monthly_income * 0.2) {
    tasks.push({
      title: 'Review debt consolidation options',
      time: '15 min',
      impact: 'Medium',
      impactColor: 'blue',
      description: `Debt payments at $${fmt(financials.debt_payments)}/mo are ${Math.round((financials.debt_payments / income.avg_monthly_income) * 100)}% of your avg income — above the 20% safe threshold. Compare consolidation rates.`,
    });
  }

  return tasks.slice(0, 4);
}

// ─── SPENDING CUTS ────────────────────────────────────────────────────────────
function buildSpendingCuts(data: NonNullable<ReturnType<typeof useAppData>['userData']>) {
  const { financials, income } = data;
  const bd = financials.spending_breakdown;
  const cuts: { category: string; current: number; target: number; saving: number; tip: string }[] = [];

  if (bd.food > income.avg_monthly_income * 0.12) {
    const target = Math.round(income.avg_monthly_income * 0.1);
    cuts.push({ category: 'Food & dining', current: bd.food, target, saving: bd.food - target, tip: 'Meal prep 3 days a week saves ~40% on food.' });
  }
  if (bd.gas > income.avg_monthly_income * 0.12) {
    const target = Math.round(income.avg_monthly_income * 0.1);
    cuts.push({ category: 'Gas', current: bd.gas, target, saving: bd.gas - target, tip: 'GasBuddy app saves avg $30–60/mo. Consolidate trips.' });
  }
  if (bd.other > income.avg_monthly_income * 0.08) {
    const target = Math.round(income.avg_monthly_income * 0.06);
    cuts.push({ category: 'Other / subscriptions', current: bd.other, target, saving: bd.other - target, tip: 'Audit subscriptions and pause anything non-essential.' });
  }
  if (bd.maintenance > income.avg_monthly_income * 0.06) {
    const target = Math.round(income.avg_monthly_income * 0.04);
    cuts.push({ category: 'Maintenance', current: bd.maintenance, target, saving: bd.maintenance - target, tip: 'DIY oil changes and tire rotations save $200+/yr.' });
  }

  if (cuts.length === 0) {
    cuts.push({ category: 'Spending looks lean', current: 0, target: 0, saving: 0, tip: 'Your categories are within healthy ranges. Keep tracking monthly.' });
  }

  return cuts;
}

// ─── COVERAGE GAPS ────────────────────────────────────────────────────────────
function buildCoverageGaps(data: NonNullable<ReturnType<typeof useAppData>['userData']>) {
  const { financials, profile } = data;
  const isDriver = profile.work_type === 'rideshare' || profile.work_type === 'delivery';

  return [
    {
      name: 'Health insurance',
      covered: financials.has_insurance,
      risk: 'One ER visit can cost $3,000–$8,000 uninsured.',
      fix: 'healthcare.gov → subsidized ACA plan',
      urgency: 'critical' as const,
    },
    {
      name: isDriver ? 'Rideshare auto coverage' : 'Disability insurance',
      covered: false,
      risk: isDriver
        ? "Personal auto insurance doesn't cover rideshare trips. A gap period exists between app-on and passenger-in."
        : 'No income if you can\'t work due to illness or injury. Gig workers have no employer disability coverage.',
      fix: isDriver ? 'Ask your insurer for a rideshare endorsement (~$15/mo)' : 'Short-term disability plans start at $20/mo',
      urgency: 'high' as const,
    },
    {
      name: 'Emergency dental',
      covered: false,
      risk: 'Dental emergencies avg $500–$3,000. Often excluded from ACA basic plans.',
      fix: 'Standalone dental plans from $15/mo',
      urgency: 'medium' as const,
    },
  ];
}

// ─── PLATFORM TIPS ────────────────────────────────────────────────────────────
function buildPlatformTips(data: NonNullable<ReturnType<typeof useAppData>['userData']>) {
  const { profile, income } = data;

  const tipsByType: Record<string, { title: string; body: string }[]> = {
    rideshare: [
      { title: 'Chase airport queues and surge zones', body: 'Surge pricing during airport peaks, concerts, and bad weather can 2-3x your hourly rate. Use heat maps in both Uber and Lyft.' },
      { title: 'Track every mile from app-on', body: "IRS allows $0.67/mile deduction for 2024. At 1,000 miles/mo that's $8,040/yr off your tax bill." },
      { title: 'Reserve 8% of gross for vehicle maintenance', body: `At your avg income, that's $${fmt(Math.round(income.avg_monthly_income * 0.08))}/mo into a dedicated car fund. Prevents one repair from wiping your savings.` },
    ],
    delivery: [
      { title: 'Stack apps during overlapping surges', body: 'Use 2–3 apps simultaneously (DoorDash, UberEats, Instacart). Multi-apping in the same zone can lift hourly earnings 30–50%.' },
      { title: 'Log every delivery mile', body: 'Delivery mileage is fully deductible. Use Stride or Everlance to log automatically. Saves hundreds at tax time.' },
      { title: 'Focus on high-tip restaurant zones', body: 'Analyze your acceptance data to find which restaurants and neighborhoods generate 20%+ tips consistently.' },
    ],
    freelance: [
      { title: 'Require 50% upfront on all projects', body: 'This eliminates non-paying clients and funds your work time. Standard in professional freelancing — clients who refuse are a red flag.' },
      { title: 'Move 3 clients to retainer agreements', body: 'Monthly retainers turn volatile project income into predictable recurring revenue — even $500/mo from 3 clients adds $1,500 in guaranteed baseline.' },
      { title: 'Raise rates for new clients annually', body: '3–5% annual rate increases are normal and expected. Your existing clients are unlikely to leave over a modest increase.' },
    ],
    contract: [
      { title: 'Build a 2-contract overlap buffer', body: 'Always begin a new contract search 60 days before your current contract ends. Gaps cost more than rate negotiations.' },
      { title: 'Invoice NET-15 not NET-30', body: 'Shorter payment terms improve your cash flow dramatically. Most clients will agree if you just ask.' },
      { title: 'Keep a warm pipeline of 3 leads', body: "Treat client acquisition as ongoing, not reactive. Reduces the desperate-rate discounting that happens when you're between contracts." },
    ],
  };

  return tipsByType[profile.work_type] ?? tipsByType.freelance;
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
type BadgeStatus = 'ok' | 'warn' | 'bad';

function getBadge(score: number, max: number): BadgeStatus {
  const ratio = score / max;
  if (ratio >= 0.75) return 'ok';
  if (ratio >= 0.40) return 'warn';
  return 'bad';
}

const BADGE_STYLES: Record<BadgeStatus, string> = {
  ok:   'bg-green-100 text-green-700 border border-green-200',
  warn: 'bg-amber-100 text-amber-700 border border-amber-200',
  bad:  'bg-red-100 text-red-700 border border-red-200',
};
const BADGE_LABELS: Record<BadgeStatus, string> = {
  ok:   'On track',
  warn: 'Needs work',
  bad:  'At risk',
};
const BAR_COLORS: Record<BadgeStatus, string> = {
  ok:   '#22c55e',
  warn: '#f59e0b',
  bad:  '#ef4444',
};

// ─── FACTOR ROW ──────────────────────────────────────────────────────────────
function FactorRow({
  icon, name, desc, score, max,
}: { icon: string; name: string; desc: string; score: number; max: number }) {
  const status = getBadge(score, max);
  const pct = Math.round((score / max) * 100);
  return (
    <div className="flex items-center gap-3 py-3 border-b border-slate-100 last:border-b-0">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0 bg-slate-50 border border-slate-100">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-xs font-bold text-slate-900">{name}</span>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs font-black text-slate-700">{score}<span className="text-slate-400 font-normal">/{max}</span></span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${BADGE_STYLES[status]}`}>
              {BADGE_LABELS[status]}
            </span>
          </div>
        </div>
        <p className="text-[11px] text-slate-400 mb-1.5 leading-snug">{desc}</p>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, backgroundColor: BAR_COLORS[status] }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export function Prepare() {
  const { userData } = useAppData();
  const [checked, setChecked] = useState<number[]>([]);

  if (!userData) return null;

  const { income, financials, profile } = userData;
  const prep = calcPrepScore(userData);
  const tasks = buildTasks(userData);
  const cuts = buildSpendingCuts(userData);
  const gaps = buildCoverageGaps(userData);
  const tips = buildPlatformTips(userData);

  const prepLabel = prep.prepScore >= 65 ? 'Well Prepared' : prep.prepScore >= 40 ? 'Needs Work' : 'At Risk';
  const prepScoreColor = prep.prepScore >= 65 ? '#86efac' : prep.prepScore >= 40 ? '#fcd34d' : '#fca5a5';

  // Biggest risk = factor with worst score/max ratio
  const factors = [
    { name: 'Savings buffer', score: prep.savingsScore, max: prep.savingsMax },
    { name: 'Tax reserve', score: prep.taxScore, max: prep.taxMax },
    { name: 'Platform diversity', score: prep.platformScore, max: prep.platformMax },
    { name: 'Insurance', score: prep.insuranceScore, max: prep.insuranceMax },
    { name: 'Crisis cuts', score: prep.cutScore, max: prep.cutMax },
  ];
  const biggestRisk = factors.reduce((worst, f) =>
    (f.score / f.max) < (worst.score / worst.max) ? f : worst
  );

  const runwayMonths = (userData.derived.cash_runway_days / 30).toFixed(1);
  const remaining = tasks.length - checked.length;

  const urgencyColors: Record<string, string> = {
    critical: 'border-l-4 border-red-400 bg-red-50',
    high:     'border-l-4 border-amber-400 bg-amber-50',
    medium:   'border-l-4 border-blue-400 bg-blue-50',
  };
  const urgencyBadge: Record<string, string> = {
    critical: 'bg-red-100 text-red-700',
    high:     'bg-amber-100 text-amber-700',
    medium:   'bg-blue-100 text-blue-700',
  };
  const urgencyLabel: Record<string, string> = {
    critical: 'Critical',
    high:     'High',
    medium:   'Medium',
  };

  return (
    <div className="p-7 space-y-5 max-w-6xl">

      {/* ── Hero Banner ── */}
      <div className="rounded-2xl p-6 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#059669 0%,#065f46 100%)' }}>
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/5 -translate-y-14 translate-x-14" />
        <div className="absolute bottom-0 right-40 w-28 h-28 rounded-full bg-white/5 translate-y-10" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-1 text-white/60 text-xs font-bold uppercase tracking-wider">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
            Crisis Prevention Plan
          </div>
          <h2 className="text-xl font-bold mb-1">Your preparedness snapshot</h2>
          <p className="text-sm text-white/60 mb-5">
            {profile.work_type === 'rideshare' ? 'Rideshare driver'
              : profile.work_type === 'delivery' ? 'Delivery worker'
              : profile.work_type === 'freelance' ? 'Freelancer'
              : 'Contractor'} — calculated from your financial profile
          </p>

          <div className="grid grid-cols-4 gap-3">
            <div className="bg-white/10 rounded-xl p-4">
              <div className="text-[10px] text-white/60 font-semibold uppercase tracking-wide mb-1">Prep score</div>
              <div className="text-3xl font-black" style={{ color: prepScoreColor }}>{prep.prepScore}</div>
              <div className="text-[10px] text-white/60 mt-1">{prepLabel}</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <div className="text-[10px] text-white/60 font-semibold uppercase tracking-wide mb-1">Cash runway</div>
              <div className="text-3xl font-black text-white">{runwayMonths}<span className="text-base font-semibold text-white/70">mo</span></div>
              <div className="text-[10px] text-white/60 mt-1">goal: 3.0 months</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <div className="text-[10px] text-white/60 font-semibold uppercase tracking-wide mb-1">Biggest risk</div>
              <div className="text-sm font-black text-white leading-tight mt-1">{biggestRisk.name}</div>
              <div className="text-[10px] text-white/60 mt-1">{biggestRisk.score}/{biggestRisk.max} pts</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <div className="text-[10px] text-white/60 font-semibold uppercase tracking-wide mb-1">Tasks pending</div>
              <div className="text-3xl font-black" style={{ color: remaining > 0 ? '#fcd34d' : '#86efac' }}>{remaining}</div>
              <div className="text-[10px] text-white/60 mt-1">of {tasks.length} this week</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2-Col: Score Card + Tasks ── */}
      <div className="grid grid-cols-2 gap-5">

        {/* ── Left: Prep Score Card ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Score header */}
          <div className="px-6 pt-6 pb-4 border-b border-slate-100">
            <div className="flex items-end gap-4">
              <div>
                <div className="text-5xl font-black"
                  style={{ color: prep.prepScore >= 65 ? '#059669' : prep.prepScore >= 40 ? '#d97706' : '#dc2626' }}>
                  {prep.prepScore}
                </div>
                <div className="text-xs font-bold text-slate-500 mt-0.5">out of 100</div>
              </div>
              <div className="mb-1">
                <span className={`text-sm font-bold px-3 py-1.5 rounded-full ${
                  prep.prepScore >= 65 ? 'bg-green-100 text-green-700' :
                  prep.prepScore >= 40 ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {prepLabel}
                </span>
                <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                  {prep.prepScore < 40
                    ? 'Critical gaps need attention before a crisis hits.'
                    : prep.prepScore < 65
                    ? 'You have a foundation — close remaining gaps to be ready.'
                    : 'Strong position. Review quarterly to stay prepared.'}
                </p>
              </div>
            </div>
          </div>

          {/* Factor rows */}
          <div className="px-6 py-2">
            <FactorRow
              icon="💰"
              name="Savings buffer"
              desc={`$${fmt(financials.savings)} saved · goal $${fmt(prep.threeMonthGoal)} (3 months)`}
              score={prep.savingsScore}
              max={prep.savingsMax}
            />
            <FactorRow
              icon="🧾"
              name="Tax reserve"
              desc={`~$${fmt(prep.quarterlyTax)} due quarterly · savings used as proxy`}
              score={prep.taxScore}
              max={prep.taxMax}
            />
            <FactorRow
              icon="🔀"
              name="Platform diversity"
              desc={prep.isDriver ? 'Single platform — one deactivation = $0' : 'Multiple clients reduce income gap risk'}
              score={prep.platformScore}
              max={prep.platformMax}
            />
            <FactorRow
              icon="🛡️"
              name="Insurance coverage"
              desc={financials.has_insurance ? 'Health insurance on file' : 'No insurance — one ER visit = $3–8k'}
              score={prep.insuranceScore}
              max={prep.insuranceMax}
            />
            <FactorRow
              icon="✂️"
              name="Crisis cut capacity"
              desc="Non-essential spending you can pause in an emergency"
              score={prep.cutScore}
              max={prep.cutMax}
            />
          </div>

          <div className="px-6 pb-5 pt-3">
            <Link to="/crisis"
              className="w-full block text-center text-sm font-bold px-4 py-2.5 rounded-xl text-white transition-opacity hover:opacity-90"
              style={{ background: '#2d3dbd' }}>
              Simulate a crisis →
            </Link>
          </div>
        </div>

        {/* ── Right: This Week's Tasks ── */}
        <div className="flex flex-col gap-3">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-1">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <span className="text-sm font-black text-slate-900">Do this week</span>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-green-100 text-green-700 border border-green-200">
                {remaining} remaining
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {tasks.map((task, i) => {
                const done = checked.includes(i);
                const impactBg: Record<string, string> = {
                  red:   'bg-red-100 text-red-700',
                  amber: 'bg-amber-100 text-amber-700',
                  blue:  'bg-blue-100 text-blue-700',
                };
                return (
                  <div key={i}
                    className={`flex items-start gap-3 px-5 py-4 transition-colors ${done ? 'bg-slate-50' : 'hover:bg-slate-50/60'}`}>
                    {/* Numbered circle */}
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5 text-white"
                      style={{ background: done ? '#22c55e' : '#059669' }}>
                      {done ? '✓' : i + 1}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-xs font-bold mb-1 ${done ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                        {task.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed mb-2">{task.description}</p>
                      <div className="flex gap-1.5 flex-wrap">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          ⏱ {task.time}
                        </span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${impactBg[task.impactColor]}`}>
                          {task.impact} impact
                        </span>
                      </div>
                    </div>

                    {/* Checkbox */}
                    <button
                      onClick={() => setChecked(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i])}
                      className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 border-2 transition-all ${
                        done ? 'border-green-500 bg-green-500 text-white text-[10px]' : 'border-slate-300 hover:border-green-400'
                      }`}>
                      {done && '✓'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Completion summary box */}
          <div className="rounded-xl border border-green-200 bg-green-50 px-5 py-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-sm flex-shrink-0 font-bold">
                {checked.length === tasks.length ? '✓' : '🎯'}
              </div>
              <div>
                {checked.length === tasks.length ? (
                  <>
                    <div className="text-sm font-black text-green-800">All tasks complete this week!</div>
                    <div className="text-xs text-green-700 mt-0.5">Your prep score could improve by 10–20 pts as habits form. Come back next week for updated actions.</div>
                  </>
                ) : (
                  <>
                    <div className="text-sm font-black text-green-800">
                      Complete all {tasks.length} tasks this week
                    </div>
                    <div className="text-xs text-green-700 mt-0.5">
                      These are the highest-leverage actions for your situation — together they can close your biggest gaps and improve your score to <strong>{Math.min(100, prep.prepScore + 18)}</strong>.
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3-Col Grid ── */}
      <div className="grid grid-cols-3 gap-4">

        {/* Spending cuts */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm bg-amber-50 border border-amber-100">✂️</div>
            <h4 className="text-sm font-bold text-slate-900">Spending cuts available</h4>
          </div>
          <div className="space-y-3">
            {cuts.map((cut, i) => (
              <div key={i} className={`pl-3 ${cut.saving > 0 ? 'border-l-2 border-amber-300' : ''}`}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-bold text-slate-700">{cut.category}</span>
                  {cut.saving > 0 && (
                    <span className="text-[11px] font-bold text-green-600">−${fmt(cut.saving)}/mo</span>
                  )}
                </div>
                {cut.current > 0 && (
                  <div className="text-[11px] text-slate-400 mb-1">${fmt(cut.current)} → ${fmt(cut.target)}</div>
                )}
                <p className="text-[11px] text-slate-500 leading-relaxed">{cut.tip}</p>
              </div>
            ))}
          </div>
          {cuts.some(c => c.saving > 0) && (
            <div className="mt-4 pt-3 border-t border-slate-100">
              <div className="text-[11px] text-slate-500">Total potential savings</div>
              <div className="text-base font-black text-green-600">
                ${fmt(cuts.reduce((a, c) => a + c.saving, 0))}/mo
              </div>
            </div>
          )}
        </div>

        {/* Coverage gaps */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm bg-red-50 border border-red-100">🛡️</div>
            <h4 className="text-sm font-bold text-slate-900">Insurance gaps</h4>
          </div>
          <div className="space-y-3">
            {gaps.map((gap, i) => (
              <div key={i} className={`rounded-lg p-3 ${urgencyColors[gap.urgency]}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${urgencyBadge[gap.urgency]}`}>
                    {urgencyLabel[gap.urgency]}
                  </span>
                  <span className="text-xs font-bold text-slate-800">{gap.name}</span>
                  {gap.covered && <span className="ml-auto text-[10px] font-bold text-green-600">✓ covered</span>}
                </div>
                {!gap.covered && (
                  <>
                    <p className="text-[11px] text-slate-600 mb-1.5 leading-relaxed">{gap.risk}</p>
                    <p className="text-[11px] font-semibold text-slate-700">Fix: {gap.fix}</p>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Platform tips */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm bg-indigo-50 border border-indigo-100">
              {profile.work_type === 'rideshare' ? '🚗' : profile.work_type === 'delivery' ? '📦' : '💼'}
            </div>
            <h4 className="text-sm font-bold text-slate-900">
              {profile.work_type === 'rideshare' ? 'Rideshare'
                : profile.work_type === 'delivery' ? 'Delivery'
                : profile.work_type === 'freelance' ? 'Freelance'
                : 'Contract'} income tips
            </h4>
          </div>
          <div className="space-y-3">
            {tips.map((tip, i) => (
              <div key={i} className="border-l-2 border-indigo-200 pl-3">
                <div className="text-xs font-bold text-slate-800 mb-0.5">{tip.title}</div>
                <p className="text-[11px] text-slate-500 leading-relaxed">{tip.body}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
