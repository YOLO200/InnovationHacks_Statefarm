import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Target, TrendingUp, CheckCircle2, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import type { SurvivalOptimization } from '../../../lib/gemini';

interface SurvivalPlanProps {
  optimizations?: SurvivalOptimization[];
  runoutMonths?: number;
  extendedMonths?: number;
}

export function SurvivalPlan({ optimizations = [], runoutMonths = 0, extendedMonths = 0 }: SurvivalPlanProps) {
  return (
    <Card className="p-6 border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <Target className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Optimized Survival Plan</h3>
            <p className="text-sm text-gray-600">AI-generated recovery strategy</p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-sm text-gray-600">Extended Runway</p>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-red-600 line-through">{runoutMonths.toFixed(1)}</span>
            <ArrowRight className="w-4 h-4 text-gray-400" />
            <span className="text-2xl font-bold text-green-600">{extendedMonths.toFixed(1)} months</span>
          </div>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        {optimizations.map((opt, index) => (
          <motion.div
            key={index}
            className="p-4 bg-white rounded-xl border border-green-200"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                <h4 className="font-semibold text-gray-900">{opt.action}</h4>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-bold rounded-full flex-shrink-0 ml-2">
                {opt.impact}
              </span>
            </div>
            <ul className="ml-7 space-y-1">
              {opt.items.map((item, i) => (
                <li key={i} className="text-sm text-gray-600 flex items-center gap-2">
                  <span className="w-1 h-1 bg-green-600 rounded-full flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>

      <motion.div
        className="flex items-center gap-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <Button className="flex-1 bg-green-600 hover:bg-green-700 group">
          <TrendingUp className="w-4 h-4 mr-2" />
          Activate Survival Plan
          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
        <Button variant="outline" className="border-green-300 text-green-700 hover:bg-green-50">
          Customize Plan
        </Button>
      </motion.div>
    </Card>
  );
}
