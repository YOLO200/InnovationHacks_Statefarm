import { Card } from '../ui/card';
import { ShieldCheck, ShieldAlert, ArrowRight } from 'lucide-react';
import type { GigWorkerData } from '../../types/financial';

interface Props { data: GigWorkerData; }

export function SafeBudgetIndicator({ data }: Props) {
  const { derived, income, financials } = data;
  const safe = derived.safe_monthly_budget;
  const isSafe = safe > 0;
  const dailySafe = isSafe ? Math.round(safe / 30) : 0;

  return (
    <Card className={`p-6 border-2 ${isSafe ? 'border-green-200 bg-green-50/50' : 'border-red-200 bg-red-50/50'}`}>
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-xl ${isSafe ? 'bg-green-100' : 'bg-red-100'}`}>
          {isSafe
            ? <ShieldCheck className="w-6 h-6 text-green-600" />
            : <ShieldAlert className="w-6 h-6 text-red-600" />
          }
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Safe Budget (Slow Month)</h2>
          <p className="text-sm text-gray-500 mb-4">
            Based on your <strong>${income.low_monthly_income.toLocaleString()}</strong> worst-case income
          </p>

          {isSafe ? (
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">You should not spend more than</p>
                <p className="text-3xl font-bold text-green-600">${safe.toLocaleString()}<span className="text-base font-normal text-gray-500">/month</span></p>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <ArrowRight className="w-4 h-4 text-green-500" />
                That's about <strong className="text-green-700">${dailySafe}/day</strong> of discretionary spending
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <p className="text-xs text-red-600 font-medium mb-0.5">Monthly deficit in slow months</p>
                <p className="text-3xl font-bold text-red-600">-${Math.abs(safe).toLocaleString()}<span className="text-base font-normal text-gray-500">/month</span></p>
              </div>
              <p className="text-sm text-red-700 bg-red-100 px-3 py-2 rounded-lg">
                ⚠️ Your fixed expenses exceed your lowest income. Even one slow month drains savings.
              </p>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <ArrowRight className="w-4 h-4 text-red-500" />
                You need to reduce expenses by <strong className="text-red-700">${Math.abs(safe).toLocaleString()}/mo</strong> or increase your income floor
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Breakdown bar */}
      <div className="mt-5 pt-4 border-t border-gray-200">
        <div className="flex justify-between text-xs text-gray-500 mb-1.5">
          <span>Low income: ${income.low_monthly_income.toLocaleString()}</span>
          <span>Expenses: ${financials.fixed_expenses.toLocaleString()}</span>
        </div>
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden flex">
          <div
            className={`h-full rounded-full transition-all ${isSafe ? 'bg-green-500' : 'bg-red-500'}`}
            style={{ width: `${Math.min((financials.fixed_expenses / income.low_monthly_income) * 100, 100)}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-1">
          Expenses are {Math.round((financials.fixed_expenses / income.low_monthly_income) * 100)}% of your lowest income month
        </p>
      </div>
    </Card>
  );
}
