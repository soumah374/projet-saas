import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateInput } from '@/components/ui/DateInput';
import { useCreateProject, useUpdateProject } from '@/hooks/use-projects';
import type { Project, CreateProjectPayload, ProjectType, ProjectStatus, ProjectPriority } from '@/lib/types';
import { toast } from 'sonner';

interface CreateProjectModalProps {
  project?: Project;
  isOpen: boolean;
  onClose: () => void;
}

const projectTypes: { value: ProjectType; label: string }[] = [
  { value: 'event', label: 'Événementiel' },
  { value: 'communication', label: 'Communication' },
  { value: 'audiovisual', label: 'Audiovisuel' },
  { value: 'production', label: 'Production' },
  { value: 'digital', label: 'Digital' },
  { value: 'consulting', label: 'Conseil' }
];

const projectStatuses: { value: ProjectStatus; label: string }[] = [
  { value: 'Prospection', label: 'Prospection' },
  { value: 'Planification', label: 'Planification' },
  { value: 'En cours', label: 'En cours' },
  { value: 'Production', label: 'Production' },
  { value: 'En pause', label: 'En pause' },
  { value: 'Terminé', label: 'Terminé' }
];

const projectPriorities: { value: ProjectPriority; label: string }[] = [
  { value: 'Urgente', label: 'Urgente' },
  { value: 'Haute', label: 'Haute' },
  { value: 'Normale', label: 'Normale' },
  { value: 'Basse', label: 'Basse' }
];

export function CreateProjectModal({ project, isOpen, onClose }: CreateProjectModalProps) {
  const [formData, setFormData] = useState<CreateProjectPayload>({
    title: project?.title || '',
    description: project?.description || '',
    objectives: project?.objectives || '',
    type: project?.type || 'event',
    status: project?.status || 'Prospection',
    priority: project?.priority || 'Normale',
    start_date: project?.start_date || '',
    deadline: project?.deadline || '',
    budget: project?.budget || '',
    client: project?.client || '',
    departments: project?.departments || [],
    contract: project?.contract || '',
    tags: project?.tags || []
  });

  const createProject = useCreateProject();
  const updateProject = useUpdateProject();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (project) {
        await updateProject.mutateAsync({
          projectId: project.id,
          data: formData
        });
        toast.success('Projet mis à jour avec succès');
      } else {
        await createProject.mutateAsync(formData);
        toast.success('Projet créé avec succès');
      }
      onClose();
    } catch (error) {
      toast.error("Une erreur est survenue lors de l'opération");
    }
  };

  const handleChange = (field: keyof CreateProjectPayload, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {project ? 'Modifier le projet' : 'Créer un nouveau projet'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titre du projet *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="objectives">Objectifs</Label>
            <Textarea
              id="objectives"
              value={formData.objectives}
              onChange={(e) => handleChange('objectives', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type de projet *</Label>
              <Select
                value={formData.type}
                onValueChange={(value: ProjectType) => handleChange('type', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {projectTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Statut</Label>
              <Select
                value={formData.status}
                onValueChange={(value: ProjectStatus) => handleChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {projectStatuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priorité</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: ProjectPriority) => handleChange('priority', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {projectPriorities.map((priority) => (
                    <SelectItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="client">Client *</Label>
              <Input
                id="client"
                value={formData.client}
                onChange={(e) => handleChange('client', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Date de début</Label>
              <DateInput
                value={formData.start_date ? new Date(formData.start_date) : undefined}
                onChange={(date) => handleChange('start_date', date?.toISOString().split('T')[0])}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline">Date limite *</Label>
              <DateInput
                value={formData.deadline ? new Date(formData.deadline) : undefined}
                onChange={(date) => handleChange('deadline', date?.toISOString().split('T')[0])}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget">Budget</Label>
              <Input
                id="budget"
                type="number"
                step="0.01"
                value={formData.budget}
                onChange={(e) => handleChange('budget', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contract">Référence contrat</Label>
              <Input
                id="contract"
                value={formData.contract}
                onChange={(e) => handleChange('contract', e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose}>
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={createProject.isPending || updateProject.isPending}
            >
              {project ? 'Mettre à jour' : 'Créer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
