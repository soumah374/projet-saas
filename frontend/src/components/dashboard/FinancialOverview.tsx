import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, FileText, Users, BarChart3 } from 'lucide-react';

interface FinancialOverviewProps {
  data?: {
    revenue_trend: Array<{
      month: string;
      revenue: number;
    }>;
    billing_status: Record<string, number>;
    devis_conversion: {
      total: number;
      converted: number;
      rate: number;
    };
    cash_flow: {
      income: number;
      expenses: number;
      net: number;
    };
    top_clients: Array<{
      name: string;
      revenue: number;
    }>;
  };
  period: string;
}

export const FinancialOverview: React.FC<FinancialOverviewProps> = ({ data, period }) => {
  if (!data) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'GNF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getBillingStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'payée':
        return 'bg-green-100 text-green-800';
      case 'en attente':
        return 'bg-yellow-100 text-yellow-800';
      case 'en retard':
        return 'bg-red-100 text-red-800';
      case 'annulée':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Tendance des revenus */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Tendance des Revenus (6 derniers mois)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {data.revenue_trend?.map((month) => (
              <div key={month.month} className="text-center">
                <div className="text-lg font-bold text-gray-900">
                  {formatCurrency(month.revenue)}
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(month.month + '-01').toLocaleDateString('fr-FR', { 
                    month: 'short', 
                    year: 'numeric' 
                  })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Statut de facturation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Statut de Facturation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(data.billing_status || {}).map(([status, count]) => (
              <div key={status} className="text-center">
                <div className="text-2xl font-bold text-gray-900">{count}</div>
                <Badge variant="secondary" className={getBillingStatusColor(status)}>
                  {status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Conversion des devis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Conversion des Devis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {data.devis_conversion?.total || 0}
              </div>
              <p className="text-sm text-gray-600">Total Devis</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {data.devis_conversion?.converted || 0}
              </div>
              <p className="text-sm text-gray-600">Devis Convertis</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {data.devis_conversion?.rate || 0}%
              </div>
              <p className="text-sm text-gray-600">Taux de Conversion</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Flux de trésorerie */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Flux de Trésorerie
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {formatCurrency(data.cash_flow?.income || 0)}
              </div>
              <p className="text-sm text-gray-600">Revenus</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">
                {formatCurrency(data.cash_flow?.expenses || 0)}
              </div>
              <p className="text-sm text-gray-600">Dépenses</p>
            </div>
            <div className="text-center">
              <div className={`text-3xl font-bold ${
                (data.cash_flow?.net || 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(data.cash_flow?.net || 0)}
              </div>
              <p className="text-sm text-gray-600">Solde Net</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top clients */}
      {data.top_clients && data.top_clients.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Top Clients par Revenus
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.top_clients.slice(0, 5).map((client, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{client.name}</h4>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">
                      {formatCurrency(client.revenue)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 