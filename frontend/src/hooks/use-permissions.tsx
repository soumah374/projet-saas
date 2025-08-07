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
  const [isLoading, setIsLoading] = useState(false);
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
    } else {
      setUserPermissions(null);
    }
  }, [isAuthenticated, user, fetchUserPermissions]);

  // Vérifier si l'utilisateur a une permission spécifique
  const hasPermission = useCallback((permission: Permission): boolean => {
    if (!userPermissions) return false;
    
    // Les super utilisateurs ont tous les droits
    if (userPermissions.is_superuser) return true;
    
    // Les staff ont accès limité selon leur rôle
    if (userPermissions.is_staff) return true;
    
    // Vérifier si la permission existe dans la liste des permissions de l'utilisateur
    return userPermissions.permissions.includes(permission);
  }, [userPermissions]);

  // Vérifier si l'utilisateur a accès à un module
  const hasModuleAccess = useCallback((module: string): boolean => {
    if (!userPermissions) return false;
    
    // Les super utilisateurs ont accès à tout
    if (userPermissions.is_superuser) return true;
    
    // Les staff ont accès limité selon leur rôle
    if (userPermissions.is_staff) return true;
    
    const modulePerms = userPermissions.module_permissions[module];
    return modulePerms ? (modulePerms.view || modulePerms.add || modulePerms.change || modulePerms.delete) : false;
  }, [userPermissions]);

  // Vérifier si l'utilisateur a un rôle spécifique
  const hasRole = useCallback((role: Role): boolean => {
    if (!userPermissions) return false;
    return userPermissions.user_role === role;
  }, [userPermissions]);

  // Vérifier si l'utilisateur a un des rôles spécifiés
  const hasAnyRole = useCallback((roles: Role[]): boolean => {
    if (!userPermissions) return false;
    return roles.includes(userPermissions.user_role as Role);
  }, [userPermissions]);

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
    return userPermissions.user_role as Role;
  }, [userPermissions]);

  // Obtenir toutes les permissions disponibles depuis la base de données
  const getAvailablePermissions = useCallback(async (): Promise<Permission[]> => {
    try {
      const response = await api.get('/auth/permissions/');
      return response.data.permissions || [];
    } catch (err: any) {
      console.error('Erreur lors de la récupération des permissions disponibles:', err);
      return [];
    }
  }, []);

  // Obtenir tous les rôles disponibles depuis la base de données
  const getAvailableRoles = useCallback(async (): Promise<Role[]> => {
    try {
      const response = await api.get('/auth/roles/');
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
    return hasPermission('reports.view');
  }, [hasPermission]);

  const canManageTeams = useCallback((): boolean => {
    return hasPermission('teams.create') || hasPermission('teams.edit') || hasPermission('teams.delete');
  }, [hasPermission]);

  const canManageClients = useCallback((): boolean => {
    return hasPermission('clients.create') || hasPermission('clients.edit') || hasPermission('clients.delete');
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
    
    // Permissions spécifiques
    canManageUsers,
    canManageProjects,
    canManageBilling,
    canViewReports,
    canManageTeams,
    canManageClients,
    
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