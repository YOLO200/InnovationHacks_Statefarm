import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { TrendingUp, Target, Wallet } from 'lucide-react';
import { motion } from 'motion/react';

interface SavingsGoalProps {
  currentSavings: number;
  goalAmount: number;
  monthlyContribution: number;
}

export function SavingsGoal({
  currentSavings,
  goalAmount,
  monthlyContribution,
}: SavingsGoalProps) {
  const progress = (currentSavings / goalAmount) * 100;
  const remaining = goalAmount - currentSavings;
  const monthsToGoal = remaining > 0 ? Math.ceil(remaining / monthlyContribution) : 0;

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-semibold mb-6">Savings Goal</h2>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between mb-2">
          <span className="text-sm text-gray-600">Progress</span>
          <span className="text-sm font-medium">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-3" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Current Savings */}
        <motion.div
          className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="p-2 bg-blue-100 rounded-lg">
            <Wallet className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Current Savings</p>
            <p className="text-xl font-bold text-blue-600">
              ${currentSavings.toLocaleString()}
            </p>
          </div>
        </motion.div>

        {/* Goal Amount */}
        <motion.div
          className="flex items-start gap-3 p-4 bg-green-50 rounded-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="p-2 bg-green-100 rounded-lg">
            <Target className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Goal Amount</p>
            <p className="text-xl font-bold text-green-600">
              ${goalAmount.toLocaleString()}
            </p>
          </div>
        </motion.div>

        {/* Monthly Contribution */}
        <motion.div
          className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="p-2 bg-purple-100 rounded-lg">
            <TrendingUp className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Monthly Saving</p>
            <p className="text-xl font-bold text-purple-600">
              ${monthlyContribution.toLocaleString()}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Remaining Info */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-600">Amount Remaining</p>
            <p className="text-xl font-bold text-gray-800">
              ${remaining > 0 ? remaining.toLocaleString() : 0}
            </p>
          </div>
          {monthsToGoal > 0 && (
            <div className="text-right">
              <p className="text-sm text-gray-600">Estimated Time</p>
              <p className="text-xl font-bold text-gray-800">
                {monthsToGoal} {monthsToGoal === 1 ? 'month' : 'months'}
              </p>
            </div>
          )}
          {progress >= 100 && (
            <div className="text-right">
              <p className="text-2xl">🎉 Goal Reached!</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
