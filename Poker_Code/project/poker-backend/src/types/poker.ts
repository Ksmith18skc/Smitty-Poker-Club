export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export type GamePhase = 'waiting' | 'starting' | 'betting' | 'showdown' | 'complete';
export type BettingRound = 'preflop' | 'flop' | 'turn' | 'river';
export type PlayerStatus = 'active' | 'folded' | 'all-in' | 'sitting_out' | 'away';
export type PlayerAction = 'fold' | 'check' | 'call' | 'bet' | 'raise';

export enum HandRank {
  HighCard,
  OnePair,
  TwoPair,
  ThreeOfAKind,
  Straight,
  Flush,
  FullHouse,
  FourOfAKind,
  StraightFlush,
  RoyalFlush
}

export interface HandResult {
  rank: HandRank;
  cards: Card[];
  description?: string; // Added for better hand descriptions
}

export interface TableState {
  id: string;
  name: string;
  phase: GamePhase;
  bettingRound: BettingRound;
  pot: number;
  currentBet: number;
  minRaise: number;
  dealerPosition: number;
  activePlayerIndex: number;
  communityCards: Card[];
  players: {
    id: string;
    name: string;
    stack: number;
    bet: number;
    status: PlayerStatus;
    position: number;
    cards: Card[];
    lastAction?: PlayerAction;
    lastActionAmount?: number;
  }[];
  handNumber: number;
  lastRaisePlayerId?: string; // Added for better action tracking
  raisesThisRound: number; // Added to limit raises
  sidePots: { // Added for all-in situations
    amount: number;
    eligiblePlayers: string[];
  }[];
}

export interface GameEvent {
  type: 'player_joined' | 'player_left' | 'hand_started' | 'player_action' | 'betting_round' | 'showdown';
  tableId: string;
  data: any;
}