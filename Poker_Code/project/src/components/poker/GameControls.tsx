import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface GameControlsProps {
  isActive: boolean;
  currentBet: number;
  minRaise: number;
  stack: number;
  onAction: (action: string, amount?: number) => void;
}

export function GameControls({
  isActive,
  currentBet,
  minRaise,
  stack,
  onAction
}: GameControlsProps) {
  const [raiseAmount, setRaiseAmount] = useState(minRaise);
  const [timeLeft, setTimeLeft] = useState(30);

  useEffect(() => {
    if (!isActive) return;

    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          onAction('fold');
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, onAction]);

  useEffect(() => {
    setRaiseAmount(minRaise);
  }, [minRaise]);

  if (!isActive) {
    return (
      <div className="p-4 bg-gray-900 border-b border-gray-700">
        <div className="text-gray-400 text-center">
          Waiting for your turn...
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-900 border-b border-gray-700">
      {/* Timer */}
      <div className="flex justify-center mb-4">
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
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          onClick={() => onAction('fold')}
          className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded transition"
        >
          Fold
        </button>

        {currentBet === 0 ? (
          <button
            onClick={() => onAction('check')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded transition"
          >
            Check
          </button>
        ) : (
          <button
            onClick={() => onAction('call')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded transition"
          >
            Call ${currentBet}
          </button>
        )}
      </div>

      {/* Raise Controls */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={minRaise}
            max={stack}
            value={raiseAmount}
            onChange={(e) => setRaiseAmount(parseInt(e.target.value))}
            className="flex-1"
          />
          <span className="text-white font-mono w-20 text-right">
            ${raiseAmount}
          </span>
        </div>

        <button
          onClick={() => onAction(currentBet === 0 ? 'bet' : 'raise', raiseAmount)}
          disabled={raiseAmount < minRaise || raiseAmount > stack}
          className="w-full px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded transition disabled:opacity-50"
        >
          {currentBet === 0 ? 'Bet' : 'Raise'} ${raiseAmount}
        </button>
      </div>

      {/* Stack Info */}
      <div className="mt-4 text-center text-gray-400">
        Your stack: ${stack}
      </div>
    </div>
  );
}