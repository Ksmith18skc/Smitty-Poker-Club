import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { TransactionService } from '../../services/transactionService';
import { formatTime } from '../../utils/formatters';

interface TransactionHistoryDialogProps {
  player: {
    id: string;
    username: string;
  };
  onClose: () => void;
}

export function TransactionHistoryDialog({
  player,
  onClose
}: TransactionHistoryDialogProps) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTransactions();
  }, [player.id]);

  const fetchTransactions = async () => {
    try {
      const result = await TransactionService.getPlayerTransactions(player.id, {
        page: 0,
        pageSize: 50
      });
      
      if (result.error) throw result.error;
      setTransactions(result.data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setError('Failed to load transaction history. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-gray-800 w-[800px] h-[600px] rounded-lg shadow-xl border border-gray-700 overflow-hidden">
        <div className="bg-blue-900 p-3 flex items-center justify-between">
          <h2 className="text-white font-semibold">Transaction History - {player.username}</h2>
          <button onClick={onClose} className="text-gray-300 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 h-[calc(100%-56px)] overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 max-w-md text-red-200">
                <p>{error}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="bg-gray-700 rounded-lg p-4 border border-gray-600"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-lg font-medium ${
                      transaction.amount >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {transaction.amount >= 0 ? '+' : '-'}${Math.abs(transaction.amount).toLocaleString()}
                    </span>
                    <span className="text-gray-400">
                      {formatTime(new Date(transaction.created_at), '24h')}
                    </span>
                  </div>
                  <div className="text-sm text-gray-300">{transaction.description}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    Transaction Type: {transaction.transaction_type}
                  </div>
                </div>
              ))}

              {transactions.length === 0 && (
                <div className="text-center text-gray-400 py-8">
                  No transactions found
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}