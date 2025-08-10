import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Calendar, 
  DollarSign, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Download,
  CreditCard
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Facture } from '@/hooks/use-factures';

interface FactureCardProps {
  facture: Facture;
  onView?: (facture: Facture) => void;
  onEdit?: (facture: Facture) => void;
  onDelete?: (facture: Facture) => void;
  onPaiement?: (facture: Facture) => void;
  onPDF?: (facture: Facture) => void;
}

const getStatutColor = (statut: Facture['statut']) => {
  switch (statut) {
    case 'payee':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'emise':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'envoyee':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'en_retard':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'partiellement_payee':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'annulee':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getStatutIcon = (statut: Facture['statut']) => {
  switch (statut) {
    case 'payee':
      return <CheckCircle className="h-4 w-4" />;
    case 'en_retard':
      return <AlertTriangle className="h-4 w-4" />;
    case 'emise':
    case 'envoyee':
      return <FileText className="h-4 w-4" />;
    case 'partiellement_payee':
      return <Clock className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
};

const getStatutLabel = (statut: Facture['statut']) => {
  switch (statut) {
    case 'payee':
      return 'Payée';
    case 'emise':
      return 'Émise';
    case 'envoyee':
      return 'Envoyée';
    case 'en_retard':
      return 'En retard';
    case 'partiellement_payee':
      return 'Partiellement payée';
    case 'annulee':
      return 'Annulée';
    case 'brouillon':
      return 'Brouillon';
    default:
      return statut;
  }
};

const formatMontant = (montant: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'GNF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(montant);
};

export const FactureCard: React.FC<FactureCardProps> = ({
  facture,
  onView,
  onEdit,
  onDelete,
  onPaiement,
  onPDF,
}) => {
  const isEnRetard = facture.est_en_retard;
  const joursRestants = facture.jours_restants;
  const pourcentagePaye = facture.pourcentage_paye;

  return (
    <Card className={`hover:shadow-lg transition-shadow ${isEnRetard ? 'border-red-200 bg-red-50' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CardTitle className="text-lg font-semibold">
              {facture.numero}
            </CardTitle>
            <Badge className={getStatutColor(facture.statut)}>
              <div className="flex items-center space-x-1">
                {getStatutIcon(facture.statut)}
                <span>{getStatutLabel(facture.statut)}</span>
              </div>
            </Badge>
          </div>
          <div className="flex items-center space-x-1">
            {onView && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onView(facture)}
                className="h-8 w-8 p-0"
              >
                <FileText className="h-4 w-4" />
              </Button>
            )}
            {onPDF && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onPDF(facture)}
                className="h-8 w-8 p-0"
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Informations client et contrat */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Client:</span>
            <span className="text-sm">{facture.client_nom}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Contrat:</span>
            <span className="text-sm">{facture.contrat_numero}</span>
          </div>
          {facture.echeance_numero && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Échéance:</span>
              <span className="text-sm">#{facture.echeance_numero}</span>
            </div>
          )}
        </div>

        {/* Dates */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>Émission: {format(new Date(facture.date_emission), 'dd/MM/yyyy', { locale: fr })}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>Échéance: {format(new Date(facture.date_echeance), 'dd/MM/yyyy', { locale: fr })}</span>
          </div>
          {facture.date_paiement && (
            <div className="flex items-center space-x-2 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span>Payée le: {format(new Date(facture.date_paiement), 'dd/MM/yyyy', { locale: fr })}</span>
            </div>
          )}
        </div>

        {/* Montants */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Montant TTC:</span>
            <span className="text-lg font-bold text-green-600">
              {formatMontant(facture.montant_ttc)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Payé:</span>
            <span className="text-sm">
              {formatMontant(facture.montant_paye)} / {formatMontant(facture.montant_ttc)}
            </span>
          </div>
          {facture.montant_restant > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Restant:</span>
              <span className="text-sm font-medium text-orange-600">
                {formatMontant(facture.montant_restant)}
              </span>
            </div>
          )}
        </div>

        {/* Progression du paiement */}
        {facture.montant_ttc > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Progression:</span>
              <span className="text-sm font-medium">{pourcentagePaye.toFixed(1)}%</span>
            </div>
            <Progress value={pourcentagePaye} className="h-2" />
          </div>
        )}

        {/* Alertes */}
        {isEnRetard && (
          <div className="flex items-center space-x-2 p-2 bg-red-50 border border-red-200 rounded-md">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <span className="text-sm text-red-600 font-medium">
              En retard de {Math.abs(joursRestants)} jours
            </span>
          </div>
        )}

        {joursRestants > 0 && joursRestants <= 7 && !isEnRetard && (
          <div className="flex items-center space-x-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
            <Clock className="h-4 w-4 text-yellow-600" />
            <span className="text-sm text-yellow-600 font-medium">
              Échéance dans {joursRestants} jours
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center space-x-1">
            {onPaiement && facture.montant_restant > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPaiement(facture)}
                className="h-8"
              >
                <CreditCard className="h-3 w-3 mr-1" />
                Paiement
              </Button>
            )}
          </div>
          <div className="flex items-center space-x-1">
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(facture)}
                className="h-8 w-8 p-0"
              >
                <FileText className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(facture)}
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
              >
                <FileText className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 