import { Card } from '../ui/card';
import { TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react';
import type { GigWorkerData } from '../../types/financial';

interface Props { data: GigWorkerData; }

export function IncomeStabilityCard({ data }: Props) {
  const { income, derived } = data;
  const volatilityPct = Math.round(derived.income_volatility_score * 100);

  const stability =
    volatilityPct < 25 ? { label: 'Low Volatility', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', bar: 'bg-green-500' }
    : volatilityPct < 50 ? { label: 'Medium Volatility', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', bar: 'bg-amber-500' }
    : { label: 'High Volatility', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', bar: 'bg-red-500' };

  const barWidth = Math.min(volatilityPct, 100);

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-5">
        <BarChart3 className="w-5 h-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-900">Income Stability</h2>
      </div>

      {/* Volatility meter */}
      <div className={`p-3 rounded-xl border ${stability.bg} ${stability.border} mb-5`}>
        <div className="flex justify-between items-center mb-2">
          <span className={`text-sm font-semibold ${stability.color}`}>{stability.label}</span>
          <span className={`text-lg font-bold ${stability.color}`}>{volatilityPct}%</span>
        </div>
        <div className="h-2 bg-white/60 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${stability.bar}`}
            style={{ width: `${barWidth}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1.5">Income swing as % of average</p>
      </div>

      {/* Income range */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 bg-red-50 rounded-xl text-center">
          <TrendingDown className="w-4 h-4 text-red-500 mx-auto mb-1" />
          <p className="text-xs text-gray-500 mb-0.5">Worst Month</p>
          <p className="text-base font-bold text-red-600">${income.low_monthly_income.toLocaleString()}</p>
        </div>
        <div className="p-3 bg-blue-50 rounded-xl text-center">
          <Minus className="w-4 h-4 text-blue-500 mx-auto mb-1" />
          <p className="text-xs text-gray-500 mb-0.5">Average</p>
          <p className="text-base font-bold text-blue-600">${income.avg_monthly_income.toLocaleString()}</p>
        </div>
        <div className="p-3 bg-green-50 rounded-xl text-center">
          <TrendingUp className="w-4 h-4 text-green-500 mx-auto mb-1" />
          <p className="text-xs text-gray-500 mb-0.5">Best Month</p>
          <p className="text-base font-bold text-green-600">${income.high_monthly_income.toLocaleString()}</p>
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-4 text-center">
        All financial planning is based on your <strong className="text-gray-600">worst month</strong>
      </p>
    </Card>
  );
}
