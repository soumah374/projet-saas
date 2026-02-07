import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Users,
  Calendar as CalendarIcon,
  Clock,
  Edit,
  Play,
  View,
  UserPlus,
  Trash2,
  CalendarPlus
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { TaskModal } from '../TaskModal';
import { StartTaskProjectModal } from '../StartTaskProjectModal';
import { TaskDetailModal } from './TaskDetailModal';
import { useDeleteProjectTask, useUpdateProjectTask } from '@/hooks/use-projects';
import { usePermissions } from '@/hooks/use-permissions';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import type { ProjectTask } from '@/lib/types';

interface PlanningTaskListProps {
  tasks: ProjectTask[];
  projectId: string;
  onOpenAssignmentDialog: (task: ProjectTask) => void;
}

export function PlanningTaskList({ tasks, projectId, onOpenAssignmentDialog }: PlanningTaskListProps) {
  const [selectedTaskForDetails, setSelectedTaskForDetails] = useState<any>(null);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);
  const [datePopoverOpen, setDatePopoverOpen] = useState<number | null>(null);

  const deleteTaskMutation = useDeleteProjectTask();
  const updateTaskMutation = useUpdateProjectTask();
  const { hasPermission } = usePermissions();

  const handleDeleteTask = async (taskId: number, taskTitle: string) => {
    try {
      await deleteTaskMutation.mutateAsync({ projectId, taskId });
      toast.success(`Activité "${taskTitle}" supprimée avec succès`);
    } catch {
      // Error handled by hook
    }
  };

  const handleUpdateDueDate = async (taskId: number, taskTitle: string, date: Date | undefined) => {
    if (!date) return;
    try {
      await updateTaskMutation.mutateAsync({
        projectId,
        taskId,
        data: { due_date: date.toISOString().split('T')[0] }
      });
      toast.success(`Date d'échéance mise à jour pour "${taskTitle}"`);
      setDatePopoverOpen(null);
    } catch {
      // Error handled by hook
    }
  };

  return (
    <>
      <ScrollArea className="h-[400px]">
        <div className="space-y-4">
          {tasks?.map((task) => {
            const extendedTask = {
              ...task,
              assigned_to: task.assigned_to_name ? {
                id: task.assigned_to as number,
                first_name: task.assigned_to_name.split(' ')[0],
                last_name: task.assigned_to_name.split(' ')[1] || '',
                email: '',
                username: '',
                profile: { is_active: true, created_at: '', updated_at: '' },
                full_name: task.assigned_to_name,
                project_count: '0',
                is_active: true,
                groups: []
              } : null
            };

            return (
              <Card key={task.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{task.title}</h3>
                        <Badge variant={task.status === 'Terminé' ? 'default' : 'secondary'}>
                          {task.status}
                        </Badge>
                      </div>
                      {task.description && (
                        <p className="text-sm text-gray-500">{task.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        {task.assigned_to_name && (
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span>{task.assigned_to_name}</span>
                          </div>
                        )}
                        {task.due_date && (
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-4 w-4" />
                            <span>{format(new Date(task.due_date), 'dd MMM yyyy', { locale: fr })}</span>
                          </div>
                        )}
                        {task.estimated_hours && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{task.estimated_hours / 8}J</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {task.status !== 'Terminé' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onOpenAssignmentDialog(task)}
                          title="Assigner la tâche"
                        >
                          <UserPlus className="h-4 w-4" />
                        </Button>
                      )}

                      {task.status !== 'Terminé' && (
                        <StartTaskProjectModal task={task} projectId={projectId}>
                          <Button variant="ghost" size="icon">
                            <Play className="h-4 w-4" />
                          </Button>
                        </StartTaskProjectModal>
                      )}

                      {task.status !== 'Terminé' && (
                        <TaskModal projectId={projectId} task={extendedTask} mode="edit">
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TaskModal>
                      )}

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedTaskForDetails(extendedTask);
                          setIsTaskDetailOpen(true);
                        }}
                      >
                        <View className="h-4 w-4" />
                      </Button>

                      {task.status !== 'Terminé' && !task.ligne_devis && hasPermission('projects.change_projecttask') && (
                        <Popover
                          open={datePopoverOpen === task.id}
                          onOpenChange={(open) => setDatePopoverOpen(open ? task.id : null)}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              title={task.due_date ? "Modifier la date d'échéance" : "Ajouter une date d'échéance"}
                            >
                              <CalendarPlus className={`h-4 w-4 ${task.due_date ? 'text-blue-500' : 'text-gray-400'}`} />
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

                      {task.status !== 'Terminé' && !task.ligne_devis && (
                        <>
                          {hasPermission('projects.delete_projecttask') && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" title="Supprimer l'activité">
                                  <Trash2 className="h-4 w-4 text-red-500" />
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
          })}
        </div>
      </ScrollArea>

      <TaskDetailModal
        task={selectedTaskForDetails}
        projectId={projectId}
        open={isTaskDetailOpen}
        onOpenChange={setIsTaskDetailOpen}
      />
    </>
  );
}
