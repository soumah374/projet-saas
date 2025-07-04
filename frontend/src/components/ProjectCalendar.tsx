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
import { Event } from './calendar/types';
import { getEventStats } from './calendar/utils';
import { useProjects, useProjectTasks, useProjectEvents } from '@/hooks/use-projects';
import { ProjectTask } from '@/lib/types';
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
  projects: any[];
}

export const ProjectCalendar = ({ projects }: ProjectCalendarProps) => {
  // 1. State hooks
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'agenda' | 'gantt'>('month');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  // 2. Data fetching
  const { data: projectsData, isLoading: isLoadingProjects, error: projectsError } = useProjects(
    undefined,
    queryOptions
  );

  // 3. Derived state
  const activeProjects = useMemo(() => {
    if (!projectsData?.results) return [];
    return projectsData.results.filter(project => 
      ['Planification', 'En cours', 'Production'].includes(project.status)
    );
  }, [projectsData]);

  const projectIds = useMemo(() => activeProjects.map(project => project.id), [activeProjects]);

  // 4. Task and Event queries - moved outside useMemo
  const taskQueries = projectIds.map(projectId => useProjectTasks(projectId, undefined, queryOptions));
  const eventQueries = projectIds.map(projectId => useProjectEvents(projectId, queryOptions));

  // 5. Events processing
  const events = useMemo(() => {
    if (!projectIds.length) return [];
    
    const allEvents: Event[] = [];
    
    // Add tasks
    taskQueries.forEach((query, index) => {
      if (query.data?.results && projectIds[index]) {
        const tasks = query.data.results;
        const projectId = projectIds[index];
        
        tasks.forEach(task => {
          if (!task.due_date) return;
          
          const now = new Date();
          const dueDate = new Date(task.due_date);
          const isOverdue = dueDate < now && task.status !== 'Terminé';

          allEvents.push({
            id: `task-${task.id}`,
            title: task.title,
            type: task.status === 'Terminé' ? 'milestone' : 
                  task.status === 'En pause' ? 'deadline' : 'task',
            date: dueDate,
            time: '09:00',
            project: projectId,
            status: task.status === 'Terminé' ? 'completed' :
                    isOverdue ? 'overdue' :
                    task.status === 'En cours' ? 'in-progress' : 'upcoming',
            participants: task.assigned_to ? [task.assigned_to.username] : [],
            duration: 480
          });
        });
      }
    });

    // Add events
    eventQueries.forEach((query, index) => {
      if (query.data?.results && projectIds[index]) {
        const events = query.data.results;
        const projectId = projectIds[index];

        events.forEach(event => {
          if (!event.date) return;
          
          allEvents.push({
            id: `event-${event.id}`,
            title: event.title,
            type: 'event',
            date: new Date(event.date),
            time: event.start_time || '09:00',
            project: projectId,
            status: 'upcoming',
            participants: event.participants?.map((p: any) => p.username) || [],
            duration: 60,
            location: event.location,
            description: event.description
          });
        });
      }
    });

    return allEvents;
  }, [taskQueries, eventQueries, projectIds]);

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const matchesType = filterType === 'all' || event.type === filterType;
      const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           event.project.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [events, filterType, searchTerm]);

  const stats = useMemo(() => getEventStats(events), [events]);

  // Vérifier s'il y a des erreurs dans les requêtes
  const taskErrors = taskQueries.map(query => query.error).filter(Boolean);
  const eventErrors = eventQueries.map(query => query.error).filter(Boolean);

  // Gérer les événements du calendrier
  const handleEventClick = (eventId: string) => {
    if (eventId.startsWith('event-')) {
      const id = parseInt(eventId.replace('event-', ''));
      const event = eventQueries
        .map(query => query.data?.results)
        .flat()
        .find((e: any) => e?.id === id);
      
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
  if (isLoadingProjects || taskQueries.some(query => query.isLoading) || eventQueries.some(query => query.isLoading)) {
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
          projectId={activeProjects[0]?.id}
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
