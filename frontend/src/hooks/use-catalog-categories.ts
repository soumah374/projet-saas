import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { catalogCategoriesAPI } from '@/lib/api';
import type { PaginatedResponse } from '@/lib/types';

export interface CatalogCategory {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

interface UseCatalogCategoriesParams {
  search?: string;
  page?: number;
  page_size?: number;
}

// Hook pour récupérer la liste des catégories de services
export const useCatalogCategories = (params?: UseCatalogCategoriesParams) => {
  return useQuery({
    queryKey: ['catalog-categories', params],
    queryFn: async () => {
      const response = await catalogCategoriesAPI.getCategories(params);
      return response.data as PaginatedResponse<CatalogCategory>;
    },
  });
};

// Hook pour récupérer une catégorie spécifique
export const useCatalogCategory = (id: number) => {
  return useQuery({
    queryKey: ['catalog-category', id],
    queryFn: async () => {
      const response = await catalogCategoriesAPI.getCategory(id);
      return response.data as CatalogCategory;
    },
    enabled: !!id,
  });
};

// Hook pour créer une catégorie
export const useCreateCatalogCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string }) => catalogCategoriesAPI.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog-categories'] });
    },
  });
};

// Hook pour mettre à jour une catégorie
export const useUpdateCatalogCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name: string } }) =>
      catalogCategoriesAPI.updateCategory(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['catalog-categories'] });
      queryClient.invalidateQueries({ queryKey: ['catalog-category', variables.id] });
    },
  });
};

// Hook pour supprimer une catégorie
export const useDeleteCatalogCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => catalogCategoriesAPI.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog-categories'] });
    },
  });
};
