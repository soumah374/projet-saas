import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectApi, Project, CreateProjectData, UpdateProjectData, ProjectStatistics } from '@/lib/api';

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

// Hook to get all projects with filters
export const useProjects = (filters?: {
  search?: string;
  status?: string;
  type?: string;
  priority?: string;
  ordering?: string;
}) => {
  return useQuery({
    queryKey: projectKeys.list(filters || {}),
    queryFn: () => projectApi.getProjects(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook to get a single project
export const useProject = (id: string) => {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: () => projectApi.getProject(id),
    enabled: !!id,
  });
};

// Hook to get project statistics
export const useProjectStatistics = () => {
  return useQuery({
    queryKey: projectKeys.statistics(),
    queryFn: () => projectApi.getStatistics(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook to get upcoming deadlines
export const useUpcomingDeadlines = () => {
  return useQuery({
    queryKey: projectKeys.upcomingDeadlines(),
    queryFn: () => projectApi.getUpcomingDeadlines(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook to get my projects
export const useMyProjects = () => {
  return useQuery({
    queryKey: projectKeys.myProjects(),
    queryFn: () => projectApi.getMyProjects(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook to get team projects
export const useTeamProjects = () => {
  return useQuery({
    queryKey: projectKeys.teamProjects(),
    queryFn: () => projectApi.getTeamProjects(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook to create a project
export const useCreateProject = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateProjectData) => projectApi.createProject(data),
    onSuccess: () => {
      // Invalidate and refetch project lists
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      queryClient.invalidateQueries({ queryKey: projectKeys.statistics() });
      queryClient.invalidateQueries({ queryKey: projectKeys.myProjects() });
      queryClient.invalidateQueries({ queryKey: projectKeys.teamProjects() });
    },
  });
};

// Hook to update a project
export const useUpdateProject = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProjectData }) =>
      projectApi.updateProject(id, data),
    onSuccess: (updatedProject) => {
      // Update the specific project in cache
      queryClient.setQueryData(projectKeys.detail(updatedProject.id), updatedProject);
      
      // Invalidate and refetch project lists
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      queryClient.invalidateQueries({ queryKey: projectKeys.statistics() });
      queryClient.invalidateQueries({ queryKey: projectKeys.myProjects() });
      queryClient.invalidateQueries({ queryKey: projectKeys.teamProjects() });
    },
  });
};

// Hook to delete a project
export const useDeleteProject = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => projectApi.deleteProject(id),
    onSuccess: (_, deletedId) => {
      // Remove the project from cache
      queryClient.removeQueries({ queryKey: projectKeys.detail(deletedId) });
      
      // Invalidate and refetch project lists
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      queryClient.invalidateQueries({ queryKey: projectKeys.statistics() });
      queryClient.invalidateQueries({ queryKey: projectKeys.myProjects() });
      queryClient.invalidateQueries({ queryKey: projectKeys.teamProjects() });
    },
  });
};

// Hook to update project progress
export const useUpdateProjectProgress = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, progress }: { id: string; progress: number }) =>
      projectApi.updateProgress(id, progress),
    onSuccess: (data, { id }) => {
      // Update the project's progress in cache
      queryClient.setQueryData(projectKeys.detail(id), (old: Project | undefined) => {
        if (old) {
          return { ...old, progress: data.progress };
        }
        return old;
      });
      
      // Invalidate and refetch project lists
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      queryClient.invalidateQueries({ queryKey: projectKeys.statistics() });
    },
  });
};

// Hook to add a member to a project
export const useAddProjectMember = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, user_id, role }: { id: string; user_id: number; role: string }) =>
      projectApi.addMember(id, user_id, role),
    onSuccess: (_, { id }) => {
      // Invalidate the specific project and lists
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
};

// Hook to remove a member from a project
export const useRemoveProjectMember = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, user_id }: { id: string; user_id: number }) =>
      projectApi.removeMember(id, user_id),
    onSuccess: (_, { id }) => {
      // Invalidate the specific project and lists
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}; 