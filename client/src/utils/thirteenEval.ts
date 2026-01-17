import type { Card, Rank } from '@/types/game';
import type { ThirteenArrangement } from '@/types/thirteen';

// =========================
// Rank order for 標準撲克（十三水用）：2 最小、A 最大
// =========================
const POKER_RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const rankToValue = (r: Rank) => POKER_RANKS.indexOf(r);

export type EvalCategory =
  | 0 // high card
  | 1 // pair
  | 2 // two pair
  | 3 // three of a kind
  | 4 // straight
  | 5 // flush
  | 6 // full house
  | 7 // four of a kind
  | 8; // straight flush

export interface HandEval {
  category: EvalCategory;
  // 用來比大小的序列（越大越強），以「高位在前」的方式做 lexicographic compare
  tiebreak: number[];
}

export function compareEval(a: HandEval, b: HandEval): number {
  if (a.category !== b.category) return a.category - b.category;
  const n = Math.max(a.tiebreak.length, b.tiebreak.length);
  for (let i = 0; i < n; i++) {
    const av = a.tiebreak[i] ?? -1;
    const bv = b.tiebreak[i] ?? -1;
    if (av !== bv) return av - bv;
  }
  return 0;
}

function countsByRank(cards: Card[]): Map<number, number> {
  const m = new Map<number, number>();
  for (const c of cards) {
    const v = rankToValue(c.rank);
    m.set(v, (m.get(v) ?? 0) + 1);
  }
  return m;
}

function sortedRanksDesc(cards: Card[]): number[] {
  return cards
    .map(c => rankToValue(c.rank))
    .sort((a, b) => b - a);
}

function isFlush(cards: Card[]): boolean {
  return cards.every(c => c.suit === cards[0].suit);
}

// Straight：A2345（wheel）需要特殊處理。
function straightHigh(cards: Card[]): number | null {
  const uniq = Array.from(new Set(cards.map(c => rankToValue(c.rank)))).sort((a, b) => a - b);
  if (uniq.length !== cards.length) return null;

  // wheel: A(12),2(0),3(1),4(2),5(3)
  const wheel = [0, 1, 2, 3, 12];
  if (uniq.length === 5 && wheel.every(v => uniq.includes(v))) {
    return 3; // 5 當高牌（value=3）
  }

  for (let i = 1; i < uniq.length; i++) {
    if (uniq[i] !== uniq[i - 1] + 1) return null;
  }
  return uniq[uniq.length - 1];
}

export function evalFive(cards: Card[]): HandEval {
  if (cards.length !== 5) throw new Error('evalFive expects 5 cards');
  const flush = isFlush(cards);
  const straight = straightHigh(cards);
  const counts = countsByRank(cards);
  const entries = Array.from(counts.entries());
  // 依 (count desc, rank desc) 排序，方便組 tiebreak
  entries.sort((a, b) => (b[1] - a[1]) || (b[0] - a[0]));

  // Straight Flush
  if (flush && straight !== null) {
    return { category: 8, tiebreak: [straight] };
  }
  // Four
  if (entries[0][1] === 4) {
    const fourRank = entries[0][0];
    const kicker = entries[1][0];
    return { category: 7, tiebreak: [fourRank, kicker] };
  }
  // Full house
  if (entries[0][1] === 3 && entries[1][1] === 2) {
    return { category: 6, tiebreak: [entries[0][0], entries[1][0]] };
  }
  // Flush
  if (flush) {
    return { category: 5, tiebreak: sortedRanksDesc(cards) };
  }
  // Straight
  if (straight !== null) {
    return { category: 4, tiebreak: [straight] };
  }
  // Three
  if (entries[0][1] === 3) {
    const trips = entries[0][0];
    const kickers = entries.slice(1).map(e => e[0]).sort((a, b) => b - a);
    return { category: 3, tiebreak: [trips, ...kickers] };
  }
  // Two pair
  if (entries[0][1] === 2 && entries[1][1] === 2) {
    const highPair = Math.max(entries[0][0], entries[1][0]);
    const lowPair = Math.min(entries[0][0], entries[1][0]);
    const kicker = entries[2][0];
    return { category: 2, tiebreak: [highPair, lowPair, kicker] };
  }
  // One pair
  if (entries[0][1] === 2) {
    const pair = entries[0][0];
    const kickers = entries.slice(1).map(e => e[0]).sort((a, b) => b - a);
    return { category: 1, tiebreak: [pair, ...kickers] };
  }
  // High card
  return { category: 0, tiebreak: sortedRanksDesc(cards) };
}

export function evalThree(cards: Card[]): HandEval {
  if (cards.length !== 3) throw new Error('evalThree expects 3 cards');
  const counts = countsByRank(cards);
  const entries = Array.from(counts.entries());
  entries.sort((a, b) => (b[1] - a[1]) || (b[0] - a[0]));

  // Trips（對應 5-card 的 category=3）
  if (entries[0][1] === 3) {
    return { category: 3, tiebreak: [entries[0][0]] };
  }
  // Pair
  if (entries[0][1] === 2) {
    const pair = entries[0][0];
    const kicker = entries[1][0];
    return { category: 1, tiebreak: [pair, kicker] };
  }
  // High card
  return { category: 0, tiebreak: sortedRanksDesc(cards) };
}

export function isValidArrangement(a: ThirteenArrangement): boolean {
  if (a.top.length !== 3 || a.middle.length !== 5 || a.bottom.length !== 5) return false;

  const top = evalThree(a.top);
  const mid = evalFive(a.middle);
  const bot = evalFive(a.bottom);

  // 規則：尾 >= 中 >= 頭
  if (compareEval(bot, mid) < 0) return false;
  if (compareEval(mid, top) < 0) return false;
  return true;
}

export function explainCategory(category: EvalCategory): string {
  switch (category) {
    case 8: return '同花順';
    case 7: return '鐵支';
    case 6: return '葫蘆';
    case 5: return '同花';
    case 4: return '順子';
    case 3: return '三條';
    case 2: return '兩對';
    case 1: return '一對';
    default: return '烏龍';
  }
}
