import React from 'react';
import { PokerTable } from '../components/PokerTable';
import { TestPokerTable } from '../components/poker/test/TestPokerTable';

interface PokerTableModalProps {
  table: {
    id: string;
    name: string;
    gameType: string;
    stakes: string;
    buyIn: string;
    seats: number;
  };
  onClose: () => void;
}

export function PokerTableModal({ table, onClose }: PokerTableModalProps) {
  // Use TestPokerTable for the test table
  if (table.id === '2.7') {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div className="fixed inset-0 bg-black/75" onClick={onClose} />
        <div className="relative z-10">
          <TestPokerTable
            id={table.id}
            name={table.name}
            gameType={table.gameType}
            stakes={table.stakes}
            buyIn={table.buyIn}
            maxPlayers={table.seats}
            onClose={onClose}
          />
        </div>
      </div>
    );
  }

  // Use regular PokerTable for all other tables
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="fixed inset-0 bg-black/75" onClick={onClose} />
      <div className="relative z-10">
        <PokerTable
          id={table.id}
          name={table.name}
          gameType={table.gameType}
          stakes={table.stakes}
          buyIn={table.buyIn}
          maxPlayers={table.seats}
          currentHand="167583-7"
          onClose={onClose}
        />
      </div>
    </div>
  );
}