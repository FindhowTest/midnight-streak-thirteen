import { motion, AnimatePresence } from 'framer-motion';
import type { Hand, Player } from '@/types/game';
import { PlayingCard } from './PlayingCard';
import { getCardKey, getHandTypeName } from '@/utils/cardUtils';

interface PlayAreaProps {
  lastPlay: Hand | null;
  lastPlayer: Player | null;
}

export function PlayArea({ lastPlay, lastPlayer }: PlayAreaProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[120px]">
      <AnimatePresence mode="wait">
        {lastPlay ? (
          <motion.div
            key="play"
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: -20 }}
            className="flex flex-col items-center gap-2"
          >
            <div className="flex -space-x-4">
              {lastPlay.cards.map((card, index) => (
                <motion.div
                  key={getCardKey(card)}
                  initial={{ opacity: 0, x: -20, rotate: -10 }}
                  animate={{ 
                    opacity: 1, 
                    x: 0, 
                    rotate: (index - (lastPlay.cards.length - 1) / 2) * 5 
                  }}
                  transition={{ delay: index * 0.05 }}
                  style={{ zIndex: index }}
                >
                  <PlayingCard card={card} disabled />
                </motion.div>
              ))}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="px-2 py-1 rounded-full bg-primary/20 text-primary font-medium">
                {getHandTypeName(lastPlay.type)}
              </span>
              {lastPlayer && (
                <span className="text-muted-foreground">
                  by {lastPlayer.name}
                </span>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-muted-foreground text-center"
          >
            <p className="text-4xl mb-2">🎴</p>
            <p>等待出牌...</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
