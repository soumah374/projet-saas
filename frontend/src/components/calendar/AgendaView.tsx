import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Event, AgendaViewProps } from './types';
import { getEventTypeColor, getEventTypeIcon, getStatusColor } from './utils';

export const AgendaView = ({ events, projects, onEventClick }: AgendaViewProps) => {
  const handleEventClick = (eventId: string) => {
    if (onEventClick) {
      onEventClick(eventId);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vue Agenda</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {events
            .sort((a, b) => a.date.getTime() - b.date.getTime())
            .map(event => (
              <div
                key={event.id}
                onClick={() => handleEventClick(event.id)}
                className="cursor-pointer hover:bg-gray-100 p-4 rounded border"
              >
                <div className="flex items-center gap-4">
                  <div className="text-center min-w-[80px]">
                    <div className="text-2xl">{getEventTypeIcon(event.type)}</div>
                    <div className="text-lg font-bold text-gray-900">
                      {event.date.getDate()}
                    </div>
                    <div className="text-xs text-gray-500 uppercase">
                      {event.date.toLocaleDateString('fr-FR', { month: 'short' })}
                    </div>
                  </div>
                  
                  <div className={`w-1 h-16 rounded ${getStatusColor(event.status)}`}></div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{event.title}</h3>
                      <Badge className={getEventTypeColor(event.type)} variant="secondary">
                        {event.type}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600 mb-1">
                      Projet: {projects.find(p => p.id === event.project)?.title || event.project}
                    </div>
                    {event.time && (
                      <div className="text-sm text-gray-500">
                        {event.time} {event.duration && `(${event.duration}min)`}
                      </div>
                    )}
                    {event.participants && (
                      <div className="text-sm text-gray-500 mt-1">
                        Participants: {event.participants.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
};
