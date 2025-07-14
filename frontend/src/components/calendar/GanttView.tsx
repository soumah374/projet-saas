
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Plus, Link2, Link2Off } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useProjectTasks, useUpdateProjectTask } from '@/hooks/use-projects';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { format, addDays, eachDayOfInterval, isSameDay, isWithinInterval, differenceInDays, addMonths, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { TaskModal } from '../TaskModal';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface GanttViewProps {
  projects: any[];
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

export const GanttView = ({ projects }: GanttViewProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [visibleDays, setVisibleDays] = useState(30);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [showDependencies, setShowDependencies] = useState(true);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [isAddingDependency, setIsAddingDependency] = useState(false);
  
  const { data: tasks, isLoading } = useProjectTasks(
    selectedProject || projects[0]?.id,
    undefined,
    { staleTime: 5 * 60 * 1000 }
  );
  
  const updateTaskMutation = useUpdateProjectTask();

  const dateRange = useMemo(() => {
    const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const end = addDays(start, visibleDays - 1);
    return eachDayOfInterval({ start, end });
  }, [currentDate, visibleDays]);

  const ganttTasks = useMemo(() => {
    if (!tasks?.results) return [];
    return tasks.results.map((task: any) => ({
      id: task.id.toString(),
      title: task.title,
      start: new Date(task.start_date || task.created_at),
      end: new Date(task.due_date || addDays(new Date(task.created_at), 1)),
      progress: task.completion_percentage || 0,
      dependencies: task.dependencies || [],
      assignee: task.assigned_to_name,
      status: task.status
    }));
  }, [tasks]);

  const handlePreviousMonth = () => {
    setCurrentDate(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => addMonths(prev, 1));
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination || !selectedProject) return;

    const { draggableId, source, destination } = result;
    if (source.index === destination.index) return;

    const task = ganttTasks.find(t => t.id === draggableId);
    if (!task) return;

    // Calculate new dates based on drag position
    const daysDiff = destination.index - source.index;
    const newStart = addDays(task.start, daysDiff);
    const newEnd = addDays(task.end, daysDiff);

    try {
      await updateTaskMutation.mutateAsync({
        projectId: selectedProject,
        taskId: parseInt(draggableId),
        data: {
          start_date: format(newStart, 'yyyy-MM-dd'),
          due_date: format(newEnd, 'yyyy-MM-dd')
        }
      });
      toast.success('Tâche déplacée avec succès');
    } catch (error) {
      toast.error('Erreur lors du déplacement de la tâche');
    }
  };

  const handleAddDependency = async (sourceId: string, targetId: string) => {
    if (!selectedProject || sourceId === targetId) return;

    const sourceTask = ganttTasks.find(t => t.id === sourceId);
    if (!sourceTask) return;

    // Check for circular dependencies
    const hasCircularDependency = (taskId: string, visited = new Set<string>()): boolean => {
      if (visited.has(taskId)) return true;
      visited.add(taskId);

      const task = ganttTasks.find(t => t.id === taskId);
      if (!task) return false;

      return task.dependencies.some(depId => hasCircularDependency(depId, new Set(visited)));
    };

    if (hasCircularDependency(targetId)) {
      toast.error('Dépendance circulaire détectée');
      return;
    }

    try {
      await updateTaskMutation.mutateAsync({
        projectId: selectedProject,
        taskId: parseInt(sourceId),
        data: {
          dependencies: [...sourceTask.dependencies, targetId]
        }
      });
      toast.success('Dépendance ajoutée avec succès');
    } catch (error) {
      toast.error('Erreur lors de l\'ajout de la dépendance');
    }
  };

  const handleRemoveDependency = async (sourceId: string, dependencyId: string) => {
    if (!selectedProject) return;

    const sourceTask = ganttTasks.find(t => t.id === sourceId);
    if (!sourceTask) return;

    try {
      await updateTaskMutation.mutateAsync({
        projectId: selectedProject,
        taskId: parseInt(sourceId),
        data: {
          dependencies: sourceTask.dependencies.filter(id => id !== dependencyId)
        }
      });
      toast.success('Dépendance supprimée avec succès');
    } catch (error) {
      toast.error('Erreur lors de la suppression de la dépendance');
    }
  };

  const getTaskStyle = (task: GanttTask) => {
    const startOffset = Math.max(0, differenceInDays(task.start, dateRange[0]));
    const duration = Math.min(
      differenceInDays(task.end, task.start) + 1,
      visibleDays - startOffset
    );

    let backgroundColor = 'bg-blue-500';
    switch (task.status) {
      case 'Terminé':
        backgroundColor = 'bg-green-500';
        break;
      case 'En pause':
        backgroundColor = 'bg-yellow-500';
        break;
      case 'En cours':
        backgroundColor = 'bg-blue-500';
        break;
      default:
        backgroundColor = 'bg-gray-500';
    }

    return {
      gridColumn: `${startOffset + 1} / span ${duration}`,
      backgroundColor: task.progress === 100 ? 'bg-green-500' : backgroundColor
    };
  };

  const renderDependencyLines = (task: GanttTask) => {
    if (!showDependencies || !task.dependencies.length) return null;

    return task.dependencies.map(depId => {
      const dependentTask = ganttTasks.find(t => t.id === depId);
      if (!dependentTask) return null;

      const startOffset = Math.max(0, differenceInDays(task.start, dateRange[0]));
      const depEndOffset = Math.max(0, differenceInDays(dependentTask.end, dateRange[0]));

      const startX = startOffset * 30 + 15; // 30px per day
      const endX = depEndOffset * 30 + 15;
      const startY = 4; // top of the task bar
      const endY = 4;

      return (
        <svg
          key={`${task.id}-${depId}`}
          className="absolute pointer-events-none"
          style={{
            left: 0,
            top: 0,
            width: '100%',
            height: '100%',
            zIndex: 1
          }}
        >
          <path
            d={`M ${startX} ${startY} C ${startX - 20} ${startY}, ${endX + 20} ${endY}, ${endX} ${endY}`}
            stroke="#94a3b8"
            strokeWidth="2"
            fill="none"
            strokeDasharray="4"
          />
        </svg>
      );
    });
  };

  return (
    <TooltipProvider>
      <Card className="h-full">
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-between">
            <CardTitle>Diagramme de Gantt</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handlePreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="px-4 py-2 text-sm font-medium">
                {format(currentDate, 'MMMM yyyy', { locale: fr })}
              </span>
              <Button variant="outline" size="sm" onClick={handleNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Select
                value={selectedProject || projects[0]?.id}
                onValueChange={(value) => setSelectedProject(value)}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Sélectionner un projet" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <TaskModal
                projectId={selectedProject || projects[0]?.id}
                mode="create"
              >
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle tâche
                </Button>
              </TaskModal>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDependencies(!showDependencies)}
              >
                {showDependencies ? (
                  <Link2 className="h-4 w-4 mr-2" />
                ) : (
                  <Link2Off className="h-4 w-4 mr-2" />
                )}
                {showDependencies ? 'Masquer les dépendances' : 'Afficher les dépendances'}
              </Button>
              
              {isAddingDependency && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    setIsAddingDependency(false);
                    setSelectedTask(null);
                  }}
                >
                  Annuler
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <ScrollArea className="h-[calc(100vh-300px)]">
            <div className="relative">
              {/* Header - Days */}
              <div className="grid grid-cols-[auto_repeat(30,minmax(30px,1fr))] gap-0 mb-4 sticky top-0 bg-white z-10">
                <div className="w-48 px-4 py-2 font-medium text-sm">Tâche</div>
                {dateRange.map((date, i) => (
                  <div
                    key={i}
                    className={`text-center py-2 text-xs font-medium border-r last:border-r-0 ${
                      isSameDay(date, new Date()) ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="font-bold">{format(date, 'dd')}</div>
                    <div className="text-gray-500">{format(date, 'EEE', { locale: fr })}</div>
                  </div>
                ))}
              </div>

              {/* Tasks */}
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="gantt-tasks">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-1"
                    >
                      {ganttTasks.map((task, index) => (
                        <Draggable
                          key={task.id}
                          draggableId={task.id}
                          index={index}
                        >
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="grid grid-cols-[auto_repeat(30,minmax(30px,1fr))] gap-0 group hover:bg-gray-50"
                              onClick={() => {
                                if (isAddingDependency && selectedTask) {
                                  handleAddDependency(selectedTask, task.id);
                                  setIsAddingDependency(false);
                                  setSelectedTask(null);
                                }
                              }}
                            >
                              {/* Task Info */}
                              <div className="w-48 px-4 py-2 flex items-center justify-between">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="truncate text-sm cursor-default">
                                      {task.title}
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <div className="space-y-1">
                                      <p>{task.assignee || 'Non assigné'}</p>
                                      {task.dependencies.length > 0 && (
                                        <div>
                                          <p className="font-medium">Dépendances:</p>
                                          <ul className="list-disc list-inside">
                                            {task.dependencies.map(depId => {
                                              const depTask = ganttTasks.find(t => t.id === depId);
                                              return (
                                                <li key={depId} className="flex items-center gap-2">
                                                  {depTask?.title}
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-4 w-4 p-0"
                                                    onClick={() => handleRemoveDependency(task.id, depId)}
                                                  >
                                                    <Link2Off className="h-3 w-3" />
                                                  </Button>
                                                </li>
                                              );
                                            })}
                                          </ul>
                                        </div>
                                      )}
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                                
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="opacity-0 group-hover:opacity-100"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedTask(task.id);
                                    setIsAddingDependency(true);
                                  }}
                                >
                                  <Link2 className="h-4 w-4" />
                                </Button>
                              </div>

                              {/* Task Timeline */}
                              <div className="col-span-30 relative grid grid-cols-30 gap-0 h-8">
                                {dateRange.map((date, i) => (
                                  <div
                                    key={i}
                                    className={`border-r last:border-r-0 ${
                                      isSameDay(date, new Date()) ? 'bg-blue-50' : ''
                                    }`}
                                  />
                                ))}
                                
                                {/* Task Bar */}
                                {isWithinInterval(task.start, { start: dateRange[0], end: dateRange[dateRange.length - 1] }) && (
                                  <div
                                    className={`absolute h-6 top-1 rounded ${
                                      task.status === 'Terminé' ? 'bg-green-500' :
                                      task.status === 'En pause' ? 'bg-yellow-500' :
                                      task.status === 'En cours' ? 'bg-blue-500' :
                                      'bg-gray-500'
                                    } group-hover:ring-2 ring-offset-1 ring-blue-400 transition-all duration-200`}
                                    style={getTaskStyle(task)}
                                  >
                                    <div
                                      className="h-full bg-black bg-opacity-50 rounded-l"
                                      style={{ width: `${task.progress}%` }}
                                    />
                                  </div>
                                )}
                                
                                {/* Dependency Lines */}
                                {renderDependencyLines(task)}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};
