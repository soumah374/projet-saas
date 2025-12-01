import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { FraisCategory, FraisCategoryCreateData, FraisCategoryUpdateData } from '../lib/types';

interface FraisCategoryFilters {
  search?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}

// Récupérer toutes les catégories de frais
export const useFraisCategories = (filters?: FraisCategoryFilters) => {
  return useQuery({
    queryKey: ['frais-categories'],
    queryFn: async (): Promise<FraisCategory[]> => {
      const response = await api.get('/catalog/frais-categories/');
      const params = new URLSearchParams();
      if (filters?.search) params.append('search', filters.search);
      if (filters?.ordering) params.append('ordering', filters.ordering);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.page_size) params.append('page_size', filters.page_size.toString());
      
      return response.data.results || response.data;
    },
  });
};

// Récupérer une catégorie de frais par ID
export const useFraisCategory = (id: number) => {
  return useQuery({
    queryKey: ['frais-categories', id],
    queryFn: async (): Promise<FraisCategory> => {
      const response = await api.get(`/catalog/frais-categories/${id}/`);
      return response.data;
    },
    enabled: !!id,
  });
};

// Créer une nouvelle catégorie de frais
export const useCreateFraisCategory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: FraisCategoryCreateData): Promise<FraisCategory> => {
      const response = await api.post('/catalog/frais-categories/', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['frais-categories'] });
    },
  });
};

// Mettre à jour une catégorie de frais
export const useUpdateFraisCategory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: FraisCategoryUpdateData }): Promise<FraisCategory> => {
      const response = await api.patch(`/catalog/frais-categories/${id}/`, data);
      return response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['frais-categories'] });
      queryClient.invalidateQueries({ queryKey: ['frais-categories', id] });
    },
  });
};

// Supprimer une catégorie de frais
export const useDeleteFraisCategory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number): Promise<void> => {
      await api.delete(`/catalog/frais-categories/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['frais-categories'] });
    },
  });
}; 