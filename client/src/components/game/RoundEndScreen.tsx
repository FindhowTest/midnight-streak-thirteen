import { motion } from 'framer-motion';
import { Trophy, ArrowRight, Home } from 'lucide-react';
import type { Player } from '@/types/game';

interface RoundEndScreenProps {
  winner: Player;
  players: Player[];
  roundNumber: number;
  onNextRound: () => void;
  onEndGame: () => void;
}

export function RoundEndScreen({ 
  winner, 
  players, 
  roundNumber,
  onNextRound, 
  onEndGame 
}: RoundEndScreenProps) {
  // Calculate scores for this round
  const scores = players.map(p => ({
    player: p,
    cardsLeft: p.cards.length,
    score: p.id === winner.id ? players.reduce((sum, op) => sum + op.cards.length, 0) : -p.cards.length,
  }));
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-background/80 backdrop-blur-xl" />
      
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: 'spring' }}
        className="relative z-10 w-full max-w-md glass rounded-3xl p-6 glow"
      >
        <div className="text-center mb-6">
          <motion.div
            animate={{ rotate: [0, -10, 10, 0] }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Trophy className="w-12 h-12 text-primary mx-auto mb-2" />
          </motion.div>
          <h2 className="text-2xl font-black text-gradient">第 {roundNumber} 回合結束!</h2>
          <p className="text-muted-foreground">{winner.name} 獲勝!</p>
        </div>
        
        <div className="space-y-3 mb-6">
          {scores.map(({ player, cardsLeft, score }) => (
            <motion.div
              key={player.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className={`flex items-center justify-between p-3 rounded-xl ${
                player.id === winner.id ? 'bg-primary/20' : 'bg-muted/50'
              }`}
            >
              <span className="font-medium">{player.name}</span>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  剩 {cardsLeft} 張
                </span>
                <span className={`font-bold ${score > 0 ? 'text-green-500' : score < 0 ? 'text-red-500' : ''}`}>
                  {score > 0 ? '+' : ''}{score}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
        
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onNextRound}
            className="flex-1 py-4 rounded-xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2"
          >
            <ArrowRight className="w-5 h-5" />
            下一回合
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onEndGame}
            className="py-4 px-6 rounded-xl bg-muted text-muted-foreground"
          >
            <Home className="w-5 h-5" />
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
