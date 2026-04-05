import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

interface AnimatedPlantProps {
  progress: number; // 0 to 100
}

export function AnimatedPlant({ progress }: AnimatedPlantProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const isGoalReached = progress >= 100;

  useEffect(() => {
    if (isGoalReached) {
      setShowConfetti(true);
      const timeout = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timeout);
    }
  }, [isGoalReached]);

  // Calculate plant growth based on progress
  const stemHeight = Math.min((progress / 100) * 180, 180);
  const showLeaves = progress >= 20;
  const leaf1Scale = Math.min(Math.max((progress - 20) / 30, 0), 1);
  const leaf2Scale = Math.min(Math.max((progress - 40) / 30, 0), 1);
  const leaf3Scale = Math.min(Math.max((progress - 60) / 30, 0), 1);
  const budScale = Math.min(Math.max((progress - 80) / 15, 0), 1);

  return (
    <div className="relative flex items-end justify-center h-80 w-full">
      {/* Pot */}
      <motion.div
        className="absolute bottom-0 w-32 h-24 bg-gradient-to-b from-orange-600 to-orange-700 rounded-b-2xl"
        style={{ clipPath: 'polygon(15% 0%, 85% 0%, 100% 100%, 0% 100%)' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="absolute top-2 left-0 right-0 h-1 bg-orange-800" />
      </motion.div>

      {/* Soil */}
      <motion.div
        className="absolute bottom-16 w-28 h-8 bg-amber-900 rounded-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      />

      {/* Plant container - positioned at pot center */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2">
        {/* Stem */}
        <motion.div
          className="absolute left-1/2 -translate-x-1/2 bottom-0 w-4 bg-gradient-to-t from-green-700 via-green-600 to-green-500 rounded-t-full origin-bottom shadow-sm"
          initial={{ height: 0 }}
          animate={{ height: stemHeight }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />

        {/* Leaf 1 - Bottom Left (20-50% progress) */}
        {showLeaves && (
          <motion.div
            className="absolute left-1/2"
            style={{ bottom: stemHeight * 0.3, marginLeft: -2 }}
            initial={{ scale: 0, rotate: 0, x: 0 }}
            animate={{ 
              scale: leaf1Scale, 
              rotate: -60,
              x: -25
            }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <svg width="50" height="35" viewBox="0 0 50 35">
              <ellipse cx="25" cy="17.5" rx="22" ry="15" fill="#22c55e" />
              <path d="M 47 17.5 Q 25 17.5 25 17.5" stroke="#16a34a" strokeWidth="2.5" fill="none" />
            </svg>
          </motion.div>
        )}

        {/* Leaf 2 - Middle Right (40-70% progress) */}
        {progress >= 40 && (
          <motion.div
            className="absolute left-1/2"
            style={{ bottom: stemHeight * 0.5, marginLeft: -2 }}
            initial={{ scale: 0, rotate: 0, x: 0 }}
            animate={{ 
              scale: leaf2Scale, 
              rotate: 60,
              x: 25
            }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <svg width="50" height="35" viewBox="0 0 50 35">
              <ellipse cx="25" cy="17.5" rx="22" ry="15" fill="#22c55e" />
              <path d="M 3 17.5 Q 25 17.5 25 17.5" stroke="#16a34a" strokeWidth="2.5" fill="none" />
            </svg>
          </motion.div>
        )}

        {/* Leaf 3 - Upper Left (60-90% progress) */}
        {progress >= 60 && (
          <motion.div
            className="absolute left-1/2"
            style={{ bottom: stemHeight * 0.7, marginLeft: -2 }}
            initial={{ scale: 0, rotate: 0, x: 0 }}
            animate={{ 
              scale: leaf3Scale, 
              rotate: -55,
              x: -28
            }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <svg width="50" height="35" viewBox="0 0 50 35">
              <ellipse cx="25" cy="17.5" rx="22" ry="15" fill="#22c55e" />
              <path d="M 47 17.5 Q 25 17.5 25 17.5" stroke="#16a34a" strokeWidth="2.5" fill="none" />
            </svg>
          </motion.div>
        )}

        {/* Flower Bud (80-95% progress) */}
        {progress >= 80 && !isGoalReached && (
          <motion.div
            className="absolute left-1/2 -translate-x-1/2"
            style={{ bottom: stemHeight }}
            initial={{ scale: 0 }}
            animate={{ scale: budScale }}
            transition={{ duration: 0.6 }}
          >
            <div className="w-8 h-10 bg-gradient-to-b from-green-500 to-green-600 rounded-full" />
          </motion.div>
        )}

        {/* Blooming Flower (100% progress) */}
        {isGoalReached && (
          <motion.div
            className="absolute left-1/2 -translate-x-1/2"
            style={{ bottom: stemHeight + 5 }}
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
          >
            {/* Outer Petals Layer */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={`outer-${i}`}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                style={{
                  transform: `rotate(${i * 45}deg)`,
                  transformOrigin: 'center',
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3 + i * 0.05, duration: 0.4 }}
              >
                <div className="w-7 h-9 bg-gradient-to-t from-pink-500 to-pink-300 rounded-full transform translate-y-[-12px]" />
              </motion.div>
            ))}

            {/* Inner Petals Layer */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={`inner-${i}`}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                style={{
                  transform: `rotate(${i * 45 + 22.5}deg)`,
                  transformOrigin: 'center',
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5 + i * 0.05, duration: 0.4 }}
              >
                <div className="w-5 h-7 bg-gradient-to-t from-pink-400 to-pink-200 rounded-full transform translate-y-[-9px]" />
              </motion.div>
            ))}

            {/* Flower Center */}
            <motion.div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full border-3 border-yellow-600 shadow-lg"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.9, duration: 0.3 }}
            >
              {/* Center details */}
              <div className="absolute inset-1 bg-yellow-400 rounded-full" />
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-0.5 h-1 bg-orange-600 rounded-full left-1/2 top-1/2 -translate-x-1/2"
                  style={{
                    transform: `rotate(${i * 30}deg) translateY(-6px)`,
                    transformOrigin: 'center',
                  }}
                />
              ))}
            </motion.div>
          </motion.div>
        )}
      </div>

      {/* Celebration particles */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                left: '50%',
                top: '20%',
                width: Math.random() * 8 + 4,
                height: Math.random() * 8 + 4,
                backgroundColor: ['#fbbf24', '#f59e0b', '#fb923c', '#f472b6', '#ec4899'][
                  Math.floor(Math.random() * 5)
                ],
              }}
              initial={{ opacity: 1, scale: 0 }}
              animate={{
                opacity: 0,
                scale: 1,
                x: (Math.random() - 0.5) * 200,
                y: Math.random() * -150 + (Math.random() * 100),
                rotate: Math.random() * 360,
              }}
              transition={{ duration: 2, ease: 'easeOut' }}
            />
          ))}
        </div>
      )}

      {/* Progress Percentage Display */}
      <motion.div
        className="absolute -bottom-8 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <p className="text-sm font-medium text-gray-600">
          {Math.round(progress)}% {isGoalReached && '🎉'}
        </p>
      </motion.div>
    </div>
  );
}