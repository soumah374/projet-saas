import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useCreateProject } from '@/hooks/use-projects';
import { useClients } from '@/hooks/use-clients';
import { toast } from 'sonner';
import type { CreateProjectPayload, ProjectType, ProjectStatus, ProjectPriority } from '@/lib/types';
import { ClientAutocomplete } from '../ui/ClientAutocomplete';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateProjectModal({ isOpen, onClose, onSuccess }: CreateProjectModalProps) {
  const [formData, setFormData] = useState<CreateProjectPayload>({
    title: '',
    description: '',
    objectives: '',
    type: 'Externe',
    status: 'Prospection',
    priority: 'Normale',
    deadline: '',
    client: null,
    departments: [],
    contract: '',
    tags: []
  });

  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedClient, setSelectedClient] = useState<number | null>(null);

  const createProject = useCreateProject();
  const { data: clientsData } = useClients();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDate) {
      toast.error('Veuillez sélectionner une date limite');
      return;
    }

    if (!selectedClient) {
      toast.error('Veuillez sélectionner un client');
      return;
    }

    const projectData: CreateProjectPayload = {
      ...formData,
      deadline: format(selectedDate, 'yyyy-MM-dd'),
      client: selectedClient
    };

    try {
      await createProject.mutateAsync(projectData);
      toast.success('Projet créé avec succès');
      onClose();
      onSuccess?.();
      // Reset form
      setFormData({
        title: '',
        description: '',
        objectives: '',
        type: 'Externe',
        status: 'Prospection',
        priority: 'Normale',
        deadline: '',
        client: null,
        departments: [],
        contract: '',
        tags: []
      });
      setSelectedDate(undefined);
      setSelectedClient(null);
    } catch (error) {
      toast.error('Erreur lors de la création du projet');
    }
  };

  const handleInputChange = (field: keyof CreateProjectPayload, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Créer un nouveau projet</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations de base */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Titre du projet *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Entrez le titre du projet"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Décrivez le projet"
                rows={3}
                required
              />
            </div>

            <div>
              <Label htmlFor="objectives">Objectifs</Label>
              <Textarea
                id="objectives"
                value={formData.objectives}
                onChange={(e) => handleInputChange('objectives', e.target.value)}
                placeholder="Objectifs du projet"
                rows={2}
              />
            </div>
          </div>

          {/* Classification */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="type">Type de projet *</Label>
              <Select
                value={formData.type}
                onValueChange={(value: ProjectType) => handleInputChange('type', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Externe">Externe</SelectItem>
                  <SelectItem value="Interne">Interne</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Statut *</Label>
              <Select
                value={formData.status}
                onValueChange={(value: ProjectStatus) => handleInputChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Prospection">Prospection</SelectItem>
                  <SelectItem value="Devis">Devis</SelectItem>
                  <SelectItem value="Production">Production</SelectItem>
                  <SelectItem value="Livraison">Livraison</SelectItem>
                  <SelectItem value="Terminé">Terminé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority">Priorité *</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: ProjectPriority) => handleInputChange('priority', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Basse">Basse</SelectItem>
                  <SelectItem value="Normale">Normale</SelectItem>
                  <SelectItem value="Haute">Haute</SelectItem>
                  <SelectItem value="Urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Client */}
          <div>
            <ClientAutocomplete
              value={formData.client?.toString() || ''}
              onValueChange={(value) => handleInputChange('client', value)}
              placeholder="Sélectionnez un client"
            />
          </div>
          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="deadline">Date limite *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP", { locale: fr }) : "Sélectionner une date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    initialFocus
                    locale={fr}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="contract">Référence contrat</Label>
              <Input
                id="contract"
                value={formData.contract}
                onChange={(e) => handleInputChange('contract', e.target.value)}
                placeholder="Référence du contrat"
              />
            </div>
          </div>

          {/* Budget */}
          <div>
            <Label htmlFor="budget">Budget (optionnel)</Label>
            <Input
              id="budget"
              type="number"
              value={formData.budget || ''}
              onChange={(e) => handleInputChange('budget', e.target.value)}
              placeholder="Montant du budget"
              step="0.01"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={createProject.isPending}
            >
              {createProject.isPending ? 'Création...' : 'Créer le projet'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
