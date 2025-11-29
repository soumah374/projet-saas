import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Timer {
  id: number;
  user: number;
  user_name: string;
  project: string;
  task: number;
  task_title: string;
  start_time: string;
  end_time: string | null;
  description: string;
  is_running: boolean;
  created_at: string;
  elapsed_time: number;
}

export interface CreateTimerData {
  project: string;
  task: number;
  description?: string;
  start_time: string;
}

export function useActiveTimer(project_id: string) {
  return useQuery({
    queryKey: ['timer', 'active', project_id],
    queryFn: async () => {
      try {
        const response = await api.get(`/projects/${project_id}/timers/active/`);
        return response.data;
      } catch (error: any) {
        if (error.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
    refetchInterval: 1000, // Rafraîchir chaque seconde pour le timer
    enabled: !!project_id,
  });
}

export function useTimers(project_id: string, filters?: { is_running?: boolean; project?: string; task?: number }) {
  return useQuery({
    queryKey: ['timers', project_id, filters],
    queryFn: async () => {
      const response = await api.get(`/projects/${project_id}/timers/`, { params: filters });
      return response.data.results || response.data;
    },
    enabled: !!project_id,
  });
}

export function useStartTimer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ project_id, data }: { project_id: string; data: CreateTimerData }) => {
      const response = await api.post(`/projects/${project_id}/timers/`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timer', 'active'] });
      queryClient.invalidateQueries({ queryKey: ['timers'] });
    },
  });
}

export function useStopTimer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ project_id, timerId }: { project_id: string; timerId: number }) => {
      const response = await api.post(`/projects/${project_id}/timers/${timerId}/stop/`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timer', 'active'] });
      queryClient.invalidateQueries({ queryKey: ['timers'] });
      queryClient.invalidateQueries({ queryKey: ['timesheets'] });
    },
  });
}
