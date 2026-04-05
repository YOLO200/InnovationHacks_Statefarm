import { Card } from '../ui/card';
import { Sparkles, Stethoscope, CreditCard, Lightbulb, Home } from 'lucide-react';
import { motion } from 'motion/react';
import type { CrisisRecommendation } from '../../../lib/gemini';

interface SmartRecommendationsProps {
  recommendations?: CrisisRecommendation[];
}

const categoryConfig = {
  medical:   { bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-600',   icon: 'bg-blue-100',   Icon: Stethoscope },
  financial: { bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-600',  icon: 'bg-green-100',  Icon: CreditCard  },
  general:   { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-600', icon: 'bg-purple-100', Icon: Lightbulb   },
  housing:   { bg: 'bg-pink-50',   border: 'border-pink-200',   text: 'text-pink-600',   icon: 'bg-pink-100',   Icon: Home        },
};

export function SmartRecommendations({ recommendations = [] }: SmartRecommendationsProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg">
          <Sparkles className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Smart Recommendations</h3>
          <p className="text-sm text-gray-600">AI-powered cost-saving strategies</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recommendations.map((rec, index) => {
          const config = categoryConfig[rec.category] ?? categoryConfig.general;
          const { Icon } = config;

          return (
            <motion.div
              key={index}
              className={`p-4 rounded-xl border-2 ${config.bg} ${config.border} hover:shadow-md transition-all cursor-pointer`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 ${config.icon} rounded-lg flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${config.text}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold text-gray-900 text-sm">{rec.title}</h4>
                    <span className={`text-xs font-bold ${config.text} px-2 py-1 rounded-full ${config.bg} ml-2 flex-shrink-0`}>
                      {rec.saving}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{rec.detail}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </Card>
  );
}
