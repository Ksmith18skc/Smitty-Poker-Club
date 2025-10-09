import { Hand } from 'pokersolver';
import { Card } from './Card';
import { Deck } from './Deck';
import { Player } from './Player';
import { HandEvaluator } from './HandEvaluator';
import {
  TableState,
  GamePhase,
  PlayerAction,
  BettingRound,
  HandResult
} from '../types/poker';

export class PokerTable {
  private deck: Deck;
  private communityCards: Card[] = [];
  private pot: number = 0;
  private sidePots: { amount: number; eligiblePlayers: string[] }[] = [];
  private currentBet: number = 0;
  private minRaise: number = 0;
  private lastRaiseAmount: number = 0;
  private phase: GamePhase = 'waiting';
  private bettingRound: BettingRound = 'preflop';
  private activePlayerIndex: number = -1;
  private dealerPosition: number = -1;
  private handNumber: number = 0;
  private lastRaisePlayerId: string | null = null;
  private raisesThisRound: number = 0;
  private readonly MAX_RAISES_PER_ROUND = 4;

  constructor(
    public readonly id: string,
    public readonly name: string,
    private readonly smallBlind: number,
    private readonly bigBlind: number,
    private readonly minBuyIn: number,
    private readonly maxBuyIn: number,
    private readonly maxPlayers: number = 9
  ) {
    this.deck = new Deck();
  }

  private players: Player[] = [];

  addPlayer(id: string, name: string, buyIn: number, position: number): void {
    if (this.players.length >= this.maxPlayers) {
      throw new Error('Table is full');
    }
    if (buyIn < this.minBuyIn || buyIn > this.maxBuyIn) {
      throw new Error('Invalid buy-in amount');
    }
    if (this.players.some(p => p.position === position)) {
      throw new Error('Position already taken');
    }

    const player = new Player(id, name, buyIn, position);
    this.players.push(player);

    if (this.players.length >= 2 && this.phase === 'waiting') {
      this.startNewHand();
    }
  }

  removePlayer(playerId: string): void {
    const player = this.getPlayer(playerId);
    if (!player) return;

    if (this.phase !== 'waiting' && player.status === 'active') {
      player.fold();
    }

    this.players = this.players.filter(p => p.id !== playerId);

    if (this.players.length < 2) {
      this.phase = 'waiting';
    }
  }

  startNewHand(): void {
    if (this.players.length < 2) {
      throw new Error('Not enough players');
    }

    this.handNumber++;
    this.phase = 'starting';
    this.bettingRound = 'preflop';
    this.pot = 0;
    this.sidePots = [];
    this.communityCards = [];
    this.currentBet = 0;
    this.minRaise = this.bigBlind;
    this.lastRaiseAmount = 0;
    this.lastRaisePlayerId = null;
    this.raisesThisRound = 0;

    // Move dealer button
    this.dealerPosition = this.getNextDealerPosition();

    // Reset players
    this.players.forEach(p => p.resetForNewHand());

    // Deal cards
    this.deck.reset();
    this.deck.shuffle();
    this.players.forEach(p => {
      if (p.status === 'active') {
        p.cards = this.deck.deal(2);
      }
    });

    // Post blinds
    this.postBlinds();

    // Set first to act
    this.activePlayerIndex = this.getFirstToAct();
    this.phase = 'betting';
  }

  handleAction(playerId: string, action: PlayerAction, amount?: number): void {
    if (this.phase !== 'betting') {
      throw new Error('Not in betting phase');
    }

    const player = this.getPlayer(playerId);
    if (!player) {
      throw new Error('Player not found');
    }

    if (player !== this.getActivePlayer()) {
      throw new Error('Not your turn');
    }

    switch (action) {
      case 'fold':
        this.handleFold(player);
        break;
      case 'check':
        this.handleCheck(player);
        break;
      case 'call':
        this.handleCall(player);
        break;
      case 'bet':
      case 'raise':
        if (!amount) {
          throw new Error('Amount required for bet/raise');
        }
        if (this.raisesThisRound >= this.MAX_RAISES_PER_ROUND) {
          throw new Error('Maximum raises reached for this round');
        }
        this.handleBetOrRaise(player, amount);
        break;
      default:
        throw new Error('Invalid action');
    }

    this.moveToNextPlayer();
  }

  private handleFold(player: Player): void {
    player.fold();
    
    const activePlayers = this.getActivePlayers();
    if (activePlayers.length === 1) {
      this.awardPot(activePlayers[0]);
      this.phase = 'complete';
    }
  }

