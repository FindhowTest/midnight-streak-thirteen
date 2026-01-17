import { motion } from 'framer-motion';
import type { Card } from '@/types/game';
import { SUIT_SYMBOLS, SUIT_COLORS } from '@/utils/cardUtils';
import { cn } from '@/lib/utils';

interface PlayingCardProps {
  card: Card;
  selected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  small?: boolean;
  faceDown?: boolean;
}

export function PlayingCard({ 
  card, 
  selected = false, 
  onClick, 
  disabled = false,
  small = false,
  faceDown = false,
}: PlayingCardProps) {
  const suitColor = SUIT_COLORS[card.suit];
  const symbol = SUIT_SYMBOLS[card.suit];
  
  if (faceDown) {
    return (
      <div className={cn(
        "rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center",
        small ? "w-8 h-11" : "w-14 h-20",
        "border-2 border-primary/50"
      )}>
        <span className="text-white/50 text-lg">🂠</span>
      </div>
    );
  }
  
  return (
    <motion.button
      whileHover={!disabled ? { y: -8, scale: 1.05 } : undefined}
      whileTap={!disabled ? { scale: 0.95 } : undefined}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative rounded-lg bg-card border-2 transition-all flex flex-col items-center justify-center font-bold shadow-lg",
        small ? "w-8 h-11 text-xs" : "w-14 h-20 text-sm",
        selected 
          ? "border-primary ring-2 ring-primary/50 -translate-y-3 shadow-primary/30" 
          : "border-border hover:border-primary/50",
        disabled && "opacity-50 cursor-not-allowed",
        suitColor
      )}
    >
      <span className={cn(small ? "text-sm" : "text-lg")}>{card.rank}</span>
      <span className={cn(small ? "text-base" : "text-xl")}>{symbol}</span>
      
      {/* Corner indicators */}
      <span className={cn(
        "absolute top-1 left-1",
        small ? "text-[8px]" : "text-[10px]"
      )}>
        {card.rank}{symbol}
      </span>
    </motion.button>
  );
}
