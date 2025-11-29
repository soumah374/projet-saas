import { Event } from './types';

export const getEventTypeColor = (type: string) => {
  switch (type) {
    case 'milestone': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'deadline': return 'bg-red-100 text-red-800 border-red-200';
    case 'meeting': return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'task': return 'bg-green-100 text-green-800 border-green-200';
    case 'event': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const getEventTypeIcon = (type: string) => {
  switch (type) {
    case 'milestone': return '🎯';
    case 'deadline': return '⏰';
    case 'meeting': return '👥';
    case 'task': return '✅';
    case 'event': return '📅';
    default: return '📅';
  }
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'bg-blue-500';
    case 'in-progress': return 'bg-blue-500';
    case 'upcoming': return 'bg-gray-400';
    case 'overdue': return 'bg-red-500';
    default: return 'bg-gray-400';
  }
};

export const hasEventsOnDate = (date: Date, events: Event[]) => {
  return events.some(event => 
    event.date.toDateString() === date.toDateString()
  );
};

export const getEventsForDate = (date: Date, events: Event[]) => {
  return events.filter(event => 
    event.date.toDateString() === date.toDateString()
  );
};

export const getEventStats = (events: Event[]) => {
  const today = new Date();
  const thisWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const thisMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  
  return {
    total: events.length,
    thisWeek: events.filter(e => e.date <= thisWeek && e.date >= today).length,
    thisMonth: events.filter(e => e.date.getMonth() === today.getMonth()).length,
    overdue: events.filter(e => e.status === 'overdue').length,
    meetings: events.filter(e => e.type === 'meeting').length,
    deadlines: events.filter(e => e.type === 'deadline').length,
    milestones: events.filter(e => e.type === 'milestone').length,
    tasks: events.filter(e => e.type === 'task').length
  };
};