  private handleCheck(player: Player): void {
    if (this.currentBet > player.bet) {
      throw new Error('Cannot check when there is a bet');
    }
    player.lastAction = 'check';
  }

  private handleCall(player: Player): void {
    const callAmount = this.currentBet - player.bet;
    if (callAmount <= 0) {
      throw new Error('No bet to call');
    }

    if (callAmount >= player.stack) {
      player.placeBet(player.stack);
      player.status = 'all-in';
      this.createSidePots();
    } else {
      player.placeBet(callAmount);
    }
    player.lastAction = 'call';
    player.lastActionAmount = callAmount;
  }

  private handleBetOrRaise(player: Player, amount: number): void {
    const minBet = this.bettingRound === 'preflop' && this.currentBet === this.bigBlind
      ? this.bigBlind
      : this.currentBet * 2;

    if (amount < minBet) {
      throw new Error('Bet/raise must be at least minimum bet');
    }

    if (amount > player.stack) {
      throw new Error('Not enough chips');
    }

    const previousBet = this.currentBet;
    this.currentBet = amount;
    this.lastRaiseAmount = amount - previousBet;
    this.minRaise = this.lastRaiseAmount;
    this.lastRaisePlayerId = player.id;
    this.raisesThisRound++;

    player.placeBet(amount - player.bet);
    if (player.stack === 0) {
      player.status = 'all-in';
      this.createSidePots();
    }
    
    player.lastAction = amount > 0 ? 'raise' : 'bet';
    player.lastActionAmount = amount;
  }

  private createSidePots(): void {
    const activePlayers = this.players.filter(p => !p.folded);
    if (activePlayers.length <= 1) return;

    // Sort players by their total bet amount
    const sortedPlayers = [...activePlayers].sort((a, b) => a.bet - b.bet);
    let processedBet = 0;

    this.sidePots = [];
    for (let i = 0; i < sortedPlayers.length; i++) {
      const currentPlayer = sortedPlayers[i];
      const currentBet = currentPlayer.bet - processedBet;
      
      if (currentBet > 0) {
        const eligiblePlayers = sortedPlayers.slice(i).map(p => p.id);
        const potAmount = currentBet * eligiblePlayers.length;
        this.sidePots.push({ amount: potAmount, eligiblePlayers });
        processedBet += currentBet;
      }
    }
  }

  private moveToNextPlayer(): void {
    if (this.isBettingRoundComplete()) {
      this.completeBettingRound();
      return;
    }

    do {
      this.activePlayerIndex = (this.activePlayerIndex + 1) % this.players.length;
    } while (!this.getActivePlayer()?.canAct());
  }

  private completeBettingRound(): void {
    // Collect bets into pot
    this.players.forEach(p => {
      this.pot += p.bet;
      p.bet = 0;
    });

    // Reset betting round state
    this.currentBet = 0;
    this.minRaise = this.bigBlind;
    this.lastRaiseAmount = 0;
    this.lastRaisePlayerId = null;
    this.raisesThisRound = 0;

    // Move to next round or showdown
    switch (this.bettingRound) {
      case 'preflop':
        this.bettingRound = 'flop';
        this.dealFlop();
        break;
      case 'flop':
        this.bettingRound = 'turn';
        this.dealTurn();
        break;
      case 'turn':
        this.bettingRound = 'river';
        this.dealRiver();
        break;
      case 'river':
        this.showdown();
        break;
    }

    if (this.phase === 'betting') {
      this.activePlayerIndex = this.getFirstToAct();
    }
  }

  private dealFlop(): void {
    this.deck.deal(1); // Burn card
    this.communityCards = this.deck.deal(3);
  }

  private dealTurn(): void {
    this.deck.deal(1); // Burn card
    this.communityCards.push(...this.deck.deal(1));
  }

  private dealRiver(): void {
    this.deck.deal(1); // Burn card
    this.communityCards.push(...this.deck.deal(1));
  }

