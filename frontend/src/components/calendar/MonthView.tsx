
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Event } from './types';
import { EventList } from './EventList';
import { getEventsForDate, hasEventsOnDate } from './utils';

interface MonthViewProps {
  events: Event[];
}

export const MonthView = ({ events }: MonthViewProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const upcomingEvents = events
    .filter(event => event.date >= new Date())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 5);

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
                {selectedDate.toLocaleDateString('fr-FR', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long' 
                })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EventList 
                events={getEventsForDate(selectedDate, events)} 
                title=""
              />
            </CardContent>
          </Card>
        )}
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Prochains événements</CardTitle>
          </CardHeader>
          <CardContent>
            <EventList events={upcomingEvents} title="" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
