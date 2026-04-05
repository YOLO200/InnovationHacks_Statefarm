import { Card } from '../components/ui/card';
import { AlertCircle, Activity } from 'lucide-react';
import { ImmediateActions } from '../components/crisis/ImmediateActions';
import { FinancialImpact } from '../components/crisis/FinancialImpact';
import { SmartRecommendations } from '../components/crisis/SmartRecommendations';
import { RiskWarning } from '../components/crisis/RiskWarning';
import { SurvivalPlan } from '../components/crisis/SurvivalPlan';
import { motion } from 'motion/react';

export function CrisisAdvisor() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Crisis Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="p-6 bg-gradient-to-r from-red-600 to-orange-600 border-none text-white">
          <div className="flex items-center gap-4">
            <motion.div
              className="p-3 bg-white/20 backdrop-blur-sm rounded-xl"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <AlertCircle className="w-8 h-8 text-white" />
            </motion.div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-4 h-4" />
                <span className="text-sm font-medium uppercase tracking-wide">Active Crisis Scenario</span>
              </div>
              <h1 className="text-3xl font-bold mb-1">Medical Emergency Detected</h1>
              <p className="text-white/90">Here's what you should do immediately</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-white/80 mb-1">Last Updated</p>
              <p className="text-lg font-semibold">Just now</p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Section A: Immediate Actions */}
      <ImmediateActions />

      {/* Section B: Financial Impact */}
      <FinancialImpact />

      {/* Section C: Smart Recommendations */}
      <SmartRecommendations />

      {/* Section D: Risk Warning */}
      <RiskWarning />

      {/* Section E: Survival Plan */}
      <SurvivalPlan />
    </div>
  );
}
