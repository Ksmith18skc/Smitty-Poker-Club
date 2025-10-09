import { Card, Suit, Rank, GamePhase, BettingRound, PlayerStatus, PlayerAction } from '../types/poker';
import { HandEvaluator } from './HandEvaluator';
import { Deck } from './Deck';
import { Player } from './Player';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

export class GameEngine {
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
  private readonly SMALL_BLIND = 0.25;
  private readonly BIG_BLIND = 0.50;

  constructor(
    public readonly id: string,
    public readonly name: string,
    private readonly maxPlayers: number = 6,
    private readonly minBuyIn: number = 10,
    private readonly maxBuyIn: number = 50,
    private readonly isTestTable: boolean = false
  ) {
    this.deck = new Deck();
  }

  private players: Player[] = [];

  async addPlayer(id: string, name: string, buyIn: number, position: number): Promise<void> {
    if (this.players.length >= this.maxPlayers) {
      throw new Error('Table is full');
    }
    if (buyIn < this.minBuyIn || buyIn > this.maxBuyIn) {
      throw new Error('Invalid buy-in amount');
    }
    if (this.players.some(p => p.position === position)) {
      throw new Error('Position already taken');
    }

    try {
      // Update user balance in database
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('balance')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;
      if (!userData) throw new Error('User not found');

      const newBalance = userData.balance - buyIn;
      if (newBalance < 0) throw new Error('Insufficient balance');

      const { error: updateError } = await supabase
        .from('users')
        .update({ balance: newBalance })
        .eq('id', id);

      if (updateError) throw updateError;

      // Log transaction
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: id,
          amount: -buyIn,
          transaction_type: 'buy_in',
          description: `Buy-in at ${this.isTestTable ? 'test table' : 'table'} ${this.name}`
        });

      if (transactionError) {
        console.error('Error logging transaction:', transactionError);
      }

      // Add player to table
      const player = new Player(id, name, buyIn, position);
      this.players.push(player);

      // Start new hand if we have enough players
      if (this.players.length >= 2 && this.phase === 'waiting') {
        this.startNewHand();
      }

