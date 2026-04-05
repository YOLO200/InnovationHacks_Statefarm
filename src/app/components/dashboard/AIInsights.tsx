import { useState } from 'react';
import { Card } from '../ui/card';
import {
  Sparkles, AlertTriangle, Car, CreditCard, TrendingDown, ShieldOff, Zap,
  ChevronDown, Wallet, Calendar, ShieldCheck, ShieldAlert, ArrowRight,
} from 'lucide-react';
import { Progress } from '../ui/progress';
import type { GigWorkerData } from '../../types/financial';

type DetailType = 'runway' | 'budget' | 'income' | null;

interface Insight {
  icon: typeof Sparkles;
  color: string;
  bg: string;
  border: string;
  title: string;
  body: string;
  priority: 'critical' | 'warning' | 'tip';
  detail: DetailType;
}

function buildInsights(data: GigWorkerData): Insight[] {
  const { derived, income, financials, profile } = data;
  const insights: Insight[] = [];
  const volatilityPct = Math.round(derived.income_volatility_score * 100);
  const runwayWeeks = Math.round(derived.cash_runway_days / 7);

  if (volatilityPct > 50) {
    insights.push({
      icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200',
      priority: 'critical',
      title: `Income fluctuates by ${volatilityPct}% — plan for the worst`,
      body: `Your income swings from $${income.low_monthly_income.toLocaleString()} to $${income.high_monthly_income.toLocaleString()}. Always budget from your lowest month, not your best.`,
      detail: 'income',
    });
  } else if (volatilityPct > 30) {
    insights.push({
      icon: TrendingDown, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200',
      priority: 'warning',
      title: `Your income fluctuates by ${volatilityPct}%`,
      body: 'Moderate instability means one bad month can quickly erode savings. Keep a 6-week cash buffer minimum.',
      detail: 'income',
    });
  }

  if (financials.savings < financials.fixed_expenses) {
    insights.push({
      icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200',
      priority: 'critical',
      title: `Only ${runwayWeeks} week${runwayWeeks !== 1 ? 's' : ''} of savings left`,
      body: `Your savings ($${financials.savings.toLocaleString()}) cover less than one month of expenses. One disruption ends your ability to pay bills.`,
      detail: 'runway',
    });
  }

  if (profile.income_dependency_asset === 'car') {
    insights.push({
      icon: Car, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200',
      priority: 'warning',
      title: 'Your car is your income — protect it',
      body: 'Gas and maintenance are critical expenses, not optional. A breakdown means zero income. Prioritize a vehicle emergency fund of $500–$1,000.',
      detail: null,
    });
  }

  if (!financials.has_insurance) {
    insights.push({
      icon: ShieldOff, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200',
      priority: 'warning',
      title: 'No insurance — one event could be catastrophic',
      body: 'Without health or disability insurance, a single accident or illness can wipe out savings and stop your income entirely. Explore marketplace plans.',
      detail: null,
    });
  }

  if (derived.safe_monthly_budget < 0) {
    insights.push({
      icon: CreditCard, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200',
      priority: 'critical',
      title: 'Slow months put you in deficit',
      body: `In your worst income month, you spend $${Math.abs(derived.safe_monthly_budget).toLocaleString()} more than you earn. Identify which expenses can be paused during slow periods.`,
      detail: 'budget',
    });
  }

  if (insights.length === 0) {
    insights.push({
      icon: Zap, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200',
      priority: 'tip',
      title: 'Looking solid — now build your buffer',
      body: 'Your income is relatively stable. Focus on growing savings to 3 months of expenses to handle any future disruption.',
      detail: null,
    });
  }

  return insights.sort((a, b) => {
    const order = { critical: 0, warning: 1, tip: 2 };
    return order[a.priority] - order[b.priority];
  });
}

// ── Detail panels ──────────────────────────────────────────────────────────────

