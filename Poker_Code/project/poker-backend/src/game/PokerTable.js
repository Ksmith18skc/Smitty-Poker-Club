const { Deck } = require('./Deck');
const { HandEvaluator } = require('./HandEvaluator');

class PokerTable {
  constructor(
    id,
    name,
    smallBlind,
    bigBlind,
    minBuyIn,
    maxBuyIn,
    maxPlayers = 9
  ) {
    this.id = id;
    this.name = name;
    this.smallBlind = smallBlind;
    this.bigBlind = bigBlind;
    this.minBuyIn = minBuyIn;
    this.maxBuyIn = maxBuyIn;
    this.maxPlayers = maxPlayers;
    
    this.players = [];
    this.communityCards = [];
    this.pot = 0;
    this.sidePots = [];
    this.currentBet = 0;
    this.minRaise = 0;
    this.lastRaiseAmount = 0;
    this.phase = 'waiting';
    this.bettingRound = 'preflop';
    this.activePlayerIndex = -1;
    this.dealerPosition = -1;
    this.handNumber = 0;
    this.lastRaisePlayerId = null;
    this.raisesThisRound = 0;
    this.MAX_RAISES_PER_ROUND = 4;
    
    this.deck = new Deck();
  }

  addPlayer(id, name, buyIn, position) {
    if (this.players.length >= this.maxPlayers) {
      throw new Error('Table is full');
    }
    if (buyIn < this.minBuyIn || buyIn > this.maxBuyIn) {
      throw new Error('Invalid buy-in amount');
    }
    if (this.players.some(p => p.position === position)) {
      throw new Error('Position already taken');
    }

    const player = {
      id,
      name,
      stack: buyIn,
      position,
      bet: 0,
      totalBet: 0,
      status: 'active',
      cards: [],
      lastAction: undefined,
      lastActionAmount: undefined
    };
    
    this.players.push(player);

    if (this.players.length >= 2 && this.phase === 'waiting') {
      this.startNewHand();
    }
    
    return player;
  }

  removePlayer(playerId) {
    const player = this.getPlayer(playerId);
    if (!player) return;

    if (this.phase !== 'waiting' && player.status === 'active') {
      player.status = 'folded';
      player.cards = [];
    }

    this.players = this.players.filter(p => p.id !== playerId);

    if (this.players.length < 2) {
      this.phase = 'waiting';
    }
  }

  startNewHand() {
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
    this.players.forEach(p => {
      p.cards = [];
      p.bet = 0;
      p.totalBet = 0;
      p.status = p.stack > 0 ? 'active' : 'sitting_out';
      p.lastAction = undefined;
      p.lastActionAmount = undefined;
    });

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

  handleAction(playerId, action, amount) {
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

  handleFold(player) {
    player.status = 'folded';
    player.lastAction = 'fold';
    player.cards = [];
    
    const activePlayers = this.getActivePlayers();
    if (activePlayers.length === 1) {
      this.awardPot(activePlayers[0]);
      this.phase = 'complete';
    }
  }

  handleCheck(player) {
    if (this.currentBet > player.bet) {
      throw new Error('Cannot check when there is a bet');
    }
    player.lastAction = 'check';
  }

  handleCall(player) {
    const callAmount = this.currentBet - player.bet;
    if (callAmount <= 0) {
      throw new Error('No bet to call');
    }

    if (callAmount >= player.stack) {
      player.bet += player.stack;
      player.totalBet += player.stack;
      player.stack = 0;
      player.status = 'all-in';
      this.createSidePots();
    } else {
      player.bet += callAmount;
      player.totalBet += callAmount;
      player.stack -= callAmount;
    }
    player.lastAction = 'call';
    player.lastActionAmount = callAmount;
  }

  handleBetOrRaise(player, amount) {
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

    const raiseAmount = amount - player.bet;
    player.bet = amount;
    player.totalBet += raiseAmount;
    player.stack -= raiseAmount;
    
    if (player.stack === 0) {
      player.status = 'all-in';
      this.createSidePots();
    }
    
    player.lastAction = this.currentBet > 0 ? 'raise' : 'bet';
    player.lastActionAmount = amount;
  }

  createSidePots() {
    const activePlayers = this.players.filter(p => p.status !== 'folded');
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

  moveToNextPlayer() {
    if (this.isBettingRoundComplete()) {
      this.completeBettingRound();
      return;
    }

    do {
      this.activePlayerIndex = (this.activePlayerIndex + 1) % this.players.length;
    } while (!this.canPlayerAct(this.players[this.activePlayerIndex]));
  }

  completeBettingRound() {
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

  dealFlop() {
    this.deck.deal(1); // Burn card
    this.communityCards = this.deck.deal(3);
  }

  dealTurn() {
    this.deck.deal(1); // Burn card
    this.communityCards.push(...this.deck.deal(1));
  }

  dealRiver() {
    this.deck.deal(1); // Burn card
    this.communityCards.push(...this.deck.deal(1));
  }

  showdown() {
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

  awardPot(winner) {
    winner.stack += this.pot;
    this.pot = 0;
    this.sidePots = [];
  }

  postBlinds() {
    const smallBlindPos = (this.dealerPosition + 1) % this.players.length;
    const bigBlindPos = (this.dealerPosition + 2) % this.players.length;

    const smallBlindPlayer = this.players[smallBlindPos];
    const bigBlindPlayer = this.players[bigBlindPos];

    if (smallBlindPlayer.stack <= this.smallBlind) {
      smallBlindPlayer.bet = smallBlindPlayer.stack;
      smallBlindPlayer.totalBet = smallBlindPlayer.stack;
      smallBlindPlayer.stack = 0;
      smallBlindPlayer.status = 'all-in';
    } else {
      smallBlindPlayer.bet = this.smallBlind;
      smallBlindPlayer.totalBet = this.smallBlind;
      smallBlindPlayer.stack -= this.smallBlind;
    }

    if (bigBlindPlayer.stack <= this.bigBlind) {
      bigBlindPlayer.bet = bigBlindPlayer.stack;
      bigBlindPlayer.totalBet = bigBlindPlayer.stack;
      bigBlindPlayer.stack = 0;
      bigBlindPlayer.status = 'all-in';
    } else {
      bigBlindPlayer.bet = this.bigBlind;
      bigBlindPlayer.totalBet = this.bigBlind;
      bigBlindPlayer.stack -= this.bigBlind;
    }

    this.currentBet = this.bigBlind;
  }

  getNextDealerPosition() {
    if (this.dealerPosition === -1) {
      return Math.floor(Math.random() * this.players.length);
    }
    return (this.dealerPosition + 1) % this.players.length;
  }

  getFirstToAct() {
    if (this.bettingRound === 'preflop') {
      return (this.dealerPosition + 3) % this.players.length;
    }
    return (this.dealerPosition + 1) % this.players.length;
  }

  getActivePlayers() {
    return this.players.filter(p => p.status === 'active');
  }

  getActivePlayer() {
    return this.players[this.activePlayerIndex];
  }

  getPlayer(id) {
    return this.players.find(p => p.id === id);
  }

  canPlayerAct(player) {
    return player && player.status === 'active' && player.stack > 0;
  }

  isBettingRoundComplete() {
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

module.exports = { PokerTable };