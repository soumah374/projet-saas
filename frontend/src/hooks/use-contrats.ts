import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contratsAPI } from '@/lib/api';
import { toast } from 'sonner';
import { EcheancierContrat } from '@/lib/types';

// Types
export interface Contrat {
  id: number;
  numero: string;
  devis: {
    id: number;
    numero: string;
  }[];
  devis_principal?: {
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
  statut: 'brouillon' | 'actif' | 'cloture' | 'annule' | 'suspendu' | 'signe' | 'envoye';
  statut_display: string;
  taux_tva: number;
  appliquer_tva: boolean;
  taux_frais_agence: number;
  appliquer_frais_agence: boolean;
  montant_ht: number;
  montant_tva: number;
  montant_frais_agence: number;
  montant_ttc: number;
  conditions: string;
  notes: string;
  lignes: LigneContrat[];
  created_at: string;
  updated_at: string;
  echeances: EcheancierContrat[];
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

export interface CreateContratData {
  devis_ids: number[];
  devis_principal_id?: number;
  date_debut: string;
  date_fin: string;
  conditions?: string;
  notes?: string;
  echeances?: any[];
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
    mutationFn: async (data: CreateContratData): Promise<Contrat> => {
      const response = await contratsAPI.createContratFromDevis(data);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('Contrat créé avec succès');
      queryClient.invalidateQueries({ queryKey: ['contrats'] });
      queryClient.invalidateQueries({ queryKey: ['contrats', data.id] });
      queryClient.invalidateQueries({ queryKey: ['devis'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la création du contrat');
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

export const useUpdateContratContent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => contratsAPI.updateContratContent(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['contrats'] });
      queryClient.invalidateQueries({ queryKey: ['contrat', id] });
      toast.success('Contenu du contrat mis à jour avec succès');
    },
    onError: (error) => {
      console.error('Erreur lors de la mise à jour du contenu du contrat:', error);
      toast.error('Erreur lors de la mise à jour du contenu du contrat');
    },
  });
};

export const useEnvoyerContrat = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => contratsAPI.envoyerContrat(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['contrats'] });
      queryClient.invalidateQueries({ queryKey: ['contrat', id] });
      toast.success('Contrat envoyé avec succès');
    },
    onError: (error) => {
      console.error('Erreur lors de l\'envoi du contrat:', error);
      toast.error('Erreur lors de l\'envoi du contrat');
    },
  });
};


export const useSignerContrat = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { id: number; fichier_signe: File }) => contratsAPI.signerContrat(data.id, data.fichier_signe),
    onSuccess: (_, data) => {
      queryClient.invalidateQueries({ queryKey: ['contrats'] });
      queryClient.invalidateQueries({ queryKey: ['contrat', data.id] });
      toast.success('Contrat signé avec succès');
    },
    onError: (error) => {
      console.error('Erreur lors de la signature du contrat:', error);
      toast.error('Erreur lors de la signature du contrat');
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

export const useCloturerContrat = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => contratsAPI.cloturerContrat(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['contrats'] });
      queryClient.invalidateQueries({ queryKey: ['contrat', id] });
      toast.success('Contrat clôturé avec succès');
    },
    onError: (error) => {
      console.error('Erreur lors de la clôture du contrat:', error);
      toast.error('Erreur lors de la clôture du contrat');
    },
  });
};

export const useArchiverContrat = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => contratsAPI.archiverContrat(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['contrats'] });
      queryClient.invalidateQueries({ queryKey: ['contrat', id] });
      toast.success('Contrat archivé avec succès');
    },
    onError: (error) => {
      console.error('Erreur lors de l\'archivage du contrat:', error);
      toast.error('Erreur lors de l\'archivage du contrat');
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
export const useDevisDisponibles = (clientId?: number) => {
  return useQuery({
    queryKey: ['devis-disponibles', clientId],
    queryFn: async () => {
      // Si un clientId est spécifié, utiliser l'endpoint optimisé
      if (clientId) {
        const { devisAPI } = await import('@/lib/api');
        const response = await devisAPI.getDevisByClient(clientId, 'accepte');
        return response.data;
      }
      // Sinon, récupérer tous les devis disponibles
      const response = await contratsAPI.getDevisDisponibles();
      return response.data;
    },
    enabled: true, // Toujours activé, même si clientId n'est pas défini
  });
}; 

export const useAddDevisToContrat = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      contrat_id: number;
      devis_ids: number[];
      devis_principal_id?: number;
      echeances?: Array<{
        numero: number;
        type: 'acompte' | 'tranche' | 'solde';
        pourcentage: number;
        date_echeance: string;
        commentaire: string;
      }>
    }): Promise<Contrat> => {
      const response = await contratsAPI.addDevisToContrat(data.contrat_id, {
        devis_ids: data.devis_ids,
        devis_principal_id: data.devis_principal_id,
        echeances: data.echeances
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('Devis ajoutés au contrat avec succès');
      queryClient.invalidateQueries({ queryKey: ['contrats'] });
      queryClient.invalidateQueries({ queryKey: ['contrat', data.id] });
      queryClient.invalidateQueries({ queryKey: ['devis'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de l\'ajout des devis');
    },
  });
};

export const useContratHistoriqueMontant = (id: number) => {
  return useQuery({
    queryKey: ['contrat-historique-montant', id],
    queryFn: async () => {
      const response = await contratsAPI.getContratHistoriqueMontant(id);
      return response.data;
    },
    enabled: !!id,
  });
};