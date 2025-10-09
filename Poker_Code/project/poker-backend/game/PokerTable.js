class PokerTable {
  constructor(id) {
    this.id = id;
    this.players = [];
    this.communityCards = [];
    this.pot = 0;
    this.currentBet = 0;
    this.dealerPosition = -1;
    this.activePlayerIndex = -1;
    this.gamePhase = 'waiting';
    this.handNumber = 0;
  }

  addPlayer(player) {
    // Check if player already exists
    if (this.players.some(p => p.id === player.id)) {
      throw new Error('Player already at table');
    }

    // Check if seat is taken
    if (this.players.some(p => p.position === player.position)) {
      throw new Error('Seat already taken');
    }

    this.players.push(player);
  }

  removePlayer(playerId) {
    this.players = this.players.filter(p => p.id !== playerId);
  }

  getPlayers() {
    return this.players;
  }

  updateState(state) {
    if (state.players) this.players = state.players;
    if (state.pot !== undefined) this.pot = state.pot;
    if (state.currentBet !== undefined) this.currentBet = state.currentBet;
    if (state.communityCards) this.communityCards = state.communityCards;
    if (state.dealerPosition !== undefined) this.dealerPosition = state.dealerPosition;
    if (state.activePlayerIndex !== undefined) this.activePlayerIndex = state.activePlayerIndex;
    if (state.gamePhase) this.gamePhase = state.gamePhase;
    if (state.handNumber !== undefined) this.handNumber = state.handNumber;
  }

  getState() {
    return {
      id: this.id,
      players: this.players,
      communityCards: this.communityCards,
      pot: this.pot,
      currentBet: this.currentBet,
      dealerPosition: this.dealerPosition,
      activePlayerIndex: this.activePlayerIndex,
      gamePhase: this.gamePhase,
      handNumber: this.handNumber
    };
  }
}

module.exports = { PokerTable };