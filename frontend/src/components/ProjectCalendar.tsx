import { useState, useMemo, useContext } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { CalendarHeader } from './calendar/CalendarHeader';
import { CalendarStats } from './calendar/CalendarStats';
import { MonthView } from './calendar/MonthView';
import { WeekView } from './calendar/WeekView';
import { AgendaView } from './calendar/AgendaView';
import { GanttView } from './calendar/GanttView';
import { Event, EventStatus, EventType } from './calendar/types';
import { getEventStats } from './calendar/utils';
import { useProjects, useProjectTasks, useProjectEvents } from '@/hooks/use-projects';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { EventModal } from './EventModal';

// Options de mise en cache pour les requêtes
const queryOptions = {
  staleTime: 5 * 60 * 1000, // Considérer les données comme fraîches pendant 5 minutes
  cacheTime: 30 * 60 * 1000, // Garder les données en cache pendant 30 minutes
  refetchOnWindowFocus: false, // Ne pas recharger quand la fenêtre reprend le focus
};

interface ProjectCalendarProps {
  project: any;
}

// Ajout des types depuis le backend
interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface ProjectTask {
  id: number;
  title: string;
  description: string;
  status: 'À faire' | 'En cours' | 'Terminé' | 'En pause';
  assigned_to: User | null;
  start_date: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

interface ProjectEvent {
  id: number;
  title: string;
  description: string;
  type: 'Réunion' | 'Présentation' | 'Atelier' | 'Livraison' | 'Autre';
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  participants: User[];
  created_by: User;
  created_at: string;
  updated_at: string;
}

interface ApiResponse<T> {
  results: T[];
  error?: string;
}

export const ProjectCalendar = ({ project }: ProjectCalendarProps) => {
  // 1. State hooks
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'agenda' | 'gantt'>('month');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ProjectEvent | null>(null);

  // 2. Data fetching
  const { data: projectsData, isLoading: isLoadingProjects, error: projectsError } = useProjects();

  // 3. Derived state
  const activeProjects = useMemo(() => {
    if (!projectsData?.results) return [];
    return projectsData.results.filter(project => 
      ['Planification', 'En cours', 'Production'].includes(project.status)
    );
  }, [projectsData]);

  const projectIds = useMemo(() => activeProjects.map(project => project.id), [activeProjects]);

  // 4. Task and Event queries
  const { data: tasksData, isLoading: isLoadingTasks, error: tasksError } = useProjectTasks(project?.id) as { 
    data: ApiResponse<ProjectTask>, 
    isLoading: boolean,
    error?: string 
  };

  const { data: eventsData, isLoading: isLoadingEvents, error: eventsError } = useProjectEvents(project?.id) as {
    data: ApiResponse<ProjectEvent>,
    isLoading: boolean,
    error?: string
  };

  // 5. Events processing
  const allEvents = useMemo(() => {
    if (!project?.id || !tasksData?.results || !eventsData?.results) return [];
    
    const eventsList: Event[] = [];
    
    // Add tasks with due dates
    tasksData.results
      .filter((task: ProjectTask) => task.due_date)
      .forEach((task: ProjectTask) => {
        const now = new Date();
        const dueDate = new Date(task.due_date!);
        const isOverdue = dueDate < now && task.status !== 'Terminé';
        
        const taskStatus = (() => {
          switch (task.status) {
            case 'Terminé': return 'completed';
            case 'En pause': return 'paused';
            case 'En cours': return isOverdue ? 'overdue' : 'in-progress';
            case 'À faire': return isOverdue ? 'overdue' : 'upcoming';
            default: return 'upcoming';
          }
        })();

        eventsList.push({
          id: `task-${task.id}`,
          title: task.title,
          type: task.status === 'Terminé' ? 'milestone' : 'task',
          date: dueDate,
          time: '09:00',
          project: project.id,
          status: taskStatus as EventStatus,
          participants: task.assigned_to ? 
            [`${task.assigned_to.first_name} ${task.assigned_to.last_name}`.trim() || task.assigned_to.username] : 
            [],
          duration: 480,
          description: task.description
        });
      });

    // Add events
    eventsData.results.forEach((event: ProjectEvent) => {
      const startTime = new Date(`${event.date}T${event.start_time}`);
      const endTime = new Date(`${event.date}T${event.end_time}`);
      const durationInMinutes = Math.max(
        (endTime.getTime() - startTime.getTime()) / (1000 * 60),
        30 // minimum duration of 30 minutes
      );
      
      eventsList.push({
        id: `event-${event.id}`,
        title: event.title,
        type: event.type.toLowerCase() as EventType,
        date: new Date(event.date),
        time: event.start_time,
        project: project.id,
        status: 'upcoming',
        participants: event.participants.map(p => 
          `${p.first_name} ${p.last_name}`.trim() || p.username
        ),
        duration: durationInMinutes,
        location: event.location,
        description: event.description
      });
    });

    return eventsList;
  }, [tasksData?.results, eventsData?.results, project?.id]);

  const filteredEvents = useMemo(() => {
    return allEvents.filter(event => {
      const matchesType = filterType === 'all' || event.type === filterType;
      const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           event.project.toString().toLowerCase().includes(searchTerm.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [allEvents, filterType, searchTerm]);

  const stats = useMemo(() => getEventStats(allEvents), [allEvents]);

  // Vérifier s'il y a des erreurs dans les requêtes
  const taskErrors = isLoadingTasks ? [] : [tasksError].filter(Boolean);
  const eventErrors = isLoadingEvents ? [] : [eventsError].filter(Boolean);

  // Gérer les événements du calendrier
  const handleEventClick = (eventId: string) => {
    if (eventId.startsWith('event-')) {
      const id = parseInt(eventId.replace('event-', ''));
      const event = eventsData?.results.find((e: ProjectEvent) => e.id === id);
      
      if (event) {
        setSelectedEvent(event);
        setIsEventModalOpen(true);
      }
    }
  };

  const handleAddEvent = () => {
    setSelectedEvent(null);
    setIsEventModalOpen(true);
  };

  // Afficher l'état de chargement
  if (isLoadingProjects || isLoadingTasks || isLoadingEvents) {
    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <div className="grid grid-cols-4 gap-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <Skeleton className="h-[400px]" />
        </div>
      </div>
    );
  }

  // Afficher les erreurs s'il y en a
  if (projectsError || taskErrors.length > 0 || eventErrors.length > 0) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erreur</AlertTitle>
        <AlertDescription>
          {projectsError ? 
            "Une erreur est survenue lors du chargement des projets." :
            taskErrors.length > 0 ?
            "Une erreur est survenue lors du chargement des tâches." :
            "Une erreur est survenue lors du chargement des événements."
          }
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <CalendarHeader
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filterType={filterType}
          onFilterChange={setFilterType}
          onAddEvent={handleAddEvent}
        />
        <Button onClick={handleAddEvent}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvel événement
        </Button>
      </div>

      <CalendarStats stats={stats} />

      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="month">Vue Mensuelle</TabsTrigger>
          <TabsTrigger value="week">Vue Hebdomadaire</TabsTrigger>
          <TabsTrigger value="agenda">Agenda</TabsTrigger>
          <TabsTrigger value="gantt">Gantt</TabsTrigger>
        </TabsList>

        <TabsContent value="month">
          <MonthView events={filteredEvents} onEventClick={handleEventClick} />
        </TabsContent>

        <TabsContent value="week">
          <WeekView events={filteredEvents} onEventClick={handleEventClick} />
        </TabsContent>

        <TabsContent value="agenda">
          <AgendaView events={filteredEvents} projects={activeProjects} onEventClick={handleEventClick} />
        </TabsContent>

        <TabsContent value="gantt">
          <GanttView projects={activeProjects} />
        </TabsContent>
      </Tabs>

      {isEventModalOpen && (
        <EventModal
          projectId={project?.id}
          event={selectedEvent}
          isOpen={isEventModalOpen}
          onClose={() => {
            setIsEventModalOpen(false);
            setSelectedEvent(null);
          }}
        />
      )}
    </div>
  );
};
