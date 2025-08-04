import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Calendar, 
  DollarSign, 
  Percent,
  ExternalLink 
} from 'lucide-react';
import type { Contrat } from '@/lib/types';
import { formatMontant } from '@/lib/formatters';

interface ContratDetailsCardProps {
  contrat: Contrat;
  onView?: () => void;
  showViewButton?: boolean;
}

export function ContratDetailsCard({ contrat, onView, showViewButton = false }: ContratDetailsCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'actif':
        return 'bg-green-100 text-green-800';
      case 'signe':
        return 'bg-blue-100 text-blue-800';
      case 'envoye':
        return 'bg-yellow-100 text-yellow-800';
      case 'brouillon':
        return 'bg-gray-100 text-gray-800';
      case 'termine':
        return 'bg-purple-100 text-purple-800';
      case 'cloture':
        return 'bg-indigo-100 text-indigo-800';
      case 'annule':
        return 'bg-red-100 text-red-800';
      case 'suspendu':
        return 'bg-orange-100 text-orange-800';
      case 'archive':
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Informations contrat
        </CardTitle>
        {showViewButton && onView && (
          <Button variant="outline" size="sm" onClick={onView}>
            Voir le contrat
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Numéro et statut */}
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">{contrat.numero}</h3>
          <div className="flex gap-2">
            <Badge className={getStatusColor(contrat.statut)}>
              {contrat.statut.charAt(0).toUpperCase() + contrat.statut.slice(1)}
            </Badge>
          </div>
        </div>

        {/* Dates */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>Créé le {formatDate(contrat.date_creation)}</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Date début</div>
              <div className="text-sm font-medium">{formatDate(contrat.date_debut)}</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Date fin</div>
              <div className="text-sm font-medium">{formatDate(contrat.date_fin)}</div>
            </div>
          </div>
        </div>

        {/* Montants */}
        <div className="space-y-3 border-t pt-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            Montants
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Montant HT</div>
              <div className="text-sm font-medium">{formatMontant(contrat.montant_ht)}</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Montant TTC</div>
              <div className="text-sm font-medium">{formatMontant(contrat.montant_ttc)}</div>
            </div>
          </div>
        </div>

        {/* Configuration TVA et Frais */}
        <div className="space-y-3 border-t pt-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Percent className="h-4 w-4 text-muted-foreground" />
            Configuration
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">TVA</div>
              <div className="text-sm">
                {contrat.appliquer_tva ? `${contrat.taux_tva}%` : 'Non appliquée'}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Frais d'agence</div>
              <div className="text-sm">
                {contrat.appliquer_frais_agence ? `${contrat.taux_frais_agence}%` : 'Non appliqués'}
              </div>
            </div>
          </div>
        </div>

        {/* Informations supplémentaires */}
        <div className="space-y-2 border-t pt-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">TVA</span>
            <span>{formatMontant(contrat.montant_tva)}</span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Durée</span>
            <span>
              {Math.ceil((new Date(contrat.date_fin).getTime() - new Date(contrat.date_debut).getTime()) / (1000 * 60 * 60 * 24))} jours
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 