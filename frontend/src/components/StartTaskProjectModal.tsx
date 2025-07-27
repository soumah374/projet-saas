import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { useState } from 'react';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Separator } from '@radix-ui/react-dropdown-menu';
import { Select, SelectContent, SelectItem } from './ui/select';
import { SelectTrigger } from './ui/select';
import { SelectValue } from './ui/select';
import { useProjectLifecycle } from '@/hooks/use-project-lifecycle';
import { toast } from 'sonner';
import { ProjectTask, ProjectTaskStatus } from '@/lib/types';

interface StartTaskProjectModalProps {
  children: React.ReactNode;
  task: ProjectTask;
  projectId: string;
}

export const StartTaskProjectModal = ({children, task, projectId}: StartTaskProjectModalProps) => {
  const [open, setOpen] = useState(false);
  

  const taskStatuses: ProjectTaskStatus[] = ['À faire', 'En cours', 'En pause', 'Terminé'];
  const { updateTaskStatus } = useProjectLifecycle(projectId);

  const [formData, setFormData] = useState({
    start_date: task.start_date || undefined,
    status: task.status || 'À faire',
  });

  const handlerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateTaskStatus(Number(task.id), formData.status as 'À faire' | 'En cours' | 'En pause' | 'Terminé');
      toast.success('Activité démarrée avec succès');
    } catch (error) {
      toast.error('Une erreur est survenue');
    }
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Démarrer la activité</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handlerSubmit}
        >
          <div className="space-y-4">
            <p>Etes-vous sûr de vouloir démarrer la activité ?</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Statut</Label>
            <Select 
              value={formData.status} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as ProjectTaskStatus }))}
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
          <Separator className="my-4" />
          <DialogFooter>
            <div className="flex justify-between w-full mt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
              <Button type="submit">{formData.status === 'Terminé' ? 'Terminer la activité' : 'Démarrer la activité'}</Button>
            </div>
          </DialogFooter>
        </form>

      </DialogContent>

    </Dialog>
  )
} 