import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  Calendar,
  Bell,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { type LigneEcheancier, type AlertesQuotidiennes } from '@/lib/types';

export function EcheancesAlertes() {
  const [alertes, setAlertes] = useState<AlertesQuotidiennes | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadAlertes = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/contrats/echeances/alertes_quotidiennes/');
      setAlertes(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des alertes:', error);
      toast.error('Erreur lors du chargement des alertes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarquerPaye = async (echeanceId: number) => {
    try {
      await api.post(`/contrats/echeances/${echeanceId}/marquer_paye/`);
      toast.success('Échéance marquée comme payée');
      loadAlertes(); // Recharger les alertes
    } catch (error) {
      console.error('Erreur lors du marquage:', error);
      toast.error('Erreur lors du marquage');
    }
  };

  const handleEnvoyerAlerte = async (echeanceId: number) => {
    try {
      await api.post(`/contrats/echeances/${echeanceId}/envoyer_alerte/`);
      toast.success('Alerte envoyée avec succès');
      loadAlertes(); // Recharger les alertes
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'alerte:', error);
      toast.error('Erreur lors de l\'envoi de l\'alerte');
    }
  };

  const getTypeEcheanceLabel = (type: string) => {
    const labels = {
      'acompte': 'Acompte',
      'tranche': 'Tranche',
      'solde': 'Solde',
      'retention': 'Retenue'
    };
    return labels[type as keyof typeof labels] || type;
  };

  useEffect(() => {
    loadAlertes();
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw size={24} className="animate-spin" />
          <span className="ml-2">Chargement des alertes...</span>
        </CardContent>
      </Card>
    );
  }

  if (!alertes || alertes.total_alertes === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell size={20} />
            Alertes d'échéances
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            Aucune alerte d'échéance pour le moment
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Résumé des alertes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell size={20} />
            Alertes d'échéances
            <Badge variant="secondary" className="ml-2">
              {alertes.total_alertes}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Clock className="text-yellow-500" size={20} />
              <span>{alertes.echeances_3_jours.length} échéances dans 3 jours</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="text-red-500" size={20} />
              <span>{alertes.echeances_retard.length} échéances en retard</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Échéances dans 3 jours */}
      {alertes.echeances_3_jours.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-600">
              <Clock size={20} />
              Échéances dans 3 jours ({alertes.echeances_3_jours.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alertes.echeances_3_jours.map((echeance) => (
                <div key={echeance.id} className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">
                        Contrat {echeance.contrat_details?.numero || echeance.contrat}
                      </span>
                      <Badge variant="secondary" className="bg-yellow-500">
                        Alerte
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-500">
                      {getTypeEcheanceLabel(echeance.type_echeance)}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                    <div>
                      <span className="text-gray-500">Client:</span>
                      <div className="font-semibold">
                        {echeance.contrat_details?.client?.nom_complet || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Montant:</span>
                      <div className="font-semibold">
                        {echeance.montant_ttc.toLocaleString('fr-FR')} GNF
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Date échéance:</span>
                      <div className="font-semibold">
                        {format(new Date(echeance.date_echeance), 'dd/MM/yyyy', { locale: fr })}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Jours restants:</span>
                      <div className="font-semibold text-yellow-600">
                        {echeance.jours_restants} jours
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      size="sm"
                      onClick={() => handleMarquerPaye(echeance.id)}
                    >
                      <CheckCircle size={14} className="mr-1" />
                      Marquer payé
                    </Button>
                    <Button 
                      size="sm"
                      variant="outline"
                      onClick={() => handleEnvoyerAlerte(echeance.id)}
                    >
                      <Bell size={14} className="mr-1" />
                      Envoyer alerte
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Échéances en retard */}
      {alertes.echeances_retard.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle size={20} />
              Échéances en retard ({alertes.echeances_retard.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alertes.echeances_retard.map((echeance) => (
                <div key={echeance.id} className="border border-red-200 bg-red-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">
                        Contrat {echeance.contrat_details?.numero || echeance.contrat}
                      </span>
                      <Badge variant="destructive">
                        En retard
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-500">
                      {getTypeEcheanceLabel(echeance.type_echeance)}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                    <div>
                      <span className="text-gray-500">Client:</span>
                      <div className="font-semibold">
                        {echeance.contrat_details?.client?.nom_complet || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Montant:</span>
                      <div className="font-semibold">
                        {echeance.montant_ttc.toLocaleString('fr-FR')} GNF
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Date échéance:</span>
                      <div className="font-semibold">
                        {format(new Date(echeance.date_echeance), 'dd/MM/yyyy', { locale: fr })}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Jours de retard:</span>
                      <div className="font-semibold text-red-600">
                        {Math.abs(echeance.jours_restants)} jours
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      size="sm"
                      onClick={() => handleMarquerPaye(echeance.id)}
                    >
                      <CheckCircle size={14} className="mr-1" />
                      Marquer payé
                    </Button>
                    <Button 
                      size="sm"
                      variant="outline"
                      onClick={() => handleEnvoyerAlerte(echeance.id)}
                    >
                      <Bell size={14} className="mr-1" />
                      Envoyer alerte
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 