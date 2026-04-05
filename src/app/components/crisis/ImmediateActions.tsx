import { Card } from '../ui/card';
import { Checkbox } from '../ui/checkbox';
import { Hospital, Shield, AlertTriangle, Phone, Clock } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'motion/react';

const actions = [
  {
    id: 1,
    icon: Hospital,
    text: 'Visit nearest in-network hospital',
    detail: 'St. Mary\'s Medical Center - 2.3 miles away',
    urgent: true,
  },
  {
    id: 2,
    icon: Shield,
    text: 'Use insurance provider (if available)',
    detail: 'Call Blue Cross: 1-800-XXX-XXXX',
    urgent: true,
  },
  {
    id: 3,
    icon: AlertTriangle,
    text: 'Avoid high-cost ER unless critical',
    detail: 'Consider urgent care for non-life-threatening issues',
    urgent: false,
  },
  {
    id: 4,
    icon: Phone,
    text: 'Inform emergency contact',
    detail: 'Jane Doe - (555) 123-4567',
    urgent: false,
  },
];

export function ImmediateActions() {
  const [completed, setCompleted] = useState<number[]>([]);

  const toggleAction = (id: number) => {
    if (completed.includes(id)) {
      setCompleted(completed.filter(i => i !== id));
    } else {
      setCompleted([...completed, id]);
    }
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
      </div>

      <div className="space-y-3">
        {actions.map((action, index) => {
          const Icon = action.icon;
          const isCompleted = completed.includes(action.id);
          
          return (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative pl-8 ${index !== actions.length - 1 ? 'pb-6' : ''}`}
            >
              {/* Timeline Line */}
              {index !== actions.length - 1 && (
                <div className="absolute left-3.5 top-8 w-0.5 h-full bg-red-200" />
              )}
              
              {/* Timeline Dot */}
              <div className={`absolute left-0 top-1 w-7 h-7 rounded-full flex items-center justify-center ${
                isCompleted ? 'bg-green-500' : action.urgent ? 'bg-red-500' : 'bg-gray-300'
              }`}>
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
                onClick={() => toggleAction(action.id)}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${
                    action.urgent ? 'bg-red-100' : 'bg-gray-100'
                  }`}>
                    <Icon className={`w-5 h-5 ${
                      action.urgent ? 'text-red-600' : 'text-gray-600'
                    }`} />
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
                    onCheckedChange={() => toggleAction(action.id)}
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
