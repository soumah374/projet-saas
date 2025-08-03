import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { 
  CreateProjectForm, 
  ProjectType, 
  ProjectPriority, 
} from '@/lib/types';
import { useContrats } from '@/hooks/use-contrats';
import type { ExtendedProject } from '@/lib/types';
import { ClientAutocomplete } from '@/components/ui/ClientAutocomplete';

interface EditProjectModalProps {
  children: React.ReactNode;
  project: ExtendedProject;
  onProjectUpdate: (projectId: string, data: Partial<CreateProjectForm>) => void;
}

export const EditProjectModal = ({ children, project, onProjectUpdate }: EditProjectModalProps) => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form data state
  const [formData, setFormData] = useState({
    title: project.title || '',
    type: project.type as ProjectType,
    client: project.client || '',
    description: project.description || '',
    objectives: project.objectives || '',
    budget: project.budget || '',
    deadline: project.deadline ? parseISO(project.deadline) : undefined,
    startDate: project.start_date ? parseISO(project.start_date) : undefined,
    priority: project.priority as ProjectPriority,
    contract: project.contract || null,
    tags: Array.isArray(project.tags) ? project.tags : []
  });

  const [newTag, setNewTag] = useState('');
  
  // Popover states
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [deadlineOpen, setDeadlineOpen] = useState(false);

  // React Query hooks
  const { data: contratsData, isLoading: contratsLoading } = useContrats({ 
    client: typeof formData.client === 'number' ? formData.client : null 
  });

  // Form options
  const projectTypes = ['Externe', 'Interne'] as const;
  const priorities = ['Basse', 'Normale', 'Haute', 'Urgente'] as const;

  // Initialize form data with project values
  useEffect(() => {
    if (project && open) {
      setFormData({
        title: project.title || '',
        type: project.type as ProjectType,
        client: project.client || '',
        description: project.description || '',
        objectives: project.objectives || '',
        budget: project.budget || '',
        deadline: project.deadline ? parseISO(project.deadline) : undefined,
        startDate: project.start_date ? parseISO(project.start_date) : undefined,
        priority: project.priority as ProjectPriority,
        contract: project.contract || null,
        tags: Array.isArray(project.tags) ? project.tags : []
      });
    }
  }, [project, open]);

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validation
      if (!formData.title.trim()) {
        alert('Le titre du projet est requis');
        setIsLoading(false);
        return;
      }
      
      if (!formData.type) {
        alert('Le type de projet est requis');
        setIsLoading(false);
        return;
      }
      
      if (!String(formData.client).trim()) {
        alert('Le client est requis');
        setIsLoading(false);
        return;
      }
      
      if (!formData.deadline) {
        alert('La date d\'échéance est requise');
        setIsLoading(false);
        return;
      }
      
      // Format data for API
      const projectData: Partial<CreateProjectForm> = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        objectives: formData.objectives?.trim() || undefined,
        type: formData.type || 'Externe',
        priority: formData.priority,
        start_date: formData.startDate ? format(formData.startDate, 'yyyy-MM-dd') : undefined,
        deadline: formData.deadline ? format(formData.deadline, 'yyyy-MM-dd') : '',
        budget: formData.budget ? String(formData.budget) : undefined,
        client: Number(formData.client.toString()),
        tags: formData.tags.length > 0 ? formData.tags : undefined,
      };

      await onProjectUpdate(project.id, projectData);
      setOpen(false);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du projet:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    // Reset to original project values
    if (project) {
      setFormData({
        title: project.title || '',
        type: project.type as ProjectType,
        client: project.client || '',
        description: project.description || '',
        objectives: project.objectives || '',
        budget: project.budget || '',
        deadline: project.deadline ? parseISO(project.deadline) : undefined,
        startDate: project.start_date ? parseISO(project.start_date) : undefined,
        priority: project.priority as ProjectPriority,
        contract: project.contract || null,
        tags: Array.isArray(project.tags) ? project.tags : []
      });
    }
    
    setStartDateOpen(false);
    setDeadlineOpen(false);
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={(newOpen) => {
        // Empêcher la fermeture si on est en train de sélectionner une date
        if (!newOpen && (startDateOpen || deadlineOpen)) {
          return;
        }
        setOpen(newOpen);
        if (!newOpen) {
          resetForm();
        }
      }}
      modal={true}
    >
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent 
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        onPointerDownOutside={(e) => {
          // Empêcher la fermeture si on clique sur un popover
          if (startDateOpen || deadlineOpen) {
            e.preventDefault();
          }
        }}
        onEscapeKeyDown={(e) => {
          // Empêcher la fermeture par la touche Escape si un popover est ouvert
          if (startDateOpen || deadlineOpen) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-blue-900">
            Modifier le projet: {project?.title}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations de base */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Titre du projet *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Entrez le titre du projet"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
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
                onChange={(e) => setFormData(prev => ({ ...prev, objectives: e.target.value }))}
                placeholder="Objectifs du projet"
                rows={2}
              />
            </div>
          </div>

          {/* Classification */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Type de projet *</Label>
              <Select
                value={formData.type}
                onValueChange={(value: ProjectType) => setFormData(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {projectTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority">Priorité *</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: ProjectPriority) => setFormData(prev => ({ ...prev, priority: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map(priority => (
                    <SelectItem key={priority} value={priority}>{priority}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Client */}
          <div>
            <Label htmlFor="client">Client *</Label>
            <ClientAutocomplete
              value={String(formData.client || '')}
              onValueChange={(value) => {
                const clientId = value ? parseInt(value) : null;
                setFormData(prev => ({ ...prev, client: clientId }));
              }}
              placeholder="Sélectionnez un client"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Date de début</Label>
              <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.startDate ? format(formData.startDate, 'PPP', { locale: fr }) : 'Sélectionner une date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-auto p-0" 
                  align="start"
                  side="bottom"
                >
                  <Calendar
                    mode="single"
                    selected={formData.startDate}
                    onSelect={(date) => {
                      setFormData(prev => ({ ...prev, startDate: date || undefined }));
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
                    type="button"
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.deadline ? format(formData.deadline, 'PPP', { locale: fr }) : 'Sélectionner une date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-auto p-0"
                  align="start"
                  side="bottom"
                >
                  <Calendar
                    mode="single"
                    selected={formData.deadline}
                    onSelect={(date) => {
                      setFormData(prev => ({ ...prev, deadline: date || undefined }));
                      setDeadlineOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Contrat */}
          <div>
            <Label htmlFor="contract">Contrat (optionnel)</Label>
            <Select
              value={formData.contract?.toString() || ''}
              onValueChange={(value) => {
                const contractId = value ? parseInt(value) : null;
                setFormData(prev => ({ ...prev, contract: contractId }));
              }}
              disabled={!formData.client || contratsLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder={
                  !formData.client 
                    ? "Sélectionnez d'abord un client" 
                    : contratsLoading 
                      ? "Chargement des contrats..." 
                      : "Sélectionnez un contrat"
                } />
              </SelectTrigger>
              <SelectContent>
                {contratsData?.results?.length === 0 ? (
                  <div className="px-2 py-1 text-sm text-muted-foreground">
                    Aucun contrat disponible pour ce client
                  </div>
                ) : (
                  contratsData?.results?.map((contrat) => (
                    <SelectItem key={contrat.id} value={contrat.id.toString()}>
                      {contrat.numero} - {contrat.statut}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Budget */}
          <div>
            <Label htmlFor="budget">Budget (optionnel)</Label>
            <Input
              id="budget"
              type="number"
              value={formData.budget || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
              placeholder="Montant du budget"
              step="0.01"
            />
          </div>

          {/* Tags */}
          <div>
            <Label>Tags du projet</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Ajouter un tag"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <Button type="button" onClick={addTag} size="sm">
                Ajouter
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map(tag => (
                <div key={tag} className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                  <span className="text-sm">{tag}</span>
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
            >
              {isLoading ? 'Mise à jour...' : 'Mettre à jour le projet'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 