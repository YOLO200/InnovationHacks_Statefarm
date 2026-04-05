import { Card } from '../ui/card';
import { Checkbox } from '../ui/checkbox';
import { Target, TrendingUp } from 'lucide-react';
import { useState } from 'react';

const initialActions = [
  { id: 1, text: 'Build emergency fund (+$1,000)', priority: 'high', completed: false },
  { id: 2, text: 'Reduce subscription spending', priority: 'high', completed: false },
  { id: 3, text: 'Get basic health insurance', priority: 'medium', completed: false },
  { id: 4, text: 'Review and optimize monthly expenses', priority: 'medium', completed: false },
  { id: 5, text: 'Set up automatic savings transfer', priority: 'low', completed: false },
];

export function ActionPlan() {
  const [actions, setActions] = useState(initialActions);

  const toggleAction = (id: number) => {
    setActions(actions.map(action => 
      action.id === id ? { ...action, completed: !action.completed } : action
    ));
  };

  const completedCount = actions.filter(a => a.completed).length;
  const progress = (completedCount / actions.length) * 100;

  const priorityConfig = {
    high: { color: 'text-red-600', bg: 'bg-red-50', label: 'High' },
    medium: { color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Medium' },
    low: { color: 'text-blue-600', bg: 'bg-blue-50', label: 'Low' },
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Action Plan</h2>
        </div>
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-green-600" />
          <span className="text-sm font-medium text-gray-600">
            {completedCount}/{actions.length} completed
          </span>
        </div>
      </div>

      <div className="mb-6 p-4 bg-blue-50 rounded-xl">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600">Overall Progress</span>
          <span className="font-medium text-blue-600">{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="space-y-3">
        {actions.map((action) => {
          const config = priorityConfig[action.priority as keyof typeof priorityConfig];
          
          return (
            <div
              key={action.id}
              className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                action.completed
                  ? 'bg-gray-50 border-gray-200'
                  : 'bg-white border-gray-200 hover:border-blue-300'
              }`}
            >
              <Checkbox
                checked={action.completed}
                onCheckedChange={() => toggleAction(action.id)}
                id={`action-${action.id}`}
              />
              <label
                htmlFor={`action-${action.id}`}
                className={`flex-1 cursor-pointer ${
                  action.completed ? 'line-through text-gray-400' : 'text-gray-900'
                }`}
              >
                {action.text}
              </label>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
                {config.label}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
