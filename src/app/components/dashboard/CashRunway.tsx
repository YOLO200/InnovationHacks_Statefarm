import { Card } from '../ui/card';
import { Progress } from '../ui/progress';
import { TrendingDown, Wallet, Calendar } from 'lucide-react';
import { motion } from 'motion/react';

interface CashRunwayProps {
  savings: number;
  monthlyExpenses: number;
}

export function CashRunway({ savings, monthlyExpenses }: CashRunwayProps) {
  const months = savings / monthlyExpenses;
  const progressPercentage = Math.min((months / 12) * 100, 100); // Max 12 months for visual

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">Cash Runway</h2>
      </div>

      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <p className="text-3xl font-bold text-gray-900 mb-2">
          {months.toFixed(1)} months
        </p>
        <p className="text-gray-600 mb-4">
          You can survive without income
        </p>
        <Progress value={progressPercentage} className="h-3 mb-2" />
        <p className="text-sm text-gray-500">
          {progressPercentage >= 100 ? 'Excellent runway!' : `${(12 - months).toFixed(1)} months to reach 1 year`}
        </p>
      </motion.div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-blue-50 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-gray-600">Savings</span>
          </div>
          <p className="text-xl font-bold text-blue-600">
            ${savings.toLocaleString()}
          </p>
        </div>

        <div className="p-4 bg-red-50 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="w-4 h-4 text-red-600" />
            <span className="text-sm text-gray-600">Monthly Burn</span>
          </div>
          <p className="text-xl font-bold text-red-600">
            ${monthlyExpenses.toLocaleString()}
          </p>
        </div>
      </div>
    </Card>
  );
}
