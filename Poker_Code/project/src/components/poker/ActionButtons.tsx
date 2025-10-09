import React, { useState } from 'react';
import { PlayerAction } from '../../types/poker';

interface ActionButtonsProps {
  currentBet: number;
  minRaise: number;
  playerStack: number;
  onAction: (action: PlayerAction, amount?: number) => void;
}

export function ActionButtons({
  currentBet,
  minRaise,
  playerStack,
  onAction
}: ActionButtonsProps) {
  const [raiseAmount, setRaiseAmount] = useState(minRaise);

  return (
    <div className="flex items-center gap-4 bg-gray-800 p-4 rounded-lg">
      <button
        onClick={() => onAction('fold')}
        className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-500"
      >
        Fold
      </button>

      {currentBet === 0 ? (
        <button
          onClick={() => onAction('check')}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
        >
          Check
        </button>
      ) : (
        <button
          onClick={() => onAction('call')}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
        >
          Call ${currentBet}
        </button>
      )}

      <div className="flex items-center gap-2">
        <input
          type="range"
          min={minRaise}
          max={playerStack}
          value={raiseAmount}
          onChange={(e) => setRaiseAmount(parseInt(e.target.value))}
          className="w-32"
        />
        <button
          onClick={() => onAction(currentBet === 0 ? 'bet' : 'raise', raiseAmount)}
          className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-500"
        >
          {currentBet === 0 ? 'Bet' : 'Raise'} ${raiseAmount}
        </button>
      </div>
    </div>
  );
}