import { useState, useCallback, useEffect, useRef } from 'react';
import type { Player, GameState, Card, Hand, GamePhase } from '@/types/game';
import { 
  createDeck, 
  shuffleDeck, 
  dealCards, 
  findPlayerWithCard, 
  detectHandType,
  canPlayOn,
  getCardKey,
} from '@/utils/cardUtils';
import { findBestPlay } from '@/utils/aiPlayer';

const PLAYER_COLORS: Player['color'][] = ['player-1', 'player-2', 'player-3', 'player-4'];
const generateId = () => Math.random().toString(36).substring(2, 9);
const computerNames = ['電腦小明', '電腦小美', '電腦阿強', '電腦小華'];

const initialState: GameState = {
  players: [],
  currentPlayerIndex: 0,
  lastPlay: null,
  lastPlayerId: null,
  consecutivePasses: 0,
  phase: 'setup',
  rounds: [],
  currentRound: 1,
  gameStarted: false,
  winner: null,
};

export function useGame() {
  const [gameState, setGameState] = useState<GameState>(initialState);
  const [selectedCards, setSelectedCards] = useState<Card[]>([]);
  const aiTimeoutRef = useRef<NodeJS.Timeout>();
  
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const isHumanTurn = currentPlayer && !currentPlayer.isComputer;
  
  // Cleanup AI timeout on unmount
  useEffect(() => {
    return () => {
      if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
    };
  }, []);
  
  const addPlayer = useCallback((name: string, isComputer = false) => {
    setGameState(prev => {
      if (prev.players.length >= 4) return prev;
      
      const usedColors = prev.players.map(p => p.color);
      const availableColor = PLAYER_COLORS.find(c => !usedColors.includes(c)) || 'player-1';
      const computerCount = prev.players.filter(p => p.isComputer).length;
      
      const newPlayer: Player = {
        id: generateId(),
        name: isComputer ? computerNames[computerCount] || `電腦${computerCount + 1}` : name,
        isComputer,
        cards: [],
        hasPassed: false,
        roundsWon: 0,
        totalScore: 0,
        color: availableColor,
      };
      
      return { ...prev, players: [...prev.players, newPlayer] };
    });
  }, []);
  
  const removePlayer = useCallback((playerId: string) => {
    setGameState(prev => ({
      ...prev,
      players: prev.players.filter(p => p.id !== playerId),
    }));
  }, []);
  
  const startGame = useCallback(() => {
    setGameState(prev => {
      if (prev.players.length < 2) return prev;
      
      const deck = shuffleDeck(createDeck());
      const hands = dealCards(deck, prev.players.length);
      
      const players = prev.players.map((p, i) => ({
        ...p,
        cards: hands[i],
        hasPassed: false,
      }));
      
      // Find player with 3 of clubs to start
      const starterIndex = findPlayerWithCard(players, '3', 'clubs');
      
      return {
        ...prev,
        players,
        currentPlayerIndex: starterIndex >= 0 ? starterIndex : 0,
        lastPlay: null,
        lastPlayerId: null,
        consecutivePasses: 0,
        phase: 'playing',
        gameStarted: true,
      };
    });
  }, []);
  
  const toggleCardSelection = useCallback((card: Card) => {
    setSelectedCards(prev => {
      const key = getCardKey(card);
      const exists = prev.some(c => getCardKey(c) === key);
      
      if (exists) {
        return prev.filter(c => getCardKey(c) !== key);
      } else {
        if (prev.length >= 5) return prev;
        return [...prev, card];
      }
    });
  }, []);
  
  const clearSelection = useCallback(() => {
    setSelectedCards([]);
  }, []);
  
  const playCards = useCallback((cards: Card[]) => {
    const hand = detectHandType(cards);
    if (!hand) return;
    
    setGameState(prev => {
      if (!canPlayOn(hand, prev.lastPlay)) return prev;
      
      const currentPlayer = prev.players[prev.currentPlayerIndex];
      const remainingCards = currentPlayer.cards.filter(
        c => !cards.some(sc => getCardKey(sc) === getCardKey(c))
      );
      
      const updatedPlayers = prev.players.map((p, i) => 
        i === prev.currentPlayerIndex 
          ? { ...p, cards: remainingCards, hasPassed: false }
          : p
      );
      
      // Check for win
      if (remainingCards.length === 0) {
        return {
          ...prev,
          players: updatedPlayers,
          lastPlay: hand,
          lastPlayerId: currentPlayer.id,
          phase: 'roundEnd',
          winner: currentPlayer.id,
        };
      }
      
      const nextIndex = (prev.currentPlayerIndex + 1) % prev.players.length;
      
      return {
        ...prev,
        players: updatedPlayers,
        currentPlayerIndex: nextIndex,
        lastPlay: hand,
        lastPlayerId: currentPlayer.id,
        consecutivePasses: 0,
      };
    });
    
    setSelectedCards([]);
  }, []);
  
  const pass = useCallback(() => {
    setGameState(prev => {
      const newPasses = prev.consecutivePasses + 1;
      
      // If everyone passed, clear the board
      if (newPasses >= prev.players.length - 1) {
        const updatedPlayers = prev.players.map(p => ({ ...p, hasPassed: false }));
        return {
          ...prev,
          players: updatedPlayers,
          currentPlayerIndex: prev.players.findIndex(p => p.id === prev.lastPlayerId),
          lastPlay: null,
          lastPlayerId: null,
          consecutivePasses: 0,
        };
      }
      
      const updatedPlayers = prev.players.map((p, i) => 
        i === prev.currentPlayerIndex ? { ...p, hasPassed: true } : p
      );
      
      let nextIndex = (prev.currentPlayerIndex + 1) % prev.players.length;
      // Skip players who have passed
      while (updatedPlayers[nextIndex].hasPassed && nextIndex !== prev.currentPlayerIndex) {
        nextIndex = (nextIndex + 1) % prev.players.length;
      }
      
      return {
        ...prev,
        players: updatedPlayers,
        currentPlayerIndex: nextIndex,
        consecutivePasses: newPasses,
      };
    });
  }, []);
  
  // AI turn logic
  useEffect(() => {
    if (gameState.phase !== 'playing') return;
    if (!currentPlayer?.isComputer) return;
    
    aiTimeoutRef.current = setTimeout(() => {
      const bestPlay = findBestPlay(currentPlayer.cards, gameState.lastPlay);
      
      if (bestPlay) {
        playCards(bestPlay);
      } else {
        pass();
      }
    }, 1000);
    
    return () => {
      if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
    };
  }, [gameState.currentPlayerIndex, gameState.phase, currentPlayer, gameState.lastPlay, playCards, pass]);
  
  const nextRound = useCallback(() => {
    setGameState(prev => {
      const deck = shuffleDeck(createDeck());
      const hands = dealCards(deck, prev.players.length);
      
      const players = prev.players.map((p, i) => ({
        ...p,
        cards: hands[i],
        hasPassed: false,
        totalScore: p.totalScore + (p.id === prev.winner 
          ? prev.players.reduce((sum, op) => sum + op.cards.length, 0)
          : -p.cards.length
        ),
      }));
      
      const starterIndex = findPlayerWithCard(players, '3', 'clubs');
      
      return {
        ...prev,
        players,
        currentPlayerIndex: starterIndex >= 0 ? starterIndex : 0,
        lastPlay: null,
        lastPlayerId: null,
        consecutivePasses: 0,
        phase: 'playing',
        currentRound: prev.currentRound + 1,
        winner: null,
      };
    });
  }, []);
  
  const endGame = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      phase: 'gameOver',
    }));
  }, []);
  
  const resetGame = useCallback(() => {
    setGameState(initialState);
    setSelectedCards([]);
  }, []);
  
  return {
    gameState,
    currentPlayer,
    isHumanTurn,
    selectedCards,
    addPlayer,
    removePlayer,
    startGame,
    toggleCardSelection,
    clearSelection,
    playCards,
    pass,
    nextRound,
    endGame,
    resetGame,
  };
}
