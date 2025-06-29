import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectApi, Project, CreateProjectData, UpdateProjectData, CreateTaskData, UpdateTaskData } from '../lib/api';
import { toast } from 'sonner';

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

// Hook pour récupérer la liste des projets
export const useProjects = (filters?: any) => {
  return useQuery({
    queryKey: ['projects', filters],
    queryFn: () => projectApi.getProjects(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook pour récupérer un projet spécifique
export const useProject = (id: string) => {
  return useQuery({
    queryKey: ['project', id],
    queryFn: () => projectApi.getProject(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook pour créer un projet
export const useCreateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: projectApi.createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project-statistics'] });
      toast.success('Projet créé avec succès');
    },
    onError: (error: any) => {
      console.error('Erreur lors de la création du projet:', error);
      const errorMessage = error?.response?.data?.message || 
                          error?.response?.data?.detail || 
                          'Erreur lors de la création du projet';
      toast.error(errorMessage);
    },
  });
};

// Hook pour mettre à jour un projet
export const useUpdateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProjectData }) =>
      projectApi.updateProject(id, data),
    onSuccess: (updatedProject) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', updatedProject.id] });
      queryClient.invalidateQueries({ queryKey: ['project-statistics'] });
      toast.success('Projet mis à jour avec succès');
    },
    onError: (error: any) => {
      console.error('Erreur lors de la mise à jour du projet:', error);
      const errorMessage = error?.response?.data?.message || 
                          error?.response?.data?.detail || 
                          'Erreur lors de la mise à jour du projet';
      toast.error(errorMessage);
    },
  });
};

// Hook pour supprimer un projet
export const useDeleteProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: projectApi.deleteProject,
    onSuccess: (_, projectId) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.removeQueries({ queryKey: ['project', projectId] });
      toast.success('Projet supprimé avec succès');
    },
    onError: (error: any) => {
      console.error('Erreur lors de la suppression du projet:', error);
      const errorMessage = error?.response?.data?.message || 
                          error?.response?.data?.detail || 
                          'Erreur lors de la suppression du projet';
      toast.error(errorMessage);
    },
  });
};

// Hook pour récupérer les statistiques des projets
export const useProjectStatistics = () => {
  return useQuery({
    queryKey: ['project-statistics'],
    queryFn: () => projectApi.getStatistics(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook pour récupérer les projets à venir
export const useUpcomingDeadlines = () => {
  return useQuery({
    queryKey: ['upcoming-deadlines'],
    queryFn: () => projectApi.getUpcomingDeadlines(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook pour récupérer mes projets
export const useMyProjects = () => {
  return useQuery({
    queryKey: ['my-projects'],
    queryFn: () => projectApi.getMyProjects(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook pour récupérer les projets de l'équipe
export const useTeamProjects = () => {
  return useQuery({
    queryKey: ['team-projects'],
    queryFn: () => projectApi.getTeamProjects(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook pour mettre à jour la progression d'un projet
export const useUpdateProgress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, progress }: { id: string; progress: number }) =>
      projectApi.updateProgress(id, progress),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      toast.success('Progression mise à jour avec succès');
    },
    onError: (error: any) => {
      console.error('Erreur lors de la mise à jour de la progression:', error);
      const errorMessage = error?.response?.data?.message || 
                          error?.response?.data?.detail || 
                          'Erreur lors de la mise à jour de la progression';
      toast.error(errorMessage);
    },
  });
};

// Hook pour ajouter un membre à un projet
export const useAddProjectMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, user_id, role }: { id: string; user_id: number; role: string }) =>
      projectApi.addMember(id, user_id, role),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      toast.success('Membre ajouté au projet avec succès');
    },
    onError: (error: any) => {
      console.error('Erreur lors de l\'ajout du membre:', error);
      const errorMessage = error?.response?.data?.message || 
                          error?.response?.data?.detail || 
                          'Erreur lors de l\'ajout du membre';
      toast.error(errorMessage);
    },
  });
};

// Hook pour supprimer un membre d'un projet
export const useRemoveProjectMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, user_id }: { id: string; user_id: number }) =>
      projectApi.removeMember(id, user_id),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      toast.success('Membre supprimé du projet avec succès');
    },
    onError: (error: any) => {
      console.error('Erreur lors de la suppression du membre:', error);
      const errorMessage = error?.response?.data?.message || 
                          error?.response?.data?.detail || 
                          'Erreur lors de la suppression du membre';
      toast.error(errorMessage);
    },
  });
};

// Hook pour créer une tâche
export const useCreateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, data }: { projectId: string; data: CreateTaskData }) =>
      projectApi.createTask(projectId, data),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      toast.success('Tâche créée avec succès');
    },
    onError: (error: any) => {
      console.error('Erreur lors de la création de la tâche:', error);
      const errorMessage = error?.response?.data?.message || 
                          error?.response?.data?.detail || 
                          'Erreur lors de la création de la tâche';
      toast.error(errorMessage);
    },
  });
};

// Hook pour mettre à jour une tâche
export const useUpdateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, taskId, data }: { projectId: string; taskId: number; data: UpdateTaskData }) =>
      projectApi.updateTask(projectId, taskId, data),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      toast.success('Tâche mise à jour avec succès');
    },
    onError: (error: any) => {
      console.error('Erreur lors de la mise à jour de la tâche:', error);
      const errorMessage = error?.response?.data?.message || 
                          error?.response?.data?.detail || 
                          'Erreur lors de la mise à jour de la tâche';
      toast.error(errorMessage);
    },
  });
};

// Hook pour supprimer une tâche
export const useDeleteTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, taskId }: { projectId: string; taskId: number }) =>
      projectApi.deleteTask(projectId, taskId),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      toast.success('Tâche supprimée avec succès');
    },
    onError: (error: any) => {
      console.error('Erreur lors de la suppression de la tâche:', error);
      const errorMessage = error?.response?.data?.message || 
                          error?.response?.data?.detail || 
                          'Erreur lors de la suppression de la tâche';
      toast.error(errorMessage);
    },
  });
}; 