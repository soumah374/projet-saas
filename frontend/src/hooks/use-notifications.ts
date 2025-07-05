import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsAPI } from '../lib/api';
import type { Notification, PaginatedResponse } from '../lib/types';

// Query keys
const notificationKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationKeys.all, 'list'] as const,
  list: (filters: any) => [...notificationKeys.lists(), filters] as const,
  unreadCount: () => [...notificationKeys.all, 'unread-count'] as const,
};

export const useNotifications = (params?: {
  type?: string;
  is_read?: boolean;
  page?: number;
  page_size?: number;
}) => {
  const queryClient = useQueryClient();

  // Requête pour obtenir les notifications
  const {
    data,
    isLoading: loading,
    error,
    refetch,
  } = useQuery<PaginatedResponse<Notification>>({
    queryKey: notificationKeys.list(params),
    queryFn: () => notificationsAPI.getNotifications(params),
    refetchInterval: 60000, // Rafraîchir toutes les minutes
  });

  // Requête pour obtenir le nombre de notifications non lues
  const { data: unreadCountData } = useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: () => notificationsAPI.getUnreadCount(),
    refetchInterval: 60000,
  });

  // Mutation pour marquer une notification comme lue
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: number) => notificationsAPI.markRead(notificationId),
    onSuccess: () => {
      // Invalider les requêtes pour forcer un rafraîchissement
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });

  // Mutation pour marquer toutes les notifications comme lues
  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationsAPI.markAllRead(),
    onSuccess: () => {
      // Invalider les requêtes pour forcer un rafraîchissement
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });

  return {
    notifications: data?.results || [],
    totalCount: data?.count || 0,
    unreadCount: unreadCountData?.unread_count || 0,
    loading,
    error,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    refetch,
  };
}; 