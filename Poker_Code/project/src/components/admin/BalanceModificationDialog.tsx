import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface BalanceModificationDialogProps {
  player: {
    id: string;
    username: string;
    balance: number;
  };
  onConfirm: (playerId: string, amount: number, reason: string) => void;
  onClose: () => void;
}

export function BalanceModificationDialog({
  player,
  onConfirm,
  onClose
}: BalanceModificationDialogProps) {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirmation(true);
  };

  const handleConfirm = () => {
    const numAmount = parseFloat(amount);
    if (!isNaN(numAmount) && reason.trim()) {
      onConfirm(player.id, numAmount, reason.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-gray-800 w-[500px] rounded-lg shadow-xl border border-gray-700 overflow-hidden">
        <div className="bg-blue-900 p-3 flex items-center justify-between">
          <h2 className="text-white font-semibold">Modify Balance - {player.username}</h2>
          <button onClick={onClose} className="text-gray-300 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Current Balance
            </label>
            <div className="text-xl font-mono text-white">
              ${player.balance.toLocaleString()}
            </div>
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-300 mb-1">
              Amount (use negative for decrease)
            </label>
            <input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter amount..."
              required
            />
          </div>

          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-gray-300 mb-1">
              Reason
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none h-24"
              placeholder="Enter reason for modification..."
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-gray-200 rounded transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded transition"
              disabled={!amount || !reason.trim()}
            >
              Modify Balance
            </button>
          </div>
        </form>

        {showConfirmation && (
          <div className="absolute inset-0 bg-gray-800 flex items-center justify-center p-6">
            <div className="bg-gray-700 p-6 rounded-lg max-w-md">
              <div className="flex items-center gap-3 text-amber-400 mb-4">
                <AlertTriangle size={24} />
                <h3 className="text-lg font-medium">Confirm Balance Modification</h3>
              </div>
              
              <p className="text-gray-300 mb-6">
                Are you sure you want to {parseFloat(amount) >= 0 ? 'add' : 'subtract'} ${Math.abs(parseFloat(amount)).toLocaleString()} {parseFloat(amount) >= 0 ? 'to' : 'from'} {player.username}'s balance?
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowConfirmation(false)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-gray-200 rounded transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded transition"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}