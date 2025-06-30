import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamsAPI, teamMembersAPI } from '@/lib/api';
import type { Team, TeamMember } from '@/lib/types';
import { toast } from 'sonner';

// ===== ÉQUIPES =====

// Hook pour récupérer la liste des équipes
export const useTeams = (params?: {
  search?: string;
  ordering?: string;
  page?: number;
  is_active?: boolean;
  created_by?: number;
}) => {
  return useQuery({
    queryKey: ['teams', params],
    queryFn: () => teamsAPI.getTeams(params),
  });
};

// Hook pour récupérer une équipe spécifique
export const useTeam = (id: number) => {
  return useQuery({
    queryKey: ['team', id],
    queryFn: () => teamsAPI.getTeam(id),
    enabled: !!id,
  });
};

// Hook pour créer une équipe
export const useCreateTeam = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { name: string; description?: string }) => teamsAPI.createTeam(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Équipe créée avec succès');
    },
    onError: (error) => {
      console.error('Erreur lors de la création de l\'équipe:', error);
      toast.error('Erreur lors de la création de l\'équipe');
    },
  });
};

// Hook pour mettre à jour une équipe
export const useUpdateTeam = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name?: string; description?: string } }) =>
      teamsAPI.updateTeam(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['team', id] });
      toast.success('Équipe mise à jour avec succès');
    },
    onError: (error) => {
      console.error('Erreur lors de la mise à jour de l\'équipe:', error);
      toast.error('Erreur lors de la mise à jour de l\'équipe');
    },
  });
};

// Hook pour supprimer une équipe
export const useDeleteTeam = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => teamsAPI.deleteTeam(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Équipe supprimée avec succès');
    },
    onError: (error) => {
      console.error('Erreur lors de la suppression de l\'équipe:', error);
      toast.error('Erreur lors de la suppression de l\'équipe');
    },
  });
};

// Hook pour ajouter un membre à une équipe
export const useAddTeamMember = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ teamId, data }: { teamId: number; data: { user: number; role: string; is_active?: boolean } }) =>
      teamsAPI.addTeamMember(teamId, data),
    onSuccess: (_, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['team', teamId] });
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      toast.success('Membre ajouté à l\'équipe avec succès');
    },
    onError: (error) => {
      console.error('Erreur lors de l\'ajout du membre:', error);
      toast.error('Erreur lors de l\'ajout du membre');
    },
  });
};

// ===== MEMBRES D'ÉQUIPE =====

// Hook pour récupérer la liste des membres d'une équipe
export const useTeamMembers = (params?: {
  team?: number;
  role?: string;
  is_active?: boolean;
  ordering?: string;
  page?: number;
}) => {
  return useQuery({
    queryKey: ['team-members', params],
    queryFn: () => teamMembersAPI.getTeamMembers(params),
  });
};

// Hook pour récupérer un membre d'une équipe
export const useTeamMember = (id: number) => {
  return useQuery({
    queryKey: ['team-member', id],
    queryFn: () => teamMembersAPI.getTeamMember(id),
    enabled: !!id,
  });
};

// Hook pour créer un membre d'une équipe
export const useCreateTeamMember = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { team: number; user: number; role: string; is_active?: boolean }) =>
      teamMembersAPI.createTeamMember(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
    },
  });
};

// Hook pour mettre à jour un membre d'une équipe
export const useUpdateTeamMember = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      id, 
      data 
    }: { 
      id: number; 
      data: Partial<{ team: number; user: number; role: string; is_active: boolean }> 
    }) => teamMembersAPI.updateTeamMember(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      queryClient.invalidateQueries({ queryKey: ['team-member', id] });
    },
  });
};

// Hook pour supprimer un membre d'une équipe
export const useDeleteTeamMember = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => teamMembersAPI.deleteTeamMember(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
    },
  });
}; 