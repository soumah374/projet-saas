import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';

// Types de modification disponibles
export const TYPE_MODIFICATION_CHOICES = [
  { value: 'modifier', label: 'Modifier' },
  { value: 'completer', label: 'Compléter' },
  { value: 'preciser', label: 'Préciser' },
  { value: 'prolonger', label: 'Prolonger' },
  { value: 'reduire', label: 'Réduire' },
  { value: 'annuler', label: 'Annuler' },
] as const;

export type TypeModification = typeof TYPE_MODIFICATION_CHOICES[number]['value'];

// Fonction utilitaire pour obtenir le label d'un type de modification
export const getTypeModificationLabel = (value: TypeModification): string => {
  const choice = TYPE_MODIFICATION_CHOICES.find(choice => choice.value === value);
  return choice?.label || value;
};

export interface Avenant {
  id: number;
  numero: string;
  contrat: {
    id: number;
    numero: string;
    client: {
      id: number;
      nom_complet: string;
      email: string;
    };
  };
  date_creation: string;
  date_signature?: string;
  statut: 'brouillon' | 'envoye' | 'signe' | 'annule';
  statut_display: string;
  intitule_avenant: string;
  objet_avenant: string;
  type_modification: 'modifier' | 'completer' | 'preciser' | 'prolonger' | 'reduire' | 'annuler';
  type_modification_display: string;
  modifications: Array<{
    clause: string;
    ancienne_version: string;
    nouvelle_version: string;
  }>;
  contenu_personnalise: string;
  variables_personnalisees: Record<string, any>;
  fichier_signe?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAvenantData {
  contrat_id: number;
  intitule_avenant: string;
  objet_avenant: string;
  type_modification: 'modifier' | 'completer' | 'preciser' | 'prolonger' | 'reduire' | 'annuler';
  modifications: Array<{
    clause: string;
    ancienne_version: string;
    nouvelle_version: string;
  }>;
  contenu_personnalise?: string;
}

export const useAvenants = () => {
  return useQuery({
    queryKey: ['avenants'],
    queryFn: async (): Promise<Avenant[]> => {
      const response = await api.get('/contrats/avenants/');
      return response.data.results || response.data || [];
    },
  });
};

export const useAvenantsByContrat = (contratId: number) => {
  return useQuery({
    queryKey: ['avenants', 'contrat_id', contratId],
    queryFn: async (): Promise<Avenant[]> => {
      const response = await api.get(`/contrats/avenants/by_contrat/?contrat_id=${contratId}`);
      // Gérer la structure paginée ou directe
      return response.data.results || response.data || [];
    },
    enabled: !!contratId,
  });
};

export const useAvenant = (id: number) => {
  return useQuery({
    queryKey: ['avenants', id],
    queryFn: async (): Promise<Avenant> => {
      const response = await api.get(`/contrats/avenants/${id}/`);
      return response.data;
    },
    enabled: !!id,
  });
};

export const useCreateAvenant = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ data }: { data: CreateAvenantData }): Promise<Avenant> => {
      const response = await api.post(`/contrats/avenants/store/`, data);
      return response.data;
    },
    onSuccess: (data, variables) => {
      toast.success('Avenant créé avec succès');
      queryClient.invalidateQueries({ queryKey: ['avenants'] });
      queryClient.invalidateQueries({ queryKey: ['avenants', 'contrat_id', variables.data.contrat_id] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la création de l\'avenant');
    },
  });
};

export const useUpdateAvenant = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<CreateAvenantData> }): Promise<Avenant> => {
      const response = await api.patch(`/contrats/avenants/${id}/`, data);
      return response.data;
    },
    onSuccess: (data, variables) => {
      toast.success('Avenant mis à jour avec succès');
      queryClient.invalidateQueries({ queryKey: ['avenants'] });
      queryClient.invalidateQueries({ queryKey: ['avenants', data.id] });
      queryClient.invalidateQueries({ queryKey: ['avenants', 'contrat', variables] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la mise à jour de l\'avenant');
    },
  });
};

export const useDeleteAvenant = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id }: { id: number }): Promise<void> => {
      await api.delete(`/contrats/avenants/${id}/`);
    },
    onSuccess: (_, id) => {
      toast.success('Avenant supprimé avec succès');
      queryClient.invalidateQueries({ queryKey: ['avenants'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la suppression de l\'avenant');
    },
  });
};

export const useUpdateAvenantContent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      id, contenu_personnalise }: { id: number; contenu_personnalise: string }): Promise<void> => {
      await api.post(`/contrats/avenants/${id}/update_content/`, { contenu_personnalise });
    },
    onSuccess: (_, { id }) => {
      toast.success('Contenu de l\'avenant mis à jour');
      queryClient.invalidateQueries({ queryKey: ['avenants', id] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la mise à jour du contenu');
    },
  });
};

export const useEnvoyerAvenant = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id }: { id: number }): Promise<void> => {
      await api.post(`/contrats/avenants/${id}/envoyer/`);
    },
    onSuccess: (_, id) => {
      toast.success('Avenant envoyé avec succès');
      queryClient.invalidateQueries({ queryKey: ['avenants'] });
      queryClient.invalidateQueries({ queryKey: ['avenants', id] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de l\'envoi de l\'avenant');
    },
  });
};

export const useSignerAvenant = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, fichier_signe }: { id: number; fichier_signe: File }): Promise<void> => {
      const formData = new FormData();
      formData.append('fichier_signe', fichier_signe);
      await api.post(`/contrats/avenants/${id}/signer/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
    onSuccess: (_, { id }) => {
      toast.success('Avenant signé avec succès');
      queryClient.invalidateQueries({ queryKey: ['avenants'] });
      queryClient.invalidateQueries({ queryKey: ['avenants', id] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la signature de l\'avenant');
    },
  });
};

export const useAnnulerAvenant = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id }: { id: number }): Promise<void> => {
      await api.post(`/contrats/avenants/${id}/annuler/`);
    },
    onSuccess: (_, id) => {
      toast.success('Avenant annulé avec succès');
      queryClient.invalidateQueries({ queryKey: ['avenants'] });
      queryClient.invalidateQueries({ queryKey: ['avenants', id] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de l\'annulation de l\'avenant');
    },
  });
};

export const useDownloadAvenantPDF = () => {
  return useMutation({
    mutationFn: async ({ id }: { id: number }): Promise<Blob> => {
      const response = await api.get(`/contrats/avenants/${id}/download_pdf/`, {
        responseType: 'blob',
      });
      return response.data;
    },
    onSuccess: (blob, id) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `avenant_${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('PDF téléchargé avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors du téléchargement du PDF');
    },
  });
}; 