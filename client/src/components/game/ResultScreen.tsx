import { motion } from 'framer-motion';
import { Trophy, Medal, RotateCcw, Home, Sparkles } from 'lucide-react';
import type { Player } from '@/types/game';
import { PlayerCard } from './PlayerCard';

interface ResultScreenProps {
  players: Player[];
  onRestart: () => void;
  onNewGame: () => void;
}

export function ResultScreen({ players, onRestart, onNewGame }: ResultScreenProps) {
  const sortedPlayers = [...players].sort((a, b) => b.totalScore - a.totalScore);
  const winner = sortedPlayers[0];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-background/80 backdrop-blur-xl"
      />

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-primary/50"
            initial={{
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 400),
              y: (typeof window !== 'undefined' ? window.innerHeight : 800) + 100,
            }}
            animate={{
              y: -100,
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 400),
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: 'spring' }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="glass rounded-3xl p-6 glow space-y-6">
          {/* Winner Section */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center"
          >
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="inline-block"
            >
              <Trophy className="w-16 h-16 text-primary mx-auto mb-3" />
            </motion.div>
            <h2 className="text-3xl font-black text-gradient mb-1">遊戲結束!</h2>
          </motion.div>

          {/* Winner Highlight */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="relative"
          >
            <div className="absolute inset-0 gradient-flow rounded-2xl opacity-20" />
            <div className="relative glass rounded-2xl p-4 border-2 border-primary/50">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-xl gradient-flow flex items-center justify-center">
                    <Medal className="w-8 h-8 text-white" />
                  </div>
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute -top-1 -right-1"
                  >
                    <Sparkles className="w-5 h-5 text-primary" />
                  </motion.div>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">冠軍</p>
                  <h3 className="text-xl font-bold">{winner.name}</h3>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-gradient">{winner.totalScore}</p>
                  <p className="text-xs text-muted-foreground">總分</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Other Players */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="space-y-3"
          >
            {sortedPlayers.slice(1).map((player, index) => (
              <motion.div
                key={player.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.9 + index * 0.1 }}
              >
                <PlayerCard player={player} rank={index + 2} />
              </motion.div>
            ))}
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="flex gap-3"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onRestart}
              className="flex-1 py-4 rounded-xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              再來一局
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onNewGame}
              className="py-4 px-6 rounded-xl bg-muted text-muted-foreground font-medium flex items-center justify-center gap-2"
            >
              <Home className="w-5 h-5" />
            </motion.button>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}
