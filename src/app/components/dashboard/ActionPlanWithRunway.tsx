import { Card } from '../ui/card';
import { Checkbox } from '../ui/checkbox';
import { Progress } from '../ui/progress';
import { Target, TrendingUp, Calendar, Wallet, TrendingDown } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'motion/react';

interface ActionPlanWithRunwayProps {
  savings: number;
  monthlyExpenses: number;
}

const initialActions = [
  { id: 1, text: 'Build emergency fund (+$1,000)', priority: 'high', completed: false, savingsImpact: 1000, expenseImpact: 0 },
  { id: 2, text: 'Reduce subscription spending', priority: 'high', completed: false, savingsImpact: 0, expenseImpact: -100 },
  { id: 3, text: 'Get basic health insurance', priority: 'medium', completed: false, savingsImpact: 0, expenseImpact: 150 },
  { id: 4, text: 'Review and optimize monthly expenses', priority: 'medium', completed: false, savingsImpact: 0, expenseImpact: -200 },
  { id: 5, text: 'Set up automatic savings transfer', priority: 'low', completed: false, savingsImpact: 500, expenseImpact: 0 },
];

export function ActionPlanWithRunway({ savings, monthlyExpenses }: ActionPlanWithRunwayProps) {
  const [actions, setActions] = useState(initialActions);

  const toggleAction = (id: number) => {
    setActions(actions.map(action => 
      action.id === id ? { ...action, completed: !action.completed } : action
    ));
  };

  // Calculate current runway
  const completedActions = actions.filter(a => a.completed);
  const additionalSavings = completedActions.reduce((sum, a) => sum + a.savingsImpact, 0);
  const expenseChange = completedActions.reduce((sum, a) => sum + a.expenseImpact, 0);
  
  const currentSavings = savings + additionalSavings;
  const adjustedExpenses = monthlyExpenses + expenseChange;
  const currentRunway = currentSavings / adjustedExpenses;
  const baseRunway = savings / monthlyExpenses;
  const runwayImprovement = currentRunway - baseRunway;

  const completedCount = actions.filter(a => a.completed).length;
  const actionProgress = (completedCount / actions.length) * 100;
  const runwayProgress = Math.min((currentRunway / 12) * 100, 100);

  const priorityConfig = {
    high: { color: 'text-red-600', bg: 'bg-red-50', label: 'High' },
    medium: { color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Medium' },
    low: { color: 'text-blue-600', bg: 'bg-blue-50', label: 'Low' },
  };

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Action Plan & Cash Runway</h2>
        </div>
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-green-600" />
          <span className="text-sm font-medium text-gray-600">
            {completedCount}/{actions.length} completed
          </span>
        </div>
      </div>

      {/* Cash Runway Display */}
      <div className="mb-6 p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Current Cash Runway</h3>
        </div>
        
        <div className="flex items-baseline gap-3 mb-3">
          <motion.p 
            className="text-4xl font-bold text-blue-600"
            key={currentRunway}
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            {currentRunway.toFixed(1)}
          </motion.p>
          <span className="text-lg text-gray-600">months</span>
          {runwayImprovement > 0 && (
            <motion.span 
              className="text-sm font-medium text-green-600 flex items-center gap-1"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <TrendingUp className="w-4 h-4" />
              +{runwayImprovement.toFixed(1)} mo
            </motion.span>
          )}
        </div>

        <Progress value={runwayProgress} className="h-3 mb-3" />
        
        <p className="text-sm text-gray-600 mb-4">
          {runwayProgress >= 100 ? 'Excellent runway! 🎉' : `${(12 - currentRunway).toFixed(1)} months to reach 1 year goal`}
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-white rounded-lg border border-blue-100">
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="w-4 h-4 text-blue-600" />
              <span className="text-xs text-gray-600">Total Savings</span>
            </div>
            <p className="text-lg font-bold text-blue-600">
              ${currentSavings.toLocaleString()}
            </p>
            {additionalSavings > 0 && (
              <p className="text-xs text-green-600">+${additionalSavings}</p>
            )}
          </div>

          <div className="p-3 bg-white rounded-lg border border-blue-100">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="w-4 h-4 text-red-600" />
              <span className="text-xs text-gray-600">Monthly Burn</span>
            </div>
            <p className="text-lg font-bold text-red-600">
              ${adjustedExpenses.toLocaleString()}
            </p>
            {expenseChange !== 0 && (
              <p className={`text-xs ${expenseChange < 0 ? 'text-green-600' : 'text-red-600'}`}>
                {expenseChange > 0 ? '+' : ''}${expenseChange}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Action Progress */}
      <div className="mb-6 p-4 bg-purple-50 rounded-xl border border-purple-200">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600">Overall Progress</span>
          <span className="font-medium text-purple-600">{Math.round(actionProgress)}%</span>
        </div>
        <div className="h-2 bg-purple-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-purple-600 transition-all duration-500"
            style={{ width: `${actionProgress}%` }}
          />
        </div>
      </div>

      {/* Action Items */}
      <div className="space-y-3">
        {actions.map((action) => {
          const config = priorityConfig[action.priority as keyof typeof priorityConfig];
          const runwayImpact = action.savingsImpact / monthlyExpenses + 
                               (action.expenseImpact !== 0 ? Math.abs(action.expenseImpact / monthlyExpenses) : 0);
          
          return (
            <div
              key={action.id}
              className={`p-4 rounded-xl border transition-all ${
                action.completed
                  ? 'bg-gray-50 border-gray-200'
                  : 'bg-white border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={action.completed}
                  onCheckedChange={() => toggleAction(action.id)}
                  id={`action-${action.id}`}
                  className="mt-1"
                />
                <div className="flex-1">
                  <label
                    htmlFor={`action-${action.id}`}
                    className={`cursor-pointer block mb-1 ${
                      action.completed ? 'line-through text-gray-400' : 'text-gray-900 font-medium'
                    }`}
                  >
                    {action.text}
                  </label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {action.savingsImpact > 0 && (
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                        +${action.savingsImpact} savings
                      </span>
                    )}
                    {action.expenseImpact < 0 && (
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                        ${Math.abs(action.expenseImpact)}/mo saved
                      </span>
                    )}
                    {action.expenseImpact > 0 && (
                      <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded-full">
                        +${action.expenseImpact}/mo cost
                      </span>
                    )}
                    {runwayImpact > 0 && (
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                        +{runwayImpact.toFixed(1)} months runway
                      </span>
                    )}
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
                  {config.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
