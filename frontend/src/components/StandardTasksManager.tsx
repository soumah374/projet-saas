import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Loader2, Package, CheckSquare, Clock, Users } from 'lucide-react';
import { useCategories, useServices, useServicesByCategory } from '@/hooks/use-services';
import { useCreateProjectTask } from '@/hooks/use-projects';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Service, Phase, Category } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';

interface ServiceTaskTemplate {
  id: number;
  name: string;
  description: string;
  duration: number;
  price?: number;
  category?: {
    id: number;
    name: string;
  } | null;
}

interface StandardTasksManagerProps {
  projectId: string;
  phases: Phase[];
  onTasksCreated?: () => void;
}

export function StandardTasksManager({ projectId, phases, onTasksCreated }: StandardTasksManagerProps) {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [generatedTasks, setGeneratedTasks] = useState<ServiceTaskTemplate[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set());
  const [globalDueDate, setGlobalDueDate] = useState<Date | undefined>(undefined);
  const [isCreating, setIsCreating] = useState(false);

  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const createTaskMutation = useCreateProjectTask();

  // Récupérer tous les services actifs avec leurs catégories
  const { data: allServices, isLoading: servicesLoading } = useServices({
    is_active: true,
    ordering: 'name'
  });

  // Récupérer les services par catégorie sélectionnée
  const { data: servicesByCategory, isLoading: categoryServicesLoading } = useServicesByCategory(
    selectedCategory?.id || 0
  );

  // Filtrer les services par catégorie sélectionnée
  const filteredServices = useMemo(() => {
    if (!allServices?.results || !selectedCategory) {
      return [];
    }
    
    return allServices.results.filter(service => 
      service.category && service.category.id === selectedCategory.id
    );
  }, [allServices?.results, selectedCategory]);

  // Utiliser les services par catégorie si disponible, sinon utiliser le filtrage local
  const effectiveServices = useMemo(() => {
    if (selectedCategory && servicesByCategory?.results) {
      return servicesByCategory.results;
    }
    return filteredServices;
  }, [selectedCategory, servicesByCategory?.results, filteredServices]);

  // Générer les tâches quand les services filtrés changent
  useEffect(() => {
    if (effectiveServices.length > 0) {
      // Convertir directement les services en tâches
      const tasks: ServiceTaskTemplate[] = effectiveServices.map(service => ({
        id: service.id,
        name: service.name,
        description: service.description || `Service: ${service.name}`,
        duration: Number(service.duration) || 8,
        price: service.price,
        category: service.category,
      }));
      
      setGeneratedTasks(tasks);
      setSelectedTasks(new Set(tasks.map((_, index) => index)));
    } else {
      setGeneratedTasks([]);
      setSelectedTasks(new Set());
    }
  }, [effectiveServices]);

  const handleCategoryChange = (category: Category) => {
    console.log({...category})
    setSelectedCategory(category);
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
            title: taskTemplate.name,
            description: taskTemplate.description,
            estimated_hours: taskTemplate.duration,
            phase: null,
            project: projectId,
            due_date: format(globalDueDate, 'yyyy-MM-dd'),
            is_standard_task: true,
          }
        });
      }
      
      toast.success(`${tasksToCreate.length} tâche(s) créée(s) avec succès`);
      setSelectedCategory(null);
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
    return total + generatedTasks[index]?.duration || 0;
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

        {/* Sélection de la catégorie */}
        <div>
          <Label>Sélectionner une catégorie du catalogue</Label>
          <div className="mt-2 max-h-40 overflow-y-auto border rounded-lg p-3">
            {categoriesLoading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Chargement des catégories...
              </div>
            ) : !categories?.results || categories.results.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                Aucune catégorie disponible
              </div>
            ) : (
              <RadioGroup value={selectedCategory?.id?.toString() || ""} onValueChange={(value) => {
                const category = categories.results.find(c => c.id.toString() === value);
                if (category) handleCategoryChange(category);
              }}>
                {categories.results.map((category: Category) => (
                  <div key={category.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={category.id.toString()} id={`category-${category.id}`} />
                    <Label htmlFor={`category-${category.id}`} className="flex-1 cursor-pointer">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{category.name} {category.id}</span>
                        <div className="flex items-center gap-2">
                          
                        </div>
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
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
                {servicesLoading ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Chargement des services...
                  </div>
                ) : (
                  generatedTasks.map((taskTemplate, index) => (
                    <div key={index} className="flex items-start space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                      <Checkbox
                        id={`task-${index}`}
                        checked={selectedTasks.has(index)}
                        onCheckedChange={() => handleTaskToggle(index)}
                      />
                      <Label htmlFor={`task-${index}`} className="flex-1 cursor-pointer">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium">{taskTemplate.name}</p>
                            <p className="text-sm text-gray-600 mt-1">{taskTemplate.description}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                <Clock className="h-3 w-3 mr-1" />
                                {taskTemplate.duration}h
                              </Badge>
                              {taskTemplate.category && (
                                <Badge variant="outline" className="text-xs">
                                  {taskTemplate.category.name}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </Label>
                    </div>
                  ))
                )}
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
                  <span className="text-blue-700">Catégorie sélectionnée:</span>
                  <p className="font-medium text-blue-900">{selectedCategory ? selectedCategory.name : 'Aucune'}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedCategory(null);
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