const crypto = require('crypto');

class Deck {
  constructor() {
    this.cards = [];
    this.initDeck();
  }

  initDeck() {
    const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    this.cards = suits.flatMap(suit => ranks.map(rank => ({ suit, rank })));
  }

  shuffle() {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = crypto.randomInt(0, i + 1);
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  deal(n) {
    return this.cards.splice(0, n);
  }

  reset() {
    this.initDeck();
    return this;
  }

  get remaining() {
    return this.cards.length;
  }
}

module.exports = { Deck };