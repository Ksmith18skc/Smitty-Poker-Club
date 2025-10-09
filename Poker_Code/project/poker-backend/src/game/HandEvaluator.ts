import { Hand } from 'pokersolver';
import { Card } from './Card';
import { HandRank, HandResult } from '../types/poker';

export class HandEvaluator {
  static evaluate(cards: Card[]): HandResult {
    if (cards.length !== 7) {
      throw new Error('Must provide exactly 7 cards for evaluation');
    }

    // Convert cards to pokersolver format
    const solverCards = cards.map(card => card.toPokerSolver());
    const hand = Hand.solve(solverCards);

    // Map pokersolver ranks to our ranks
    const rankMap: Record<string, HandRank> = {
      'High Card': HandRank.HighCard,
      'Pair': HandRank.OnePair,
      'Two Pair': HandRank.TwoPair,
      'Three of a Kind': HandRank.ThreeOfAKind,
      'Straight': HandRank.Straight,
      'Flush': HandRank.Flush,
      'Full House': HandRank.FullHouse,
      'Four of a Kind': HandRank.FourOfAKind,
      'Straight Flush': HandRank.StraightFlush,
      'Royal Flush': HandRank.RoyalFlush
    };

    // Get the best 5 cards that make up the hand
    const bestCards = hand.cards.slice(0, 5).map(card => {
      const suit = ({
        h: 'hearts',
        d: 'diamonds',
        c: 'clubs',
        s: 'spades'
      })[card.suit] as Suit;

      const rank = card.value === 'T' ? '10' : card.value as Rank;
      return new Card(suit, rank);
    });

    return {
      rank: rankMap[hand.name],
      cards: bestCards,
      description: hand.descr // Add description from pokersolver
    };
  }

  static compareHands(hand1: Card[], hand2: Card[]): number {
    const solverHand1 = Hand.solve(hand1.map(c => c.toPokerSolver()));
    const solverHand2 = Hand.solve(hand2.map(c => c.toPokerSolver()));
    
    return solverHand1.compare(solverHand2);
  }

  static findWinners(hands: Card[][]): number[] {
    const solverHands = hands.map(h => Hand.solve(h.map(c => c.toPokerSolver())));
    const winners = Hand.winners(solverHands);
    
    return winners.map(w => 
      solverHands.findIndex(h => h.toString() === w.toString())
    );
  }
}