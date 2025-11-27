import React, { useState, useRef, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { RefreshCw, Download, Settings, BarChart3 } from 'lucide-react';

// Import all advanced dashboard components
import { AdvancedFilters, DashboardFilters } from '@/components/dashboard/AdvancedFilters';
import { AdvancedKPIs } from '@/components/dashboard/AdvancedKPIs';
import { InteractiveCharts } from '@/components/dashboard/InteractiveCharts';
import { PeriodComparison } from '@/components/dashboard/PeriodComparison';
import { DataExport } from '@/components/dashboard/DataExport';
import { InteractiveDataTable } from '@/components/dashboard/InteractiveDataTable';
import { ForecastingChart } from '@/components/dashboard/ForecastingChart';
import { AdvancedCharts } from '@/components/dashboard/AdvancedCharts';
import { DrillDownView } from '@/components/dashboard/DrillDownView';

// Hooks
import { useDashboardMetrics } from '@/hooks/use-dashboard-metrics';
import { useAuth } from '@/hooks/use-auth';

const AdvancedDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [filters, setFilters] = useState<DashboardFilters>({});
  const [filtersCollapsed, setFiltersCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Refs for export functionality
  const kpiChartRef = useRef<HTMLDivElement>(null);
  const revenueChartRef = useRef<HTMLDivElement>(null);
  const performanceChartRef = useRef<HTMLDivElement>(null);

  // Fetch dashboard data
  const { data, loading, error, refetch } = useDashboardMetrics(30);

  // Sample KPI data - in real app, this would come from the API
  const kpiData = useMemo(() => ({
    roi: 32.5,
    velocity: 8.2,
    burnRate: 45000000,
    successRate: 87.5,
    utilizationRate: 78.3,
    avgProjectDuration: 45,
    revenuePerProject: 125000000,
    clientSatisfaction: 92,
    onTimeDelivery: 85.2,
    budgetVariance: -5.3,
    teamProductivity: 12.4,
    profitMargin: 28.7,
  }), []);

  // Sample comparison data for period comparison
  const comparisonData = useMemo(() => ({
    currentPeriod: {
      label: '30 derniers jours',
      data: {
        revenue: data?.financial?.cash_flow?.recettes || 450000000,
        projects: data?.projects?.total_projects || 24,
        clients: 45,
        tasks: 156,
      },
    },
    previousPeriod: {
      label: '30 jours précédents',
      data: {
        revenue: 420000000,
        projects: 22,
        clients: 42,
        tasks: 148,
      },
    },
  }), [data]);

  // Sample heatmap data
  const heatmapData = useMemo(() => {
    const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    const data = [];
    for (let day of days) {
      for (let hour = 0; hour < 24; hour++) {
        data.push({
          day,
          hour,
          value: Math.floor(Math.random() * 50) + (hour >= 9 && hour <= 17 ? 20 : 0),
        });
      }
    }
    return data;
  }, []);

  // Sample funnel data
  const funnelData = useMemo(() => [
    { name: 'Prospects', value: 1000 },
    { name: 'Contacts établis', value: 750 },
    { name: 'Devis envoyés', value: 450 },
    { name: 'Négociations', value: 280 },
    { name: 'Contrats signés', value: 150 },
  ], []);

  // Sample table data
  const tableColumns = [
    { key: 'name', label: 'Nom du Projet', sortable: true, filterable: true },
    { key: 'status', label: 'Statut', sortable: true, filterable: true },
    { key: 'progress', label: 'Progression', sortable: true, format: (val: number) => `${val}%` },
    {
      key: 'budget',
      label: 'Budget',
      sortable: true,
      format: (val: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'GNF', minimumFractionDigits: 0 }).format(val)
    },
    { key: 'team', label: 'Équipe', sortable: true, filterable: true },
  ];

  const tableData = useMemo(() => [
    { name: 'Refonte Site Web', status: 'Production', progress: 75, budget: 85000000, team: 'Web Team' },
    { name: 'App Mobile', status: 'Prospection', progress: 15, budget: 120000000, team: 'Mobile Team' },
    { name: 'Dashboard Analytics', status: 'Livraison', progress: 95, budget: 65000000, team: 'Data Team' },
    { name: 'Système CRM', status: 'Production', progress: 60, budget: 150000000, team: 'Backend Team' },
    { name: 'Campagne Marketing', status: 'Terminé', progress: 100, budget: 45000000, team: 'Marketing Team' },
  ], []);

  // Drill-down sample data
  const drillDownData = useMemo(() => [
    { name: 'Équipe Web', value: 250000000, id: 1 },
    { name: 'Équipe Mobile', value: 180000000, id: 2 },
    { name: 'Équipe Data', value: 150000000, id: 3 },
    { name: 'Équipe Backend', value: 220000000, id: 4 },
  ], []);

  const handleDrillDown = (level: number, item: any) => {
    // In real app, this would fetch data from API
    if (level === 1) {
      return [
        { name: 'Projet A', value: item.value * 0.4 },
        { name: 'Projet B', value: item.value * 0.35 },
        { name: 'Projet C', value: item.value * 0.25 },
      ];
    }
    if (level === 2) {
      return [
        { name: 'Phase 1', value: item.value * 0.3 },
        { name: 'Phase 2', value: item.value * 0.45 },
        { name: 'Phase 3', value: item.value * 0.25 },
      ];
    }
    return [];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Chargement du tableau de bord avancé...</p>
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
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-primary" />
            Tableau de Bord Analytique Avancé
          </h1>
          <p className="text-gray-600 mt-2">
            Vue d'ensemble complète avec analyses avancées et insights
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Paramètres
          </Button>
        </div>
      </div>

      {/* Advanced Filters */}
      <AdvancedFilters
        filters={filters}
        onFiltersChange={setFilters}
        isCollapsed={filtersCollapsed}
        onToggleCollapse={() => setFiltersCollapsed(!filtersCollapsed)}
      />

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="kpis">KPIs Avancés</TabsTrigger>
          <TabsTrigger value="charts">Graphiques</TabsTrigger>
          <TabsTrigger value="forecast">Prévisions</TabsTrigger>
          <TabsTrigger value="analysis">Analyses</TabsTrigger>
          <TabsTrigger value="drilldown">Drill-Down</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* KPIs */}
          <div ref={kpiChartRef}>
            <AdvancedKPIs data={kpiData} period="30 jours" />
          </div>

          {/* Interactive Charts */}
          <div ref={revenueChartRef}>
            <InteractiveCharts
              data={{
                revenue_trend: data?.financial?.revenue_trend,
                project_status_distribution: data?.projects?.status_distribution,
                team_performance: data?.projects?.team_performance,
                monthly_projects: data?.projects?.monthly_projects,
              }}
              period="30 jours"
            />
          </div>

          {/* Period Comparison */}
          <PeriodComparison
            currentPeriod={comparisonData.currentPeriod}
            previousPeriod={comparisonData.previousPeriod}
          />

          {/* Data Export */}
          <DataExport
            data={{
              kpis: kpiData,
              revenue_trend: data?.financial?.revenue_trend,
              projects: tableData,
              team_performance: data?.projects?.team_performance,
            }}
            chartRefs={{
              kpis: kpiChartRef,
              revenue: revenueChartRef,
              performance: performanceChartRef,
            }}
          />
        </TabsContent>

        {/* KPIs Tab */}
        <TabsContent value="kpis" className="space-y-6">
          <AdvancedKPIs
            data={kpiData}
            period="30 jours"
            comparisonData={{
              roi: 28.3,
              velocity: 7.8,
              burnRate: 48000000,
              successRate: 84.2,
              utilizationRate: 75.1,
              avgProjectDuration: 52,
              revenuePerProject: 118000000,
              clientSatisfaction: 89,
              onTimeDelivery: 82.5,
              budgetVariance: -8.1,
              teamProductivity: 11.2,
              profitMargin: 25.4,
            }}
          />
        </TabsContent>

        {/* Charts Tab */}
        <TabsContent value="charts" className="space-y-6">
          <InteractiveCharts
            data={{
              revenue_trend: data?.financial?.revenue_trend,
              project_status_distribution: data?.projects?.status_distribution,
              team_performance: data?.projects?.team_performance,
              monthly_projects: data?.projects?.monthly_projects,
            }}
            period="30 jours"
            onDrillDown={(type, value) => console.log('Drill down:', type, value)}
          />

          <AdvancedCharts
            heatmapData={heatmapData}
            funnelData={funnelData}
            onCellClick={(data) => console.log('Cell clicked:', data)}
          />
        </TabsContent>

        {/* Forecast Tab */}
        <TabsContent value="forecast" className="space-y-6">
          {data?.financial?.revenue_trend && (
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
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analysis" className="space-y-6">
          <PeriodComparison
            currentPeriod={comparisonData.currentPeriod}
            previousPeriod={comparisonData.previousPeriod}
          />

          <InteractiveDataTable
            title="Projets en Cours"
            icon={<BarChart3 className="h-5 w-5 text-primary" />}
            columns={tableColumns}
            data={tableData}
            defaultSortKey="progress"
            defaultSortOrder="desc"
            pageSize={10}
            onRowClick={(row) => console.log('Row clicked:', row)}
            showFilters={true}
          />
        </TabsContent>

        {/* Drill-Down Tab */}
        <TabsContent value="drilldown" className="space-y-6">
          <DrillDownView
            initialData={drillDownData}
            onDrillDown={handleDrillDown}
            onItemSelect={(item) => console.log('Item selected:', item)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedDashboardPage;
