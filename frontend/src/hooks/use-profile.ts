import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface UserProfile {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  profile: {
    phone: string;
    avatar?: string;
    bio: string;
    department: string;
    position: string;
    hire_date?: string;
    is_active: boolean;
  };
  full_name: string;
  date_joined: string;
  is_active: boolean;
}

interface UpdateProfileData {
  first_name?: string;
  last_name?: string;
  email?: string;
  profile?: {
    phone?: string;
    bio?: string;
    department?: string;
    position?: string;
  };
}

interface ChangePasswordData {
  old_password: string;
  new_password: string;
  new_password_confirm: string;
}

// Récupérer le profil de l'utilisateur connecté
export function useCurrentUser() {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const response = await api.get('/auth/users/me/');
      return response.data as UserProfile;
    },
  });
}

// Mettre à jour le profil de l'utilisateur connecté
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateProfileData) => {
      const response = await api.patch('/auth/users/update_me/', data);
      return response.data as UserProfile;
    },
    onSuccess: (data) => {
      // Mettre à jour le cache
      queryClient.setQueryData(['currentUser'], data);
      toast.success('Profil mis à jour avec succès');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Erreur lors de la mise à jour du profil';
      toast.error(errorMessage);
    },
  });
}

// Changer le mot de passe
export function useChangePassword() {
  return useMutation({
    mutationFn: async (data: ChangePasswordData) => {
      const response = await api.post('/auth/users/change_password/', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Mot de passe modifié avec succès');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.old_password?.[0] ||
                          error.response?.data?.new_password?.[0] ||
                          'Erreur lors du changement de mot de passe';
      toast.error(errorMessage);
    },
  });
}

// Upload d'avatar avec endpoint dédié
export function useUploadAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('avatar', file);
      
      const response = await api.patch('/auth/users/upload-avatar/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data as UserProfile;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['currentUser'], data);
      toast.success('Photo de profil mise à jour avec succès');
    },
    onError: (error: any) => {
      console.error('Erreur upload avatar:', error.response?.data);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message ||
                          'Erreur lors du téléchargement de la photo';
      toast.error(errorMessage);
    },
  });
}
