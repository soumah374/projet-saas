import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Play, Square, Clock, AlertCircle } from 'lucide-react';
import { useActiveTimer, useStartTimer, useStopTimer } from '@/hooks/use-timers';
import { useProjectTasks } from '@/hooks/use-projects';
import { toast } from 'sonner';

interface TimesheetTimerProps {
  projectId: string;
}

export function TimesheetTimer({ projectId }: TimesheetTimerProps) {
  const [selectedTask, setSelectedTask] = useState('');
  const [description, setDescription] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);

  const { data: activeTimer, refetch: refetchActiveTimer } = useActiveTimer(projectId);
  const { data: tasksData } = useProjectTasks(projectId);
  const tasks = tasksData?.results || [];
  const startTimerMutation = useStartTimer();
  const stopTimerMutation = useStopTimer();

  // Mettre à jour le temps écoulé chaque seconde si un timer est actif
  useEffect(() => {
    if (activeTimer) {
      const startTime = new Date(activeTimer.start_time).getTime();
      const updateElapsed = () => {
        const now = Date.now();
        setElapsedTime(Math.floor((now - startTime) / 1000));
      };

      updateElapsed();
      const interval = setInterval(updateElapsed, 1000);
      return () => clearInterval(interval);
    } else {
      setElapsedTime(0);
    }
  }, [activeTimer]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatHours = (seconds: number) => {
    return (seconds / 3600).toFixed(1);
  };

  const handleStart = async () => {
    if (!selectedTask) {
      toast.error('Veuillez sélectionner une tâche');
      return;
    }

    try {
      await startTimerMutation.mutateAsync({
        project_id: projectId,
        data: {
          project: projectId,
          task: parseInt(selectedTask),
          description,
          start_time: new Date().toISOString(),
        }
      });
      toast.success('Timer démarré');
      refetchActiveTimer();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur lors du démarrage du timer');
    }
  };

  const handleStop = async () => {
    if (!activeTimer) return;

    try {
      const result = await stopTimerMutation.mutateAsync({
        project_id: projectId,
        timerId: activeTimer.id
      });
      toast.success(`Timer arrêté - ${result.hours}h enregistrées`);
      setSelectedTask('');
      setDescription('');
      refetchActiveTimer();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur lors de l\'arrêt du timer');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Timer de feuille de temps
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeTimer ? (
          <div className="space-y-4">
            {/* Timer actif */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 text-center">
              <Badge variant="default" className="mb-3">
                <Play className="h-3 w-3 mr-1" />
                En cours
              </Badge>
              <div className="text-5xl font-bold text-blue-600 mb-2">
                {formatTime(elapsedTime)}
              </div>
              <div className="text-sm text-gray-600 mb-1">
                {formatHours(elapsedTime)} heures
              </div>
              <div className="text-sm font-medium text-gray-700 mb-3">
                {activeTimer.task_title}
              </div>
              {activeTimer.description && (
                <p className="text-sm text-gray-600 mb-3 bg-white p-2 rounded">
                  {activeTimer.description}
                </p>
              )}
              <Button
                onClick={handleStop}
                variant="destructive"
                className="w-full"
                disabled={stopTimerMutation.isPending}
              >
                <Square className="h-4 w-4 mr-2" />
                {stopTimerMutation.isPending ? 'Arrêt en cours...' : 'Arrêter le timer'}
              </Button>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">Timer en cours</p>
                <p>Arrêtez le timer actuel pour en démarrer un nouveau</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Nouveau timer */}
            <div>
              <label className="text-sm font-medium mb-2 block">Tâche *</label>
              <Select value={selectedTask} onValueChange={setSelectedTask}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez une tâche" />
                </SelectTrigger>
                <SelectContent>
                  {tasks
                    .filter((task: any) => task.status !== 'Terminé')
                    .map((task: any) => (
                      <SelectItem key={task.id} value={task.id.toString()}>
                        <div className="flex items-center gap-2">
                          <span>{task.title}</span>
                          <Badge variant="secondary" className="text-xs">
                            {task.status}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Description (optionnelle)
              </label>
              <Textarea
                placeholder="Décrivez ce sur quoi vous travaillez..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <Button
              onClick={handleStart}
              className="w-full"
              disabled={!selectedTask || startTimerMutation.isPending}
            >
              <Play className="h-4 w-4 mr-2" />
              {startTimerMutation.isPending ? 'Démarrage...' : 'Démarrer le timer'}
            </Button>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-sm text-gray-600">
                <strong>Comment ça marche ?</strong>
              </p>
              <ul className="text-sm text-gray-600 mt-2 space-y-1 list-disc list-inside">
                <li>Sélectionnez une tâche</li>
                <li>Démarrez le timer</li>
                <li>Travaillez sur la tâche</li>
                <li>Arrêtez le timer pour créer automatiquement une feuille de temps</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
