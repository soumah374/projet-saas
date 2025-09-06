import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, FileText, Users, BarChart3 } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { AreaChart, Area, Legend } from 'recharts';

interface FinancialOverviewProps {
  data?: {
    revenue_trend?: Array<{
      period: string;
      recettes: number;
      type: 'daily' | 'monthly';
    }>;
    billing_status?: Record<string, number>;
    billing_status_trend?: Array<{
      month: string; // YYYY-MM
      payee?: number;
      en_attente?: number;
      en_retard?: number;
      annulee?: number;
    }>;
    devis_conversion?: {
      total: number;
      converted: number;
      rate: number;
    };
    cash_flow?: {
      recettes: number;
      expenses: number;
      net: number;
    };
    montant_impaye?: number;
    taux_recouvrement?: {
      periode: number;
      cumule: number;
    };
    period_metrics?: {
      period_days: number;
      avg_daily_recettes: number;
      projected_monthly_recettes: number;
      recettes_growth_percent: number;
      previous_period_income: number;
    };
    total_paid_amount?: number;
    total_en_retard_amount?: number;
    total_impayees_amount?: number;
    total_factures_amount?: number;
    widgets_used?: string[];
  };
  period: string;
  selected: string[];
  userSelected: string[];
}

export const FinancialOverview: React.FC<FinancialOverviewProps> = ({ data, period, selected, userSelected }) => {
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
    const rawPeriod = m?.period;
    const amount = m?.recettes ?? 0;
    const labelDate = rawPeriod ? new Date((rawPeriod as string) + (rawPeriod.length === 7 ? '-01' : '')) : new Date();
    return {
      month: labelDate.toLocaleDateString('fr-FR', { month: 'short' }),
      revenue: amount,
    };
  });

  const isSelected = (key: string) => !selected || selected.includes(key) || userSelected.includes(key);
  
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
      {isSelected('financial.revenue_trend') && (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-2" />
            Tendance des Recettes (6 derniers mois)
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 min-w-[900px] md:min-w-[1000px] lg:min-w-0">
            {data.revenue_trend?.map((m: any, idx: number) => {
              const rawPeriod = m?.period;
              const amount = m?.recettes ?? 0;
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
      )}
      {/* Évolution des statuts de facturation */}
      {statusTrendData.length > 0 && isSelected('financial.billing_status_trend') && (
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
      {isSelected('financial.billing_status') && (
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
      )}
      {/* Conversion des devis */}
      {isSelected('financial.devis_conversion') && (
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
      )}
      {/* Flux de trésorerie */}
      {isSelected('financial.cash_flow') && (
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
                {formatCurrency(data.cash_flow?.recettes || 0)}
              </div>
              <p className="text-sm text-gray-600">Recettes</p>
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
      )}
      {/* Carte Taux de recouvrement */}
      {isSelected('financial.taux_recouvrement') && (
        <Card>
          <CardHeader>
            <CardTitle>Taux de recouvrement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-sm text-gray-600">Période</div>
                <div className="text-3xl font-bold text-blue-600 mt-1">
                  {(Number(data.taux_recouvrement?.periode) || 0).toFixed(2)}%
                </div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-sm text-gray-600">Cumulé</div>
                <div className="text-3xl font-bold text-emerald-600 mt-1">
                  {(Number(data.taux_recouvrement?.cumule) || 0).toFixed(2)}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Métriques de période - remplace top_clients qui n'est pas disponible dans le backend */}
      {isSelected('financial.period_metrics') && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Métriques de Période
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 border rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(data.period_metrics?.avg_daily_recettes || 0)}
                </div>
                <p className="text-sm text-gray-600">Recettes Journalières Moyennes</p>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(data.period_metrics?.projected_monthly_recettes || 0)}
                </div>
                <p className="text-sm text-gray-600">Projection Mensuelle</p>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {(data.period_metrics?.recettes_growth_percent || 0).toFixed(1)}%
                </div>
                <p className="text-sm text-gray-600">Croissance des Recettes</p>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {data.period_metrics?.period_days || 0}
                </div>
                <p className="text-sm text-gray-600">Jours de Période</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 