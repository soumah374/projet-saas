import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { devisAPI, lignesDevisAPI, intervenantsDevisAPI } from '@/lib/api';
import { toast } from 'sonner';

// Types
export interface Devis {
  id: number;
  numero: string;
  client: {
    id: number;
    nom_complet: string;
    email: string;
    telephone: string;
  };
  date_creation: string;
  date_validite: string;
  statut: 'brouillon' | 'envoye' | 'accepte' | 'refuse' | 'expire';
  statut_display: string;
  montant_ht: number;
  montant_tva: number;
  montant_ttc: number;
  notes: string;
  conditions: string;
  lignes: LigneDevis[];
  created_at: string;
  updated_at: string;
}

export interface LigneDevis {
  id: number;
  service: {
    id: number;
    intitule: string;
    description: string;
  };
  activity: {
    id: number;
    intitule: string;
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
  intervenants: LigneDevisIntervenant[];
  created_at: string;
  updated_at: string;
}

export interface LigneDevisIntervenant {
  id: number;
  profile_intervenant: {
    id: number;
    intitule: string;
    description: string;
  };
  temps_intervenant: number;
  taux_horaire: number;
  montant_intervenant: number;
  created_at: string;
  updated_at: string;
}

export interface Activite {
  id: number;
  intitule: string;
  description: string;
}

export interface IntervenantActivite {
  id: number;
  intitule: string;
  description: string;
  taux_horaire: number;
  temps_standard: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Hooks pour les devis
export const useDevis = (params?: {
  search?: string;
  statut?: string;
  client?: number;
  date_creation?: string;
  date_validite?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}) => {
  return useQuery({
    queryKey: ['devis', params],
    queryFn: async () => {
      const response = await devisAPI.getDevis(params);
      return response.data;
    },
  });
};

export const useDevisById = (id: number) => {
  return useQuery({
    queryKey: ['devis', id],
    queryFn: async () => {
      const response = await devisAPI.getDevisById(id);
      return response.data;
    },
    enabled: !!id,
  });
};

export const useCreateDevis = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: {
      client_id: number;
      date_validite: string;
      notes?: string;
      conditions?: string;
    }) => devisAPI.createDevis(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devis'] });
      toast.success('Devis créé avec succès');
    },
    onError: (error) => {
      console.error('Erreur lors de la création du devis:', error);
      toast.error('Erreur lors de la création du devis');
    },
  });
};

export const useUpdateDevis = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      devisAPI.updateDevis(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['devis'] });
      queryClient.invalidateQueries({ queryKey: ['devis', id] });
      toast.success('Devis modifié avec succès');
    },
    onError: (error) => {
      console.error('Erreur lors de la mise à jour du devis:', error);
      toast.error('Erreur lors de la mise à jour du devis');
    },
  });
};

export const useDeleteDevis = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => devisAPI.deleteDevis(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devis'] });
      toast.success('Devis supprimé avec succès');
    },
    onError: (error) => {
      console.error('Erreur lors de la suppression du devis:', error);
      toast.error('Erreur lors de la suppression du devis');
    },
  });
};

export const useEnvoyerDevis = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => devisAPI.envoyerDevis(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['devis'] });
      queryClient.invalidateQueries({ queryKey: ['devis', id] });
      toast.success('Devis envoyé avec succès');
    },
    onError: (error) => {
      console.error('Erreur lors de l\'envoi du devis:', error);
      toast.error('Erreur lors de l\'envoi du devis');
    },
  });
};

export const useAccepterDevis = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => devisAPI.accepterDevis(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['devis'] });
      queryClient.invalidateQueries({ queryKey: ['devis', id] });
      toast.success('Devis accepté avec succès');
    },
    onError: (error) => {
      console.error('Erreur lors de l\'acceptation du devis:', error);
      toast.error('Erreur lors de l\'acceptation du devis');
    },
  });
};

export const useRefuserDevis = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => devisAPI.refuserDevis(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['devis'] });
      queryClient.invalidateQueries({ queryKey: ['devis', id] });
      toast.success('Devis refusé avec succès');
    },
    onError: (error) => {
      console.error('Erreur lors du refus du devis:', error);
      toast.error('Erreur lors du refus du devis');
    },
  });
};

// Hooks pour les données de référence
export const useActivitesParService = (service_id: number) => {
  return useQuery({
    queryKey: ['activites', service_id],
    queryFn: async () => {
      const response = await lignesDevisAPI.getActivitesParService(service_id);
      return response.data.activites as Activite[];
    },
    enabled: !!service_id,
  });
};

export const useIntervenantsParActivite = (activity_id: number) => {
  return useQuery({
    queryKey: ['intervenants', activity_id],
    queryFn: async () => {
      const response = await lignesDevisAPI.getIntervenantsParActivite(activity_id);
      return response.data.intervenants as IntervenantActivite[];
    },
    enabled: !!activity_id,
  });
};

// Hooks pour les lignes de devis
export const useCreateLigneDevis = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: {
      devis: number;
      service_id: number;
      activity_id: number;
      description: string;
      quantite: number;
      unite_id: number;
    }) => lignesDevisAPI.createLigne(data),
    onSuccess: (_, data) => {
      queryClient.invalidateQueries({ queryKey: ['devis', data.devis] });
      toast.success('Ligne ajoutée avec succès');
    },
    onError: (error) => {
      console.error('Erreur lors de la création de la ligne:', error);
      toast.error('Erreur lors de la création de la ligne');
    },
  });
};

export const useUpdateLigneDevis = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      lignesDevisAPI.updateLigne(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['devis'] });
      toast.success('Ligne modifiée avec succès');
    },
    onError: (error) => {
      console.error('Erreur lors de la mise à jour de la ligne:', error);
      toast.error('Erreur lors de la mise à jour de la ligne');
    },
  });
};

export const useDeleteLigneDevis = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => lignesDevisAPI.deleteLigne(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devis'] });
      toast.success('Ligne supprimée avec succès');
    },
    onError: (error) => {
      console.error('Erreur lors de la suppression de la ligne:', error);
      toast.error('Erreur lors de la suppression de la ligne');
    },
  });
};

// Hooks pour les intervenants de ligne de devis
export const useCreateIntervenantLigne = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: {
      ligne_devis: number;
      profile_intervenant_id: number;
      temps_intervenant: number;
      taux_horaire: number;
    }) => intervenantsDevisAPI.createIntervenant(data),
    onSuccess: (_, data) => {
      queryClient.invalidateQueries({ queryKey: ['devis'] });
      toast.success('Intervenant ajouté avec succès');
    },
    onError: (error) => {
      console.error('Erreur lors de l\'ajout de l\'intervenant:', error);
      toast.error('Erreur lors de l\'ajout de l\'intervenant');
    },
  });
};

export const useUpdateIntervenantLigne = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      intervenantsDevisAPI.updateIntervenant(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devis'] });
      toast.success('Intervenant modifié avec succès');
    },
    onError: (error) => {
      console.error('Erreur lors de la modification de l\'intervenant:', error);
      toast.error('Erreur lors de la modification de l\'intervenant');
    },
  });
};

export const useDeleteIntervenantLigne = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => intervenantsDevisAPI.deleteIntervenant(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devis'] });
      toast.success('Intervenant supprimé avec succès');
    },
    onError: (error) => {
      console.error('Erreur lors de la suppression de l\'intervenant:', error);
      toast.error('Erreur lors de la suppression de l\'intervenant');
    },
  });
}; 