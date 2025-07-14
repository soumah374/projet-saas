import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersAPI, authAPI } from '@/lib/api';
import type { UserCreate, UserUpdate } from '@/lib/types';
import { toast } from 'sonner';

// ===== UTILISATEURS =====

export const useUsers = (params?: {
  search?: string;
  ordering?: string;
  page?: number;
  is_active?: boolean;
  profile__role?: string;
  profile__department?: string;
}) => {
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => usersAPI.getUsers(params),
  });
};

export const useUser = (id: number) => {
  return useQuery({
    queryKey: ['user', id],
    queryFn: () => usersAPI.getUser(id),
    enabled: !!id,
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: UserCreate) => usersAPI.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UserUpdate }) =>
      usersAPI.updateUser(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', id] });
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => usersAPI.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

// ===== UTILISATEUR CONNECTÉ =====

export const useMe = () => {
  return useQuery({
    queryKey: ['me'],
    queryFn: () => usersAPI.getUser(1),
  });
};

export const useUpdateMe = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UserUpdate }) => usersAPI.updateUserProfile(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
};

export const useChangePassword = () => {
  return useMutation({
    mutationFn: (data: {
      old_password: string;
      new_password: string;
      new_password_confirm: string;
    }) => authAPI.changePassword(data),
  });
};

// ===== STATISTIQUES =====

export const useUserStatistics = () => {
  return useQuery({
    queryKey: ['user-statistics'],
    queryFn: () => usersAPI.getStatistics(),
  });
};

// Hook pour récupérer l'utilisateur connecté
export const useCurrentUser = () => {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: () => usersAPI.getUser(1),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook pour mettre à jour le profil de l'utilisateur connecté
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UserUpdate }) => usersAPI.updateUserProfile(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['user', id] });
      toast.success('Profil mis à jour avec succès');
    },
    onError: (error) => {
      console.error('Erreur lors de la mise à jour du profil:', error);
      toast.error('Erreur lors de la mise à jour du profil');
    },
  });
}; 