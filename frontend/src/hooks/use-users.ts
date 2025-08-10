import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersAPI, authAPI } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import type { UserCreate, UserUpdate } from '@/lib/types';

export interface UsersParams {
  search?: string;
  profile__department?: string;
  is_active?: boolean;
  ordering?: string;
  page?: number;
}

export const useUsers = (params: UsersParams = {}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const queryKey = ['users', params];
  
  const query = useQuery({
    queryKey,
    queryFn: () => usersAPI.getUsers(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const toggleUserActiveMutation = useMutation({
    mutationFn: (userId: number) => usersAPI.toggleUserActive(userId),
    onSuccess: (data: any) => {
      toast({
        title: "Succès",
        description: data.data?.message || "Statut de l'utilisateur modifié avec succès",
      });
      // Invalider le cache pour recharger la liste
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.response?.data?.error || "Erreur lors de la modification du statut",
        variant: "destructive"
      });
    },
  });

  const toggleUserActive = (userId: number) => {
    toggleUserActiveMutation.mutate(userId);
  };

  return {
    ...query,
    toggleUserActive,
    isToggling: toggleUserActiveMutation.isPending,
  };
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
    queryFn: () => usersAPI.getCurrentUser(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook pour mettre à jour le profil de l'utilisateur connecté
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UserUpdate }) => usersAPI.updateUserProfile(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['user', id] });
      toast({
        title: "Succès",
        description: "Profil mis à jour avec succès"
      });
    },
    onError: (error) => {
      console.error('Erreur lors de la mise à jour du profil:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la mise à jour du profil",
        variant: "destructive"
      });
    },
  });
}; 