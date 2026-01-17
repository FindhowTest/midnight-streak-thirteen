import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Card, Player } from '@/types/game';
import type { Lane, ThirteenArrangement, ThirteenGameState, ThirteenPlayerState } from '@/types/thirteen';
import { createPokerDeck, dealCards, shuffleDeck, sortCards, getCardKey } from '@/utils/cardUtils';
import { compareEval, evalFive, evalThree, isValidArrangement } from '@/utils/thirteenEval';

const PLAYER_COLORS: Player['color'][] = ['player-1', 'player-2', 'player-3', 'player-4'];
const generateId = () => Math.random().toString(36).substring(2, 9);
const computerNames = ['電腦小明', '電腦小美', '電腦阿強', '電腦小華'];

const emptyArrangement = (): ThirteenArrangement => ({ top: [], middle: [], bottom: [] });

const initialState: ThirteenGameState = {
  phase: 'setup',
  players: [],
  round: 1,
  activePlayerId: null,
  roundScores: {},
};

// ========
// Very simple AI：先把牌由小到大排，尾放最大 5，中放次大 5，頭放最小 3
// （之後我們再升級成真正會算牌型的 AI）
// ========
function naiveAutoArrange(hand: Card[]): ThirteenArrangement {
  const cards = sortCards([...hand]);
  const top = cards.slice(0, 3);
  const middle = cards.slice(3, 8);
  const bottom = cards.slice(8, 13);

  // 若不合法，做最小修正：把頭/中/尾各自再做一次保守調整
  const a: ThirteenArrangement = { top, middle, bottom };
  if (isValidArrangement(a)) return a;

  // 嘗試：把頭的最大牌丟到中，從中拿最小回頭
  const topSorted = [...top].sort((x, y) => y.value - x.value);
  const midSorted = [...middle].sort((x, y) => x.value - y.value);
  if (topSorted.length && midSorted.length) {
    const t = topSorted[0];
    const m = midSorted[0];
    const top2 = [...top];
    const mid2 = [...middle];
    top2.splice(top2.findIndex(c => getCardKey(c) === getCardKey(t)), 1, m);
    mid2.splice(mid2.findIndex(c => getCardKey(c) === getCardKey(m)), 1, t);
    const a2: ThirteenArrangement = { top: sortCards(top2), middle: sortCards(mid2), bottom };
    if (isValidArrangement(a2)) return a2;
  }

  // 最後 fallback：保持原樣（會被判倒水）
  return a;
}

function scorePairwise(a: ThirteenPlayerState, b: ThirteenPlayerState): [number, number] {
  // 倒水：直接輸滿（含全贏 bonus）
  if (a.fouled && !b.fouled) return [-6, +6];
  if (b.fouled && !a.fouled) return [+6, -6];
  if (a.fouled && b.fouled) return [0, 0];

  const aTop = evalThree(a.arrangement.top);
  const bTop = evalThree(b.arrangement.top);
  const aMid = evalFive(a.arrangement.middle);
  const bMid = evalFive(b.arrangement.middle);
  const aBot = evalFive(a.arrangement.bottom);
  const bBot = evalFive(b.arrangement.bottom);

  const lane = (cmp: number) => (cmp > 0 ? 1 : cmp < 0 ? -1 : 0);

  const t = lane(compareEval(aTop, bTop));
  const m = lane(compareEval(aMid, bMid));
  const bo = lane(compareEval(aBot, bBot));

  let aScore = t + m + bo;
  let bScore = -aScore;

  // 全贏 bonus（中規中矩版：+3）
  if (t === 1 && m === 1 && bo === 1) {
    aScore += 3;
    bScore -= 3;
  }
  if (t === -1 && m === -1 && bo === -1) {
    aScore -= 3;
    bScore += 3;
  }

  return [aScore, bScore];
}

