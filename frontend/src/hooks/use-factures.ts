import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useToast } from './use-toast';
import { PaginatedResponse } from './use-devis';

const BASE_URL = '/billings';
async function apiRequest<T>(endpoint: string, options: any = {}): Promise<T> {
  try {
    const response = await api({
      url: `${BASE_URL}${endpoint}`,
      ...options,
    });
    return response.data;
  } catch (error: any) {
    console.error('API Error:', error);
    throw new Error(error.response?.data?.message || error.message || 'API Error');
  }
}

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
  const [pagination, setPagination] = useState({
    count: 0,
    next: null as string | null,
    previous: null as string | null,
    currentPage: 1,
    pageSize: 10,
  });
  const { toast } = useToast();

  // Récupérer toutes les factures
  const fetchFactures = useCallback(async (params?: {
    statut?: string;
    contrat?: number;
    client?: number;
    mode_paiement?: string;
    search?: string;
    page?: number;
    page_size?: number;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiRequest<PaginatedResponse<Facture>>('/factures/', { params });
      // S'assurer que les données sont un tableau
      const data = Array.isArray(response.results) ? response.results : [];
      setFactures(data);
      // Mettre à jour la pagination
      setPagination({
        count: response.count || 0,
        next: response.next,
        previous: response.previous,
        currentPage: params?.page || 1,
        pageSize: params?.page_size || 10,
      });
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

  // util: lien de téléchargement fiable
function downloadBlob(data: BlobPart | BlobPart[] | Blob, filename: string, mimeType?: string) {
  const parts = data instanceof Blob ? [data] : (Array.isArray(data) ? data : [data]);
  const blob = data instanceof Blob ? data : new Blob(parts, { type: mimeType || 'application/octet-stream' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  // petit délai pour Safari/Firefox
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

// util: extraire un filename du header Content-Disposition
function filenameFromContentDisposition(cd?: string | null): string | null {
  if (!cd) return null;
  const m1 = /filename\*=(?:UTF-8'')?([^;]+)/i.exec(cd);
  if (m1) return decodeURIComponent(m1[1].replace(/(^"|"$)/g, ''));
  const m2 = /filename=([^;]+)/i.exec(cd);
  if (m2) return m2[1].replace(/(^"|"$)/g, '');
  return null;
}

// ---- Ta fonction corrigée
const genererPDF = useCallback(async (facture: Facture, saveToModel = false) => {
  setLoading(true);
  setError(null);
  try {
    // Toujours demander un blob : si le serveur renvoie du JSON, on le détecte via le Content-Type.
    const res = await api.post(
      `/billings/factures/${facture.id}/generer_pdf/`,
      { save: saveToModel },
      { responseType: 'blob' } // <- clé pour ne pas corrompre le binaire
    );
    const ct = res.headers?.['content-type'] as string | undefined;
    const cd = res.headers?.['content-disposition'] as string | undefined;

    if (ct && ct.includes('application/json')) {
      // Le serveur a renvoyé du JSON (probablement quand saveToModel = true)
      const text = await (res.data as Blob).text();
      const json = JSON.parse(text);
      // 1) message de succès côté serveur
      if (json.message) {
        toast({ title: 'Succès', description: json.message });
      }
      // 2) cas A: le serveur fournit une URL du PDF
      if (json.pdfUrl) {
        const pdfResp = await api.get(json.pdfUrl, { responseType: 'blob' });
        const fname = filenameFromContentDisposition(pdfResp.headers?.['content-disposition']) || `facture-${facture.numero}.pdf`;
        downloadBlob(pdfResp.data, fname, pdfResp.data.type || 'application/pdf');
        return { success: true };
      }     
      return { success: true };
    } else {
      // Réponse binaire directe (le cas idéal)
      const blob = res.data as Blob;
      const fname = filenameFromContentDisposition(cd) || `facture-${facture.numero}.pdf`;
      downloadBlob(blob, fname, blob.type || 'application/pdf');
      toast({ title: 'Succès', description: 'PDF téléchargé avec succès' });
      return { success: true };
    }
  } catch (err: any) {
    const message =
      err.response?.data?.message ||
      err.message ||
      'Erreur lors de la génération du PDF';
    setError(message);
    toast({ title: 'Erreur', description: message, variant: 'destructive' });
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

  const fetchFacturesImpayees = useCallback(async (periodDays: string = '30')  => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/billings/factures/factures_impayees?period_days=${periodDays}`);
      return response.data;
    } catch (err) {
      setError('Erreur lors du chargement des factures impayées');
      console.error('Erreur fetchFacturesImpayees:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    factures,
    loading,
    error,
    pagination,
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
    fetchFacturesImpayees,
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

  // Générer les factures pour un échéancier spécifique
  const genererFacturesEcheancier = useCallback(async (echeancier_id: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post(`/contrats/echeanciers/${echeancier_id}/generer_factures/`);
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


  return {
    contrats,
    loading,
    error,
    fetchContrats,
    genererFacturesContrat,
    genererFacturesEcheancier,
    fetchResumeFacturation,
  };
};