import React from 'react';
import { X } from 'lucide-react';

interface TableInfoPanelProps {
  table: {
    id: string;
    name: string;
    gameType: string;
    stakes: string;
    buyIn: string;
    seats: number;
    playing: number;
    waiting: number;
  };
  onClose: () => void;
}

export function TableInfoPanel({ table, onClose }: TableInfoPanelProps) {
  // For mixed choice tables, show the game rotation
  const mixedChoiceGames = [
    'NL Hold\'em',
    'PL Omaha',
    'PL Omaha-5 Hi-Lo',
    'PL Courchevel'
  ];

  const getRakeStructure = (players: number) => {
    const rakeMap = {
      2: '1.50% (2 cap)',
      3: '3% (2 cap)',
      4: '5% (2 cap)',
      5: '5% (2 cap)',
      6: '6% (2 cap)',
      7: '7% (2 cap)',
      8: '7% (2 cap)',
      9: '0% (2 cap)'
    };
    return rakeMap[players as keyof typeof rakeMap] || '0% (2 cap)';
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-gray-800 w-[500px] rounded-lg shadow-xl border border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="bg-blue-900 p-3 flex items-center justify-between">
          <h2 className="text-white font-semibold">Information - {table.id}</h2>
          <button onClick={onClose} className="text-gray-300 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 max-h-[600px] overflow-y-auto">
          <div className="space-y-4 text-gray-300">
            <div className="border-b border-gray-700 pb-2">
              <h3 className="text-white mb-2">Cash Game - {table.gameType}</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <div>Table name:</div>
                <div>{table.name}</div>
                <div>Type:</div>
                <div>Ring Game</div>
                <div>Game:</div>
                <div>{table.gameType}</div>
              </div>
            </div>

            {table.gameType === 'Mixed Choice' && (
              <div className="border-b border-gray-700 pb-2">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  {mixedChoiceGames.map((game, index) => (
                    <React.Fragment key={game}>
                      <div>{index + 1}:</div>
                      <div>{game}</div>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}

            <div className="border-b border-gray-700 pb-2">
              <h3 className="text-white mb-2">Permissions:</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <div>Visible:</div>
                <div>Yes</div>
                <div>Play:</div>
                <div>Yes</div>
                <div>Observe:</div>
                <div>Yes</div>
                <div>Player chat:</div>
                <div>Yes</div>
                <div>Observer chat:</div>
                <div>Yes</div>
              </div>
            </div>

            <div className="border-b border-gray-700 pb-2">
              <h3 className="text-white mb-2">Game Settings:</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <div>Seats:</div>
                <div>{table.seats}</div>
                <div>Buy in:</div>
                <div>{table.buyIn}</div>
                <div>Blinds:</div>
                <div>{table.stakes}</div>
                <div>Ante:</div>
                <div>0</div>
                <div>Smallest chip:</div>
                <div>0.01</div>
                <div>Straddle:</div>
                <div>Yes</div>
                <div>Run-it-twice:</div>
                <div>No</div>
              </div>
            </div>

            <div className="border-b border-gray-700 pb-2">
              <h3 className="text-white mb-2">Rake:</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {[2, 3, 4, 5, 6, 7, 8, 9].map(players => (
                  <React.Fragment key={players}>
                    <div>{players} players:</div>
                    <div>{getRakeStructure(players)}</div>
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-white mb-2">Time Settings:</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <div>Turn clock:</div>
                <div>20 seconds</div>
                <div>Time bank:</div>
                <div>20 seconds</div>
                <div>Disconnect protection:</div>
                <div>30 seconds</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-700 p-3 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-gray-200 rounded transition"
          >
            OK
          </button>
          <button
            className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-gray-200 rounded transition"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}