import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Theme, Language } from '@/contexts/AppearanceContext';

interface AppearanceSettings {
  theme: Theme;
  language: Language;
  timezone?: string;
  date_format?: string;
  time_format?: '12h' | '24h';
}

interface UpdateAppearanceData {
  theme?: Theme;
  language?: Language;
  timezone?: string;
  date_format?: string;
  time_format?: '12h' | '24h';
}

// Récupérer les préférences d'apparence de l'utilisateur
export function useAppearanceSettings() {
  return useQuery({
    queryKey: ['appearanceSettings'],
    queryFn: async () => {
      try {
        const response = await api.get('/auth/users/appearance-settings/');
        return response.data as AppearanceSettings;
      } catch (error: any) {
        // Si l'endpoint n'existe pas encore, retourner les paramètres par défaut
        if (error.response?.status === 404) {
          return {
            theme: 'system' as Theme,
            language: 'fr' as Language,
            timezone: 'Europe/Paris',
            date_format: 'DD/MM/YYYY',
            time_format: '24h' as const
          };
        }
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Mettre à jour les préférences d'apparence
export function useUpdateAppearanceSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateAppearanceData) => {
      try {
        const response = await api.patch('/auth/users/appearance-settings/', data);
        return response.data as AppearanceSettings;
      } catch (error: any) {
        // Si l'endpoint n'existe pas encore, simuler la réponse
        if (error.response?.status === 404) {
          console.log('API d\'apparence non implémentée, sauvegarde locale uniquement');
          return { ...data } as AppearanceSettings;
        }
        throw error;
      }
    },
    onSuccess: (data) => {
      // Mettre à jour le cache
      queryClient.setQueryData(['appearanceSettings'], data);
      toast.success('Préférences d\'apparence sauvegardées');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Erreur lors de la sauvegarde des préférences';
      toast.error(errorMessage);
    },
  });
}

// Hook combiné pour faciliter l'utilisation
export function useAppearancePreferences() {
  const { data: settings, isLoading, error } = useAppearanceSettings();
  const updateMutation = useUpdateAppearanceSettings();

  const updateTheme = (theme: Theme) => {
    updateMutation.mutate({ theme });
  };

  const updateLanguage = (language: Language) => {
    updateMutation.mutate({ language });
  };

  const updateSettings = (newSettings: UpdateAppearanceData) => {
    updateMutation.mutate(newSettings);
  };

  return {
    settings,
    isLoading,
    error,
    updateTheme,
    updateLanguage,
    updateSettings,
    isUpdating: updateMutation.isPending
  };
}
