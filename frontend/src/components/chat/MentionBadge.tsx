import { Link } from 'react-router-dom';
import { Badge } from '../ui/badge';
import { User, Folder, FileText, Receipt } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Mention } from '../../hooks/use-chat';

interface MentionBadgeProps {
  mention: Mention;
  className?: string;
}

const MENTION_ROUTES: Record<string, (id: string) => string> = {
  user: (id) => `/users/${id}`,
  project: (id) => `/projects/${id}`,
  contrat: (id) => `/contrats/${id}`,
  devis: (id) => `/devis/${id}`,
  facture: (id) => `/factures/${id}`,
};

const MENTION_ICONS: Record<string, React.ReactNode> = {
  user: <User className="h-3 w-3" />,
  project: <Folder className="h-3 w-3" />,
  contrat: <FileText className="h-3 w-3" />,
  devis: <FileText className="h-3 w-3" />,
  facture: <Receipt className="h-3 w-3" />,
};

const MENTION_COLORS: Record<string, string> = {
  user: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
  project: 'bg-green-100 text-green-800 hover:bg-green-200',
  contrat: 'bg-purple-100 text-purple-800 hover:bg-purple-200',
  devis: 'bg-orange-100 text-orange-800 hover:bg-orange-200',
  facture: 'bg-red-100 text-red-800 hover:bg-red-200',
};

export function MentionBadge({ mention, className }: MentionBadgeProps) {
  const route = MENTION_ROUTES[mention.mentionType]?.(mention.entityId);
  const icon = MENTION_ICONS[mention.mentionType];
  const color = MENTION_COLORS[mention.mentionType] || 'bg-gray-100 text-gray-800';

  const content = (
    <Badge
      variant="secondary"
      className={cn(
        'inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium cursor-pointer transition-colors',
        color,
        className
      )}
    >
      {icon}
      <span>{mention.displayText}</span>
    </Badge>
  );

  if (route) {
    return (
      <Link to={route} className="no-underline" onClick={(e) => e.stopPropagation()}>
        {content}
      </Link>
    );
  }

  return content;
}

// Helper function to render message content with mentions
export function renderMessageWithMentions(content: string, mentions: Mention[]) {
  if (!mentions || mentions.length === 0) {
    return <span>{content}</span>;
  }

  // Sort mentions by start position
  const sortedMentions = [...mentions].sort((a, b) => a.startPosition - b.startPosition);

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  sortedMentions.forEach((mention, idx) => {
    // Add text before this mention
    if (mention.startPosition > lastIndex) {
      parts.push(
        <span key={`text-${idx}`}>{content.slice(lastIndex, mention.startPosition)}</span>
      );
    }

    // Add the mention badge
    parts.push(<MentionBadge key={`mention-${idx}`} mention={mention} />);

    lastIndex = mention.endPosition;
  });

  // Add remaining text after last mention
  if (lastIndex < content.length) {
    parts.push(<span key="text-end">{content.slice(lastIndex)}</span>);
  }

  return <>{parts}</>;
}

// Alternative: Parse mentions from text using regex patterns
export function parseAndRenderMentions(content: string) {
  // Regex patterns for different mention types
  const patterns = [
    { regex: /@(\w+)/g, type: 'user' as const },
    { regex: /@p:(\S+)/g, type: 'project' as const },
    { regex: /@projet:(\S+)/g, type: 'project' as const },
    { regex: /@c:(\S+)/g, type: 'contrat' as const },
    { regex: /@contrat:(\S+)/g, type: 'contrat' as const },
    { regex: /@d:(\S+)/g, type: 'devis' as const },
    { regex: /@devis:(\S+)/g, type: 'devis' as const },
    { regex: /@f:(\S+)/g, type: 'facture' as const },
    { regex: /@facture:(\S+)/g, type: 'facture' as const },
  ];

  // Collect all mentions with their positions
  const mentions: Array<{
    start: number;
    end: number;
    text: string;
    type: 'user' | 'project' | 'contrat' | 'devis' | 'facture';
    id: string;
  }> = [];

  patterns.forEach(({ regex, type }) => {
    let match;
    const re = new RegExp(regex);
    while ((match = re.exec(content)) !== null) {
      mentions.push({
        start: match.index,
        end: match.index + match[0].length,
        text: match[0],
        type,
        id: match[1],
      });
    }
  });

  // Sort by position and remove overlaps
  mentions.sort((a, b) => a.start - b.start);
  const filteredMentions = mentions.filter((m, i) => {
    if (i === 0) return true;
    return m.start >= mentions[i - 1].end;
  });

  if (filteredMentions.length === 0) {
    return <span>{content}</span>;
  }

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  filteredMentions.forEach((m, idx) => {
    if (m.start > lastIndex) {
      parts.push(<span key={`t-${idx}`}>{content.slice(lastIndex, m.start)}</span>);
    }

    parts.push(
      <MentionBadge
        key={`m-${idx}`}
        mention={{
          id: '',
          mentionType: m.type,
          entityId: m.id,
          displayText: m.text,
          startPosition: m.start,
          endPosition: m.end,
        }}
      />
    );

    lastIndex = m.end;
  });

  if (lastIndex < content.length) {
    parts.push(<span key="t-end">{content.slice(lastIndex)}</span>);
  }

  return <>{parts}</>;
}
