import { useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Permission, Role } from '@/hooks/use-permissions';

interface RolePermissions {
  role: string;
  permissions: string[];
  module_permissions: {
    [key: string]: {
      view: boolean;
      add: boolean;
      change: boolean;
      delete: boolean;
    };
  };
}

export const usePermissionManager = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Charger toutes les données de permissions
  const loadPermissionData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [rolesRes, permissionsRes, rolePermissionsRes] = await Promise.all([
        api.get('/auth/permissions/roles/'),
        api.get('/auth/permissions/permissions/'),
        api.get('/auth/permissions/role_permissions/')
      ]);

      return {
        roles: rolesRes.data.roles || [],
        permissions: permissionsRes.data.permissions || [],
        rolePermissions: rolePermissionsRes.data.role_permissions || []
      };
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les données de permissions",
        variant: "destructive"
      });
      return { roles: [], permissions: [], rolePermissions: [] };
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Créer un nouveau rôle
  const createRole = useCallback(async (roleName: string): Promise<boolean> => {
    if (!roleName.trim()) return false;

    try {
      await api.post('/auth/permissions/create_role/', { name: roleName });
      toast({
        title: "Succès",
        description: "Rôle créé avec succès"
      });
      return true;
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer le rôle",
        variant: "destructive"
      });
      return false;
    }
  }, [toast]);

  // Créer une nouvelle permission
  const createPermission = useCallback(async (permissionName: string): Promise<boolean> => {
    if (!permissionName.trim()) return false;

    try {
      await api.post('/auth/permissions/create_permission/', { name: permissionName });
      toast({
        title: "Succès",
        description: "Permission créée avec succès"
      });
      return true;
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer la permission",
        variant: "destructive"
      });
      return false;
    }
  }, [toast]);

  // Mettre à jour les permissions d'un rôle
  const updateRolePermissions = useCallback(async (
    roleName: string, 
    moduleName: string, 
    permissionType: string, 
    value: boolean
  ): Promise<boolean> => {
    try {
      const rolePermissionsRes = await api.get('/auth/permissions/role_permissions/');
      const rolePermissions = rolePermissionsRes.data.role_permissions || [];
      const rolePerm = rolePermissions.find((rp: RolePermissions) => rp.role === roleName);
      
      if (!rolePerm) return false;

      const updatedModulePermissions = {
        ...rolePerm.module_permissions,
        [moduleName]: {
          ...rolePerm.module_permissions[moduleName],
          [permissionType]: value
        }
      };

      // D'abord, récupérer l'ID du rôle
      const rolesRes = await api.get('/auth/permissions/roles/');
      const role = rolesRes.data.roles.find((r: any) => r.name === roleName);
      
      if (!role) {
        toast({
          title: "Erreur",
          description: "Rôle non trouvé",
          variant: "destructive"
        });
        return false;
      }
      
      await api.put(`/auth/permissions/${role.id}/update-permissions/`, {
        module_permissions: updatedModulePermissions
      });

      toast({
        title: "Succès",
        description: "Permissions mises à jour"
      });
      return true;
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour les permissions",
        variant: "destructive"
      });
      return false;
    }
  }, [toast]);

  // Supprimer un rôle
  const deleteRole = useCallback(async (roleName: string): Promise<boolean> => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le rôle "${roleName}" ?`)) return false;

    try {
      // D'abord, récupérer l'ID du rôle
      const rolesRes = await api.get('/auth/permissions/roles/');
      const role = rolesRes.data.roles.find((r: any) => r.name === roleName);
      
      if (!role) {
        toast({
          title: "Erreur",
          description: "Rôle non trouvé",
          variant: "destructive"
        });
        return false;
      }
      
      await api.delete(`/auth/permissions/${role.id}/`);
      toast({
        title: "Succès",
        description: "Rôle supprimé avec succès"
      });
      return true;
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le rôle",
        variant: "destructive"
      });
      return false;
    }
  }, [toast]);

  // Supprimer une permission
  const deletePermission = useCallback(async (permissionName: string): Promise<boolean> => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer la permission "${permissionName}" ?`)) return false;

    try {
      // D'abord, récupérer l'ID de la permission
      const permissionsRes = await api.get('/auth/permissions/permissions/');
      const permission = permissionsRes.data.permissions.find((p: any) => p.full_name === permissionName);
      
      if (!permission) {
        toast({
          title: "Erreur",
          description: "Permission non trouvée",
          variant: "destructive"
        });
        return false;
      }
      
      await api.delete(`/auth/permissions/${permission.id}/`);
      toast({
        title: "Succès",
        description: "Permission supprimée avec succès"
      });
      return true;
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la permission",
        variant: "destructive"
      });
      return false;
    }
  }, [toast]);

  // Obtenir les utilisateurs d'un rôle
  const getRoleUsers = useCallback(async (roleName: string) => {
    try {
      // D'abord, récupérer l'ID du rôle
      const rolesRes = await api.get('/auth/permissions/roles/');
      const role = rolesRes.data.roles.find((r: any) => r.name === roleName);
      
      if (!role) {
        return [];
      }
      
      const response = await api.get(`/auth/permissions/${role.id}/users/`);
      return response.data.users || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs du rôle:', error);
      return [];
    }
  }, []);

  // Assigner un utilisateur à un rôle
  const assignUserToRole = useCallback(async (userId: number, roleName: string): Promise<boolean> => {
    try {
      // D'abord, récupérer l'ID du rôle
      const rolesRes = await api.get('/auth/permissions/roles/');
      const role = rolesRes.data.roles.find((r: any) => r.name === roleName);
      
      if (!role) {
        toast({
          title: "Erreur",
          description: "Rôle non trouvé",
          variant: "destructive"
        });
        return false;
      }
      
      await api.post(`/auth/permissions/${role.id}/assign-user/`, { user_id: userId });
      toast({
        title: "Succès",
        description: "Utilisateur assigné au rôle avec succès"
      });
      return true;
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'assigner l'utilisateur au rôle",
        variant: "destructive"
      });
      return false;
    }
  }, [toast]);

  // Retirer un utilisateur d'un rôle
  const removeUserFromRole = useCallback(async (userId: number, roleName: string): Promise<boolean> => {
    try {
      // D'abord, récupérer l'ID du rôle
      const rolesRes = await api.get('/auth/permissions/roles/');
      const role = rolesRes.data.roles.find((r: any) => r.name === roleName);
      
      if (!role) {
        toast({
          title: "Erreur",
          description: "Rôle non trouvé",
          variant: "destructive"
        });
        return false;
      }
      
      await api.delete(`/auth/permissions/${role.id}/remove-user/${userId}/`);
      toast({
        title: "Succès",
        description: "Utilisateur retiré du rôle avec succès"
      });
      return true;
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de retirer l'utilisateur du rôle",
        variant: "destructive"
      });
      return false;
    }
  }, [toast]);

  return {
    isLoading,
    loadPermissionData,
    createRole,
    createPermission,
    updateRolePermissions,
    deleteRole,
    deletePermission,
    getRoleUsers,
    assignUserToRole,
    removeUserFromRole
  };
}; 