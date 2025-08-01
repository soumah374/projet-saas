import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Loader2, Package, CheckSquare, Clock, Users, FileText } from 'lucide-react';
import { useCategories, useServices, useServicesByCategory } from '@/hooks/use-services';
import { useCreateProjectTask } from '@/hooks/use-projects';
import { useContratById } from '@/hooks/use-contrats';
import { useDevisServicesByContract } from '@/hooks/use-devis';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Service, Category } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { formatMontant } from '@/lib/formatters';

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
  quantity?: number;
  unite?: {
    id: number;
    intitule: string;
    code: string;
  };
  type?: 'activity' | 'frais';
  devis_info?: {
    numero: string;
    statut: string;
  };
  intervenants?: Array<{
    id: number;
    intitule: string;
    temps_intervenant: number;
    taux_horaire: number;
    montant_intervenant: number;
  }>;

}

interface StandardTasksManagerProps {
  projectId: string;
  contractId?: number | null;
  onTasksCreated?: () => void;
}

export function StandardTasksManager({ projectId, contractId, onTasksCreated }: StandardTasksManagerProps) {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [generatedTasks, setGeneratedTasks] = useState<ServiceTaskTemplate[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set());
  const [globalDueDate, setGlobalDueDate] = useState<Date | undefined>(undefined);
  const [isCreating, setIsCreating] = useState(false);

  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const createTaskMutation = useCreateProjectTask();

  
  // Récupérer les détails du contrat si disponible
  const { data: contractDetails, isLoading: contractLoading } = useContratById(contractId || 0);

  // Récupérer les services des devis liés au contrat
  const { data: devisServicesData, isLoading: devisServicesLoading } = useDevisServicesByContract(contractId);

  // Extraire les activités et frais des devis liés au contrat
  const devisServices = useMemo(() => {
    if (!devisServicesData?.devis_services) {
      return [];
    }
    
    const allItems = [];
    for (const devisData of devisServicesData.devis_services) {
      // Activités
      if (devisData.activities && Array.isArray(devisData.activities)) {
        for (const activity of devisData.activities) {
          allItems.push({
            id: activity.id,
            name: activity.activity?.name || 'Activité',
            description: `Service: ${activity.activity.service.name}` || 'Service',   //activity.description,
            duration: activity.activity?.duree_standard || 8, // Utiliser la durée standard de l'activité
            price: activity.prix_unitaire_ht,
            category: null,
            quantity: activity.quantite,
            unite: activity.unite,
            type: 'activity',
            devis_info: {
              numero: devisData.devis.numero,
              statut: devisData.devis.statut
            },
            intervenants: activity.intervenants
          });
        }
      }
      
      // Frais
      if (devisData.frais && Array.isArray(devisData.frais)) {
        for (const frais of devisData.frais) {
          allItems.push({
            id: frais.id,
            name: frais.ligne_frais?.description || frais.frais_category?.name || 'Frais',
            description: frais.description,
            duration: 0, // Pas de durée pour les frais
            price: frais.prix_unitaire_ht,
            category: null,
            quantity: frais.quantite,
            unite: frais.unite,
            type: 'frais',
            devis_info: {
              numero: devisData.devis.numero,
              statut: devisData.devis.statut
            },
            intervenants: frais.intervenants
          });
        }
      }
    }
    
    return allItems;
  }, [devisServicesData?.devis_services]);

  // Filtrer les activités et frais par catégorie sélectionnée (seulement si pas de contrat)
  const filteredServices = useMemo(() => {
    if (!devisServicesData?.devis_services || !selectedCategory || contractId) {
      return [];
    }
    
    // Les activités et frais des devis n'ont pas de catégorie, donc on retourne tous les éléments
    return devisServicesData.devis_services.flatMap(devisData => 
      [...(devisData.activities || []), ...(devisData.frais || [])]
    );
  }, [devisServicesData?.devis_services, selectedCategory, contractId]);

  // Utiliser les activités et frais des devis si disponible, sinon utiliser les services par catégorie
  const effectiveServices = useMemo(() => {
    if (contractId && devisServices.length > 0) {
      return devisServices;
    }
    return filteredServices;
  }, [contractId, devisServices, selectedCategory, filteredServices]);

  // Générer les activités quand les services filtrés changent
  useEffect(() => {
    if (effectiveServices.length > 0) {
      // Convertir directement les services en activités
      const tasks: ServiceTaskTemplate[] = effectiveServices.map(service => ({
        id: service.id,
        name: service.name,
        description: service.description || `Service: ${service.name}`,
        duration: Number(service.duration) || 8,
        price: service.price,
        category: service.category,
        quantity: (service as any).quantity,
        unite: (service as any).unite,
        type: (service as any).type,
        devis_info: (service as any).devis_info,
        intervenants: (service as any).intervenants,
      }));
      
      setGeneratedTasks(tasks);
      // Sélectionner automatiquement toutes les activités
      setSelectedTasks(new Set(tasks.map((_, index) => index)));
    } else {
      setGeneratedTasks([]);
      setSelectedTasks(new Set());
    }
  }, [effectiveServices]);

  const handleCategoryChange = (category: Category) => {
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
      toast.error('Veuillez sélectionner au moins une activité');
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
    
            project: projectId,
            due_date: format(globalDueDate, 'yyyy-MM-dd'),
            is_standard_task: true,
          }
        });
      }
      
      toast.success(`${tasksToCreate.length} activité(s) créée(s) avec succès`);
      setSelectedCategory(null);
      setGeneratedTasks([]);
      setSelectedTasks(new Set());
      setGlobalDueDate(undefined);
      onTasksCreated?.();
    } catch (error) {
      toast.error('Erreur lors de la création des activités');
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
          {contractId ? 'Activités basées sur le contrat' : 'Activités standards basées sur le catalogue'}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {contractId 
            ? 'Les activités sont créées à partir des activités et frais définis dans les devis liés au contrat du projet.'
            : 'Toutes les activités du projet sont créées à partir des services du catalogue. Sélectionnez une catégorie pour voir les activités disponibles.'
          }
        </p>
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

        {/* Sélection de la catégorie ou affichage du contrat */}
        {contractId ? (
          <div>
            <Label>Éléments des devis du contrat</Label>
            <div className="mt-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              {contractLoading ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Chargement du contrat...
                </div>
              ) : contractDetails ? (
                                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">Contrat {contractDetails.numero}</span>
                    </div>
                    <p className="text-sm text-blue-700">
                    {devisServices.length} élément(s) trouvé(s) dans les devis du contrat (activités et frais)
                  </p>
                    {devisServicesLoading && (
                      <div className="flex items-center gap-2 text-sm text-blue-600">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Chargement des services des devis...
                      </div>
                    )}
                  </div>
              ) : (
                <div className="text-center text-gray-500">
                  Aucun contrat trouvé
                </div>
              )}
            </div>
          </div>
        ) : (
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
                          <span className="font-medium">{category.name}</span>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleCategoryChange(category);
                                // Créer immédiatement toutes les activités de cette catégorie
                                if (globalDueDate) {
                                  handleCreateStandardTasks();
                                }
                              }}
                              disabled={!globalDueDate}
                            >
                              Créer toutes
                            </Button>
                          </div>
                        </div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}
            </div>
          </div>
        )}

        {/* Activités générées */}
        {generatedTasks.length > 0 && (
          <>
            <Separator />
            <div>
              <div className="flex justify-between items-center mb-3">
                <Label>Activités générées ({generatedTasks.length})</Label>
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
                {devisServicesLoading ? (
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
                            {/* <p className="text-sm text-gray-600 mt-1">{taskTemplate.description}</p> */}
                            <p className="text-sm text-gray-600 mt-1">{taskTemplate.description}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                <Clock className="h-3 w-3 mr-1" />
                                {taskTemplate.duration / 8} J
                              </Badge>
                              {taskTemplate.quantity && (
                                <Badge variant="outline" className="text-xs">
                                  Qté: {taskTemplate.quantity} {taskTemplate.unite?.code || 'unité(s)'}
                                </Badge>
                              )}
                              {taskTemplate.price && (
                                <Badge variant="outline" className="text-xs">
                                  {formatMontant(taskTemplate.price)}/unité
                                </Badge>
                              )}
                              {taskTemplate.type && (
                                <Badge variant={taskTemplate.type === 'frais' ? 'destructive' : 'outline'} className="text-xs">
                                  {taskTemplate.type === 'activity' ? 'Activité' : 'Frais'}
                                </Badge>
                              )}
                              {(taskTemplate as any).devis_info && (
                                <Badge variant="outline" className="text-xs">
                                  Devis {(taskTemplate as any).devis_info.numero}
                                </Badge>
                              )}
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
                  {selectedTasks.size} activité(s)
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-600">Temps total estimé:</span>
                  <p className="font-medium text-blue-900">{totalEstimatedHours/8} J</p>
                </div>
                <div>
                  <span className="text-blue-600">Catégorie sélectionnée:</span>
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
                    Créer {selectedTasks.size} activité(s)
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