import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useProjectMembers } from '@/hooks/use-projects';

interface MentionTextareaProps {
  value: string;
  onChange: (value: string) => void;
  projectId: string;
  placeholder?: string;
  className?: string;
  onKeyDown?: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
}

interface Member {
  id: number;
  user: number;
  user_details: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  role: string;
}

export const MentionTextarea = ({
  value,
  onChange,
  projectId,
  placeholder,
  className,
  onKeyDown
}: MentionTextareaProps) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const { data: membersData } = useProjectMembers(projectId);
  const members = (membersData?.results || []) as Member[];

  // Filtrer les membres selon la recherche
  const filteredMembers = members.filter(member =>
    member.user_details?.username?.toLowerCase().includes(mentionSearch.toLowerCase()) ||
    member.user_details?.first_name?.toLowerCase().includes(mentionSearch.toLowerCase()) ||
    member.user_details?.last_name?.toLowerCase().includes(mentionSearch.toLowerCase())
  );

  useEffect(() => {
    if (filteredMembers.length > 0 && selectedIndex >= filteredMembers.length) {
      setSelectedIndex(0);
    }
  }, [filteredMembers.length, selectedIndex]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart;

    onChange(newValue);
    setCursorPosition(cursorPos);

    // Détecter si on tape @ pour les mentions
    const textBeforeCursor = newValue.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      // Vérifier qu'il n'y a pas d'espace après @
      if (!textAfterAt.includes(' ') && !textAfterAt.includes('\n')) {
        setMentionSearch(textAfterAt);
        setShowSuggestions(true);
        setSelectedIndex(0);
        return;
      }
    }

    setShowSuggestions(false);
  };

  const insertMention = (member: Member) => {
    const textBeforeCursor = value.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    const textAfterCursor = value.substring(cursorPosition);

    const newValue =
      value.substring(0, lastAtIndex) +
      `@${member.user_details.username} ` +
      textAfterCursor;

    onChange(newValue);
    setShowSuggestions(false);

    // Replacer le curseur après la mention
    setTimeout(() => {
      if (textareaRef.current) {
        const newPos = lastAtIndex + member.user_details.username.length + 2;
        textareaRef.current.setSelectionRange(newPos, newPos);
        textareaRef.current.focus();
      }
    }, 0);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSuggestions && filteredMembers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredMembers.length);
        return;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredMembers.length) % filteredMembers.length);
        return;
      } else if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
        e.preventDefault();
        insertMention(filteredMembers[selectedIndex]);
        return;
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowSuggestions(false);
        return;
      }
    }

    // Passer l'événement au parent
    if (onKeyDown) {
      onKeyDown(e);
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || "Tapez @ pour mentionner quelqu'un..."}
        className={className}
      />

      {showSuggestions && filteredMembers.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 mt-1 w-80 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto"
          style={{
            bottom: '100%',
            marginBottom: '8px'
          }}
        >
          <div className="p-2 text-xs text-gray-500 border-b">
            Utilisez ↑↓ pour naviguer, Entrée pour sélectionner
          </div>
          {filteredMembers.map((member, index) => (
            <button
              key={member.user_details.id}
              onClick={() => insertMention(member)}
              className={`w-full px-4 py-2 text-left hover:bg-blue-50 flex items-center gap-3 ${
                index === selectedIndex ? 'bg-blue-50' : ''
              }`}
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                  {getInitials(member.user_details.first_name, member.user_details.last_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">
                  {member.user_details.first_name} {member.user_details.last_name}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  @{member.user_details.username} • {member.role}
                </div>
              </div>
              {index === selectedIndex && (
                <div className="text-xs text-blue-600">↵</div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
