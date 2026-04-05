import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { AlertTriangle, TrendingDown, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router';

export function ScenarioSimulation() {
  return (
    <Card className="p-6 bg-gradient-to-br from-red-50 to-orange-50 border-red-200">
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2 bg-red-100 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-red-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-1">
            What If You Lose Your Job?
          </h2>
          <p className="text-sm text-gray-600">
            AI-powered scenario analysis
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-white rounded-xl border border-red-100">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-red-600" />
              <span className="text-sm text-gray-600">New Runway</span>
            </div>
            <motion.p
              className="text-2xl font-bold text-red-600"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              2.8 months
            </motion.p>
          </div>

          <div className="p-4 bg-white rounded-xl border border-red-100">
            <span className="text-sm text-gray-600 mb-2 block">Risk Level</span>
            <div className="inline-flex items-center px-3 py-1 bg-red-100 rounded-full">
              <span className="text-sm font-medium text-red-700">High Risk</span>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Link to="/scenarios">
            <Button className="w-full bg-red-600 hover:bg-red-700 group">
              View Survival Plan
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </Card>
  );
}