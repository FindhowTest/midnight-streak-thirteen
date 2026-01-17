import { motion, AnimatePresence } from 'framer-motion';
import type { Card, Player } from '@/types/game';
import { PlayingCard } from './PlayingCard';
import { getCardKey } from '@/utils/cardUtils';
import { Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlayerHandProps {
  player: Player;
  isCurrentPlayer: boolean;
  isHuman: boolean;
  selectedCards: Card[];
  onCardSelect?: (card: Card) => void;
  position: 'bottom' | 'left' | 'top' | 'right';
}

const colorClasses: Record<Player['color'], string> = {
  'player-1': 'from-[hsl(200,90%,50%)] to-[hsl(200,90%,40%)]',
  'player-2': 'from-[hsl(340,85%,55%)] to-[hsl(340,85%,45%)]',
  'player-3': 'from-[hsl(150,70%,45%)] to-[hsl(150,70%,35%)]',
  'player-4': 'from-[hsl(45,95%,55%)] to-[hsl(45,95%,45%)]',
};

export function PlayerHand({
  player,
  isCurrentPlayer,
  isHuman,
  selectedCards,
  onCardSelect,
  position,
}: PlayerHandProps) {
  const isBottom = position === 'bottom';
  const isHorizontal = position === 'left' || position === 'right';
  
  const selectedKeys = new Set(selectedCards.map(getCardKey));
  
  return (
    <motion.div
      animate={{ 
        scale: isCurrentPlayer ? 1.02 : 1,
        opacity: player.hasPassed ? 0.5 : 1,
      }}
      className={cn(
        "flex flex-col items-center gap-2",
        isHorizontal && "flex-row"
      )}
    >
      {/* Player info */}
      <div className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-xl glass",
        isCurrentPlayer && "ring-2 ring-primary glow"
      )}>
        <div className={cn(
          "w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center",
          colorClasses[player.color]
        )}>
          {player.isComputer ? (
            <Bot className="w-4 h-4 text-white" />
          ) : (
            <User className="w-4 h-4 text-white" />
          )}
        </div>
        <div className="text-left">
          <p className="text-sm font-bold truncate max-w-[80px]">{player.name}</p>
          <p className="text-xs text-muted-foreground">{player.cards.length} 張</p>
        </div>
        {player.hasPassed && (
          <span className="text-xs bg-muted px-2 py-0.5 rounded-full">Pass</span>
        )}
      </div>
      
      {/* Cards */}
      <div className={cn(
        "flex",
        isBottom ? "-space-x-6" : "-space-x-8",
        isHorizontal && "flex-col -space-y-10 -space-x-0"
      )}>
        <AnimatePresence mode="popLayout">
          {player.cards.map((card, index) => (
            <motion.div
              key={getCardKey(card)}
              layout
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1, rotate: isHorizontal ? 90 : 0 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ delay: index * 0.02 }}
              style={{ zIndex: index }}
            >
              {isBottom && isHuman ? (
                <PlayingCard
                  card={card}
                  selected={selectedKeys.has(getCardKey(card))}
                  onClick={() => onCardSelect?.(card)}
                  disabled={!isCurrentPlayer}
                />
              ) : (
                <PlayingCard
                  card={card}
                  small
                  faceDown={!isBottom}
                />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
