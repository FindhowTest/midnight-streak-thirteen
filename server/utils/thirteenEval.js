// 十三支（十三水）簡化版判定與比牌（與 client 版本一致）

const POKER_RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const rankToValue = (r) => POKER_RANKS.indexOf(r);

function compareEval(a, b) {
  if (a.category !== b.category) return a.category - b.category;
  const n = Math.max(a.tiebreak.length, b.tiebreak.length);
  for (let i = 0; i < n; i++) {
    const av = a.tiebreak[i] ?? -1;
    const bv = b.tiebreak[i] ?? -1;
    if (av !== bv) return av - bv;
  }
  return 0;
}

function countsByRank(cards) {
  const m = new Map();
  for (const c of cards) {
    const v = rankToValue(c.rank);
    m.set(v, (m.get(v) ?? 0) + 1);
  }
  return m;
}

function sortedRanksDesc(cards) {
  return cards.map(c => rankToValue(c.rank)).sort((a, b) => b - a);
}

function isFlush(cards) {
  return cards.every(c => c.suit === cards[0].suit);
}

// Straight：A2345（wheel）
function straightHigh(cards) {
  const uniq = Array.from(new Set(cards.map(c => rankToValue(c.rank)))).sort((a, b) => a - b);
  if (uniq.length !== cards.length) return null;

  const wheel = [0, 1, 2, 3, 12];
  if (uniq.length === 5 && wheel.every(v => uniq.includes(v))) {
    return 3; // 5 當高牌
  }
  for (let i = 1; i < uniq.length; i++) {
    if (uniq[i] !== uniq[i - 1] + 1) return null;
  }
  return uniq[uniq.length - 1];
}

function evalFive(cards) {
  if (cards.length !== 5) throw new Error('evalFive expects 5 cards');
  const flush = isFlush(cards);
  const straight = straightHigh(cards);
  const counts = countsByRank(cards);
  const entries = Array.from(counts.entries());
  entries.sort((a, b) => (b[1] - a[1]) || (b[0] - a[0]));

  if (flush && straight !== null) {
    return { category: 8, tiebreak: [straight] };
  }
  if (entries[0][1] === 4) {
    const fourRank = entries[0][0];
    const kicker = entries[1][0];
    return { category: 7, tiebreak: [fourRank, kicker] };
  }
  if (entries[0][1] === 3 && entries[1][1] === 2) {
    return { category: 6, tiebreak: [entries[0][0], entries[1][0]] };
  }
  if (flush) {
    return { category: 5, tiebreak: sortedRanksDesc(cards) };
  }
  if (straight !== null) {
    return { category: 4, tiebreak: [straight] };
  }
  if (entries[0][1] === 3) {
    const trips = entries[0][0];
    const kickers = entries.slice(1).map(e => e[0]).sort((a, b) => b - a);
    return { category: 3, tiebreak: [trips, ...kickers] };
  }
  if (entries[0][1] === 2 && entries[1][1] === 2) {
    const highPair = Math.max(entries[0][0], entries[1][0]);
    const lowPair = Math.min(entries[0][0], entries[1][0]);
    const kicker = entries[2][0];
    return { category: 2, tiebreak: [highPair, lowPair, kicker] };
  }
  if (entries[0][1] === 2) {
    const pair = entries[0][0];
    const kickers = entries.slice(1).map(e => e[0]).sort((a, b) => b - a);
    return { category: 1, tiebreak: [pair, ...kickers] };
  }
  return { category: 0, tiebreak: sortedRanksDesc(cards) };
}

function evalThree(cards) {
  if (cards.length !== 3) throw new Error('evalThree expects 3 cards');
  const counts = countsByRank(cards);
  const entries = Array.from(counts.entries());
  entries.sort((a, b) => (b[1] - a[1]) || (b[0] - a[0]));

  if (entries[0][1] === 3) {
    return { category: 3, tiebreak: [entries[0][0]] };
  }
  if (entries[0][1] === 2) {
    const pair = entries[0][0];
    const kicker = entries[1][0];
    return { category: 1, tiebreak: [pair, kicker] };
  }
  return { category: 0, tiebreak: sortedRanksDesc(cards) };
}

function isValidArrangement(a) {
  if (!a || a.top.length !== 3 || a.middle.length !== 5 || a.bottom.length !== 5) return false;
  const top = evalThree(a.top);
  const mid = evalFive(a.middle);
  const bot = evalFive(a.bottom);
  if (compareEval(bot, mid) < 0) return false;
  if (compareEval(mid, top) < 0) return false;
  return true;
}

function compareArrangements(a, b) {
  // return { top, middle, bottom } each -1/0/1 from perspective a
  const res = { top: 0, middle: 0, bottom: 0 };
  res.top = Math.sign(compareEval(evalThree(a.top), evalThree(b.top)));
  res.middle = Math.sign(compareEval(evalFive(a.middle), evalFive(b.middle)));
  res.bottom = Math.sign(compareEval(evalFive(a.bottom), evalFive(b.bottom)));
  return res;
}

module.exports = {
  isValidArrangement,
  compareArrangements,
  // exported for bot strategies
  _evalFive: evalFive,
  _evalThree: evalThree,
  _compareEval: compareEval,
};
