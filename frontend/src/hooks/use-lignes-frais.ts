import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { LigneFrais, LigneFraisCreateData, LigneFraisList, LigneFraisUpdateData, PaginatedResponse } from '../lib/types';

// Récupérer toutes les lignes de frais avec pagination
export const useLignesFrais = (page: number = 1, pageSize: number = 10, search?: string, type?: string, category?: string) => {
  return useQuery({
    queryKey: ['lignes-frais', page, pageSize, search, type, category],
    queryFn: async (): Promise<PaginatedResponse<LigneFraisList>> => {
      const params: Record<string, string> = {};
      
      // Paramètres de pagination
      params.page = page.toString();
      params.page_size = pageSize.toString();
      
      // Paramètres de filtrage
      if (search && search.trim()) {
        params.search = search.trim();
      }
      if (type && type !== 'all') {
        params.type_frais = type;
      }
      if (category && category !== 'all') {
        params.category = category;
      }
      
      console.log('Requesting with params:', params);
      const response = await api.get('/catalog/lignes-frais/', { params });
      return response.data;
    },
  });
};

// Récupérer une ligne de frais par ID
export const useLigneFrais = (id: number) => {
  return useQuery({
    queryKey: ['lignes-frais', id],
    queryFn: async (): Promise<LigneFrais> => {
      const response = await api.get(`/catalog/lignes-frais/${id}/`);
      return response.data;
    },
    enabled: !!id,
  });
};

// Créer une nouvelle ligne de frais
export const useCreateLigneFrais = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: LigneFraisCreateData): Promise<LigneFrais> => {
      const response = await api.post('/catalog/lignes-frais/', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lignes-frais'] });
    },
  });
};

// Mettre à jour une ligne de frais
export const useUpdateLigneFrais = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: LigneFraisUpdateData }): Promise<LigneFrais> => {
      const response = await api.patch(`/catalog/lignes-frais/${id}/`, data);
      return response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['lignes-frais'] });
      queryClient.invalidateQueries({ queryKey: ['lignes-frais', id] });
    },
  });
};

// Supprimer une ligne de frais
export const useDeleteLigneFrais = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number): Promise<void> => {
      await api.delete(`/catalog/lignes-frais/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lignes-frais'] });
    },
  });
};

// Récupérer les lignes de frais par type
export const useLignesFraisByType = (type: string) => {
  return useQuery({
    queryKey: ['lignes-frais', 'type', type],
    queryFn: async (): Promise<LigneFrais[]> => {
      const response = await api.get(`/catalog/lignes-frais/?type_frais=${type}`);
      return response.data;
    },
    enabled: !!type,
  });
};

// Récupérer les lignes de frais par catégorie
export const useLignesFraisByCategory = (categoryId: number) => {
  return useQuery({
    queryKey: ['lignes-frais', 'category', categoryId],
    queryFn: async (): Promise<LigneFrais[]> => {
      const response = await api.get(`/catalog/lignes-frais/?category=${categoryId}`);
      return response.data;
    },
    enabled: !!categoryId,
  });
}; 