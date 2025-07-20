import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsAPI } from '@/lib/api';
import { toast } from 'sonner';

// Types
export interface ClientProfile {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  type_client: 'personne_physique' | 'personne_morale';
  type_client_display: string;
  statut_commercial: 'prospect' | 'actif' | 'inactif' | 'bloque';
  statut_commercial_display: string;
  raison_sociale: string | null;
  rccm_nif: string | null;
  contact: string | null;
  adresse_complete: string | null;
  adresse: string;
  ville: string;
  code_postal: string;
  pays: string;
  date_inscription: string;
  is_active: boolean;
  nom_complet: string;
}

export interface PaginatedResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ClientProfile[];
}

export interface ClientCreateData {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  type_client: 'personne_physique' | 'personne_morale';
  raison_sociale?: string;
  rccm_nif?: string;
  contact?: string;
  adresse_complete?: string;
  adresse: string;
  ville: string;
  code_postal: string;
  pays: string;
  statut_commercial: 'prospect' | 'actif' | 'inactif' | 'bloque';
  is_active: boolean;
}

export interface ClientUpdateData {
  nom?: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  type_client?: 'personne_physique' | 'personne_morale';
  raison_sociale?: string;
  rccm_nif?: string;
  contact?: string;
  adresse_complete?: string;
  adresse?: string;
  ville?: string;
  code_postal?: string;
  pays?: string;
  statut_commercial?: 'prospect' | 'actif' | 'inactif' | 'bloque';
  is_active?: boolean;
}

// Hook pour récupérer la liste des clients
export const useClients = (params?: {
  search?: string;
  is_active?: boolean;
  ville?: string;
  pays?: string;
  type_client?: string;
  statut_commercial?: string;
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