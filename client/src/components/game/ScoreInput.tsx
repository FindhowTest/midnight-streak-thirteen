import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Trophy } from 'lucide-react';
import type { Player } from '@/types/game';

interface ScoreInputProps {
  players: Player[];
  currentRound: number;
  onSubmit: (scores: Record<string, number>) => void;
  onEndGame: () => void;
}

export function ScoreInput({ players, currentRound, onSubmit, onEndGame }: ScoreInputProps) {
  const [scores, setScores] = useState<Record<string, string>>(() =>
    players.reduce((acc, p) => ({ ...acc, [p.id]: '' }), {})
  );
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = () => {
    const numericScores = Object.entries(scores).reduce(
      (acc, [id, val]) => ({
        ...acc,
        [id]: parseInt(val) || 0,
      }),
      {}
    );
    onSubmit(numericScores);
    setScores(players.reduce((acc, p) => ({ ...acc, [p.id]: '' }), {}));
    setIsOpen(false);
  };

  const isValid = Object.values(scores).some(s => s !== '');

  return (
    <div className="space-y-4">
      <AnimatePresence mode="wait">
        {!isOpen ? (
          <motion.div
            key="buttons"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex gap-3"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsOpen(true)}
              disabled={players.length < 2}
              className="flex-1 py-4 rounded-2xl gradient-flow text-white font-bold text-lg glow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              第 {currentRound} 回合計分
            </motion.button>
            
            {currentRound > 1 && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onEndGame}
                className="w-14 h-14 rounded-2xl bg-accent text-accent-foreground flex items-center justify-center glow"
              >
                <Trophy className="w-6 h-6" />
              </motion.button>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass rounded-2xl p-4 space-y-4"
          >
            <h3 className="font-bold text-lg text-center">第 {currentRound} 回合</h3>
            
            <div className="space-y-3">
              {players.map(player => (
                <div key={player.id} className="flex items-center gap-3">
                  <span className="flex-1 font-medium truncate">{player.name}</span>
                  <input
                    type="number"
                    value={scores[player.id]}
                    onChange={(e) => setScores(prev => ({ ...prev, [player.id]: e.target.value }))}
                    placeholder="分數"
                    className="w-24 px-3 py-2 rounded-xl bg-background/50 border border-border text-center focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
              ))}
            </div>
            
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={!isValid}
                className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Check className="w-5 h-5" />
                確認
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsOpen(false)}
                className="py-3 px-4 rounded-xl bg-muted text-muted-foreground font-medium flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
