import { Card } from '../ui/card';
import { Checkbox } from '../ui/checkbox';
import { AlertTriangle, Clock, ShieldCheck, Info } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'motion/react';
import type { CrisisAction } from '../../../lib/gemini';

interface ImmediateActionsProps {
  actions?: CrisisAction[];
}

export function ImmediateActions({ actions = [] }: ImmediateActionsProps) {
  const [completed, setCompleted] = useState<number[]>([]);

  const toggleAction = (id: number) => {
    setCompleted(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <Card className="p-6 border-red-200 bg-gradient-to-br from-red-50 to-orange-50">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-red-100 rounded-lg">
          <Clock className="w-5 h-5 text-red-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Immediate Actions</h3>
          <p className="text-sm text-gray-600">Follow these steps in order</p>
        </div>
        <div className="ml-auto text-sm text-gray-500">
          {completed.length}/{actions.length} done
        </div>
      </div>

      <div className="space-y-3">
        {actions.map((action, index) => {
          const isCompleted = completed.includes(index);
          const Icon = action.urgent ? (index === 0 ? ShieldCheck : AlertTriangle) : Info;

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative pl-8 ${index !== actions.length - 1 ? 'pb-6' : ''}`}
            >
              {/* Timeline line */}
              {index !== actions.length - 1 && (
                <div className="absolute left-3.5 top-8 w-0.5 h-full bg-red-200" />
              )}

              {/* Timeline dot */}
              <div
                className={`absolute left-0 top-1 w-7 h-7 rounded-full flex items-center justify-center ${
                  isCompleted ? 'bg-green-500' : action.urgent ? 'bg-red-500' : 'bg-gray-300'
                }`}
              >
                {isCompleted ? (
                  <span className="text-white text-xs">✓</span>
                ) : (
                  <span className="text-white text-xs font-bold">{index + 1}</span>
                )}
              </div>

              <div
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  isCompleted
                    ? 'bg-white border-green-200'
                    : action.urgent
                    ? 'bg-white border-red-300 shadow-sm'
                    : 'bg-white border-gray-200'
                }`}
                onClick={() => toggleAction(index)}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${action.urgent ? 'bg-red-100' : 'bg-gray-100'}`}>
                    <Icon className={`w-5 h-5 ${action.urgent ? 'text-red-600' : 'text-gray-600'}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className={`font-medium ${isCompleted ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                        {action.text}
                      </p>
                      {action.urgent && !isCompleted && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                          URGENT
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{action.detail}</p>
                  </div>
                  <Checkbox
                    checked={isCompleted}
                    onCheckedChange={() => toggleAction(index)}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </Card>
  );
}
