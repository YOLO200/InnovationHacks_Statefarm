import { useState } from 'react';
import { Card } from '../ui/card';
import { AlertTriangle, Car, Stethoscope, CloudRain, Calendar, RotateCcw, TrendingDown } from 'lucide-react';
import { useAppData } from '../../store/AppContext';
import { mockGigWorker } from '../../data/mockData';
import type { RiskLevel } from '../../types/financial';

interface Scenario {
  id: string;
  label: string;
  icon: typeof AlertTriangle;
  color: string;
  bg: string;
  border: string;
  income_loss: number;   // fraction of avg income lost (0–1)
  extra_expense: number; // one-time or monthly extra cost
  duration_days: number;
  description: string;
}

const SCENARIOS: Scenario[] = [
  {
    id: 'miss_7days',
    label: 'Miss 7 Days of Work',
    icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200',
    income_loss: 7 / 30, extra_expense: 0, duration_days: 7,
    description: 'Sick, personal emergency, or just a bad week.',
  },
  {
    id: 'car_breakdown',
    label: 'Car Breakdown',
    icon: Car, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200',
    income_loss: 14 / 30, extra_expense: 800, duration_days: 14,
    description: '2 weeks off + ~$800 unexpected repair cost.',
  },
  {
    id: 'medical_emergency',
    label: 'Medical Emergency',
    icon: Stethoscope, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200',
    income_loss: 30 / 30, extra_expense: 1500, duration_days: 30,
    description: 'Full month off + $1,500 medical bill (no insurance).',
  },
  {
    id: 'slow_demand',
    label: 'Slow Demand Month',
    icon: CloudRain, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200',
    income_loss: 0.4, extra_expense: 0, duration_days: 30,
    description: '40% income drop — low season, algorithm change, etc.',
  },
];

const riskConfig: Record<RiskLevel, { label: string; color: string; bg: string }> = {
  low:    { label: 'Low Risk',      color: 'text-green-600', bg: 'bg-green-100' },
  medium: { label: 'Medium Risk',   color: 'text-amber-600', bg: 'bg-amber-100' },
  high:   { label: 'High Risk',     color: 'text-red-600',   bg: 'bg-red-100'   },
};

const ACTIONS: Record<string, string[]> = {
  miss_7days: [
    'Use cash reserves — avoid touching any credit lines',
    'Notify landlord/utilities immediately if payment will be late',
    'Resume work as soon as possible — 7 days is recoverable',
  ],
  car_breakdown: [
    'File insurance claim immediately if covered',
    'Explore rental car options to maintain partial income',
    'Contact a credit union for a low-interest emergency loan',
    'Look into Uber/Lyft driver assistance programs',
  ],
  medical_emergency: [
    'Apply for hospital financial assistance (most hospitals have programs)',
    'Request itemized billing and negotiate payment plans',
    'Contact 211 for local emergency financial assistance',
    'Pause all non-essential subscriptions and discretionary spending',
  ],
  slow_demand: [
    'Switch platforms — add DoorDash, Instacart, Amazon Flex',
    'Offer services in adjacent areas or try surge-hour scheduling',
    'Reduce variable expenses: gas, food, entertainment',
    'Dip into savings only for fixed bills — not for wants',
  ],
};

