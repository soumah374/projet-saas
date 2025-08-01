import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateProject } from '@/hooks/use-projects';
import { useUsers } from '@/hooks/use-users';
import { useDepartments } from '@/hooks/use-departments';
import type { CreateProjectPayload, ProjectType } from '@/lib/types';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface CreateProjectModalProps {
  onProjectCreate?: (project: CreateProjectPayload) => Promise<void>;
  isOpen: boolean;
  onClose: () => void;
}

interface FormData extends CreateProjectPayload {
  project_manager: string;
  created_at: string;
}

const initialFormData: FormData = {
  title: '',
  type: 'Externe',
  client: '',
  departments: [],
  project_manager: '',
  // Champs automatiques
  created_at: new Date().toISOString().split('T')[0],
  // Champs requis par l'API mais non visibles dans le formulaire
  description: 'Projet créé',
  status: 'Prospection',
  priority: 'Normale',
  start_date: new Date().toISOString().split('T')[0],
  deadline: new Date().toISOString().split('T')[0],
  budget: '',
  contract: '',
  tags: [],
  objectives: ''
};

const projectTypes: { value: ProjectType; label: string }[] = [
  { value: 'Externe', label: 'Externe' },
  { value: 'Interne', label: 'Interne' }
];

export function CreateProjectModal({ onProjectCreate, isOpen, onClose }: CreateProjectModalProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const createProjectMutation = useCreateProject();
  const { data: usersResponse } = useUsers();
  const { departments } = useDepartments();

  const projectManagers = usersResponse?.data?.results || [];

  const resetForm = () => {
    setFormData({
      ...initialFormData,
      created_at: new Date().toISOString().split('T')[0]
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      
      // Validate required fields
      if (!formData.title.trim()) throw new Error('Le nom du projet est requis');
      if (!formData.client.trim()) throw new Error('Le client est requis');
      if (!formData.departments.length) throw new Error('Au moins un département est requis');
      if (!formData.project_manager) throw new Error('Le chef de projet est requis');

      // Prepare payload
      const { project_manager, ...projectData } = formData;

      if (onProjectCreate) {
        await onProjectCreate(projectData);
      } else {
        await createProjectMutation.mutateAsync(projectData);
      }

      toast.success('Projet créé avec succès');
      resetForm();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Une erreur est survenue lors de la création du projet");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        resetForm();
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Créer un nouveau projet</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Nom du projet *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                required
                placeholder="Entrez le nom du projet"
              />
            </div>

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
              <Label htmlFor="client">Client *</Label>
              <Input
                id="client"
                value={formData.client}
                onChange={(e) => handleChange('client', e.target.value)}
                required
                placeholder="Nom du client"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="departments">Département *</Label>
              <Select
                value={formData.departments[0] || ''}
                onValueChange={(value) => handleChange('departments', [value])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un département" />
                </SelectTrigger>
                <SelectContent>
                  {departments?.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id.toString()}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="project_manager">Chef de projet *</Label>
              <Select
                value={formData.project_manager}
                onValueChange={(value) => handleChange('project_manager', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un chef de projet" />
                </SelectTrigger>
                <SelectContent>
                  {projectManagers.map((manager) => (
                    <SelectItem key={manager.id} value={manager.id.toString()}>
                      {manager.first_name} {manager.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              variant="outline" 
              type="button" 
              onClick={() => {
                resetForm();
                onClose();
              }}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="gap-2"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Création...' : 'Créer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
