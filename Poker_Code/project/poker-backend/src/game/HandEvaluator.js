const { Hand } = require('pokersolver');

class HandEvaluator {
  static evaluate(cards) {
    if (cards.length !== 7) {
      throw new Error('Must provide exactly 7 cards for evaluation');
    }

    // Convert cards to pokersolver format
    const solverCards = cards.map(card => this.toPokerSolver(card));
    const hand = Hand.solve(solverCards);

    // Map pokersolver ranks to our ranks
    const rankMap = {
      'High Card': 0,
      'Pair': 1,
      'Two Pair': 2,
      'Three of a Kind': 3,
      'Straight': 4,
      'Flush': 5,
      'Full House': 6,
      'Four of a Kind': 7,
      'Straight Flush': 8,
      'Royal Flush': 9
    };

    // Get the best 5 cards that make up the hand
    const bestCards = hand.cards.slice(0, 5).map(card => {
      const suit = ({
        h: 'hearts',
        d: 'diamonds',
        c: 'clubs',
        s: 'spades'
      })[card.suit];

      const rank = card.value === 'T' ? '10' : card.value;
      return { suit, rank };
    });

    return {
      rank: rankMap[hand.name],
      cards: bestCards,
      description: hand.descr
    };
  }

  static toPokerSolver(card) {
    const rankMap = {
      '10': 'T'
    };
    const rank = rankMap[card.rank] || card.rank;
    return `${rank}${card.suit[0].toLowerCase()}`;
  }

  static compareHands(hand1, hand2) {
    const solverHand1 = Hand.solve(hand1.map(c => this.toPokerSolver(c)));
    const solverHand2 = Hand.solve(hand2.map(c => this.toPokerSolver(c)));
    
    return solverHand1.compare(solverHand2);
  }

  static findWinners(hands) {
    const solverHands = hands.map(h => Hand.solve(h.map(c => this.toPokerSolver(c))));
    const winners = Hand.winners(solverHands);
    
    return winners.map(w => 
      solverHands.findIndex(h => h.toString() === w.toString())
    );
  }
}

module.exports = { HandEvaluator };