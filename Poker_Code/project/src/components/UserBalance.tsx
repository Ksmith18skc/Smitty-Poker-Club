import React, { useState, useEffect } from 'react';
import { Wallet } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { toast } from 'react-hot-toast';

export function UserBalance() {
  const [balance, setBalance] = useState<number | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Initial fetch
    fetchBalance();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${user.id}`
        },
        (payload) => {
          if (payload.new && typeof payload.new.balance === 'number') {
            setBalance(payload.new.balance);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user]);

  const fetchBalance = async () => {
    if (!user) return;

    try {
      // Correctly query the balance from the users table
      const { data, error } = await supabase
        .from('users')
        .select('balance')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      if (data) {
        setBalance(data.balance || 0);
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
      toast.error('Failed to load balance');
    }
  };

  if (balance === null) {
    return (
      <div className="flex items-center gap-2 bg-blue-800 px-4 py-1.5 rounded-md animate-pulse">
        <Wallet size={18} className="text-blue-300" />
        <div className="h-5 w-20 bg-blue-700 rounded"></div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-blue-800 px-4 py-1.5 rounded-md hover:bg-blue-700 transition-colors">
      <Wallet size={18} className="text-blue-300" />
      <span className="font-medium text-white">${balance.toFixed(2)}</span>
    </div>
  );
}