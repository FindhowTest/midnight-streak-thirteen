import { motion } from 'framer-motion';
import { Spade } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

interface GameHeaderProps {
  isDark: boolean;
  onToggleTheme: () => void;
}

export function GameHeader({ isDark, onToggleTheme }: GameHeaderProps) {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="flex items-center justify-between mb-6"
    >
      <div className="flex items-center gap-3">
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          className="w-12 h-12 rounded-xl gradient-flow flex items-center justify-center glow"
        >
          <Spade className="w-6 h-6 text-white" />
        </motion.div>
        <div>
          <h1 className="text-2xl font-black text-gradient">13隻</h1>
          <p className="text-sm text-muted-foreground">計分板</p>
        </div>
      </div>
      
      <ThemeToggle isDark={isDark} onToggle={onToggleTheme} />
    </motion.header>
  );
}
