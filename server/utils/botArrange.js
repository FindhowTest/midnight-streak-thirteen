const { isValidArrangement, _evalFive, _evalThree, _compareEval } = require('./thirteenEval');

// ===== Helpers =====

function rankIndex(rank) {
  const order = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
  return order.indexOf(rank);
}

function cardKey(c) {
  return `${c.rank}${c.suit}`;
}

function evalToScore(ev) {
  // Convert eval object -> comparable integer (bigger is stronger)
  // category: 0..8
  // tiebreak: desc-ish values
  let score = ev.category * 1_000_000_000;
  // pack up to 6 tiebreak values
  for (let i = 0; i < 6; i++) {
    const v = ev.tiebreak[i] ?? -1;
    score += (v + 1) * Math.pow(1000, 5 - i);
  }
  return score;
}

function strengthTop3(cards3) {
  return evalToScore(_evalThree(cards3));
}

function strengthFive(cards5) {
  return evalToScore(_evalFive(cards5));
}

function* combinations(arr, k, start = 0, prefix = []) {
  if (prefix.length === k) {
    yield prefix;
    return;
  }
  for (let i = start; i <= arr.length - (k - prefix.length); i++) {
    yield* combinations(arr, k, i + 1, prefix.concat([arr[i]]));
  }
}

function remainingByKeys(allCards, usedCards) {
  const used = new Set(usedCards.map(cardKey));
  return allCards.filter(c => !used.has(cardKey(c)));
}

function pickBestArrangementExhaustive(hand, objective) {
  // Exhaustive: choose bottom 5, middle 5, top 3
  // Total: C(13,5)=1287, then C(8,5)=56 => 72072 candidates.
  let best = null;
  let bestScore = -Infinity;

  for (const bottom of combinations(hand, 5)) {
    const rem8 = remainingByKeys(hand, bottom);
    for (const middle of combinations(rem8, 5)) {
      const top = remainingByKeys(rem8, middle); // 3 cards
      const arrangement = { top, middle, bottom };
      if (!isValidArrangement(arrangement)) continue;
      const score = objective(arrangement);
      if (score > bestScore) {
        bestScore = score;
        best = arrangement;
      }
    }
  }

  // Fallback: if somehow no valid (should be rare), do a simple sorted split then mark as-is
  if (!best) {
    const sorted = hand.slice().sort((a, b) => rankIndex(b.rank) - rankIndex(a.rank));
    best = { bottom: sorted.slice(0, 5), middle: sorted.slice(5, 10), top: sorted.slice(10, 13) };
  }
  return best;
}

// ===== Public APIs =====

function arrangeNormal(hand) {
  // Greedy-ish: maximize bottom first, then middle, then top
  return pickBestArrangementExhaustive(hand, (a) => {
    const bot = _evalFive(a.bottom);
    const mid = _evalFive(a.middle);
    const top = _evalThree(a.top);

    // lexicographic style score
    const botS = evalToScore(bot);
    const midS = evalToScore(mid);
    const topS = evalToScore(top);
    return botS * 1e-6 + midS * 1e-12 + topS * 1e-18;
  });
}

function arrangeCompetitive(hand) {
  // "中上"：以加權總強度 + 平衡度為目標
  return pickBestArrangementExhaustive(hand, (a) => {
    const botS = strengthFive(a.bottom);
    const midS = strengthFive(a.middle);
    const topS = strengthTop3(a.top);

    // Encourage balanced mid (avoid putting everything into bottom)
    const gapPenalty = Math.max(0, botS - midS) * 0.00001;

    return botS * 1.0 + midS * 0.92 + topS * 0.75 - gapPenalty;
  });
}

module.exports = {
  arrangeNormal,
  arrangeCompetitive,
};
