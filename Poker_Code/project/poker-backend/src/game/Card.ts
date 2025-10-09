import { Suit, Rank } from '../types/poker';

export class Card {
  constructor(
    public readonly suit: Suit,
    public readonly rank: Rank
  ) {}

  toString(): string {
    return `${this.rank}${this.suit[0].toLowerCase()}`;
  }

  // Convert to pokersolver format
  toPokerSolver(): string {
    const rankMap: Record<string, string> = {
      '10': 'T'
    };
    const rank = rankMap[this.rank] || this.rank;
    return `${rank}${this.suit[0].toLowerCase()}`;
  }

  static fromString(str: string): Card {
    const rank = str.slice(0, -1) as Rank;
    const suit = ({
      h: 'hearts',
      d: 'diamonds',
      c: 'clubs',
      s: 'spades'
    })[str.slice(-1)] as Suit;
    
    return new Card(suit, rank);
  }
}