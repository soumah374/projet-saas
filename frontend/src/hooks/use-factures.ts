import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useToast } from './use-toast';

export interface Facture {
  id: number;
  numero: string;
  contrat: number;
  echeance?: number;
  client: number;
  client_nom: string;
  contrat_numero: string;
  echeance_numero?: string;
  date_emission: string;
  date_echeance: string;
  date_paiement?: string;
  statut: 'brouillon' | 'emise' | 'envoyee' | 'payee' | 'en_retard' | 'annulee' | 'partiellement_payee';
  montant_ht: number;
  montant_tva: number;
  montant_frais_agence: number;
  montant_ttc: number;
  montant_paye: number;
  montant_restant: number;
  taux_tva: number;
  appliquer_tva: boolean;
  taux_frais_agence: number;
  appliquer_frais_agence: boolean;
  mode_paiement: 'virement' | 'cheque' | 'especes' | 'carte' | 'mobile_money';
  iban?: string;
  bic?: string;
  compte_bancaire?: string;
  notes?: string;
  conditions_paiement?: string;
  fichier_pdf?: string;
  jours_restants: number;
  est_en_retard: boolean;
  pourcentage_paye: number;
  lignes: LigneFacture[];
  paiements: PaiementFacture[];
  created_at: string;
  updated_at: string;
}

export interface LigneFacture {
  id: number;
  facture: number;
  type_ligne: 'prestation' | 'frais' | 'acompte' | 'solde';
  description: string;
  quantite: number;
  prix_unitaire_ht: number;
  montant_ht: number;
  created_at: string;
}

export interface PaiementFacture {
  id: number;
  facture: number;
  montant: number;
  date_paiement: string;
  mode_paiement: 'virement' | 'cheque' | 'especes' | 'carte' | 'mobile_money';
  reference_paiement?: string;
  notes?: string;
  created_at: string;
}

export interface ConfigurationFacturation {
  id: number;
  facturation_automatique: boolean;
  delai_avant_echeance: number;
  relance_automatique: boolean;
  prefixe_facture: string;
  format_numero: string;
  conditions_paiement_defaut: string;
  iban_defaut?: string;
  bic_defaut?: string;
  compte_bancaire_defaut?: string;
  created_at: string;
  updated_at: string;
}

export interface StatistiquesFacturation {
  total_factures: number;
  factures_emises: number;
  factures_payees: number;
  factures_en_retard: number;
  montant_total_facture: number;
  montant_total_paye: number;
  montant_en_retard: number;
  factures_mois: number;
  montant_mois: number;
}

export interface EcheanceFacturation {
  id: number;
  contrat: number;
  type_echeance: string;
  numero_echeance: number;
  montant_ht: number;
  montant_tva: number;
  montant_ttc: number;
  pourcentage: number;
  date_echeance: string;
  date_paiement?: string;
  statut: string;
  commentaire?: string;
  alerte_envoyee: boolean;
  factures_count: number;
  derniere_facture?: {
    id: number;
    numero: string;
    statut: string;
    date_emission: string;
    montant_ttc: number;
    montant_paye: number;
  };
  created_at: string;
  updated_at: string;
}

export interface ContratFacturation {
  id: number;
  numero: string;
  client: number;
  date_debut: string;
  date_fin: string;
  statut: string;
  montant_ht: number;
  montant_tva: number;
  montant_ttc: number;
  echeances: EcheanceFacturation[];
  factures_count: number;
  montant_total_facture: number;
  montant_total_paye: number;
}

