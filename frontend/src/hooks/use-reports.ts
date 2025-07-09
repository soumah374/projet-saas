import { useQuery } from '@tanstack/react-query';
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

export interface ReportSummary {
  projects: {
    total: number;
    active: number;
    completed: number;
    delayed: number;
    on_time: number;
  };
  tasks: {
    total: number;
    completed: number;
    pending: number;
    overdue: number;
    completion_rate: number;
  };
  team: {
    total_members: number;
    active_projects: number;
    avg_productivity: number;
  };
  budget: {
    total_allocated: number;
    total_spent: number;
    remaining: number;
  };
  timeline: {
    labels: string[];
    projects_completed: number[];
    tasks_completed: number[];
  };
}

export interface ReportFilters {
  date_from?: string;
  date_to?: string;
  status?: string;
  priority?: string;
  team_member?: number;
  project_type?: string;
}

export const useProjectReports = (filters?: ReportFilters) => {
  return useQuery({
    queryKey: ['project-reports', filters],
    queryFn: async (): Promise<ProjectReportData[]> => {
      const params = new URLSearchParams();
      
      if (filters?.date_from) params.append('date_from', filters.date_from);
      if (filters?.date_to) params.append('date_to', filters.date_to);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.priority) params.append('priority', filters.priority);
      if (filters?.team_member) params.append('team_member', filters.team_member.toString());
      if (filters?.project_type) params.append('type', filters.project_type);

      const response = await apiRequest<{ results?: ProjectReportData[]; data?: ProjectReportData[] }>(`/projects/reports/?${params.toString()}`);
      return response.results || response.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useReportSummary = (filters?: ReportFilters) => {
  return useQuery({
    queryKey: ['report-summary', filters],
    queryFn: async (): Promise<ReportSummary> => {
      const params = new URLSearchParams();
      
      if (filters?.date_from) params.append('date_from', filters.date_from);
      if (filters?.date_to) params.append('date_to', filters.date_to);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.priority) params.append('priority', filters.priority);

      const response = await apiRequest<ReportSummary>(`/projects/reports_summary/?${params.toString()}`);
      return response;
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useExportReport = () => {
  return {
    exportPDF: async (filters?: ReportFilters) => {
      const params = new URLSearchParams();
      if (filters?.date_from) params.append('date_from', filters.date_from);
      if (filters?.date_to) params.append('date_to', filters.date_to);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.priority) params.append('priority', filters.priority);

      const response = await fetch(`${config.api.baseUrl}/projects/reports/export/pdf/?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `rapport-projets-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },

    exportExcel: async (filters?: ReportFilters) => {
      const params = new URLSearchParams();
      if (filters?.date_from) params.append('date_from', filters.date_from);
      if (filters?.date_to) params.append('date_to', filters.date_to);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.priority) params.append('priority', filters.priority);

      const response = await fetch(`${config.api.baseUrl}/projects/reports/export/excel/?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `rapport-projets-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }
  };
}; 