import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Users,
  Calendar as CalendarIcon,
  Clock,
  Edit,
  Play,
  Eye,
  UserPlus,
  GripVertical,
  View,
  Trash2,
  CalendarPlus
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { TaskModal } from '../TaskModal';
import { StartTaskProjectModal } from '../StartTaskProjectModal';
import type { ProjectTask } from '@/lib/types';
import { TaskDetailModal } from './TaskDetailModal';
import { useProjectLifecycle } from '@/hooks/use-project-lifecycle';
import { useDeleteProjectTask, useUpdateProjectTask } from '@/hooks/use-projects';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { usePermissions } from '@/hooks/use-permissions';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

interface ProjectKanbanViewProps {
  tasks: ProjectTask[];
  projectId: string;
  onOpenAssignmentDialog?: (task: ProjectTask) => void;
}

interface KanbanColumn {
  id: string;
  title: string;
  status: string;
  color: string;
  bgColor: string;
}

const columns: KanbanColumn[] = [
  {
    id: 'todo',
    title: 'À faire',
    status: 'À faire',
    color: 'text-gray-700',
    bgColor: 'bg-gray-50'
  },
  {
    id: 'in-progress',
    title: 'En cours',
    status: 'En cours',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50'
  },
  {
    id: 'paused',
    title: 'En pause',
    status: 'En pause',
    color: 'text-orange-700',
    bgColor: 'bg-orange-50'
  },
  {
    id: 'done',
    title: 'Terminé',
    status: 'Terminé',
    color: 'text-green-700',
    bgColor: 'bg-green-50'
  }
];

