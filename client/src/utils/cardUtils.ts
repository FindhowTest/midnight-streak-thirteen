import type { Card, Suit, Rank, Hand, HandType } from '@/types/game';

const SUITS: Suit[] = ['clubs', 'diamonds', 'hearts', 'spades'];
const RANKS: Rank[] = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];
// 十三水/一般撲克排序：2 最小、A 最大
const POKER_RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

export const SUIT_SYMBOLS: Record<Suit, string> = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
};

export const SUIT_COLORS: Record<Suit, string> = {
  spades: 'text-foreground',
  hearts: 'text-red-500',
  diamonds: 'text-red-500',
  clubs: 'text-foreground',
};

export function createDeck(): Card[] {
  const deck: Card[] = [];
  
  for (const suit of SUITS) {
    for (let i = 0; i < RANKS.length; i++) {
      deck.push({
        suit,
        rank: RANKS[i],
        value: i,
        suitValue: SUITS.indexOf(suit),
      });
    }
  }
  
  return deck;
}

// 十三水 / 一般撲克使用的牌組（2 最小、A 最大）
export function createPokerDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (let i = 0; i < POKER_RANKS.length; i++) {
      deck.push({
        suit,
        rank: POKER_RANKS[i],
        value: i,
        suitValue: SUITS.indexOf(suit),
      });
    }
  }
  return deck;
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function dealCards(deck: Card[], numPlayers: number): Card[][] {
  const hands: Card[][] = Array.from({ length: numPlayers }, () => []);
  const cardsPerPlayer = Math.floor(52 / numPlayers);
  
  for (let i = 0; i < cardsPerPlayer * numPlayers; i++) {
    hands[i % numPlayers].push(deck[i]);
  }
  
  // Sort each hand
  hands.forEach(hand => sortCards(hand));
  
  return hands;
}

export function sortCards(cards: Card[]): Card[] {
  return cards.sort((a, b) => {
    if (a.value !== b.value) return a.value - b.value;
    return a.suitValue - b.suitValue;
  });
}

export function compareCards(a: Card, b: Card): number {
  if (a.value !== b.value) return a.value - b.value;
  return a.suitValue - b.suitValue;
}

export function getCardKey(card: Card): string {
  return `${card.rank}-${card.suit}`;
}

// Hand type detection
export function detectHandType(cards: Card[]): Hand | null {
  if (cards.length === 0) return null;
  
  const sorted = [...cards].sort(compareCards);
  
  if (cards.length === 1) {
    return { type: 'single', cards: sorted, value: sorted[0].value * 4 + sorted[0].suitValue };
  }
  
  if (cards.length === 2) {
    if (sorted[0].value === sorted[1].value) {
      return { type: 'pair', cards: sorted, value: sorted[1].value * 4 + sorted[1].suitValue };
    }
    return null;
  }
  
  if (cards.length === 3) {
    if (sorted[0].value === sorted[1].value && sorted[1].value === sorted[2].value) {
      return { type: 'triple', cards: sorted, value: sorted[0].value };
    }
    return null;
  }
  
  if (cards.length === 5) {
    return detect5CardHand(sorted);
  }
  
  return null;
}

function detect5CardHand(sorted: Card[]): Hand | null {
  const isFlush = sorted.every(c => c.suit === sorted[0].suit);
  const isStraight = checkStraight(sorted);
  
  // Count ranks
  const rankCounts: Record<number, number> = {};
  sorted.forEach(c => {
    rankCounts[c.value] = (rankCounts[c.value] || 0) + 1;
  });
  const counts = Object.values(rankCounts).sort((a, b) => b - a);
  
  // Straight flush (highest)
  if (isFlush && isStraight) {
    const highCard = sorted[sorted.length - 1];
    return { 
      type: 'straightflush', 
      cards: sorted, 
      value: 800 + highCard.value * 4 + highCard.suitValue 
    };
  }
  
  // Four of a kind
  if (counts[0] === 4) {
    const fourValue = Number(Object.keys(rankCounts).find(k => rankCounts[Number(k)] === 4));
    return { type: 'four', cards: sorted, value: 700 + fourValue };
  }
  
  // Full house
  if (counts[0] === 3 && counts[1] === 2) {
    const threeValue = Number(Object.keys(rankCounts).find(k => rankCounts[Number(k)] === 3));
    return { type: 'fullhouse', cards: sorted, value: 600 + threeValue };
  }
  
  // Flush
  if (isFlush) {
    const highCard = sorted[sorted.length - 1];
    return { type: 'flush', cards: sorted, value: 500 + highCard.value * 4 + highCard.suitValue };
  }
  
  // Straight
  if (isStraight) {
    const highCard = sorted[sorted.length - 1];
    return { type: 'straight', cards: sorted, value: 400 + highCard.value * 4 + highCard.suitValue };
  }
  
  return null;
}

function checkStraight(sorted: Card[]): boolean {
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].value !== sorted[i - 1].value + 1) {
      return false;
    }
  }
  return true;
}

export function canPlayOn(newHand: Hand, lastPlay: Hand | null): boolean {
  if (!lastPlay) return true;
  
  // Must be same type and count
  if (newHand.cards.length !== lastPlay.cards.length) return false;
  if (newHand.type !== lastPlay.type) {
    // 5-card hands can beat each other if higher type
    if (newHand.cards.length === 5 && lastPlay.cards.length === 5) {
      return newHand.value > lastPlay.value;
    }
    return false;
  }
  
  return newHand.value > lastPlay.value;
}

export function findPlayerWithCard(players: { cards: Card[] }[], rank: Rank, suit: Suit): number {
  return players.findIndex(p => 
    p.cards.some(c => c.rank === rank && c.suit === suit)
  );
}

export function getHandTypeName(type: HandType): string {
  const names: Record<HandType, string> = {
    single: '單張',
    pair: '對子',
    triple: '三條',
    straight: '順子',
    flush: '同花',
    fullhouse: '葫蘆',
    four: '鐵支',
    straightflush: '同花順',
    pass: 'Pass',
  };
  return names[type];
}
