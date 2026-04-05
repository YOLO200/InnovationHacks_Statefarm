import { Link } from 'react-router';
import { useAppData } from '../store/AppContext';
import { useLanguage } from '../store/LanguageContext';

function fmt(n: number) { return n.toLocaleString(); }

// Fill {placeholder} tokens in a translated string
function fill(str: string, vars: Record<string, string | number>) {
  return Object.entries(vars).reduce(
    (s, [k, v]) => s.replaceAll(`{${k}}`, String(v)),
    str
  );
}

// ─── SUB-FACTOR SCORES ────────────────────────────────────────────────────────
function deriveSubScores(data: NonNullable<ReturnType<typeof useAppData>['userData']>) {
  const { derived, income, financials } = data;
  const incomeStability = Math.max(0, Math.round(100 - derived.income_volatility_score * 80));
  const taxReserveScore = financials.savings > financials.fixed_expenses * 4 ? 60 : 0;
  const sixMonthGoal = financials.fixed_expenses * 6;
  const savingsBuffer = Math.min(100, Math.round((financials.savings / sixMonthGoal) * 100));
  const coverageScore = financials.has_insurance ? 75 : 25;
  const estimatedQTax = Math.round(income.avg_monthly_income * 3 * 0.25);
  return { incomeStability, taxReserveScore, savingsBuffer, coverageScore, estimatedQTax };
}


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
  const { t } = useLanguage();
  if (!userData) return null;

  const { income, financials, derived, monthly_spending = [] } = userData;
  const sub = deriveSubScores(userData);

  const runwayWeeks = Math.round(derived.cash_runway_days / 7);
  const runwayMonths = (derived.cash_runway_days / 30).toFixed(1);
  const worstMonthSurplus = income.low_monthly_income - financials.fixed_expenses;
  const qTax = Math.round(income.avg_monthly_income * 3 * 0.25);

  const bd = financials.spending_breakdown;
  const totalMonthlySpend = Object.values(bd).reduce((a, b) => a + b, 0);

  // ── Verdict ──
  const verdictConfig = {
    high:   { cls: 'bg-red-50 border border-red-200',    icon: '🚨', titleColor: 'text-red-800',   msgColor: 'text-red-700' },
    medium: { cls: 'bg-amber-50 border border-amber-200', icon: '⚠️', titleColor: 'text-amber-800', msgColor: 'text-amber-700' },
    low:    { cls: 'bg-green-50 border border-green-200', icon: '✅', titleColor: 'text-green-800', msgColor: 'text-green-700' },
  }[derived.risk_level];

  const verdictTitle = {
    high:   t('verdict_high_title'),
    medium: t('verdict_med_title'),
    low:    t('verdict_low_title'),
  }[derived.risk_level];

  const verdictMsg = {
    high: fill(t('verdict_high_msg'), {
      pct: Math.round(derived.income_volatility_score * 100),
      weeks: runwayWeeks,
      s: runwayWeeks !== 1 ? 's' : '',
      insurance: !financials.has_insurance ? t('verdict_high_insurance') : '',
    }),
    medium: fill(t('verdict_med_msg'), {
      pct: Math.round(derived.income_volatility_score * 100),
      weeks: runwayWeeks,
    }),
    low: fill(t('verdict_low_msg'), { weeks: runwayWeeks }),
  }[derived.risk_level];

  // ── Statement label ──
  const statementLabel = monthly_spending.length > 0
    ? fill(t('based_on_months'), {
        n: monthly_spending.length,
        from: monthly_spending[monthly_spending.length - 1]?.month ?? '',
        to: monthly_spending[0]?.month ?? '',
      })
    : t('based_on_profile');

  // ── Score label ──
  const scoreLabel = derived.financial_health_score >= 65
    ? t('score_stable')
    : derived.financial_health_score >= 40
    ? t('score_needs_work')
    : t('score_critical');

  const scoreDesc = derived.financial_health_score >= 65
    ? t('score_desc_stable')
    : derived.financial_health_score >= 40
    ? t('score_desc_medium')
    : t('score_desc_critical');

  return (
    <div className="p-7 space-y-5 max-w-6xl">

      {/* ── AI Findings Banner ── */}
      <div className="rounded-2xl p-6 text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg,#2d3dbd 0%,#1a237e 100%)' }}>
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/5 -translate-y-8 translate-x-8" />
        <div className="absolute bottom-0 right-24 w-20 h-20 rounded-full bg-white/3 translate-y-6" />
        <div className="flex items-center gap-2 mb-1 text-white/60 text-xs font-bold uppercase tracking-wider relative">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {t('ai_badge')}
        </div>
        <h2 className="text-xl font-bold mb-1 relative">{t('ai_title')}</h2>
        <p className="text-sm text-white/60 mb-5 relative">{statementLabel}</p>
        <div className="grid grid-cols-6 gap-3 relative">
          {[
            { labelKey: 'stat_avg_income',  subKey: 'stat_sub_avg_income', val: `$${fmt(income.avg_monthly_income)}` },
            { labelKey: 'stat_avg_spend',   subKey: 'stat_sub_avg_spend',  val: `$${fmt(totalMonthlySpend > 0 ? totalMonthlySpend : financials.fixed_expenses)}` },
            { labelKey: 'stat_savings',     subKey: 'stat_sub_savings',    val: `$${fmt(financials.savings)}` },
            { labelKey: 'stat_debt',        subKey: 'stat_sub_debt',       val: `$${fmt(financials.debt_payments)}/mo`, warn: financials.debt_payments > income.avg_monthly_income * 0.2 },
            { labelKey: 'stat_volatility',  subKey: derived.income_volatility_score > 0.5 ? 'stat_sub_vol_high' : derived.income_volatility_score > 0.3 ? 'stat_sub_vol_med' : 'stat_sub_vol_low', val: `${Math.round(derived.income_volatility_score * 100)}%`, warn: derived.income_volatility_score > 0.3 },
            { labelKey: 'stat_insurance',   subKey: financials.has_insurance ? 'stat_detected' : 'stat_not_found',
              val: financials.has_insurance ? t('stat_covered') : t('stat_none'), warn: !financials.has_insurance },
          ].map(s => (
            <div key={s.labelKey} className="bg-white/10 rounded-xl p-3">
              <div className="text-[10px] text-white/60 font-semibold uppercase tracking-wide mb-1">{t(s.labelKey)}</div>
              <div className="text-lg font-black" style={{ color: s.warn ? '#fca5a5' : '#fff' }}>{s.val}</div>
              <div className="text-[10px] text-white/50 mt-0.5">{t(s.subKey)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Score Card ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center gap-6">
        <ScoreRing score={derived.financial_health_score} />
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-slate-900 mb-1">
            {t('score_prefix')}: {derived.financial_health_score} — {scoreLabel}
          </h3>
          <p className="text-sm text-slate-500 mb-3 leading-relaxed">{scoreDesc}</p>
          <div className="grid grid-cols-2 gap-2">
            <SubFactor label={t('sf_income')} value={sub.incomeStability}
              color={sub.incomeStability >= 60 ? '#22c55e' : sub.incomeStability >= 35 ? '#f59e0b' : '#ef4444'} />
            <SubFactor label={t('sf_tax')} value={sub.taxReserveScore}
              color={sub.taxReserveScore >= 50 ? '#22c55e' : '#ef4444'} />
            <SubFactor label={t('sf_savings')} value={sub.savingsBuffer}
              color={sub.savingsBuffer >= 60 ? '#22c55e' : sub.savingsBuffer >= 30 ? '#f59e0b' : '#ef4444'} />
            <SubFactor label={t('sf_coverage')} value={sub.coverageScore}
              color={sub.coverageScore >= 60 ? '#22c55e' : sub.coverageScore >= 40 ? '#f59e0b' : '#ef4444'} />
          </div>
        </div>
      </div>

      {/* ── Survival Stats ── */}
      <div className="grid grid-cols-3 gap-4">
        {/* Runway */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
            {t('runway_header')}
          </div>
          <div className="text-3xl font-black mb-1" style={{
            color: derived.cash_runway_days < 30 ? '#ef4444' : derived.cash_runway_days < 60 ? '#f59e0b' : '#22c55e',
            letterSpacing: '-1px',
          }}>
            {runwayWeeks < 1 ? `${derived.cash_runway_days}d` : runwayWeeks < 8 ? `${runwayWeeks} weeks` : `${runwayMonths} months`}
          </div>
          <div className="text-xs text-slate-500 leading-relaxed">
            {fill(t('runway_body'), {
              savings: `$${fmt(financials.savings)}`,
              weeks: runwayWeeks,
              s: runwayWeeks !== 1 ? 's' : '',
            })}
          </div>
        </div>

        {/* Worst month */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
            {t('worst_header')}
          </div>
          <div className="text-3xl font-black mb-1" style={{ color: worstMonthSurplus < 0 ? '#ef4444' : '#f59e0b', letterSpacing: '-1px' }}>
            {worstMonthSurplus < 0 ? `-$${fmt(Math.abs(worstMonthSurplus))}` : `+$${fmt(worstMonthSurplus)}`}
          </div>
          <div className="text-xs text-slate-500 leading-relaxed">
            {fill(t('worst_lowest'), { income: `$${fmt(income.low_monthly_income)}` })}{' '}
            {worstMonthSurplus < 0
              ? fill(t('worst_deficit'), { amount: `$${fmt(Math.abs(worstMonthSurplus))}` })
              : fill(t('worst_surplus'), { amount: `$${fmt(worstMonthSurplus)}` })}
          </div>
        </div>

        {/* Tax */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
            {t('tax_header')}
          </div>
          <div className="text-3xl font-black text-red-500 mb-1" style={{ letterSpacing: '-1px' }}>
            ${fmt(qTax)}
          </div>
          <div className="text-xs text-slate-500 leading-relaxed">
            {fill(t('tax_body'), { income: `$${fmt(income.avg_monthly_income)}`, tax: `$${fmt(qTax)}` })}
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
        <Link
          to="/prepare"
          className="flex-shrink-0 flex items-center gap-1.5 text-sm font-bold text-white px-4 py-2 rounded-xl transition-colors"
          style={{ background: '#2d3dbd' }}
        >
          Prepare for Crisis
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </Link>
      </div>


    </div>
  );
}
