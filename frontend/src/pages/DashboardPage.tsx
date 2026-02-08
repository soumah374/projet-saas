import React, { useState, useMemo, useRef } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { ProjectMetrics } from '@/components/dashboard/ProjectMetrics';
import { FinancialOverview } from '@/components/dashboard/FinancialOverview';
import { PerformanceMetrics } from '@/components/dashboard/PerformanceMetrics';
import { CalendarOverview } from '@/components/dashboard/CalendarOverview';
import { DashboardAlerts } from '@/components/dashboard/DashboardAlerts';
import { QuickSummaryProjects } from '@/components/dashboard/QuickSummaryProjects';
import { QuickSummaryFinances } from '@/components/dashboard/QuickSummaryFinances';

// Import des nouveaux composants avancés
import { AdvancedFilters, DashboardFilters } from '@/components/dashboard/AdvancedFilters';
import { AdvancedKPIs } from '@/components/dashboard/AdvancedKPIs';
import { InteractiveCharts } from '@/components/dashboard/InteractiveCharts';
import { PeriodComparison } from '@/components/dashboard/PeriodComparison';
import { DataExport } from '@/components/dashboard/DataExport';
import { InteractiveDataTable } from '@/components/dashboard/InteractiveDataTable';
import { ForecastingChart } from '@/components/dashboard/ForecastingChart';
import { AdvancedCharts } from '@/components/dashboard/AdvancedCharts';

