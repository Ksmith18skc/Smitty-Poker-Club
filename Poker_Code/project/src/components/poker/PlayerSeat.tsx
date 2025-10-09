import React from 'react';
import { Card } from './Card';

interface PlayerSeatProps {
  position: number;
  player?: {
    id: string;
    name: string;
    stack: number;
    bet: number;
    status: string;
    cards: { suit: string; rank: string; }[];
    lastAction?: string;
    lastActionAmount?: number;
  };
  isDealer: boolean;
  isActive: boolean;
  onSeatClick: () => void;
}

const seatPositions = [
  'top-4 left-1/2 -translate-x-1/2',                    // 0: top center
  'top-1/4 right-8',                                    // 1: top right
  'top-1/2 right-4 -translate-y-1/2',                   // 2: middle right
  'bottom-1/4 right-8',                                 // 3: bottom right
  'bottom-4 left-1/2 -translate-x-1/2',                 // 4: bottom center
  'bottom-1/4 left-8',                                  // 5: bottom left
  'top-1/2 left-4 -translate-y-1/2',                    // 6: middle left
  'top-1/4 left-8',                                     // 7: top left
  'top-1/3 left-1/2 -translate-x-1/2'                   // 8: top center (closer)
];

export function PlayerSeat({ position, player, isDealer, isActive, onSeatClick }: PlayerSeatProps) {
  return (
    <div
      className={`absolute ${seatPositions[position]} transition-all duration-200`}
      onClick={onSeatClick}
    >
      <div className={`
        w-48 h-32 rounded-lg
        ${player ? 'bg-gray-800' : 'bg-gray-800/50'}
        ${isActive ? 'ring-4 ring-yellow-400' : ''}
        flex flex-col items-center justify-center gap-2
        cursor-pointer hover:bg-gray-700
      `}>
        {player ? (
          <>
            <div className="text-white font-medium">{player.name}</div>
            <div className="text-green-400 font-bold">${player.stack}</div>
            
            {player.bet > 0 && (
              <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
                <div className="bg-blue-600 px-3 py-1 rounded-full text-white text-sm">
                  ${player.bet}
                </div>
              </div>
            )}

            {player.lastAction && (
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                <div className="bg-gray-700 px-3 py-1 rounded-full text-gray-200 text-sm">
                  {player.lastAction}
                  {player.lastActionAmount && ` $${player.lastActionAmount}`}
                </div>
              </div>
            )}

            <div className="absolute -top-12 flex gap-1">
              {player.cards.map((card, i) => (
                <Card
                  key={i}
                  suit={card.suit as any}
                  rank={card.rank as any}
                  faceDown={player.status === 'folded'}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="text-gray-400">Empty Seat</div>
        )}

        {isDealer && (
          <div className="absolute -left-8 top-1/2 transform -translate-y-1/2">
            <div className="bg-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
              D
            </div>
          </div>
        )}
      </div>
    </div>
  );
}