import React from 'react';
import { Suit, Rank } from '../../types/poker';

interface CardProps {
  suit: Suit;
  rank: Rank;
  faceDown?: boolean;
}

const suitSymbols: Record<Suit, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠'
};

const suitColors: Record<Suit, string> = {
  hearts: 'text-red-500',
  diamonds: 'text-red-500',
  clubs: 'text-gray-900',
  spades: 'text-gray-900'
};

export function Card({ suit, rank, faceDown = false }: CardProps) {
  if (faceDown) {
    return (
      <div className="w-16 h-24 bg-blue-600 rounded-lg shadow-md border-2 border-white" />
    );
  }

  return (
    <div className="w-16 h-24 bg-white rounded-lg shadow-md border-2 border-gray-200 flex flex-col items-center justify-between p-2">
      <div className={`text-lg font-bold ${suitColors[suit]}`}>
        {rank}
      </div>
      <div className={`text-3xl ${suitColors[suit]}`}>
        {suitSymbols[suit]}
      </div>
      <div className={`text-lg font-bold ${suitColors[suit]} rotate-180`}>
        {rank}
      </div>
    </div>
  );
}