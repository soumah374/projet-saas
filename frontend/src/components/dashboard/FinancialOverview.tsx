import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, FileText, Users, BarChart3 } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { AreaChart, Area, Legend } from 'recharts';

interface FinancialOverviewProps {
  data?: {
    revenue_trend: Array<{
      month: string;
      revenue: number;
    }>;
    billing_status: Record<string, number>;
    billing_status_trend?: Array<{
      month: string; // YYYY-MM
      payee?: number;
      en_attente?: number;
      en_retard?: number;
      annulee?: number;
    }>;
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

  const chartData = (data.revenue_trend || []).map((m: any) => {
    const rawPeriod = m?.month ?? m?.period;
    const amount = m?.recettes ?? m?.revenue ?? 0;
    const labelDate = rawPeriod ? new Date((rawPeriod as string) + (rawPeriod.length === 7 ? '-01' : '')) : new Date();
    return {
      month: labelDate.toLocaleDateString('fr-FR', { month: 'short' }),
      revenue: amount,
    };
  });

  const statusTrendData = (data.billing_status_trend || []).map((m) => ({
    month: new Date(m.month + '-01').toLocaleDateString('fr-FR', { month: 'short' }),
    payee: m.payee || 0,
    en_attente: m.en_attente || 0,
    en_retard: m.en_retard || 0,
    annulee: m.annulee || 0,
  }));

  return (
    <div className="space-y-2">
      {/* Tendance des revenus */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-2" />
            Tendance des Revenus (6 derniers mois)
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 min-w-[900px] md:min-w-[1000px] lg:min-w-0">
            {data.revenue_trend?.map((m: any, idx: number) => {
              const rawPeriod = m?.month ?? m?.period;
              const amount = m?.recettes ?? m?.revenue ?? 0;
              const d = rawPeriod ? new Date((rawPeriod as string) + (rawPeriod.length === 7 ? '-01' : '')) : new Date();
              return (
                <div key={idx} className="text-center">
                  <div className="text-lg font-bold text-gray-900">
                    {formatCurrency(amount)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {d.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-6 h-64 w-full min-w-[600px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(v) => new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 1 }).format(v)} />
                <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Recettes']} labelFormatter={(label) => `Mois: ${label}`} />
                <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Évolution des statuts de facturation */}
      {statusTrendData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Évolution des Statuts de Facturation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={statusTrendData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip labelFormatter={(label) => `Mois: ${label}`} />
                  <Legend />
                  <Area type="monotone" dataKey="payee" name="Payée" stackId="1" stroke="#16a34a" fill="#86efac" />
                  <Area type="monotone" dataKey="en_attente" name="En attente" stackId="1" stroke="#ca8a04" fill="#fde68a" />
                  <Area type="monotone" dataKey="en_retard" name="En retard" stackId="1" stroke="#dc2626" fill="#fca5a5" />
                  <Area type="monotone" dataKey="annulee" name="Annulée" stackId="1" stroke="#6b7280" fill="#d1d5db" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

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

      {/* Carte Taux de recouvrement */}
      {(data as any)?.financial?.taux_recouvrement && (
        <Card>
          <CardHeader>
            <CardTitle>Taux de recouvrement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-sm text-gray-600">Période</div>
                <div className="text-3xl font-bold text-blue-600 mt-1">
                  {(Number((data as any).financial.taux_recouvrement.periode) || 0).toFixed(2)}%
                </div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-sm text-gray-600">Cumulé</div>
                <div className="text-3xl font-bold text-emerald-600 mt-1">
                  {(Number((data as any).financial.taux_recouvrement.cumule) || 0).toFixed(2)}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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