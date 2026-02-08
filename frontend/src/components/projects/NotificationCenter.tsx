import { useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useNotifications } from '@/hooks/use-notifications';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNavigate, Link } from 'react-router-dom';
import type { AppNotification } from '@/lib/types';

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const { notifications = [], loading: isLoading, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'project_member':
        return '👥';
      case 'task_assignment':
        return '📋';
      case 'task_update':
        return '✅';
      case 'event_created':
      case 'event_update':
        return '📅';
      case 'document_shared':
        return '📄';
      case 'team_update':
        return '👥';
      case 'message':
        return '💬';
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'project_member':
      case 'team_update':
        return 'text-blue-600';
      case 'task_assignment':
      case 'task_update':
        return 'text-green-600';
      case 'event_created':
      case 'event_update':
        return 'text-purple-600';
      case 'document_shared':
        return 'text-orange-600';
      case 'message':
        return 'text-cyan-600';
      default:
        return 'text-gray-600';
    }
  };

  const getNotificationUrl = (notification: AppNotification): string | null => {
    const projectId = notification.metadata?.project_id || notification.object_id;

    switch (notification.type) {
      case 'project_member':
        return `/projects/${notification.object_id}`;
      case 'task_assignment':
      case 'task_update':
        return `/projects/${projectId}`;
      case 'event_created':
      case 'event_update':
        return '/calendar';
      case 'document_shared':
        return '/documents';
      default:
        return '/notifications';
    }
  };

  const handleNotificationClick = (notification: AppNotification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }

    const url = getNotificationUrl(notification);
    if (url) {
      setTimeout(() => navigate(url), 0);
    }
    setOpen(false);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-[500px] overflow-y-auto">
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="text-xs"
            >
              <CheckCheck className="h-4 w-4 mr-1" />
              Tout marquer comme lu
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="p-4 text-center text-gray-500">Chargement...</div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Aucune notification</p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.slice(0, 5).map((notification: AppNotification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`p-3 cursor-pointer ${
                  !notification.is_read ? 'bg-blue-50 dark:bg-blue-950/20' : ''
                }`}
                onSelect={() => handleNotificationClick(notification)}
              >
                <div className="flex gap-3 w-full">
                  <div className={`text-2xl ${getNotificationColor(notification.type)}`}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-sm line-clamp-2">{notification.message}</p>
                      {!notification.is_read && (
                        <div className="h-2 w-2 rounded-full bg-blue-600 flex-shrink-0 mt-1" />
                      )}
                    </div>
                    {notification.metadata?.project_title && (
                      <Badge variant="secondary" className="text-xs mt-1">
                        {notification.metadata.project_title}
                      </Badge>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDistanceToNow(new Date(notification.created_at), {
                        addSuffix: true,
                        locale: fr
                      })}
                    </p>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="justify-center">
          <Link to="/notifications" className="w-full flex items-center justify-center text-primary text-sm">
            Voir toutes les notifications
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
