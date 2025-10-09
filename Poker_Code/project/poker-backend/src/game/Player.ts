import { Card } from './Card';
import { PlayerAction, PlayerStatus } from '../types/poker';

export class Player {
  public cards: Card[] = [];
  public bet: number = 0;
  public totalBet: number = 0;
  public status: PlayerStatus = 'active';
  public lastAction?: PlayerAction;
  public lastActionAmount?: number;

  constructor(
    public readonly id: string,
    public readonly name: string,
    public stack: number,
    public position: number
  ) {}

  canAct(): boolean {
    return this.status === 'active' && this.stack > 0;
  }

  placeBet(amount: number): void {
    if (amount > this.stack) {
      throw new Error('Insufficient chips');
    }
    this.bet += amount;
    this.totalBet += amount;
    this.stack -= amount;
  }

  returnBet(): number {
    const amount = this.bet;
    this.bet = 0;
    this.stack += amount;
    return amount;
  }

  fold(): void {
    this.status = 'folded';
    this.lastAction = 'fold';
    this.cards = [];
  }

  sitOut(): void {
    this.status = 'sitting_out';
    this.cards = [];
  }

  standUp(): void {
    this.status = 'away';
    this.cards = [];
  }

  resetForNewHand(): void {
    this.cards = [];
    this.bet = 0;
    this.totalBet = 0;
    this.status = this.stack > 0 ? 'active' : 'sitting_out';
    this.lastAction = undefined;
    this.lastActionAmount = undefined;
  }
}