  private showdown(): void {
    this.phase = 'showdown';

    const activePlayers = this.players.filter(p => 
      p.status === 'active' || p.status === 'all-in'
    );

    if (this.sidePots.length > 0) {
      // Handle side pots
      this.sidePots.forEach(pot => {
        const eligiblePlayers = activePlayers.filter(p => 
          pot.eligiblePlayers.includes(p.id)
        );
        
        if (eligiblePlayers.length > 0) {
          const hands = eligiblePlayers.map(player => ({
            playerId: player.id,
            cards: [...player.cards, ...this.communityCards]
          }));
          
          const winners = HandEvaluator.findWinners(hands.map(h => h.cards));
          const winAmount = Math.floor(pot.amount / winners.length);
          
          winners.forEach(winnerIndex => {
            const winner = eligiblePlayers[winnerIndex];
            if (winner) {
              winner.stack += winAmount;
            }
          });
        }
      });
    } else {
      // Handle main pot
      const hands = activePlayers.map(player => ({
        playerId: player.id,
        cards: [...player.cards, ...this.communityCards]
      }));
      
      const winners = HandEvaluator.findWinners(hands.map(h => h.cards));
      const winAmount = Math.floor(this.pot / winners.length);
      
      winners.forEach(winnerIndex => {
        const winner = activePlayers[winnerIndex];
        if (winner) {
          winner.stack += winAmount;
        }
      });
    }

    this.phase = 'complete';
  }

  private awardPot(winner: Player): void {
    winner.stack += this.pot;
    this.pot = 0;
    this.sidePots = [];
  }

  private postBlinds(): void {
    const smallBlindPos = (this.dealerPosition + 1) % this.players.length;
    const bigBlindPos = (this.dealerPosition + 2) % this.players.length;

    const smallBlindPlayer = this.players[smallBlindPos];
    const bigBlindPlayer = this.players[bigBlindPos];

    if (smallBlindPlayer.stack <= this.smallBlind) {
      smallBlindPlayer.placeBet(smallBlindPlayer.stack);
      smallBlindPlayer.status = 'all-in';
    } else {
      smallBlindPlayer.placeBet(this.smallBlind);
    }

    if (bigBlindPlayer.stack <= this.bigBlind) {
      bigBlindPlayer.placeBet(bigBlindPlayer.stack);
      bigBlindPlayer.status = 'all-in';
    } else {
      bigBlindPlayer.placeBet(this.bigBlind);
    }

    this.currentBet = this.bigBlind;
  }

  private getNextDealerPosition(): number {
    if (this.dealerPosition === -1) {
      return Math.floor(Math.random() * this.players.length);
    }
    return (this.dealerPosition + 1) % this.players.length;
  }

  private getFirstToAct(): number {
    if (this.bettingRound === 'preflop') {
      return (this.dealerPosition + 3) % this.players.length;
    }
    return (this.dealerPosition + 1) % this.players.length;
  }

  private getActivePlayers(): Player[] {
    return this.players.filter(p => p.status === 'active');
  }

  private getActivePlayer(): Player | undefined {
    return this.players[this.activePlayerIndex];
  }

  private getPlayer(id: string): Player | undefined {
    return this.players.find(p => p.id === id);
  }

  private isBettingRoundComplete(): boolean {
    const activePlayers = this.getActivePlayers();
    
    // If only one active player remains, round is complete
    if (activePlayers.length <= 1) return true;

    // Check if all active players have matched the current bet
    const allBetsMatched = activePlayers.every(player => 
      player.bet === this.currentBet || player.status === 'all-in'
    );

    // In preflop, make sure big blind has had a chance to act if there was a raise
    if (this.bettingRound === 'preflop' && this.lastRaisePlayerId) {
      const bigBlindPos = (this.dealerPosition + 2) % this.players.length;
      const bigBlindPlayer = this.players[bigBlindPos];
      
      // If big blind hasn't acted after a raise, round is not complete
      if (bigBlindPlayer.status === 'active' && 
          bigBlindPlayer.lastAction === undefined &&
          this.activePlayerIndex <= bigBlindPos) {
        return false;
      }
    }

    return allBetsMatched;
  }

  getState(): TableState {
    return {
      id: this.id,
      name: this.name,
      phase: this.phase,
      bettingRound: this.bettingRound,
      pot: this.pot,
      currentBet: this.currentBet,
      minRaise: this.minRaise,
      dealerPosition: this.dealerPosition,
      activePlayerIndex: this.activePlayerIndex,
      communityCards: this.communityCards,
      players: this.players.map(p => ({
        id: p.id,
        name: p.name,
        stack: p.stack,
        bet: p.bet,
        status: p.status,
        position: p.position,
        cards: p.cards,
        lastAction: p.lastAction,
        lastActionAmount: p.lastActionAmount
      })),
      handNumber: this.handNumber,
      lastRaisePlayerId: this.lastRaisePlayerId || undefined,
      raisesThisRound: this.raisesThisRound,
      sidePots: this.sidePots
    };
  }
}