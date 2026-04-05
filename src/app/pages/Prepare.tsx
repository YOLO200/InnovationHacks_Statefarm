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
  const platformScore = isDriver ? 0 : 15; // freelance/contract = multiple clients

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
    title: string; time: string; impact: string; impactColor: string; description: string;
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
      urgency: 'critical',
    },
    {
      name: isDriver ? 'Rideshare auto coverage' : 'Disability insurance',
      covered: false, // we can't know without asking — flag as gap
      risk: isDriver
        ? 'Personal auto insurance doesn\'t cover rideshare trips. A gap period exists between app-on and passenger-in.'
        : 'No income if you can\'t work due to illness or injury. Gig workers have no employer disability coverage.',
      fix: isDriver ? 'Ask your insurer for a rideshare endorsement (~$15/mo)' : 'Short-term disability plans start at $20/mo',
      urgency: 'high',
    },
    {
      name: 'Emergency dental',
      covered: false,
      risk: 'Dental emergencies avg $500–$3,000. Often excluded from ACA basic plans.',
      fix: 'Standalone dental plans from $15/mo',
      urgency: 'medium',
    },
  ];
}

// ─── PLATFORM TIPS ────────────────────────────────────────────────────────────
function buildPlatformTips(data: NonNullable<ReturnType<typeof useAppData>['userData']>) {
  const { profile, income } = data;

  const tipsByType: Record<string, { title: string; body: string }[]> = {
    rideshare: [
      { title: 'Chase airport queues and surge zones', body: 'Surge pricing during airport peaks, concerts, and bad weather can 2-3x your hourly rate. Use heat maps in both Uber and Lyft.' },
      { title: 'Track every mile from app-on', body: 'IRS allows $0.67/mile deduction for 2024. At 1,000 miles/mo that\'s $8,040/yr off your tax bill.' },
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
      { title: 'Keep a warm pipeline of 3 leads', body: 'Treat client acquisition as ongoing, not reactive. Reduces the desperate-rate discounting that happens when you\'re between contracts.' },
    ],
  };

  return tipsByType[profile.work_type] ?? tipsByType.freelance;
}

