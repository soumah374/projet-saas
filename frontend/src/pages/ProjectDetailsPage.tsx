import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { DocumentManager } from "@/components/DocumentManager";
import { 
  ArrowLeft, 
  Edit, 
  Users, 
  Calendar, 
  DollarSign, 
  FileText, 
  MessageSquare,
  CheckCircle,
  Clock,
  AlertTriangle,
  Loader2,
  Plus,
  Trash2,
  Share2,
  User
} from "lucide-react";
import { useProject, useUpdateProject, useDeleteProject, useCreateProjectTask, useUpdateProjectTask, useDeleteProjectTask } from "@/hooks/use-projects";
import { useUsers } from "@/hooks/use-users";
import type { CreateProjectForm, CreateTaskForm, ProjectTaskStatus } from "@/lib/types";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import { EditProjectModal } from '@/components/EditProjectModal';
import { TaskModal } from '@/components/TaskModal';
import { UpdateBudgetModal } from '@/components/UpdateBudgetModal';
import { BudgetChart } from '@/components/BudgetChart';
import { ProjectCalendar } from '@/components/ProjectCalendar';
import { TeamMembersList } from '@/components/TeamMembersList';
import { TaskDeadlineAlert } from '@/components/TaskDeadlineAlert';
import { Separator } from '@/components/ui/separator';

