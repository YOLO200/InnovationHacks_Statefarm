import { Card } from '../ui/card';
import { AlertTriangle, TrendingDown } from 'lucide-react';
import { motion } from 'motion/react';

interface RiskWarningProps {
  runoutMonths?: number;
}

export function RiskWarning({ runoutMonths = 0 }: RiskWarningProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <Card className="p-6 bg-gradient-to-r from-red-500 to-orange-500 border-none text-white">
        <div className="flex items-start gap-4">
          <motion.div
            className="p-3 bg-white/20 backdrop-blur-sm rounded-xl"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <AlertTriangle className="w-6 h-6 text-white" />
          </motion.div>

          <div className="flex-1">
            <h3 className="text-xl font-bold mb-2">Critical Risk Warning</h3>
            <div className="flex items-baseline gap-2 mb-3">
              <TrendingDown className="w-5 h-5" />
              <p className="text-lg">
                You may run out of savings in{' '}
                <span className="font-bold text-2xl">{runoutMonths.toFixed(1)} months</span>
                {' '}after this event
              </p>
            </div>
            <p className="text-white/90 text-sm">
              Immediate action required to extend your financial runway and avoid critical cash shortage.
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
