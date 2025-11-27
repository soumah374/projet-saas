import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { ReportFilters } from '@/components/reports/ReportFilters';
import { ReportStats } from '@/components/reports/ReportStats';
import { ProjectReportTable } from '@/components/reports/ProjectReportTable';
import { TeamPerformance } from '@/components/reports/TeamPerformance';
import { PerformanceChart } from '@/components/reports/PerformanceChart';
import { useProjectReports, useExportReport, ReportFilters as FilterType } from '@/hooks/use-reports';
import { useTeams } from '@/hooks/use-teams';
import { toast } from 'sonner';
import { usePermissions } from '@/hooks/use-permissions';

export const ReportsPage = () => {
  const [filters, setFilters] = useState<FilterType>({});
  const { hasPermission } = usePermissions();
  const {
    data: reportData,
    isLoading: projectsLoading,
    error: projectsError
  } = useProjectReports(filters);

  const {
    data: teams,
    isLoading: teamLoading,
    error: teamError
  } = useTeams();

  const exportMutation = useExportReport();

  const handleExport = () => {
    exportMutation.mutate(filters, {
      onError: () => {
        toast.error("Erreur lors de l'exportation du rapport");
      }
    });
  };

  const handleFiltersChange = (newFilters: FilterType) => {
    setFilters(newFilters);
  };

  if (projectsLoading || teamLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (projectsError || teamError) {
    return (
      <div className="text-center py-8 text-red-600">
        Une erreur est survenue lors du chargement des données
      </div>
    );
  }

  const performanceData = {
    timeline: {
      labels: reportData?.timeline?.labels || [],
      projects_completed: reportData?.timeline?.projects_completed || [],
      tasks_completed: reportData?.timeline?.tasks_completed || []
    },
    team: {
      avg_productivity: reportData?.team?.avg_productivity || 0
    }
  };

  const teamPerformanceData = {
    members: reportData?.team_members || [],
    topPerformers: reportData?.top_performers || [],
    averageProductivity: reportData?.team?.avg_productivity || 0,
    totalTasks: reportData?.total_tasks || 0,
    completedTasks: reportData?.completed_tasks || 0,
    activeProjects: reportData?.active_projects || 0
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Rapports et statistiques</h1>
        {hasPermission('projects.export_project_reports') && (
          <Button onClick={handleExport} disabled={exportMutation.isPending}>
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <ReportFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onApplyFilters={() => {}}
            onResetFilters={() => setFilters({})}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Performance des projets</CardTitle>
          </CardHeader>
          <CardContent>
            <PerformanceChart data={performanceData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance de l'équipe</CardTitle>
          </CardHeader>
          <CardContent>
            <TeamPerformance {...teamPerformanceData} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des projets</CardTitle>
        </CardHeader>
        <CardContent>
          <ProjectReportTable
            projects={reportData?.projects || []}
            isLoading={projectsLoading}
          />
        </CardContent>
      </Card>
    </div>
  );
}; 