// ─── SCORE BAR ────────────────────────────────────────────────────────────────
function PrepFactor({ label, score, max, color }: { label: string; score: number; max: number; color: string }) {
  const pct = Math.round((score / max) * 100);
  return (
    <div className="flex items-center gap-3">
      <div className="w-36 flex-shrink-0 text-xs font-semibold text-slate-600">{label}</div>
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <div className="w-10 text-right text-xs font-bold" style={{ color }}>{score}/{max}</div>
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
  const prepColor = prep.prepScore >= 65 ? '#22c55e' : prep.prepScore >= 40 ? '#f59e0b' : '#ef4444';

  // Hero stats
  const runwayMonths = (userData.derived.cash_runway_days / 30).toFixed(1);
  const taxReservePct = Math.min(100, Math.round((financials.savings / (income.avg_monthly_income * 3 * 0.25 || 1)) * 100));
  const totalSavingsGoal = financials.fixed_expenses * 6;
  const savingsPct = Math.min(100, Math.round((financials.savings / (totalSavingsGoal || 1)) * 100));

  const urgencyColors: Record<string, string> = {
    critical: 'bg-red-50 border-red-200 text-red-700',
    high:     'bg-amber-50 border-amber-200 text-amber-700',
    medium:   'bg-blue-50 border-blue-200 text-blue-700',
  };
  const urgencyDot: Record<string, string> = {
    critical: 'bg-red-500',
    high:     'bg-amber-500',
    medium:   'bg-blue-400',
  };

  return (
    <div className="p-7 space-y-5 max-w-6xl">

      {/* ── Hero Banner ── */}
      <div className="rounded-2xl p-6 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#059669 0%,#065f46 100%)' }}>
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/5 -translate-y-10 translate-x-10" />
        <div className="absolute bottom-0 right-32 w-24 h-24 rounded-full bg-white/5 translate-y-8" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-1 text-white/60 text-xs font-bold uppercase tracking-wider">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
            Crisis Prevention Plan
          </div>
          <h2 className="text-xl font-bold mb-1">Your preparedness snapshot</h2>
          <p className="text-sm text-white/60 mb-5">
            {profile.work_type === 'rideshare' ? 'Rideshare driver' : profile.work_type === 'delivery' ? 'Delivery worker' : profile.work_type === 'freelance' ? 'Freelancer' : 'Contractor'} — calculated from your financial profile
          </p>

          <div className="grid grid-cols-4 gap-3">
            {/* Prep score */}
            <div className="bg-white/10 rounded-xl p-3 col-span-1">
              <div className="text-[10px] text-white/60 font-semibold uppercase tracking-wide mb-1">Prep score</div>
              <div className="text-2xl font-black" style={{ color: prepColor === '#22c55e' ? '#86efac' : prepColor === '#f59e0b' ? '#fcd34d' : '#fca5a5' }}>
                {prep.prepScore}
              </div>
              <div className="text-[10px] text-white/60 mt-0.5">{prepLabel}</div>
            </div>
            {/* Runway */}
            <div className="bg-white/10 rounded-xl p-3">
              <div className="text-[10px] text-white/60 font-semibold uppercase tracking-wide mb-1">Runway</div>
              <div className="text-2xl font-black text-white">{runwayMonths}mo</div>
              <div className="text-[10px] text-white/60 mt-0.5">of {(3).toFixed(1)}mo goal</div>
            </div>
            {/* Tax reserve */}
            <div className="bg-white/10 rounded-xl p-3">
              <div className="text-[10px] text-white/60 font-semibold uppercase tracking-wide mb-1">Tax reserve</div>
              <div className="text-2xl font-black" style={{ color: taxReservePct >= 80 ? '#86efac' : '#fcd34d' }}>{taxReservePct}%</div>
              <div className="text-[10px] text-white/60 mt-0.5">of ${fmt(prep.quarterlyTax)} due</div>
            </div>
            {/* Insurance */}
            <div className="bg-white/10 rounded-xl p-3">
              <div className="text-[10px] text-white/60 font-semibold uppercase tracking-wide mb-1">Insurance</div>
              <div className="text-2xl font-black" style={{ color: financials.has_insurance ? '#86efac' : '#fca5a5' }}>
                {financials.has_insurance ? '✓' : '✗'}
              </div>
              <div className="text-[10px] text-white/60 mt-0.5">{financials.has_insurance ? 'Covered' : 'No coverage'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Prep Score Breakdown ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-4">Preparedness breakdown</h3>
        <div className="space-y-3">
          <PrepFactor
            label="Savings buffer"
            score={prep.savingsScore}
            max={prep.savingsMax}
            color={prep.savingsScore >= 20 ? '#22c55e' : prep.savingsScore >= 10 ? '#f59e0b' : '#ef4444'}
          />
          <PrepFactor
            label="Tax reserve"
            score={prep.taxScore}
            max={prep.taxMax}
            color={prep.taxScore >= 15 ? '#22c55e' : prep.taxScore >= 8 ? '#f59e0b' : '#ef4444'}
          />
          <PrepFactor
            label="Platform diversity"
            score={prep.platformScore}
            max={prep.platformMax}
            color={prep.platformScore >= 15 ? '#22c55e' : prep.platformScore >= 8 ? '#f59e0b' : '#ef4444'}
          />
          <PrepFactor
            label="Insurance coverage"
            score={prep.insuranceScore}
            max={prep.insuranceMax}
            color={prep.insuranceScore >= 15 ? '#22c55e' : prep.insuranceScore >= 8 ? '#f59e0b' : '#ef4444'}
          />
          <PrepFactor
            label="Crisis cut capacity"
            score={prep.cutScore}
            max={prep.cutMax}
            color={prep.cutScore >= 7 ? '#22c55e' : prep.cutScore >= 4 ? '#f59e0b' : '#ef4444'}
          />
        </div>
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-sm text-slate-500">
            {prep.prepScore < 40
              ? 'Several critical gaps need attention before a crisis hits.'
              : prep.prepScore < 65
              ? 'You have a foundation — close the remaining gaps to be truly prepared.'
              : 'Strong position. Maintain your buffers and review quarterly.'}
          </span>
          <Link to="/crisis"
            className="text-sm font-bold px-4 py-2 rounded-xl text-white transition-colors"
            style={{ background: '#2d3dbd' }}>
            Run crisis scenario →
          </Link>
        </div>
      </div>

      {/* ── This Week's Tasks ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-base font-black text-slate-900">This week's priority actions</span>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-green-100 text-green-700 border border-green-200">
            {tasks.length - checked.length} remaining
          </span>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {tasks.map((task, i) => {
            const done = checked.includes(i);
            const impactBg: Record<string, string> = {
              red:   'bg-red-100 text-red-700 border border-red-200',
              amber: 'bg-amber-100 text-amber-700 border border-amber-200',
              blue:  'bg-blue-100 text-blue-700 border border-blue-200',
            };
            return (
              <div key={i}
                className={`flex items-start gap-4 px-5 py-4 border-b border-slate-100 last:border-b-0 transition-colors ${done ? 'bg-slate-50' : 'hover:bg-slate-50/50'}`}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5 text-white"
                  style={{ background: done ? '#22c55e' : '#059669' }}>
                  {done ? '✓' : i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={`text-sm font-bold mb-1 ${done ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                    {task.title}
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed mb-2">{task.description}</p>
                  <div className="flex gap-1.5">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                      ⏱ {task.time}
                    </span>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${impactBg[task.impactColor]}`}>
                      {task.impact} impact
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setChecked(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i])}
                  className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 border-2 transition-all ${
                    done ? 'border-green-500 bg-green-500 text-white text-[10px]' : 'border-slate-300 hover:border-slate-400'
                  }`}>
                  {done && '✓'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 3 Columns ── */}
      <div className="grid grid-cols-3 gap-4">

        {/* Spending cuts */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm" style={{ background: '#fef3c7' }}>✂️</div>
            <h4 className="text-sm font-bold text-slate-900">Spending cuts available</h4>
          </div>
          <div className="space-y-3">
            {cuts.map((cut, i) => (
              <div key={i} className={`${cut.saving > 0 ? 'border-l-2 border-amber-300 pl-3' : 'pl-3'}`}>
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
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm" style={{ background: '#fee2e2' }}>🛡️</div>
            <h4 className="text-sm font-bold text-slate-900">Insurance gaps</h4>
          </div>
          <div className="space-y-3">
            {gaps.map((gap, i) => (
              <div key={i} className={`rounded-lg p-3 border text-xs ${urgencyColors[gap.urgency]}`}>
                <div className="flex items-center gap-1.5 font-bold mb-1">
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${urgencyDot[gap.urgency]}`} />
                  {gap.name}
                  {gap.covered && <span className="ml-auto text-green-600">✓ covered</span>}
                </div>
                {!gap.covered && (
                  <>
                    <p className="opacity-80 mb-1 leading-relaxed">{gap.risk}</p>
                    <p className="font-semibold opacity-90">Fix: {gap.fix}</p>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Platform tips */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm" style={{ background: '#ede9fe' }}>
              {profile.work_type === 'rideshare' ? '🚗' : profile.work_type === 'delivery' ? '📦' : '💼'}
            </div>
            <h4 className="text-sm font-bold text-slate-900">
              {profile.work_type === 'rideshare' ? 'Rideshare' : profile.work_type === 'delivery' ? 'Delivery' : profile.work_type === 'freelance' ? 'Freelance' : 'Contract'} income tips
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
