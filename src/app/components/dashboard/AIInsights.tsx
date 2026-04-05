import { Card } from '../ui/card';
import { Sparkles, AlertTriangle, Car, CreditCard, TrendingDown, ShieldOff, Zap } from 'lucide-react';
import type { GigWorkerData } from '../../types/financial';

interface Insight {
  icon: typeof Sparkles;
  color: string;
  bg: string;
  title: string;
  body: string;
  priority: 'critical' | 'warning' | 'tip';
}

function buildInsights(data: GigWorkerData): Insight[] {
  const { derived, income, financials, profile } = data;
  const insights: Insight[] = [];
  const volatilityPct = Math.round(derived.income_volatility_score * 100);
  const runwayWeeks = Math.round(derived.cash_runway_days / 7);

  if (volatilityPct > 50) {
    insights.push({
      icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-50',
      priority: 'critical',
      title: `Income fluctuates by ${volatilityPct}% — plan for the worst`,
      body: `Your income swings from $${income.low_monthly_income.toLocaleString()} to $${income.high_monthly_income.toLocaleString()}. Always budget from your lowest month, not your best.`,
    });
  } else if (volatilityPct > 30) {
    insights.push({
      icon: TrendingDown, color: 'text-amber-600', bg: 'bg-amber-50',
      priority: 'warning',
      title: `Your income fluctuates by ${volatilityPct}%`,
      body: 'Moderate instability means one bad month can quickly erode savings. Keep a 6-week cash buffer minimum.',
    });
  }

  if (financials.savings < financials.fixed_expenses) {
    insights.push({
      icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50',
      priority: 'critical',
      title: `Only ${runwayWeeks} week${runwayWeeks !== 1 ? 's' : ''} of savings left`,
      body: `Your savings ($${financials.savings.toLocaleString()}) cover less than one month of expenses. One disruption ends your ability to pay bills.`,
    });
  }

  if (profile.income_dependency_asset === 'car') {
    insights.push({
      icon: Car, color: 'text-orange-600', bg: 'bg-orange-50',
      priority: 'warning',
      title: 'Your car is your income — protect it',
      body: 'Gas and maintenance are critical expenses, not optional. A breakdown means zero income. Prioritize a vehicle emergency fund of $500–$1,000.',
    });
  }

  if (!financials.has_insurance) {
    insights.push({
      icon: ShieldOff, color: 'text-purple-600', bg: 'bg-purple-50',
      priority: 'warning',
      title: 'No insurance — one event could be catastrophic',
      body: 'Without health or disability insurance, a single accident or illness can wipe out savings and stop your income entirely. Explore marketplace plans.',
    });
  }

  if (derived.safe_monthly_budget < 0) {
    insights.push({
      icon: CreditCard, color: 'text-red-600', bg: 'bg-red-50',
      priority: 'critical',
      title: 'Slow months put you in deficit',
      body: `In your worst income month, you spend $${Math.abs(derived.safe_monthly_budget).toLocaleString()} more than you earn. Identify which expenses can be paused during slow periods.`,
    });
  }

  if (insights.length === 0) {
    insights.push({
      icon: Zap, color: 'text-blue-600', bg: 'bg-blue-50',
      priority: 'tip',
      title: 'Looking solid — now build your buffer',
      body: 'Your income is relatively stable. Focus on growing savings to 3 months of expenses to handle any future disruption.',
    });
  }

  return insights.sort((a, b) => {
    const order = { critical: 0, warning: 1, tip: 2 };
    return order[a.priority] - order[b.priority];
  });
}

interface Props { data: GigWorkerData; }

export function AIInsights({ data }: Props) {
  const insights = buildInsights(data);

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-5">
        <div className="p-1.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900">AI Insights</h2>
        <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">Rule-based · {insights.length} active</span>
      </div>

      <div className="space-y-3">
        {insights.map((ins, i) => {
          const Icon = ins.icon;
          return (
            <div key={i} className={`flex gap-3 p-4 rounded-xl ${ins.bg} border ${ins.priority === 'critical' ? 'border-red-200' : ins.priority === 'warning' ? 'border-amber-200' : 'border-blue-200'}`}>
              <div className={`p-2 rounded-lg bg-white/60 flex-shrink-0`}>
                <Icon className={`w-4 h-4 ${ins.color}`} />
              </div>
              <div>
                <p className={`text-sm font-semibold ${ins.color} mb-0.5`}>{ins.title}</p>
                <p className="text-sm text-gray-600 leading-relaxed">{ins.body}</p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