export function CrisisSimulator() {
  const { userData } = useAppData();
  const data = userData ?? mockGigWorker;
  const [selected, setSelected] = useState<Scenario | null>(null);

  const simulate = (scenario: Scenario) => {
    setSelected(prev => prev?.id === scenario.id ? null : scenario);
  };

  const getImpact = (scenario: Scenario) => {
    const lostIncome = data.income.avg_monthly_income * scenario.income_loss;
    const newSavings = Math.max(data.financials.savings - lostIncome - scenario.extra_expense, 0);
    const newMonthlyIncome = data.income.avg_monthly_income * (1 - scenario.income_loss);
    const newRunwayDays = data.financials.fixed_expenses > 0
      ? Math.round(newSavings / (data.financials.fixed_expenses / 30))
      : 0;
    const runwayDelta = newRunwayDays - data.derived.cash_runway_days;

    const newRisk: RiskLevel = newRunwayDays < 14 ? 'high' : newRunwayDays < 45 ? 'medium' : 'low';

    return { lostIncome, newSavings, newMonthlyIncome, newRunwayDays, runwayDelta, newRisk };
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Crisis Simulator</h1>
        <p className="text-gray-500 text-sm">
          Tap a scenario to see exactly what happens to your finances — and what to do about it.
        </p>
      </div>

      {/* Baseline */}
      <Card className="p-4 bg-gray-50 border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 font-medium">Current Baseline</span>
          <div className="flex gap-4 text-right">
            <div><p className="text-xs text-gray-400">Savings</p><p className="font-bold text-gray-900">${data.financials.savings.toLocaleString()}</p></div>
            <div><p className="text-xs text-gray-400">Runway</p><p className="font-bold text-gray-900">{data.derived.cash_runway_days}d</p></div>
            <div><p className="text-xs text-gray-400">Risk</p><p className={`font-bold ${riskConfig[data.derived.risk_level].color}`}>{riskConfig[data.derived.risk_level].label}</p></div>
          </div>
        </div>
      </Card>

      {/* Scenario cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {SCENARIOS.map(scenario => {
          const Icon = scenario.icon;
          const isActive = selected?.id === scenario.id;
          const impact = getImpact(scenario);

          return (
            <div key={scenario.id}>
              <button
                onClick={() => simulate(scenario)}
                className={`w-full text-left p-5 rounded-2xl border-2 transition-all ${
                  isActive
                    ? `${scenario.bg} ${scenario.border} shadow-md`
                    : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-xl ${isActive ? 'bg-white/70' : scenario.bg}`}>
                    <Icon className={`w-5 h-5 ${scenario.color}`} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-sm">{scenario.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{scenario.description}</p>
                  </div>
                </div>

                {isActive && (
                  <div className="mt-4 pt-4 border-t border-current/10 space-y-3">
                    {/* Impact numbers */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-white/70 rounded-xl p-2 text-center">
                        <p className="text-xs text-gray-500">Lost Income</p>
                        <p className="text-sm font-bold text-red-600">-${Math.round(impact.lostIncome).toLocaleString()}</p>
                      </div>
                      <div className="bg-white/70 rounded-xl p-2 text-center">
                        <p className="text-xs text-gray-500">New Savings</p>
                        <p className="text-sm font-bold text-gray-900">${Math.round(impact.newSavings).toLocaleString()}</p>
                      </div>
                      <div className="bg-white/70 rounded-xl p-2 text-center">
                        <p className="text-xs text-gray-500">New Runway</p>
                        <p className={`text-sm font-bold ${riskConfig[impact.newRisk].color}`}>{impact.newRunwayDays}d</p>
                      </div>
                    </div>

                    {/* Runway delta */}
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${riskConfig[impact.newRisk].bg}`}>
                      <TrendingDown className={`w-4 h-4 flex-shrink-0 ${riskConfig[impact.newRisk].color}`} />
                      <p className={`text-xs font-medium ${riskConfig[impact.newRisk].color}`}>
                        {impact.newRisk === 'high' ? '⚠️ Critical' : '⚡ Warning'}: Runway drops by {Math.abs(impact.runwayDelta)} days → {riskConfig[impact.newRisk].label}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="mt-3">
                      <p className="text-xs font-semibold text-gray-700 mb-2">Recommended Actions:</p>
                      <ul className="space-y-1.5">
                        {ACTIONS[scenario.id].map((action, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                            <span className="text-blue-500 font-bold mt-0.5">{i + 1}.</span>
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {!selected && (
        <p className="text-center text-sm text-gray-400">
          Select a scenario above to simulate its financial impact
        </p>
      )}

      {selected && (
        <button
          onClick={() => setSelected(null)}
          className="flex items-center gap-2 mx-auto text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <RotateCcw className="w-4 h-4" /> Reset simulation
        </button>
      )}
    </div>
  );
}
