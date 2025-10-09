import { Card } from './poker';

export interface TestPlayer {
  id: string;
  name: string;
  stack: number;
  position: number;
  status: 'active' | 'folded' | 'all-in' | 'sitting_out' | 'away';
  cards: Card[];
  bet: number;
  totalBet: number;
  lastAction?: string;
  lastActionAmount?: number;
}

export interface TestHandResult {
  type: string;
  description: string;
  details: string;
  strength: number;
}