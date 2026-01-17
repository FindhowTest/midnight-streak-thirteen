import { motion } from 'framer-motion';
import { Play, SkipForward, RefreshCw } from 'lucide-react';
import type { Card, Hand } from '@/types/game';
import { detectHandType, canPlayOn, getHandTypeName } from '@/utils/cardUtils';

interface GameControlsProps {
  selectedCards: Card[];
  lastPlay: Hand | null;
  canPass: boolean;
  onPlay: () => void;
  onPass: () => void;
  onClearSelection: () => void;
  disabled: boolean;
}

export function GameControls({
  selectedCards,
  lastPlay,
  canPass,
  onPlay,
  onPass,
  onClearSelection,
  disabled,
}: GameControlsProps) {
  const detectedHand = detectHandType(selectedCards);
  const isValidPlay = detectedHand && canPlayOn(detectedHand, lastPlay);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-center gap-3"
    >
      {/* Selection info */}
      <div className="text-center min-w-[100px]">
        {selectedCards.length > 0 ? (
          <div className="flex flex-col items-center">
            <span className="text-sm text-muted-foreground">
              已選 {selectedCards.length} 張
            </span>
            {detectedHand ? (
              <span className={`text-sm font-medium ${isValidPlay ? 'text-green-500' : 'text-red-500'}`}>
                {getHandTypeName(detectedHand.type)}
                {!isValidPlay && ' (無法出)'}
              </span>
            ) : (
              <span className="text-sm text-red-500">無效牌型</span>
            )}
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">選擇要出的牌</span>
        )}
      </div>
      
      {/* Action buttons */}
      <div className="flex gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onClearSelection}
          disabled={disabled || selectedCards.length === 0}
          className="p-3 rounded-xl bg-muted text-muted-foreground disabled:opacity-50"
        >
          <RefreshCw className="w-5 h-5" />
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onPlay}
          disabled={disabled || !isValidPlay}
          className="px-6 py-3 rounded-xl gradient-flow text-white font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed glow"
        >
          <Play className="w-5 h-5" />
          出牌
        </motion.button>
        
        {canPass && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onPass}
            disabled={disabled}
            className="px-4 py-3 rounded-xl bg-muted text-muted-foreground font-medium flex items-center gap-2 disabled:opacity-50"
          >
            <SkipForward className="w-5 h-5" />
            Pass
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
