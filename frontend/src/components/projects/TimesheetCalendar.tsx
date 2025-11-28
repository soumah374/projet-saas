import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Plus
} from 'lucide-react';
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
  isWeekend,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek
} from 'date-fns';
import { fr } from 'date-fns/locale';

interface TimesheetEntry {
  date: string;
  hours: number;
  task?: string;
}

interface TimesheetCalendarProps {
  projectId: string;
  timesheets?: TimesheetEntry[];
}

export function TimesheetCalendar({ projectId, timesheets = [] }: TimesheetCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const calendarData = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);

    // Obtenir tous les jours à afficher (incluant les jours du mois précédent/suivant)
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    // Grouper les timesheets par date
    const timesheetsByDate = timesheets.reduce((acc, entry) => {
      acc[entry.date] = (acc[entry.date] || 0) + entry.hours;
      return acc;
    }, {} as Record<string, number>);

    // Calculer les stats
    const totalHours = timesheets.reduce((sum, entry) => sum + entry.hours, 0);
    const daysWorked = Object.keys(timesheetsByDate).length;
    const avgHoursPerDay = daysWorked > 0 ? (totalHours / daysWorked).toFixed(1) : '0';

    return {
      days,
      timesheetsByDate,
      totalHours,
      daysWorked,
      avgHoursPerDay
    };
  }, [currentMonth, timesheets]);

  const getDayHours = (day: Date): number => {
    const dateKey = format(day, 'yyyy-MM-dd');
    return calendarData.timesheetsByDate[dateKey] || 0;
  };

  const getDayColorClass = (hours: number): string => {
    if (hours === 0) return '';
    if (hours >= 8) return 'bg-green-100 border-green-300';
    if (hours >= 4) return 'bg-blue-100 border-blue-300';
    return 'bg-yellow-100 border-yellow-300';
  };

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const handleToday = () => setCurrentMonth(new Date());

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Total Heures
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{calendarData.totalHours}h</div>
            <p className="text-sm text-muted-foreground mt-1">
              Ce mois: {format(currentMonth, 'MMMM yyyy', { locale: fr })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Jours Travaillés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{calendarData.daysWorked}</div>
            <p className="text-sm text-muted-foreground mt-1">jours ce mois</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Moyenne/Jour
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{calendarData.avgHoursPerDay}h</div>
            <p className="text-sm text-muted-foreground mt-1">heures par jour</p>
          </CardContent>
        </Card>
      </div>

      {/* Calendar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Calendrier de Saisie
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleToday}>
                Aujourd'hui
              </Button>
              <Button variant="outline" size="icon" onClick={handlePrevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-[150px] text-center font-semibold">
                {format(currentMonth, 'MMMM yyyy', { locale: fr })}
              </div>
              <Button variant="outline" size="icon" onClick={handleNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Days of week header */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
              <div
                key={day}
                className="text-center text-sm font-semibold text-muted-foreground py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-2">
            {calendarData.days.map((day, index) => {
              const hours = getDayHours(day);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isTodayDate = isToday(day);
              const isWeekendDay = isWeekend(day);

              return (
                <button
                  key={index}
                  className={`
                    relative min-h-[80px] p-2 rounded-lg border-2 transition-all hover:shadow-md
                    ${!isCurrentMonth ? 'opacity-30' : ''}
                    ${isTodayDate ? 'ring-2 ring-blue-500' : 'border-gray-200'}
                    ${isWeekendDay && isCurrentMonth ? 'bg-gray-50' : 'bg-white'}
                    ${getDayColorClass(hours)}
                  `}
                  onClick={() => {
                    // TODO: Ouvrir modal de saisie
                    console.log('Open timesheet modal for', format(day, 'yyyy-MM-dd'));
                  }}
                >
                  {/* Date */}
                  <div className="flex items-start justify-between mb-1">
                    <span className={`text-sm font-medium ${isTodayDate ? 'text-blue-600' : ''}`}>
                      {format(day, 'd')}
                    </span>
                    {hours > 0 && (
                      <Badge variant="secondary" className="text-xs px-1 py-0">
                        {hours}h
                      </Badge>
                    )}
                  </div>

                  {/* Hours indicator */}
                  {hours > 0 && (
                    <div className="mt-auto">
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${
                            hours >= 8 ? 'bg-green-500' : hours >= 4 ? 'bg-blue-500' : 'bg-yellow-500'
                          }`}
                          style={{ width: `${Math.min((hours / 8) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Add button on hover */}
                  {isCurrentMonth && !isTodayDate && hours === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <Plus className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-6 pt-4 border-t flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-yellow-100 border-2 border-yellow-300" />
              <span>{'< 4h'}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-100 border-2 border-blue-300" />
              <span>4-7h</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-100 border-2 border-green-300" />
              <span>≥ 8h</span>
            </div>
            <div className="ml-auto text-muted-foreground">
              Cliquez sur un jour pour saisir vos heures
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
