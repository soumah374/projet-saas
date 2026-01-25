import { useState } from 'react';
import { Button } from '../ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import { SmilePlus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { ReactionSummary, useAddReaction, useRemoveReaction } from '../../hooks/use-chat';

interface MessageReactionsProps {
  messageId: string;
  reactions: ReactionSummary[];
  isOwnMessage: boolean;
}

// Common emoji reactions
const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🎉'];

// Extended emoji picker
const EMOJI_CATEGORIES = {
  'Smileys': ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😌', '😍', '🥰', '😘'],
  'Gestures': ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '👏', '🙌', '👐', '🤲', '🙏', '💪'],
  'Hearts': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🤎', '🖤', '🤍', '💔', '💖', '💗', '💓', '💕'],
  'Objects': ['🎉', '🎊', '🎁', '🏆', '🥇', '💯', '✅', '❌', '⭐', '🌟', '💡', '🔥', '💥'],
};

export function MessageReactions({
  messageId,
  reactions,
  isOwnMessage,
}: MessageReactionsProps) {
  const [showPicker, setShowPicker] = useState(false);
  const addReactionMutation = useAddReaction();
  const removeReactionMutation = useRemoveReaction();

  const handleReaction = async (emoji: string) => {
    const existingReaction = reactions.find((r) => r.emoji === emoji && r.hasReacted);

    try {
      if (existingReaction) {
        await removeReactionMutation.mutateAsync({ messageId, emoji });
      } else {
        await addReactionMutation.mutateAsync({ messageId, emoji });
      }
      setShowPicker(false);
    } catch (error) {
      console.error('Error toggling reaction:', error);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1">
      {/* Display existing reactions */}
      {reactions.map((reaction) => (
        <TooltipProvider key={reaction.emoji}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'h-6 px-2 text-xs rounded-full',
                  reaction.hasReacted
                    ? 'bg-primary/10 border border-primary/30'
                    : 'bg-muted hover:bg-muted/80'
                )}
                onClick={() => handleReaction(reaction.emoji)}
                disabled={addReactionMutation.isPending || removeReactionMutation.isPending}
              >
                <span className="mr-1">{reaction.emoji}</span>
                <span>{reaction.count}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              {reaction.users?.map((u) => u.fullName).join(', ') || `${reaction.count} réaction(s)`}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}

      {/* Add reaction button */}
      <Popover open={showPicker} onOpenChange={setShowPicker}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <SmilePlus className="h-4 w-4 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-72 p-0"
          side={isOwnMessage ? 'left' : 'right'}
          align="start"
        >
          {/* Quick reactions */}
          <div className="flex items-center justify-center gap-1 p-2 border-b">
            {QUICK_REACTIONS.map((emoji) => (
              <Button
                key={emoji}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-lg hover:bg-muted"
                onClick={() => handleReaction(emoji)}
              >
                {emoji}
              </Button>
            ))}
          </div>

          {/* Extended emoji picker */}
          <div className="max-h-60 overflow-y-auto p-2">
            {Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
              <div key={category} className="mb-3">
                <p className="text-xs text-muted-foreground mb-1 px-1">
                  {category}
                </p>
                <div className="flex flex-wrap gap-1">
                  {emojis.map((emoji) => (
                    <Button
                      key={emoji}
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-base hover:bg-muted"
                      onClick={() => handleReaction(emoji)}
                    >
                      {emoji}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

// Compact version for showing reactions without picker
export function MessageReactionsDisplay({
  reactions,
  onReactionClick,
}: {
  reactions: ReactionSummary[];
  onReactionClick?: (emoji: string) => void;
}) {
  if (reactions.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1 mt-1">
      {reactions.map((reaction) => (
        <TooltipProvider key={reaction.emoji}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className={cn(
                  'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs',
                  reaction.hasReacted
                    ? 'bg-primary/10 border border-primary/30'
                    : 'bg-muted/50'
                )}
                onClick={() => onReactionClick?.(reaction.emoji)}
              >
                <span>{reaction.emoji}</span>
                <span className="text-muted-foreground">{reaction.count}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              {reaction.users?.map((u) => u.fullName).join(', ')}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
    </div>
  );
}
