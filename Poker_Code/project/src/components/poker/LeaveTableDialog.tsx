import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface LeaveTableDialogProps {
  onConfirm: () => void;
  onCancel: () => void;
  initialBuyIn: number;
  currentStack: number;
  profitLoss: number;
}

export function LeaveTableDialog({
  onConfirm,
  onCancel,
  initialBuyIn,
  currentStack,
  profitLoss
}: LeaveTableDialogProps) {
  const isProfitable = profitLoss >= 0;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black/70" onClick={onCancel} />
      <div className="relative bg-gray-800 w-[400px] rounded-lg shadow-xl border border-gray-700 overflow-hidden">
        <div className={`p-3 ${isProfitable ? 'bg-green-900' : 'bg-red-900'}`}>
          <h2 className="text-white font-semibold">Leave Table</h2>
        </div>
        <div className="p-6">
          <div className="mb-6 space-y-4">
            <p className="text-gray-300">
              Are you sure you want to leave the table? Your current chip stack will be added to your account balance.
            </p>
            
            <div className="bg-gray-700 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-gray-400">Initial Buy-In:</div>
                <div className="text-white font-mono text-right">${initialBuyIn.toFixed(2)}</div>
                
                <div className="text-gray-400">Current Stack:</div>
                <div className="text-white font-mono text-right">${currentStack.toFixed(2)}</div>
                
                <div className="text-gray-400 border-t border-gray-600 pt-2 mt-1">
                  {isProfitable ? 'Profit:' : 'Loss:'}
                </div>
                <div className={`font-mono text-right border-t border-gray-600 pt-2 mt-1 font-bold ${
                  isProfitable ? 'text-green-400' : 'text-red-400'
                }`}>
                  <span className="flex items-center justify-end gap-1">
                    {isProfitable ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    ${Math.abs(profitLoss).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-gray-200 rounded transition"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded transition"
            >
              Leave Table
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}