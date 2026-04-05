import { Card } from '../ui/card';
import { Sparkles, Hospital, CreditCard, PauseCircle, Heart } from 'lucide-react';
import { motion } from 'motion/react';

const recommendations = [
  {
    icon: Hospital,
    title: 'Choose urgent care instead of ER',
    saving: '$1,500',
    detail: 'Save ~$1,500 for non-life-threatening conditions',
    color: 'blue',
  },
  {
    icon: CreditCard,
    title: 'Use this credit option',
    saving: 'Low APR',
    detail: 'Medical credit line at 0% APR for 12 months',
    color: 'green',
  },
  {
    icon: PauseCircle,
    title: 'Pause subscriptions',
    saving: '$300/mo',
    detail: 'Free up $300/month from non-essential services',
    color: 'purple',
  },
  {
    icon: Heart,
    title: 'Check financial aid eligibility',
    saving: 'Up to 80%',
    detail: 'Hospital assistance programs may cover 40-80% of costs',
    color: 'pink',
  },
];

const colorConfig = {
  blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600', icon: 'bg-blue-100' },
  green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-600', icon: 'bg-green-100' },
  purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-600', icon: 'bg-purple-100' },
  pink: { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-600', icon: 'bg-pink-100' },
};

export function SmartRecommendations() {
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
          const Icon = rec.icon;
          const colors = colorConfig[rec.color as keyof typeof colorConfig];
          
          return (
            <motion.div
              key={index}
              className={`p-4 rounded-xl border-2 ${colors.bg} ${colors.border} hover:shadow-md transition-all cursor-pointer`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 ${colors.icon} rounded-lg flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${colors.text}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold text-gray-900 text-sm">{rec.title}</h4>
                    <span className={`text-xs font-bold ${colors.text} px-2 py-1 rounded-full ${colors.bg}`}>
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
