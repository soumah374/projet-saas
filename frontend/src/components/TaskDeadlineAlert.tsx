import { useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useUpcomingTaskDeadlines } from '@/hooks/use-projects';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Clock, AlertTriangle } from 'lucide-react';
import { TaskWithDeadline } from '@/lib/types';

interface TaskDeadlineAlertProps {
  projectId: string;
}

export const TaskDeadlineAlert = ({ projectId }: TaskDeadlineAlertProps) => {
  const { data: upcomingTasks, isLoading } = useUpcomingTaskDeadlines(projectId);

  useEffect(() => {
    if (upcomingTasks && Array.isArray(upcomingTasks) && upcomingTasks.length > 0) {
      upcomingTasks.forEach((task: TaskWithDeadline) => {
        if (task.days_remaining <= 2) {
          // Notification urgente pour les activités à moins de 2 jours
          toast.error(`Urgent: La activité "${task.title}" doit être terminée dans ${task.days_remaining} jour${task.days_remaining > 1 ? 's' : ''}!`, {
            duration: 10000,
          });
        } else if (task.days_remaining <= 5) {
          // Notification d'avertissement pour les activités à moins de 5 jours
          toast.warning(`La activité "${task.title}" arrive à échéance dans ${task.days_remaining} jours`, {
            duration: 8000,
          });
        }
      });
    }
  }, [upcomingTasks]);

  if (isLoading || !upcomingTasks || !Array.isArray(upcomingTasks) || upcomingTasks.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {upcomingTasks.map((task: TaskWithDeadline) => (
        <Alert
          key={task.id}
          variant={task.days_remaining <= 2 ? "destructive" : "default"}
          className="border-l-4"
        >
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Échéance proche
          </AlertTitle>
          <AlertDescription className="mt-2">
            <p className="font-medium">{task.title}</p>
            <p className="text-sm mt-1">
              Date d'échéance : {task.due_date ? format(new Date(task.due_date), 'PPP', { locale: fr }) : 'Non définie'}
              {' '}
              ({task.days_remaining} jour{task.days_remaining > 1 ? 's' : ''} restant{task.days_remaining > 1 ? 's' : ''})
            </p>
            {task.assigned_to && (
              <p className="text-sm mt-1">
                Assignée à : {task.assigned_to.first_name} {task.assigned_to.last_name}
              </p>
            )}
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
}; 