export function useThirteenGame() {
  const [state, setState] = useState<ThirteenGameState>(initialState);

  const activePlayer = useMemo(
    () => (state.activePlayerId ? state.players.find(p => p.id === state.activePlayerId) : null),
    [state.activePlayerId, state.players]
  );

  const [activeLane, setActiveLane] = useState<Lane>('bottom');

  const addPlayer = useCallback((name: string, isComputer = false) => {
    setState(prev => {
      if (prev.players.length >= 4) return prev;
      const usedColors = prev.players.map(p => p.color);
      const availableColor = PLAYER_COLORS.find(c => !usedColors.includes(c)) || 'player-1';
      const computerCount = prev.players.filter(p => p.isComputer).length;

      const newPlayer: ThirteenPlayerState = {
        id: generateId(),
        name: isComputer ? computerNames[computerCount] || `電腦${computerCount + 1}` : name,
        isComputer,
        color: availableColor,
        hand: [],
        arrangement: emptyArrangement(),
        lockedIn: false,
        fouled: false,
        totalScore: 0,
      };

      return { ...prev, players: [...prev.players, newPlayer] };
    });
  }, []);

  const removePlayer = useCallback((playerId: string) => {
    setState(prev => ({ ...prev, players: prev.players.filter(p => p.id !== playerId) }));
  }, []);

  const startGame = useCallback(() => {
    setState(prev => {
      if (prev.players.length < 2) return prev;

      const deck = shuffleDeck(createPokerDeck());
      const hands = dealCards(deck, prev.players.length).map(h => sortCards(h).slice(0, 13));

      const players = prev.players.map((p, i) => ({
        ...p,
        hand: hands[i],
        arrangement: emptyArrangement(),
        lockedIn: p.isComputer, // 電腦先鎖，等下 auto arrange 會補
        fouled: false,
      }));

      // 先把電腦自動分墩
      const players2 = players.map(p => {
        if (!p.isComputer) return p;
        const arr = naiveAutoArrange(p.hand);
        return { ...p, arrangement: arr, lockedIn: true, fouled: !isValidArrangement(arr) };
      });

      const firstHuman = players2.find(p => !p.isComputer);

      return {
        ...prev,
        players: players2,
        phase: 'arranging',
        activePlayerId: firstHuman ? firstHuman.id : (players2[0]?.id ?? null),
        roundScores: {},
      };
    });
  }, []);

  const allChosenCount = (a: ThirteenArrangement) => a.top.length + a.middle.length + a.bottom.length;

  const moveCardToLane = useCallback((card: Card, lane: Lane) => {
    setState(prev => {
      const pid = prev.activePlayerId;
      if (!pid) return prev;
      const idx = prev.players.findIndex(p => p.id === pid);
      if (idx < 0) return prev;

      const p = prev.players[idx];
      if (p.isComputer || p.lockedIn) return prev;

      const a = p.arrangement;
      // card 必須在手上且尚未被放入任何 lane
      const inTop = a.top.some(c => getCardKey(c) === getCardKey(card));
      const inMid = a.middle.some(c => getCardKey(c) === getCardKey(card));
      const inBot = a.bottom.some(c => getCardKey(c) === getCardKey(card));
      if (inTop || inMid || inBot) return prev;

      const next: ThirteenArrangement = {
        top: [...a.top],
        middle: [...a.middle],
        bottom: [...a.bottom],
      };

      const cap = lane === 'top' ? 3 : 5;
      if (next[lane].length >= cap) return prev;
      next[lane].push(card);
      next[lane] = sortCards(next[lane]);

      const players = [...prev.players];
      players[idx] = { ...p, arrangement: next };
      return { ...prev, players };
    });
  }, []);

  const removeCardFromLane = useCallback((card: Card, lane: Lane) => {
    setState(prev => {
      const pid = prev.activePlayerId;
      if (!pid) return prev;
      const idx = prev.players.findIndex(p => p.id === pid);
      if (idx < 0) return prev;
      const p = prev.players[idx];
      if (p.isComputer || p.lockedIn) return prev;

      const next: ThirteenArrangement = {
        top: [...p.arrangement.top],
        middle: [...p.arrangement.middle],
        bottom: [...p.arrangement.bottom],
      };
      next[lane] = next[lane].filter(c => getCardKey(c) !== getCardKey(card));

      const players = [...prev.players];
      players[idx] = { ...p, arrangement: next };
      return { ...prev, players };
    });
  }, []);

  const clearArrangement = useCallback(() => {
    setState(prev => {
      const pid = prev.activePlayerId;
      if (!pid) return prev;
      const idx = prev.players.findIndex(p => p.id === pid);
      if (idx < 0) return prev;
      const p = prev.players[idx];
      if (p.isComputer || p.lockedIn) return prev;

      const players = [...prev.players];
      players[idx] = { ...p, arrangement: emptyArrangement() };
      return { ...prev, players };
    });
  }, []);

  const autoArrangeActive = useCallback(() => {
    setState(prev => {
      const pid = prev.activePlayerId;
      if (!pid) return prev;
      const idx = prev.players.findIndex(p => p.id === pid);
      if (idx < 0) return prev;
      const p = prev.players[idx];
      if (p.isComputer || p.lockedIn) return prev;

      const arr = naiveAutoArrange(p.hand);
      const players = [...prev.players];
      players[idx] = { ...p, arrangement: arr };
      return { ...prev, players };
    });
  }, []);

  const lockIn = useCallback(() => {
    setState(prev => {
      const pid = prev.activePlayerId;
      if (!pid) return prev;
      const idx = prev.players.findIndex(p => p.id === pid);
      if (idx < 0) return prev;
      const p = prev.players[idx];
      if (p.isComputer || p.lockedIn) return prev;

      const chosen = allChosenCount(p.arrangement);
      if (chosen !== 13) return prev;

      const fouled = !isValidArrangement(p.arrangement);
      const players = [...prev.players];
      players[idx] = { ...p, lockedIn: true, fouled };

      // 若還有其他人類玩家未提交，切到下一個
      const nextHuman = players.find(pp => !pp.isComputer && !pp.lockedIn);
      const nextPhase: ThirteenGameState['phase'] = nextHuman ? 'arranging' : 'reveal';

      return {
        ...prev,
        players,
        activePlayerId: nextHuman ? nextHuman.id : null,
        phase: nextPhase,
      };
    });
  }, []);

  // reveal → 直接結算
  useEffect(() => {
    if (state.phase !== 'reveal') return;
    setState(prev => {
      const players = prev.players;
      const roundScores: Record<string, number> = {};
      players.forEach(p => (roundScores[p.id] = 0));

      for (let i = 0; i < players.length; i++) {
        for (let j = i + 1; j < players.length; j++) {
          const [si, sj] = scorePairwise(players[i], players[j]);
          roundScores[players[i].id] += si;
          roundScores[players[j].id] += sj;
        }
      }

      const players2 = players.map(p => ({ ...p, totalScore: p.totalScore + (roundScores[p.id] ?? 0) }));

      return {
        ...prev,
        players: players2,
        roundScores,
        phase: 'result',
      };
    });
  }, [state.phase]);

  const nextRound = useCallback(() => {
    setState(prev => ({
      ...prev,
      round: prev.round + 1,
      phase: 'setup',
      activePlayerId: null,
      roundScores: {},
      players: prev.players.map(p => ({
        ...p,
        hand: [],
        arrangement: emptyArrangement(),
        lockedIn: false,
        fouled: false,
      })),
    }));
  }, []);

  const resetGame = useCallback(() => {
    setState(initialState);
    setActiveLane('bottom');
  }, []);

  const activeChosenCount = activePlayer ? allChosenCount(activePlayer.arrangement) : 0;
  const activeIsValid = activePlayer ? isValidArrangement(activePlayer.arrangement) : false;

  return {
    state,
    activePlayer,
    activeLane,
    setActiveLane,
    activeChosenCount,
    activeIsValid,

    addPlayer,
    removePlayer,
    startGame,
    moveCardToLane,
    removeCardFromLane,
    clearArrangement,
    autoArrangeActive,
    lockIn,
    nextRound,
    resetGame,
  };
}
