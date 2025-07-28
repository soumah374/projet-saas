import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft,
  Download,
  FileSpreadsheet,
  Calendar,
  Users,
  DollarSign,
  Target,
  Clock,
  AlertCircle,
  CheckCircle,
  Activity
} from "lucide-react";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useProjectReports, useExportReport, ReportFilters } from '@/hooks/use-reports';
import { useProjects } from '@/hooks/use-projects';
import { useToast } from '@/hooks/use-toast';

export function ProjectReportPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const projectId = id || '';

  // Récupérer les données du projet
  const { data: projectsData } = useProjects();
  const projects = projectsData?.results || [];
  const project = projects.find(p => p.id.toString() === id);

  // Filtres pour ce projet spécifique
  const [filters] = useState<ReportFilters>({});

  // Récupérer les données de rapport pour ce projet
  const { 
    data: projectReports = [], 
    isLoading: reportsLoading 
  } = useProjectReports(filters);

  const projectReport = projectReports.find(p => p.id === projectId);

  const { exportPDF, exportExcel } = useExportReport();

  const handleExportPDF = async () => {
    try {
      await exportPDF(filters);
      toast({
        title: "Export réussi",
        description: "Le rapport PDF du projet a été téléchargé.",
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
      await exportExcel(filters);
      toast({
        title: "Export réussi",
        description: "Le rapport Excel du projet a été téléchargé.",
      });
    } catch (error) {
      toast({
        title: "Erreur d'export",
        description: "Impossible d'exporter le rapport Excel.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'terminé':
        return 'bg-green-100 text-green-800';
      case 'en cours':
        return 'bg-blue-100 text-blue-600';
      case 'en pause':
        return 'bg-yellow-100 text-yellow-800';
      case 'planification':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'urgente':
        return 'bg-red-100 text-red-800';
      case 'haute':
        return 'bg-orange-100 text-orange-800';
      case 'normale':
        return 'bg-blue-100 text-blue-600';
      case 'basse':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('fr-GN', {
      style: 'currency',
      currency: 'GNF',
      minimumFractionDigits: 0,
    }).format(numAmount);
  };

  const isOverdue = (deadline: string) => {
    return new Date(deadline) < new Date();
  };

  if (reportsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={() => navigate('/projects')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Rapport du projet</h1>
              <p className="text-gray-600">Chargement...</p>
            </div>
          </div>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!project && !projectReport) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={() => navigate('/projects')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Rapport du projet</h1>
              <p className="text-gray-600">Projet non trouvé</p>
            </div>
          </div>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Projet non trouvé
              </h3>
              <p className="text-gray-600 mb-4">
                Le projet demandé n'existe pas ou vous n'avez pas les permissions pour le voir.
              </p>
              <Button onClick={() => navigate('/projects')}>
                Retour aux projets
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const displayProject = projectReport || project;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => navigate('/projects')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Rapport du projet</h1>
            <p className="text-gray-600">{displayProject.title}</p>
          </div>
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

      {/* Informations générales du projet */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="w-5 h-5" />
            <span>Informations générales</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-500">Statut</label>
              <div className="mt-1">
                <Badge className={getStatusColor(displayProject.status)}>
                  {displayProject.status}
                </Badge>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Priorité</label>
              <div className="mt-1">
                <Badge className={getPriorityColor(displayProject.priority)}>
                  {displayProject.priority}
                </Badge>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Progression</label>
              <div className="mt-1">
                <div className="flex items-center space-x-2">
                  <Progress value={displayProject.progress} className="flex-1" />
                  <span className="text-sm font-medium">{displayProject.progress}%</span>
                </div>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Budget</label>
              <div className="mt-1 flex items-center space-x-1">
                <DollarSign className="w-4 h-4 text-gray-400" />
                                 <span className="font-medium">
                   {formatCurrency((displayProject as any).budget || 0)}
                 </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métriques du projet */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Échéance */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Échéance</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {displayProject.deadline 
                ? format(new Date(displayProject.deadline), 'dd/MM/yyyy', { locale: fr })
                : 'Non définie'
              }
            </div>
            {displayProject.deadline && (
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                {isOverdue(displayProject.deadline) ? (
                  <>
                    <AlertCircle className="w-3 h-3 text-red-500" />
                    <span className="text-red-600">En retard</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    <span className="text-green-600">À temps</span>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Équipe */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Équipe</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {projectReport?.team_members_count || 0}
            </div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <Activity className="w-3 h-3 text-blue-600" />
              <span>Membres actifs</span>
            </div>
          </CardContent>
        </Card>

        {/* Activités */}
        {projectReport && (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Activités</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {projectReport.tasks_completed}/{projectReport.tasks_total}
                </div>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <Target className="w-3 h-3 text-green-500" />
                  <span>
                    {Math.round((projectReport.tasks_completed / projectReport.tasks_total) * 100)}% terminées
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Retards</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {projectReport.tasks_overdue}
                </div>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <AlertCircle className="w-3 h-3 text-red-500" />
                  <span>Activités en retard</span>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Détails du chef de projet */}
      {projectReport?.manager && (
        <Card>
          <CardHeader>
            <CardTitle>Chef de projet</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="font-medium">
                  {projectReport.manager.first_name} {projectReport.manager.last_name}
                </div>
                <div className="text-sm text-gray-500">
                  {projectReport.manager.email}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center space-y-2"
              onClick={() => navigate(`/projects/${projectId}`)}
            >
              <Target className="w-6 h-6" />
              <span>Voir le projet</span>
            </Button>
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 