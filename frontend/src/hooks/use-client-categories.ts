import { useQuery } from '@tanstack/react-query';
import { clientCategoriesAPI } from '@/lib/api';
import type { ClientCategory, PaginatedResponse } from '@/lib/types';

// Hook pour récupérer la liste des catégories de clients
export const useClientCategories = () => {
  return useQuery({
    queryKey: ['client-categories'],
    queryFn: async () => {
      const response = await clientCategoriesAPI.getCategories();
      return response.data as PaginatedResponse<ClientCategory>;
    },
  });
};

// Hook pour récupérer une catégorie spécifique
export const useClientCategory = (id: number) => {
  return useQuery({
    queryKey: ['client-category', id],
    queryFn: async () => {
      const response = await clientCategoriesAPI.getCategory(id);
      return response.data as ClientCategory;
    },
    enabled: !!id,
  });
}; 