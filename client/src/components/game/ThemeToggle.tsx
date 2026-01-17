import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  isDark: boolean;
  onToggle: () => void;
}

export function ThemeToggle({ isDark, onToggle }: ThemeToggleProps) {
  return (
    <motion.button
      onClick={onToggle}
      className="relative w-16 h-8 rounded-full glass glow p-1 transition-colors"
      whileTap={{ scale: 0.95 }}
    >
      <motion.div
        className="absolute w-6 h-6 rounded-full bg-primary flex items-center justify-center"
        animate={{ x: isDark ? 32 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      >
        {isDark ? (
          <Moon className="w-4 h-4 text-primary-foreground" />
        ) : (
          <Sun className="w-4 h-4 text-primary-foreground" />
        )}
      </motion.div>
    </motion.button>
  );
}
