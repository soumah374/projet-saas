import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsAPI } from '@/lib/api';
import { toast } from 'sonner';

// Types
export interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
}

export interface ClientProfile {
  id: number;
  user: User;
  adresse: string;
  ville: string;
  code_postal: string;
  pays: string;
  telephone: string;
  date_inscription: string;
  is_active: boolean;
}

export interface PaginatedResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ClientProfile[];
}

export interface ClientCreateData {
  first_name: string;
  last_name: string;
  email: string;
  client_profile: {
    telephone: string;
    adresse: string;
    ville: string;
    code_postal: string;
    pays: string;
    is_active: boolean;
  };
}

export interface ClientUpdateData {
  telephone?: string;
  adresse?: string;
  ville?: string;
  code_postal?: string;
  pays?: string;
  is_active?: boolean;
}

export interface ClientUserUpdateData {
  username?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
}

// Hook pour récupérer la liste des clients
export const useClients = (params?: {
  search?: string;
  is_active?: boolean;
  ville?: string;
  pays?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}) => {
  return useQuery({
    queryKey: ['clients', params],
    queryFn: async () => {
      const response = await clientsAPI.getClients(params);
      return response.data;
    },
  });
};

// Hook pour récupérer un client spécifique
export const useClient = (id: number) => {
  return useQuery({
    queryKey: ['client', id],
    queryFn: async () => {
      const response = await clientsAPI.getClient(id);
      return response.data;
    },
    enabled: !!id,
  });
};

// Hook pour créer un client
export const useCreateClient = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: ClientCreateData) => clientsAPI.createClient(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client ajouté avec succès');
    },
    onError: (error) => {
      console.error('Erreur lors de la création du client:', error);
      toast.error('Erreur lors de la création du client');
    },
  });
};

// Hook pour mettre à jour un client
export const useUpdateClient = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ClientUpdateData }) =>
      clientsAPI.updateClient(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['client', id] });
      toast.success('Client modifié avec succès');
    },
    onError: (error) => {
      console.error('Erreur lors de la mise à jour du client:', error);
      toast.error('Erreur lors de la mise à jour du client');
    },
  });
};

// Hook pour mettre à jour les données utilisateur d'un client
export const useUpdateClientUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ClientUserUpdateData }) =>
      clientsAPI.updateClientUser(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['client', id] });
    },
    onError: (error) => {
      console.error('Erreur lors de la mise à jour des données utilisateur:', error);
      toast.error('Erreur lors de la mise à jour des données utilisateur');
    },
  });
};

// Hook pour supprimer un client
export const useDeleteClient = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => clientsAPI.deleteClient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client supprimé avec succès');
    },
    onError: (error) => {
      console.error('Erreur lors de la suppression du client:', error);
      toast.error('Erreur lors de la suppression du client');
    },
  });
};

// Hook pour basculer le statut d'un client
export const useToggleClientStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      clientsAPI.toggleClientStatus(id, isActive),
    onSuccess: (_, { id, isActive }) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['client', id] });
      toast.success(`Client ${isActive ? 'activé' : 'désactivé'} avec succès`);
    },
    onError: (error) => {
      console.error('Erreur lors du changement de statut:', error);
      toast.error('Erreur lors du changement de statut');
    },
  });
}; 