import React from 'react';
import { Users, PlaySquare, Trophy } from 'lucide-react';

interface StatsBarProps {
  activeView: 'lobby' | 'ring-games' | 'tournaments' | 'sitngos';
  onViewChange: (view: 'lobby' | 'ring-games' | 'tournaments' | 'sitngos') => void;
}

export function StatsBar({ activeView, onViewChange }: StatsBarProps) {
  return (
    <div className="grid grid-cols-4 gap-1 p-1 bg-blue-900">
      <button 
        onClick={() => onViewChange('lobby')}
        className={`flex items-center justify-center gap-2 p-2 rounded transition ${
          activeView === 'lobby' 
            ? 'bg-blue-700 text-white' 
            : 'bg-blue-800 text-blue-100 hover:bg-blue-700'
        }`}
      >
        <Users size={18} />
        <span>Logins: 24</span>
      </button>
      <button 
        onClick={() => onViewChange('ring-games')}
        className={`flex items-center justify-center gap-2 p-2 rounded transition ${
          activeView === 'ring-games' 
            ? 'bg-blue-700 text-white' 
            : 'bg-blue-800 text-blue-100 hover:bg-blue-700'
        }`}
      >
        <PlaySquare size={18} />
        <span>Ring Games: 20</span>
      </button>
      <button 
        onClick={() => onViewChange('tournaments')}
        className={`flex items-center justify-center gap-2 p-2 rounded transition ${
          activeView === 'tournaments' 
            ? 'bg-blue-700 text-white' 
            : 'bg-blue-800 text-blue-100 hover:bg-blue-700'
        }`}
      >
        <Trophy size={18} />
        <span>Tournaments: 3</span>
      </button>
      <button 
        onClick={() => onViewChange('sitngos')}
        className={`flex items-center justify-center gap-2 p-2 rounded transition ${
          activeView === 'sitngos' 
            ? 'bg-blue-700 text-white' 
            : 'bg-blue-800 text-blue-100 hover:bg-blue-700'
        }`}
      >
        <Users size={18} />
        <span>Sit & Go's: 4</span>
      </button>
    </div>
  );
}