import { supabase } from '../lib/supabase';
import { z } from 'zod';
import type {
  Table,
  TableFilters,
  PaginationParams,
  ServiceResponse,
  PaginatedResponse,
  GameType
} from '../types/database';

// Validation schemas
const tableSchema = z.object({
  name: z.string().min(3).max(100),
  game_type: z.enum(['NL Hold\'em', 'PL Omaha', 'PL Courchevel', 'PL Omaha-5 Hi-Lo', 'Mixed Choice']),
  max_players: z.number().int().min(2).max(10),
  min_buy_in: z.number().min(1),
  max_buy_in: z.number().min(1),
  small_blind: z.number().min(0.01),
  big_blind: z.number().min(0.01),
  status: z.enum(['waiting', 'playing', 'finished', 'active', 'inactive']).default('waiting'),
  visibility: z.enum(['public', 'private']).default('public'),
});

export class TableService {
  /**
   * Create a new poker table
   * @param table The table data to create
   * @returns Promise with the created table or error
   */
  static async create(table: Omit<Table, 'id' | 'created_at' | 'updated_at'>): Promise<ServiceResponse<Table>> {
    try {
      // Validate input
      const validatedData = tableSchema.parse(table);

      // Ensure big blind is greater than small blind
      if (validatedData.big_blind <= validatedData.small_blind) {
        throw new Error('Big blind must be greater than small blind');
      }

      // Ensure max buy-in is greater than min buy-in
      if (validatedData.max_buy_in <= validatedData.min_buy_in) {
        throw new Error('Maximum buy-in must be greater than minimum buy-in');
      }

      const { data, error } = await supabase
        .from('games')
        .insert(validatedData)
        .select()
        .single();

      if (error) {
        // Provide more descriptive error messages for common issues
        if (error.code === '23514') {
          if (error.message.includes('games_game_type_check')) {
            throw new Error(`Invalid game type. Must be one of: NL Hold'em, PL Omaha, PL Courchevel, PL Omaha-5 Hi-Lo, Mixed Choice`);
          } else if (error.message.includes('valid_blinds')) {
            throw new Error('Small blind must be less than big blind');
          } else if (error.message.includes('valid_buy_in')) {
            throw new Error('Minimum buy-in must be less than maximum buy-in');
          }
        } else if (error.code === '23505') {
          throw new Error('A table with this name already exists');
        } else if (error.code === '42P01') {
          throw new Error('The games table does not exist in the database');
        }
        throw error;
      }
      
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Get a table by ID
   * @param id The table ID
   * @returns Promise with the table or error
   */
  static async getById(id: string): Promise<ServiceResponse<Table>> {
    try {
      const { data, error } = await supabase
        .from('games')
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
   * Get tables with pagination and filtering
   * @param pagination Pagination parameters
   * @param filters Optional filters
   * @returns Promise with paginated tables or error
   */
  static async list(
    pagination: PaginationParams,
    filters?: TableFilters
  ): Promise<PaginatedResponse<Table>> {
    try {
      let query = supabase
        .from('games')
        .select('*', { count: 'exact' });

      // Apply filters
      if (filters) {
        if (filters.gameType) {
          query = query.eq('game_type', filters.gameType);
        }
        if (filters.status) {
          query = query.eq('status', filters.status);
        }
        if (filters.minBuyIn) {
          query = query.gte('min_buy_in', filters.minBuyIn);
        }
        if (filters.maxBuyIn) {
          query = query.lte('max_buy_in', filters.maxBuyIn);
        }
        if (filters.minPlayers) {
          query = query.gte('max_players', filters.minPlayers);
        }
        if (filters.maxPlayers) {
          query = query.lte('max_players', filters.maxPlayers);
        }
      }

      // Apply pagination
      const from = pagination.page * pagination.pageSize;
      const to = from + pagination.pageSize - 1;

      const { data, error, count } = await query
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
   * Update a table
   * @param id The table ID
   * @param updates The updates to apply
   * @returns Promise with the updated table or error
   */
  static async update(
    id: string,
    updates: Partial<Omit<Table, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<ServiceResponse<Table>> {
    try {
      // Validate updates
      if (Object.keys(updates).length === 0) {
        throw new Error('No updates provided');
      }

      // Partial validation of provided fields
      const partialSchema = tableSchema.partial();
      const validatedUpdates = partialSchema.parse(updates);

      const { data, error } = await supabase
        .from('games')
        .update(validatedUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        // Provide more descriptive error messages for common issues
        if (error.code === '23514') {
          if (error.message.includes('games_game_type_check')) {
            throw new Error(`Invalid game type. Must be one of: NL Hold'em, PL Omaha, PL Courchevel, PL Omaha-5 Hi-Lo, Mixed Choice`);
          } else if (error.message.includes('valid_blinds')) {
            throw new Error('Small blind must be less than big blind');
          } else if (error.message.includes('valid_buy_in')) {
            throw new Error('Minimum buy-in must be less than maximum buy-in');
          }
        }
        throw error;
      }
      
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Delete a table
   * @param id The table ID
   * @returns Promise with success status or error
   */
  static async delete(id: string): Promise<ServiceResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('games')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { data: true, error: null };
    } catch (error) {
      return { data: false, error: error as Error };
    }
  }

  /**
   * Search tables by name
   * @param query The search query
   * @param pagination Pagination parameters
   * @returns Promise with matching tables or error
   */
  static async search(
    query: string,
    pagination: PaginationParams
  ): Promise<PaginatedResponse<Table>> {
    try {
      const from = pagination.page * pagination.pageSize;
      const to = from + pagination.pageSize - 1;

      const { data, error, count } = await supabase
        .from('games')
        .select('*', { count: 'exact' })
        .ilike('name', `%${query}%`)
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
   * Get tables by game type
   * @param gameType The game type to filter by
   * @param pagination Pagination parameters
   * @returns Promise with matching tables or error
   */
  static async getByGameType(
    gameType: GameType,
    pagination: PaginationParams
  ): Promise<PaginatedResponse<Table>> {
    try {
      const from = pagination.page * pagination.pageSize;
      const to = from + pagination.pageSize - 1;

      const { data, error, count } = await supabase
        .from('games')
        .select('*', { count: 'exact' })
        .eq('game_type', gameType)
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
   * Get active tables (status = 'playing' or 'active')
   * @param pagination Pagination parameters
   * @returns Promise with active tables or error
   */
  static async getActiveTables(
    pagination: PaginationParams
  ): Promise<PaginatedResponse<Table>> {
    try {
      const from = pagination.page * pagination.pageSize;
      const to = from + pagination.pageSize - 1;

      const { data, error, count } = await supabase
        .from('games')
        .select('*', { count: 'exact' })
        .in('status', ['playing', 'active'])
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
   * Clone a table from an existing table
   * @param sourceTableId The ID of the table to clone
   * @param newTableData The data for the new table
   * @returns Promise with the created table or error
   */
  static async cloneTable(
    sourceTableId: string,
    newTableData: {
      name: string;
      max_players?: number;
      min_buy_in?: number;
      max_buy_in?: number;
      small_blind?: number;
      big_blind?: number;
      status?: string;
      visibility?: string;
    }
  ): Promise<ServiceResponse<Table>> {
    try {
      // Get the source table
      const { data: sourceTable, error: sourceError } = await supabase
        .from('games')
        .select('*')
        .eq('id', sourceTableId)
        .single();

      if (sourceError) throw sourceError;
      if (!sourceTable) throw new Error('Source table not found');

      // Create new table data by merging source table with new data
      const newTable = {
        name: newTableData.name,
        game_type: sourceTable.game_type,
        max_players: newTableData.max_players || sourceTable.max_players,
        min_buy_in: newTableData.min_buy_in || sourceTable.min_buy_in,
        max_buy_in: newTableData.max_buy_in || sourceTable.max_buy_in,
        small_blind: newTableData.small_blind || sourceTable.small_blind,
        big_blind: newTableData.big_blind || sourceTable.big_blind,
        status: newTableData.status || 'active',
        visibility: newTableData.visibility || 'public'
      };

      // Create the new table
      return await this.create(newTable);
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }
}