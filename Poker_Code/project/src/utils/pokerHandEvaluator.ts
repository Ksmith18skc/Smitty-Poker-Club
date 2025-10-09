import { Card } from '../types/poker';
import { TestHandResult } from '../types/test';

// Helper function to count occurrences of each rank
function countRanks(cards: Card[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const card of cards) {
    const count = counts.get(card.rank) || 0;
    counts.set(card.rank, count + 1);
  }
  return counts;
}

// Helper function to count occurrences of each suit
function countSuits(cards: Card[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const card of cards) {
    const count = counts.get(card.suit) || 0;
    counts.set(card.suit, count + 1);
  }
  return counts;
}

// Convert card ranks to numeric values for comparison
function getRankValue(rank: string): number {
  const rankValues: Record<string, number> = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
    'J': 11, 'Q': 12, 'K': 13, 'A': 14
  };
  return rankValues[rank] || 0;
}

// Get the best 5 cards from a set of cards
function getBestFiveCards(cards: Card[]): Card[] {
  if (cards.length <= 5) return cards;
  
  // Sort cards by rank (descending)
  return [...cards].sort((a, b) => getRankValue(b.rank) - getRankValue(a.rank)).slice(0, 5);
}

// Check if cards form a straight
function isStraight(cards: Card[]): boolean {
  if (cards.length < 5) return false;
  
  // Sort cards by rank
  const sortedCards = [...cards].sort((a, b) => getRankValue(a.rank) - getRankValue(b.rank));
  
  // Remove duplicate ranks
  const uniqueRanks = Array.from(new Set(sortedCards.map(card => getRankValue(card.rank))));
  
  // Check for A-5 straight (Ace can be low)
  if (uniqueRanks.includes(14) && uniqueRanks.includes(2) && uniqueRanks.includes(3) && 
      uniqueRanks.includes(4) && uniqueRanks.includes(5)) {
    return true;
  }
  
  // Check for regular straight
  for (let i = 0; i <= uniqueRanks.length - 5; i++) {
    if (uniqueRanks[i + 4] - uniqueRanks[i] === 4) {
      return true;
    }
  }
  
  return false;
}

// Check if cards form a flush
function isFlush(cards: Card[]): boolean {
  if (cards.length < 5) return false;
  const suitCounts = countSuits(cards);
  return Array.from(suitCounts.values()).some(count => count >= 5);
}

// Get the highest card rank in a collection
function getHighestRank(cards: Card[]): string {
  return cards.reduce((highest, card) => 
    getRankValue(card.rank) > getRankValue(highest) ? card.rank : highest, 
    cards[0].rank
  );
}

// Get the best flush cards
function getFlushCards(cards: Card[]): Card[] {
  const suitCounts = countSuits(cards);
  const flushSuit = Array.from(suitCounts.entries())
    .find(([_, count]) => count >= 5)?.[0];
  
  if (!flushSuit) return [];
  
  return cards
    .filter(card => card.suit === flushSuit)
    .sort((a, b) => getRankValue(b.rank) - getRankValue(a.rank))
    .slice(0, 5);
}

// Get the best straight cards
function getStraightCards(cards: Card[]): Card[] {
  // Sort cards by rank
  const sortedCards = [...cards].sort((a, b) => getRankValue(b.rank) - getRankValue(a.rank));
  
  // Remove duplicate ranks
  const uniqueRankCards: Card[] = [];
  const seenRanks = new Set<string>();
  
  for (const card of sortedCards) {
    if (!seenRanks.has(card.rank)) {
      uniqueRankCards.push(card);
      seenRanks.add(card.rank);
    }
  }
  
  // Check for A-5 straight (Ace can be low)
  const hasAce = uniqueRankCards.some(card => card.rank === 'A');
  const has2 = uniqueRankCards.some(card => card.rank === '2');
  const has3 = uniqueRankCards.some(card => card.rank === '3');
  const has4 = uniqueRankCards.some(card => card.rank === '4');
  const has5 = uniqueRankCards.some(card => card.rank === '5');
  
  if (hasAce && has2 && has3 && has4 && has5) {
    // Find the specific cards for the A-5 straight
    const ace = uniqueRankCards.find(card => card.rank === 'A')!;
    const two = uniqueRankCards.find(card => card.rank === '2')!;
    const three = uniqueRankCards.find(card => card.rank === '3')!;
    const four = uniqueRankCards.find(card => card.rank === '4')!;
    const five = uniqueRankCards.find(card => card.rank === '5')!;
    
    return [five, four, three, two, ace];
  }
  
  // Check for regular straight
  for (let i = 0; i <= uniqueRankCards.length - 5; i++) {
    const card1 = uniqueRankCards[i];
    const card5 = uniqueRankCards[i + 4];
    
    if (getRankValue(card1.rank) - getRankValue(card5.rank) === 4) {
      return uniqueRankCards.slice(i, i + 5);
    }
  }
  
  return [];
}

