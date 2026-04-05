import { motion } from 'motion/react';
import { Card } from '../ui/card';
import { Sparkles, AlertTriangle, TrendingUp } from 'lucide-react';
import type { GigWorkerData } from '../../types/financial';

const WORK_LABELS = { rideshare: 'Rideshare Driver', delivery: 'Delivery Worker', freelance: 'Freelancer', contract: 'Contractor' };

interface Props { data: GigWorkerData; }

export function FinancialHealthScore({ data }: Props) {
  const { derived, profile, income } = data;
  const score = derived.financial_health_score;

  const config = score >= 65
    ? { color: 'text-green-600', ring: 'stroke-green-500', bg: 'from-green-50 to-emerald-50', label: 'Stable', Icon: TrendingUp, badge: 'bg-green-100 text-green-700' }
    : score >= 40
    ? { color: 'text-amber-600', ring: 'stroke-amber-500', bg: 'from-amber-50 to-yellow-50', label: 'At Risk', Icon: AlertTriangle, badge: 'bg-amber-100 text-amber-700' }
    : { color: 'text-red-600', ring: 'stroke-red-500', bg: 'from-red-50 to-rose-50', label: 'Critical', Icon: AlertTriangle, badge: 'bg-red-100 text-red-700' };

  const circumference = 2 * Math.PI * 70;
  const dashOffset = circumference - (score / 100) * circumference;

  return (
    <Card className={`p-8 bg-gradient-to-br ${config.bg} border-none`}>
      <div className="flex items-center justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">AI-Powered Analysis</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Your Financial Survival Overview</h1>
          <p className="text-gray-500 text-sm mb-3">{WORK_LABELS[profile.work_type]} · Variable Income Model</p>

          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${config.badge}`}>
              <config.Icon className="w-3.5 h-3.5" />
              {config.label}
            </span>
            <span className="text-xs text-gray-500 bg-white/70 px-3 py-1.5 rounded-full">
              Avg ${income.avg_monthly_income.toLocaleString()} / Low ${income.low_monthly_income.toLocaleString()} / mo
            </span>
          </div>

          {derived.safe_monthly_budget < 0 && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
              ⚠️ In a slow month, expenses exceed income by <strong>${Math.abs(derived.safe_monthly_budget).toLocaleString()}</strong>
            </div>
          )}
        </div>

        {/* Score ring */}
        <div className="relative flex-shrink-0">
          <svg width="160" height="160" className="transform -rotate-90">
            <circle cx="80" cy="80" r="70" stroke="#e5e7eb" strokeWidth="12" fill="none" />
            <motion.circle
              cx="80" cy="80" r="70"
              className={config.ring}
              strokeWidth="12" fill="none" strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: dashOffset }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              className={`text-4xl font-bold ${config.color}`}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
            >
              {score}
            </motion.span>
            <span className="text-xs text-gray-500 font-medium">Health Score</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
