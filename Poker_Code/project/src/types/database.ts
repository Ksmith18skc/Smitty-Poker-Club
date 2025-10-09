import { PostgrestError } from '@supabase/supabase-js';

export type GameType = 'NL Hold\'em' | 'PL Omaha' | 'PL Courchevel' | 'PL Omaha-5 Hi-Lo' | 'Mixed Choice';

export interface Player {
  id: string;
  username: string;
  email: string;
  balance: number;
  total_hands_played: number;
  total_hands_won: number;
  created_at: string;
  updated_at: string;
  role: string;
  status: string;
  is_verified: boolean;
  vip_level: string;
  total_winnings: number;
  total_losses: number;
}

export interface Table {
  id: string;
  name: string;
  game_type: GameType;
  max_players: number;
  min_buy_in: number;
  max_buy_in: number;
  small_blind: number;
  big_blind: number;
  status: 'waiting' | 'playing' | 'finished' | 'active' | 'inactive';
  visibility?: 'public' | 'private';
  created_at: string;
  updated_at: string;
}

export interface GameHistory {
  id: string;
  table_id: string;
  hand_number: string;
  pot_size: number;
  winner_id: string | null;
  community_cards: Card[];
  created_at: string;
}

export interface GameAction {
  id: string;
  game_id: string;
  player_id: string;
  action_type: 'bet' | 'call' | 'raise' | 'fold' | 'check';
  amount: number | null;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  transaction_type: 'buy_in' | 'cash_out' | 'win' | 'loss' | 'credit' | 'debit' | 'admin_action';
  game_id: string | null;
  created_at: string;
  description: string | null;
}

export interface Card {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  rank: '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface TableFilters {
  gameType?: GameType;
  minBuyIn?: number;
  maxBuyIn?: number;
  status?: Table['status'];
  minPlayers?: number;
  maxPlayers?: number;
}

export interface PlayerFilters {
  minChips?: number;
  maxChips?: number;
  username?: string;
}

export interface ServiceResponse<T> {
  data: T | null;
  error: PostgrestError | Error | null;
}

export interface PaginatedResponse<T> extends ServiceResponse<T[]> {
  count: number;
  hasMore: boolean;
}