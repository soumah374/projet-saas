import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Loader2, Play, AlertTriangle } from 'lucide-react';
import { useStartProject } from '@/hooks/use-projects';
import { useToast } from '@/hooks/use-toast';
import { format as formatDate } from 'date-fns';
import type { Project } from '@/lib/types';

interface StartProjectModalProps {
  project: Project;
  children: React.ReactNode;
}

export function StartProjectModal({ project, children }: StartProjectModalProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const startProjectMutation = useStartProject();

  const handleStartProject = async () => {
    try {
      const today = formatDate(new Date(), 'yyyy-MM-dd');
      await startProjectMutation.mutateAsync({ 
        projectId: String(project.id), 
        startDate: today 
      });
      toast({
        title: "Projet démarré",
        description: "Le projet a été démarré avec succès.",
      });
      setOpen(false);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de démarrer le projet. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Confirmer le démarrage du projet
          </DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir démarrer le projet "{project.title}" ? 
            Cette action va :
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Changer le statut du projet vers "Production"</li>
              <li>Définir la date de début à aujourd'hui</li>
              <li>Permettre le suivi des tâches et du temps</li>
            </ul>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => setOpen(false)}
            disabled={startProjectMutation.isPending}
          >
            Annuler
          </Button>
          <Button 
            onClick={handleStartProject}
            disabled={startProjectMutation.isPending}
            className="bg-green-600 hover:bg-green-700"
          >
            {startProjectMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Démarrage...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Démarrer le projet
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 