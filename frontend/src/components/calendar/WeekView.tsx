import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Event, WeekViewProps } from './types';
import { getEventsForDate, getEventTypeColor } from './utils';

export const WeekView = ({ events, onEventClick }: WeekViewProps) => {
  const handleEventClick = (eventId: string) => {
    if (onEventClick) {
      onEventClick(eventId);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vue Hebdomadaire</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2 mb-4">
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
            <div key={day} className="text-center font-medium text-gray-700 py-2 bg-gray-50 rounded">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2 h-96">
          {Array.from({ length: 7 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - date.getDay() + 1 + i);
            return (
              <div key={i} className="border border-gray-200 p-2 min-h-full rounded-lg bg-white">
                <div className="font-medium text-sm mb-2 text-center">{date.getDate()}</div>
                <div className="space-y-1">
                  {getEventsForDate(date, events).map(event => (
                    <div
                      key={event.id}
                      onClick={() => handleEventClick(event.id)}
                      className={`text-xs p-2 rounded ${getEventTypeColor(event.type)} cursor-pointer hover:bg-gray-100`}
                    >
                      <div className="font-medium">{event.title}</div>
                      {event.time && <div className="text-xs opacity-75">{event.time}</div>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
