import { Card } from '../ui/card';
import { Progress } from '../ui/progress';
import { TrendingDown, Wallet, Calendar, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import type { GigWorkerData } from '../../types/financial';

interface Props { data: GigWorkerData; }

export function CashRunway({ data }: Props) {
  const { financials, derived, income } = data;
  const days = derived.cash_runway_days;
  const months = (days / 30).toFixed(1);
  const progress = Math.min((days / 90) * 100, 100); // 90 days = full bar

  const severity = days < 14 ? 'critical' : days < 45 ? 'warning' : 'healthy';
  const colors = {
    critical: { bar: 'bg-red-500', text: 'text-red-600', bg: 'bg-red-50', icon: 'text-red-500' },
    warning:  { bar: 'bg-amber-500', text: 'text-amber-600', bg: 'bg-amber-50', icon: 'text-amber-500' },
    healthy:  { bar: 'bg-green-500', text: 'text-green-600', bg: 'bg-green-50', icon: 'text-green-500' },
  }[severity];

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-900">Cash Runway</h2>
        <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
          Worst-case basis
        </span>
      </div>

      <motion.div
        className="mb-5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-end gap-2 mb-1">
          <p className={`text-4xl font-bold ${colors.text}`}>{days}</p>
          <p className="text-lg text-gray-500 mb-1">days</p>
          <p className="text-sm text-gray-400 mb-1.5">({months} months)</p>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          How long your savings last if income stops entirely
        </p>
        <Progress value={progress} className="h-3 mb-2" />
        <div className="flex justify-between text-xs text-gray-400">
          <span>0</span>
          <span className="font-medium text-gray-500">Goal: 90 days</span>
          <span>90d</span>
        </div>
      </motion.div>

      {severity !== 'healthy' && (
        <div className={`flex items-start gap-2 p-3 rounded-xl ${colors.bg} mb-4`}>
          <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${colors.icon}`} />
          <p className={`text-xs font-medium ${colors.text}`}>
            {severity === 'critical'
              ? 'Critical — under 2 weeks of runway. Activate emergency budget now.'
              : 'Warning — build to 45 days minimum before any spending increases.'}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-blue-50 rounded-xl">
          <div className="flex items-center gap-1.5 mb-1">
            <Wallet className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-xs text-gray-500">Savings</span>
          </div>
          <p className="text-lg font-bold text-blue-600">${financials.savings.toLocaleString()}</p>
        </div>
        <div className="p-3 bg-red-50 rounded-xl">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingDown className="w-3.5 h-3.5 text-red-600" />
            <span className="text-xs text-gray-500">Monthly Burn</span>
          </div>
          <p className="text-lg font-bold text-red-600">${financials.fixed_expenses.toLocaleString()}</p>
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-3 text-center">
        Calculated using fixed expenses, not your income figure
      </p>
    </Card>
  );
}
