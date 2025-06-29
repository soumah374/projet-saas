import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi, User } from '../lib/api';
import { toast } from 'sonner';

// Hook pour récupérer la liste des utilisateurs
export const useUsers = (params?: {
  search?: string;
  is_active?: boolean;
  ordering?: string;
}) => {
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => userApi.getUsers(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook pour récupérer un utilisateur spécifique
export const useUser = (id: number) => {
  return useQuery({
    queryKey: ['user', id],
    queryFn: () => userApi.getUser(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook pour récupérer l'utilisateur connecté
export const useCurrentUser = () => {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: () => userApi.getCurrentUser(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook pour mettre à jour le profil de l'utilisateur connecté
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userApi.updateProfile,
    onSuccess: (updatedProfile) => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['user', updatedProfile.id] });
      toast.success('Profil mis à jour avec succès');
    },
    onError: (error) => {
      console.error('Erreur lors de la mise à jour du profil:', error);
      toast.error('Erreur lors de la mise à jour du profil');
    },
  });
}; 