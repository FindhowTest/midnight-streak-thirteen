import type { Card } from '@/types/game';

// 十三支（十三張/十三水）每位玩家要把 13 張牌分成：頭(3) / 中(5) / 尾(5)

export type Lane = 'top' | 'middle' | 'bottom';

export interface ThirteenArrangement {
  top: Card[];     // 3
  middle: Card[];  // 5
  bottom: Card[];  // 5
}

export type ThirteenPhase = 'setup' | 'arranging' | 'reveal' | 'result';

export interface ThirteenPlayerState {
  id: string;
  name: string;
  isComputer: boolean;
  color: 'player-1' | 'player-2' | 'player-3' | 'player-4';

  // 手牌（13 張）
  hand: Card[];

  // 分墩結果
  arrangement: ThirteenArrangement;

  // 是否已提交分墩
  lockedIn: boolean;

  // 是否倒水（不合法：尾 < 中 或 中 < 頭）
  fouled: boolean;

  // 累積分數（可做成多局）
  totalScore: number;
}

export interface ThirteenGameState {
  phase: ThirteenPhase;
  players: ThirteenPlayerState[];
  round: number;
  // 輪到哪位玩家分墩（單機版：一次只處理一個人類，電腦自動）
  activePlayerId: string | null;
  // 結算後每位玩家本局得分（對所有對手加總）
  roundScores: Record<string, number>;
}
