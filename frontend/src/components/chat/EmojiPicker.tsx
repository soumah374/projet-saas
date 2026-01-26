import { useState } from 'react';
import { Button } from '../ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Smile } from 'lucide-react';
import { cn } from '../../lib/utils';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  className?: string;
}

const EMOJI_CATEGORIES = {
  'Fréquents': ['👍', '❤️', '😊', '😂', '🎉', '👏', '🔥', '✅', '👀', '🙏'],
  'Smileys': ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😍', '🥰', '😘', '😋', '😜', '🤔', '😎', '🤩', '😢'],
  'Gestes': ['👍', '👎', '👌', '✌️', '🤞', '🤝', '👏', '🙌', '💪', '🙏', '👋', '✋', '🖐️', '🤙', '👊', '✊', '🤚', '👐', '🤲', '🫶'],
  'Objets': ['💼', '📁', '📂', '📄', '📋', '📊', '📈', '📉', '📆', '📅', '✏️', '📝', '💰', '💵', '💳', '📧', '📩', '🔗', '📎', '🔔'],
  'Symboles': ['✅', '❌', '⚠️', '❗', '❓', '💡', '🔥', '⭐', '🎯', '🏆', '🚀', '💯', '🔴', '🟡', '🟢', '🔵', '⏰', '🔒', '🔓', '📌'],
};

export function EmojiPicker({ onEmojiSelect, className }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<keyof typeof EMOJI_CATEGORIES>('Fréquents');

  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn('h-8 w-8', className)}
        >
          <Smile className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-2" align="end" side="top">
        {/* Category tabs */}
        <div className="flex gap-1 mb-2 overflow-x-auto pb-1 border-b">
          {Object.keys(EMOJI_CATEGORIES).map((category) => (
            <Button
              key={category}
              variant={activeCategory === category ? 'secondary' : 'ghost'}
              size="sm"
              className="text-xs px-2 py-1 h-7 whitespace-nowrap"
              onClick={() => setActiveCategory(category as keyof typeof EMOJI_CATEGORIES)}
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Emoji grid */}
        <div className="grid grid-cols-10 gap-1 max-h-48 overflow-y-auto">
          {EMOJI_CATEGORIES[activeCategory].map((emoji, index) => (
            <button
              key={`${emoji}-${index}`}
              type="button"
              className="w-7 h-7 flex items-center justify-center text-lg hover:bg-muted rounded transition-colors"
              onClick={() => handleEmojiClick(emoji)}
            >
              {emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Quick reaction picker (for message hover)
interface QuickReactionPickerProps {
  onReactionSelect: (emoji: string) => void;
  className?: string;
}

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '👏'];

export function QuickReactionPicker({ onReactionSelect, className }: QuickReactionPickerProps) {
  return (
    <div className={cn('flex items-center gap-0.5 bg-background border rounded-full px-1 py-0.5 shadow-sm', className)}>
      {QUICK_REACTIONS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          className="w-6 h-6 flex items-center justify-center text-sm hover:bg-muted rounded-full transition-colors"
          onClick={() => onReactionSelect(emoji)}
        >
          {emoji}
        </button>
      ))}
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="w-6 h-6 flex items-center justify-center text-sm hover:bg-muted rounded-full transition-colors"
          >
            <Smile className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align="end" side="top">
          <div className="grid grid-cols-8 gap-1">
            {Object.values(EMOJI_CATEGORIES).flat().slice(0, 40).map((emoji, index) => (
              <button
                key={`${emoji}-${index}`}
                type="button"
                className="w-7 h-7 flex items-center justify-center text-lg hover:bg-muted rounded transition-colors"
                onClick={() => onReactionSelect(emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
