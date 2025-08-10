import { useQuery, useMutation } from '@tanstack/react-query';
import { config } from '@/lib/config';

// Simple API request function for reports
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${config.api.baseUrl}${endpoint}`;
  const token = localStorage.getItem('access_token');
  
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export interface ProjectReportData {
  id: string;
  title: string;
  status: string;
  priority: string;
  progress: number;
  start_date: string;
  deadline: string;
  budget: string;
  team_members_count: number;
  tasks_total: number;
  tasks_completed: number;
  tasks_pending: number;
  tasks_overdue: number;
  manager: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  status?: string;
  type?: string;
  team?: string;
}

export const useProjectReports = (filters?: ReportFilters) => {
  return useQuery({
    queryKey: ['project-reports', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (filters?.startDate) params.append('start_date', filters.startDate);
      if (filters?.endDate) params.append('end_date', filters.endDate);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.type) params.append('type', filters.type);
      if (filters?.team) params.append('team', filters.team);

      const response = await apiRequest<any>(`/projects/reports/?${params.toString()}`);
      return response;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useExportReport = () => {
  return useMutation({
    mutationFn: async (filters: ReportFilters) => {
      const params = new URLSearchParams();
      
      if (filters.startDate) params.append('start_date', filters.startDate);
      if (filters.endDate) params.append('end_date', filters.endDate);
      if (filters.status) params.append('status', filters.status);
      if (filters.type) params.append('type', filters.type);
      if (filters.team) params.append('team', filters.team);

      const response = await fetch(`${config.api.baseUrl}/projects/reports/export/?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        }
      });

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'project_report.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    }
  });
}; 