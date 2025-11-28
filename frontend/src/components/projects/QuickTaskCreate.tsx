import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, X, Check } from 'lucide-react';
import { useCreateProjectTask } from '@/hooks/use-projects';
import { toast } from 'sonner';

interface QuickTaskCreateProps {
  projectId: string;
}

export function QuickTaskCreate({ projectId }: QuickTaskCreateProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const createTaskMutation = useCreateProjectTask();

  const handleCreate = async () => {
    if (!taskTitle.trim()) {
      toast.error('Veuillez saisir un titre pour la tâche');
      return;
    }

    try {
      await createTaskMutation.mutateAsync({
        projectId,
        data: {
          title: taskTitle,
          description: '',
          status: 'À faire',
          estimated_hours: null,
          start_date: null,
          due_date: null
        }
      });

      toast.success('Tâche créée avec succès');
      setTaskTitle('');
      setIsCreating(false);
    } catch (error) {
      toast.error('Erreur lors de la création de la tâche');
      console.error('Error creating task:', error);
    }
  };

  const handleCancel = () => {
    setTaskTitle('');
    setIsCreating(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreate();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (!isCreating) {
    return (
      <Button
        variant="outline"
        className="w-full border-dashed"
        onClick={() => setIsCreating(true)}
      >
        <Plus className="h-4 w-4 mr-2" />
        Ajouter une tâche rapidement
      </Button>
    );
  }

  return (
    <Card className="border-2 border-blue-200 bg-blue-50/50">
      <CardContent className="p-4">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Titre de la tâche..."
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            onKeyDown={handleKeyPress}
            autoFocus
            className="flex-1 bg-white"
          />
          <Button
            size="icon"
            onClick={handleCreate}
            disabled={createTaskMutation.isPending || !taskTitle.trim()}
            title="Créer la tâche (Enter)"
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            onClick={handleCancel}
            disabled={createTaskMutation.isPending}
            title="Annuler (Esc)"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Appuyez sur <kbd className="px-1 py-0.5 text-xs rounded bg-gray-200">Enter</kbd> pour créer ou <kbd className="px-1 py-0.5 text-xs rounded bg-gray-200">Esc</kbd> pour annuler
        </p>
      </CardContent>
    </Card>
  );
}
