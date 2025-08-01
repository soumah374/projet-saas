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
  start_date?: string;
  end_date?: string;
  project_type?: string;
  project_status?: string;
  team?: string;
}

export const useProjectReports = (filters?: ReportFilters) => {
  return useQuery({
    queryKey: ['project-reports', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (filters?.start_date) params.append('start_date', filters.start_date);
      if (filters?.end_date) params.append('end_date', filters.end_date);
      if (filters?.project_status) params.append('status', filters.project_status);
      if (filters?.project_type) params.append('type', filters.project_type);
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
      
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      if (filters.project_status) params.append('status', filters.project_status);
      if (filters.project_type) params.append('type', filters.project_type);
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
      link.setAttribute('download', 'project_report.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    }
  });
}; 