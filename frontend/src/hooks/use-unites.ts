import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface UniteStandard {
  id: number;
  intitule: string;
  code: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface UnitesStandardsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: UniteStandard[];
}

interface UseUnitesStandardsOptions {
  page?: number;
  page_size?: number;
  search?: string;
  is_active?: boolean;
}

export function useUnitesStandards(options: UseUnitesStandardsOptions = {}) {
  const { page = 1, page_size = 1000, search, is_active } = options;

  return useQuery({
    queryKey: ['unites-standards', { page, page_size, search, is_active }],
    queryFn: async (): Promise<UnitesStandardsResponse> => {
      const params = new URLSearchParams();
      if (page) params.append('page', page.toString());
      if (page_size) params.append('page_size', page_size.toString());
      if (search) params.append('search', search);
      if (is_active !== undefined) params.append('is_active', is_active.toString());

      const response = await api.get(`/catalog/unites-standards/?${params.toString()}`);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook pour récupérer une unité standard spécifique
export function useUniteStandard(id: number) {
  return useQuery({
    queryKey: ['unite-standard', id],
    queryFn: async (): Promise<UniteStandard> => {
      const response = await api.get(`/catalog/unites-standards/${id}/`);
      return response.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
} 