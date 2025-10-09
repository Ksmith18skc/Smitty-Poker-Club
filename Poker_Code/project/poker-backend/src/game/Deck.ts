import { Card } from './Card';
import { Suit, Rank } from '../types/poker';
import crypto from 'crypto';

export class Deck {
  private cards: Card[] = [];

  constructor() {
    this.reset();
  }

  reset(): void {
    const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
    const ranks: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

    this.cards = suits.flatMap(suit =>
      ranks.map(rank => new Card(suit, rank))
    );
  }

  shuffle(): void {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = crypto.randomInt(0, i + 1);
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  deal(n: number = 1): Card[] {
    if (n > this.cards.length) {
      throw new Error('Not enough cards left in deck');
    }
    return this.cards.splice(0, n);
  }

  get remaining(): number {
    return this.cards.length;
  }
}