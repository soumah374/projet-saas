import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsAPI, api } from '../lib/api';
import type { AppNotification, PaginatedResponse } from '../lib/types';

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
    data: notificationsResponse,
    isLoading: loading,
    error,
    refetch,
  } = useQuery<PaginatedResponse<AppNotification>>({
    queryKey: notificationKeys.list(params),
    queryFn: async () => {
      const response = await notificationsAPI.getNotifications(params);
      return response.data;
    },
    refetchInterval: 60000, // Rafraîchir toutes les minutes
  });

  // Requête pour obtenir le nombre de notifications non lues
  const { data: unreadCountData } = useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: async () => {
      const response = await notificationsAPI.getUnreadCount();
      return response.data;
    },
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
    notifications: (notificationsResponse?.results || []) as AppNotification[],
    totalCount: notificationsResponse?.count || 0,
    unreadCount: unreadCountData?.unread_count || 0,
    loading,
    error,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    refetch,
  };
};

// Nouveaux hooks simplifiés pour le NotificationCenter
export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: number) => {
      const response = await api.post(`/projects/notifications/${notificationId}/mark_as_read/`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.post('/projects/notifications/mark_all_as_read/');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
} 