
import { Badge } from '@/components/ui/badge';
import { Event } from './types';
import { getEventTypeColor, getEventTypeIcon } from './utils';

interface EventListProps {
  events: Event[];
  title: string;
}

export const EventList = ({ events, title }: EventListProps) => {
  return (
    <div className="space-y-3">
      <h4 className="font-medium text-sm">{title}</h4>
      {events.length === 0 ? (
        <p className="text-gray-500 text-sm">Aucun événement prévu</p>
      ) : (
        events.map(event => (
          <div key={event.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="text-lg">{getEventTypeIcon(event.type)}</div>
            <div className="flex-1">
              <h4 className="font-medium text-sm">{event.title}</h4>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={getEventTypeColor(event.type)} variant="secondary">
                  {event.type}
                </Badge>
                {event.time && (
                  <span className="text-xs text-gray-500">{event.time}</span>
                )}
              </div>
              {event.participants && (
                <div className="text-xs text-gray-500 mt-1">
                  {event.participants.join(', ')}
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};
