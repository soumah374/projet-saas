import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Download,
  FileSpreadsheet,
  TrendingUp,
  AlertCircle,
  BarChart3,
  PieChart,
  Calendar,
  Users,
  FileText
} from "lucide-react";
import { useProjectReports, useReportSummary, useExportReport, ReportFilters } from '@/hooks/use-reports';
import { useTeamPerformance } from '@/hooks/use-team-stats';
import { ReportFilters as ReportFiltersComponent } from '@/components/reports/ReportFilters';
import { ReportStats } from '@/components/reports/ReportStats';
import { ProjectReportTable } from '@/components/reports/ProjectReportTable';
import { PerformanceChart } from '@/components/reports/PerformanceChart';
import { TeamPerformance } from '@/components/reports/TeamPerformance';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

export function ReportsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [filters, setFilters] = useState<ReportFilters>({});
  const [appliedFilters, setAppliedFilters] = useState<ReportFilters>({});

  // Hooks pour récupérer les données
  const { 
    data: projects = [], 
    isLoading: projectsLoading, 
    error: projectsError 
  } = useProjectReports(appliedFilters);

  const { 
    data: summary, 
    isLoading: summaryLoading, 
    error: summaryError 
  } = useReportSummary(appliedFilters);

  const {
    data: teamStats,
    isLoading: teamLoading,
    error: teamError
  } = useTeamPerformance();

  const { exportPDF, exportExcel } = useExportReport();

  const handleApplyFilters = () => {
    setAppliedFilters({ ...filters });
  };

  const handleResetFilters = () => {
    setFilters({});
    setAppliedFilters({});
  };

  const handleViewProject = (projectId: number) => {
    navigate(`/projects/${projectId}`);
  };

  const handleExportPDF = async () => {
    try {
      await exportPDF(appliedFilters);
      toast({
        title: "Export réussi",
        description: "Le rapport PDF a été téléchargé avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur d'export",
        description: "Impossible d'exporter le rapport PDF.",
        variant: "destructive",
      });
    }
  };

  const handleExportExcel = async () => {
    try {
      await exportExcel(appliedFilters);
      toast({
        title: "Export réussi",
        description: "Le rapport Excel a été téléchargé avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur d'export",
        description: "Impossible d'exporter le rapport Excel.",
        variant: "destructive",
      });
    }
  };

  // Affichage des erreurs
  if (projectsError || summaryError || teamError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Rapports</h1>
            <p className="text-gray-600">
              Analysez les performances et la productivité de votre équipe
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Erreur de chargement des données
              </h3>
              <p className="text-gray-600 mb-4">
                Impossible de charger les données de rapport. Veuillez réessayer.
              </p>
              <Button onClick={() => window.location.reload()}>
                Réessayer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Rapports</h1>
          <p className="text-gray-600">
            Analysez les performances et la productivité de votre équipe
          </p>
        </div>
        <div className="flex flex-col space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0">
          <Button variant="outline" onClick={handleExportPDF}>
            <Download className="w-4 h-4 mr-2" />
            PDF
          </Button>
          <Button variant="outline" onClick={handleExportExcel}>
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Excel
          </Button>
          <Button variant="default" onClick={() => setActiveTab("overview")}>
            <BarChart3 className="w-4 h-4 mr-2" />
            Vue d'ensemble
          </Button>
        </div>
      </div>

      {/* Filtres */}
      <ReportFiltersComponent
        filters={filters}
        onFiltersChange={setFilters}
        onApplyFilters={handleApplyFilters}
        onResetFilters={handleResetFilters}
      />

      {/* Contenu principal */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 gap-4">
          <TabsTrigger value="overview" className="data-[state=active]:bg-blue-50">
            <BarChart3 className="w-4 h-4 mr-2" />
            Vue d'ensemble
          </TabsTrigger>
          <TabsTrigger value="performance" className="data-[state=active]:bg-blue-50">
            <TrendingUp className="w-4 h-4 mr-2" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="team" className="data-[state=active]:bg-blue-50">
            <Users className="w-4 h-4 mr-2" />
            Équipe
          </TabsTrigger>
          <TabsTrigger value="documents" className="data-[state=active]:bg-blue-50">
            <FileText className="w-4 h-4 mr-2" />
            Documents
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Statistiques principales */}
          {summary ? (
            <ReportStats 
              summary={summary} 
              isLoading={summaryLoading} 
            />
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Chargement des statistiques...</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tableau détaillé des projets */}
          <ProjectReportTable
            projects={projects}
            isLoading={projectsLoading}
            onViewProject={handleViewProject}
            onExportData={handleExportExcel}
          />
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          {summary && !summaryLoading ? (
            <PerformanceChart 
              data={{
                timeline: summary.timeline,
                team: {
                  avg_productivity: summary.team.avg_productivity
                }
              }}
            />
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Chargement des graphiques...</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          {teamStats && !teamLoading ? (
            <TeamPerformance
              members={teamStats.members}
              topPerformers={teamStats.topPerformers}
              averageProductivity={teamStats.averageProductivity}
              totalTasks={teamStats.totalTasks}
              completedTasks={teamStats.completedTasks}
              activeProjects={teamStats.activeProjects}
            />
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Chargement des données d'équipe...</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Documents et rapports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex flex-col items-center space-y-2"
                  onClick={handleExportPDF}
                >
                  <Download className="w-6 h-6" />
                  <span>Rapport mensuel (PDF)</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex flex-col items-center space-y-2"
                  onClick={handleExportExcel}
                >
                  <FileSpreadsheet className="w-6 h-6" />
                  <span>Données brutes (Excel)</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex flex-col items-center space-y-2"
                  onClick={() => navigate('/documents')}
                >
                  <FileText className="w-6 h-6" />
                  <span>Tous les documents</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Actions rapides */}
      <Card>
        <CardHeader>
          <CardTitle>Actions rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center space-y-2"
              onClick={handleExportPDF}
            >
              <Download className="w-6 h-6" />
              <span>Exporter PDF</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center space-y-2"
              onClick={handleExportExcel}
            >
              <FileSpreadsheet className="w-6 h-6" />
              <span>Exporter Excel</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center space-y-2"
              onClick={() => navigate('/calendar')}
            >
              <Calendar className="w-6 h-6" />
              <span>Planning</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center space-y-2"
              onClick={() => navigate('/projects')}
            >
              <TrendingUp className="w-6 h-6" />
              <span>Projets</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 