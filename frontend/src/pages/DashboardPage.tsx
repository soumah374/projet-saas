import React, { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { MetricsOverview } from '@/components/dashboard/MetricsOverview';
import { ProjectMetrics } from '@/components/dashboard/ProjectMetrics';
import { FinancialOverview } from '@/components/dashboard/FinancialOverview';
import { PerformanceMetrics } from '@/components/dashboard/PerformanceMetrics';
import { CalendarOverview } from '@/components/dashboard/CalendarOverview';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { DashboardCharts } from '@/components/dashboard/DashboardCharts';
import { DashboardAlerts } from '@/components/dashboard/DashboardAlerts';
import { QuickSummary } from '@/components/dashboard/QuickSummary';
import { useDashboardMetrics } from '@/hooks/use-dashboard-metrics';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, Calendar, TrendingUp, BarChart3, Users, DollarSign, AlertTriangle, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const DashboardPage: React.FC = () => {
  const [period, setPeriod] = useState('30');
  const { data, loading, error, refetch } = useDashboardMetrics(parseInt(period));
  
  const [activeTab, setActiveTab] = useState('overview');

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
  };

  const handleRefresh = () => {
    refetch();
  };

  const getPeriodLabel = (days: string) => {
    switch (days) {
      case '7': return '7 jours';
      case '30': return '30 jours';
      case '90': return '3 mois';
      case '365': return '1 an';
      default: return `${days} jours`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Erreur de chargement</h2>
          <p className="text-gray-600 mb-4">Impossible de charger les données du tableau de bord</p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  // Calculer le nombre total d'alertes
  const totalAlerts = (
    (data?.calendar?.upcoming_deadlines?.filter(d => d.days_until_deadline <= 3).length || 0) +
    (data?.projects?.overdue_projects?.length || 0)
  );

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* En-tête du tableau de bord */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tableau de Bord SAKOM</h1>
          <p className="text-gray-600 mt-2">
            Vue d'ensemble de vos projets, finances et performance
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 jours</SelectItem>
              <SelectItem value="30">30 jours</SelectItem>
              <SelectItem value="90">3 mois</SelectItem>
              <SelectItem value="365">1 an</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Indicateur d'alertes */}
      {totalAlerts > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <div>
              <h3 className="font-medium text-red-800">
                {totalAlerts} alerte{totalAlerts > 1 ? 's' : ''} nécessite{totalAlerts > 1 ? 'nt' : ''} votre attention
              </h3>
              <p className="text-sm text-red-600">
                Vérifiez les échéances urgentes et les projets en retard
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Onglets de navigation */}
      <div className="flex flex-wrap gap-2 border-b">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
            activeTab === 'overview'
              ? 'bg-primary text-primary-foreground'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <BarChart3 className="h-4 w-4 inline mr-2" />
          Vue d'ensemble
        </button>
        <button
          onClick={() => setActiveTab('projects')}
          className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
            activeTab === 'projects'
              ? 'bg-primary text-primary-foreground'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Target className="h-4 w-4 inline mr-2" />
          Projets
        </button>
        <button
          onClick={() => setActiveTab('financial')}
          className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
            activeTab === 'financial'
              ? 'bg-primary text-primary-foreground'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <DollarSign className="h-4 w-4 inline mr-2" />
          Financier
        </button>
        <button
          onClick={() => setActiveTab('performance')}
          className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
            activeTab === 'performance'
              ? 'bg-primary text-primary-foreground'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Users className="h-4 w-4 inline mr-2" />
          Performance
        </button>
        <button
          onClick={() => setActiveTab('calendar')}
          className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
            activeTab === 'calendar'
              ? 'bg-primary text-primary-foreground'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Calendar className="h-4 w-4 inline mr-2" />
          Calendrier
        </button>
        <button
          onClick={() => setActiveTab('alerts')}
          className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
            activeTab === 'alerts'
              ? 'bg-primary text-primary-foreground'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <AlertTriangle className="h-4 w-4 inline mr-2" />
          Alertes
          {totalAlerts > 0 && (
            <Badge variant="destructive" className="ml-2 text-xs">
              {totalAlerts}
            </Badge>
          )}
        </button>
      </div>

      {/* Contenu des onglets */}
      <div className="mt-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Résumé rapide des informations essentielles */}
            <QuickSummary 
              data={{
                total_projects: data?.projects?.total_projects || 0,
                active_projects: data?.projects?.active_projects || 0,
                total_revenue: data?.financial?.cash_flow?.income || 0,
                urgent_deadlines: data?.calendar?.upcoming_deadlines?.filter(d => d.days_until_deadline <= 3).length || 0,
                overdue_projects: data?.projects?.overdue_projects?.length || 0,
                revenue_change: 5.2, // Exemple de données
                projects_change: 2.1,
              }}
              period={getPeriodLabel(period)}
            />
            
            {/* Statistiques principales avec tendances */}
            <DashboardStats 
              data={{
                total_projects: data?.projects?.total_projects || 0,
                active_projects: data?.projects?.active_projects || 0,
                total_users: data?.calendar?.resource_utilization?.total_users || 0,
                total_clients: 0, // À implémenter
                total_contracts: 0, // À implémenter
                total_revenue: data?.financial?.cash_flow?.income || 0,
                pending_tasks: 0, // À implémenter
                overdue_tasks: data?.projects?.overdue_projects?.length || 0,
                revenue_change: 5.2, // Exemple de données
                projects_change: 2.1,
                users_change: 0.8,
              }}
              period={getPeriodLabel(period)}
            />
            
            {/* Graphiques et visualisations */}
            <DashboardCharts 
              data={{
                revenue_trend: data?.financial?.revenue_trend,
                project_status_distribution: data?.projects?.status_distribution,
                team_performance: data?.projects?.team_performance,
                monthly_projects: [
                  { month: '2024-01', count: 12 },
                  { month: '2024-02', count: 15 },
                  { month: '2024-03', count: 18 },
                  { month: '2024-04', count: 22 },
                  { month: '2024-05', count: 25 },
                  { month: '2024-06', count: 28 },
                ],
              }}
              period={getPeriodLabel(period)}
            />
            
            {/* Vue d'ensemble des projets */}
            <Card>
              <CardHeader>
                <CardTitle>Résumé des Projets</CardTitle>
              </CardHeader>
              <CardContent>
                <ProjectMetrics 
                  data={data?.projects}
                  period={getPeriodLabel(period)}
                />
              </CardContent>
            </Card>
            
            {/* Vue d'ensemble financière */}
            <Card>
              <CardHeader>
                <CardTitle>Résumé Financier</CardTitle>
              </CardHeader>
              <CardContent>
                <FinancialOverview 
                  data={data?.financial}
                  period={getPeriodLabel(period)}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'projects' && (
          <DashboardLayout>
            <ProjectMetrics 
              data={data?.projects}
              period={getPeriodLabel(period)}
            />
          </DashboardLayout>
        )}

        {activeTab === 'financial' && (
          <DashboardLayout>
            <FinancialOverview 
              data={data?.financial}
              period={getPeriodLabel(period)}
            />
          </DashboardLayout>
        )}

        {activeTab === 'performance' && (
          <DashboardLayout>
            <PerformanceMetrics 
              data={data?.performance}
              period={getPeriodLabel(period)}
            />
          </DashboardLayout>
        )}

        {activeTab === 'calendar' && (
          <DashboardLayout>
            <CalendarOverview 
              data={data?.calendar}
              period={getPeriodLabel(period)}
            />
          </DashboardLayout>
        )}

        {activeTab === 'alerts' && (
          <DashboardLayout>
            <DashboardAlerts 
              data={{
                urgent_deadlines: data?.calendar?.upcoming_deadlines
                  ?.filter(d => d.days_until_deadline <= 3)
                  ?.map(d => ({
                    ...d,
                    priority: d.days_until_deadline === 0 ? 'high' : 
                             d.days_until_deadline === 1 ? 'medium' : 'low'
                  })) || [],
                overdue_projects: data?.projects?.overdue_projects?.map(p => ({
                  ...p,
                  impact: 'high' as const
                })) || [],
                billing_alerts: [
                  {
                    id: 1,
                    type: 'overdue' as const,
                    message: 'Facture en retard de paiement',
                    amount: 5000,
                    days_overdue: 15
                  }
                ],
                team_alerts: [
                  {
                    id: 1,
                    type: 'overload' as const,
                    message: 'Équipe surchargée',
                    team_name: 'Équipe Développement',
                    severity: 'medium' as const
                  }
                ]
              }}
            />
          </DashboardLayout>
        )}
      </div>

      {/* Informations de la période */}
      <div className="text-center text-sm text-gray-500 mt-8">
        <p>Données mises à jour pour la période : <strong>{getPeriodLabel(period)}</strong></p>
        {data?.last_updated && (
          <p className="mt-1">
            Dernière mise à jour : {new Date(data.last_updated).toLocaleString('fr-FR')}
          </p>
        )}
      </div>
    </div>
  );
};

export default DashboardPage; 