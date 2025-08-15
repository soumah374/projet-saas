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

  // Vérifier si l'utilisateur a accès à un module
  const hasModuleAccess = useCallback((module: string): boolean => {
   
    if (!userPermissions) return false;
    
    // Super admin a accès à tout
    if (userPermissions.is_superuser || (userPermissions.groups || []).includes('Super Admin')) return true;
    
    // Les staff ont accès limité selon leur rôle
    if (userPermissions.is_staff) return true;
    if(module === 'projects'){
      console.log("userPermissions",userPermissions.permissions)
      console.log("userPermissions hasModuleAccess =====",userPermissions.permissions.includes('projects.add_project'))
    }
    const modulePerms = userPermissions.module_permissions[module];
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

  const canManageProjects = useCallback((): boolean => {
    return hasPermission('projects.create') || hasPermission('projects.edit') || hasPermission('projects.delete');
  }, [hasPermission]);

  const canManageBilling = useCallback((): boolean => {
    return hasPermission('billings.create') || hasPermission('billings.edit') || hasPermission('billings.delete');
  }, [hasPermission]);

  const canViewReports = useCallback((): boolean => {
    return hasPermission('projects.view');
  }, [hasPermission]);

  const canManageTeams = useCallback((): boolean => {
    return hasPermission('teams.create') || hasPermission('teams.edit') || hasPermission('teams.delete');
  }, [hasPermission]);

  const canManageClients = useCallback((): boolean => {
    return hasPermission('clients.add') || hasPermission('clients.edit') || hasPermission('clients.delete') || hasPermission('clients.can_approve_client') || hasPermission('clients.can_generate_invoice') || hasPermission('clients.can_view_financial_reports');
  }, [hasPermission]);

  const canManageDocuments = useCallback((): boolean => {
    return hasPermission('documents.add') || hasPermission('documents.edit') || hasPermission('documents.delete') || hasPermission('documents.can_approve_document') || hasPermission('documents.can_generate_invoice') || hasPermission('documents.can_view_financial_reports');
  }, [hasPermission]);

  const canManageDevis = useCallback((): boolean => {
    return hasPermission('devis.add') || hasPermission('devis.edit') || hasPermission('devis.delete') || hasPermission('devis.can_approve_devis') || hasPermission('devis.can_generate_invoice') || hasPermission('devis.can_view_financial_reports');
  }, [hasPermission]);

  const canManageContrats = useCallback((): boolean => {
    return hasPermission('contrats.add') || hasPermission('contrats.edit') || hasPermission('contrats.delete');
  }, [hasPermission]);

  const canManageBillings = useCallback((): boolean => {
    return hasPermission('billings.add') || hasPermission('billings.edit') || hasPermission('billings.delete') || hasPermission('billings.can_approve_billing') || hasPermission('billings.can_generate_invoice') || hasPermission('billings.can_view_financial_reports');
  }, [hasPermission]);

  // Permissions personnalisées pour les projets
  const canManageProjectMembers = useCallback((): boolean => {
    return hasPermission('projects.can_manage_project_members') || hasPermission('projects.can_view_project_reports') || hasPermission('projects.can_export_project_data');
  }, [hasPermission]);

  const canViewProjectReports = useCallback((): boolean => {
    return hasPermission('projects.can_view_project_reports') || hasPermission('projects.can_export_project_data');
  }, [hasPermission]);

  const canExportProjectData = useCallback((): boolean => {
    return hasPermission('projects.can_export_project_data') || hasPermission('projects.can_view_project_reports');
  }, [hasPermission]);

  const canManageProjectBudget = useCallback((): boolean => {
    return hasPermission('projects.add_projectbudget') || hasPermission('projects.edit_projectbudget') || hasPermission('projects.delete_projectbudget');
  }, [hasPermission]);

  const canManageProjectTasks = useCallback((): boolean => {
    return hasPermission('projects.add_projecttask') || hasPermission('projects.edit_projecttask') || hasPermission('projects.delete_projecttask');
  }, [hasPermission]);

  const canManageProjectPhases = useCallback((): boolean => {
    return hasPermission('projects.add_projectphase') || hasPermission('projects.edit_projectphase') || hasPermission('projects.delete_projectphase');
  }, [hasPermission]);

  const canManageTimesheets = useCallback((): boolean => {
    return hasPermission('projects.add_timesheet') || hasPermission('projects.edit_timesheet') || hasPermission('projects.delete_timesheet');
  }, [hasPermission]);

  const canManageProjectEvents = useCallback((): boolean => {
    return hasPermission('projects.add_projectevent') || hasPermission('projects.edit_projectevent') || hasPermission('projects.delete_projectevent');
  }, [hasPermission]);

  const canSendProject = useCallback((): boolean => {
    return hasPermission('projects.send_project') || hasPermission('projects.edit_project') || hasPermission('projects.delete_project');
  }, [hasPermission]);

  // Permissions personnalisées pour la facturation
  const canApproveBilling = useCallback((): boolean => {
    return hasPermission('billings.can_approve_billing') || hasPermission('billings.can_generate_invoice') || hasPermission('billings.can_view_financial_reports');
  }, [hasPermission]);

  const canGenerateInvoice = useCallback((): boolean => {
    return hasPermission('billings.can_generate_invoice');
  }, [hasPermission]);

  const canViewFinancialReports = useCallback((): boolean => {
    return hasPermission('billings.can_view_financial_reports');
  }, [hasPermission]);

  const canManageBillingConfiguration = useCallback((): boolean => {
    return hasPermission('billings.add_configurationfacturation') || hasPermission('billings.edit_configurationfacturation') || hasPermission('billings.delete_configurationfacturation');
  }, [hasPermission]);

  // Permissions personnalisées pour les contrats
  const canManageAvenants = useCallback((): boolean => {
    return hasPermission('contrats.add_avenant') || hasPermission('contrats.edit_avenant') || hasPermission('contrats.delete_avenant');
  }, [hasPermission]);

  // Permissions personnalisées pour le catalogue
  const canManageCategories = useCallback((): boolean => {
    return hasPermission('client_categories.add_clientcategory') || hasPermission('client_categories.edit_clientcategory') || hasPermission('client_categories.delete_clientcategory');
  }, [hasPermission]);

  // Permissions personnalisées pour les notifications
  const canViewNotifications = useCallback((): boolean => {
    return hasPermission('notifications.view_notification');
  }, [hasPermission]);

  // Permissions personnalisées pour les départements
  const canViewDepartments = useCallback((): boolean => {
    return hasPermission('departments.view_department');
  }, [hasPermission]);

  // Vérifier les permissions de module spécifiques
  const canViewModule = useCallback((module: string): boolean => {
    if (!userPermissions) return false;
    const modulePerms = userPermissions.module_permissions[module];
    return modulePerms ? modulePerms.view : false;
  }, [userPermissions]);

  const canCreateModule = useCallback((module: string): boolean => {
    if (!userPermissions) return false;
    const modulePerms = userPermissions.module_permissions[module];
    return modulePerms ? modulePerms.add : false;
  }, [userPermissions]);

  const canEditModule = useCallback((module: string): boolean => {
    if (!userPermissions) return false;
    const modulePerms = userPermissions.module_permissions[module];
    return modulePerms ? modulePerms.change : false;
  }, [userPermissions]);

  const canDeleteModule = useCallback((module: string): boolean => {
    if (!userPermissions) return false;
    const modulePerms = userPermissions.module_permissions[module];
    return modulePerms ? modulePerms.delete : false;
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
    
    // État
    user: userPermissions,
    isLoading,
    error,
    
    // Actions
    refreshPermissions: fetchUserPermissions,
  };
}; 