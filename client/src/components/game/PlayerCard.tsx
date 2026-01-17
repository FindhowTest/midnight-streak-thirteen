import { motion } from 'framer-motion';
import { User, Bot, X } from 'lucide-react';
import type { Player } from '@/types/game';

// 讓十三水/其他模式也能共用：只需要這幾個欄位
type PlayerLite = Pick<Player, 'name' | 'isComputer' | 'color' | 'totalScore'>;

interface PlayerCardProps {
  player: PlayerLite;
  onRemove?: () => void;
  showRemove?: boolean;
  rank?: number;
}

const colorClasses: Record<PlayerLite['color'], string> = {
  'player-1': 'from-[hsl(200,90%,50%)] to-[hsl(200,90%,40%)]',
  'player-2': 'from-[hsl(340,85%,55%)] to-[hsl(340,85%,45%)]',
  'player-3': 'from-[hsl(150,70%,45%)] to-[hsl(150,70%,35%)]',
  'player-4': 'from-[hsl(45,95%,55%)] to-[hsl(45,95%,45%)]',
};

const darkColorClasses: Record<PlayerLite['color'], string> = {
  'player-1': 'dark:from-[hsl(200,95%,60%)] dark:to-[hsl(200,95%,50%)]',
  'player-2': 'dark:from-[hsl(340,90%,65%)] dark:to-[hsl(340,90%,55%)]',
  'player-3': 'dark:from-[hsl(150,80%,55%)] dark:to-[hsl(150,80%,45%)]',
  'player-4': 'dark:from-[hsl(45,100%,60%)] dark:to-[hsl(45,100%,50%)]',
};

export function PlayerCard({ player, onRemove, showRemove = false, rank }: PlayerCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="relative glass rounded-2xl p-4 glow"
    >
      {showRemove && onRemove && (
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onRemove}
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </motion.button>
      )}
      
      {rank !== undefined && (
        <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
          #{rank}
        </div>
      )}
      
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[player.color]} ${darkColorClasses[player.color]} flex items-center justify-center`}>
          {player.isComputer ? (
            <Bot className="w-6 h-6 text-white" />
          ) : (
            <User className="w-6 h-6 text-white" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-foreground truncate">{player.name}</h3>
          <p className="text-sm text-muted-foreground">
            {player.isComputer ? '電腦玩家' : '真人玩家'}
          </p>
        </div>
        
        <div className="text-right">
          <p className="text-2xl font-black text-gradient">{player.totalScore}</p>
          <p className="text-xs text-muted-foreground">總分</p>
        </div>
      </div>
    </motion.div>
  );
}
