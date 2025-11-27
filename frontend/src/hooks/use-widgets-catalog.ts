import { dashboardAPI } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

// Types pour le catalogue des widgets
export interface WidgetConfig {
  key: string;
  label: string;
  description: string;
  type: 'projects' | 'financial' | 'performance' | 'calendar' | 'analytics' | 'alerts' | 'advanced';
  category: 'basic' | 'advanced' | 'chart' | 'table' | 'kpi' | 'analysis';
  defaultEnabled?: boolean;
  requiredPermissions?: string[];
  dependsOn?: string[];
  availableFor?: ('all' | 'admin' | 'manager' | 'user')[];
}

export interface WidgetGroup {
  label: string;
  icon: string;
  widgets: string[];
}

export interface WidgetsCatalogResponse {
  widgets: Record<string, WidgetConfig>;
  groups: Record<string, WidgetGroup>;
  rolePresets: Record<string, string[]>;
}

/**
 * Hook pour charger le catalogue des widgets depuis le backend
 * Source unique de vérité pour tous les widgets disponibles
 */
export const useWidgetsCatalog = () => {
  return useQuery<WidgetsCatalogResponse>({
    queryKey: ['widgets-catalog'],
    queryFn: async () => {
      const response = await dashboardAPI.getWidgetsCatalog()
      return response.data;
    },
    staleTime: Infinity, // Le catalogue ne change pas pendant la session
    gcTime: Infinity, // Garde en cache indéfiniment
  });
};

/**
 * Fonction helper pour vérifier si un widget est disponible pour un utilisateur
 */
export const isWidgetAvailableForUser = (
  widgetKey: string,
  widgets: Record<string, WidgetConfig>,
  userRole: string,
  isAdmin: boolean
): boolean => {
  const widget = widgets[widgetKey];
  if (!widget) return false;

  // Les admins ont accès à tout
  if (isAdmin) return true;

  // Vérifier les permissions du widget
  const availableFor = widget.availableFor || ['all'];
  if (availableFor.includes('all')) return true;
  if (availableFor.includes('admin') && isAdmin) return true;

  // Vérifier selon le rôle
  const roleMapping: Record<string, string> = {
    'Managing Director': 'admin',
    'Finance/Admin': 'manager',
    'Chef de projet': 'manager',
    'Designer': 'user',
    'Développeur': 'user',
    'Rédacteur': 'user',
    'Consultant': 'user',
  };

  const mappedRole = roleMapping[userRole] || 'user';
  return availableFor.includes(mappedRole as any);
};

/**
 * Fonction pour obtenir les widgets par défaut pour un rôle
 */
export const getDefaultWidgetsForRole = (
  rolePresets: Record<string, string[]>,
  role: string
): string[] => {
  return rolePresets[role] || [];
};

/**
 * Fonction pour valider les dépendances des widgets
 */
export const validateWidgetDependencies = (
  selectedWidgets: string[],
  widgets: Record<string, WidgetConfig>
): { valid: boolean; missing: string[] } => {
  const missing: string[] = [];

  selectedWidgets.forEach((widgetKey) => {
    const widget = widgets[widgetKey];
    if (widget?.dependsOn) {
      widget.dependsOn.forEach((dependency) => {
        if (!selectedWidgets.includes(dependency)) {
          missing.push(dependency);
        }
      });
    }
  });

  return {
    valid: missing.length === 0,
    missing: Array.from(new Set(missing)),
  };
};
