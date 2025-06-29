import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamApi, Team, TeamMember } from '../lib/api';
import { toast } from 'sonner';

// Hook pour récupérer la liste des équipes
export const useTeams = (params?: {
  search?: string;
  is_active?: boolean;
  ordering?: string;
}) => {
  return useQuery({
    queryKey: ['teams', params],
    queryFn: () => teamApi.getTeams(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook pour récupérer une équipe spécifique
export const useTeam = (id: number) => {
  return useQuery({
    queryKey: ['team', id],
    queryFn: () => teamApi.getTeam(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook pour créer une équipe
export const useCreateTeam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: teamApi.createTeam,
    onSuccess: (newTeam) => {
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
    mutationFn: ({ id, data }: { id: number; data: Partial<Team> }) =>
      teamApi.updateTeam(id, data),
    onSuccess: (updatedTeam) => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['team', updatedTeam.id] });
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
    mutationFn: teamApi.deleteTeam,
    onSuccess: (_, teamId) => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.removeQueries({ queryKey: ['team', teamId] });
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
    mutationFn: ({ teamId, userId, role }: { teamId: number; userId: number; role: string }) =>
      teamApi.addMember(teamId, userId, role),
    onSuccess: (_, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['team', teamId] });
      toast.success('Membre ajouté à l\'équipe avec succès');
    },
    onError: (error) => {
      console.error('Erreur lors de l\'ajout du membre:', error);
      toast.error('Erreur lors de l\'ajout du membre');
    },
  });
};

// Hook pour supprimer un membre d'une équipe
export const useRemoveTeamMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ teamId, userId }: { teamId: number; userId: number }) =>
      teamApi.removeMember(teamId, userId),
    onSuccess: (_, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['team', teamId] });
      toast.success('Membre supprimé de l\'équipe avec succès');
    },
    onError: (error) => {
      console.error('Erreur lors de la suppression du membre:', error);
      toast.error('Erreur lors de la suppression du membre');
    },
  });
}; 