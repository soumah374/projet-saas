import { api } from '@/lib/api';

export interface ApplicationConfig {
  id?: number;
  app_name: string;
  app_description?: string;
  logo?: File | null;
  logo_url?: string | null;
  favicon?: File | null;
  favicon_url?: string | null;
  company_name?: string;
  company_address?: string;
  company_phone?: string;
  company_email?: string;
  company_website?: string;
  primary_color: string;
  secondary_color: string;
  created_at?: string;
  updated_at?: string;
}

export interface ApplicationConfigPublic {
  app_name: string;
  app_description?: string;
  logo_url?: string | null;
  favicon_url?: string | null;
  company_name?: string;
  primary_color: string;
  secondary_color: string;
}

class AppConfigService {
  /**
   * Récupère la configuration publique de l'application (sans authentification)
   * Utilisé pour la page de connexion et l'affichage du nom/logo
   */
  async getPublicConfig(): Promise<ApplicationConfigPublic> {
    const response = await fetch('/api/v1/app-config/public/');
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération de la configuration publique');
    }
    return response.json();
  }

  /**
   * Récupère la configuration complète de l'application (authentification requise)
   */
  async getConfig(): Promise<ApplicationConfig> {
    const response = await api.get('/app-config/');
    return response.data;
  }

  /**
   * Met à jour la configuration de l'application (admin uniquement)
   */
  async updateConfig(config: Partial<ApplicationConfig>): Promise<ApplicationConfig> {
    const formData = new FormData();
    
    // Ajouter les champs texte
    Object.entries(config).forEach(([key, value]) => {
      if (value !== undefined && value !== null && key !== 'logo' && key !== 'favicon') {
        formData.append(key, String(value));
      }
    });

    // Ajouter les fichiers si présents
    if (config.logo instanceof File) {
      formData.append('logo', config.logo);
    }
    if (config.favicon instanceof File) {
      formData.append('favicon', config.favicon);
    }

    const response = await api.patch('/app-config/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  /**
   * Upload uniquement le logo
   */
  async uploadLogo(logoFile: File): Promise<ApplicationConfig> {
    const formData = new FormData();
    formData.append('logo', logoFile);

    const response = await api.post('/app-config/upload-logo/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  /**
   * Upload uniquement le favicon
   */
  async uploadFavicon(faviconFile: File): Promise<ApplicationConfig> {
    const formData = new FormData();
    formData.append('favicon', faviconFile);

    const response = await api.post('/app-config/upload-favicon/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  /**
   * Supprime le logo
   */
  async deleteLogo(): Promise<ApplicationConfig> {
    const response = await api.delete('/app-config/delete-logo/');
    return response.data;
  }

  /**
   * Supprime le favicon
   */
  async deleteFavicon(): Promise<ApplicationConfig> {
    const response = await api.delete('/app-config/delete-favicon/');
    return response.data;
  }
}

export const appConfigService = new AppConfigService();
