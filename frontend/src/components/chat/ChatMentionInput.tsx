import { useState, useEffect, useRef, useCallback, KeyboardEvent, ChangeEvent } from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Textarea } from '../ui/textarea';
import { Send, User, Folder, FileText, Receipt, X, Paperclip, Image as ImageIcon } from 'lucide-react';
import { useSearchMentionables, Mentionable, MentionInput } from '../../hooks/use-chat';
import { EmojiPicker } from './EmojiPicker';
import { cn } from '../../lib/utils';

interface ChatMentionInputProps {
  value: string;
  onChange: (value: string, mentions: MentionInput[]) => void;
  onSend: () => void;
  placeholder?: string;
  disabled?: boolean;
  replyTo?: {
    id: string;
    content: string;
    senderName: string;
  } | null;
  onCancelReply?: () => void;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
  onFileSelect?: (files: FileList) => void;
  showAttachments?: boolean;
  hasAttachments?: boolean;
}

const MENTION_TRIGGERS = ['@'];
const MENTION_PREFIXES: Record<string, string> = {
  'p:': 'project',
  'projet:': 'project',
  'c:': 'contrat',
  'contrat:': 'contrat',
  'd:': 'devis',
  'devis:': 'devis',
  'f:': 'facture',
  'facture:': 'facture',
};

const MENTION_TYPE_ICONS: Record<string, React.ReactNode> = {
  user: <User className="h-4 w-4" />,
  project: <Folder className="h-4 w-4" />,
  contrat: <FileText className="h-4 w-4" />,
  devis: <FileText className="h-4 w-4" />,
  facture: <Receipt className="h-4 w-4" />,
};

const MENTION_TYPE_COLORS: Record<string, string> = {
  user: 'bg-blue-100 text-blue-800',
  project: 'bg-green-100 text-green-800',
  contrat: 'bg-purple-100 text-purple-800',
  devis: 'bg-orange-100 text-orange-800',
  facture: 'bg-red-100 text-red-800',
};

