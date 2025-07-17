import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { config } from '@/lib/config';
import type {
  Project,
  CreateProjectPayload,
  UpdateProjectPayload,
  ProjectFilters,
  ProjectTask,
  ProjectMember,
  ProjectPhase,
  TaskWithDeadline,
  ProjectEvent,
  PaginatedResponse,
  ExtendedProject
} from '@/lib/types';
import { useMemo } from 'react';

const BASE_URL = `${config.api.baseUrl}/projects`;

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

interface ProjectsFilters extends ProjectFilters {
  search?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}

export function useProjects(filters?: ProjectsFilters) {
  return useQuery({
    queryKey: ['projects', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (filters?.search) params.append('search', filters.search);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.type) params.append('type', filters.type);
      if (filters?.priority) params.append('priority', filters.priority);
      if (filters?.client) params.append('client', filters.client);
      if (filters?.start_date) params.append('start_date', filters.start_date);
      if (filters?.end_date) params.append('end_date', filters.end_date);
      if (filters?.team_member) params.append('team_member', filters.team_member.toString());
      if (filters?.ordering) params.append('ordering', filters.ordering);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.page_size) params.append('page_size', filters.page_size.toString());

      return apiRequest<PaginatedResponse<ExtendedProject>>(`/?${params.toString()}`);
    },
  });
}

export function useProject(projectId: string) {
  return useQuery({
    queryKey: ['project', projectId],
    queryFn: () => apiRequest<Project>(`/${projectId}/`),
    enabled: !!projectId,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProjectPayload) =>
      apiRequest<Project>('/', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, data }: { projectId: string; data: UpdateProjectPayload }) =>
      apiRequest<Project>(`/${projectId}/`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: string) =>
      apiRequest(`/${projectId}/`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

// Project Tasks
export function useProjectTasks(projectId: string) {
  return useQuery({
    queryKey: ['project-tasks', projectId],
    queryFn: () => apiRequest<PaginatedResponse<ProjectTask>>(`/${projectId}/tasks/`),
    enabled: !!projectId,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, data }: { projectId: string; data: Omit<ProjectTask, 'id' | 'completion_percentage' | 'phase_name' | 'assigned_to_name' | 'actual_hours' | 'created_at' | 'updated_at'> }) =>
      apiRequest<ProjectTask>(`/${projectId}/tasks/`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
  });
}

export function useCreateProjectTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, data }: { projectId: string; data: Partial<ProjectTask> }) =>
      apiRequest<ProjectTask>(`/${projectId}/tasks/`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
  });
}

export function useDeleteProjectTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, taskId }: { projectId: string; taskId: number }) =>
      apiRequest<ProjectTask>(`/${projectId}/tasks/${taskId}/`, {
        method: 'DELETE',
      }),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
  });
}

export function useExecuteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, taskId }: { projectId: string; taskId: number }) =>
      apiRequest<ProjectTask>(`/${projectId}/tasks/$  {taskId}/`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'En cours' }),
      }),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
  });
}

export function useUpdateProjectTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, taskId, data }: { projectId: string; taskId: number; data: Partial<ProjectTask> }) =>
      apiRequest<ProjectTask>(`/${projectId}/tasks/${taskId}/`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
  });
}

export function useUpcomingTaskDeadlines(projectId: string) {
  const { data: tasks } = useProjectTasks(projectId);
  
  const upcomingTasks = useMemo(() => {
    if (!tasks || !Array.isArray(tasks)) return [];
 
    return tasks.filter((task: ProjectTask) => {
      if (!task.due_date) return false;
      
      const dueDate = new Date(task.due_date);
      const now = new Date();
      const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      return diffDays >= 0 && diffDays <= 5; // Show tasks due within next 5 days
    }).map((task: ProjectTask) => ({
      ...task,
      days_remaining: Math.ceil((new Date(task.due_date!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    }));
  }, [tasks]);

  return { data: upcomingTasks, isLoading: !tasks };
}

export function useProjectEvents(projectId: string) {
  return useQuery({
    queryKey: ['project-events', projectId],
    queryFn: () => apiRequest<ProjectEvent[]>(`/${projectId}/events/`),
    enabled: !!projectId,
  });
}

export function useCreateProjectEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, data }: { projectId: string; data: Partial<ProjectEvent> }) =>
      apiRequest<ProjectEvent>(`/${projectId}/events/`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['project-events', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
  });
}

export function useDeleteProjectEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, eventId }: { projectId: string; eventId: number }) =>
      apiRequest<void>(`/${projectId}/events/${eventId}/`, {
        method: 'DELETE',
      }),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['project-events', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
  });
}

export function useUpdateProjectEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, eventId, data }: { projectId: string; eventId: number; data: Partial<ProjectEvent> }) =>
      apiRequest<ProjectEvent>(`/${projectId}/events/${eventId}/`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['project-events', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, taskId, data }: { projectId: string; taskId: number; data: Partial<ProjectTask> }) =>
      apiRequest<ProjectTask>(`/${projectId}/tasks/${taskId}/`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
  });
}

// Project Team Members
export function useProjectTeam(projectId: string, userId: number) {
  return useQuery({
    queryKey: ['project-team', projectId],
    queryFn: () => apiRequest<ProjectMember[]>(`/projects/${projectId}/team/user/${userId}/delete/`),
    enabled: !!projectId && !!userId
  });
}

export function useAddTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, data }: { projectId: string; data: { user: number; role: string; allocation_percentage?: number } }) =>
      apiRequest<ProjectMember>(`/${projectId}/team/`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['project-team', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
  });
}

export function useUpdateTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, memberId, data }: { projectId: string; memberId: number; data: Partial<ProjectMember> }) =>
      apiRequest<ProjectMember>(`/${projectId}/team/${memberId}/`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['project-team', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
  });
}

// Project Phases
export function useProjectPhases(projectId: string) {
  return useQuery({
    queryKey: ['project-phases', projectId],
    queryFn: () => apiRequest<ProjectPhase[]>(`/${projectId}/phases/`),
    enabled: !!projectId,
  });
}

export function useCreatePhase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, data }: { projectId: string; data: Omit<ProjectPhase, 'id' | 'project'> }) =>
      apiRequest<ProjectPhase>(`/${projectId}/phases/`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['project-phases', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
  });
}

export function useUpdatePhase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, phaseId, data }: { projectId: string; phaseId: number; data: Partial<ProjectPhase> }) =>
      apiRequest<ProjectPhase>(`/${projectId}/phases/${phaseId}/`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['project-phases', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
  });
} 