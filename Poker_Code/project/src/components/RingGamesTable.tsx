import React from 'react';

interface PokerTable {
  id: string;
  name: string;
  gameType: string;
  stakes: string;
  buyIn: string;
  seats: number;
  playing: number;
  waiting: number;
}

interface RingGamesTableProps {
  tables: PokerTable[];
  highlightedTableId: string | null;
  tableHandlers: Record<string, () => void>;
}

export function RingGamesTable({ tables, highlightedTableId, tableHandlers }: RingGamesTableProps) {
  return (
    <div className="flex-1 overflow-auto">
      <div className="bg-gray-700 p-2 text-gray-200 font-medium grid grid-cols-7 gap-2">
        <div>Table Name</div>
        <div>Game</div>
        <div>Stakes</div>
        <div>Buy In</div>
        <div>Seats</div>
        <div>Playing</div>
        <div>Waiting</div>
      </div>
      {tables.map((table) => (
        <div 
          key={table.id}
          onClick={tableHandlers[table.id]}
          className={`bg-gray-800 p-2 text-gray-300 grid grid-cols-7 gap-2 hover:bg-gray-700 cursor-pointer border-b border-gray-700 transition-colors duration-200 ${
            highlightedTableId === table.id ? 'bg-blue-900/50' : ''
          }`}
        >
          <div>{table.name}</div>
          <div>{table.gameType}</div>
          <div>{table.stakes}</div>
          <div>{table.buyIn}</div>
          <div>{table.seats}</div>
          <div>{table.playing}</div>
          <div>{table.waiting}</div>
        </div>
      ))}
    </div>
  );
}