import type { Card } from "@/types/game";
import type { ThirteenArrangement } from "@/types/thirteen";

export type RoomPhase = "waiting" | "arranging" | "result";

export interface RoomPlayerPublic {
  id: string;
  name: string;
  isBot?: boolean;
  botLevel?: 'normal' | 'competitive';
  ready: boolean;
  fouled?: boolean;
}

export interface RoomPublicState {
  roomId: string;
  hostId: string;
  phase: RoomPhase;
  players: RoomPlayerPublic[];
  round: number;
}

export interface DealPayload {
  roomId: string;
  round: number;
  hand: Card[];
}

export interface RoundPlayerResult {
  id: string;
  name: string;
  delta: number;
  total: number;
  fouled?: boolean;
  arrangement?: ThirteenArrangement;
}

export interface RoundResultPayload {
  roomId: string;
  round: number;
  results: RoundPlayerResult[];
}
