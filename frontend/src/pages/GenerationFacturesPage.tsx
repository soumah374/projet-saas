import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  FileText,
  RefreshCw,
  Settings,
  Calendar,
  DollarSign
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import { useEcheancesFacturation, useContratsFacturation } from '@/hooks/use-factures';
import { ConfigurationFacturationModal } from '@/components/billings/ConfigurationFacturationModal';

const formatMontant = (montant: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'GNF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(montant);
};

export const GenerationFacturesPage: React.FC = () => {
  const { echeances, loading, error, fetchEcheances, genererFacture } = useEcheancesFacturation();
  const { contrats, fetchContrats, genererFacturesContrat } = useContratsFacturation();

  const [showConfigModal, setShowConfigModal] = useState(false);
  const [generationEnCours, setGenerationEnCours] = useState(false);
  const [resultats, setResultats] = useState<{
    echeancesEligibles: number;
    facturesGenerees: number;
    contratsTraites: number;
  } | null>(null);

  useEffect(() => {
    fetchEcheances();
    fetchContrats();
  }, []);

  const echeancesEligibles = (echeances || []).filter(echeance => 
    echeance.statut === 'en_attente' && echeance.factures_count === 0
  );

  const contratsAvecEcheances = (contrats || []).filter(contrat => 
    contrat.echeances && contrat.echeances.some(echeance => 
      echeance.statut === 'en_attente' && echeance.factures_count === 0
    )
  );

  const handleGenerationAutomatique = async () => {
    setGenerationEnCours(true);
    let facturesGenerees = 0;
    let contratsTraites = 0;

    try {
      // Générer les factures pour chaque échéance éligible
      for (const echeance of echeancesEligibles) {
        const resultat = await genererFacture(echeance.id);
        if (resultat) {
          facturesGenerees++;
        }
      }

      // Compter les contrats traités
      contratsTraites = new Set(
        echeancesEligibles.map(e => e.contrat)
      ).size;

      setResultats({
        echeancesEligibles: echeancesEligibles.length,
        facturesGenerees,
        contratsTraites,
      });

      // Recharger les données
      fetchEcheances();
      fetchContrats();
    } catch (error) {
      console.error('Erreur lors de la génération:', error);
    } finally {
      setGenerationEnCours(false);
    }
  };

  const handleGenerationContrat = async (contratId: number) => {
    setGenerationEnCours(true);
    try {
      const resultat = await genererFacturesContrat(contratId);
      if (resultat) {
        // Recharger les données
        fetchEcheances();
        fetchContrats();
      }
    } catch (error) {
      console.error('Erreur lors de la génération pour le contrat:', error);
    } finally {
      setGenerationEnCours(false);
    }
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'paye':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'en_attente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatutIcon = (statut: string) => {
    switch (statut) {
      case 'paye':
        return <CheckCircle className="h-4 w-4" />;
      case 'en_attente':
        return <Clock className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  // Vérification de sécurité pour les données
  if (!Array.isArray(echeances) || !Array.isArray(contrats)) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Génération de Factures</h1>
          <p className="text-muted-foreground">
            Génération automatique de factures basée sur les échéances de contrat
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setShowConfigModal(true)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Configuration
          </Button>
          <Button
            onClick={handleGenerationAutomatique}
            disabled={generationEnCours || echeancesEligibles.length === 0}
            className="bg-green-600 hover:bg-green-700"
          >
            <Play className="h-4 w-4 mr-2" />
            {generationEnCours ? 'Génération...' : 'Génération automatique'}
          </Button>
        </div>
      </div>

      {/* Résultats de la génération */}
      {resultats && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              <span>Génération terminée</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {resultats.echeancesEligibles}
                </div>
                <div className="text-sm text-green-700">Échéances éligibles</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {resultats.facturesGenerees}
                </div>
                <div className="text-sm text-green-700">Factures générées</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {resultats.contratsTraites}
                </div>
                <div className="text-sm text-green-700">Contrats traités</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Échéances éligibles</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {echeancesEligibles.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Prêtes pour génération
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contrats concernés</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {contratsAvecEcheances.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Avec échéances en attente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Montant total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatMontant(
                echeancesEligibles.reduce((total, echeance) => total + echeance.montant_ttc, 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              À facturer
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Échéances éligibles */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            Échéances éligibles ({echeancesEligibles.length})
          </h2>
          {echeancesEligibles.length > 0 && (
            <Badge variant="outline" className="text-green-600">
              Prêtes pour génération
            </Badge>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card>
            <CardContent className="p-6">
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>
        ) : echeancesEligibles.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <p className="text-muted-foreground">
                Aucune échéance éligible pour la génération de factures
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {echeancesEligibles.map((echeance) => (
              <Card key={echeance.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      Échéance #{echeance.numero_echeance}
                    </CardTitle>
                    <Badge className={getStatutColor(echeance.statut)}>
                      <div className="flex items-center space-x-1">
                        {getStatutIcon(echeance.statut)}
                        <span>{echeance.statut === 'en_attente' ? 'En attente' : 'Payée'}</span>
                      </div>
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-600">Contrat:</span>
                      <span className="text-sm">{echeance.contrat}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-600">Type:</span>
                      <span className="text-sm capitalize">{echeance.type_echeance}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-600">Pourcentage:</span>
                      <span className="text-sm">{echeance.pourcentage}%</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-600">Montant TTC:</span>
                      <span className="text-sm font-semibold text-green-600">
                        {formatMontant(echeance.montant_ttc)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-600">Échéance:</span>
                      <span className="text-sm">
                        {format(new Date(echeance.date_echeance), 'dd/MM/yyyy', { locale: fr })}
                      </span>
                    </div>
                  </div>

                  {echeance.commentaire && (
                    <div className="p-2 bg-gray-50 rounded-md">
                      <p className="text-xs text-gray-600">{echeance.commentaire}</p>
                    </div>
                  )}

                  <div className="pt-2 border-t">
                    <Button
                      onClick={() => genererFacture(echeance.id)}
                      disabled={generationEnCours}
                      size="sm"
                      className="w-full"
                    >
                      <FileText className="h-3 w-3 mr-1" />
                      Générer facture
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Contrats avec échéances */}
      {contratsAvecEcheances.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">
            Contrats avec échéances ({contratsAvecEcheances.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contratsAvecEcheances.map((contrat) => {
              const echeancesEnAttente = contrat.echeances.filter(e => 
                e.statut === 'en_attente' && e.factures_count === 0
              );
              const montantTotal = echeancesEnAttente.reduce((total, e) => total + e.montant_ttc, 0);

              return (
                <Card key={contrat.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{contrat.numero}</CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-600">Échéances en attente:</span>
                        <span className="text-sm font-semibold text-orange-600">
                          {echeancesEnAttente.length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-600">Montant total:</span>
                        <span className="text-sm font-semibold text-green-600">
                          {formatMontant(montantTotal)}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t">
                      <Button
                        onClick={() => handleGenerationContrat(contrat.id)}
                        disabled={generationEnCours}
                        size="sm"
                        className="w-full"
                      >
                        <FileText className="h-3 w-3 mr-1" />
                        Générer toutes les factures
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal de configuration */}
      <ConfigurationFacturationModal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
      />
    </div>
  );
}; 