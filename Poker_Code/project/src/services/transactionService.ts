import { supabase } from '../lib/supabase';
import { z } from 'zod';
import type {
  Transaction,
  PaginationParams,
  ServiceResponse,
  PaginatedResponse
} from '../types/database';

// Validation schemas
const transactionSchema = z.object({
  user_id: z.string().uuid(),
  amount: z.number(),
  transaction_type: z.enum(['buy_in', 'cash_out', 'win', 'loss', 'credit', 'debit', 'admin_action']),
  game_id: z.string().uuid().nullable().optional(),
  description: z.string().nullable().optional()
});

export class TransactionService {
  /**
   * Create a new transaction
   * @param transaction The transaction data to create
   * @returns Promise with the created transaction or error
   */
  static async create(
    transaction: Omit<Transaction, 'id' | 'created_at'>
  ): Promise<ServiceResponse<Transaction>> {
    try {
      const validatedData = transactionSchema.parse(transaction);

      // Start a transaction to update player balance and create transaction record
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('balance')
        .eq('id', validatedData.user_id)
        .single();

      if (userError) throw userError;
      if (!user) throw new Error('User not found');

      const newBalance = user.balance + validatedData.amount;
      if (newBalance < 0) throw new Error('Insufficient balance');

      const { data, error } = await supabase
        .from('transactions')
        .insert(validatedData)
        .select()
        .single();

      if (error) throw error;

      // Update user balance
      const { error: updateError } = await supabase
        .from('users')
        .update({ balance: newBalance })
        .eq('id', validatedData.user_id);

      if (updateError) throw updateError;

      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Get transaction by ID
   * @param id Transaction ID
   * @returns Promise with the transaction or error
   */
  static async getById(id: string): Promise<ServiceResponse<Transaction>> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Get player transactions with pagination
   * @param playerId Player ID
   * @param pagination Pagination parameters
   * @returns Promise with paginated transactions or error
   */
  static async getPlayerTransactions(
    playerId: string,
    pagination: PaginationParams
  ): Promise<PaginatedResponse<Transaction>> {
    try {
      const from = pagination.page * pagination.pageSize;
      const to = from + pagination.pageSize - 1;

      const { data, error, count } = await supabase
        .from('transactions')
        .select('*', { count: 'exact' })
        .eq('user_id', playerId)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      return {
        data,
        count: count || 0,
        hasMore: (count || 0) > to + 1,
        error: null
      };
    } catch (error) {
      return {
        data: null,
        count: 0,
        hasMore: false,
        error: error as Error
      };
    }
  }

  /**
   * Get game transactions
   * @param gameId Game ID
   * @returns Promise with transactions or error
   */
  static async getGameTransactions(gameId: string): Promise<ServiceResponse<Transaction[]>> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('game_id', gameId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Get player balance history
   * @param playerId Player ID
   * @param startDate Start date for history
   * @param endDate End date for history
   * @returns Promise with balance history or error
   */
  static async getBalanceHistory(
    playerId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ServiceResponse<{
    date: string;
    balance: number;
  }[]>> {
    try {
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('amount, created_at')
        .eq('user_id', playerId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      const balanceHistory = transactions?.reduce((acc, transaction) => {
        const date = new Date(transaction.created_at).toISOString().split('T')[0];
        const lastBalance = acc.length > 0 ? acc[acc.length - 1].balance : 0;
        
        return [...acc, {
          date,
          balance: lastBalance + transaction.amount
        }];
      }, [] as { date: string; balance: number; }[]);

      return { data: balanceHistory || [], error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Get transaction summary for a player
   * @param playerId Player ID
   * @returns Promise with transaction summary or error
   */
  static async getTransactionSummary(playerId: string): Promise<ServiceResponse<{
    totalBuyIns: number;
    totalCashOuts: number;
    totalWinnings: number;
    totalLosses: number;
    netProfit: number;
  }>> {
    try {
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('amount, transaction_type')
        .eq('user_id', playerId);

      if (error) throw error;

      const summary = transactions?.reduce((acc, transaction) => ({
        totalBuyIns: acc.totalBuyIns + (transaction.transaction_type === 'buy_in' ? transaction.amount : 0),
        totalCashOuts: acc.totalCashOuts + (transaction.transaction_type === 'cash_out' ? Math.abs(transaction.amount) : 0),
        totalWinnings: acc.totalWinnings + (transaction.transaction_type === 'win' ? transaction.amount : 0),
        totalLosses: acc.totalLosses + (transaction.transaction_type === 'loss' ? Math.abs(transaction.amount) : 0),
        netProfit: acc.netProfit + transaction.amount
      }), {
        totalBuyIns: 0,
        totalCashOuts: 0,
        totalWinnings: 0,
        totalLosses: 0,
        netProfit: 0
      });

      if (!summary) throw new Error('Failed to calculate summary');

      return { data: summary, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }
}