import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';

// Types

export interface FieldPermissions {
  [fieldName: string]: {
    read: boolean;
    write: boolean;
  };
}
export interface FieldPermission {
  id: number;
  user?: number;
  user_display?: string;
  group?: number;
  group_display?: string;
  content_type: number;
  content_type_display: string;
  model_name: string;
  field_name: string;
  object_id?: number;
  permission: string;
  permission_display: string;
}



export interface ModelPermissionsResponse {
  model_name: string;
  object_id?: number;
  fields: FieldPermissions;
}

export interface AvailableModel {
  id: number;
  app_label: string;
  model_name: string;
  model_verbose_name: string;
  fields: string[];
}

export interface CheckPermissionRequest {
  model_name: string;
  app_label: string;
  field_name: string;
  permission: 'read' | 'write';
  object_id?: number;
}

export interface CheckPermissionResponse {
  has_permission: boolean;
  model: string;
  field: string;
  permission: string;
  object_id?: number;
}

// Hook pour récupérer toutes les permissions
export interface FieldPermissionsParams {
  search?: string;
  page?: number;
  page_size?: number;
}

export const useFieldPermissions = (params: FieldPermissionsParams = {}) => {
  return useQuery({
    queryKey: ['field-permissions', params],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (params.search) queryParams.append('search', params.search);
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.page_size) queryParams.append('page_size', params.page_size.toString());

      const url = `/auth/field-permissions/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await api.get(url);
      return response.data;
    },
  });
};

// Hook pour récupérer les permissions de l'utilisateur connecté
export const useMyFieldPermissions = () => {
  return useQuery({
    queryKey: ['my-field-permissions'],
    queryFn: async () => {
      const response = await api.get('/auth/field-permissions/my_permissions/');
      return response.data as FieldPermission[];
    },
  });
};

// Hook pour vérifier une permission spécifique
export const useCheckFieldPermission = () => {
  return useMutation({
    mutationFn: async (data: CheckPermissionRequest) => {
      const response = await api.post('/auth/field-permissions/check_permission/', data);
      return response.data as CheckPermissionResponse;
    },
  });
};

// Hook pour récupérer les permissions d'un modèle
export const useModelFieldPermissions = (
  modelName: string,
  appLabel: string,
  objectId?: number,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ['model-field-permissions', modelName, appLabel, objectId],
    queryFn: async () => {
      const response = await api.post('/auth/field-permissions/get_model_permissions/', {
        model_name: modelName,
        app_label: appLabel,
        object_id: objectId,
      });
      return response.data as ModelPermissionsResponse;
    },
    enabled: enabled && !!modelName && !!appLabel,
  });
};

// Hook pour récupérer les modèles disponibles
export const useAvailableModels = () => {
  return useQuery({
    queryKey: ['available-models'],
    queryFn: async () => {
      const response = await api.get('/auth/field-permissions/available_models/');
      return response.data as AvailableModel[];
    },
  });
};

// Hook pour créer une permission
export const useCreateFieldPermission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<FieldPermission, 'id' | 'user_display' | 'group_display' | 'content_type_display' | 'model_name' | 'permission_display'>) => {
      const response = await api.post('/auth/field-permissions/', data);
      return response.data as FieldPermission;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['field-permissions'] });
      queryClient.invalidateQueries({ queryKey: ['my-field-permissions'] });
      queryClient.invalidateQueries({ queryKey: ['model-field-permissions'] });
      toast.success('Permission créée avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Erreur lors de la création de la permission');
    },
  });
};

// Hook pour créer plusieurs permissions en masse
export interface BulkPermissionData {
  user: number;
  content_type: number;
  field_name: string;
  permission: 'read' | 'write';
  object_id?: number;
}

export interface BulkCreateResponse {
  created: number;
  errors: number;
  permissions: FieldPermission[];
  error_details?: Array<{
    data: BulkPermissionData;
    errors?: any;
    error?: string;
  }>;
}

export const useBulkCreateFieldPermissions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: BulkPermissionData[]) => {
      const response = await api.post('/auth/field-permissions/bulk_create/', data);
      return response.data as BulkCreateResponse;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['field-permissions'] });
      queryClient.invalidateQueries({ queryKey: ['my-field-permissions'] });
      queryClient.invalidateQueries({ queryKey: ['model-field-permissions'] });

      if (data.created > 0) {
        toast.success(`${data.created} permission(s) créée(s) avec succès`);
      }
      if (data.errors > 0) {
        toast.warning(`${data.errors} erreur(s) lors de la création`);
        console.error('Erreurs de création:', data.error_details);
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la création des permissions');
    },
  });
};

// Hook pour mettre à jour une permission
export const useUpdateFieldPermission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<FieldPermission> }) => {
      const response = await api.patch(`/auth/field-permissions/${id}/`, data);
      return response.data as FieldPermission;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['field-permissions'] });
      queryClient.invalidateQueries({ queryKey: ['my-field-permissions'] });
      queryClient.invalidateQueries({ queryKey: ['model-field-permissions'] });
      toast.success('Permission mise à jour avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Erreur lors de la mise à jour de la permission');
    },
  });
};

// Hook pour supprimer une permission
export const useDeleteFieldPermission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/auth/field-permissions/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['field-permissions'] });
      queryClient.invalidateQueries({ queryKey: ['my-field-permissions'] });
      queryClient.invalidateQueries({ queryKey: ['model-field-permissions'] });
      toast.success('Permission supprimée avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Erreur lors de la suppression de la permission');
    },
  });
};

// Hook personnalisé pour vérifier si un champ est accessible
export const useFieldAccess = (
  modelName: string,
  appLabel: string,
  fieldName: string,
  objectId?: number
) => {
  const { data: permissions } = useModelFieldPermissions(modelName, appLabel, objectId);

  const canRead = permissions?.fields?.[fieldName]?.read ?? false;
  const canWrite = permissions?.fields?.[fieldName]?.write ?? false;

  return {
    canRead,
    canWrite,
    isLoading: !permissions,
  };
};

// Hook pour vérifier l'accès à plusieurs champs
export const useMultipleFieldAccess = (
  modelName: string,
  appLabel: string,
  fieldNames: string[],
  objectId?: number
) => {
  const { data: permissions, isLoading } = useModelFieldPermissions(modelName, appLabel, objectId);

  const fieldsAccess = fieldNames.reduce((acc, fieldName) => {
    acc[fieldName] = {
      canRead: permissions?.fields?.[fieldName]?.read ?? false,
      canWrite: permissions?.fields?.[fieldName]?.write ?? false,
    };
    return acc;
  }, {} as Record<string, { canRead: boolean; canWrite: boolean }>);

  return {
    fieldsAccess,
    isLoading,
  };
};

// Hook pour récupérer les groupes (rôles)
export const useGroups = () => {
  return useQuery({
    queryKey: ['groups'],
    queryFn: async () => {
      const response = await api.get('/auth/permissions/roles/');
      console.log(response.data.roles)
      return response.data.roles as Array<{ id: number; name: string }>;
    },
  });
};

// Hook pour récupérer les objets d'un modèle spécifique
export const useModelObjects = (contentTypeId?: number, search?: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['model-objects', contentTypeId, search],
    queryFn: async () => {
      if (!contentTypeId) return [];
      const params = new URLSearchParams();
      if (search) params.append('search', search);

      const response = await api.get(`/auth/field-permissions/model-objects/${contentTypeId}/?${params}`);
      return response.data as Array<{ id: number; display: string }>;
    },
    enabled: enabled && !!contentTypeId,
  });
};
