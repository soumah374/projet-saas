import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, Clock, TrendingUp } from 'lucide-react';
import { format, differenceInDays, addDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { ProjectTask } from '@/lib/types';

interface ProjectGanttChartProps {
  tasks: ProjectTask[];
  projectStartDate?: string | null;
  projectEndDate?: string | null;
}

interface GanttTask {
  id: number;
  title: string;
  status: string;
  startDate: Date;
  endDate: Date;
  progress: number;
  assignedTo?: string;
}

export function ProjectGanttChart({ tasks, projectStartDate, projectEndDate }: ProjectGanttChartProps) {
  const ganttData = useMemo(() => {
    // Filtrer les tâches avec dates
    const validTasks = tasks.filter(task => task.start_date && task.due_date);

    if (validTasks.length === 0) {
      return null;
    }

    // Calculer les dates min/max
    const dates = validTasks.flatMap(task => [
      new Date(task.start_date!),
      new Date(task.due_date!)
    ]);

    let minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    let maxDate = new Date(Math.max(...dates.map(d => d.getTime())));

    // Utiliser les dates du projet si disponibles
    if (projectStartDate) {
      const projectStart = new Date(projectStartDate);
      if (projectStart < minDate) minDate = projectStart;
    }
    if (projectEndDate) {
      const projectEnd = new Date(projectEndDate);
      if (projectEnd > maxDate) maxDate = projectEnd;
    }

    // Arrondir au début/fin du mois
    minDate = startOfMonth(minDate);
    maxDate = endOfMonth(maxDate);

    const totalDays = differenceInDays(maxDate, minDate);

    // Transformer les tâches
    const ganttTasks: GanttTask[] = validTasks.map(task => ({
      id: task.id,
      title: task.title,
      status: task.status,
      startDate: new Date(task.start_date!),
      endDate: new Date(task.due_date!),
      progress: task.completion_percentage || 0,
      assignedTo: task.assigned_to_name
    }));

    // Générer les en-têtes de mois
    const months: Array<{ label: string; days: number }> = [];
    let currentDate = new Date(minDate);

    while (currentDate <= maxDate) {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const daysInView = differenceInDays(
        monthEnd > maxDate ? maxDate : monthEnd,
        monthStart < minDate ? minDate : monthStart
      ) + 1;

      months.push({
        label: format(currentDate, 'MMMM yyyy', { locale: fr }),
        days: daysInView
      });

      currentDate = addDays(monthEnd, 1);
    }

    return {
      tasks: ganttTasks,
      minDate,
      maxDate,
      totalDays,
      months
    };
  }, [tasks, projectStartDate, projectEndDate]);

  if (!ganttData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Diagramme de Gantt
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>Aucune tâche avec dates planifiées</p>
            <p className="text-sm mt-2">Ajoutez des dates de début et de fin aux tâches pour voir le diagramme</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Terminé':
        return 'bg-green-500';
      case 'En cours':
        return 'bg-blue-500';
      case 'En pause':
        return 'bg-orange-500';
      default:
        return 'bg-gray-400';
    }
  };

  const calculatePosition = (date: Date) => {
    const daysFromStart = differenceInDays(date, ganttData.minDate);
    return (daysFromStart / ganttData.totalDays) * 100;
  };

  const calculateWidth = (startDate: Date, endDate: Date) => {
    const duration = differenceInDays(endDate, startDate) + 1;
    return (duration / ganttData.totalDays) * 100;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Diagramme de Gantt
          </CardTitle>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{ganttData.totalDays} jours</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              <span>{ganttData.tasks.length} tâches</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="w-full">
          <div className="min-w-[800px]">
            {/* En-tête Timeline */}
            <div className="flex border-b">
              {/* Colonne des tâches */}
              <div className="w-[250px] flex-shrink-0 border-r p-2 bg-gray-50 font-medium">
                Tâches
              </div>
              {/* Mois */}
              <div className="flex-1 flex">
                {ganttData.months.map((month, index) => (
                  <div
                    key={index}
                    className="border-r px-2 py-2 text-center text-sm font-medium bg-gray-50"
                    style={{ width: `${(month.days / ganttData.totalDays) * 100}%` }}
                  >
                    {month.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Ligne aujourd'hui */}
            {(() => {
              const today = new Date();
              if (today >= ganttData.minDate && today <= ganttData.maxDate) {
                const todayPosition = calculatePosition(today);
                return (
                  <div
                    className="absolute h-full border-l-2 border-red-500 pointer-events-none z-10"
                    style={{ left: `calc(250px + ${todayPosition}%)` }}
                    title={format(today, 'dd MMMM yyyy', { locale: fr })}
                  >
                    <div className="absolute -top-6 -left-12 bg-red-500 text-white text-xs px-2 py-1 rounded">
                      Aujourd'hui
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            {/* Tâches */}
            <div className="relative">
              {ganttData.tasks.map((task, index) => {
                const startPos = calculatePosition(task.startDate);
                const width = calculateWidth(task.startDate, task.endDate);

                return (
                  <div key={task.id} className={`flex border-b ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                    {/* Info tâche */}
                    <div className="w-[250px] flex-shrink-0 border-r p-3">
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate" title={task.title}>
                            {task.title}
                          </p>
                          {task.assignedTo && (
                            <p className="text-xs text-muted-foreground truncate">
                              {task.assignedTo}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {task.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {task.progress}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Barre Gantt */}
                    <div className="flex-1 p-2 relative" style={{ minHeight: '60px' }}>
                      <div
                        className="absolute top-2 h-8 rounded-md shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                        style={{
                          left: `${startPos}%`,
                          width: `${width}%`,
                          minWidth: '40px'
                        }}
                        title={`${format(task.startDate, 'dd MMM', { locale: fr })} → ${format(task.endDate, 'dd MMM', { locale: fr })}`}
                      >
                        {/* Barre de fond */}
                        <div className={`h-full rounded-md ${getStatusColor(task.status)} opacity-30`} />

                        {/* Barre de progression */}
                        <div
                          className={`absolute top-0 h-full rounded-md ${getStatusColor(task.status)}`}
                          style={{ width: `${task.progress}%` }}
                        />

                        {/* Label */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-medium text-white drop-shadow px-2 truncate">
                            {differenceInDays(task.endDate, task.startDate) + 1}j
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Légende */}
            <div className="mt-4 p-4 bg-gray-50 rounded-lg flex gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gray-400" />
                <span>À faire</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-blue-500" />
                <span>En cours</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-orange-500" />
                <span>En pause</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-500" />
                <span>Terminé</span>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <div className="w-0.5 h-4 bg-red-500" />
                <span>Aujourd'hui</span>
              </div>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
