import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './use-auth';
import { api } from '../lib/api';

// Types pour les permissions - maintenant dynamiques depuis la base de données
export type Permission = string; // Les permissions viennent de la base de données

export type Role = string; // Les rôles viennent de la base de données

// Interface pour les permissions utilisateur depuis le backend
interface UserPermissions {
  user_id: number;
  user_name: string;
  user_role: string;
  groups: string[];
  permissions: string[];
  is_staff: boolean;
  is_superuser: boolean;
  module_permissions: {
    [key: string]: {
      view: boolean;
      add: boolean;
      change: boolean;
      delete: boolean;
      group_permissions: string[];
    };
  };
}

export const usePermissions = () => {
  const { user, isAuthenticated } = useAuth();
  const [userPermissions, setUserPermissions] = useState<UserPermissions | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Commencer avec true pour éviter les vérifications prématurées
  const [error, setError] = useState<string | null>(null);

  // Récupérer les permissions de l'utilisateur depuis le backend
  const fetchUserPermissions = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get('/auth/users/permissions_summary/');
      setUserPermissions(response.data);
    } catch (err: any) {
      console.error('Erreur lors de la récupération des permissions:', err);
      setError(err.response?.data?.message || 'Erreur lors de la récupération des permissions');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Charger les permissions au montage et quand l'utilisateur change
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchUserPermissions();
    } else if (!isAuthenticated) {
      // Si l'utilisateur n'est pas authentifié, arrêter le chargement
      setUserPermissions(null);
      setIsLoading(false);
    }
  }, [isAuthenticated, user, fetchUserPermissions]);

  // Helpers
  const isSuperAdmin = useCallback((): boolean => {
    if (!userPermissions) return false;
    return Boolean(userPermissions.is_superuser) || (userPermissions.groups || []).includes('Super Admin');
  }, [userPermissions]);

  // Vérifier si l'utilisateur a une permission spécifique
  const hasPermission = useCallback((permission: Permission): boolean => {
    if (!userPermissions) return false;
    
    // Super admin a tous les droits
    if (userPermissions.is_superuser || (userPermissions.groups || []).includes('Super Admin')) return true;
    
    // Les staff ont accès limité selon leur rôle (comportement conservé)
    if (userPermissions.is_staff) return true;
    
    // Support des permissions abstraites: module.action
    // action: view | create | edit | delete
    const parts = String(permission).split('.');
    if (parts.length === 2) {
      const [module, action] = parts as [string, string];
      const actionMap: Record<string, keyof UserPermissions['module_permissions'][string]> = {
        view: 'view',
        create: 'add',
        edit: 'change',
        delete: 'delete',
      };
      const mapped = actionMap[action];
      if (mapped) {
        const modulePerms = userPermissions.module_permissions[module];
        return modulePerms ? Boolean(modulePerms[mapped]) : false;
      }
    }

    // Fallback: vérifier la présence exacte de la permission complète (ex: app_label.codename)
    return userPermissions.permissions.includes(permission);
  }, [userPermissions]);

  // Vérifier si l'utilisateur a accès à un module (général)
  const hasModuleAccess = useCallback((module: string): boolean => {
   
    if (!userPermissions) return false;
    
    // Super admin a accès à tout
    if (userPermissions.is_superuser || (userPermissions.groups || []).includes('Super Admin')) return true;
    
    // Les staff ont accès limité selon leur rôle
    if (userPermissions.is_staff) return true;
  
    const modulePerms = userPermissions.module_permissions[module];
    if (module === 'catalog'){
      console.log(module, modulePerms);
    }
    
    return modulePerms ? (modulePerms.view || modulePerms.add || modulePerms.change || modulePerms.delete) : false;
  }, [userPermissions]);

  // Vérifier si l'utilisateur a un rôle spécifique
  const hasRole = useCallback((role: Role): boolean => {
    if (!userPermissions) return false;
    if (role === 'Super Admin') {
      return isSuperAdmin();
    }
    return (userPermissions.user_role === role) || (userPermissions.groups || []).includes(role);
  }, [userPermissions, isSuperAdmin]);

  // Vérifier si l'utilisateur a un des rôles spécifiés
  const hasAnyRole = useCallback((roles: Role[]): boolean => {
    if (!userPermissions) return false;
    if (roles.includes('Super Admin') && isSuperAdmin()) return true;
    return roles.some((r) => (userPermissions.user_role === r) || (userPermissions.groups || []).includes(r));
  }, [userPermissions, isSuperAdmin]);

  // Obtenir toutes les permissions de l'utilisateur
  const getUserPermissions = useCallback((): Permission[] => {
    if (!userPermissions) return [];
    return userPermissions.permissions as Permission[];
  }, [userPermissions]);

  // Obtenir les modules accessibles à l'utilisateur
  const getUserModules = useCallback((): string[] => {
    if (!userPermissions) return [];
    
    return Object.entries(userPermissions.module_permissions)
      .filter(([_, perms]) => perms.view || perms.add || perms.change || perms.delete)
      .map(([module, _]) => module);
  }, [userPermissions]);

  // Obtenir le rôle de l'utilisateur
  const getUserRole = useCallback((): Role | null => {
    if (!userPermissions) return null;
    if ((userPermissions.groups || []).includes('Super Admin') || userPermissions.is_superuser) return 'Super Admin';
    return (userPermissions.user_role as Role) || null;
  }, [userPermissions]);

  // Obtenir toutes les permissions disponibles depuis la base de données
  const getAvailablePermissions = useCallback(async (): Promise<Permission[]> => {
    try {
      const response = await api.get('/auth/permissions/permissions/');
      return response.data.permissions || [];
    } catch (err: any) {
      console.error('Erreur lors de la récupération des permissions disponibles:', err);
      return [];
    }
  }, []);

  // Obtenir tous les rôles disponibles depuis la base de données
  const getAvailableRoles = useCallback(async (): Promise<Role[]> => {
    try {
      const response = await api.get('/auth/permissions/roles/');
      return response.data.roles || [];
    } catch (err: any) {
      console.error('Erreur lors de la récupération des rôles disponibles:', err);
      return [];
    }
  }, []);

  // Vérifier les permissions spécifiques - maintenant dynamiques
  const canManageUsers = useCallback((): boolean => {
    return hasPermission('users.create') || hasPermission('users.edit') || hasPermission('users.delete');
  }, [hasPermission]);

  const canManageProjects = useCallback((action: string): boolean => {
    return hasPermission(`projects.${action}`);
  }, [hasPermission]);

  const canManageBilling = useCallback((action: string): boolean => {
    return hasPermission(`billings.${action}_billings`);
  }, [hasPermission]);

  const canViewReports = useCallback((): boolean => {
    return hasPermission('projects.can_view_project_reports');
  }, [hasPermission]);

  const canManageTeams = useCallback((action: string): boolean => {
    return hasPermission(`teams.${action}_teams`);
  }, [hasPermission]);

  const canManageClients = useCallback((action: string): boolean => {
    return hasPermission(`clients.${action}_clients`);
  }, [hasPermission]);

  const canManageDocuments = useCallback((action: string): boolean => {
    return hasPermission(`documents.${action}_documents`);
  }, [hasPermission]);

  const canManageDevis = useCallback((action: string): boolean => {
    return hasPermission(`devis.${action}_devis`);
  }, [hasPermission]);

  const canManageContrats = useCallback((action: string): boolean => {
    return hasPermission(`contrats.${action}`);
  }, [hasPermission]);

  const canManageBillings = useCallback((action: string): boolean => {
    return hasPermission(`billings.${action}`);
  }, [hasPermission]);

  // Permissions personnalisées pour les projets
  const canManageProjectMembers = useCallback((): boolean => {
    return hasPermission(`projects.can_manage_project_members`);
  }, [hasPermission]);

  const canViewProjectReports = useCallback((): boolean => {
    return hasPermission(`projects.can_view_project_reports`);
  }, [hasPermission]);

  const canExportProjectData = useCallback((action: string): boolean => {
    return hasPermission(`projects.${action}_projects`);
  }, [hasPermission]);

  const canManageProjectBudget = useCallback((action: string): boolean => {
    return hasPermission(`projects.${action}_projects`);
  }, [hasPermission]);

  const canManageProjectTasks = useCallback((action: string): boolean => {
    return hasPermission(`projects.${action}_projects`);
  }, [hasPermission]);

  const canManageProjectPhases = useCallback((action: string): boolean => {
    return hasPermission(`projects.${action}_projects`);
  }, [hasPermission]);

  const canManageTimesheets = useCallback((action: string): boolean => {
    return hasPermission(`projects.${action}_projects`);
  }, [hasPermission]);

  const canManageProjectEvents = useCallback((action: string): boolean => {
    return hasPermission(`projects.${action}_projects`);
  }, [hasPermission]);

  const canSendProject = useCallback((action: string): boolean => {
    return hasPermission(`projects.${action}_projects`);
  }, [hasPermission]);

  // Permissions personnalisées pour la facturation
  const canApproveBilling = useCallback((action: string): boolean => {
    return hasPermission(`billings.${action}_billings`);
  }, [hasPermission]);


  const canGenerateInvoice = useCallback((action: string): boolean => {
    return hasPermission(`billings.${action}_billings`);
  }, [hasPermission]);

  const canViewFinancialReports = useCallback((action: string): boolean => {
    return hasPermission(`billings.${action}_billings`);
  }, [hasPermission]);

  const canManageBillingConfiguration = useCallback((action: string): boolean => {
    return hasPermission(`billings.${action}_billings`);
  }, [hasPermission]);

  // Permissions personnalisées pour les contrats
  const canManageAvenants = useCallback((action: string): boolean => {
    return hasPermission(`contrats.${action}_contrats`);
  }, [hasPermission]);

  // Permissions personnalisées pour le catalogue
  const canManageCategories = useCallback((action: string): boolean => {
    return hasPermission(`client_categories.${action}_client_categories`);
  }, [hasPermission]);

  // Permissions personnalisées pour les notifications
  const canViewNotifications = useCallback((action: string): boolean => {
    return hasPermission(`notifications.${action}_notifications`);
  }, [hasPermission]);

  // Permissions personnalisées pour les départements
  const canViewDepartments = useCallback((action: string): boolean => {
    return hasPermission(`departments.${action}_departments`);
  }, [hasPermission]);

  // Permissions personnalisées pour le calendrier
  const canManageCalendar = useCallback((action: string): boolean => {
    return hasPermission(`calendar.${action}_calendar`);
  }, [hasPermission]);


  // Vérifier les permissions de module spécifiques
  const canViewModule = useCallback((module: string): boolean => {
    if (!userPermissions) return false;
    const modulePerms = userPermissions.module_permissions[module].group_permissions.filter(res => res === `view_${module}`).length > 0;
    return modulePerms ? true : false;
  }, [userPermissions]);

  const canCreateModule = useCallback((module: string): boolean => {
    if (!userPermissions) return false;
    const modulePerms = userPermissions.module_permissions[module].group_permissions.filter(res => res === `add_${module}`).length > 0;
    return modulePerms ? true : false;
  }, [userPermissions]);

  const canEditModule = useCallback((module: string): boolean => {
    if (!userPermissions) return false;
    const modulePerms = userPermissions.module_permissions[module].group_permissions.filter(res => res === `edit_${module}`).length > 0;
    return modulePerms ? true : false;
  }, [userPermissions]);

  const canDeleteModule = useCallback((module: string): boolean => {
    if (!userPermissions) return false;
    const modulePerms = userPermissions.module_permissions[module].group_permissions.filter(res => res === `delete_${module}`).length > 0;
    return modulePerms ? true : false;
  }, [userPermissions]);

  return {
    // Permissions de base
    hasPermission,
    hasModuleAccess,
    hasRole,
    hasAnyRole,
    isSuperAdmin,
    
    // Permissions spécifiques
    canManageUsers,
    canManageProjects,
    canManageBilling,
    canViewReports,
    canManageTeams,
    canManageClients,
    canManageDocuments,
    canManageDevis,
    canManageContrats,
    canManageBillings,
    
    // Permissions personnalisées pour les projets
    canManageProjectMembers,
    canViewProjectReports,
    canExportProjectData,
    canManageProjectBudget,
    canManageProjectTasks,
    canManageProjectPhases,
    canManageTimesheets,
    canManageProjectEvents,
    canSendProject,
    
    // Permissions personnalisées pour la facturation
    canApproveBilling,
    canGenerateInvoice,
    canViewFinancialReports,
    canManageBillingConfiguration,
    
    // Permissions personnalisées pour les contrats
    canManageAvenants,
    
    // Permissions personnalisées pour le catalogue
    canManageCategories,
    
    // Permissions personnalisées pour les notifications
    canViewNotifications,
    
    // Permissions personnalisées pour les départements
    canViewDepartments,
    
    // Permissions de module
    canViewModule,
    canCreateModule,
    canEditModule,
    canDeleteModule,
    
    // Informations utilisateur
    getUserRole,
    getUserPermissions,
    getUserModules,
    
    // Permissions et rôles disponibles depuis la base de données
    getAvailablePermissions,
    getAvailableRoles,
    
    // Permissions personnalisées pour le calendrier
    canManageCalendar,
    
    // État
    user: userPermissions,
    isLoading,
    error,
    
    // Actions
    refreshPermissions: fetchUserPermissions,
  };
}; 