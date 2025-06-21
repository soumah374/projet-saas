
import { Card, CardContent } from '@/components/ui/card';

interface EventStats {
  total: number;
  thisWeek: number;
  thisMonth: number;
  overdue: number;
  meetings: number;
  deadlines: number;
  milestones: number;
  tasks: number;
}

interface CalendarStatsProps {
  stats: EventStats;
}

export const CalendarStats = ({ stats }: CalendarStatsProps) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-xs text-gray-600">Total</div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.thisWeek}</div>
            <div className="text-xs text-gray-600">Cette semaine</div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.meetings}</div>
            <div className="text-xs text-gray-600">Réunions</div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{stats.deadlines}</div>
            <div className="text-xs text-gray-600">Échéances</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.milestones}</div>
            <div className="text-xs text-gray-600">Jalons</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.tasks}</div>
            <div className="text-xs text-gray-600">Tâches</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.thisMonth}</div>
            <div className="text-xs text-gray-600">Ce mois</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-500">{stats.overdue}</div>
            <div className="text-xs text-gray-600">En retard</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
