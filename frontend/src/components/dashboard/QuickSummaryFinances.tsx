import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, AlertTriangle } from 'lucide-react';

interface QuickSummaryProps {
  data?: {
    total_recouvrable_amount?: number;
    total_paid_amount?: number;
    total_impayees_amount?: number;
    total_factures_amount?: number;
    total_en_retard_amount?: number;
    taux_recouvrement?: {
      periode: number;
      cumule: number;
    };
  };
  period: string;
}

type SummaryItem = {
  title: string;
  value: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  description: string;
  change?: number;
};

export const QuickSummaryFinances: React.FC<QuickSummaryProps> = ({ data }) => {
  if (!data) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'GNF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const periodeRate = Number(data?.taux_recouvrement?.periode) || 0;
  const cumuleRate = Number(data?.taux_recouvrement?.cumule) || 0;

  const financeItems: SummaryItem[] = [
    {
      title: 'Montant total des factures',
      value: formatCurrency(data.total_factures_amount || 0),
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: 'Montant total'
    },
    {
      title: 'Factures impayées',
      value: formatCurrency(data.total_impayees_amount || 0),
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      description: 'Montant total'
    },
    {
      title: 'Factures en retard',
      value: formatCurrency(data.total_en_retard_amount || 0),
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      description: 'Montant total'
    },
    {
      title: 'Total payé',
      value: formatCurrency(data.total_paid_amount || 0),
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: 'Montant total'
    },
    {
      title: 'Taux de recouvrement',
      value: (
        <>
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Période :</span>
            <span className="text-green-600">{periodeRate.toFixed(2)}%</span>
          </div>
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Cumulé :</span>
            <span className="text-emerald-600">{cumuleRate.toFixed(2)}%</span>
          </div>
        </>
      ),
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: 'Sur la période'
    }
  ];

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <DollarSign className="h-4 w-4 text-green-600" />
        <h3 className="text-sm font-semibold text-gray-700">Finances</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {financeItems.map((item, index) => {
          const IconComponent = item.icon;
          return (
            <Card key={`finance-${index}`} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`p-2 rounded-full ${item.bgColor}`}>
                        <IconComponent className={`h-4 w-4 ${item.color}`} />
                      </div>
                      <span className="text-sm font-medium text-gray-600">
                        {item.title}
                      </span>
                    </div>
                    <div className={`text-xl font-bold ${item.color}`}>
                      {item.value}
                    </div>
                    <p className="text-xs text-gray-500">
                      {item.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}; 