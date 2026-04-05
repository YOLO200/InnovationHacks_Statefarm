import { motion } from 'motion/react';
import { Card } from '../ui/card';
import { Sparkles } from 'lucide-react';

interface HeroSectionProps {
  score: number;
  status: 'stable' | 'moderate' | 'risk';
}

export function HeroSection({ score, status }: HeroSectionProps) {
  const statusConfig = {
    stable: { color: 'text-green-600', bg: 'bg-green-50', label: 'Stable', ring: 'stroke-green-600' },
    moderate: { color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Moderate Risk', ring: 'stroke-yellow-600' },
    risk: { color: 'text-red-600', bg: 'bg-red-50', label: 'High Risk', ring: 'stroke-red-600' },
  };

  const config = statusConfig[status];
  const circumference = 2 * Math.PI * 70;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <Card className="p-8 bg-gradient-to-br from-blue-50 to-indigo-50 border-none">
      <div className="flex items-center justify-between">
        {/* Left Side */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-600">AI-Powered Analysis</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Your Financial Survival Overview
          </h1>
          <p className="text-gray-600 mb-4">
            Prepared for uncertainty. Powered by AI.
          </p>
          <div className={`inline-flex items-center px-4 py-2 rounded-full ${config.bg}`}>
            <span className={`${config.color} font-medium`}>{config.label}</span>
          </div>
        </div>

        {/* Right Side - Score Circle */}
        <div className="relative">
          <svg width="180" height="180" className="transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="90"
              cy="90"
              r="70"
              stroke="#e5e7eb"
              strokeWidth="12"
              fill="none"
            />
            {/* Progress circle */}
            <motion.circle
              cx="90"
              cy="90"
              r="70"
              className={config.ring}
              strokeWidth="12"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              className="text-4xl font-bold text-gray-900"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              {score}
            </motion.span>
            <span className="text-sm text-gray-500">Health Score</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
