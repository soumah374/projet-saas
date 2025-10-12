import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appConfigService, ApplicationConfig, ApplicationConfigPublic } from '@/services/appConfigService';
import { toast } from '@/hooks/use-toast';

/**
 * Hook pour récupérer la configuration publique de l'application
 * Utilisé pour la page de connexion et l'affichage du nom/logo
 */
export function usePublicAppConfig() {
  return useQuery<ApplicationConfigPublic>({
    queryKey: ['app-config', 'public'],
    queryFn: () => appConfigService.getPublicConfig(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
  });
}

/**
 * Hook pour récupérer la configuration complète de l'application
 */
export function useAppConfig() {
  return useQuery<ApplicationConfig>({
    queryKey: ['app-config'],
    queryFn: () => appConfigService.getConfig(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook pour mettre à jour la configuration de l'application
 */
export function useUpdateAppConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (config: Partial<ApplicationConfig>) => 
      appConfigService.updateConfig(config),
    onSuccess: (data) => {
      // Invalider et mettre à jour le cache
      queryClient.setQueryData(['app-config'], data);
      queryClient.setQueryData(['app-config', 'public'], {
        app_name: data.app_name,
        app_description: data.app_description,
        logo_url: data.logo_url,
        favicon_url: data.favicon_url,
        company_name: data.company_name,
        primary_color: data.primary_color,
        secondary_color: data.secondary_color,
      });
      
      toast({
        title: "Configuration mise à jour",
        description: "La configuration de l'application a été mise à jour avec succès.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Erreur lors de la mise à jour de la configuration.",
        variant: "destructive",
      });
    },
  });
}

/**
 * Hook pour uploader le logo
 */
export function useUploadLogo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (logoFile: File) => appConfigService.uploadLogo(logoFile),
    onSuccess: (data) => {
      queryClient.setQueryData(['app-config'], data);
      queryClient.invalidateQueries({ queryKey: ['app-config', 'public'] });
      
      toast({
        title: "Logo mis à jour",
        description: "Le logo a été téléchargé avec succès.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.response?.data?.error || "Erreur lors du téléchargement du logo.",
        variant: "destructive",
      });
    },
  });
}

/**
 * Hook pour uploader le favicon
 */
export function useUploadFavicon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (faviconFile: File) => appConfigService.uploadFavicon(faviconFile),
    onSuccess: (data) => {
      queryClient.setQueryData(['app-config'], data);
      queryClient.invalidateQueries({ queryKey: ['app-config', 'public'] });
      
      toast({
        title: "Favicon mis à jour",
        description: "Le favicon a été téléchargé avec succès.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.response?.data?.error || "Erreur lors du téléchargement du favicon.",
        variant: "destructive",
      });
    },
  });
}

/**
 * Hook pour supprimer le logo
 */
export function useDeleteLogo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => appConfigService.deleteLogo(),
    onSuccess: (data) => {
      queryClient.setQueryData(['app-config'], data);
      queryClient.invalidateQueries({ queryKey: ['app-config', 'public'] });
      
      toast({
        title: "Logo supprimé",
        description: "Le logo a été supprimé avec succès.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.response?.data?.error || "Erreur lors de la suppression du logo.",
        variant: "destructive",
      });
    },
  });
}

/**
 * Hook pour supprimer le favicon
 */
export function useDeleteFavicon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => appConfigService.deleteFavicon(),
    onSuccess: (data) => {
      queryClient.setQueryData(['app-config'], data);
      queryClient.invalidateQueries({ queryKey: ['app-config', 'public'] });
      
      toast({
        title: "Favicon supprimé",
        description: "Le favicon a été supprimé avec succès.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.response?.data?.error || "Erreur lors de la suppression du favicon.",
        variant: "destructive",
      });
    },
  });
}
