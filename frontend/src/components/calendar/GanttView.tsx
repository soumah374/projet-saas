
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
import { ProjectTask } from '@/lib/types';

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
  
  const { data: tasks } = useProjectTasks(selectedProject || projects[0]?.id);
  
  const updateTaskMutation = useUpdateProjectTask();

  const dateRange = useMemo(() => {
    const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const end = addDays(start, visibleDays - 1);
    return eachDayOfInterval({ start, end });
  }, [currentDate, visibleDays]);

  const ganttTasks = useMemo(() => {
    if (!tasks) return [];
    return tasks.map((task: ProjectTask) => ({
      id: task.id.toString(),
      title: task.title,
      start: new Date(task.start_date || task.created_at),
      end: new Date(task.due_date || addDays(new Date(task.created_at), 1)),
      progress: task.completion_percentage || 0,
      dependencies: [], // Initialize as empty array since it's not in the API response
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
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Vue Gantt</CardTitle>
        <div className="flex items-center space-x-2">
          <Select
            value={selectedProject || projects[0]?.id}
            onValueChange={(value) => setSelectedProject(value)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Sélectionner un projet" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowDependencies(!showDependencies)}
          >
            {showDependencies ? (
              <Link2 className="h-4 w-4" />
            ) : (
              <Link2Off className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-[300px,1fr] gap-6">
          <div className="border rounded-lg">
            <div className="p-4 border-b bg-gray-50">
              <h3 className="font-semibold">Tâches</h3>
            </div>
            <ScrollArea className="h-[500px]">
              <DragDropContext onDragEnd={() => {}}>
                {renderTaskList()}
              </DragDropContext>
            </ScrollArea>
          </div>
          <div className="border rounded-lg">
            <div className="p-4 border-b bg-gray-50">
              <h3 className="font-semibold">Diagramme</h3>
            </div>
            <ScrollArea className="h-[500px]">
              <div className="min-w-[800px]">
                {/* Timeline header */}
                <div className="grid grid-cols-[repeat(auto-fill,minmax(30px,1fr))] border-b">
                  {dateRange.map((date) => (
                    <div
                      key={date.toISOString()}
                      className="px-1 py-2 text-center text-xs border-r last:border-r-0"
                    >
                      {format(date, 'd', { locale: fr })}
                    </div>
                  ))}
                </div>
                {/* Tasks timeline */}
                <div className="space-y-2 py-4">
                  {ganttTasks.map((task) => (
                    <div
                      key={task.id}
                      className="grid grid-cols-[repeat(auto-fill,minmax(30px,1fr))] relative h-8"
                    >
                      {/* Task bar */}
                      <div
                        className="absolute h-6 rounded bg-blue-500"
                        style={{
                          left: `${(differenceInDays(task.start, dateRange[0]) * 100) / visibleDays}%`,
                          width: `${(differenceInDays(task.end, task.start) * 100) / visibleDays}%`,
                          backgroundColor: task.status === 'Terminé' ? '#22c55e' : undefined
                        }}
                      >
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="w-full h-full cursor-pointer">
                                <div
                                  className="h-full bg-blue-600"
                                  style={{ width: `${task.progress}%` }}
                                />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="font-medium">{task.title}</p>
                              <p className="text-sm">
                                {format(task.start, 'dd/MM/yyyy')} - {format(task.end, 'dd/MM/yyyy')}
                              </p>
                              <p className="text-sm">Progression: {task.progress}%</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