import { useDashboardMetrics } from '@/hooks/use-dashboard-metrics';
import { useDashboardConfig } from '@/hooks/use-dashboard-config';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatMontant } from '@/lib/formatters';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  RefreshCw,
  Calendar as CalendarIcon,
  BarChart3,
  Users,
  DollarSign,
  AlertTriangle,
  Target,
  TrendingUp,
  Filter as FilterIcon,
  Activity
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverTrigger } from '@radix-ui/react-popover';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { PopoverContent } from '@radix-ui/react-popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const DashboardPage: React.FC = () => {
  const [period, setPeriod] = useState('30');
  const { user } = useAuth();
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [filters, setFilters] = useState<DashboardFilters>({});
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Refs for export
  const kpiChartRef = useRef<HTMLDivElement>(null);
  const revenueChartRef = useRef<HTMLDivElement>(null);
  const performanceChartRef = useRef<HTMLDivElement>(null);

  // Charger la configuration widgets (par utilisateur connecté)
  const { selected, userSelected } = useDashboardConfig({ user_id: user?.id });

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
    } else {
      setActiveTab('overview');
    }
  }, [selected]);

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
    if (newPeriod !== 'autre') {
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

  // Calcul des KPIs avancés depuis les données existantes
  const advancedKPIs = useMemo(() => {
    if (!data) return null;

    const totalRevenue = data?.financial?.cash_flow?.recettes || 0;
    const totalProjects = data?.projects?.total_projects || 0;
    const completedProjects = data?.projects?.status_distribution?.['Terminé'] || 0;
    const onTimeProjects = data?.projects?.project_performance?.filter((p: any) => p.on_time)?.length || 0;
    const totalBudget = data?.financial?.total_factures_amount || 0;
    const actualSpent = data?.financial?.total_paid_amount || 0;

    return {
      roi: totalRevenue > 0 && actualSpent > 0 ? ((totalRevenue - actualSpent) / actualSpent) * 100 : 0,
      velocity: completedProjects / (parseInt(period) / 30),
      burnRate: actualSpent / (parseInt(period) / 30),
      successRate: totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0,
      utilizationRate: 78.3, // À calculer depuis les données réelles
      avgProjectDuration: 45, // À calculer depuis les données réelles
      revenuePerProject: totalProjects > 0 ? totalRevenue / totalProjects : 0,
      clientSatisfaction: 92, // À intégrer depuis un système de feedback
      onTimeDelivery: totalProjects > 0 ? (onTimeProjects / totalProjects) * 100 : 0,
      budgetVariance: totalBudget > 0 ? ((actualSpent - totalBudget) / totalBudget) * 100 : 0,
      teamProductivity: 12.4, // À calculer depuis les données de tâches
      profitMargin: totalRevenue > 0 ? ((totalRevenue - actualSpent) / totalRevenue) * 100 : 0,
    };
  }, [data, period]);

  // Données pour la comparaison de périodes
  const periodComparisonData = useMemo(() => {
    if (!data) return null;

    return {
      currentPeriod: {
        label: getPeriodLabel(period),
        data: {
          revenue: data?.financial?.cash_flow?.recettes || 0,
          projects: data?.projects?.total_projects || 0,
          clients: data?.projects?.active_projects || 0,
          tasks: data?.performance?.pending_tasks || 0,
        },
      },
      previousPeriod: {
        label: `Période précédente`,
        data: {
          revenue: (data?.financial?.cash_flow?.recettes || 0) * 0.92,
          projects: Math.round((data?.projects?.total_projects || 0) * 0.95),
          clients: Math.round((data?.projects?.active_projects || 0) * 0.88),
          tasks: Math.round((data?.performance?.pending_tasks || 0) * 1.05),
        },
      },
    };
  }, [data, period]);

  // Données heatmap (activité par jour/heure) - exemple
  const heatmapData = useMemo(() => {
    const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    const data = [];
    for (let day of days) {
      for (let hour = 0; hour < 24; hour++) {
        data.push({
          day,
          hour,
          value: Math.floor(Math.random() * 30) + (hour >= 9 && hour <= 17 ? 15 : 0),
        });
      }
    }
    return data;
  }, []);

  // Données funnel (conversion des projets)
  const funnelData = useMemo(() => {
    if (!data?.projects?.status_distribution) return [];

    return [
      { name: 'Prospection', value: data.projects.status_distribution['Prospection'] || 0 },
      { name: 'Devis Envoyés', value: data.projects.status_distribution['Production'] || 0 },
      { name: 'En Production', value: data.projects.status_distribution['Production'] || 0 },
      { name: 'Livraison', value: data.projects.status_distribution['Livraison'] || 0 },
      { name: 'Terminés', value: data.projects.status_distribution['Terminé'] || 0 },
    ];
  }, [data]);

  // Données pour le tableau interactif
  const projectTableColumns = [
    { key: 'name', label: 'Nom du Projet', sortable: true, filterable: true },
    { key: 'status', label: 'Statut', sortable: true, filterable: true },
    {
      key: 'progress',
      label: 'Progression',
      sortable: true,
      format: (val: number) => (
        <div className="flex items-center gap-2">
          <div className="w-24 bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full"
              style={{ width: `${val}%` }}
            />
          </div>
          <span className="text-sm">{val}%</span>
        </div>
      )
    },
    {
      key: 'budget',
      label: 'Budget',
      sortable: true,
      format: (val: number) => new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'GNF',
        minimumFractionDigits: 0
      }).format(val)
    },
  ];

  const projectTableData = useMemo(() => {
    if (!data?.projects?.project_performance) return [];

    return (data.projects.project_performance || []).slice(0, 20).map((perf: any) => ({
      name: perf.projects?.title || 'Sans nom',
      status: perf.projects?.status || 'Prospection',
      progress: perf.projects?.progress || 0,
      budget: perf.projects?.budget || 0,
      team: perf.projects?.team_members?.map((m: any) => m.name).join(', ') || 'Sans équipe',
    }));
  }, [data]);

  // Helpers de sélection
  const isSelected = (key: string) => !selected || selected.length === 0 || selected.includes(key);
  const anySelected = (prefix: string, keys?: string[]) => {
    if (!selected || selected.length === 0) return false;
    if (keys && keys.length > 0) return keys.some(k => selected.includes(k));
    return selected.some(k => k.startsWith(prefix + '.'));
  };

  // Gating des onglets
  const showProjectsTab = anySelected('projects');
  const showFinancialTab = anySelected('financial');
  const showPerformanceTab = anySelected('performance');
  const showCalendarTab = anySelected('calendar');
  const showAlertsTab = isSelected('calendar.upcoming_deadlines') || isSelected('projects.overdue_projects');
  const showOverviewTab = anySelected('financial') || anySelected('projects') || anySelected('performance') || anySelected('calendar');
  const showAnalyticsTab = anySelected('advanced');

  // Calculer le nombre total d'alertes
  const totalAlerts = (
    (data?.calendar?.upcoming_deadlines?.filter((d: any) => d.days_until_deadline <= 3).length || 0) +
    (data?.projects?.overdue_projects?.length || 0)
  );

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

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* En-tête du tableau de bord */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tableau de Bord project_saas</h1>
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
                    onSelect={(d: Date | undefined) => setCustomStart(d ? d.toISOString().slice(0, 10) : '')}
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
                    onSelect={(d: Date | undefined) => setCustomEnd(d ? d.toISOString().slice(0, 10) : '')}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* {isSelected('advanced.filters') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              <FilterIcon className="h-4 w-4 mr-2" />
              Filtres
            </Button>
          )} */}

          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Filtres Avancés */}
      {showAdvancedFilters && isSelected('advanced.filters') && (
        <AdvancedFilters
          filters={filters}
          onFiltersChange={setFilters}
          isCollapsed={false}
          onToggleCollapse={() => setShowAdvancedFilters(false)}
        />
      )}

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
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          {showOverviewTab && (
            <TabsTrigger value="overview">
              <BarChart3 className="h-4 w-4 mr-2" />
              Vue d'ensemble
            </TabsTrigger>
          )}
          {showProjectsTab && (
            <TabsTrigger value="projects">
              <Target className="h-4 w-4 mr-2" />
              Projets
            </TabsTrigger>
          )}
          {showFinancialTab && (
            <TabsTrigger value="financial">
              <DollarSign className="h-4 w-4 mr-2" />
              Finances
            </TabsTrigger>
          )}
          {showPerformanceTab && (
            <TabsTrigger value="performance">
              <Users className="h-4 w-4 mr-2" />
              Performances
            </TabsTrigger>
          )}
          {showCalendarTab && (
            <TabsTrigger value="calendar">
              <CalendarIcon className="h-4 w-4 mr-2" />
              Calendrier
            </TabsTrigger>
          )}
          {showAnalyticsTab && (
            <TabsTrigger value="analytics">
              <TrendingUp className="h-4 w-4 mr-2" />
              Analyses
            </TabsTrigger>
          )}
          {showAlertsTab && (
            <TabsTrigger value="alerts">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Alertes
              {totalAlerts > 0 && (
                <Badge variant="destructive" className="ml-2 text-xs">
                  {totalAlerts}
                </Badge>
              )}
            </TabsTrigger>
          )}
        </TabsList>

        {/* Vue d'ensemble */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Résumé rapide */}
          <div className="space-y-6">
            {anySelected('financial') && (
              <QuickSummaryFinances
                data={{
                  taux_recouvrement: data?.financial?.taux_recouvrement,
                  total_impayees_amount: data?.financial?.total_impayees_amount,
                  total_paid_amount: data?.financial?.total_paid_amount,
                  total_recouvrable_amount: data?.financial?.total_factures_amount,
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
                  active_projects: data?.projects?.active_projects || 0,
                  total_revenue: data?.financial?.cash_flow?.recettes ?? 0,
                  urgent_deadlines: data?.calendar?.upcoming_deadlines?.filter((d: any) => d.days_until_deadline <= 3).length || 0,
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

          {/* KPIs Avancés */}
          {advancedKPIs && isSelected('advanced.kpis') && (
            <div ref={kpiChartRef}>
              <AdvancedKPIs data={advancedKPIs} period={getPeriodLabel(period)} />
            </div>
          )}

          {/* Graphiques Interactifs */}
          {(isSelected('financial.revenue_trend') || isSelected('projects.status_distribution') || isSelected('projects.team_performance') || isSelected('projects.monthly_projects')) && (
            <div ref={revenueChartRef}>
              <InteractiveCharts
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
              />
            </div>
          )}

          {/* Comparaison de Périodes */}
          {periodComparisonData && isSelected('advanced.period_comparison') && (
            <PeriodComparison
              currentPeriod={periodComparisonData.currentPeriod}
              previousPeriod={periodComparisonData.previousPeriod}
            />
          )}

          {/* Export de Données */}
          {isSelected('advanced.data_export') && (
            <DataExport
              data={{
                kpis: advancedKPIs,
                revenue_trend: data?.financial?.revenue_trend,
                projects: projectTableData,
                team_performance: data?.projects?.team_performance,
              }}
              chartRefs={{
                kpis: kpiChartRef,
                revenue: revenueChartRef,
                performance: performanceChartRef,
              }}
              fileName="dashboard-project_saas"
            />
          )}
        </TabsContent>

        {/* Onglet Projets */}
        <TabsContent value="projects" className="space-y-6 mt-6">
          {anySelected('projects') && (
            <>
              <DashboardLayout>
                <ProjectMetrics
                  data={data?.projects}
                  period={getPeriodLabel(period)}
                  selected={selected}
                  userSelected={userSelected}
                />
              </DashboardLayout>

              {projectTableData.length > 0 && isSelected('advanced.interactive_table') && (
                <InteractiveDataTable
                  title="Liste des Projets"
                  icon={<Target className="h-5 w-5 text-primary" />}
                  columns={projectTableColumns}
                  data={projectTableData}
                  defaultSortKey="progress"
                  defaultSortOrder="desc"
                  pageSize={10}
                  showFilters={true}
                />
              )}
            </>
          )}
        </TabsContent>

        {/* Onglet Financier */}
        <TabsContent value="financial" className="space-y-6 mt-6">
          {anySelected('financial') && (
            <>
              <DashboardLayout>
                <FinancialOverview
                  data={data?.financial}
                  period={getPeriodLabel(period)}
                  selected={selected}
                  userSelected={userSelected}
                />
              </DashboardLayout>

              {/* Indicateurs financiers - tableau synthétique */}
              <Card>
                <CardHeader>
                  <CardTitle>Indicateurs financiers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 bg-gray-50 rounded">
                      <p className="text-sm text-gray-500">Total factures</p>
                      <p className="text-lg font-semibold">{formatMontant(data?.financial?.total_factures_amount || 0)}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded">
                      <p className="text-sm text-gray-500">Total payés</p>
                      <p className="text-lg font-semibold">{formatMontant(data?.financial?.total_paid_amount || 0)}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded">
                      <p className="text-sm text-gray-500">Total impayés</p>
                      <p className="text-lg font-semibold">{formatMontant(data?.financial?.total_impayees_amount || 0)}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded">
                      <p className="text-sm text-gray-500">Taux de recouvrement</p>
                      <p className="text-lg font-semibold">{Number(data?.financial?.taux_recouvrement ?? 0).toFixed(1)}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Prévisions Financières */}
              {data?.financial?.revenue_trend && data.financial.revenue_trend.length > 0 && isSelected('advanced.forecasting') && (
                <ForecastingChart
                  historicalData={data.financial.revenue_trend.map((item: any) => ({
                    period: item.period,
                    value: item.recettes,
                  }))}
                  metric="Revenus"
                  unit="currency"
                  forecastPeriods={6}
                />
              )}
            </>
          )}
        </TabsContent>

        {/* Onglet Performance */}
        <TabsContent value="performance" className="space-y-6 mt-6">
          {anySelected('performance') && (
            <>
              <DashboardLayout>
                <div ref={performanceChartRef}>
                  <PerformanceMetrics
                    data={data?.performance}
                    project_performance={(data as any)?.projects?.project_performance}
                    period={getPeriodLabel(period)}
                    selected={selected}
                    userSelected={userSelected}
                  />
                </div>
              </DashboardLayout>

              {/* Graphiques Avancés */}
              {(isSelected('advanced.heatmap') || isSelected('advanced.funnel')) && (
                <AdvancedCharts
                  heatmapData={heatmapData}
                  funnelData={funnelData}
                />
              )}
            </>
          )}
        </TabsContent>

        {/* Onglet Calendrier */}
        <TabsContent value="calendar" className="space-y-6 mt-6">
          {anySelected('calendar') && (
            <DashboardLayout>
              <CalendarOverview
                data={data?.calendar}
                period={getPeriodLabel(period)}
                selected={selected}
                userSelected={userSelected}
              />
            </DashboardLayout>
          )}
        </TabsContent>

        {/* Onglet Analyses */}
        <TabsContent value="analytics" className="space-y-6 mt-6">
          {/* KPIs Avancés avec Comparaison */}
          {advancedKPIs && isSelected('advanced.kpis') && (
            <AdvancedKPIs
              data={advancedKPIs}
              period={getPeriodLabel(period)}
              comparisonData={{
                roi: advancedKPIs.roi * 0.92,
                velocity: advancedKPIs.velocity * 0.95,
                burnRate: advancedKPIs.burnRate * 1.05,
                successRate: advancedKPIs.successRate * 0.97,
                utilizationRate: advancedKPIs.utilizationRate * 0.96,
                avgProjectDuration: advancedKPIs.avgProjectDuration * 1.08,
                revenuePerProject: advancedKPIs.revenuePerProject * 0.94,
                clientSatisfaction: advancedKPIs.clientSatisfaction * 0.98,
                onTimeDelivery: advancedKPIs.onTimeDelivery * 0.93,
                budgetVariance: advancedKPIs.budgetVariance * 1.15,
                teamProductivity: advancedKPIs.teamProductivity * 0.91,
                profitMargin: advancedKPIs.profitMargin * 0.89,
              }}
            />
          )}

          {/* Graphiques Avancés */}
          {(isSelected('advanced.heatmap') || isSelected('advanced.funnel')) && (
            <AdvancedCharts
              heatmapData={heatmapData}
              funnelData={funnelData}
            />
          )}

          {/* Tableau de Données */}
          {projectTableData.length > 0 && isSelected('advanced.interactive_table') && (
            <InteractiveDataTable
              title="Analyse Détaillée des Projets"
              icon={<Activity className="h-5 w-5 text-primary" />}
              columns={projectTableColumns}
              data={projectTableData}
              defaultSortKey="budget"
              defaultSortOrder="desc"
              pageSize={15}
              showFilters={true}
            />
          )}
        </TabsContent>

        {/* Onglet Alertes */}
        <TabsContent value="alerts" className="space-y-6 mt-6">
          <DashboardLayout>
            <DashboardAlerts
              data={{
                urgent_deadlines: data?.calendar?.upcoming_deadlines
                  ?.filter((d: any) => d.days_until_deadline <= 3)
                  ?.map((d: any) => ({
                    ...d,
                    priority: d.days_until_deadline === 0 ? 'high' : d.days_until_deadline === 1 ? 'medium' : 'low'
                  })) || [],
                overdue_projects: data?.projects?.overdue_projects?.map((p: any) => ({
                  ...p,
                  impact: 'high' as const
                })) || []
              }}
              selected={selected}
              userSelected={userSelected}
            />
          </DashboardLayout>
        </TabsContent>
      </Tabs>

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
