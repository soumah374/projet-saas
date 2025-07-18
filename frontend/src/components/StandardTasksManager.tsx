import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Loader2, Package, CheckSquare, Clock, Users } from 'lucide-react';
import { useServices } from '@/hooks/use-services';
import { useCreateProjectTask } from '@/hooks/use-projects';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Service, Phase } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';

interface ServiceTaskTemplate {
  title: string;
  description: string;
  estimated_hours: number;
  phase?: number | null;
  service: Service;
}

interface StandardTasksManagerProps {
  projectId: string;
  phases: Phase[];
  onTasksCreated?: () => void;
}

// Fonction pour générer les tâches standards basées sur un service
const generateServiceTasks = (service: Service): ServiceTaskTemplate[] => {
  const serviceDuration = typeof service.duration === 'number' ? service.duration : 8;
  const baseTasks: ServiceTaskTemplate[] = [
    {
      title: `Analyse et planification - ${service.name}`,
      description: `Analyse des besoins et planification détaillée pour ${service.name}`,
      estimated_hours: Math.max(2, Math.round(serviceDuration * 0.15)),
      service,
    },
    {
      title: `Conception et développement - ${service.name}`,
      description: `Conception et développement principal de ${service.name}`,
      estimated_hours: Math.max(4, Math.round(serviceDuration * 0.6)),
      service,
    },
    {
      title: `Tests et validation - ${service.name}`,
      description: `Tests, validation et ajustements pour ${service.name}`,
      estimated_hours: Math.max(2, Math.round(serviceDuration * 0.2)),
      service,
    },
    {
      title: `Livraison et documentation - ${service.name}`,
      description: `Livraison finale et documentation de ${service.name}`,
      estimated_hours: Math.max(1, Math.round(serviceDuration * 0.05)),
      service,
    }
  ];

  return baseTasks;
};

export function StandardTasksManager({ projectId, phases, onTasksCreated }: StandardTasksManagerProps) {
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [generatedTasks, setGeneratedTasks] = useState<ServiceTaskTemplate[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set());
  const [globalDueDate, setGlobalDueDate] = useState<Date | undefined>(undefined);
  const [isCreating, setIsCreating] = useState(false);

  const { data: services, isLoading: servicesLoading } = useServices({
    is_active: true,
    ordering: 'name'
  });

  const createTaskMutation = useCreateProjectTask();

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

  const handleSelectAllTasks = () => {
    setSelectedTasks(new Set(generatedTasks.map((_, index) => index)));
  };

  const handleDeselectAllTasks = () => {
    setSelectedTasks(new Set());
  };

  const handleCreateStandardTasks = async () => {
    if (selectedTasks.size === 0) {
      toast.error('Veuillez sélectionner au moins une tâche');
      return;
    }

    if (!globalDueDate) {
      toast.error('Veuillez définir une date d\'échéance globale');
      return;
    }

    setIsCreating(true);
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
            due_date: format(globalDueDate, 'yyyy-MM-dd'),
          }
        });
      }
      
      toast.success(`${tasksToCreate.length} tâche(s) créée(s) avec succès`);
      setSelectedServices([]);
      setGeneratedTasks([]);
      setSelectedTasks(new Set());
      setGlobalDueDate(undefined);
      onTasksCreated?.();
    } catch (error) {
      toast.error('Erreur lors de la création des tâches');
      console.error('Error creating tasks:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const totalEstimatedHours = Array.from(selectedTasks).reduce((total, index) => {
    return total + generatedTasks[index]?.estimated_hours || 0;
  }, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Tâches standards basées sur le catalogue
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Date d'échéance globale */}
        <div>
          <Label>Date d'échéance globale *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal mt-2"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {globalDueDate ? format(globalDueDate, 'PPP', { locale: fr }) : 'Sélectionner une date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={globalDueDate}
                onSelect={setGlobalDueDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <Separator />

        {/* Sélection des services */}
        <div>
          <Label>Sélectionner des services du catalogue</Label>
          <div className="mt-2 space-y-2 max-h-40 overflow-y-auto border rounded-lg p-3">
            {servicesLoading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Chargement des services...
              </div>
            ) : !services?.results || services.results.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                Aucun service disponible
              </div>
            ) : (
              services.results.map((service: Service) => (
                <div key={service.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`service-${service.id}`}
                    checked={selectedServices.some(s => s.id === service.id)}
                    onCheckedChange={() => handleServiceToggle(service)}
                  />
                  <Label htmlFor={`service-${service.id}`} className="flex-1 cursor-pointer">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{service.name}</span>
                      <div className="flex items-center gap-2">
                        {service.duration && (
                          <Badge variant="secondary">
                            <Clock className="h-3 w-3 mr-1" />
                            {service.duration}h
                          </Badge>
                        )}
                        {service.price && (
                          <Badge variant="outline">
                            {service.price}€
                          </Badge>
                        )}
                      </div>
                    </div>
                    {service.description && (
                      <p className="text-sm text-gray-500 mt-1">{service.description}</p>
                    )}
                    {service.category && (
                      <p className="text-xs text-gray-400 mt-1">
                        Catégorie: {service.category.name}
                      </p>
                    )}
                  </Label>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Tâches générées */}
        {generatedTasks.length > 0 && (
          <>
            <Separator />
            <div>
              <div className="flex justify-between items-center mb-3">
                <Label>Tâches générées ({generatedTasks.length})</Label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAllTasks}
                  >
                    Tout sélectionner
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDeselectAllTasks}
                  >
                    Tout désélectionner
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-3">
                {generatedTasks.map((taskTemplate, index) => (
                  <div key={index} className="flex items-start space-x-2 p-3 border rounded-lg hover:bg-gray-50">
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
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              {taskTemplate.estimated_hours}h
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {taskTemplate.service.name}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Résumé et actions */}
        {selectedTasks.size > 0 && (
          <>
            <Separator />
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium text-blue-900">
                  Résumé de la sélection
                </h4>
                <Badge variant="default" className="bg-blue-600">
                  {selectedTasks.size} tâche(s)
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-700">Temps total estimé:</span>
                  <p className="font-medium text-blue-900">{totalEstimatedHours} heures</p>
                </div>
                <div>
                  <span className="text-blue-700">Services sélectionnés:</span>
                  <p className="font-medium text-blue-900">{selectedServices.length}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedServices([]);
                  setGeneratedTasks([]);
                  setSelectedTasks(new Set());
                  setGlobalDueDate(undefined);
                }}
              >
                Annuler
              </Button>
              <Button
                onClick={handleCreateStandardTasks}
                disabled={isCreating || !globalDueDate}
                className="min-w-[150px]"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Création...
                  </>
                ) : (
                  <>
                    <CheckSquare className="h-4 w-4 mr-2" />
                    Créer {selectedTasks.size} tâche(s)
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
} 