      toast.success(`Successfully joined table with $${buyIn.toFixed(2)}`);
    } catch (error) {
      console.error('Error adding player:', error);
      throw error;
    }
  }

  async removePlayer(playerId: string): Promise<void> {
    const player = this.getPlayer(playerId);
    if (!player) return;

    try {
      // Return chips to user's balance
      if (player.stack > 0) {
        const { error: updateError } = await supabase
          .from('users')
          .update({ 
            balance: supabase.sql`balance + ${player.stack}` 
          })
          .eq('id', player.id);

        if (updateError) throw updateError;

        // Log transaction
        const { error: transactionError } = await supabase
          .from('transactions')
          .insert({
            user_id: player.id,
            amount: player.stack,
            transaction_type: 'cash_out',
            description: `Left ${this.isTestTable ? 'test table' : 'table'} ${this.name}`
          });

        if (transactionError) {
          console.error('Error logging transaction:', transactionError);
        }
      }

      // Remove player from table
      this.players = this.players.filter(p => p.id !== playerId);

      // Reset table if not enough players
      if (this.players.length < 2) {
        this.resetTable();
      }

      toast.success(`Successfully left table with $${player.stack.toFixed(2)}`);
    } catch (error) {
      console.error('Error removing player:', error);
      throw error;
    }
  }

  startNewHand(): void {
    if (this.players.length < 2) {
      throw new Error('Not enough players');
    }

    this.handNumber++;
    this.phase = 'preflop';
    this.bettingRound = 'preflop';
    this.pot = 0;
    this.sidePots = [];
    this.communityCards = [];
    this.currentBet = 0;
    this.minRaise = this.BIG_BLIND;
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
  }

  handleAction(playerId: string, action: PlayerAction, amount?: number): void {
    if (this.phase !== 'preflop' && this.phase !== 'flop' && this.phase !== 'turn' && this.phase !== 'river') {
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
    const minBet = this.bettingRound === 'preflop' && this.currentBet === this.BIG_BLIND
      ? this.BIG_BLIND
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
    const activePlayers = this.players.filter(p => p.status !== 'folded');
    if (activePlayers.length <= 1) return;

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

    let nextIndex = (this.activePlayerIndex + 1) % this.players.length;
    while (!this.canPlayerAct(this.players[nextIndex])) {
      nextIndex = (nextIndex + 1) % this.players.length;
    }
    this.activePlayerIndex = nextIndex;
  }

  private completeBettingRound(): void {
    // Collect bets into pot
    this.players.forEach(p => {
      this.pot += p.bet;
      p.bet = 0;
    });

    // Reset betting round state
    this.currentBet = 0;
    this.minRaise = this.BIG_BLIND;
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
        return;
    }

    this.activePlayerIndex = this.getFirstToAct();
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
            player,
            hand: HandEvaluator.evaluate([...player.cards, ...this.communityCards])
          }));
          
          hands.sort((a, b) => b.hand.strength - a.hand.strength);
          const winningStrength = hands[0].hand.strength;
          const winners = hands.filter(h => h.hand.strength === winningStrength);
          
          const winAmount = Math.floor(pot.amount / winners.length);
          winners.forEach(({ player }) => {
            player.stack += winAmount;
          });
        }
      });
    } else {
      // Handle main pot
      const hands = activePlayers.map(player => ({
        player,
        hand: HandEvaluator.evaluate([...player.cards, ...this.communityCards])
      }));
      
      hands.sort((a, b) => b.hand.strength - a.hand.strength);
      const winningStrength = hands[0].hand.strength;
      const winners = hands.filter(h => h.hand.strength === winningStrength);
      
      const winAmount = Math.floor(this.pot / winners.length);
      winners.forEach(({ player }) => {
        player.stack += winAmount;
      });
    }

    this.pot = 0;
    this.sidePots = [];
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

    if (smallBlindPlayer.stack <= this.SMALL_BLIND) {
      smallBlindPlayer.placeBet(smallBlindPlayer.stack);
      smallBlindPlayer.status = 'all-in';
    } else {
      smallBlindPlayer.placeBet(this.SMALL_BLIND);
    }

    if (bigBlindPlayer.stack <= this.BIG_BLIND) {
      bigBlindPlayer.placeBet(bigBlindPlayer.stack);
      bigBlindPlayer.status = 'all-in';
    } else {
      bigBlindPlayer.placeBet(this.BIG_BLIND);
    }

    this.currentBet = this.BIG_BLIND;
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

  private canPlayerAct(player: Player): boolean {
    return player && player.status === 'active' && player.stack > 0;
  }

  private isBettingRoundComplete(): boolean {
    const activePlayers = this.getActivePlayers();
    if (activePlayers.length <= 1) return true;

    const allBetsMatched = activePlayers.every(player => 
      player.bet === this.currentBet || player.status === 'all-in'
    );

    if (this.bettingRound === 'preflop' && this.lastRaisePlayerId) {
      const bigBlindPos = (this.dealerPosition + 2) % this.players.length;
      const bigBlindPlayer = this.players[bigBlindPos];
      
      if (bigBlindPlayer.status === 'active' && 
          bigBlindPlayer.lastAction === undefined &&
          this.activePlayerIndex <= bigBlindPos) {
        return false;
      }
    }

    return allBetsMatched;
  }

  private resetTable(): void {
    this.players = [];
    this.pot = 0;
    this.currentBet = 0;
    this.minRaise = this.BIG_BLIND;
    this.communityCards = [];
    this.dealerPosition = -1;
    this.activePlayerIndex = -1;
    this.phase = 'waiting';
    this.handNumber = 0;
  }

  getState() {
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