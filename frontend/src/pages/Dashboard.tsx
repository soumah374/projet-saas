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
  Loader2,
  AlertTriangle
} from "lucide-react";
import { useProjects } from '@/hooks/use-projects';
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
  const { data: projectsData, isLoading: isLoadingProjects } = useProjects();
  const projects = projectsData?.results || [];

  const summary = {
    projects: {
      total: projects.length,
      active: projects.filter(p => p.status !== 'Terminé').length,
      completed: projects.filter(p => p.status === 'Terminé').length,
      delayed: projects.filter(p => new Date(p.deadline) < new Date() && p.status !== 'Terminé').length
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "En cours":
        return "bg-blue-100 text-blue-600";
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
        return "bg-blue-100 text-blue-600";
      case "Basse":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoadingProjects) {
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
            <div className="text-2xl font-bold">{summary.projects.total}</div>
            <p className="text-xs text-muted-foreground">
              {summary.projects.active} actifs, {summary.projects.completed} terminés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projets actifs</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.projects.active}</div>
            <p className="text-xs text-muted-foreground">
              En cours de réalisation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projets terminés</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.projects.completed}</div>
            <p className="text-xs text-muted-foreground">
              Projets finalisés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projets en retard</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{summary.projects.delayed}</div>
            <p className="text-xs text-muted-foreground">
              Dépassement d'échéance
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Projets récents */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Projets récents</CardTitle>
            <CardDescription>
              Les derniers projets créés ou mis à jour
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {projects.slice(0, 5).map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  <div>
                    <div className="font-medium">{project.title}</div>
                    <div className="text-sm text-gray-500">{project.client}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(project.status)}>
                      {project.status}
                    </Badge>
                    <Badge className={getPriorityColor(project.priority)}>
                      {project.priority}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Budget</CardTitle>
            <CardDescription>
              Répartition du budget par projet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BudgetChart budgetDetails={{
              production: "0",
              personnel: "0",
              marketing: "0",
              other: "0",
              ...projects[0]?.budget_details || {}
            }} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 