function RunwayDetail({ data }: { data: GigWorkerData }) {
  const { financials, derived } = data;
  const days = derived.cash_runway_days;
  const months = (days / 30).toFixed(1);
  const progress = Math.min((days / 90) * 100, 100);
  const severity = days < 14 ? 'critical' : days < 45 ? 'warning' : 'healthy';
  const colors = {
    critical: { text: 'text-red-600', bg: 'bg-red-50', icon: 'text-red-500' },
    warning:  { text: 'text-amber-600', bg: 'bg-amber-50', icon: 'text-amber-500' },
    healthy:  { text: 'text-green-600', bg: 'bg-green-50', icon: 'text-green-500' },
  }[severity];

  return (
    <div className="mt-3 pt-3 border-t border-gray-200 space-y-3">
      <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
        <Calendar className="w-3.5 h-3.5" />
        Cash Runway
      </div>
      <div className="flex items-end gap-2">
        <p className={`text-3xl font-bold ${colors.text}`}>{days}</p>
        <p className="text-base text-gray-500 mb-0.5">days</p>
        <p className="text-xs text-gray-400 mb-1">({months} months)</p>
      </div>
      <Progress value={progress} className="h-2.5" />
      <div className="flex justify-between text-xs text-gray-400">
        <span>0</span>
        <span className="font-medium text-gray-500">Goal: 90 days</span>
        <span>90d</span>
      </div>
      {severity !== 'healthy' && (
        <div className={`flex items-start gap-2 p-2.5 rounded-lg ${colors.bg}`}>
          <AlertTriangle className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${colors.icon}`} />
          <p className={`text-xs font-medium ${colors.text}`}>
            {severity === 'critical'
              ? 'Critical — under 2 weeks of runway. Activate emergency budget now.'
              : 'Warning — build to 45 days minimum before any spending increases.'}
          </p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-3 bg-blue-50 rounded-xl">
          <div className="flex items-center gap-1 mb-1">
            <Wallet className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-xs text-gray-500">Savings</span>
          </div>
          <p className="text-lg font-bold text-blue-600">${financials.savings.toLocaleString()}</p>
        </div>
        <div className="p-3 bg-red-50 rounded-xl">
          <div className="flex items-center gap-1 mb-1">
            <TrendingDown className="w-3.5 h-3.5 text-red-600" />
            <span className="text-xs text-gray-500">Monthly Burn</span>
          </div>
          <p className="text-lg font-bold text-red-600">${financials.fixed_expenses.toLocaleString()}</p>
        </div>
      </div>
      <p className="text-xs text-gray-400 text-center">Calculated using fixed expenses, not your income</p>
    </div>
  );
}

function BudgetDetail({ data }: { data: GigWorkerData }) {
  const { derived, income, financials } = data;
  const safe = derived.safe_monthly_budget;
  const isSafe = safe > 0;
  const dailySafe = isSafe ? Math.round(safe / 30) : 0;
  const expensePct = Math.round((financials.fixed_expenses / income.low_monthly_income) * 100);

  return (
    <div className="mt-3 pt-3 border-t border-gray-200 space-y-3">
      <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
        {isSafe ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
        Safe Budget — Slow Month
      </div>
      <p className="text-xs text-gray-500">
        Based on your worst-case income of <strong>${income.low_monthly_income.toLocaleString()}</strong>
      </p>
      {isSafe ? (
        <>
          <p className="text-xs text-gray-500">You should not spend more than</p>
          <p className="text-3xl font-bold text-green-600">
            ${safe.toLocaleString()}<span className="text-sm font-normal text-gray-500">/month</span>
          </p>
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <ArrowRight className="w-3.5 h-3.5 text-green-500" />
            That's about <strong className="text-green-700 ml-1">${dailySafe}/day</strong>&nbsp;of discretionary spending
          </div>
        </>
      ) : (
        <>
          <p className="text-xs text-red-600 font-medium">Monthly deficit in slow months</p>
          <p className="text-3xl font-bold text-red-600">
            -${Math.abs(safe).toLocaleString()}<span className="text-sm font-normal text-gray-500">/month</span>
          </p>
          <p className="text-xs text-red-700 bg-red-100 px-3 py-2 rounded-lg">
            ⚠️ Your fixed expenses exceed your lowest income. Even one slow month drains savings.
          </p>
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <ArrowRight className="w-3.5 h-3.5 text-red-500" />
            Reduce expenses by <strong className="text-red-700 ml-1">${Math.abs(safe).toLocaleString()}/mo</strong>&nbsp;or raise your income floor
          </div>
        </>
      )}
      <div>
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>Low income: ${income.low_monthly_income.toLocaleString()}</span>
          <span>Expenses: ${financials.fixed_expenses.toLocaleString()}</span>
        </div>
        <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${isSafe ? 'bg-green-500' : 'bg-red-500'}`}
            style={{ width: `${Math.min(expensePct, 100)}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-1">
          Expenses are {expensePct}% of your lowest income month
        </p>
      </div>
    </div>
  );
}

function IncomeDetail({ data }: { data: GigWorkerData }) {
  const { income, derived } = data;
  const volatilityPct = Math.round(derived.income_volatility_score * 100);
  const swing = income.high_monthly_income - income.low_monthly_income;

  return (
    <div className="mt-3 pt-3 border-t border-gray-200 space-y-3">
      <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
        <TrendingDown className="w-3.5 h-3.5" />
        Income Stability
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="p-3 bg-green-50 rounded-xl text-center">
          <p className="text-xs text-gray-400 mb-0.5">Best month</p>
          <p className="text-base font-bold text-green-600">${income.high_monthly_income.toLocaleString()}</p>
        </div>
        <div className="p-3 bg-blue-50 rounded-xl text-center">
          <p className="text-xs text-gray-400 mb-0.5">Average</p>
          <p className="text-base font-bold text-blue-600">${income.avg_monthly_income.toLocaleString()}</p>
        </div>
        <div className="p-3 bg-red-50 rounded-xl text-center">
          <p className="text-xs text-gray-400 mb-0.5">Worst month</p>
          <p className="text-base font-bold text-red-600">${income.low_monthly_income.toLocaleString()}</p>
        </div>
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        <span>Monthly swing</span>
        <span className="font-semibold text-gray-800">${swing.toLocaleString()}</span>
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        <span>Volatility score</span>
        <span className={`font-semibold ${volatilityPct > 50 ? 'text-red-600' : volatilityPct > 30 ? 'text-amber-600' : 'text-green-600'}`}>
          {volatilityPct}%
        </span>
      </div>
      <p className="text-xs text-gray-400">Always plan your budget around your worst month, not your average.</p>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

interface Props { data: GigWorkerData; }

export function AIInsights({ data }: Props) {
  const insights = buildInsights(data);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-5">
        <div className="p-1.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-gray-900">AI Insights</h2>
          <p className="text-sm text-gray-500 mt-0.5">Here is how you can improve your financial health score</p>
        </div>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full flex-shrink-0">
          Rule-based · {insights.length} active
        </span>
      </div>

      <div className="space-y-3">
        {insights.map((ins, i) => {
          const Icon = ins.icon;
          const isOpen = openIndex === i;
          const hasDetail = ins.detail !== null;

          return (
            <div
              key={i}
              className={`p-4 rounded-xl ${ins.bg} border ${ins.border} ${hasDetail ? 'cursor-pointer select-none' : ''} transition-all`}
              onClick={() => hasDetail && setOpenIndex(isOpen ? null : i)}
            >
              <div className="flex gap-3 items-start">
                <div className="p-2 rounded-lg bg-white/60 flex-shrink-0">
                  <Icon className={`w-4 h-4 ${ins.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${ins.color} mb-0.5`}>{ins.title}</p>
                  <p className="text-sm text-gray-600 leading-relaxed">{ins.body}</p>
                </div>
                {hasDetail && (
                  <ChevronDown
                    className={`w-4 h-4 flex-shrink-0 mt-0.5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                  />
                )}
              </div>

              {isOpen && ins.detail === 'runway' && <RunwayDetail data={data} />}
              {isOpen && ins.detail === 'budget' && <BudgetDetail data={data} />}
              {isOpen && ins.detail === 'income' && <IncomeDetail data={data} />}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
