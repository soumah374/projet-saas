import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { type LigneEcheancier, type EcheancierContrat, type AlertesQuotidiennes } from '@/lib/types';

export function useEcheances(contratId?: number) {
  const [echeances, setEcheances] = useState<LigneEcheancier[]>([]);
  const [echeanciers, setEcheanciers] = useState<EcheancierContrat[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger les échéances d'un contrat
  const loadEcheances = async (id?: number) => {
    const contratIdToLoad = id || contratId;
    if (!contratIdToLoad) return;

    setIsLoading(true);
    setError(null);

    try {
      // Utiliser l'endpoint du contrat pour récupérer les échéances
      const contratResponse = await api.get(`/contrats/${contratIdToLoad}/`);
      const echeanciersList: EcheancierContrat[] = contratResponse.data.echeances || [];

      // Stocker la structure hiérarchique complète
      setEcheanciers(echeanciersList);

      // Aplatir la structure hiérarchique: extraire toutes les lignes des échéanciers
      const toutesLesLignes: LigneEcheancier[] = echeanciersList.flatMap(
        (echeancier) => echeancier.lignes || []
      );

      setEcheances(toutesLesLignes);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Erreur lors du chargement des échéances';
      setError(errorMessage);
      toast.error(errorMessage);
      // En cas d'erreur, s'assurer que echeances reste un tableau vide
      setEcheances([]);
      setEcheanciers([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Générer un échéancier standard
  const genererEcheancier = async (type: string = 'standard', echeances: Array<{
    numero: number;
    type: 'acompte' | 'tranche' | 'solde';
    pourcentage: number;
    date_echeance: string;
    commentaire: string;
  }>) => {
    if (!contratId) {
      toast.error('ID du contrat requis');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Transformer les données pour correspondre au modèle backend
      const echeancesTransformed = echeances.map(echeance => ({
        type_echeance: echeance.type,
        numero_echeance: echeance.numero,
        pourcentage: echeance.pourcentage,
        date_echeance: echeance.date_echeance,
        commentaire: echeance.commentaire
      }));

      await api.post(`/contrats/echeances/generer_echeancier_standard/`, {
        contrat: contratId,
        type: type,
        echeances: echeancesTransformed
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
      // Formater la date en YYYY-MM-DD si fournie
      const formattedDate = datePaiement ? new Date(datePaiement).toISOString().split('T')[0] : undefined;
      
      await api.post(`/contrats/echeances/${echeanceId}/marquer_paye/`, {
        date_paiement: formattedDate
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

  // Supprimer une échéance
  // const supprimerEcheance = async (echeanceId: number) => {
  //   setIsLoading(true);
  //   setError(null);

  //   try {
  //     await api.delete(`/contrats/echeances/${echeanceId}/`);
  //     toast.success('Échéance supprimée avec succès');
  //     await loadEcheances(); // Recharger les échéances
  //   } catch (err: any) {
  //     const errorMessage = err.response?.data?.detail || 'Erreur lors de la suppression de l\'échéance';
  //     setError(errorMessage);
  //     toast.error(errorMessage);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  // Charger les alertes quotidiennes
  const loadAlertesQuotidiennes = async (): Promise<AlertesQuotidiennes | null> => {
    try {
      const response = await api.get(`/contrats/echeances/alertes_quotidiennes/`);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Erreur lors du chargement des alertes';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    }
  };

  // Charger les échéances en alerte
  const loadEcheancesAlertes = async (): Promise<LigneEcheancier[]> => {
    try {
      const response = await api.get(`/contrats/echeances_alertes/`);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Erreur lors du chargement des alertes';
      setError(errorMessage);
      toast.error(errorMessage);
      return [];
    }
  };

  // Charger les échéances en retard
  const loadEcheancesRetard = async (): Promise<LigneEcheancier[]> => {
    try {
      const response = await api.get(`/contrats/echeances_retard/`);
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
    echeanciers,
    isLoading,
    error,
    loadEcheances,
    genererEcheancier,
    marquerPaye,
    envoyerAlerte,
    // supprimerEcheance,
    loadAlertesQuotidiennes,
    loadEcheancesAlertes,
    loadEcheancesRetard,
  };
} 