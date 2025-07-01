import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Download,
  FileSpreadsheet,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { useProjectReports, useReportSummary, useExportReport, ReportFilters } from '@/hooks/use-reports';
import { ReportFilters as ReportFiltersComponent } from '@/components/reports/ReportFilters';
import { ReportStats } from '@/components/reports/ReportStats';
import { ProjectReportTable } from '@/components/reports/ProjectReportTable';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

export function ReportsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
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
  if (projectsError || summaryError) {
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Rapports</h1>
          <p className="text-gray-600">
            Analysez les performances et la productivité de votre équipe
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleExportPDF}>
            <Download className="w-4 h-4 mr-2" />
            Exporter PDF
          </Button>
          <Button variant="outline" onClick={handleExportExcel}>
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Exporter Excel
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

      {/* Actions rapides */}
      <Card>
        <CardHeader>
          <CardTitle>Actions rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              onClick={() => navigate('/projects')}
            >
              <TrendingUp className="w-6 h-6" />
              <span>Voir tous les projets</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 