export function ProjectDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  // React Query hooks
  const { data: project, isLoading, error } = useProject(id || '');
  const { data: users } = useUsers({ is_active: true });
  const updateProjectMutation = useUpdateProject();
  const deleteProjectMutation = useDeleteProject();
  const createTaskMutation = useCreateProjectTask();
  const updateTaskMutation = useUpdateProjectTask();
  const deleteTaskMutation = useDeleteProjectTask();

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

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'Terminé':
        return 'bg-green-100 text-green-800';
      case 'En cours':
        return 'bg-yellow-100 text-yellow-800';
      case 'À faire':
        return 'bg-gray-100 text-gray-800';
      case 'En pause':
        return 'bg-orange-100 text-orange-800';
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

  const handleDeleteProject = async () => {
    if (!project || !confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) return;
    
    try {
      await deleteProjectMutation.mutateAsync(project.id);
      toast.success('Projet supprimé avec succès');
      navigate('/projects');
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  const handleProjectUpdate = async (projectId: string, data: Partial<CreateProjectForm>) => {
    try {
      await updateProjectMutation.mutateAsync({ id: projectId, data });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du projet:', error);
    }
  };

  const handleTaskSave = async (taskData: any) => {
    if (!id) return;

    try {
      if ('id' in taskData) {
        // Update existing task
        await updateTaskMutation.mutateAsync({
          projectId: id,
          taskId: taskData.id,
          data: taskData
        });
      } else {
        // Create new task
        await createTaskMutation.mutateAsync({
          projectId: id,
          data: taskData
        });
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la tâche:', error);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!id || !confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) return;

    try {
      await deleteTaskMutation.mutateAsync({
        projectId: id,
        taskId: taskId
      });
    } catch (error) {
      console.error('Erreur lors de la suppression de la tâche:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Erreur lors du chargement du projet</p>
        <Button onClick={() => navigate('/projects')} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour aux projets
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/projects')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{project.title}</h1>
            <p className="text-gray-600 mt-1">ID: {project.id}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <EditProjectModal 
            project={{
              id: project.id,
              title: project.title,
              description: project.description,
              objectives: project.objectives,
              type: project.type,
              category: project.category,
              status: project.status,
              priority: project.priority,
              start_date: project.start_date,
              deadline: project.deadline,
              budget: project.budget,
              client: project.client,
              created_by: project.created_by,
              team_members: project.team_members,
              budget_details: project.budget_details,
              tasks: project.tasks,
              tags: project.tags,
              days_remaining: project.days_remaining,
              is_overdue: project.is_overdue,
              created_at: project.created_at,
              updated_at: project.updated_at,
              progress: project.progress
            }} 
            onProjectUpdate={handleProjectUpdate}
          >
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Edit className="w-4 h-4 mr-2" />
              Modifier
            </Button>
          </EditProjectModal>
          <Button 
            variant="outline" 
            onClick={handleDeleteProject}
            disabled={deleteProjectMutation.isPending}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Supprimer
          </Button>
        </div>
      </div>

      <TaskDeadlineAlert projectId={project.id} />

      {/* Project Status */}
      <div className="flex flex-wrap gap-2">
        <Badge className={getStatusColor(project.status)}>
          {project.status}
        </Badge>
        <Badge className={getPriorityColor(project.priority)}>
          {project.priority}
        </Badge>
        <Badge variant="outline">
          {project.type}
        </Badge>
        {project.category && (
          <Badge variant="outline">
            {project.category}
          </Badge>
        )}
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Progression du projet</span>
            <span className={`text-sm font-medium ${getProgressColor(project.progress)}`}>
              {project.progress}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${getProgressBgColor(project.progress)}`}
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="team">Équipe</TabsTrigger>
          <TabsTrigger value="tasks">Tâches</TabsTrigger>
          <TabsTrigger value="budget">Budget</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Project Details */}
            <Card>
              <CardHeader>
                <CardTitle>Détails du projet</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Description</label>
                  <p className="mt-1">{project.description}</p>
                </div>
                {project.objectives && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Objectifs</label>
                    <p className="mt-1">{project.objectives}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Client</label>
                    <p className="mt-1">{project.client}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Créé par</label>
                    <p className="mt-1">{project.created_by.first_name} {project.created_by.last_name}</p>
                  </div>
                </div>
                {project.tags && project.tags.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Tags</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {project.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Calendrier</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">Date de début</p>
                    <p className="text-sm text-gray-600">
                      {project.start_date ? format(new Date(project.start_date), 'dd/MM/yyyy', { locale: fr }) : 'Non définie'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">Date d'échéance</p>
                    <p className={`text-sm ${project.is_overdue ? 'text-red-600' : 'text-gray-600'}`}>
                      {format(new Date(project.deadline), 'dd/MM/yyyy', { locale: fr })}
                    </p>
                  </div>
                </div>
                {project.days_remaining && (
                  <div className="flex items-center gap-3">
                    {project.is_overdue ? (
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                    <div>
                      <p className="text-sm font-medium">Jours restants</p>
                      <p className={`text-sm ${project.is_overdue ? 'text-red-600' : 'text-gray-600'}`}>
                        {project.days_remaining}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">Créé le</p>
                    <p className="text-sm text-gray-600">
                      {format(new Date(project.created_at), 'dd/MM/yyyy', { locale: fr })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Équipe du projet ({project.team_members?.length || 0} membres)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {project.team_members && project.team_members.length > 0 ? (
                <div className="space-y-4">
                  {project.team_members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {member.user.first_name[0]}{member.user.last_name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {member.user.first_name} {member.user.last_name}
                          </p>
                          <p className="text-sm text-gray-600">{member.user.email}</p>
                        </div>
                      </div>
                      <Badge variant="outline">{member.role}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Aucun membre assigné à ce projet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Tâches du projet ({project.tasks?.length || 0} tâches)
                </CardTitle>
                <TaskModal 
                  projectId={project.id}
                  onTaskSave={handleTaskSave}
                  mode="create"
                >
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Nouvelle tâche
                  </Button>
                </TaskModal>
              </div>
            </CardHeader>
            <CardContent>
              {project.tasks && project.tasks.length > 0 ? (
                <div className="space-y-4">
                  {project.tasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex-1 cursor-pointer">
                        <TaskModal 
                          task={task}
                          projectId={project.id}
                          mode="view"
                        >
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-medium text-lg">{task.title}</h4>
                              <Badge className={getTaskStatusColor(task.status)}>
                                {task.status}
                              </Badge>
                            </div>
                            {task.description && (
                              <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                            )}
                            <div className="flex items-center gap-6 text-sm text-gray-500">
                              {task.assigned_to && (
                                <div className="flex items-center gap-2">
                                  <User className="w-4 h-4" />
                                  <span>Assigné à: {task.assigned_to.first_name} {task.assigned_to.last_name}</span>
                                </div>
                              )}
                              {task.due_date && (
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4" />
                                  <span>Échéance: {format(new Date(task.due_date), 'dd/MM/yyyy', { locale: fr })}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <span>Créée le: {format(new Date(task.created_at), 'dd/MM/yyyy', { locale: fr })}</span>
                              </div>
                            </div>
                          </div>
                        </TaskModal>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <TaskModal 
                          task={task}
                          projectId={project.id}
                          onTaskSave={handleTaskSave}
                          mode="edit"
                        >
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </TaskModal>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteTask(task.id)}
                          disabled={deleteTaskMutation.isPending}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">Aucune tâche créée pour ce projet</p>
                  <TaskModal 
                    projectId={project.id}
                    onTaskSave={handleTaskSave}
                    mode="create"
                  >
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Créer la première tâche
                    </Button>
                  </TaskModal>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="budget" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Budget Overview */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Budget total
                  </CardTitle>
                  <UpdateBudgetModal
                    projectId={project.id}
                    currentBudget={{
                      total: project.budget || '0',
                      details: {
                        production: project.budget_details?.production || '0',
                        personnel: project.budget_details?.personnel || '0',
                        marketing: project.budget_details?.marketing || '0',
                        other: project.budget_details?.other || '0'
                      }
                    }}
                    onBudgetUpdate={handleProjectUpdate}
                  >
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4 mr-2" />
                      Modifier le budget
                    </Button>
                  </UpdateBudgetModal>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600 mb-4">
                  {project.budget ? `${parseInt(project.budget).toLocaleString()} GNF` : 'Non défini'}
                </div>
                {project.budget_details && (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Production</span>
                      <span className="text-sm font-medium">{project.budget_details.production.toLocaleString()} GNF</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Personnel</span>
                      <span className="text-sm font-medium">{project.budget_details.personnel.toLocaleString()} GNF</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Marketing</span>
                      <span className="text-sm font-medium">{project.budget_details.marketing.toLocaleString()} GNF</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Autres</span>
                      <span className="text-sm font-medium">{project.budget_details.other.toLocaleString()} GNF</span>
                    </div>
                    <div className="border-t pt-3">
                      <div className="flex justify-between font-medium">
                        <span>Total</span>
                        <span>{project.budget_details.total.toLocaleString()} GNF</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Budget Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Répartition du budget</CardTitle>
              </CardHeader>
              <CardContent>
                {project.budget_details ? (
                  <BudgetChart budgetDetails={project.budget_details} />
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Aucune donnée budgétaire disponible
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <DocumentManager projectId={id || ''} />
        </TabsContent>
      </Tabs>
    </div>
  );
} 