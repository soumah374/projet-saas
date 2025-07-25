import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contratsAPI } from '@/lib/api';
import { toast } from 'sonner';

// Types
export interface Contrat {
  id: number;
  numero: string;
  devis: {
    id: number;
    numero: string;
  };
  client: {
    id: number;
    nom_complet: string;
    email: string;
  };
  date_creation: string;
  date_debut: string;
  date_fin: string;
  statut: 'brouillon' | 'actif' | 'termine' | 'annule' | 'suspendu';
  statut_display: string;
  taux_tva: number;
  appliquer_tva: boolean;
  montant_ht: number;
  montant_tva: number;
  montant_ttc: number;
  conditions: string;
  notes: string;
  lignes: LigneContrat[];
  created_at: string;
  updated_at: string;
}

export interface LigneContrat {
  id: number;
  type_ligne: 'prestation' | 'frais';
  type_frais?: 'standard' | 'forfait' | 'offert';
  service?: {
    id: number;
    name: string;
  };
  activity?: {
    id: number;
    intitule: string;
  };
  frais_category?: {
    id: number;
    name: string;
  };
  ligne_frais?: {
    id: number;
    description: string;
  };
  description: string;
  quantite: number;
  unite: {
    id: number;
    intitule: string;
    code: string;
  };
  prix_unitaire_ht: number;
  montant_ht: number;
  intervenants: LigneContratIntervenant[];
  created_at: string;
  updated_at: string;
}

export interface LigneContratIntervenant {
  id: number;
  profile_intervenant: {
    id: number;
    intitule: string;
  };
  temps_intervenant: number;
  taux_horaire: number;
  montant_intervenant: number;
  created_at: string;
  updated_at: string;
}

// Hooks pour les contrats
export const useContrats = (params?: {
  search?: string;
  statut?: string;
  client?: number;
  date_debut?: string;
  date_fin?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}) => {
  return useQuery({
    queryKey: ['contrats', params],
    queryFn: async () => {
      const response = await contratsAPI.getContrats(params);
      return response.data;
    },
  });
};

export const useContratById = (id: number) => {
  return useQuery({
    queryKey: ['contrat', id],
    queryFn: async () => {
      const response = await contratsAPI.getContratById(id);
      return response.data;
    },
    enabled: !!id,
  });
};

export const useCreateContrat = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: {
      devis_id: number;
      date_debut: string;
      date_fin: string;
      conditions?: string;
      notes?: string;
    }) => contratsAPI.createContrat(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contrats'] });
      toast.success('Contrat créé avec succès');
    },
    onError: (error) => {
      console.error('Erreur lors de la création du contrat:', error);
      toast.error('Erreur lors de la création du contrat');
    },
  });
};

export const useCreateContratFromDevis = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: {
      devis_id: number;
      date_debut: string;
      date_fin: string;
      conditions?: string;
      notes?: string;
    }) => contratsAPI.createContratFromDevis(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contrats'] });
      queryClient.invalidateQueries({ queryKey: ['devis'] });
      toast.success('Contrat créé à partir du devis avec succès');
    },
    onError: (error) => {
      console.error('Erreur lors de la création du contrat:', error);
      toast.error('Erreur lors de la création du contrat');
    },
  });
};

export const useUpdateContrat = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => contratsAPI.updateContrat(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['contrats'] });
      queryClient.invalidateQueries({ queryKey: ['contrat', id] });
      toast.success('Contrat mis à jour avec succès');
    },
    onError: (error) => {
      console.error('Erreur lors de la mise à jour du contrat:', error);
      toast.error('Erreur lors de la mise à jour du contrat');
    },
  });
};

export const useDeleteContrat = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => contratsAPI.deleteContrat(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contrats'] });
      toast.success('Contrat supprimé avec succès');
    },
    onError: (error) => {
      console.error('Erreur lors de la suppression du contrat:', error);
      toast.error('Erreur lors de la suppression du contrat');
    },
  });
};

// Hooks pour les actions sur les contrats
export const useActiverContrat = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => contratsAPI.activerContrat(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['contrats'] });
      queryClient.invalidateQueries({ queryKey: ['contrat', id] });
      toast.success('Contrat activé avec succès');
    },
    onError: (error) => {
      console.error('Erreur lors de l\'activation du contrat:', error);
      toast.error('Erreur lors de l\'activation du contrat');
    },
  });
};

export const useTerminerContrat = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => contratsAPI.terminerContrat(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['contrats'] });
      queryClient.invalidateQueries({ queryKey: ['contrat', id] });
      toast.success('Contrat terminé avec succès');
    },
    onError: (error) => {
      console.error('Erreur lors de la finalisation du contrat:', error);
      toast.error('Erreur lors de la finalisation du contrat');
    },
  });
};

export const useAnnulerContrat = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => contratsAPI.annulerContrat(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['contrats'] });
      queryClient.invalidateQueries({ queryKey: ['contrat', id] });
      toast.success('Contrat annulé avec succès');
    },
    onError: (error) => {
      console.error('Erreur lors de l\'annulation du contrat:', error);
      toast.error('Erreur lors de l\'annulation du contrat');
    },
  });
};

export const useSuspendreContrat = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => contratsAPI.suspendreContrat(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['contrats'] });
      queryClient.invalidateQueries({ queryKey: ['contrat', id] });
      toast.success('Contrat suspendu avec succès');
    },
    onError: (error) => {
      console.error('Erreur lors de la suspension du contrat:', error);
      toast.error('Erreur lors de la suspension du contrat');
    },
  });
};

export const useCalculerMontantsContrat = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => contratsAPI.calculerMontants(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['contrats'] });
      queryClient.invalidateQueries({ queryKey: ['contrat', id] });
      toast.success('Montants recalculés avec succès');
    },
    onError: (error) => {
      console.error('Erreur lors du calcul des montants:', error);
      toast.error('Erreur lors du calcul des montants');
    },
  });
};

// Hook pour récupérer les devis disponibles
export const useDevisDisponibles = () => {
  return useQuery({
    queryKey: ['devis-disponibles'],
    queryFn: async () => {
      const response = await contratsAPI.getDevisDisponibles();
      return response.data;
    },
  });
}; 