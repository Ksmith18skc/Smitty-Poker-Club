import { supabase } from '../lib/supabase';
import { z } from 'zod';
import type {
  GameHistory,
  GameAction,
  Card,
  PaginationParams,
  ServiceResponse,
  PaginatedResponse
} from '../types/database';

// Validation schemas
const cardSchema = z.object({
  suit: z.enum(['hearts', 'diamonds', 'clubs', 'spades']),
  rank: z.enum(['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'])
});

const gameHistorySchema = z.object({
  table_id: z.string().uuid(),
  hand_number: z.string(),
  pot_size: z.number().int().nonnegative(),
  winner_id: z.string().uuid().nullable(),
  community_cards: z.array(cardSchema)
});

const gameActionSchema = z.object({
  game_id: z.string().uuid(),
  player_id: z.string().uuid(),
  action_type: z.enum(['bet', 'call', 'raise', 'fold', 'check']),
  amount: z.number().nullable()
});

export class GameHistoryService {
  /**
   * Create a new game history record
   * @param game The game history data to create
   * @returns Promise with the created game history or error
   */
  static async create(game: Omit<GameHistory, 'id' | 'created_at'>): Promise<ServiceResponse<GameHistory>> {
    try {
      const validatedData = gameHistorySchema.parse(game);

      const { data, error } = await supabase
        .from('game_history')
        .insert(validatedData)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Add a game action
   * @param action The game action to record
   * @returns Promise with the created action or error
   */
  static async addAction(action: Omit<GameAction, 'id' | 'created_at'>): Promise<ServiceResponse<GameAction>> {
    try {
      const validatedData = gameActionSchema.parse(action);

      const { data, error } = await supabase
        .from('game_actions')
        .insert(validatedData)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Get game history by ID with actions
   * @param id Game history ID
   * @returns Promise with game history and actions or error
   */
  static async getById(id: string): Promise<ServiceResponse<GameHistory & { actions: GameAction[] }>> {
    try {
      const { data: game, error: gameError } = await supabase
        .from('game_history')
        .select('*')
        .eq('id', id)
        .single();

      if (gameError) throw gameError;
      if (!game) throw new Error('Game not found');

      const { data: actions, error: actionsError } = await supabase
        .from('game_actions')
        .select('*')
        .eq('game_id', id)
        .order('created_at', { ascending: true });

      if (actionsError) throw actionsError;

      return {
        data: { ...game, actions: actions || [] },
        error: null
      };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Get game history for a player
   * @param playerId Player ID
   * @param pagination Pagination parameters
   * @returns Promise with paginated game history or error
   */
  static async getPlayerHistory(
    playerId: string,
    pagination: PaginationParams
  ): Promise<PaginatedResponse<GameHistory>> {
    try {
      const from = pagination.page * pagination.pageSize;
      const to = from + pagination.pageSize - 1;

      const { data, error, count } = await supabase
        .from('game_history')
        .select('*', { count: 'exact' })
        .eq('winner_id', playerId)
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
   * Get game history for a table
   * @param tableId Table ID
   * @param pagination Pagination parameters
   * @returns Promise with paginated game history or error
   */
  static async getTableHistory(
    tableId: string,
    pagination: PaginationParams
  ): Promise<PaginatedResponse<GameHistory>> {
    try {
      const from = pagination.page * pagination.pageSize;
      const to = from + pagination.pageSize - 1;

      const { data, error, count } = await supabase
        .from('game_history')
        .select('*', { count: 'exact' })
        .eq('table_id', tableId)
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
   * Get player statistics
   * @param playerId Player ID
   * @returns Promise with player statistics or error
   */
  static async getPlayerStats(playerId: string): Promise<ServiceResponse<{
    totalGames: number;
    gamesWon: number;
    totalPotSize: number;
    averagePotSize: number;
  }>> {
    try {
      const { data: games, error } = await supabase
        .from('game_history')
        .select('pot_size, winner_id');

      if (error) throw error;

      const stats = games?.reduce((acc, game) => ({
        totalGames: acc.totalGames + 1,
        gamesWon: acc.gamesWon + (game.winner_id === playerId ? 1 : 0),
        totalPotSize: acc.totalPotSize + game.pot_size
      }), {
        totalGames: 0,
        gamesWon: 0,
        totalPotSize: 0
      });

      if (!stats) throw new Error('Failed to calculate statistics');

      return {
        data: {
          ...stats,
          averagePotSize: stats.totalGames > 0 ? stats.totalPotSize / stats.totalGames : 0
        },
        error: null
      };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }
}