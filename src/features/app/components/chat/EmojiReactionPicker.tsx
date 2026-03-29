import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SmilePlus } from 'lucide-react';
import { cn } from '@/lib/utils';

const EMOJI_QUICK_PICKS = ['👍', '❤️', '😂', '🎉', '🔥', '👏'];

const EMOJI_CATEGORIES: Record<string, string[]> = {
  '😀': ['😀', '😃', '😄', '😁', '😆', '🤣', '😂', '🙂', '😊', '😇', '🥰', '😍', '🤩', '😘', '😋', '🤪', '😜', '🤔', '🫡', '🤫'],
  '👍': ['👍', '👎', '👏', '🙌', '🤝', '✌️', '🤞', '💪', '🫶', '❤️'],
  '🎉': ['🎉', '🎊', '🔥', '⭐', '✨', '💯', '🏆', '🥇', '🚀', '💡'],
  '😢': ['😢', '😭', '😤', '😠', '🤯', '😱', '😰', '🥺', '😩', '💔'],
};

interface EmojiReactionPickerProps {
  onSelect: (emoji: string) => void;
  className?: string;
}

export function EmojiReactionPicker({ onSelect, className }: EmojiReactionPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setActiveCategory(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelect = (emoji: string) => {
    onSelect(emoji);
    setIsOpen(false);
    setActiveCategory(null);
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Trigger */}
      <motion.button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.9 }}
        className={cn(
          "h-6 w-6 rounded-full flex items-center justify-center",
          "bg-card/90 border border-border/60 shadow-sm backdrop-blur-sm",
          "hover:bg-primary/10 hover:border-primary/30",
          "transition-colors duration-150",
          isOpen && "bg-primary/10 border-primary/30"
        )}
      >
        <SmilePlus className="h-3 w-3 text-muted-foreground" />
      </motion.button>

      {/* Picker panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 4 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={cn(
              "absolute z-50 bottom-full mb-2",
              "bg-card border border-border/80 rounded-xl shadow-xl",
              "backdrop-blur-md overflow-hidden",
              "min-w-[220px]"
            )}
          >
            {/* Quick picks */}
            <div className="flex items-center gap-0.5 p-2 border-b border-border/40">
              {EMOJI_QUICK_PICKS.map((emoji) => (
                <motion.button
                  key={emoji}
                  type="button"
                  onClick={() => handleSelect(emoji)}
                  whileHover={{ scale: 1.25, y: -2 }}
                  whileTap={{ scale: 0.85 }}
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-lg hover:bg-muted/60 transition-colors"
                >
                  {emoji}
                </motion.button>
              ))}
            </div>

            {/* Category tabs */}
            <div className="flex items-center gap-0.5 px-2 pt-1.5 pb-1">
              {Object.keys(EMOJI_CATEGORIES).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                  className={cn(
                    "h-7 w-7 rounded-md flex items-center justify-center text-sm transition-colors",
                    activeCategory === cat
                      ? "bg-primary/15 ring-1 ring-primary/30"
                      : "hover:bg-muted/50"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Expanded category grid */}
            <AnimatePresence>
              {activeCategory && EMOJI_CATEGORIES[activeCategory] && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-7 gap-0.5 p-2 pt-0 max-h-[140px] overflow-y-auto scrollbar-hide">
                    {EMOJI_CATEGORIES[activeCategory].map((emoji) => (
                      <motion.button
                        key={emoji}
                        type="button"
                        onClick={() => handleSelect(emoji)}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.85 }}
                        className="h-8 w-8 rounded-md flex items-center justify-center text-base hover:bg-muted/60 transition-colors"
                      >
                        {emoji}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
