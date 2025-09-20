import { useQuery, useMutation } from '@tanstack/react-query';
import { config } from '@/lib/config';
import type { Service, PaginatedResponse, Category } from '@/lib/types';

const BASE_URL = `${config.api.baseUrl}/catalog`;

interface ServicesFilters {
  search?: string;
  category?: number;
  is_active?: boolean;
  profile_intervenant?: number;
  ordering?: string;
  page?: number;
  page_size?: number;
}

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('access_token');
  
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export function useServices(filters?: ServicesFilters) {
  return useQuery({
    queryKey: ['services', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (filters?.search) params.append('search', filters.search);
      if (filters?.category) params.append('category', filters.category.toString());
      if (filters?.is_active !== undefined) params.append('is_active', filters.is_active.toString());
      if (filters?.profile_intervenant) params.append('profile_intervenant', filters.profile_intervenant.toString());
      if (filters?.ordering) params.append('ordering', filters.ordering);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.page_size) params.append('page_size', filters.page_size.toString());

      return apiRequest<PaginatedResponse<Service>>(`/services/?${params.toString()}`);
    },
  });
}

export function useService(id: number) {
  return useQuery({
    queryKey: ['service', id],
    queryFn: () => apiRequest<Service>(`/services/${id}/`),
    enabled: !!id,
  });
} 

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => apiRequest<PaginatedResponse<Category>>('/categories/'),
  });
}


export function useServicesByCategory(categoryId: number) {
  return useQuery({
    queryKey: ['services', categoryId],
    queryFn: () => apiRequest<PaginatedResponse<Service>>(`/services/category/${categoryId}/services/`),
  });
}

interface ImportService {
  name: string;
  description: string;
  category_id?: number | null;
  is_active: boolean;
}

interface BulkImportResponse {
  success_count: number;
  error_count: number;
  imported_services: Array<{
    id: number;
    name: string;
    description: string;
  }>;
  errors: Array<{
    index: number;
    name?: string;
    error: string;
  }>;
}

export function useBulkImportServices() {
  return useMutation({
    mutationFn: (data: { services: ImportService[] }) => apiRequest<BulkImportResponse>('/services/bulk-import/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  });
}

// catalog/services/category/2/services/
