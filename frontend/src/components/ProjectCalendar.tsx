
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarHeader } from './calendar/CalendarHeader';
import { CalendarStats } from './calendar/CalendarStats';
import { MonthView } from './calendar/MonthView';
import { WeekView } from './calendar/WeekView';
import { AgendaView } from './calendar/AgendaView';
import { GanttView } from './calendar/GanttView';
import { Event } from './calendar/types';
import { getEventStats } from './calendar/utils';

interface ProjectCalendarProps {
  projects: any[];
}

export const ProjectCalendar = ({ projects }: ProjectCalendarProps) => {
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'agenda' | 'gantt'>('month');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Données d'exemple d'événements
  const [events] = useState<Event[]>([
    {
      id: '1',
      title: 'Réunion client TechCorp',
      type: 'meeting',
      date: new Date(2024, 11, 25),
      time: '14:00',
      project: 'PROJ-2024-001',
      status: 'upcoming',
      participants: ['Sarah M.', 'Pierre L.'],
      duration: 60
    },
    {
      id: '2',
      title: 'Livraison assets visuels',
      type: 'milestone',
      date: new Date(2024, 11, 28),
      project: 'PROJ-2024-003',
      status: 'upcoming'
    },
    {
      id: '3',
      title: 'Deadline finale TechCorp',
      type: 'deadline',
      date: new Date(2024, 11, 25),
      project: 'PROJ-2024-001',
      status: 'upcoming'
    },
    {
      id: '4',
      title: 'Production vidéo',
      type: 'task',
      date: new Date(2024, 11, 30),
      time: '09:00',
      project: 'PROJ-2024-003',
      status: 'in-progress',
      duration: 480
    }
  ]);

  const filteredEvents = events.filter(event => {
    const matchesType = filterType === 'all' || event.type === filterType;
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.project.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const stats = getEventStats(events);

  return (
    <div className="space-y-6">
      <CalendarHeader
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterType={filterType}
        onFilterChange={setFilterType}
      />

      <CalendarStats stats={stats} />

      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="month">Vue Mensuelle</TabsTrigger>
          <TabsTrigger value="week">Vue Hebdomadaire</TabsTrigger>
          <TabsTrigger value="agenda">Agenda</TabsTrigger>
          <TabsTrigger value="gantt">Gantt</TabsTrigger>
        </TabsList>

        <TabsContent value="month">
          <MonthView events={filteredEvents} />
        </TabsContent>

        <TabsContent value="week">
          <WeekView events={filteredEvents} />
        </TabsContent>

        <TabsContent value="agenda">
          <AgendaView events={filteredEvents} projects={projects} />
        </TabsContent>

        <TabsContent value="gantt">
          <GanttView projects={projects} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
