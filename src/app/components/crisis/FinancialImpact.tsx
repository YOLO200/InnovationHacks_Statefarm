import { Card } from '../ui/card';
import { DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';
import { motion } from 'motion/react';
import type { FinancialImpactData } from '../../../lib/gemini';

interface FinancialImpactProps {
  data?: FinancialImpactData;
  savings?: number;
}

export function FinancialImpact({ data, savings = 0 }: FinancialImpactProps) {
  const estimatedCost = { min: data?.estimatedCostMin ?? 0, max: data?.estimatedCostMax ?? 0 };
  const insuranceCoverage = data?.insuranceCoveragePercent ?? 0;
  const outOfPocket = data?.outOfPocket ?? 0;
  const remaining = Math.max(savings - outOfPocket, 0);

  const chartData = [
    { name: 'Savings',   amount: savings,    color: '#10b981' },
    { name: 'Expense',   amount: outOfPocket, color: '#ef4444' },
    { name: 'Remaining', amount: remaining,   color: '#3b82f6' },
  ];

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <DollarSign className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Financial Impact Analysis</h3>
          <p className="text-sm text-gray-600">Projected costs and coverage</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <motion.div
          className="p-4 bg-orange-50 rounded-xl border border-orange-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <p className="text-sm text-gray-600 mb-1">Estimated Cost</p>
          <p className="text-xl font-bold text-orange-600">
            ${estimatedCost.min.toLocaleString()}–${estimatedCost.max.toLocaleString()}
          </p>
        </motion.div>

        <motion.div
          className="p-4 bg-green-50 rounded-xl border border-green-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <p className="text-sm text-gray-600 mb-1">Insurance Coverage</p>
          <p className="text-xl font-bold text-green-600">{insuranceCoverage}%</p>
        </motion.div>

        <motion.div
          className="p-4 bg-red-50 rounded-xl border border-red-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <p className="text-sm text-gray-600 mb-1">Out-of-Pocket</p>
          <p className="text-xl font-bold text-red-600">~${outOfPocket.toLocaleString()}</p>
        </motion.div>
      </div>

      <div className="p-4 bg-gray-50 rounded-xl">
        <p className="text-sm text-gray-600 mb-3 font-medium">Savings vs Expense Comparison</p>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={chartData}>
            <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 12 }} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
            <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
