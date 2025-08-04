import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  FileText, 
  AlertTriangle, 
  CheckCircle,
  Calendar,
  Clock
} from 'lucide-react';
import type { StatistiquesFacturation as StatistiquesFacturationType } from '@/hooks/use-factures';

interface StatistiquesFacturationProps {
  statistiques: StatistiquesFacturationType;
  loading?: boolean;
}

const formatMontant = (montant: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'GNF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(montant);
};

export const StatistiquesFacturation: React.FC<StatistiquesFacturationProps> = ({
  statistiques,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total factures */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Factures</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{statistiques.total_factures}</div>
          <p className="text-xs text-muted-foreground">
            Toutes les factures confondues
          </p>
        </CardContent>
      </Card>

      {/* Factures émises */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Factures Émises</CardTitle>
          <FileText className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {statistiques.factures_emises}
          </div>
          <p className="text-xs text-muted-foreground">
            En attente de paiement
          </p>
        </CardContent>
      </Card>

      {/* Factures payées */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Factures Payées</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {statistiques.factures_payees}
          </div>
          <p className="text-xs text-muted-foreground">
            Paiement complet
          </p>
        </CardContent>
      </Card>

      {/* Factures en retard */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">En Retard</CardTitle>
          <AlertTriangle className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {statistiques.factures_en_retard}
          </div>
          <p className="text-xs text-muted-foreground">
            Échéance dépassée
          </p>
        </CardContent>
      </Card>

      {/* Montant total facturé */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Facturé</CardTitle>
          <DollarSign className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatMontant(statistiques.montant_total_facture)}
          </div>
          <p className="text-xs text-muted-foreground">
            Montant total des factures
          </p>
        </CardContent>
      </Card>

      {/* Montant total payé */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Payé</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatMontant(statistiques.montant_total_paye)}
          </div>
          <p className="text-xs text-muted-foreground">
            Montant total reçu
          </p>
        </CardContent>
      </Card>

      {/* Montant en retard */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">En Retard</CardTitle>
          <TrendingDown className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {formatMontant(statistiques.montant_en_retard)}
          </div>
          <p className="text-xs text-muted-foreground">
            Montant en retard
          </p>
        </CardContent>
      </Card>

      {/* Factures du mois */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Ce Mois</CardTitle>
          <Calendar className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {statistiques.factures_mois}
          </div>
          <p className="text-xs text-muted-foreground">
            {formatMontant(statistiques.montant_mois)} facturé
          </p>
        </CardContent>
      </Card>
    </div>
  );
}; 