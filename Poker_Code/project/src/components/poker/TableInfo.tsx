import React from 'react';
import { GamePhase } from '../../types/poker';

interface TableInfoProps {
  blinds: string;
  handNumber?: number;
  phase?: GamePhase;
  className?: string;
}

export function TableInfo({ blinds, handNumber, phase, className = '' }: TableInfoProps) {
  return (
    <div className={`bg-black/60 px-4 py-2 rounded backdrop-blur-sm ${className}`}>
      <div className="text-white">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-gray-400">Blinds:</span>{' '}
            <span className="font-medium">{blinds}</span>
          </div>
          {handNumber && (
            <div>
              <span className="text-gray-400">Hand:</span>{' '}
              <span className="font-medium">#{handNumber}</span>
            </div>
          )}
          {phase && (
            <div>
              <span className="text-gray-400">Phase:</span>{' '}
              <span className="font-medium capitalize">{phase}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}