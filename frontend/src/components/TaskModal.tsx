import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { FileText, User, Loader2, Edit, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ProjectTask } from '@/lib/types';
import { useUsers } from '@/hooks/use-users';
import { StyledDateInput } from '@/components/ui/DateInput';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';

interface TaskModalProps {
  children: React.ReactNode;
  task?: ProjectTask;
  projectId: string;
  onTaskSave: (taskData: CreateTaskData | UpdateTaskData) => void;
  mode: 'create' | 'edit';
}

export interface CreateTaskData {
  title: string;
  description: string;
  status: string;
  assigned_to_id?: number;
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
  const [formKey, setFormKey] = useState(0); // Key to force form re-render
  const [deadlineOpen, setDeadlineOpen] = useState(false); 
  // Form data state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'À faire',
    assigned_to_id: '',
    due_date: undefined as Date | undefined
  });

  // React Query hooks
  const { data: users, isLoading: usersLoading } = useUsers({
    is_active: true,
    ordering: 'first_name'
  });

  // Task options
  const taskStatuses = ['À faire', 'En cours', 'En pause', 'Terminé'];

  // Reset form when modal opens/closes or task changes
  useEffect(() => {
    if (open) {
      // Reset form data and increment key to force clean re-render
      setFormData({
        title: task?.title || '',
        description: task?.description || '',
        status: task?.status || 'À faire',
        assigned_to_id: task?.assigned_to?.id?.toString() || '',
        due_date: task?.due_date ? new Date(task.due_date) : undefined
      });
      setFormKey(prev => prev + 1);
    }
  }, [open, task?.id]); // Only depend on open state and task ID

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation côté frontend
    if (!formData.title.trim()) {
      alert('Le titre de la tâche est requis');
      return;
    }
    
    if (!formData.due_date) {
      alert('La date d\'échéance est requise');
      return;
    }
    
    // Format data for API
    const taskData = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      status: formData.status,
      assigned_to_id: formData.assigned_to_id ? parseInt(formData.assigned_to_id) : undefined,
      due_date: format(formData.due_date, 'yyyy-MM-dd'),
    };

    if (mode === 'edit' && task) {
      onTaskSave({ ...taskData, id: task.id } as UpdateTaskData);
    } else {
      onTaskSave(taskData as CreateTaskData);
    }
    
    setOpen(false);
  };

  const handleClose = () => {
    setOpen(false);
    // Reset form when closing
    setFormData({
      title: '',
      description: '',
      status: 'À faire',
      assigned_to_id: '',
      due_date: undefined
    });
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
            ) : (
              <>
                <Edit className="h-6 w-6" />
                Modifier la tâche
              </>
            )}
          </DialogTitle>
        </DialogHeader>
        
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
      </DialogContent>
    </Dialog>
  );
}; 