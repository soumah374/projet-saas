import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { FileText, User, Loader2, Edit, Plus, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ProjectTask } from '@/lib/types';
import { useUsers } from '@/hooks/use-users';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';

interface TaskModalProps {
  children: React.ReactNode;
  task?: ProjectTask;
  projectId: string;
  onTaskSave?: (taskData: CreateTaskData | UpdateTaskData) => void;
  mode: 'create' | 'edit' | 'view';
}

export interface CreateTaskData {
  title: string;
  description: string;
  status: string;
  assigned_to_id?: number;
  start_date?: string;
  due_date: string;
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
    status: 'À faire',
    assigned_to_id: '',
    start_date: undefined as Date | undefined,
    due_date: undefined as Date | undefined
  });

  const { data: users, isLoading: usersLoading } = useUsers({
    is_active: true,
    ordering: 'first_name'
  });

  const taskStatuses = ['À faire', 'En cours', 'En pause', 'Terminé'];

  useEffect(() => {
    if (open) {
      setFormData({
        title: task?.title || '',
        description: task?.description || '',
        status: task?.status || 'À faire',
        assigned_to_id: task?.assigned_to?.id?.toString() || '',
        start_date: task?.start_date ? new Date(task.start_date) : undefined,
        due_date: task?.due_date ? new Date(task.due_date) : undefined
      });
      setFormKey(prev => prev + 1);
    }
  }, [open, task?.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!onTaskSave) return;
    
    if (!formData.title.trim()) {
      alert('Le titre de la tâche est requis');
      return;
    }
    
    if (!formData.due_date) {
      alert('La date d\'échéance est requise');
      return;
    }

    if (formData.start_date && formData.due_date && formData.start_date > formData.due_date) {
      alert('La date de début ne peut pas être postérieure à la date d\'échéance');
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
      status: formData.status,
      assigned_to_id: formData.assigned_to_id ? parseInt(formData.assigned_to_id) : undefined,
      start_date: formData.start_date ? format(formData.start_date, 'yyyy-MM-dd') : undefined,
      due_date: format(formData.due_date, 'yyyy-MM-dd'),
    };

    if (mode === 'edit' && task) {
      onTaskSave({ ...taskData, id: task.id } as UpdateTaskData);
    } else {
      onTaskSave(taskData as CreateTaskData);
    }
    
    setOpen(false);
    setFormData({
      title: '',
      description: '',
      status: 'À faire',
      assigned_to_id: '',
      start_date: undefined,
      due_date: undefined
    });
  };

  const handleClose = () => {
    setOpen(false);
    setFormData({
      title: '',
      description: '',
      status: 'À faire',
      assigned_to_id: '',
      start_date: undefined,
      due_date: undefined
    });
  };

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
              {format(new Date(task.created_at), 'PPP', { locale: fr })}
            </p>
          </div>
        </div>

        <Separator />

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={handleClose}>
            Fermer
          </Button>
        </div>
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
                  <Label htmlFor="status">Statut</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {taskStatuses.map(status => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="assigned_to">Assigné à</Label>
                  <Select 
                    value={formData.assigned_to_id} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, assigned_to_id: value }))}
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
                      ) : users?.results?.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          Aucun utilisateur disponible
                        </div>
                      ) : (
                        users?.results?.map(user => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.first_name} {user.last_name} ({user.email})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Date de début</Label>
                  <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.start_date ? format(formData.start_date, 'PPP', { locale: fr }) : 'Sélectionner une date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent 
                      className="w-auto p-0" 
                      style={{ zIndex: 9999, pointerEvents: 'auto' }}
                    >
                      <Calendar
                         mode="single"
                         selected={formData.start_date as Date | undefined}
                         onSelect={(date) => {
                           setFormData(prev => ({ ...prev, start_date: date || undefined }));
                           setStartDateOpen(false);
                         }}
                         initialFocus
                       />
                    </PopoverContent>
                  </Popover>
                </div>

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
      </DialogContent>
    </Dialog>
  );
}; 