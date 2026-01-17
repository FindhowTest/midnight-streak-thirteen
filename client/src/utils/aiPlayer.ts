import type { Card, Hand } from '@/types/game';
import { detectHandType, canPlayOn, sortCards, compareCards } from './cardUtils';

export function findBestPlay(cards: Card[], lastPlay: Hand | null): Card[] | null {
  if (cards.length === 0) return null;
  
  const sorted = sortCards([...cards]);
  
  // If no last play, we're leading - play smallest valid hand
  if (!lastPlay) {
    // Try to play smallest single
    return [sorted[0]];
  }
  
  const requiredCount = lastPlay.cards.length;
  
  // Find all possible hands of the required size
  const possibleHands = findAllHands(sorted, requiredCount, lastPlay.type);
  
  // Filter to only valid plays
  const validPlays = possibleHands.filter(hand => {
    const detected = detectHandType(hand);
    return detected && canPlayOn(detected, lastPlay);
  });
  
  if (validPlays.length === 0) return null;
  
  // Sort by value (play weakest winning hand)
  validPlays.sort((a, b) => {
    const handA = detectHandType(a)!;
    const handB = detectHandType(b)!;
    return handA.value - handB.value;
  });
  
  return validPlays[0];
}

function findAllHands(cards: Card[], count: number, type: string): Card[][] {
  const results: Card[][] = [];
  
  if (count === 1) {
    cards.forEach(c => results.push([c]));
    return results;
  }
  
  if (count === 2) {
    // Find pairs
    const byRank: Record<number, Card[]> = {};
    cards.forEach(c => {
      if (!byRank[c.value]) byRank[c.value] = [];
      byRank[c.value].push(c);
    });
    
    Object.values(byRank).forEach(group => {
      if (group.length >= 2) {
        // Generate all pairs from this group
        for (let i = 0; i < group.length; i++) {
          for (let j = i + 1; j < group.length; j++) {
            results.push([group[i], group[j]]);
          }
        }
      }
    });
    return results;
  }
  
  if (count === 3) {
    // Find triples
    const byRank: Record<number, Card[]> = {};
    cards.forEach(c => {
      if (!byRank[c.value]) byRank[c.value] = [];
      byRank[c.value].push(c);
    });
    
    Object.values(byRank).forEach(group => {
      if (group.length >= 3) {
        results.push(group.slice(0, 3));
      }
    });
    return results;
  }
  
  if (count === 5) {
    return find5CardHands(cards);
  }
  
  return results;
}

function find5CardHands(cards: Card[]): Card[][] {
  const results: Card[][] = [];
  
  // Find straights
  const straights = findStraights(cards);
  results.push(...straights);
  
  // Find flushes
  const flushes = findFlushes(cards);
  results.push(...flushes);
  
  // Find full houses
  const fullHouses = findFullHouses(cards);
  results.push(...fullHouses);
  
  // Find four of a kind + kicker
  const fours = findFourOfAKind(cards);
  results.push(...fours);
  
  return results;
}

function findStraights(cards: Card[]): Card[][] {
  const results: Card[][] = [];
  const sorted = [...cards].sort(compareCards);
  
  // Group by value
  const byValue: Record<number, Card[]> = {};
  sorted.forEach(c => {
    if (!byValue[c.value]) byValue[c.value] = [];
    byValue[c.value].push(c);
  });
  
  // Check each starting point
  for (let start = 0; start <= 8; start++) { // Max start for 5-card straight
    let valid = true;
    const straight: Card[] = [];
    
    for (let i = 0; i < 5; i++) {
      const value = start + i;
      if (!byValue[value] || byValue[value].length === 0) {
        valid = false;
        break;
      }
      straight.push(byValue[value][byValue[value].length - 1]); // Use highest suit
    }
    
    if (valid) {
      results.push(straight);
    }
  }
  
  return results;
}

function findFlushes(cards: Card[]): Card[][] {
  const results: Card[][] = [];
  
  const bySuit: Record<string, Card[]> = {};
  cards.forEach(c => {
    if (!bySuit[c.suit]) bySuit[c.suit] = [];
    bySuit[c.suit].push(c);
  });
  
  Object.values(bySuit).forEach(suitCards => {
    if (suitCards.length >= 5) {
      // Take highest 5
      const sorted = suitCards.sort(compareCards);
      results.push(sorted.slice(-5));
    }
  });
  
  return results;
}

function findFullHouses(cards: Card[]): Card[][] {
  const results: Card[][] = [];
  
  const byRank: Record<number, Card[]> = {};
  cards.forEach(c => {
    if (!byRank[c.value]) byRank[c.value] = [];
    byRank[c.value].push(c);
  });
  
  const triples = Object.entries(byRank).filter(([, v]) => v.length >= 3);
  const pairs = Object.entries(byRank).filter(([, v]) => v.length >= 2);
  
  triples.forEach(([tripleRank, tripleCards]) => {
    pairs.forEach(([pairRank, pairCards]) => {
      if (tripleRank !== pairRank) {
        results.push([...tripleCards.slice(0, 3), ...pairCards.slice(0, 2)]);
      }
    });
  });
  
  return results;
}

function findFourOfAKind(cards: Card[]): Card[][] {
  const results: Card[][] = [];
  
  const byRank: Record<number, Card[]> = {};
  cards.forEach(c => {
    if (!byRank[c.value]) byRank[c.value] = [];
    byRank[c.value].push(c);
  });
  
  const fours = Object.entries(byRank).filter(([, v]) => v.length === 4);
  
  fours.forEach(([fourRank, fourCards]) => {
    // Find a kicker
    const kicker = cards.find(c => c.value !== Number(fourRank));
    if (kicker) {
      results.push([...fourCards, kicker]);
    }
  });
  
  return results;
}
