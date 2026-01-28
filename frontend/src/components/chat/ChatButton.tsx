import { useState } from 'react';
import { Button } from '../ui/button';
import { MessageSquare, X, Minimize2, Maximize2 } from 'lucide-react';
import { ChatBox } from './ChatBox';
import { useUnreadCount } from '../../hooks/use-chat';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';

export function ChatButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const unreadCount = useUnreadCount();

  return (
    <>
      {/* Bouton flottant */}
      <div className="fixed bottom-6 right-6 z-50">
        {!isOpen && (
          <Button
            onClick={() => setIsOpen(true)}
            className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 bg-primary hover:bg-primary/90"
            size="icon"
          >
            <MessageSquare className="h-6 w-6" />
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-6 w-6 flex items-center justify-center p-0 text-xs animate-pulse"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Button>
        )}
      </div>

      {/* Chat flottant */}
      {isOpen && (
        <div
          className={cn(
            "fixed z-50 bg-background border rounded-lg shadow-2xl transition-all duration-200",
            isMinimized
              ? "bottom-6 right-6 w-72 h-14"
              : "bottom-6 right-6 w-[90vw] md:w-[800px] h-[600px] max-h-[80vh]"
          )}
        >
          {/* Header du chat flottant */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-primary text-primary-foreground rounded-t-lg">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              <span className="font-semibold">Messages</span>
              {unreadCount > 0 && (
                <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                  {unreadCount}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                onClick={() => setIsMinimized(!isMinimized)}
              >
                {isMinimized ? (
                  <Maximize2 className="h-4 w-4" />
                ) : (
                  <Minimize2 className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Contenu du chat */}
          {!isMinimized && (
            <div className="h-[calc(100%-56px)] overflow-hidden">
              <ChatBox onClose={() => setIsOpen(false)} />
            </div>
          )}
        </div>
      )}
    </>
  );
}

