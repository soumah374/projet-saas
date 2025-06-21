import { useState, useEffect } from 'react';
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
  Activity
} from "lucide-react";

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

interface Project {
  id: number;
  name: string;
  status: string;
  progress: number;
  due_date: string;
  team_size: number;
}

interface Task {
  id: number;
  title: string;
  status: string;
  priority: string;
  due_date: string;
  assigned_to: string;
}

export function Dashboard({ user }: DashboardProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    teamMembers: 0,
    upcomingDeadlines: 0
  });

  useEffect(() => {
    // Simuler le chargement des données
    const mockProjects: Project[] = [
      {
        id: 1,
        name: "Refonte du site web",
        status: "En cours",
        progress: 75,
        due_date: "2024-02-15",
        team_size: 5
      },
      {
        id: 2,
        name: "Application mobile",
        status: "Planifié",
        progress: 25,
        due_date: "2024-03-20",
        team_size: 8
      },
      {
        id: 3,
        name: "Base de données",
        status: "Terminé",
        progress: 100,
        due_date: "2024-01-30",
        team_size: 3
      }
    ];

    const mockTasks: Task[] = [
      {
        id: 1,
        title: "Révision du design",
        status: "En cours",
        priority: "Haute",
        due_date: "2024-02-10",
        assigned_to: "Marie Dupont"
      },
      {
        id: 2,
        title: "Tests d'intégration",
        status: "En attente",
        priority: "Moyenne",
        due_date: "2024-02-12",
        assigned_to: "Jean Martin"
      },
      {
        id: 3,
        title: "Documentation API",
        status: "Terminé",
        priority: "Basse",
        due_date: "2024-02-08",
        assigned_to: "Sophie Bernard"
      }
    ];

    setProjects(mockProjects);
    setTasks(mockTasks);
    setStats({
      totalProjects: mockProjects.length,
      activeProjects: mockProjects.filter(p => p.status === "En cours").length,
      completedProjects: mockProjects.filter(p => p.status === "Terminé").length,
      totalTasks: mockTasks.length,
      completedTasks: mockTasks.filter(t => t.status === "Terminé").length,
      pendingTasks: mockTasks.filter(t => t.status === "En attente").length,
      teamMembers: 12,
      upcomingDeadlines: 3
    });
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Terminé":
        return "bg-green-100 text-green-800";
      case "En cours":
        return "bg-blue-100 text-blue-800";
      case "Planifié":
        return "bg-yellow-100 text-yellow-800";
      case "En attente":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Haute":
        return "bg-red-100 text-red-800";
      case "Moyenne":
        return "bg-yellow-100 text-yellow-800";
      case "Basse":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

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
        <Button>
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
            <div className="text-2xl font-bold">{stats.totalProjects}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeProjects} actifs, {stats.completedProjects} terminés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tâches</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTasks}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completedTasks} terminées, {stats.pendingTasks} en attente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Équipe</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.teamMembers}</div>
            <p className="text-xs text-muted-foreground">
              Membres actifs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Échéances</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingDeadlines}</div>
            <p className="text-xs text-muted-foreground">
              Cette semaine
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
            {projects.map((project) => (
              <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">{project.name}</h4>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge className={getStatusColor(project.status)}>
                      {project.status}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {project.team_size} membres
                    </span>
                  </div>
                  <div className="mt-2">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progression</span>
                      <span>{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} className="h-2" />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Tâches récentes */}
        <Card>
          <CardHeader>
            <CardTitle>Tâches récentes</CardTitle>
            <CardDescription>
              Vos tâches en cours
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">{task.title}</h4>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge className={getStatusColor(task.status)}>
                      {task.status}
                    </Badge>
                    <Badge className={getPriorityColor(task.priority)}>
                      {task.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Assigné à {task.assigned_to}
                  </p>
                  <p className="text-sm text-gray-500">
                    Échéance: {new Date(task.due_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
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
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center text-gray-500">
              <BarChart3 className="w-12 h-12 mx-auto mb-2" />
              <p>Graphique d'activité</p>
              <p className="text-sm">Intégration des graphiques en cours</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 