import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { projectsAPI, projectMembersAPI, projectTasksAPI } from '@/lib/api';
import type { 
  Project, 
  ProjectList, 
  CreateProjectForm, 
  ProjectStatistics,
  ProjectMember,
  ProjectTask,
  CreateTaskForm,
  CreateTeamMemberForm
} from '@/lib/types';
import { toast } from 'sonner';
import { useMemo } from 'react';

// Query keys
export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (filters: any) => [...projectKeys.lists(), filters] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
  statistics: () => [...projectKeys.all, 'statistics'] as const,
  upcomingDeadlines: () => [...projectKeys.all, 'upcoming-deadlines'] as const,
  myProjects: () => [...projectKeys.all, 'my-projects'] as const,
  teamProjects: () => [...projectKeys.all, 'team-projects'] as const,
};

// ===== PROJETS =====

export const useProjects = (
  params?: {
    search?: string;
    ordering?: string;
    page?: number;
    page_size?: number;
    status?: string;
    type?: string;
    priority?: string;
    category?: string;
  },
  options?: Omit<UseQueryOptions<any, any, any>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['projects', params],
    queryFn: () => projectsAPI.getProjects(params),
    retry: (failureCount, error: any) => {
      // Don't retry on authentication errors
      if (error?.message?.includes('401') || error?.message?.includes('403')) {
        return false;
      }
      // Retry up to 3 times for other errors
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    ...options,
  });
};

export const useProject = (id: string) => {
  return useQuery({
    queryKey: ['project', id],
    queryFn: () => projectsAPI.getProject(id),
    enabled: !!id,
  });
};

export const useCreateProject = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateProjectForm) => projectsAPI.createProject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};

export const useUpdateProject = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateProjectForm> }) =>
      projectsAPI.updateProject(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', id] });
    },
  });
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => projectsAPI.deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};

export const useProjectStatistics = () => {
  return useQuery({
    queryKey: ['project-statistics'],
    queryFn: () => projectsAPI.getStatistics(),
    retry: (failureCount, error: any) => {
      // Don't retry on authentication errors
      if (error?.message?.includes('401') || error?.message?.includes('403')) {
        return false;
      }
      // Retry up to 3 times for other errors
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

export const useMyProjects = () => {
  return useQuery({
    queryKey: ['my-projects'],
    queryFn: () => projectsAPI.getMyProjects(),
  });
};

export const useTeamProjects = () => {
  return useQuery({
    queryKey: ['team-projects'],
    queryFn: () => projectsAPI.getTeamProjects(),
  });
};

export const useUpcomingDeadlines = () => {
  return useQuery({
    queryKey: ['upcoming-deadlines'],
    queryFn: () => projectsAPI.getUpcomingDeadlines(),
  });
};

export const useUpdateProjectProgress = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, progress }: { id: string; progress: number }) =>
      projectsAPI.updateProgress(id, progress),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', id] });
    },
  });
};

// ===== MEMBRES DE PROJET =====

export const useProjectMembers = (projectId: string) => {
  return useQuery({
    queryKey: ['project-members', projectId],
    queryFn: () => projectMembersAPI.getProjectMembers(projectId),
    enabled: !!projectId,
  });
};

export const useAddProjectMember = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ projectId, data }: { projectId: string; data: CreateTeamMemberForm }) =>
      projectMembersAPI.addProjectMember(projectId, data),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['project-members', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
  });
};

export const useUpdateProjectMember = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      projectId, 
      memberId, 
      data 
    }: { 
      projectId: string; 
      memberId: number; 
      data: Partial<CreateTeamMemberForm> 
    }) => projectMembersAPI.updateProjectMember(projectId, memberId, data),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['project-members', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
  });
};

export const useDeleteProjectMember = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ projectId, memberId }: { projectId: string; memberId: number }) =>
      projectMembersAPI.deleteProjectMember(projectId, memberId),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['project-members', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
  });
};

// ===== TÂCHES DE PROJET =====

export const useProjectTasks = (
  projectId: string | undefined,
  params?: {
    status?: string;
    assigned_to?: number;
    ordering?: string;
    page?: number;
  },
  options?: Omit<UseQueryOptions<any, any, any>, 'queryKey' | 'queryFn' | 'enabled'>
) => {
  const queryKey = useMemo(() => ['project-tasks', projectId, params], [projectId, params]);

  return useQuery({
    queryKey,
    queryFn: () => {
      if (!projectId) {
        return Promise.resolve({ results: [] });
      }
      return projectTasksAPI.getProjectTasks(projectId, params);
    },
    enabled: !!projectId,
    retry: (failureCount, error: any) => {
      // Don't retry on authentication errors
      if (error?.message?.includes('401') || error?.message?.includes('403')) {
        return false;
      }
      // Retry up to 3 times for other errors
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    ...options,
  });
};

export const useCreateProjectTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ projectId, data }: { projectId: string; data: CreateTaskForm }) =>
      projectTasksAPI.createProjectTask(projectId, data),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
  });
};

export const useUpdateProjectTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      projectId, 
      taskId, 
      data 
    }: { 
      projectId: string; 
      taskId: number; 
      data: Partial<CreateTaskForm> 
    }) => projectTasksAPI.updateProjectTask(projectId, taskId, data),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
  });
};

export const useDeleteProjectTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ projectId, taskId }: { projectId: string; taskId: number }) =>
      projectTasksAPI.deleteProjectTask(projectId, taskId),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
  });
};

export const useUpdateTaskStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ projectId, taskId, status }: { projectId: string; taskId: number; status: string }) =>
      projectTasksAPI.updateTaskStatus(projectId, taskId, status),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
  });
};

export const useExecuteTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ projectId, taskId }: { projectId: string; taskId: number }) =>
      projectTasksAPI.executeTask(projectId, taskId),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      toast.success('Tâche exécutée avec succès');
    },
  });
};

export const useUpcomingTaskDeadlines = (projectId: string) => {
  return useQuery({
    queryKey: ['upcoming-task-deadlines', projectId],
    queryFn: () => projectTasksAPI.getUpcomingDeadlines(projectId),
    enabled: !!projectId,
    // Rafraîchir toutes les 5 minutes
    refetchInterval: 5 * 60 * 1000,
  });
};

export function useProjectEvents(
  projectId: string | undefined,
  queryOptions?: Omit<UseQueryOptions<any>, 'queryKey' | 'queryFn'>
) {
  const queryKey = useMemo(() => ['project-events', projectId], [projectId]);

  return useQuery({
    queryKey,
    queryFn: () => {
      if (!projectId) {
        return Promise.resolve({ results: [] });
      }
      return projectsAPI.getProjectEvents(projectId);
    },
    enabled: !!projectId,
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('401') || error?.message?.includes('403')) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    ...queryOptions,
  });
}

export function useCreateProjectEvent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ projectId, eventData }: { projectId: string; eventData: any }) => {
      const response = await projectsAPI.createProjectEvent(projectId, eventData);
      return response;
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['project-events', projectId] });
    },
  });
}

export function useUpdateProjectEvent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ projectId, eventId, eventData }: { projectId: string; eventId: number; eventData: any }) => {
      const response = await projectsAPI.updateProjectEvent(projectId, eventId, eventData);
      return response;
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['project-events', projectId] });
    },
  });
}

export function useDeleteProjectEvent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ projectId, eventId }: { projectId: string; eventId: number }) => {
      await projectsAPI.deleteProjectEvent(projectId, eventId);
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['project-events', projectId] });
    },
  });
} 