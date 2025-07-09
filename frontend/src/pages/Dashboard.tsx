import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  FolderOpen, 
  Calendar, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  AlertCircle,
  BarChart3,
  Activity,
  Loader2
} from "lucide-react";
import { useProjectStatistics } from '@/hooks/use-projects';
import { useProjectReports, useReportSummary } from '@/hooks/use-reports';
import { useNavigate } from 'react-router-dom';
import { BudgetChart } from '@/components/BudgetChart';

interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  is_staff: boolean;
}

interface DashboardProps {
  user: User;
}

export function Dashboard({ user }: DashboardProps) {
  const navigate = useNavigate();
  const { data: statistics, isLoading: isLoadingStats } = useProjectStatistics();
  const { data: reports } = useProjectReports();
  const { data: summary } = useReportSummary();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "En cours":
        return "bg-blue-100 text-blue-800";
      case "En pause":
        return "bg-gray-100 text-gray-800";
      case "Terminé":
        return "bg-green-100 text-green-800";
      case "Planification":
        return "bg-yellow-100 text-yellow-800";
      case "Production":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Urgente":
        return "bg-red-100 text-red-800";
      case "Haute":
        return "bg-orange-100 text-orange-800";
      case "Normale":
        return "bg-blue-100 text-blue-800";
      case "Basse":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoadingStats) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Tableau de bord
          </h1>
          <p className="text-gray-600">
            Bonjour {user.first_name}, voici un aperçu de vos activités
          </p>
        </div>
        <Button onClick={() => navigate('/reports')}>
          <Activity className="w-4 h-4 mr-2" />
          Voir les rapports
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projets totaux</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics?.total_projects || 0}</div>
            <p className="text-xs text-muted-foreground">
              {statistics?.active_projects || 0} actifs, {statistics?.completed_projects || 0} terminés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tâches</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.tasks?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {summary?.tasks?.completed || 0} terminées, {summary?.tasks?.pending || 0} en attente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Équipe</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.team?.total_members || 0}</div>
            <p className="text-xs text-muted-foreground">
              {summary?.team?.active_projects || 0} projets actifs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Échéances</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.projects?.delayed || 0}</div>
            <p className="text-xs text-muted-foreground">
              Projets en retard
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Projets récents et Tâches */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Projets récents */}
        <Card>
          <CardHeader>
            <CardTitle>Projets récents</CardTitle>
            <CardDescription>
              Aperçu des projets en cours
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {reports?.slice(0, 5).map((project) => (
              <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">{project.title}</h4>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge className={getStatusColor(project.status)}>
                      {project.status}
                    </Badge>
                    <Badge className={getPriorityColor(project.priority)}>
                      {project.priority}
                    </Badge>
                  </div>
                  <div className="mt-2">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progression</span>
                      <span>{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} className="h-2" />
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    {project.team_members_count} membres • {project.tasks_completed}/{project.tasks_total} tâches
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Budget et Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Budget et Performance</CardTitle>
            <CardDescription>
              Vue d'ensemble des budgets et de la performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            {summary && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Budget total alloué</span>
                    <span className="font-medium">{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(summary.budget.total_allocated)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Budget dépensé</span>
                    <span className="font-medium">{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(summary.budget.total_spent)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Budget restant</span>
                    <span className="font-medium text-green-600">{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(summary.budget.remaining)}</span>
                  </div>
                </div>

                <div className="h-[200px]">
                  <BudgetChart
                    allocated={summary.budget.total_allocated}
                    spent={summary.budget.total_spent}
                    remaining={summary.budget.remaining}
                  />
                </div>

                <div className="space-y-2 pt-4 border-t">
                  <div className="flex justify-between text-sm">
                    <span>Taux de complétion des tâches</span>
                    <span className="font-medium">{summary.tasks.completion_rate}%</span>
                  </div>
                  <Progress value={summary.tasks.completion_rate} className="h-2" />
                  
                  <div className="flex justify-between text-sm mt-4">
                    <span>Productivité moyenne de l'équipe</span>
                    <span className="font-medium">{summary.team.avg_productivity}%</span>
                  </div>
                  <Progress value={summary.team.avg_productivity} className="h-2" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Graphique d'activité */}
      <Card>
        <CardHeader>
          <CardTitle>Activité récente</CardTitle>
          <CardDescription>
            Progression des projets sur les 30 derniers jours
          </CardDescription>
        </CardHeader>
        <CardContent>
          {summary?.timeline ? (
            <div className="h-[300px]">
              {/* Ici, vous pouvez intégrer un composant de graphique comme recharts ou chart.js */}
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="text-sm font-medium">Projets terminés</div>
                  <div className="text-2xl font-bold">{summary.projects.completed}</div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Tâches complétées</div>
                  <div className="text-2xl font-bold">{summary.tasks.completed}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center text-gray-500">
                <BarChart3 className="w-12 h-12 mx-auto mb-2" />
                <p>Graphique d'activité</p>
                <p className="text-sm">Données non disponibles</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 