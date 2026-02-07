import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectApi, servicesAPI } from '@/lib/api';
import { Service } from '@/lib/types';

interface UseProjectLifecycle {
  teamMembers: any[];
  loading: boolean;
  error: any;
  addTeamMember: (data: any) => Promise<void>;
  removeTeamMember: (memberId: number) => Promise<void>;
  updateTeamMember: (memberId: number, data: any) => Promise<void>;
  applyTaskTemplate: (category: string) => Promise<void>;
  checkUserAllocation: (userId: string) => Promise<number>;
  services: Service[];
  updateTaskStatus: (taskId: number, status: 'À faire' | 'En cours' | 'Terminé' | 'En pause') => Promise<void>;
}

export function useProjectLifecycle(projectId: string, searchTerm?: string): UseProjectLifecycle {
  const queryClient = useQueryClient();



  // Fetch services
  const {
    data: servicesData,
    isLoading: servicesLoading,
    error: servicesError
  } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const response = await servicesAPI.getServices();
      return response.data;
    }
  });

  // Fetch team members
  const {
    data: teamData,
    isLoading: teamLoading,
    error: teamError
  } = useQuery({
    queryKey: ['project-team', projectId, searchTerm],
    queryFn: async () => {
      // console.log('Fetching team members for projectId:', projectId, 'searchTerm:', searchTerm);
      const params = searchTerm ? { search: searchTerm } : undefined;
      const response = await projectApi.getProjectTeam(projectId, params);
      return response.data;
    },
    enabled: !!projectId
  });



  // Team member mutations
  const addTeamMemberMutation = useMutation({
    mutationFn: (data: any) => 
      projectApi.addTeamMember(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-team', projectId] });
    }
  });
  // Team member mutations
  const removeTeamMemberMutation = useMutation({
    mutationFn: (memberId: number) => 
      projectApi.deleteProjectMember(projectId, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-team', projectId] });
    }
  });

  const updateTeamMemberMutation = useMutation({
    mutationFn: ({ memberId, data }: { memberId: number; data: any }) => 
      projectApi.updateTeamMember(projectId, memberId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-team', projectId] });
    }
  });

  const updateTaskStatusMutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: number; status: 'À faire' | 'En cours' | 'Terminé' | 'En pause' }) => 
      projectApi.updateTaskStatus(projectId, taskId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
    }
  });

  // Task template mutation
  const applyTemplateMutation = useMutation({
    mutationFn: (category: string) => 
      projectApi.applyTaskTemplate(projectId, category),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
    }
  });



  // Check user's current allocation for this project
  const checkUserAllocation = async (userId: string) => {
    try {
      const response = await projectApi.getUserAllocation(userId);
      return response.data.total_allocation;
    } catch (error) {
      console.error('Error checking user allocation:', error);
      return 0;
    }
  };

  // Modify addTeamMember to check allocation first
  const addTeamMember = async (data: any) => {
    await addTeamMemberMutation.mutateAsync(data);
  };

  const removeTeamMember = async (memberId: number) => {
    await removeTeamMemberMutation.mutateAsync(memberId);
  };

  const updateTeamMember = async (memberId: number, data: any) => {
    await updateTeamMemberMutation.mutateAsync({ memberId, data });
  };

  const applyTaskTemplate = async (category: string) => {
    await applyTemplateMutation.mutateAsync(category);
  };

  const updateTaskStatus = async (taskId: number, status: 'À faire' | 'En cours' | 'Terminé' | 'En pause') => {
    await updateTaskStatusMutation.mutateAsync({ taskId, status });
  };

    
  return {
    teamMembers: Array.isArray(teamData) ? teamData : [],
    loading: teamLoading,
    error: teamError,
    addTeamMember,
    removeTeamMember,
    updateTeamMember,
    applyTaskTemplate,
    checkUserAllocation,
    services: servicesData?.results || [],
    updateTaskStatus
  };
} 