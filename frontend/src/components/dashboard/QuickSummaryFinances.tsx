import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, AlertTriangle } from 'lucide-react';
import FactureImpayeModal from '@/components/billings/FactureImpayeModal';

interface QuickSummaryProps {
  data?: {
    total_recouvrable_amount?: number;
    total_paid_amount?: number;
    total_impayees_amount?: number;
    total_factures_amount?: number;
    total_en_retard_amount?: number;
    montant_impaye?: number;
    taux_recouvrement?: {
      periode: number;
      cumule: number;
    };
    selected: string[];
    userSelected: string[];
    facture_non_emises: number;
  };
  period: string;
  period_days: string,
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

export const QuickSummaryFinances: React.FC<QuickSummaryProps> = ({ data, period_days }) => {
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

  const isSelected = (key: string) => !data?.selected || data?.selected.includes(key) || data?.userSelected.includes(key);

  const [showFactureImpayeModal, setShowFactureImpayeModal] = useState(false);

  const financeItems: SummaryItem[] = [
    ...(isSelected('financial.montant_impaye') ? [{
      title: 'Total des Factures impayées',
      value: (
        <>
          <button
            onClick={() => setShowFactureImpayeModal(true)}
            className="text-left hover:underline focus:outline-none focus:underline"
            type="button"
          >
            {formatCurrency(data.montant_impaye || 0)}
          </button>
          <FactureImpayeModal open={showFactureImpayeModal} onClose={() => setShowFactureImpayeModal(false)} period_days={period_days.toString()} />
        </>
      ),
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      description: 'Total des Factures impayées'
    }] : []),
    ...(isSelected('financial.total_factures_amount') ? [{
      title: 'Total des Factures',
      value: formatCurrency(data.total_factures_amount || 0),
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: 'Total des Factures'
    }] : []),
    ...(isSelected('financial.total_en_retard_amount') ? [{
      title: 'Total des Factures en Retard',
      value: formatCurrency(data.total_en_retard_amount || 0),
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      description: 'Total des Factures en Retard'
    }] : []),
    ...(isSelected('financial.total_paid_amount') ? [{
      title: 'Total des Factures Payées',
      value: formatCurrency(data.total_paid_amount || 0),
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: 'Total des Factures Payées'
    }] : []),
    ...(isSelected('financial.facture_non_emises') ? [{
      title: 'Total des Factures Non Emises',
      value: formatCurrency(data.facture_non_emises || 0),
      icon: DollarSign,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      description: 'Total des Factures non Emises'
    }] : []),
    ...(isSelected('financial.taux_recouvrement') ? [{
      title: 'Taux de Recouvrement',
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
      description: 'Taux de Recouvrement'
    }] : [])
  ];

  const isSelectedFinances = isSelected('financial.quick_summary_finances') || isSelected('financial.total_factures_amount') || isSelected('financial.total_en_retard_amount') || isSelected('financial.total_paid_amount') || isSelected('financial.taux_recouvrement');

  return (
    <div>
      {isSelectedFinances && (
        <div className="flex items-center gap-2 mb-3">
          <DollarSign className="h-4 w-4 text-green-600" />
          <h3 className="text-sm font-semibold text-gray-700">Finances</h3>
        </div>
      )}
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