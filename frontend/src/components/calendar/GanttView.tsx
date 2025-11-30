
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Link2, Link2Off, ZoomIn, ZoomOut } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useProjectTasks } from '@/hooks/use-projects';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { format, addDays, eachDayOfInterval, differenceInDays, addMonths, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ProjectTask } from '@/lib/types';

interface GanttViewProps {
  projectId: string;
}

interface GanttTask {
  id: string;
  title: string;
  start: Date;
  end: Date;
  progress: number;
  dependencies: string[];
  assignee?: string;
  status: string;
}

function safeParseDate(date?: string | Date | null): Date | null {
  if (!date) return null;
  const parsed = typeof date === 'string' ? new Date(date) : date;
  return parsed instanceof Date && !isNaN(parsed.getTime()) ? parsed : null;
}


export const GanttView = ({ projectId }: GanttViewProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [visibleDays, setVisibleDays] = useState(30);
  const [showDependencies, setShowDependencies] = useState(true);

  const { data: tasks } = useProjectTasks(projectId);
  
  const dateRange = useMemo(() => {
    const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const end = addDays(start, visibleDays - 1);
    // const end = addDays(start, visibleDays);
    return { start, end, days: eachDayOfInterval({ start, end }) };
  }, [currentDate, visibleDays]);

  const ganttTasks = useMemo(() => {
    if (!tasks) return [];
    return tasks.results
      .map((task: ProjectTask) => {
        const fallbackDate = addDays(new Date(), 1);
        const start = safeParseDate(task.start_date) || fallbackDate;
        const end = safeParseDate(task.due_date) || fallbackDate;

        return {
          id: task.id.toString(),
          title: task.title,
          start,
          end,
          progress: typeof task.completion_percentage === 'number' ? task.completion_percentage : 0,
          dependencies: [],
          assignee: task.assigned_to_name || '',
          status: task.status
        };
      })
      .filter(task => {
        // Filter out tasks that are completely outside the visible range
        return task.end >= dateRange.start && task.start <= dateRange.end;
      });
  }, [tasks, dateRange.start, dateRange.end]);

  // Calculate task position and width
  const getTaskStyle = (task: GanttTask) => {
    const totalDays = differenceInDays(dateRange.end, dateRange.start) + 1;

    // Clamp task start and end to visible range
    const visibleStart = task.start < dateRange.start ? dateRange.start : task.start;
    const visibleEnd = task.end > dateRange.end ? dateRange.end : task.end;

    // Calculate position from the start of the visible range
    const daysFromStart = differenceInDays(visibleStart, dateRange.start);
    const taskDuration = differenceInDays(visibleEnd, visibleStart) + 1;

    const leftPercent = (daysFromStart / totalDays) * 100;
    const widthPercent = (taskDuration / totalDays) * 100;

    return {
      left: `${Math.max(0, leftPercent)}%`,
      width: `${Math.min(100 - leftPercent, widthPercent)}%`
    };
  };

  // Get color based on status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Terminé': return '#22c55e';
      case 'En cours': return '#3b82f6';
      case 'En pause': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const handlePreviousMonth = () => {
    setCurrentDate(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => addMonths(prev, 1));
  };

  const handleZoomIn = () => {
    setVisibleDays(prev => Math.max(7, prev - 7));
  };

  const handleZoomOut = () => {
    setVisibleDays(prev => Math.min(90, prev + 7));
  };

  const renderTaskList = () => (
    <Droppable droppableId="task-list" type="TASK">
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={`space-y-2 p-4 ${snapshot.isDraggingOver ? 'bg-gray-50' : ''}`}
        >
          {ganttTasks.map((task, index) => (
            <Draggable key={task.id} draggableId={task.id} index={index}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.draggableProps}
                  {...provided.dragHandleProps}
                  className={`rounded-lg border p-3 ${
                    snapshot.isDragging ? 'bg-gray-100' : 'bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{task.title}</span>
                    <Badge variant={task.status === 'Terminé' ? 'default' : 'secondary'}>
                      {task.status}
                    </Badge>
                  </div>
                  {task.assignee && (
                    <div className="mt-2 text-sm text-gray-500">
                      Assigné à: {task.assignee}
                    </div>
                  )}
                </div>
              )}
            </Draggable>
          ))}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-4">
        <CardTitle className="text-lg sm:text-xl">Vue Gantt</CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-1 border rounded-md bg-white">
            <Button variant="ghost" size="icon" onClick={handleZoomOut} title="Dézoomer" className="h-8 w-8">
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <span className="px-2 text-xs text-gray-600 whitespace-nowrap">{visibleDays}j</span>
            <Button variant="ghost" size="icon" onClick={handleZoomIn} title="Zoomer" className="h-8 w-8">
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="flex items-center space-x-1">
            <Button variant="outline" size="icon" onClick={handlePreviousMonth} title="Mois précédent" className="h-8 w-8">
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleNextMonth} title="Mois suivant" className="h-8 w-8">
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowDependencies(!showDependencies)}
            title={showDependencies ? "Masquer les dépendances" : "Afficher les dépendances"}
            className="h-8 w-8 hidden sm:flex"
          >
            {showDependencies ? (
              <Link2 className="h-3.5 w-3.5" />
            ) : (
              <Link2Off className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex flex-col lg:grid lg:grid-cols-[280px,1fr] h-[500px] lg:h-[600px]">
          {/* Task List Section */}
          <div className="border-b lg:border-b-0 lg:border-r flex flex-col overflow-hidden max-h-[250px] lg:max-h-none">
            <div className="p-3 lg:p-4 border-b bg-gray-50 flex-shrink-0">
              <h3 className="font-semibold text-sm lg:text-base">Activités</h3>
            </div>
            <ScrollArea className="flex-1">
              <DragDropContext onDragEnd={() => {}}>
                {renderTaskList()}
              </DragDropContext>
            </ScrollArea>
          </div>

          {/* Gantt Diagram Section */}
          <div className="flex flex-col overflow-hidden flex-1">
            <div className="p-3 lg:p-4 border-b bg-gray-50 flex-shrink-0">
              <h3 className="font-semibold text-sm lg:text-base">
                Diagramme - {format(dateRange.start, 'MMMM yyyy', { locale: fr })}
              </h3>
            </div>
            <div className="flex-1 overflow-auto bg-white">
              <div className="min-w-max p-2 lg:p-4">
                {/* Timeline header */}
                <div
                  className="grid border-b bg-gray-50 sticky top-0 z-10"
                  style={{
                    gridTemplateColumns: `repeat(${dateRange.days.length}, minmax(40px, 1fr))`
                  }}
                >
                  {dateRange.days.map((date) => {
                    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                    const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                    return (
                      <div
                        key={date.toISOString()}
                        className={`px-2 py-2 text-center text-xs border-r last:border-r-0 ${
                          isWeekend ? 'bg-gray-100' : ''
                        } ${isToday ? 'bg-blue-100 font-bold' : ''}`}
                      >
                        <div>{format(date, 'EEE', { locale: fr })}</div>
                        <div className="font-semibold">{format(date, 'd')}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Tasks timeline */}
                <div className="relative py-4" style={{ minHeight: ganttTasks.length ? `${ganttTasks.length * 52 + 32}px` : '120px' }}>
                  {/* Grid background - continuous vertical lines */}
                  <div
                    className="grid absolute top-0 left-0 right-0 pointer-events-none"
                    style={{
                      gridTemplateColumns: `repeat(${dateRange.days.length}, minmax(40px, 1fr))`,
                      height: ganttTasks.length ? `${ganttTasks.length * 52 + 32}px` : '120px'
                    }}
                  >
                    {dateRange.days.map((date) => {
                      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                      const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                      return (
                        <div
                          key={`grid-${date.toISOString()}`}
                          className={`border-r last:border-r-0 h-full ${
                            isWeekend ? 'bg-gray-50' : ''
                          } ${isToday ? 'bg-blue-50' : ''}`}
                        />
                      );
                    })}
                  </div>

                  {/* Task bars */}
                  {ganttTasks.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 relative">
                      Aucune activité dans la période sélectionnée
                    </div>
                  ) : (
                    <div className="space-y-3 relative">
                      {ganttTasks.map((task) => {
                        const taskStyle = getTaskStyle(task);
                        const statusColor = getStatusColor(task.status);

                        return (
                          <div
                            key={task.id}
                            className="relative h-10 flex items-center"
                          >
                            {/* Task bar */}
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div
                                    className="absolute h-7 rounded shadow-sm cursor-pointer hover:shadow-md transition-shadow overflow-hidden z-10"
                                    style={{
                                      ...taskStyle,
                                      backgroundColor: statusColor
                                    }}
                                  >
                                    {/* Progress bar */}
                                    <div
                                      className="h-full bg-black bg-opacity-20 transition-all"
                                      style={{ width: `${task.progress}%` }}
                                    />
                                    {/* Task title overlay */}
                                    <div className="absolute inset-0 flex items-center px-2">
                                      <span className="text-white text-xs font-medium truncate">
                                        {task.title}
                                      </span>
                                    </div>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <div className="space-y-1">
                                    <p className="font-medium">{task.title}</p>
                                    <p className="text-sm">
                                      Début: {format(task.start, 'dd/MM/yyyy', { locale: fr })}
                                    </p>
                                    <p className="text-sm">
                                      Fin: {format(task.end, 'dd/MM/yyyy', { locale: fr })}
                                    </p>
                                    <p className="text-sm">Statut: {task.status}</p>
                                    <p className="text-sm">Progression: {task.progress}%</p>
                                    {task.assignee && (
                                      <p className="text-sm">Assigné à: {task.assignee}</p>
                                    )}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