export function ChatMentionInput({
  value,
  onChange,
  onSend,
  placeholder = 'Tapez votre message...',
  disabled = false,
  replyTo,
  onCancelReply,
  onTypingStart,
  onTypingStop,
  onFileSelect,
  showAttachments = true,
  hasAttachments = false,
}: ChatMentionInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionType, setMentionType] = useState<string | undefined>(undefined);
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentions, setMentions] = useState<MentionInput[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle emoji selection
  const handleEmojiSelect = useCallback(
    (emoji: string) => {
      const cursorPosition = inputRef.current?.selectionStart || value.length;
      const newValue = value.slice(0, cursorPosition) + emoji + value.slice(cursorPosition);
      onChange(newValue, mentions);

      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          const newPos = cursorPosition + emoji.length;
          inputRef.current.setSelectionRange(newPos, newPos);
        }
      }, 0);
    },
    [value, mentions, onChange]
  );

  // Handle file selection
  const handleFileClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0 && onFileSelect) {
        onFileSelect(e.target.files);
        e.target.value = '';
      }
    },
    [onFileSelect]
  );

  const { mentionables, isLoading } = useSearchMentionables(mentionQuery, mentionType);

  // Handle typing indicator
  const handleTyping = useCallback(() => {
    if (onTypingStart) {
      onTypingStart();
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (onTypingStop) {
        onTypingStop();
      }
    }, 1500);
  }, [onTypingStart, onTypingStop]);

  // Parse mention type from text after @
  const parseMentionType = useCallback((text: string): { type?: string; query: string } => {
    for (const [prefix, type] of Object.entries(MENTION_PREFIXES)) {
      if (text.toLowerCase().startsWith(prefix)) {
        return { type, query: text.slice(prefix.length) };
      }
    }
    return { type: undefined, query: text };
  }, []);

  // Handle input change
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      const cursorPosition = e.target.selectionStart || 0;

      // Find if we're in a mention context
      let inMention = false;
      let startIdx = -1;
      let query = '';

      // Look backwards from cursor to find @ trigger
      for (let i = cursorPosition - 1; i >= 0; i--) {
        const char = newValue[i];
        if (char === '@') {
          // Check if @ is at start or preceded by whitespace
          if (i === 0 || /\s/.test(newValue[i - 1])) {
            inMention = true;
            startIdx = i;
            query = newValue.slice(i + 1, cursorPosition);
            break;
          }
        }
        if (/\s/.test(char)) {
          break;
        }
      }

      if (inMention && query.length >= 0) {
        const { type, query: parsedQuery } = parseMentionType(query);
        setMentionStartIndex(startIdx);
        setMentionQuery(parsedQuery);
        setMentionType(type);
        setShowSuggestions(true);
        setSelectedIndex(0);
      } else {
        setShowSuggestions(false);
        setMentionStartIndex(-1);
        setMentionQuery('');
        setMentionType(undefined);
      }

      handleTyping();
      onChange(newValue, mentions);
    },
    [onChange, mentions, handleTyping, parseMentionType]
  );

  // Insert mention into text
  const insertMention = useCallback(
    (mentionable: Mentionable) => {
      if (mentionStartIndex < 0) return;

      const cursorPosition = inputRef.current?.selectionStart || value.length;
      const beforeMention = value.slice(0, mentionStartIndex);
      const afterMention = value.slice(cursorPosition);
      const mentionText = mentionable.reference;

      const newValue = `${beforeMention}${mentionText} ${afterMention}`;
      const newMention: MentionInput = {
        mentionType: mentionable.mentionType,
        entityId: mentionable.id,
        displayText: mentionable.displayText,
        startPosition: mentionStartIndex,
        endPosition: mentionStartIndex + mentionText.length,
      };

      const updatedMentions = [...mentions, newMention];
      setMentions(updatedMentions);
      onChange(newValue, updatedMentions);

      setShowSuggestions(false);
      setMentionStartIndex(-1);
      setMentionQuery('');
      setMentionType(undefined);

      // Focus back on input and move cursor after mention
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          const newCursorPos = mentionStartIndex + mentionText.length + 1;
          inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
    },
    [value, mentionStartIndex, mentions, onChange]
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (showSuggestions && mentionables.length > 0) {
        switch (e.key) {
          case 'ArrowDown':
            e.preventDefault();
            setSelectedIndex((prev) => (prev + 1) % mentionables.length);
            break;
          case 'ArrowUp':
            e.preventDefault();
            setSelectedIndex((prev) => (prev - 1 + mentionables.length) % mentionables.length);
            break;
          case 'Enter':
            e.preventDefault();
            insertMention(mentionables[selectedIndex]);
            break;
          case 'Escape':
            e.preventDefault();
            setShowSuggestions(false);
            break;
          case 'Tab':
            e.preventDefault();
            insertMention(mentionables[selectedIndex]);
            break;
        }
      } else if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (value.trim()) {
          onSend();
          setMentions([]);
        }
      }
    },
    [showSuggestions, mentionables, selectedIndex, insertMention, value, onSend]
  );

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll selected item into view
  useEffect(() => {
    if (showSuggestions && suggestionsRef.current) {
      const selectedElement = suggestionsRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      selectedElement?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex, showSuggestions]);

  return (
    <div className="relative">
      {/* Reply preview */}
      {replyTo && (
        <div className="flex items-center gap-2 px-3 py-2 mb-2 bg-muted rounded-md text-sm">
          <div className="flex-1 truncate">
            <span className="text-muted-foreground">Réponse à </span>
            <span className="font-medium">{replyTo.senderName}</span>
            <span className="text-muted-foreground">: {replyTo.content}</span>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onCancelReply}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Suggestions dropdown */}
      {showSuggestions && (mentionables.length > 0 || isLoading) && (
        <div
          ref={suggestionsRef}
          className="absolute bottom-full left-0 right-0 mb-2 bg-popover border rounded-md shadow-lg z-50"
        >
          <ScrollArea className="max-h-60">
            {isLoading ? (
              <div className="p-3 text-sm text-muted-foreground text-center">Recherche...</div>
            ) : (
              <div className="py-1">
                {mentionables.map((item, index) => (
                  <button
                    key={`${item.mentionType}-${item.id}`}
                    data-index={index}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-accent transition-colors',
                      index === selectedIndex && 'bg-accent'
                    )}
                    onClick={() => insertMention(item)}
                    type="button"
                  >
                    <div
                      className={cn(
                        'flex items-center justify-center w-8 h-8 rounded-full',
                        MENTION_TYPE_COLORS[item.mentionType] || 'bg-gray-100'
                      )}
                    >
                      {item.mentionType === 'user' ? (
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {item.displayText
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .toUpperCase()
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        MENTION_TYPE_ICONS[item.mentionType]
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{item.displayText}</div>
                      {item.secondaryText && (
                        <div className="text-xs text-muted-foreground truncate">{item.secondaryText}</div>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">{item.reference}</span>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
          <div className="border-t px-3 py-1.5 text-xs text-muted-foreground">
            Tapez <code className="bg-muted px-1 rounded">@nom</code> pour les utilisateurs,{' '}
            <code className="bg-muted px-1 rounded">@p:titre</code> pour les projets
          </div>
        </div>
      )}

      {/* Input field */}
      <div className="flex items-end gap-2">
        {/* Attachment button */}
        {showAttachments && onFileSelect && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              multiple
              onChange={handleFileChange}
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-10 w-10 shrink-0"
              onClick={handleFileClick}
              disabled={disabled}
              title="Joindre un fichier"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
          </>
        )}

        {/* Message input */}
        <div className="flex-1 relative">
          <Input
            ref={inputRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="pr-10"
          />
          {/* Emoji picker button inside input */}
          <div className="absolute right-1 top-1/2 -translate-y-1/2">
            <EmojiPicker onEmojiSelect={handleEmojiSelect} className="h-7 w-7" />
          </div>
        </div>

        {/* Send button */}
        <Button
          onClick={onSend}
          disabled={((!value.trim() && !hasAttachments) || disabled)}
          size="icon"
          className="h-10 w-10 shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
