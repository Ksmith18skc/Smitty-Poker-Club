import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface TimerProps {
  duration: number;
  onExpire: () => void;
  className?: string;
}

export function Timer({ duration, onExpire, className = '' }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    if (timeLeft <= 0) {
      onExpire();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(t => t - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onExpire]);

  return (
    <div className={`relative ${className}`}>
      <motion.div
        initial={{ scale: 1 }}
        animate={{ scale: timeLeft <= 5 ? [1, 1.2, 1] : 1 }}
        transition={{ duration: 0.3, repeat: timeLeft <= 5 ? Infinity : 0 }}
        className={`
          w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl
          ${timeLeft <= 5 ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'}
        `}
      >
        {timeLeft}
      </motion.div>
      <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
        <span className="text-white text-sm">Time Remaining</span>
      </div>
    </div>
  );
}