import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Event } from './types';
import { getEventsForDate, hasEventsOnDate, getEventTypeColor, getEventTypeIcon } from './utils';
import { MonthViewProps } from './types';
import { format, isAfter, startOfDay, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

export const MonthView = ({ events = [], onEventClick }: MonthViewProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  // Filter upcoming events with better date comparison
  const upcomingEvents = useMemo(() => {
    if (!events || events.length === 0) return [];

    const today = startOfDay(new Date());

    return events
      .filter(event => {
        if (!event?.date) return false;
        const eventDate = startOfDay(new Date(event.date));
        // Include today's events and future events
        return isAfter(eventDate, today) || isSameDay(eventDate, today);
      })
      .sort((a, b) => {
        if (!a?.date || !b?.date) return 0;
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      })
      .slice(0, 5);
  }, [events]);

  // Get events for the selected date with null checks
  const selectedDateEvents = useMemo(() => {
    if (!selectedDate || !events || events.length === 0) return [];
    return getEventsForDate(selectedDate, events);
  }, [selectedDate, events]);

  // Handle event click
  const handleEventClick = (event: Event) => {
    if (onEventClick && event?.id) {
      onEventClick(event.id);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Calendrier</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              modifiers={{
                hasEvents: (date) => hasEventsOnDate(date, events)
              }}
              modifiersStyles={{
                hasEvents: {
                  backgroundColor: '#dbeafe',
                  color: '#1e40af',
                  fontWeight: 'bold'
                }
              }}
              className="rounded-md border"
            />
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        {selectedDate && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {format(selectedDate, 'EEEE d MMMM', { locale: fr })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedDateEvents.length === 0 ? (
                <p className="text-sm text-gray-500">Aucun événement prévu pour cette date</p>
              ) : (
                <div className="space-y-3">
                  {selectedDateEvents.map(event => (
                    <div
                      key={event.id}
                      onClick={() => handleEventClick(event)}
                      className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <div className="text-lg">{getEventTypeIcon(event.type)}</div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{event.title || 'Sans titre'}</h4>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge className={getEventTypeColor(event.type)} variant="secondary">
                            {event.type}
                          </Badge>
                          {event.time && (
                            <span className="text-xs text-gray-500">{event.time}</span>
                          )}
                        </div>
                        {event.participants && event.participants.length > 0 && (
                          <div className="text-xs text-gray-500 mt-1 truncate">
                            {event.participants.join(', ')}
                          </div>
                        )}
                        {event.location && (
                          <div className="text-xs text-gray-500 mt-1 truncate">
                            📍 {event.location}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Prochains événements</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length === 0 ? (
              <p className="text-sm text-gray-500">Aucun événement à venir</p>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map(event => (
                  <div
                    key={event.id}
                    onClick={() => handleEventClick(event)}
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <div className="text-lg">{getEventTypeIcon(event.type)}</div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{event.title || 'Sans titre'}</h4>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge className={getEventTypeColor(event.type)} variant="secondary">
                          {event.type}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {event.date ? format(new Date(event.date), 'dd/MM/yyyy', { locale: fr }) : 'Date non définie'}
                        </span>
                        {event.time && (
                          <span className="text-xs text-gray-500">{event.time}</span>
                        )}
                      </div>
                      {event.participants && event.participants.length > 0 && (
                        <div className="text-xs text-gray-500 mt-1 truncate">
                          👥 {event.participants.join(', ')}
                        </div>
                      )}
                      {event.location && (
                        <div className="text-xs text-gray-500 mt-1 truncate">
                          📍 {event.location}
                        </div>
                      )}
                      {event.description && (
                        <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {event.description}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
