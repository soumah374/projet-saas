import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectPhasesAPI, projectTeamAPI, projectTasksAPI, servicesAPI, projectApi } from '@/lib/api';
import { ProjectPhase, Service, TeamMember } from '@/lib/types';

interface UseProjectLifecycle {
  phases: ProjectPhase[];
  teamMembers: TeamMember[];
  loading: boolean;
  error: any;
  addTeamMember: (data: any) => Promise<void>;
  removeTeamMember: (memberId: number) => Promise<void>;
  updateTeamMember: (memberId: number, data: any) => Promise<void>;
  applyTaskTemplate: (category: string) => Promise<void>;
  createPhase: (data: Omit<ProjectPhase, 'id'>) => Promise<void>;
  updatePhase: (phaseId: number, data: Partial<ProjectPhase>) => Promise<void>;
  deletePhase: (phaseId: number) => Promise<void>;
  reorderPhase: (phaseId: number, newOrder: number) => Promise<void>;
  checkUserAllocation: (userId: string) => Promise<number>;
  services: Service[];
  updateTaskStatus: (taskId: number, status: 'À faire' | 'En cours' | 'Terminé' | 'En pause') => Promise<void>;
}

export function useProjectLifecycle(projectId: string): UseProjectLifecycle {
  const queryClient = useQueryClient();

  // Fetch phases
  const { 
    data: phasesData,
    isLoading: phasesLoading,
    error: phasesError
  } = useQuery({
    queryKey: ['project-phases', projectId],
    queryFn: async () => {
      const response = await projectPhasesAPI.getProjectPhases(projectId);
      return response.data;
    },
    enabled: !!projectId
  });

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
    queryKey: ['project-team', projectId],
    queryFn: async () => {
      const response = await projectTeamAPI.getProjectTeam(projectId);
      return response.data;
    },
    enabled: !!projectId
  });

  // Phase mutations
  const createPhaseMutation = useMutation({
    mutationFn: (data: Omit<ProjectPhase, 'id'>) => 
      projectPhasesAPI.createProjectPhase(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-phases', projectId] });
    }
  });

  const updatePhaseMutation = useMutation({
    mutationFn: ({ phaseId, data }: { phaseId: number; data: Partial<ProjectPhase> }) => 
      projectPhasesAPI.updateProjectPhase(projectId, phaseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-phases', projectId] });
    }
  });

  const deletePhaseMutation = useMutation({
    mutationFn: (phaseId: number) => 
      projectPhasesAPI.deleteProjectPhase(projectId, phaseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-phases', projectId] });
    }
  });

  const reorderPhaseMutation = useMutation({
    mutationFn: ({ phaseId, newOrder }: { phaseId: number; newOrder: number }) => 
      projectPhasesAPI.reorderProjectPhase(projectId, phaseId, newOrder),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-phases', projectId] });
    }
  });

  // Team member mutations
  const addTeamMemberMutation = useMutation({
    mutationFn: (data: any) => 
      projectTeamAPI.addTeamMember(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-team', projectId] });
    }
  });
  // Team member mutations
  const removeTeamMemberMutation = useMutation({
    mutationFn: (memberId: number) => 
      projectTeamAPI.deleteProjectMember(projectId, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-team', projectId] });
    }
  });

  const updateTeamMemberMutation = useMutation({
    mutationFn: ({ memberId, data }: { memberId: number; data: any }) => 
      projectTeamAPI.updateTeamMember(projectId, memberId, data),
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
      projectTasksAPI.applyTaskTemplate(projectId, category),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
    }
  });

  // Action handlers
  const createPhase = async (data: Omit<ProjectPhase, 'id'>) => {
    await createPhaseMutation.mutateAsync(data);
  };

  const updatePhase = async (phaseId: number, data: Partial<ProjectPhase>) => {
    await updatePhaseMutation.mutateAsync({ phaseId, data });
  };

  const deletePhase = async (phaseId: number) => {
    await deletePhaseMutation.mutateAsync(phaseId);
  };

  const reorderPhase = async (phaseId: number, newOrder: number) => {
    await reorderPhaseMutation.mutateAsync({ phaseId, newOrder });
  };

  // Check user's current allocation
  const checkUserAllocation = async (userId: string) => {
    try {
      const response = await projectTeamAPI.getUserAllocation(userId);
      return response.data.total_allocation;
    } catch (error) {
      console.error('Error checking user allocation:', error);
      return 0;
    }
  };

  // Modify addTeamMember to check allocation first
  const addTeamMember = async (data: any) => {
    const currentAllocation = await checkUserAllocation(data.user);
    const newAllocation = parseInt(data.allocation_percentage);
    if (currentAllocation + newAllocation > 100) {
      throw new Error(`L'allocation totale (${currentAllocation + newAllocation}%) ne peut pas dépasser 100%`);
    }
    
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
    phases: phasesData?.results || [],
    teamMembers: Array.isArray(teamData) ? teamData : [],
    loading: phasesLoading || teamLoading,
    error: phasesError || teamError,
    createPhase,
    updatePhase, 
    deletePhase,
    reorderPhase,
    addTeamMember,
    removeTeamMember,
    updateTeamMember,
    applyTaskTemplate,
    checkUserAllocation,
    services: servicesData?.results || [],
    updateTaskStatus
  };
} 