// Evaluate a poker hand and return its type and strength
export function evaluatePokerHand(cards: Card[]): TestHandResult {
  if (cards.length < 5) {
    return {
      type: 'incomplete',
      description: 'Waiting for more cards',
      details: 'Need at least 5 cards to evaluate',
      strength: 0
    };
  }

  const rankCounts = countRanks(cards);
  const pairs: string[] = [];
  let threeOfAKind: string | null = null;
  let fourOfAKind: string | null = null;

  // Find pairs, three of a kind, and four of a kind
  for (const [rank, count] of rankCounts.entries()) {
    if (count === 2) pairs.push(rank);
    if (count === 3) threeOfAKind = rank;
    if (count === 4) fourOfAKind = rank;
  }

  // Check for straight flush and royal flush
  const flushCards = getFlushCards(cards);
  const straightCards = getStraightCards(cards);
  
  // Check for straight flush
  const isStraightFlush = flushCards.length >= 5 && isStraight(flushCards);
  
  if (isStraightFlush) {
    // Get the straight flush cards
    const straightFlushCards = getStraightCards(flushCards);
    
    // Check if it's a royal flush (A, K, Q, J, 10 of same suit)
    const isRoyal = straightFlushCards.some(card => card.rank === 'A') &&
                    straightFlushCards.some(card => card.rank === 'K') &&
                    straightFlushCards.some(card => card.rank === 'Q') &&
                    straightFlushCards.some(card => card.rank === 'J') &&
                    straightFlushCards.some(card => card.rank === '10');
    
    if (isRoyal) {
      return {
        type: 'royal_flush',
        description: 'Royal Flush',
        details: 'A, K, Q, J, 10 of the same suit',
        strength: 10
      };
    }
    
    return {
      type: 'straight_flush',
      description: 'Straight Flush',
      details: `${getHighestRank(straightFlushCards)} high`,
      strength: 9
    };
  }

  if (fourOfAKind) {
    return {
      type: 'four_of_a_kind',
      description: 'Four of a Kind',
      details: `Four ${fourOfAKind}s`,
      strength: 8
    };
  }

  if (threeOfAKind && pairs.length > 0) {
    return {
      type: 'full_house',
      description: 'Full House',
      details: `${threeOfAKind}s full of ${pairs[0]}s`,
      strength: 7
    };
  }

  if (flushCards.length >= 5) {
    return {
      type: 'flush',
      description: 'Flush',
      details: `${getHighestRank(flushCards)} high`,
      strength: 6
    };
  }

  if (straightCards.length >= 5) {
    return {
      type: 'straight',
      description: 'Straight',
      details: `${getHighestRank(straightCards)} high`,
      strength: 5
    };
  }

  if (threeOfAKind) {
    return {
      type: 'three_of_a_kind',
      description: 'Three of a Kind',
      details: `Three ${threeOfAKind}s`,
      strength: 4
    };
  }

  if (pairs.length >= 2) {
    // Sort pairs by rank value for accurate description
    pairs.sort((a, b) => getRankValue(b) - getRankValue(a));
    return {
      type: 'two_pair',
      description: 'Two Pair',
      details: `${pairs[0]}s and ${pairs[1]}s`,
      strength: 3
    };
  }

  if (pairs.length === 1) {
    // Check if it's a pocket pair (both hole cards make the pair)
    const isPocketPair = cards.length === 2 && pairs.length === 1;
    
    return {
      type: 'pair',
      description: isPocketPair ? 'Pocket Pair' : 'Pair',
      details: `Pair of ${pairs[0]}s`,
      strength: 2
    };
  }

  // High card
  const bestCards = getBestFiveCards(cards);
  return {
    type: 'high_card',
    description: 'High Card',
    details: `${getHighestRank(bestCards)} high`,
    strength: 1
  };
}