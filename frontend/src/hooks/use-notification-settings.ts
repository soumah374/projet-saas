import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export interface NotificationSettings {
  email_notifications: boolean;
  push_notifications: boolean;
  project_updates: boolean;
  team_messages: boolean;
  deadline_reminders: boolean;
  weekly_reports: boolean;
  task_assignments: boolean;
  comment_mentions: boolean;
  document_sharing: boolean;
  invoice_reminders: boolean;
}

interface UpdateNotificationData extends Partial<NotificationSettings> {}

// Récupérer les préférences de notifications de l'utilisateur
export function useNotificationSettings() {
  return useQuery({
    queryKey: ['notificationSettings'],
    queryFn: async () => {
      const response = await api.get('/auth/users/notification-settings/');
      return response.data as NotificationSettings;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Mettre à jour les préférences de notifications
export function useUpdateNotificationSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateNotificationData) => {
      const response = await api.patch('/auth/users/notification-settings/', data);
      return response.data as NotificationSettings;
    },
    onSuccess: (data) => {
      // Mettre à jour le cache
      queryClient.setQueryData(['notificationSettings'], data);
      toast.success('Préférences de notifications sauvegardées');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Erreur lors de la sauvegarde des préférences';
      toast.error(errorMessage);
    },
  });
}

// Hook combiné pour faciliter l'utilisation
export function useNotificationPreferences() {
  const { data: settings, isLoading, error } = useNotificationSettings();
  const updateMutation = useUpdateNotificationSettings();

  const updateSetting = (key: keyof NotificationSettings, value: boolean) => {
    updateMutation.mutate({ [key]: value });
  };

  const updateMultipleSettings = (newSettings: UpdateNotificationData) => {
    updateMutation.mutate(newSettings);
  };

  // Fonctions utilitaires pour des actions courantes
  const enableAll = () => {
    const allEnabled: NotificationSettings = {
      email_notifications: true,
      push_notifications: true,
      project_updates: true,
      team_messages: true,
      deadline_reminders: true,
      weekly_reports: true,
      task_assignments: true,
      comment_mentions: true,
      document_sharing: true,
      invoice_reminders: true,
    };
    updateMutation.mutate(allEnabled);
  };

  const disableAll = () => {
    const allDisabled: NotificationSettings = {
      email_notifications: false,
      push_notifications: false,
      project_updates: false,
      team_messages: false,
      deadline_reminders: false,
      weekly_reports: false,
      task_assignments: false,
      comment_mentions: false,
      document_sharing: false,
      invoice_reminders: false,
    };
    updateMutation.mutate(allDisabled);
  };

  const enableEssentialOnly = () => {
    const essentialOnly: NotificationSettings = {
      email_notifications: true,
      push_notifications: false,
      project_updates: true,
      team_messages: false,
      deadline_reminders: true,
      weekly_reports: false,
      task_assignments: true,
      comment_mentions: true,
      document_sharing: false,
      invoice_reminders: true,
    };
    updateMutation.mutate(essentialOnly);
  };

  return {
    settings,
    isLoading,
    error,
    updateSetting,
    updateMultipleSettings,
    enableAll,
    disableAll,
    enableEssentialOnly,
    isUpdating: updateMutation.isPending
  };
}
