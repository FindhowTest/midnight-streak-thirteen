// Card types
export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';
export type Rank = '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A' | '2';

export interface Card {
  suit: Suit;
  rank: Rank;
  value: number; // For comparison (3=0, 4=1, ... 2=12)
  suitValue: number; // spades=3, hearts=2, diamonds=1, clubs=0
}

export type HandType = 
  | 'single' 
  | 'pair' 
  | 'triple' 
  | 'straight' 
  | 'flush' 
  | 'fullhouse' 
  | 'four' 
  | 'straightflush'
  | 'pass';

export interface Hand {
  type: HandType;
  cards: Card[];
  value: number; // For comparison
}

export interface Player {
  id: string;
  name: string;
  isComputer: boolean;
  cards: Card[];
  hasPassed: boolean;
  roundsWon: number;
  totalScore: number;
  color: 'player-1' | 'player-2' | 'player-3' | 'player-4';
}

export interface GameRound {
  roundNumber: number;
  winner: string;
  scores: Record<string, number>;
}

export type GamePhase = 'setup' | 'playing' | 'roundEnd' | 'gameOver';

export interface GameState {
  players: Player[];
  currentPlayerIndex: number;
  lastPlay: Hand | null;
  lastPlayerId: string | null;
  consecutivePasses: number;
  phase: GamePhase;
  rounds: GameRound[];
  currentRound: number;
  gameStarted: boolean;
  winner: string | null;
}
