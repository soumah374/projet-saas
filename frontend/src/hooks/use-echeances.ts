import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { type Echeance, type AlertesQuotidiennes } from '@/lib/types';

export function useEcheances(contratId?: number) {
  const [echeances, setEcheances] = useState<Echeance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger les échéances d'un contrat
  const loadEcheances = async (id?: number) => {
    const contratIdToLoad = id || contratId;
    if (!contratIdToLoad) return;

    setIsLoading(true);
    setError(null);

    try {
      // Essayer d'abord l'endpoint direct des échéances
      try {
        const response = await api.get(`/contrats/echeances/?contrat=${contratIdToLoad}`);
        const echeancesData = Array.isArray(response.data) ? response.data : [];
        setEcheances(echeancesData);
      } catch (directError) {
        // Si l'endpoint direct échoue, essayer via le contrat
        console.log('Tentative via l\'endpoint direct échouée, essai via le contrat...');
        const contratResponse = await api.get(`/contrats/${contratIdToLoad}/`);
        const echeancesData = contratResponse.data.echeances || [];
        setEcheances(echeancesData);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Erreur lors du chargement des échéances';
      setError(errorMessage);
      toast.error(errorMessage);
      // En cas d'erreur, s'assurer que echeances reste un tableau vide
      setEcheances([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Générer un échéancier standard
  const genererEcheancier = async (type: string = 'standard') => {
    if (!contratId) {
      toast.error('ID du contrat requis');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await api.post('/contrats/echeances/generer_echeancier_standard/', {
        contrat_id: contratId,
        type: type
      });
      
      toast.success('Échéancier généré avec succès');
      await loadEcheances(); // Recharger les échéances
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Erreur lors de la génération de l\'échéancier';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Marquer une échéance comme payée
  const marquerPaye = async (echeanceId: number, datePaiement?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      await api.post(`/contrats/echeances/${echeanceId}/marquer_paye/`, {
        date_paiement: datePaiement
      });
      
      toast.success('Échéance marquée comme payée');
      await loadEcheances(); // Recharger les échéances
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Erreur lors du marquage';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Envoyer une alerte pour une échéance
  const envoyerAlerte = async (echeanceId: number) => {
    setIsLoading(true);
    setError(null);

    try {
      await api.post(`/contrats/echeances/${echeanceId}/envoyer_alerte/`);
      toast.success('Alerte envoyée avec succès');
      await loadEcheances(); // Recharger les échéances
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Erreur lors de l\'envoi de l\'alerte';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Charger les alertes quotidiennes
  const loadAlertesQuotidiennes = async (): Promise<AlertesQuotidiennes | null> => {
    try {
      const response = await api.get('/contrats/echeances/alertes_quotidiennes/');
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Erreur lors du chargement des alertes';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    }
  };

  // Charger les échéances en alerte
  const loadEcheancesAlertes = async (): Promise<Echeance[]> => {
    try {
      const response = await api.get('/contrats/echeances_alertes/');
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Erreur lors du chargement des alertes';
      setError(errorMessage);
      toast.error(errorMessage);
      return [];
    }
  };

  // Charger les échéances en retard
  const loadEcheancesRetard = async (): Promise<Echeance[]> => {
    try {
      const response = await api.get('/contrats/echeances_retard/');
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Erreur lors du chargement des échéances en retard';
      setError(errorMessage);
      toast.error(errorMessage);
      return [];
    }
  };

  // Charger les échéances au montage du composant
  useEffect(() => {
    if (contratId) {
      loadEcheances();
    }
  }, [contratId]);

  return {
    echeances,
    isLoading,
    error,
    loadEcheances,
    genererEcheancier,
    marquerPaye,
    envoyerAlerte,
    loadAlertesQuotidiennes,
    loadEcheancesAlertes,
    loadEcheancesRetard,
  };
} 