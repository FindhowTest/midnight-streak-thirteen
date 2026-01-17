import { useState } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Bot, Plus } from 'lucide-react';

interface AddPlayerFormProps {
  onAddPlayer: (name: string, isComputer: boolean) => void;
  playerCount: number;
}

export function AddPlayerForm({ onAddPlayer, playerCount }: AddPlayerFormProps) {
  const [name, setName] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onAddPlayer(name.trim(), false);
      setName('');
      setIsOpen(false);
    }
  };

  const handleAddComputer = () => {
    onAddPlayer('', true);
  };

  if (playerCount >= 4) {
    return null;
  }

  return (
    <motion.div
      layout
      className="glass rounded-2xl p-4"
    >
      {!isOpen ? (
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsOpen(true)}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary font-medium transition-colors"
          >
            <UserPlus className="w-5 h-5" />
            加入玩家
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAddComputer}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-secondary/10 hover:bg-secondary/20 text-secondary font-medium transition-colors"
          >
            <Bot className="w-5 h-5" />
            加入電腦
          </motion.button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="輸入玩家名稱..."
            className="flex-1 px-4 py-3 rounded-xl bg-background/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            autoFocus
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={!name.trim()}
            className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50"
          >
            <Plus className="w-5 h-5" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => setIsOpen(false)}
            className="w-12 h-12 rounded-xl bg-muted text-muted-foreground flex items-center justify-center"
          >
            ✕
          </motion.button>
        </form>
      )}
    </motion.div>
  );
}
