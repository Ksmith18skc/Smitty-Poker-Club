import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Loader2 } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

interface BuyInDialogProps {
  tableName: string;
  minBuyIn: number;
  maxBuyIn: number;
  onConfirm: (amount: number) => void;
  onClose: () => void;
  position?: number;
  username?: string;
  isTestTable?: boolean;
}

export function BuyInDialog({
  tableName,
  minBuyIn,
  maxBuyIn,
  onConfirm,
  onClose,
  position,
  username,
  isTestTable = false
}: BuyInDialogProps) {
  const [balance, setBalance] = useState<number | null>(null);
  const [buyInAmount, setBuyInAmount] = useState(minBuyIn);
  const [buyInType, setBuyInType] = useState<'min' | 'max' | 'custom'>('min');
  const [autoRebuy, setAutoRebuy] = useState(false);
  const [timeLeft, setTimeLeft] = useState(45);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    let timer: number;
    if (timeLeft > 0) {
      timer = window.setInterval(() => {
        setTimeLeft(t => t - 1);
      }, 1000);
    } else {
      onClose();
    }
    return () => clearInterval(timer);
  }, [timeLeft, onClose]);

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        setError(null);
        
        // For test tables, fetch by username
        if (isTestTable && username) {
          const { data, error } = await supabase
            .from('users')
            .select('id, username, balance')
            .eq('username', username)
            .single();

          if (error) {
            if (error.code === 'PGRST116') {
              throw new Error(`User "${username}" not found`);
            }
            throw error;
          }

          if (!data) {
            throw new Error(`User "${username}" not found`);
          }

          setBalance(data.balance || 0);
        }
        // For regular tables, fetch by user ID
        else if (user) {
          const { data, error } = await supabase
            .from('users')
            .select('balance')
            .eq('id', user.id)
            .single();

          if (error) throw error;
          if (data) {
            setBalance(data.balance || 0);
          }
        }

        // Set initial buy-in to either minimum or 20% of balance, whichever is higher
        if (balance !== null) {
          const twentyPercent = Math.floor(balance * 0.2);
          setBuyInAmount(Math.max(minBuyIn, Math.min(twentyPercent, maxBuyIn)));
        }
      } catch (error) {
        console.error('Error fetching balance:', error);
        setError(error instanceof Error ? error.message : 'Failed to load balance');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBalance();
  }, [user, username, isTestTable, minBuyIn, maxBuyIn, balance]);

  useEffect(() => {
    switch (buyInType) {
      case 'min':
        setBuyInAmount(minBuyIn);
        break;
      case 'max':
        setBuyInAmount(maxBuyIn);
        break;
    }
  }, [buyInType, minBuyIn, maxBuyIn]);

  const handleBuyInChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      setBuyInAmount(Math.min(Math.max(value, minBuyIn), maxBuyIn));
      setBuyInType('custom');
    }
  };

  const handleConfirm = async () => {
    if ((!user && !username) || balance === null) return;
    
    if (buyInAmount > balance) {
      setError('Insufficient balance');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);

      // Get current balance and user ID
      const userId = isTestTable && username 
        ? (await supabase
            .from('users')
            .select('id')
            .eq('username', username)
            .single()
          ).data?.id
        : user?.id;

      if (!userId) {
        throw new Error('User not found');
      }

      // Get current balance
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('balance')
        .eq('id', userId)
        .single();

      if (fetchError) throw fetchError;
      if (!userData) throw new Error('User not found');

      const newBalance = userData.balance - buyInAmount;
      if (newBalance < 0) throw new Error('Insufficient balance');

      // Update the balance
      const { error: updateError } = await supabase
        .from('users')
        .update({ balance: newBalance })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Log the transaction
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          amount: -buyInAmount,
          transaction_type: 'buy_in',
          description: `Buy-in at ${isTestTable ? 'test table' : 'table'} ${tableName}`
        });

      if (transactionError) {
        console.error('Error logging transaction:', transactionError);
      }

      // Call onConfirm after successful balance update
      onConfirm(buyInAmount);
    } catch (error) {
      console.error('Error processing buy-in:', error);
      setError(error instanceof Error ? error.message : 'Failed to process buy-in');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative bg-gray-800 w-[400px] rounded-lg shadow-xl border border-gray-700 overflow-hidden">
          <div className="p-6 flex flex-col items-center justify-center">
            <Loader2 size={32} className="text-blue-500 animate-spin mb-4" />
            <p className="text-gray-300">Loading balance...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-gray-800 w-[400px] rounded-lg shadow-xl border border-gray-700 overflow-hidden">
        <div className="bg-blue-900 p-3 flex items-center justify-between">
          <h2 className="text-white font-semibold">
            {isTestTable ? 'Buy In - Test Table' : 'Seat Available'}
          </h2>
          <button onClick={onClose} className="text-gray-300 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg flex items-center gap-2 text-red-200">
              <AlertTriangle size={18} />
              <span>{error}</span>
            </div>
          )}

          {!isTestTable && (
            <div className="text-gray-300">
              <p>Select a buy-in amount and then click OK within {timeLeft} seconds</p>
              <p>to accept a seat at {tableName}</p>
            </div>
          )}

          <div className="text-gray-300">
            Your current balance: ${balance?.toFixed(2) ?? '0.00'}
          </div>

          {!isTestTable && (
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-gray-300">
                <input
                  type="radio"
                  checked={buyInType === 'min'}
                  onChange={() => setBuyInType('min')}
                  className="text-blue-500"
                />
                Minimum Buy-In: ${minBuyIn}
              </label>

              <label className="flex items-center gap-2 text-gray-300">
                <input
                  type="radio"
                  checked={buyInType === 'max'}
                  onChange={() => setBuyInType('max')}
                  className="text-blue-500"
                />
                Maximum Buy-In: ${maxBuyIn}
              </label>

              <label className="flex items-center gap-2 text-gray-300">
                <input
                  type="radio"
                  checked={buyInType === 'custom'}
                  onChange={() => setBuyInType('custom')}
                  className="text-blue-500"
                />
                Other Buy-In:
                <input
                  type="number"
                  value={buyInAmount}
                  onChange={handleBuyInChange}
                  min={minBuyIn}
                  max={maxBuyIn}
                  step={0.01}
                  className="bg-gray-700 text-gray-200 rounded px-2 py-1 w-24"
                />
              </label>
            </div>
          )}

          {isTestTable && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Buy In Amount
              </label>
              <input
                type="number"
                min={minBuyIn}
                max={Math.min(maxBuyIn, balance || 0)}
                step={0.01}
                value={buyInAmount}
                onChange={(e) => setBuyInAmount(parseFloat(e.target.value) || minBuyIn)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isProcessing}
              />
              <div className="mt-1 text-sm text-gray-400">
                Min: ${minBuyIn} / Max: ${maxBuyIn}
              </div>
            </div>
          )}

          {!isTestTable && (
            <label className="flex items-center gap-2 text-gray-300">
              <input
                type="checkbox"
                checked={autoRebuy}
                onChange={(e) => setAutoRebuy(e.target.checked)}
                className="text-blue-500 rounded"
              />
              Auto rebuy to this amount
            </label>
          )}

          <div className="mt-2 p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
            <p className="text-sm text-blue-200">
              Your chips will be deducted from your balance and added to your stack at the table.
            </p>
          </div>
        </div>

        <div className="bg-gray-700 p-3 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-gray-200 rounded transition"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isProcessing || !balance || buyInAmount > balance || buyInAmount < minBuyIn || buyInAmount > maxBuyIn}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded transition flex items-center gap-2 disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <span>Buy In</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}