import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit, Loader2 } from 'lucide-react';
import type { ProjectList, CreateProjectForm } from '@/lib/types';

interface EditProjectModalProps {
  children: React.ReactNode;
  project: ProjectList;
  onProjectUpdate: (projectId: string, data: Partial<CreateProjectForm>) => void;
}

export const EditProjectModal = ({ children, project, onProjectUpdate }: EditProjectModalProps) => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form data state - only basic fields available in ProjectList
  const [formData, setFormData] = useState({
    title: project.title,
    type: project.type,
    client: project.client,
    priority: project.priority,
    status: project.status,
    deadline: project.deadline
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await onProjectUpdate(project.id, {
        title: formData.title.trim(),
        type: formData.type,
        client: formData.client,
        priority: formData.priority,
        status: formData.status,
        deadline: formData.deadline
      });
      
      setOpen(false);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du projet:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: project.title,
      type: project.type,
      client: project.client,
      priority: project.priority,
      status: project.status,
      deadline: project.deadline
    });
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen) {
        resetForm();
      }
    }}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier le projet</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Titre du projet</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="client">Client</Label>
              <Input
                id="client"
                value={formData.client}
                onChange={(e) => setFormData(prev => ({ ...prev, client: e.target.value }))}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Type</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as any }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Événementiel">Événementiel</SelectItem>
                    <SelectItem value="Communication">Communication</SelectItem>
                    <SelectItem value="Audiovisuel">Audiovisuel</SelectItem>
                    <SelectItem value="Production">Production</SelectItem>
                    <SelectItem value="Digital">Digital</SelectItem>
                    <SelectItem value="Conseil">Conseil</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priority">Priorité</Label>
                <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as any }))}>
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

            <div>
              <Label htmlFor="status">Statut</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as any }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Planification">Planification</SelectItem>
                  <SelectItem value="En cours">En cours</SelectItem>
                  <SelectItem value="Production">Production</SelectItem>
                  <SelectItem value="En pause">En pause</SelectItem>
                  <SelectItem value="Terminé">Terminé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="deadline">Date d'échéance</Label>
              <Input
                id="deadline"
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                required
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Mise à jour...
                </>
              ) : (
                <>
                  <Edit className="w-4 h-4 mr-2" />
                  Mettre à jour
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 