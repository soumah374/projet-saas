import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2,
  Eye,
  FileText,
  MoreHorizontal,
  Edit,
  BarChart3,
  Trash2
} from "lucide-react";
import { CreateProjectModal } from "@/components/CreateProjectModal";
import { useProjects, useCreateProject, useProjectStatistics, useUpdateProject } from "@/hooks/use-projects";
import { useBackendStatus } from "@/hooks/use-backend-status";
import type { ProjectList, CreateProjectForm } from "@/lib/types";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { EditProjectModal } from '@/components/EditProjectModal';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export function ProjectManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const navigate = useNavigate();

  // React Query hooks
  const { data: backendStatus, isLoading: backendLoading } = useBackendStatus();
  const { data: projects, isLoading: projectsLoading, error: projectsError } = useProjects({
    search: searchTerm || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    type: typeFilter !== 'all' ? typeFilter : undefined,
    priority: priorityFilter !== 'all' ? priorityFilter : undefined,
    ordering: '-created_at'
  });

  const { data: statistics, isLoading: statsLoading } = useProjectStatistics();
  const createProjectMutation = useCreateProject();
  const updateProjectMutation = useUpdateProject();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Planification':
        return 'bg-blue-100 text-blue-800';
      case 'En cours':
        return 'bg-yellow-100 text-yellow-800';
      case 'Production':
        return 'bg-purple-100 text-purple-800';
      case 'En pause':
        return 'bg-gray-100 text-gray-800';
      case 'Terminé':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgente':
        return 'bg-red-100 text-red-800';
      case 'Haute':
        return 'bg-orange-100 text-orange-800';
      case 'Normale':
        return 'bg-blue-100 text-blue-800';
      case 'Basse':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'text-green-600';
    if (progress >= 60) return 'text-yellow-600';
    if (progress >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getProgressBgColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-600';
    if (progress >= 60) return 'bg-yellow-600';
    if (progress >= 40) return 'bg-orange-600';
    return 'bg-red-600';
  };

  const handleProjectCreate = async (projectData: any) => {
    try {
      await createProjectMutation.mutateAsync(projectData);
    } catch (error) {
      console.error('Erreur lors de la création du projet:', error);
    }
  };

  const handleProjectUpdate = async (projectId: string, data: Partial<CreateProjectForm>) => {
    try {
      await updateProjectMutation.mutateAsync({ id: projectId, data });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du projet:', error);
    }
  };

  const filteredProjects = projects?.results || [];

  const renderActionButtons = (project: ProjectList) => (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => navigate(`/projects/${project.id}`)}
        className="text-blue-600 hover:text-blue-700"
      >
        <Eye className="h-4 w-4 mr-1" />
        Détails
      </Button>
      
      <EditProjectModal 
        project={project} 
        onProjectUpdate={handleProjectUpdate}
      >
        <Button
          variant="outline"
          size="sm"
          className="text-green-600 hover:text-green-700"
        >
          <Edit className="h-4 w-4 mr-1" />
          Modifier
        </Button>
      </EditProjectModal>
      <Button
        variant="outline"
        size="sm"
        onClick={() => navigate(`/projects/${project.id}/documents`)}
        className="text-orange-600 hover:text-orange-700"
      >
        <FileText className="h-4 w-4 mr-1" />
        Documents
      </Button>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => navigate(`/projects/${project.id}/team`)}>
            <Users className="h-4 w-4 mr-2" />
            Équipe
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate(`/projects/${project.id}/reports`)}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Rapports
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate(`/projects/${project.id}/calendar`)}>
            <Calendar className="h-4 w-4 mr-2" />
            Calendrier
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-red-600">
            <Trash2 className="h-4 w-4 mr-2" />
            Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Projets</h1>
          <p className="text-gray-600 mt-1">Gérez et suivez tous vos projets SAKOM</p>
        </div>
        <CreateProjectModal onProjectCreate={handleProjectCreate}>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Nouveau Projet
          </Button>
        </CreateProjectModal>
      </div>

      {/* Statistics Cards */}
      {!statsLoading && statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Projets</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.total_projects}</div>
              <p className="text-xs text-muted-foreground">
                Tous les projets
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Projets Actifs</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.active_projects}</div>
              <p className="text-xs text-muted-foreground">
                En cours de réalisation
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Projets Terminés</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.completed_projects}</div>
              <p className="text-xs text-muted-foreground">
                Projets finalisés
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Projets en Retard</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{statistics.overdue_projects}</div>
              <p className="text-xs text-muted-foreground">
                Dépassement d'échéance
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Rechercher un projet..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="Planification">Planification</SelectItem>
            <SelectItem value="En cours">En cours</SelectItem>
            <SelectItem value="Production">Production</SelectItem>
            <SelectItem value="En pause">En pause</SelectItem>
            <SelectItem value="Terminé">Terminé</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            <SelectItem value="Événementiel">Événementiel</SelectItem>
            <SelectItem value="Communication">Communication</SelectItem>
            <SelectItem value="Audiovisuel">Audiovisuel</SelectItem>
            <SelectItem value="Production">Production</SelectItem>
            <SelectItem value="Digital">Digital</SelectItem>
            <SelectItem value="Conseil">Conseil</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Priorité" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les priorités</SelectItem>
            <SelectItem value="Urgente">Urgente</SelectItem>
            <SelectItem value="Haute">Haute</SelectItem>
            <SelectItem value="Normale">Normale</SelectItem>
            <SelectItem value="Basse">Basse</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Projects Grid */}
      {projectsLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : projectsError ? (
        <div className="text-center py-12">
          <p className="text-red-600">Erreur lors du chargement des projets</p>
          {backendStatus && !backendStatus.isOnline && (
            <p className="text-sm text-gray-600 mt-2">
              Vérifiez que le serveur backend est en cours d'exécution
            </p>
          )}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-12">
          <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun projet trouvé</h3>
          <p className="text-gray-600">Commencez par créer votre premier projet.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{project.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {project.client}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={getStatusColor(project.status)}>
                      {project.status}
                    </Badge>
                    <Badge className={getPriorityColor(project.priority)}>
                      {project.priority}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Project Info */}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Type</span>
                    <span className="font-medium">{project.type}</span>
                  </div>
                  
                  {/* Progress */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Progression</span>
                      <span className={`font-medium ${getProgressColor(project.progress)}`}>
                        {project.progress}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${getProgressBgColor(project.progress)}`}
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Team */}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Équipe</span>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">{project.team_count || 0}</span>
                    </div>
                  </div>

                  {/* Budget - Not available in ProjectList type */}
                  {/* <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Budget</span>
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">
                        {parseInt(project.budget).toLocaleString()} GNF
                      </span>
                    </div>
                  </div> */}

                  {/* Deadline */}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Échéance</span>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className={`font-medium ${project.is_overdue ? 'text-red-600' : ''}`}>
                        {format(new Date(project.deadline), 'dd/MM/yyyy', { locale: fr })}
                      </span>
                    </div>
                  </div>

                  {/* Days remaining */}
                  {project.days_remaining && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Jours restants</span>
                      <span className={`font-medium ${project.is_overdue === 'true' ? 'text-red-600' : ''}`}>
                        {project.days_remaining}
                      </span>
                    </div>
                  )}

                  {/* Created by */}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Créé par</span>
                    <span className="font-medium">
                      {project.created_by.first_name} {project.created_by.last_name}
                    </span>
                  </div>

                  {/* Created date */}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Créé le</span>
                    <span>{format(new Date(project.created_at), 'dd/MM/yyyy', { locale: fr })}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 border-t border-gray-100 mt-4">
                  {renderActionButtons(project)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
