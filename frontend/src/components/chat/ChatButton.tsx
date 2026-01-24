import { useState } from 'react';
import { Button } from '../ui/button';
import { MessageSquare } from 'lucide-react';
import { ChatBox } from './ChatBox';
import { useUnreadCount } from '../../hooks/use-chat';
import { Badge } from '../ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';

export function ChatButton() {
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = useUnreadCount();

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsOpen(true)}
        className="relative"
      >
        <MessageSquare className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Messages</DialogTitle>
          </DialogHeader>
          <ChatBox onClose={() => setIsOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}

