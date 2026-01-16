import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Clock, User, FileText, MessageSquare, Trash2 } from 'lucide-react';
import { TaskComments } from './TaskComments';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '../ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useDeleteProjectTask } from '@/hooks/use-projects';
import { toast } from 'sonner';
import { usePermissions } from '@/hooks/use-permissions';

interface TaskDetailModalProps {
  task: any;
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskDetailModal({ task, projectId, open, onOpenChange }: TaskDetailModalProps) {
  if (!task) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'À faire':
        return 'bg-gray-100 text-gray-800';
      case 'En cours':
        return 'bg-blue-100 text-blue-800';
      case 'En pause':
        return 'bg-yellow-100 text-yellow-800';
      case 'Terminé':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

   const { 
      hasPermission
    } = usePermissions();

  const deleteTaskMutation = useDeleteProjectTask();
  

  const handleDeleteTask = async (taskId: number, taskTitle: string) => {
      try {
        await deleteTaskMutation.mutateAsync({ projectId, taskId });
        toast.success(`Activité "${taskTitle}" supprimée avec succès`);
      } catch (error) {
        toast.error('Erreur lors de la suppression de l\'activité');
        console.error('Error deleting task:', error);
      }
    };
  

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>{task.title}</span>
            <Badge className={getStatusColor(task.status)}>{task.status}</Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">
              <FileText className="h-4 w-4 mr-2" />
              Détails
            </TabsTrigger>
            <TabsTrigger value="comments">
              <MessageSquare className="h-4 w-4 mr-2" />
              Commentaires
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            {/* Informations principales */}
            <Card>
              <CardContent className="pt-6 space-y-4">
                {task.description && (
                  <div>
                    <h4 className="font-semibold mb-2">Description</h4>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">
                      {task.description}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {task.assigned_to_name && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-500">Assigné à</p>
                        <p className="text-sm font-medium">{task.assigned_to_name}</p>
                      </div>
                    </div>
                  )}

                  {task.estimated_hours && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-500">Heures estimées</p>
                        <p className="text-sm font-medium">{task.estimated_hours}h</p>
                      </div>
                    </div>
                  )}

                  {task.actual_hours !== undefined && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-500">Heures réelles</p>
                        <p className="text-sm font-medium">{task.actual_hours}h</p>
                      </div>
                    </div>
                  )}

                  {task.start_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-500">Date de début</p>
                        <p className="text-sm font-medium">
                          {format(new Date(task.start_date), 'dd MMM yyyy', { locale: fr })}
                        </p>
                      </div>
                    </div>
                  )}

                  {task.due_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-500">Date d'échéance</p>
                        <p className="text-sm font-medium">
                          {format(new Date(task.due_date), 'dd MMM yyyy', { locale: fr })}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Progression */}
                {task.completion_percentage !== undefined && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-gray-500">Progression</p>
                      <p className="text-sm font-medium">{task.completion_percentage}%</p>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${task.completion_percentage}%` }}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="comments">
            <TaskComments taskId={task.id} projectId={projectId} />
          </TabsContent>
        </Tabs>
        {hasPermission('projects.delete_projecttask') && (
          <DialogFooter>
            {/* Bouton de suppression uniquement pour les activités qui ne viennent pas du contrat */}
            {task.status !== 'Terminé' && !task.ligne_devis && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    title="Supprimer l'activité"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
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
                      onClick={() => {
                        handleDeleteTask(task.id, task.title);
                        onOpenChange(false);
                      }}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Supprimer
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
