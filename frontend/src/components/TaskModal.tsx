import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Loader2, Edit, Plus, Eye, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ProjectTask, UserList } from '@/lib/types';
import { useUsers } from '@/hooks/use-users';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useForm } from 'react-hook-form';
import { useCreateProjectTask, useUpdateProjectTask, useDeleteProjectTask, useExecuteTask } from '@/hooks/use-projects';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface ExtendedProjectTask extends Omit<ProjectTask, 'assigned_to'> {
  assigned_to?: UserList | null;
}

interface TaskModalProps {
  children: React.ReactNode;
  task?: ExtendedProjectTask;
  projectId: string;
  onTaskSave?: (taskData: CreateTaskData | UpdateTaskData) => void;
  mode: 'create' | 'edit' | 'view';
}

export interface CreateTaskData {
  title: string;
  description: string;
  assigned_to?: number | null;
  due_date: string;
  project: string;
  estimated_hours?: number;
}

export interface ExecuteTaskData extends CreateTaskData {
  id: number;
  status: string;
  start_date: string;
}

export interface UpdateTaskData extends CreateTaskData {
  id: number;
}

// Custom styles for date inputs
const dateInputStyles = `
  input[type="date"]::-webkit-calendar-picker-indicator {
    background: transparent;
    bottom: 0;
    color: transparent;
    cursor: pointer;
    height: auto;
    left: 0;
    position: absolute;
    right: 0;
    top: 0;
    width: auto;
  }
  
  input[type="date"]::-webkit-datetime-edit {
    padding: 0;
  }
  
  input[type="date"]::-webkit-datetime-edit-fields-wrapper {
    padding: 0;
  }
  
  input[type="date"]::-webkit-datetime-edit-text {
    padding: 0 2px;
  }
  
  input[type="date"]::-webkit-datetime-edit-month-field,
  input[type="date"]::-webkit-datetime-edit-day-field,
  input[type="date"]::-webkit-datetime-edit-year-field {
    padding: 0 2px;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = dateInputStyles;
  document.head.appendChild(style);
}

export const TaskModal = ({ children, task, projectId, onTaskSave, mode }: TaskModalProps) => {
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [deadlineOpen, setDeadlineOpen] = useState(false);
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assigned_to: null,
    due_date: undefined as Date | undefined,
    project: projectId,
    estimated_hours: 0,
  });

  const { data: usersResponse, isLoading: usersLoading } = useUsers({
    is_active: true,
    ordering: 'first_name'
  });
  const users = usersResponse?.data;

  const createTaskMutation = useCreateProjectTask();
  const updateTaskMutation = useUpdateProjectTask();
  const deleteTaskMutation = useDeleteProjectTask();
  const executeTaskMutation = useExecuteTask();

  const form = useForm<CreateTaskData>({
    defaultValues: task ? {
      title: task.title,
      description: task.description,
      assigned_to: task.assigned_to?.id || 0,
      due_date: task.due_date,
      project: projectId,
      estimated_hours: task.estimated_hours || 0,
    } : {
      title: '',
      description: '',
      assigned_to: null,
      due_date: '',
      project: projectId,
      estimated_hours: 0,
    }
  });

  useEffect(() => {
    if (open) {
      setFormData({
        title: task?.title || '',
        description: task?.description || '',
        assigned_to: task?.assigned_to?.id || 0,
        due_date: task?.due_date ? new Date(task.due_date) : undefined,
        project: projectId,
        estimated_hours: task?.estimated_hours || 0,
      });
      setFormKey(prev => prev + 1);
    }
  }, [open, task?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // if (!onTaskSave) return;
    
    if (!formData.title.trim()) {
      alert('Le titre de la tâche est requis');
      return;
    }
    
    if (!formData.due_date) {
      alert('La date d\'échéance est requise');
      return;
    }
    // Vérifier si la date d'échéance est proche
    const daysUntilDue = Math.ceil((formData.due_date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntilDue <= 2) {
      const confirm = window.confirm(
        'Attention : La date d\'échéance est très proche (moins de 2 jours). Voulez-vous continuer ?'
      );
      if (!confirm) return;
    } else if (daysUntilDue <= 5) {
      const confirm = window.confirm(
        'La date d\'échéance est dans moins de 5 jours. Êtes-vous sûr de vouloir continuer ?'
      );
      if (!confirm) return;
    }
    
    const taskData = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      assigned_to: formData.assigned_to,
      due_date: format(formData.due_date, 'yyyy-MM-dd'),
      project: projectId,
      estimated_hours: formData.estimated_hours,
    };

    if (mode === 'edit' && task) {
      await updateTaskMutation.mutateAsync({ 
        projectId, 
        taskId: task.id, 
        data: taskData 
      });
      toast.success('Tâche mise à jour avec succès');
    } else {
      await createTaskMutation.mutateAsync({ projectId, data: taskData });
      toast.success('Tâche créée avec succès');
    }
    
    setOpen(false);
    setFormData({
      title: '',
      description: '',
      assigned_to: null,
      due_date: undefined,
      project: projectId,
      estimated_hours: 0,
    });
  };

  const handleClose = () => {
    setOpen(false);
    setFormData({
      title: '',
      description: '',
      assigned_to: null,
      due_date: undefined,
      project: projectId,
      estimated_hours: 0,
    });
  };

  const handleDelete = async () => {
    if (!task) return;
    try {
      await deleteTaskMutation.mutateAsync({ projectId, taskId: task.id });
      toast.success('Tâche supprimée avec succès');
      setOpen(false);
    } catch (error) {
      toast.error('Une erreur est survenue');
    }
  };

  const handleExecute = async () => {
    if (!task) return;
    try {
      await executeTaskMutation.mutateAsync({ projectId, taskId: task.id });
      setOpen(false);
    } catch (error) {
      toast.error('Une erreur est survenue');
    }
  };

  console.log(task)

  const renderViewMode = () => {
    if (!task) return null;

    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label>Titre de la tâche</Label>
            <p className="mt-1 text-lg font-medium">{task.title}</p>
          </div>

          {task.description && (
            <div>
              <Label>Description</Label>
              <p className="mt-1 whitespace-pre-wrap">{task.description}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Statut</Label>
              <p className="mt-1">{task.status}</p>
            </div>

            <div>
              <Label>Assigné à</Label>
              <p className="mt-1">
                {task.assigned_to ? 
                  `${task.assigned_to.first_name} ${task.assigned_to.last_name}` : 
                  'Non assigné'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Date de début</Label>
              <p className="mt-1">
                {task.start_date ? 
                  format(new Date(task.start_date), 'PPP', { locale: fr }) : 
                  'Non définie'}
              </p>
            </div>

            <div>
              <Label>Date d'échéance</Label>
              <p className="mt-1">
                {format(new Date(task.due_date), 'PPP', { locale: fr })}
              </p>
            </div>
          </div>

          <div>
            <Label>Créée le</Label>
            <p className="mt-1">
              {/* {format(new Date(task?.created_at), 'PPP', { locale: fr })} */}
              {/* {task?.created_by} */}
            </p>
          </div>
        </div>

        <Separator />
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-blue-900 flex items-center gap-2">
            {mode === 'create' ? (
              <>
                <Plus className="h-6 w-6" />
                Nouvelle tâche
              </>
            ) : mode === 'edit' ? (
              <>
                <Edit className="h-6 w-6" />
                Modifier la tâche
              </>
            ) : (
              <>
                <Eye className="h-6 w-6" />
                Détails de la tâche
              </>
            )}
          </DialogTitle>
        </DialogHeader>
        
        {mode === 'view' ? (
          renderViewMode()
        ) : (
          <form key={formKey} onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Titre de la tâche *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Ex: Créer la maquette de la page d'accueil"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Description détaillée de la tâche"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="assigned_to">Assigné à</Label>
                  <Select 
                    value={formData.assigned_to?.toString() || ''} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, assigned_to: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un membre" />
                    </SelectTrigger>
                    <SelectContent>
                      {usersLoading ? (
                        <div className="flex items-center justify-center p-4">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Chargement des utilisateurs...
                        </div>
                      ) : !users?.results || users.results.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          Aucun utilisateur disponible
                        </div>
                      ) : (
                          users.results.map((user: UserList) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.first_name} {user.last_name} ({user.email})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Estimation (nombre d'heures)</Label>
                  <Input
                    id="estimated_hours"
                    type="number"
                    value={formData.estimated_hours}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        estimated_hours: value === '' ? 0 : parseInt(value, 10),
                      }));
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Date d'échéance *</Label>
                  <Popover open={deadlineOpen} onOpenChange={setDeadlineOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.due_date ? format(formData.due_date, 'PPP', { locale: fr }) : 'Sélectionner une date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent 
                      className="w-auto p-0" 
                      style={{ zIndex: 9999, pointerEvents: 'auto' }}
                    >
                      <Calendar
                         mode="single"
                         selected={formData.due_date as Date | undefined}
                         onSelect={(date) => {
                           setFormData(prev => ({ ...prev, due_date: date || undefined }));
                           setDeadlineOpen(false);
                         }}
                         initialFocus
                       />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label htmlFor="assigned_to">Phase</Label>
                  <Select 
                    value={formData.assigned_to?.toString() || ''} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, assigned_to: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un membre" />
                    </SelectTrigger>
                    <SelectContent>
                      {usersLoading ? (
                        <div className="flex items-center justify-center p-4">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Chargement des utilisateurs...
                        </div>
                      ) : !users?.results || users.results.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          Aucun utilisateur disponible
                        </div>
                      ) : (
                          users.results.map((user: UserList) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.first_name} {user.last_name} ({user.email})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            <div className="flex justify-between pt-4">
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Annuler
                </Button>
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  {mode === 'create' ? (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Créer la tâche
                    </>
                  ) : (
                    <>
                      <Edit className="h-4 w-4 mr-2" />
                      Mettre à jour
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        )}

        {task?.executed_at && (
          <div className="mt-4 text-sm text-gray-500">
            Exécutée le : {new Date(task.executed_at).toLocaleString()}
          </div>
        )}

        {mode === 'view' && (
          <div className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
            >
              Fermer
            </Button>
            {task && task.status !== 'Terminé' && (
              <Button
                type="button"
                variant="default"
                onClick={handleExecute}
              >
                Exécuter
              </Button>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="destructive">
                  Supprimer
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action ne peut pas être annulée. La tâche sera définitivement supprimée.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>
                    Supprimer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}; 