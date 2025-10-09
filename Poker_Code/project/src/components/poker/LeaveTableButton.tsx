import React, { useState } from 'react';
import { LogOut } from 'lucide-react';
import { LeaveTableDialog } from './LeaveTableDialog';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

interface LeaveTableButtonProps {
  tableId: string;
  playerId: string;
  initialBuyIn: number;
  currentStack: number;
  onLeaveTable: () => Promise<void>;
  onClose: () => void;
  disabled?: boolean;
}

export function LeaveTableButton({
  tableId,
  playerId,
  initialBuyIn,
  currentStack,
  onLeaveTable,
  onClose,
  disabled = false
}: LeaveTableButtonProps) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const handleLeaveClick = () => {
    setShowConfirmation(true);
  };

  const handleConfirmLeave = async () => {
    try {
      setIsLeaving(true);
      
      // First, leave the table in the game
      await onLeaveTable();
      
      // Calculate profit or loss
      const profitOrLoss = currentStack - initialBuyIn;
      
      // Update user balance in the database
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('balance')
        .eq('id', playerId)
        .single();
      
      if (fetchError) throw fetchError;
      
      const newBalance = (userData?.balance || 0) + currentStack;
      
      const { error: updateError } = await supabase
        .from('users')
        .update({ balance: newBalance })
        .eq('id', playerId);
      
      if (updateError) throw updateError;
      
      // Log the transaction
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: playerId,
          amount: currentStack,
          transaction_type: 'cash_out',
          description: profitOrLoss >= 0 
            ? `Left table with profit of $${profitOrLoss.toFixed(2)}` 
            : `Left table with loss of $${Math.abs(profitOrLoss).toFixed(2)}`
        });
      
      if (transactionError) {
        console.error('Error logging transaction:', transactionError);
      }
      
      // Show success message
      const message = profitOrLoss >= 0 
        ? `Left table with profit of $${profitOrLoss.toFixed(2)}` 
        : `Left table with loss of $${Math.abs(profitOrLoss).toFixed(2)}`;
      
      toast.success(message);
      
      // Close the table
      onClose();
    } catch (error) {
      console.error('Error leaving table:', error);
      toast.error('Failed to leave table');
      setShowConfirmation(false);
      setIsLeaving(false);
    }
  };

  return (
    <>
      <button
        onClick={handleLeaveClick}
        disabled={disabled || isLeaving}
        className={`flex items-center gap-2 px-4 py-2 rounded transition ${
          disabled || isLeaving
            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
            : 'bg-red-600 hover:bg-red-500 text-white'
        }`}
        title={disabled ? 'Cannot leave during active hand' : 'Leave table'}
      >
        <LogOut size={18} />
        <span>{isLeaving ? 'Leaving...' : 'Leave Table'}</span>
      </button>
      
      {showConfirmation && (
        <LeaveTableDialog
          onConfirm={handleConfirmLeave}
          onCancel={() => setShowConfirmation(false)}
          initialBuyIn={initialBuyIn}
          currentStack={currentStack}
          profitLoss={currentStack - initialBuyIn}
        />
      )}
    </>
  );
}