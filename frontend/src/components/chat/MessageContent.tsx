import React from 'react';
import { FileText, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { renderMessageWithMentions, parseAndRenderMentions } from './MentionBadge';
import { Mention } from '../../hooks/use-chat';

interface MessageContentProps {
  content: string;
  className?: string;
  isOwnMessage?: boolean;
  mentions?: Mention[];
}

export function MessageContent({ content, className, isOwnMessage, mentions = [] }: MessageContentProps) {
  // Regex for images: ![alt](url)
  const imageRegex = /!\[(.*?)\]\((.*?)\)/g;
  // Regex for files: [name](url)
  const fileRegex = /\[(.*?)\]\((.*?)\)/g;

  // Split content by images and files
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  // Combine regexes for splitting? complex.
  // Instead, let's process line by line or use a tokenizer approach.
  // Simple approach: Match all images and files, sort by position, and render.

  const matches: { start: number; end: number; type: 'image' | 'file'; text: string; url: string; alt: string }[] = [];

  let match;
  // Find images
  while ((match = imageRegex.exec(content)) !== null) {
    matches.push({
      start: match.index,
      end: match.index + match[0].length,
      type: 'image',
      text: match[0],
      alt: match[1],
      url: match[2],
    });
  }

  // Find files (exclude images which also match [...] but start with !)
  while ((match = fileRegex.exec(content)) !== null) {
    // Check if it's an image (starts with !)
    if (match.index > 0 && content[match.index - 1] === '!') {
      continue;
    }
    matches.push({
      start: match.index,
      end: match.index + match[0].length,
      type: 'file',
      text: match[0],
      alt: match[1],
      url: match[2],
    });
  }

  // Sort matches
  matches.sort((a, b) => a.start - b.start);

  // Remove overlaps (shouldn't happen with valid markdown but good safety)
  const filteredMatches = matches.filter((m, i) => {
    if (i === 0) return true;
    return m.start >= matches[i - 1].end;
  });

  filteredMatches.forEach((m, idx) => {
    // Text before match
    if (m.start > lastIndex) {
      const textPart = content.slice(lastIndex, m.start);
      // We use parseAndRenderMentions for text segments mixed with attachments
      // as splitting indices makes using standard mentions array difficult
      parts.push(<span key={`text-${idx}`}>{parseAndRenderMentions(textPart)}</span>);
    }

    if (m.type === 'image') {
      parts.push(
        <div key={`img-${idx}`} className="my-2">
          <a href={m.url} target="_blank" rel="noopener noreferrer" className="block cursor-zoom-in">
            <img
              src={m.url}
              alt={m.alt}
              className="max-w-full rounded-md border border-border/50 max-h-[300px] object-cover"
              loading="lazy"
            />
          </a>
        </div>
      );
    } else {
      parts.push(
        <a
          key={`file-${idx}`}
          href={m.url}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "flex items-center gap-2 p-2 rounded-md my-1 transition-colors group",
            isOwnMessage
              ? "bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground"
              : "bg-muted hover:bg-muted/80 text-foreground"
          )}
        >
          <div className="bg-background/20 p-2 rounded-full">
            <FileText className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate max-w-[200px]">{m.alt}</p>
            <p className="text-xs opacity-70 truncate">Document</p>
          </div>
          <ExternalLink className="h-4 w-4 opacity-50 group-hover:opacity-100" />
        </a>
      );
    }

    lastIndex = m.end;
  });

  // Remaining text
  if (lastIndex < content.length) {
    const textPart = content.slice(lastIndex);
    parts.push(<span key="text-end">{parseAndRenderMentions(textPart)}</span>);
  }

  // If no matches, just render mentions
  if (filteredMatches.length === 0) {
    return <>{mentions && mentions.length > 0 ? renderMessageWithMentions(content, mentions) : parseAndRenderMentions(content)}</>;
  }

  return <>{parts}</>;
}
