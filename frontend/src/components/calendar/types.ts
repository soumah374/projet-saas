export type EventType = 'milestone' | 'deadline' | 'meeting' | 'task' | 'event';
export type EventStatus = 'completed' | 'overdue' | 'in-progress' | 'upcoming';

export interface Event {
  id: string;
  title: string;
  type: EventType;
  date: Date;
  time: string;
  project: string;
  status: EventStatus;
  participants: string[];
  duration: number;
  location?: string;
  description?: string;
}

export interface EventStats {
  total: number;
  thisWeek: number;
  thisMonth: number;
  overdue: number;
  meetings: number;
  deadlines: number;
  milestones: number;
  tasks: number;
}

export interface MonthViewProps {
  events: Event[];
  onEventClick?: (eventId: string) => void;
}

export interface WeekViewProps {
  events: Event[];
  onEventClick?: (eventId: string) => void;
}

export interface AgendaViewProps {
  events: Event[];
  projects: any[];
  onEventClick?: (eventId: string) => void;
}

export interface GanttViewProps {
  projects: any[];
}

export interface CalendarHeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterType: string;
  onFilterChange: (value: string) => void;
  onAddEvent: () => void;
}
