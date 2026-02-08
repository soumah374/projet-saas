import { useEffect } from 'react';
import { usePublicAppConfig } from './use-app-config';

/**
 * Hook pour mettre à jour dynamiquement le titre de la page et le favicon
 * en fonction de la configuration de l'application
 */
export function useDynamicTitle(pageTitle?: string) {
  const { data: config } = usePublicAppConfig();

  useEffect(() => {
    if (config) {
      // Mettre à jour le titre de la page
      const appName = config.app_name || 'project_saas';
      const fullTitle = pageTitle ? `${pageTitle} - ${appName}` : appName;
      document.title = fullTitle;

      // Mettre à jour le favicon si disponible
      if (config.favicon_url) {
        updateFavicon(config.favicon_url);
      }

      // Mettre à jour les couleurs CSS personnalisées
      if (config.primary_color) {
        document.documentElement.style.setProperty('--primary-color', config.primary_color);
      }
      if (config.secondary_color) {
        document.documentElement.style.setProperty('--secondary-color', config.secondary_color);
      }
    }
  }, [config, pageTitle]);

  return config;
}

/**
 * Fonction utilitaire pour mettre à jour le favicon
 */
function updateFavicon(faviconUrl: string) {
  // Supprimer les anciens favicons
  const existingFavicons = document.querySelectorAll('link[rel*="icon"]');
  existingFavicons.forEach(favicon => favicon.remove());

  // Ajouter le nouveau favicon
  const link = document.createElement('link');
  link.rel = 'icon';
  link.type = 'image/x-icon';
  link.href = faviconUrl;
  document.head.appendChild(link);

  // Ajouter aussi comme apple-touch-icon pour les appareils mobiles
  const appleLink = document.createElement('link');
  appleLink.rel = 'apple-touch-icon';
  appleLink.href = faviconUrl;
  document.head.appendChild(appleLink);
}
