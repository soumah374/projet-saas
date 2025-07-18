import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Loader2, Edit, Plus, Eye, CalendarIcon, Package, CheckSquare } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Phase, ProjectTask, UserList, Service } from '@/lib/types';
import { useUsers } from '@/hooks/use-users';
import { useServices } from '@/hooks/use-services';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useForm } from 'react-hook-form';
import { useCreateProjectTask, useUpdateProjectTask, useDeleteProjectTask } from '@/hooks/use-projects';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { safeParseDate } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

interface ExtendedProjectTask extends Omit<ProjectTask, 'assigned_to'> {
  assigned_to?: UserList | null;
}

interface TaskModalProps {
  children: React.ReactNode;
  task?: ExtendedProjectTask;
  projectId: string;
  onTaskSave?: (taskData: CreateTaskData | UpdateTaskData) => void;
  mode: 'create' | 'edit' | 'view';
  phases: Phase[];
}

export interface CreateTaskData {
  title: string;
  description: string;
  assigned_to?: number | null;
  due_date: string;
  project: string;
  estimated_hours?: number;
  phase?: number | null;
}

export interface ExecuteTaskData extends CreateTaskData {
  id: number;
  status: string;
  start_date: string;
}

export interface UpdateTaskData extends CreateTaskData {
  id: number;
}

interface ServiceTaskTemplate {
  title: string;
  description: string;
  estimated_hours: number;
  phase?: number | null;
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

// Fonction pour générer les tâches standards basées sur un service
const generateServiceTasks = (service: Service): ServiceTaskTemplate[] => {
  const serviceDuration = typeof service.duration === 'number' ? service.duration : 8;
  const baseTasks: ServiceTaskTemplate[] = [
    {
      title: `Analyse et planification - ${service.name}`,
      description: `Analyse des besoins et planification détaillée pour ${service.name}`,
      estimated_hours: Math.max(2, Math.round(serviceDuration * 0.15)),
    },
    {
      title: `Conception et développement - ${service.name}`,
      description: `Conception et développement principal de ${service.name}`,
      estimated_hours: Math.max(4, Math.round(serviceDuration * 0.6)),
    },
    {
      title: `Tests et validation - ${service.name}`,
      description: `Tests, validation et ajustements pour ${service.name}`,
      estimated_hours: Math.max(2, Math.round(serviceDuration * 0.2)),
    },
    {
      title: `Livraison et documentation - ${service.name}`,
      description: `Livraison finale et documentation de ${service.name}`,
      estimated_hours: Math.max(1, Math.round(serviceDuration * 0.05)),
    }
  ];

  return baseTasks;
};

export const TaskModal = ({ children, task, projectId, onTaskSave, mode, phases}: TaskModalProps) => {
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [deadlineOpen, setDeadlineOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('manual');
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [generatedTasks, setGeneratedTasks] = useState<ServiceTaskTemplate[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set());
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assigned_to: null,
    due_date: undefined as Date | undefined,
    project: projectId,
    estimated_hours: 1,
    phase: null,
  });

  const { data: usersResponse, isLoading: usersLoading } = useUsers({
    is_active: true,
    ordering: 'first_name'
  });
  const users = usersResponse?.data;

  const { data: servicesResponse, isLoading: servicesLoading } = useServices({
    is_active: true,
    ordering: 'name'
  });
  const services = servicesResponse?.results;

  const createTaskMutation = useCreateProjectTask();
  const updateTaskMutation = useUpdateProjectTask();
  const deleteTaskMutation = useDeleteProjectTask();