export const useFactures = () => {
  const [factures, setFactures] = useState<Facture[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Récupérer toutes les factures
  const fetchFactures = useCallback(async (params?: {
    statut?: string;
    contrat?: number;
    client?: number;
    mode_paiement?: string;
    search?: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/billings/factures/', { params });
      // S'assurer que les données sont un tableau
      const data = Array.isArray(response.data) ? response.data : [];
      setFactures(data);
    } catch (err) {
      setError('Erreur lors du chargement des factures');
      console.error('Erreur fetchFactures:', err);
      setFactures([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Récupérer une facture par ID
  const fetchFacture = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/billings/factures/${id}/`);
      return response.data;
    } catch (err) {
      setError('Erreur lors du chargement de la facture');
      console.error('Erreur fetchFacture:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Créer une facture
  const createFacture = useCallback(async (data: Partial<Facture>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/billings/factures/', data);
      toast({
        title: 'Succès',
        description: 'Facture créée avec succès',
      });
      await fetchFactures();
      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Erreur lors de la création de la facture';
      setError(message);
      toast({
        title: 'Erreur',
        description: message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchFactures, toast]);

  // Mettre à jour une facture
  const updateFacture = useCallback(async (id: number, data: Partial<Facture>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.put(`/billings/factures/${id}/`, data);
      toast({
        title: 'Succès',
        description: 'Facture mise à jour avec succès',
      });
      await fetchFactures();
      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Erreur lors de la mise à jour de la facture';
      setError(message);
      toast({
        title: 'Erreur',
        description: message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchFactures, toast]);

  // Supprimer une facture
  const deleteFacture = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await api.delete(`/billings/factures/${id}/`);
      toast({
        title: 'Succès',
        description: 'Facture supprimée avec succès',
      });
      await fetchFactures();
    } catch (err: any) {
      const message = err.response?.data?.message || 'Erreur lors de la suppression de la facture';
      setError(message);
      toast({
        title: 'Erreur',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [fetchFactures, toast]);

  // Enregistrer un paiement
  const enregistrerPaiement = useCallback(async (factureId: number, data: {
    montant: number;
    date_paiement: string;
    mode_paiement: string;
    reference_paiement?: string;
    notes?: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post(`/billings/factures/${factureId}/enregistrer_paiement/`, data);
      toast({
        title: 'Succès',
        description: 'Paiement enregistré avec succès',
      });
      await fetchFactures();
      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Erreur lors de l\'enregistrement du paiement';
      setError(message);
      toast({
        title: 'Erreur',
        description: message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchFactures, toast]);

  // Générer le PDF d'une facture
  const genererPDF = useCallback(async (factureId: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post(`/billings/factures/${factureId}/generer_pdf/`);
      toast({
        title: 'Succès',
        description: 'PDF généré avec succès',
      });
      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Erreur lors de la génération du PDF';
      setError(message);
      toast({
        title: 'Erreur',
        description: message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Récupérer les statistiques
  const fetchStatistiques = useCallback(async (): Promise<StatistiquesFacturation | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/billings/factures/statistiques/');
      return response.data;
    } catch (err) {
      setError('Erreur lors du chargement des statistiques');
      console.error('Erreur fetchStatistiques:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Récupérer les factures en retard
  const fetchFacturesEnRetard = useCallback(async (): Promise<Facture[]> => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/billings/factures/factures_en_retard/');
      return response.data;
    } catch (err) {
      setError('Erreur lors du chargement des factures en retard');
      console.error('Erreur fetchFacturesEnRetard:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Récupérer les factures à venir
  const fetchFacturesAVenir = useCallback(async (): Promise<Facture[]> => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/billings/factures/factures_a_venir/');
      return response.data;
    } catch (err) {
      setError('Erreur lors du chargement des factures à venir');
      console.error('Erreur fetchFacturesAVenir:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    factures,
    loading,
    error,
    fetchFactures,
    fetchFacture,
    createFacture,
    updateFacture,
    deleteFacture,
    enregistrerPaiement,
    genererPDF,
    fetchStatistiques,
    fetchFacturesEnRetard,
    fetchFacturesAVenir,
  };
};

export const usePaiements = () => {
  const [paiements, setPaiements] = useState<PaiementFacture[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Récupérer tous les paiements
  const fetchPaiements = useCallback(async (params?: {
    facture?: number;
    mode_paiement?: string;
    date_paiement?: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/billings/paiements/', { params });
      setPaiements(response.data);
    } catch (err) {
      setError('Erreur lors du chargement des paiements');
      console.error('Erreur fetchPaiements:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Créer un paiement
  const createPaiement = useCallback(async (data: Partial<PaiementFacture>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/billings/paiements/', data);
      toast({
        title: 'Succès',
        description: 'Paiement créé avec succès',
      });
      await fetchPaiements();
      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Erreur lors de la création du paiement';
      setError(message);
      toast({
        title: 'Erreur',
        description: message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchPaiements, toast]);

  return {
    paiements,
    loading,
    error,
    fetchPaiements,
    createPaiement,
  };
};

export const useConfigurationFacturation = () => {
  const [configuration, setConfiguration] = useState<ConfigurationFacturation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Récupérer la configuration
  const fetchConfiguration = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/billings/configuration/');
      setConfiguration(response.data);
    } catch (err) {
      setError('Erreur lors du chargement de la configuration');
      console.error('Erreur fetchConfiguration:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Mettre à jour la configuration
  const updateConfiguration = useCallback(async (data: Partial<ConfigurationFacturation>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.put(`/billings/configuration/${configuration?.id}/`, data);
      setConfiguration(response.data);
      toast({
        title: 'Succès',
        description: 'Configuration mise à jour avec succès',
      });
      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Erreur lors de la mise à jour de la configuration';
      setError(message);
      toast({
        title: 'Erreur',
        description: message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [configuration?.id, toast]);

  return {
    configuration,
    loading,
    error,
    fetchConfiguration,
    updateConfiguration,
  };
};

export const useEcheancesFacturation = () => {
  const [echeances, setEcheances] = useState<EcheanceFacturation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Récupérer les échéances
  const fetchEcheances = useCallback(async (params?: {
    contrat?: number;
    type_echeance?: string;
    statut?: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching échéances with params:', params);
      const response = await api.get('/contrats/echeances/', { params });
      console.log('Échéances response:', response.data);
      // S'assurer que les données sont un tableau
      const data = Array.isArray(response.data) ? response.data : [];
      console.log('Processed data:', data);
      setEcheances(data);
    } catch (err: any) {
      console.error('Erreur fetchEcheances:', err);
      console.error('Error response:', err.response);
      setError(`Erreur lors du chargement des échéances: ${err.response?.data?.detail || err.message}`);
      setEcheances([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Générer une facture pour une échéance
  const genererFacture = useCallback(async (echeanceId: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post(`/contrats/echeances/${echeanceId}/generer_facture/`);
      toast({
        title: 'Succès',
        description: 'Facture générée avec succès',
      });
      await fetchEcheances();
      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Erreur lors de la génération de la facture';
      setError(message);
      toast({
        title: 'Erreur',
        description: message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchEcheances, toast]);

  return {
    echeances,
    loading,
    error,
    fetchEcheances,
    genererFacture,
  };
};

export const useContratsFacturation = () => {
  const [contrats, setContrats] = useState<ContratFacturation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Récupérer les contrats avec facturation
  const fetchContrats = useCallback(async (params?: {
    statut?: string;
    client?: number;
    search?: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/contrats/', { params });
      // S'assurer que les données sont un tableau
      const data = Array.isArray(response.data) ? response.data : [];
      setContrats(data);
    } catch (err) {
      setError('Erreur lors du chargement des contrats');
      console.error('Erreur fetchContrats:', err);
      setContrats([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Générer toutes les factures pour un contrat
  const genererFacturesContrat = useCallback(async (contratId: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post(`/billings/contrats/${contratId}/generer_factures_echeances/`);
      toast({
        title: 'Succès',
        description: response.data.message,
      });
      await fetchContrats();
      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Erreur lors de la génération des factures';
      setError(message);
      toast({
        title: 'Erreur',
        description: message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchContrats, toast]);

  // Récupérer le résumé de facturation d'un contrat
  const fetchResumeFacturation = useCallback(async (contratId: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/contrats/${contratId}/resume_facturation/`);
      return response.data;
    } catch (err) {
      setError('Erreur lors du chargement du résumé de facturation');
      console.error('Erreur fetchResumeFacturation:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    contrats,
    loading,
    error,
    fetchContrats,
    genererFacturesContrat,
    fetchResumeFacturation,
  };
}; 