import React, { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { ProjectMetrics } from '@/components/dashboard/ProjectMetrics';
import { FinancialOverview } from '@/components/dashboard/FinancialOverview';
import { PerformanceMetrics } from '@/components/dashboard/PerformanceMetrics';
import { CalendarOverview } from '@/components/dashboard/CalendarOverview';
import { DashboardCharts } from '@/components/dashboard/DashboardCharts';
import { DashboardAlerts } from '@/components/dashboard/DashboardAlerts';
import { QuickSummaryProjects } from '@/components/dashboard/QuickSummaryProjects';
import { QuickSummaryFinances } from '@/components/dashboard/QuickSummaryFinances';
import { useDashboardMetrics } from '@/hooks/use-dashboard-metrics';
import { useDashboardConfig } from '@/hooks/use-dashboard-config';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, Calendar as CalendarIcon, BarChart3, Users, DollarSign, AlertTriangle, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverTrigger } from '@radix-ui/react-popover';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { PopoverContent } from '@radix-ui/react-popover';

const DashboardPage: React.FC = () => {
  const [period, setPeriod] = useState('30');
  const { user } = useAuth();
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');

  // Charger la configuration widgets (par utilisateur connecté)
  const { selected, userSelected} = useDashboardConfig({ user_id: user?.id });

  const customDays = useMemo(() => {
    if (!customStart || !customEnd) return 30;
    const start = new Date(customStart);
    const end = new Date(customEnd);
    const diffMs = end.getTime() - start.getTime();
    const days = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    return isFinite(days) ? days : 30;
  }, [customStart, customEnd]);

  const { data, loading, error, refetch } = useDashboardMetrics(
    period === 'autre' ? customDays : parseInt(period),
    selected && selected.length > 0 ? selected : userSelected && userSelected.length > 0 ? userSelected : undefined
  );

  const [activeTab, setActiveTab] = useState('overview');
  // Activer l'onglet alerte si aucun droit n'est défini
  React.useEffect(() => {
    if (!selected || selected.length === 0) {
      setActiveTab('alerts');
    }
    setActiveTab('overview');
  }, [selected]);

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
    if (newPeriod !== 'autre') {
      // reset custom dates when leaving custom mode
      setCustomStart('');
      setCustomEnd('');
    }
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
      case 'autre': return 'autre';
      default: return `${days} jours`;
    }
  };

  const revenueChange = useMemo(() => {
    const trendAny = (data?.financial?.revenue_trend as any[]) || [];
    if (trendAny.length < 2) return 0;
    const lastItem = trendAny[trendAny.length - 1] || {};
    const prevItem = trendAny[trendAny.length - 2] || {};
    const last = lastItem.recettes ?? 0;
    const prev = prevItem.recettes ?? 0;
    return prev > 0 ? ((last - prev) / prev) * 100 : 0;
  }, [data?.financial?.revenue_trend]);

  // Dérivés pour compatibilités backend - calcul des totaux depuis status_distribution
  const totalProjectsDerived = useMemo(() => {
    const dist = data?.projects?.status_distribution || {};
    return Object.values(dist).reduce((acc: any, v: any) => acc + (typeof v === 'number' ? v : 0), 0);
  }, [data?.projects?.status_distribution]);

  const activeProjectsDerived = useMemo(() => {
    const dist = data?.projects?.status_distribution || {} as Record<string, number>;
    const keys = Object.keys(dist);
    // Statuts considérés comme "actifs" selon le backend
    const activeStatuses = ['Production', 'Livraison', 'En cours'];
    return keys.filter(k => activeStatuses.includes(k)).reduce((acc, k) => acc + (dist[k] || 0), 0);
  }, [data?.projects?.status_distribution]);

  // Helpers de sélection
  const isSelected = (key: string) => !selected || selected.length === 0 || selected.includes(key);
  const anySelected = (prefix: string, keys?: string[]) => {
    if (!selected || selected.length === 0) return false;
    if (keys && keys.length > 0) return keys.some(k => selected.includes(k));
    return selected.some(k => k.startsWith(prefix + '.'));
  };

  // Gating des onglets - mise à jour selon les widgets disponibles
  const showProjectsTab = anySelected('projects');
  const showFinancialTab = anySelected('financial');
  const showPerformanceTab = anySelected('performance');
  const showCalendarTab = anySelected('calendar');
  const showAlertsTab = isSelected('calendar.upcoming_deadlines') || isSelected('projects.overdue_projects');
  const showOverviewTab = anySelected('financial') || anySelected('projects') || anySelected('performance') || anySelected('calendar');
    
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
              <SelectItem value="autre">Autre</SelectItem>
            </SelectContent>
          </Select>

          {period === 'autre' && (
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn('w-[160px] justify-start', !customStart && 'text-muted-foreground')}>
                    {customStart ? new Date(customStart).toLocaleDateString('fr-FR') : 'Début'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0" align="start">
                  <Calendar
                    mode="single"
                    style={{
                      backgroundColor: 'white',
                      border: '1px solid #e0e0e0',
                      borderRadius: '4px',
                      padding: '10px',
                      boxShadow: '0 0 10px 0 rgba(0, 0, 0, 0.1)',
                    }}
                    selected={customStart ? new Date(customStart) : undefined}
                    onSelect={(d: Date | undefined) => setCustomStart(d ? d.toISOString().slice(0,10) : '')}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <span className="text-sm text-gray-500">à</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn('w-[160px] justify-start', !customEnd && 'text-muted-foreground')}>
                    {customEnd ? new Date(customEnd).toLocaleDateString('fr-FR') : 'Fin'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0" align="start">
                  <Calendar
                    mode="single"
                    style={{
                      backgroundColor: 'white',
                      border: '1px solid #e0e0e0',
                      borderRadius: '4px',
                      padding: '10px',
                      boxShadow: '0 0 10px 0 rgba(0, 0, 0, 0.1)',
                    }}
                    selected={customEnd ? new Date(customEnd) : undefined}
                    onSelect={(d: Date | undefined) => setCustomEnd(d ? d.toISOString().slice(0,10) : '')}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Button onClick={handleRefresh} variant="outline" size="sm" disabled={!customStart || !customEnd}>
                Appliquer
              </Button>
            </div>
          )}
    
          
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
        {showOverviewTab && (
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
        )}
        {showProjectsTab && (
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
        )}
        {showFinancialTab && (
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
        )}
        {showPerformanceTab && (
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
        )}
        {showCalendarTab && (
          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
              activeTab === 'calendar'
                ? 'bg-primary text-primary-foreground'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <CalendarIcon className="h-4 w-4 inline mr-2" />
            Calendrier
          </button>
        )}
        {showAlertsTab && (
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
        )}
      </div>

      {/* Contenu des onglets */}
      <div className="mt-2">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Résumé rapide des informations essentielles */}
            <div className="space-y-6">
              {anySelected('financial') && (
                <QuickSummaryFinances 
                  data={{
                    taux_recouvrement: data?.financial?.taux_recouvrement,
                    total_impayees_amount: data?.financial?.total_impayees_amount,
                    total_paid_amount: data?.financial?.total_paid_amount,
                    total_recouvrable_amount: data?.financial?.total_factures_amount, // Utiliser total_factures_amount comme proxy
                    total_factures_amount: data?.financial?.total_factures_amount,
                    total_en_retard_amount: data?.financial?.total_en_retard_amount,
                    selected: selected,
                    userSelected: userSelected,
                    montant_impaye: data?.financial?.montant_impaye,
                    facture_non_emises: data?.financial?.facture_non_emises
                  }}
                  period={getPeriodLabel(period)}
                  period_days={period.toString()}
                />
              )}
              {(isSelected('financial.cash_flow') || isSelected('financial.revenue_trend') || isSelected('projects.overdue_projects') || isSelected('calendar.upcoming_deadlines')) && (
                <QuickSummaryProjects 
                  data={{
                    total_projects: data?.projects?.total_projects || 0,
                    active_projects: data.projects.active_projects || 0,
                    total_revenue: data?.financial?.cash_flow?.recettes ?? 0,
                    urgent_deadlines: data?.calendar?.upcoming_deadlines?.filter(d => d.days_until_deadline <= 3).length || 0,
                    overdue_projects: data?.projects?.overdue_projects?.length || 0,
                    revenue_change: revenueChange,
                    projects_change: 2.1,
                    selected: selected,
                    userSelected: userSelected,
                    project_performance: (data.projects?.project_performance || []).map(
                      (perf: any, idx: number) => ({
                        ...perf,
                        projects: {
                          ...perf.projects,
                          id: perf.projects.id ?? idx
                        }
                      })
                    ),
                  }}
                  period={getPeriodLabel(period)}
                />
              )}
            </div>
            
            {/* Statistiques principales avec tendances */}
            {/* {(isSelected('projects.status_distribution') || isSelected('performance.pending_tasks') || isSelected('performance.overdue_tasks') || isSelected('financial.cash_flow') || isSelected('financial.revenue_trend') || isSelected('calendar.resource_utilization')) && (
              <DashboardStats 
                data={{
                  total_projects: totalProjectsDerived || 0,
                  active_projects: activeProjectsDerived || 0,
                  total_contracts: data?.calendar?.resource_utilization?.total_contracts || 0,
                  total_revenue: data?.financial?.cash_flow?.recettes ?? 0,
                  pending_tasks: data?.performance?.pending_tasks || 0,
                  overdue_tasks: data?.performance?.overdue_tasks || 0,
                  revenue_change: revenueChange,
                  projects_change: 2.1,
                  users_change: 0.8,
                  selected: selected,
                  userSelected: userSelected,
                }}
                period={getPeriodLabel(period)}
              />
            )} */}

            {/* Graphiques et visualisations */}
            {(isSelected('financial.revenue_trend') || isSelected('projects.status_distribution') || isSelected('projects.team_performance') || isSelected('projects.monthly_projects')) && (
              <DashboardCharts 
                data={{
                  revenue_trend: data?.financial?.revenue_trend,
                  project_status_distribution: data?.projects?.status_distribution,
                  team_performance: data?.projects?.team_performance,
                  monthly_projects: (data?.projects?.monthly_projects || []).map((m: any) => ({
                    month: m.month,
                    count: m.count
                  }))
                }}
                period={getPeriodLabel(period)}
                selected={selected}
                userSelected={userSelected}
              />
            )}
            
            {/* Vue d'ensemble des projets */}
            {anySelected('projects') && (
              <Card>
                <CardHeader>
                  <CardTitle>Résumé des Projets</CardTitle>
                </CardHeader>
                <CardContent>
                  <ProjectMetrics 
                    data={data?.projects}
                    period={getPeriodLabel(period)}
                    selected={selected}
                    userSelected={userSelected}
                  />
                </CardContent>
              </Card>
            )}
            
            {/* Vue d'ensemble financière */}
            {anySelected('financial') && (
              <Card>
                <CardHeader>
                  <CardTitle>Résumé Financier</CardTitle>
                </CardHeader>
                <CardContent>
                  <FinancialOverview 
                    data={data?.financial}
                    period={getPeriodLabel(period)}
                    selected={selected}
                    userSelected={userSelected}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'projects' && (
          <DashboardLayout>
            {anySelected('projects') && (
            <ProjectMetrics 
              data={data?.projects}
              period={getPeriodLabel(period)}
              selected={selected}
              userSelected={userSelected}
            />
            )}
          </DashboardLayout>
        )}

        {activeTab === 'financial' && (
          <DashboardLayout>
            {anySelected('financial') && (
              <FinancialOverview 
                data={data?.financial}
                period={getPeriodLabel(period)}
                selected={selected}
                userSelected={userSelected}
              />
            )}
          </DashboardLayout>
        )}

        {activeTab === 'performance' && (
          anySelected('performance') && (
            <DashboardLayout>
              <PerformanceMetrics 
                data={data?.performance}
                project_performance={(data as any)?.projects?.project_performance}
                period={getPeriodLabel(period)}
                selected={selected}
                userSelected={userSelected}
              />
            </DashboardLayout>
          )
        )}

        {activeTab === 'calendar' && (
          anySelected('calendar') && (
            <DashboardLayout>
              <CalendarOverview 
                data={data?.calendar}
                period={getPeriodLabel(period)}
                selected={selected}
                userSelected={userSelected}
              />
            </DashboardLayout>
          )
        )}

        {activeTab === 'alerts' && (
          <DashboardLayout>
            <DashboardAlerts 
              data={{
                urgent_deadlines: data?.calendar?.upcoming_deadlines
                  ?.filter(d => d.days_until_deadline <= 3)
                  ?.map(d => ({
                    ...d,
                    priority: d.days_until_deadline === 0 ? 'high' : d.days_until_deadline === 1 ? 'medium' : 'low'
                  })) || [],
                overdue_projects: data?.projects?.overdue_projects?.map(p => ({
                  ...p,
                  impact: 'high' as const
                })) || []
              }}
              selected={selected}
              userSelected={userSelected}
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