  const form = useForm<CreateTaskData>({
    defaultValues: task ? {
      title: task.title,
      description: task.description,
      assigned_to: task.assigned_to?.id || 0,
      due_date: task.due_date,
      project: projectId,
      estimated_hours: task.estimated_hours || 1,
      phase: task.phase || null,
    } : {
      title: '',
      description: '',
      assigned_to: null,
      due_date: '',
      project: projectId,
      estimated_hours: 1,
      phase: null,
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
        estimated_hours: task?.estimated_hours || 1,
        phase: task?.phase || null,
      });
      setFormKey(prev => prev + 1);
      setActiveTab('manual');
      setSelectedServices([]);
      setGeneratedTasks([]);
      setSelectedTasks(new Set());
    }
  }, [open, task?.id]);

  // Générer les tâches quand les services sélectionnés changent
  useEffect(() => {
    if (selectedServices.length > 0) {
      const tasks: ServiceTaskTemplate[] = [];
      selectedServices.forEach(service => {
        tasks.push(...generateServiceTasks(service));
      });
      setGeneratedTasks(tasks);
      setSelectedTasks(new Set(tasks.map((_, index) => index)));
    } else {
      setGeneratedTasks([]);
      setSelectedTasks(new Set());
    }
  }, [selectedServices]);

  const handleServiceToggle = (service: Service) => {
    setSelectedServices(prev => {
      const isSelected = prev.some(s => s.id === service.id);
      if (isSelected) {
        return prev.filter(s => s.id !== service.id);
      } else {
        return [...prev, service];
      }
    });
  };

  const handleTaskToggle = (taskIndex: number) => {
    setSelectedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskIndex)) {
        newSet.delete(taskIndex);
      } else {
        newSet.add(taskIndex);
      }
      return newSet;
    });
  };

  const handleCreateStandardTasks = async () => {
    if (selectedTasks.size === 0) {
      toast.error('Veuillez sélectionner au moins une tâche');
      return;
    }

    const tasksToCreate = Array.from(selectedTasks).map(index => generatedTasks[index]);
    
    try {
      for (const taskTemplate of tasksToCreate) {
        await createTaskMutation.mutateAsync({
          projectId,
          data: {
            title: taskTemplate.title,
            description: taskTemplate.description,
            estimated_hours: taskTemplate.estimated_hours,
            phase: taskTemplate.phase,
            project: projectId,
            due_date: formData.due_date ? format(formData.due_date, 'yyyy-MM-dd') : undefined,
          }
        });
      }
      
      toast.success(`${tasksToCreate.length} tâche(s) créée(s) avec succès`);
      setOpen(false);
      setSelectedServices([]);
      setGeneratedTasks([]);
      setSelectedTasks(new Set());
    } catch (error) {
      toast.error('Erreur lors de la création des tâches');
      console.error('Error creating tasks:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
      phase: formData.phase,
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
      estimated_hours: 1,
      phase: null,
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
      estimated_hours: 1,
      phase: null,
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
      await updateTaskMutation.mutateAsync({ projectId, taskId: task.id, data: { status: 'En cours' } });
      toast.success('Tâche exécutée avec succès');
      setOpen(false);
    } catch (error) {
      toast.error('Une erreur est survenue');
    }
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
              {safeParseDate(task?.created_at)?.toLocaleString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>

        <Separator />
      </div>
    );
  };

  const renderStandardTasksTab = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label>Date d'échéance globale</Label>
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
          <Label>Sélectionner des services du catalogue</Label>
          <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
            {servicesLoading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Chargement des services...
              </div>
            ) : !services || services.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                Aucun service disponible
              </div>
            ) : (
              services.map((service: Service) => (
                <div key={service.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`service-${service.id}`}
                    checked={selectedServices.some(s => s.id === service.id)}
                    onCheckedChange={() => handleServiceToggle(service)}
                  />
                  <Label htmlFor={`service-${service.id}`} className="flex-1 cursor-pointer">
                    <div className="flex justify-between items-center">
                      <span>{service.name}</span>
                      <Badge variant="secondary">{service.duration}h</Badge>
                    </div>
                    {service.description && (
                      <p className="text-sm text-gray-500 mt-1">{service.description}</p>
                    )}
                  </Label>
                </div>
              ))
            )}
          </div>
        </div>

        {generatedTasks.length > 0 && (
          <div>
            <Label>Tâches générées ({generatedTasks.length})</Label>
            <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
              {generatedTasks.map((taskTemplate, index) => (
                <div key={index} className="flex items-start space-x-2 p-3 border rounded-lg">
                  <Checkbox
                    id={`task-${index}`}
                    checked={selectedTasks.has(index)}
                    onCheckedChange={() => handleTaskToggle(index)}
                  />
                  <Label htmlFor={`task-${index}`} className="flex-1 cursor-pointer">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium">{taskTemplate.title}</p>
                        <p className="text-sm text-gray-600 mt-1">{taskTemplate.description}</p>
                      </div>
                      <Badge variant="outline" className="ml-2">
                        {taskTemplate.estimated_hours}h
                      </Badge>
                    </div>
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Separator />

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={handleClose}>
          Annuler
        </Button>
        <Button 
          type="button" 
          variant="default"
          onClick={handleCreateStandardTasks}
          disabled={selectedTasks.size === 0}
        >
          <CheckSquare className="h-4 w-4 mr-2" />
          Créer {selectedTasks.size} tâche(s)
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
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
        ) : mode === 'create' ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Tâche manuelle
              </TabsTrigger>
              <TabsTrigger value="standard" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Tâches standards
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="manual" className="space-y-6">
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
                              Chargement des membres...
                            </div>
                          ) : !users?.results || users.results.length === 0 ? (
                            <div className="p-4 text-center text-gray-500">
                              Aucun membre disponible
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
                            estimated_hours: value === '' ? 1 : parseFloat(value),
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
                        value={formData.phase?.toString() || ''} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, phase: parseInt(value) }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner une phase" />
                        </SelectTrigger>
                        <SelectContent>
                          {phases.length > 0 ? (
                            phases.map((phase: Phase) => (
                              <SelectItem key={phase.id} value={phase.id.toString()}>
                                {phase.name}
                              </SelectItem>
                            ))
                          ) : phases.length === 0 ? (
                            <div className="p-4 text-center text-gray-500">
                              Aucune phase disponible
                            </div>
                          ) : (
                              phases.map((phase: Phase) => (
                              <SelectItem key={phase.id} value={phase.id.toString()}>
                                {phase.name}
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
                    <Button type="submit" variant="default">
                      <Plus className="h-4 w-4 mr-2" />
                      Créer la tâche
                    </Button>
                  </div>
                </div>
              </form>
            </TabsContent>
            
            <TabsContent value="standard">
              {renderStandardTasksTab()}
            </TabsContent>
          </Tabs>
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
                          Chargement des membres...
                        </div>
                      ) : !users?.results || users.results.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          Aucun membre disponible
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
                        estimated_hours: value === '' ? 1 : parseFloat(value),
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
                    value={formData.phase?.toString() || ''} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, phase: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une phase" />
                    </SelectTrigger>
                    <SelectContent>
                      {phases.length > 0 ? (
                        phases.map((phase: Phase) => (
                          <SelectItem key={phase.id} value={phase.id.toString()}>
                            {phase.name}
                          </SelectItem>
                        ))
                      ) : phases.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          Aucune phase disponible
                        </div>
                      ) : (
                          phases.map((phase: Phase) => (
                          <SelectItem key={phase.id} value={phase.id.toString()}>
                            {phase.name}
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
                <Button type="submit" variant="default">
                  <Edit className="h-4 w-4 mr-2" />
                  Mettre à jour
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
            {task && task.status !== 'En cours' && task.status !== 'Terminé' && task.status !== 'En pause' && (
              <Button
                type="button"
                variant="default"
                onClick={handleExecute}
              >
                Exécuter
              </Button>
            )}
            {task && task.status !== 'Terminé' && (
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
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}; 