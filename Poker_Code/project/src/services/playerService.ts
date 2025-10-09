import { supabase } from '../lib/supabase';
import { z } from 'zod';
import type { Player, ServiceResponse } from '../types/database';

export class PlayerService {
  /**
   * Update player balance
   */
  static async updateChips(id: string, amount: number): Promise<ServiceResponse<Player>> {
    try {
      // Instead of using the RPC function that doesn't exist, directly update the user's balance
      const { data: userData, error: fetchError } = await supabase
        .from('auth')
        .select('users.balance')
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('Error fetching user balance:', fetchError);
        return { data: null, error: fetchError };
      }

      const currentBalance = userData?.balance || 0;
      const newBalance = currentBalance + amount;

      // Check for negative balance
      if (newBalance < 0) {
        return { 
          data: null, 
          error: new Error('Insufficient balance') 
        };
      }

      // Update the balance directly
      const { data, error: updateError } = await supabase
        .from('auth')
        .update({ balance: newBalance })
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating balance:', updateError);
        return { data: null, error: updateError };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in updateChips:', error);
      return { data: null, error: error as Error };
    }
  }

  /**
   * Get player by user ID
   */
  static async getByUserId(id: string): Promise<ServiceResponse<Player>> {
    try {
      const { data, error } = await supabase
        .from('auth')
        .select('users.id, users.email, users.balance, users.username')
        .eq('id', id)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Get player by username
   */
  static async getByUsername(username: string): Promise<ServiceResponse<Player>> {
    try {
      const { data, error } = await supabase
        .from('auth')
        .select('users.id, users.email, users.balance, users.username')
        .eq('username', username)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Update player statistics
   * @param id Player ID
   * @param stats Statistics to update
   * @returns Promise with the updated player or error
   */
  static async updateStats(
    id: string,
    stats: { handsPlayed?: number; handsWon?: number }
  ): Promise<ServiceResponse<Player>> {
    try {
      const updates: Partial<Player> = {};
      if (typeof stats.handsPlayed === 'number') {
        updates.total_hands_played = stats.handsPlayed;
      }
      if (typeof stats.handsWon === 'number') {
        updates.total_hands_won = stats.handsWon;
      }

      const { data, error } = await supabase
        .from('auth')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Get player win rate
   * @param id Player ID
   * @returns Promise with win rate or error
   */
  static async getWinRate(id: string): Promise<ServiceResponse<{
    handsPlayed: number;
    handsWon: number;
    winRate: number;
    biggestPot: number;
  }>> {
    try {
      const { data: user, error } = await supabase
        .from('auth')
        .select('users.total_hands_played, users.total_hands_won')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!user) throw new Error('User not found');

      const handsPlayed = user.total_hands_played || 0;
      const handsWon = user.total_hands_won || 0;
      const winRate = handsPlayed > 0 ? (handsWon / handsPlayed) * 100 : 0;

      return { 
        data: {
          handsPlayed,
          handsWon,
          winRate,
          biggestPot: 0 // Placeholder value
        }, 
        error: null 
      };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Log a balance transaction
   */
  static async logTransaction(
    userId: string, 
    amount: number, 
    reason: string
  ): Promise<ServiceResponse<any>> {
    try {
      const { data, error } = await supabase
        .from('admin_audit_log')
        .insert({
          admin_id: userId,
          action: amount >= 0 ? 'credit_balance' : 'debit_balance',
          details: reason,
          target_id: userId,
          ip_address: window.location.hostname
        });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }
}