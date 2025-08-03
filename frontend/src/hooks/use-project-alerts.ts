import { useQuery } from '@tanstack/react-query';
import { projectApi } from '@/lib/api';

interface ProjectAlert {
  type: 'task_overdue' | 'time_exceeded' | 'slow_progress' | 'budget_alert' | 'resource_alert';
  severity: 'low' | 'medium' | 'high';
  message: string;
  details: any;
  date: string;
}

export const useProjectAlerts = (projectId: string) => {
  return useQuery({
    queryKey: ['project-alerts', projectId],
    queryFn: async () => {
      const response = await projectApi.getProjectAlerts(projectId);
      return response.data as ProjectAlert[];
    },
    enabled: !!projectId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}; 