export function ProjectKanbanView({ tasks, projectId, onOpenAssignmentDialog }: ProjectKanbanViewProps) {
  const [draggedTask, setDraggedTask] = useState<ProjectTask | null>(null);
  const [selectedTaskForDetails, setSelectedTaskForDetails] = useState<any>(null);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);
  const [datePopoverOpen, setDatePopoverOpen] = useState<number | null>(null);

  const { updateTaskStatus } = useProjectLifecycle(projectId);
  const deleteTaskMutation = useDeleteProjectTask();
  const updateTaskMutation = useUpdateProjectTask();

  const {
    hasPermission
  } = usePermissions();

  const getTasksByStatus = (status: string) => {
    return tasks?.filter(task => task.status === status) || [];
  };

  const handleDragStart = (task: ProjectTask) => {
    setDraggedTask(task);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (status: string) => {
    if (!draggedTask) return;

    // Ne rien faire si la tâche est déjà dans ce statut
    if (draggedTask.status === status) {
      setDraggedTask(null);
      return;
    }

    try {
      await updateTaskStatus(
        Number(draggedTask.id),
        status as 'À faire' | 'En cours' | 'En pause' | 'Terminé'
      );
      toast.success(`Tâche déplacée vers "${status}"`);
    } catch (error) {
      console.error('Error updating task status:', error);
      toast.error('Erreur lors de la mise à jour du statut');
    } finally {
      setDraggedTask(null);
    }
  };

  const handleDeleteTask = async (taskId: number, taskTitle: string) => {
    try {
      await deleteTaskMutation.mutateAsync({ projectId, taskId });
      toast.success(`Activité "${taskTitle}" supprimée avec succès`);
    } catch (error) {
      toast.error('Erreur lors de la suppression de l\'activité');
      console.error('Error deleting task:', error);
    }
  };

  const handleUpdateDueDate = async (taskId: number, taskTitle: string, date: Date | undefined) => {
    if (!date) return;

    try {
      await updateTaskMutation.mutateAsync({
        projectId,
        taskId,
        data: {
          due_date: date.toISOString().split('T')[0]
        }
      });
      toast.success(`Date d'échéance mise à jour pour "${taskTitle}"`);
      setDatePopoverOpen(null);
    } catch (error) {
      toast.error('Erreur lors de la mise à jour de la date');
      console.error('Error updating due date:', error);
    }
  };

  const renderTask = (task: ProjectTask) => {
    const extendedTask = {
      ...task,
      assigned_to: task.assigned_to_name ? {
        id: task.assigned_to as number,
        first_name: task.assigned_to_name.split(' ')[0],
        last_name: task.assigned_to_name.split(' ')[1] || '',
        email: '',
        username: '',
        profile: {
          is_active: true,
          created_at: '',
          updated_at: ''
        },
        full_name: task.assigned_to_name,
        project_count: '0',
        is_active: true,
        groups: []
      } : null
    };

    return (
      <Card
        key={task.id}
        draggable
        onDragStart={() => handleDragStart(task)}
        onDragEnd={handleDragEnd}
        className="mb-3 cursor-move hover:shadow-md transition-shadow"
      >
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* En-tête de la tâche */}
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-2 flex-1">
                <GripVertical className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
                <h4 className="font-medium text-sm leading-tight">{task.title}</h4>
              </div>
            </div>

            {/* Description */}
            {task.description && (
              <p className="text-xs text-gray-600 line-clamp-2">{task.description}</p>
            )}

            {/* Métadonnées */}
            <div className="flex flex-wrap gap-2 text-xs text-gray-500">
              {task.assigned_to_name && (
                <div className="flex items-center gap-1 bg-gray-100 rounded px-2 py-1">
                  <Users className="h-3 w-3" />
                  <span>{task.assigned_to_name}</span>
                </div>
              )}

              {task.due_date && (
                <div className="flex items-center gap-1 bg-gray-100 rounded px-2 py-1">
                  <CalendarIcon className="h-3 w-3" />
                  <span>{format(new Date(task.due_date), 'dd MMM', { locale: fr })}</span>
                </div>
              )}

              {task.estimated_hours && (
                <div className="flex items-center gap-1 bg-gray-100 rounded px-2 py-1">
                  <Clock className="h-3 w-3" />
                  <span>{(task.estimated_hours / 8).toFixed(1)}J</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-1 pt-2 border-t border-gray-100">
              {task.status !== 'Terminé' && onOpenAssignmentDialog && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onOpenAssignmentDialog(task)}
                  className="h-7 px-2"
                >
                  <UserPlus className="h-3 w-3" />
                </Button>
              )}

              {task.status !== 'Terminé' && (
                <StartTaskProjectModal task={task} projectId={projectId}>
                  <Button variant="ghost" size="sm" className="h-7 px-2">
                    <Play className="h-3 w-3" />
                  </Button>
                </StartTaskProjectModal>
              )}

              {task.status !== 'Terminé' && (
                <TaskModal projectId={projectId} task={extendedTask} mode="edit">
                  <Button variant="ghost" size="sm" className="h-7 px-2">
                    <Edit className="h-3 w-3" />
                  </Button>
                </TaskModal>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedTaskForDetails(extendedTask);
                  setIsTaskDetailOpen(true);
                }}
                className="h-7 px-2"
              >
                <View className="h-4 w-4" />
              </Button>

              {/* Bouton pour ajouter/modifier la date d'échéance - uniquement pour les activités qui ne viennent pas du contrat */}
              {task.status !== 'Terminé' && !task.ligne_devis && hasPermission('projects.change_projecttask') && (
                <Popover
                  open={datePopoverOpen === task.id}
                  onOpenChange={(open) => setDatePopoverOpen(open ? task.id : null)}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2"
                      title={task.due_date ? "Modifier la date d'échéance" : "Ajouter une date d'échéance"}
                    >
                      <CalendarPlus className={`h-3 w-3 ${task.due_date ? 'text-blue-500' : 'text-gray-400'}`} />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={task.due_date ? new Date(task.due_date) : undefined}
                      onSelect={(date) => handleUpdateDueDate(task.id, task.title, date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              )}

              {/* Bouton de suppression uniquement pour les activités qui ne viennent pas du contrat */}
              {task.status !== 'Terminé' && !task.ligne_devis && (
                <>
                  {hasPermission('projects.delete_projecttask') && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2"
                          title="Supprimer l'activité"
                        >
                          <Trash2 className="h-3 w-3 text-red-500" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Cette action ne peut pas être annulée. L'activité "{task.title}" sera définitivement supprimée.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteTask(task.id, task.title)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Supprimer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((column) => {
          const columnTasks = getTasksByStatus(column.status);

          return (
            <div
              key={column.id}
              className="flex flex-col"
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(column.status)}
            >
              {/* En-tête de colonne */}
              <Card className={`${column.bgColor} border-2`}>
                <CardHeader className="p-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className={`text-sm font-semibold ${column.color}`}>
                      {column.title}
                    </CardTitle>
                    <Badge variant="secondary" className="ml-2">
                      {columnTasks.length}
                    </Badge>
                  </div>
                </CardHeader>
              </Card>

              {/* Liste des tâches */}
              <ScrollArea className="flex-1 mt-4" style={{ maxHeight: 'calc(100vh - 300px)' }}>
                <div className="pr-4">
                  {columnTasks.length === 0 ? (
                    <div className="text-center py-8 text-sm text-gray-400">
                      <p>Aucune tâche</p>
                    </div>
                  ) : (
                    columnTasks.map(renderTask)
                  )}
                </div>
              </ScrollArea>
            </div>
          );
        })}
      </div>

      {/* Task Detail Modal - Rendue une seule fois pour toutes les tâches */}
      <TaskDetailModal
        task={selectedTaskForDetails}
        projectId={projectId}
        open={isTaskDetailOpen}
        onOpenChange={setIsTaskDetailOpen}
      />
    </>
  );
}
