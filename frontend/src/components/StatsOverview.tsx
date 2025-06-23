import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Clock, CheckCircle, AlertTriangle, Users, FolderOpen, Calendar } from 'lucide-react';

interface StatsOverviewProps {
  projects: Array<{
    status: string;
    progress: number;
    deadline: string;
    type: string;
  }>;
}

export const StatsOverview = ({ projects }: StatsOverviewProps) => {
  const stats = {
    total: projects.length,
    inProgress: projects.filter(p => p.status === 'En cours').length,
    completed: projects.filter(p => p.status === 'Terminé').length,
    urgent: projects.filter(p => 
      new Date(p.deadline) < new Date(Date.now() + 7*24*60*60*1000)
    ).length,
    avgProgress: Math.round(
      projects.reduce((acc, p) => acc + p.progress, 0) / projects.length
    )
  };

  const typeStats = {
    'Événementiel': projects.filter(p => p.type === 'Événementiel').length,
    'Communication': projects.filter(p => p.type === 'Communication').length,
    'Audiovisuel': projects.filter(p => p.type === 'Audiovisuel').length
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-700">Projets actifs</p>
            <p className="text-3xl font-bold text-blue-900">{stats.total}</p>
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <Badge variant="secondary" className="text-xs bg-blue-200">
                +12%
              </Badge>
            </div>
          </div>
          <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-700">En cours</p>
            <p className="text-3xl font-bold text-blue-900">{stats.inProgress}</p>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-sm text-blue-600">Avancement moyen: {stats.avgProgress}%</span>
            </div>
          </div>
          <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center">
            <Clock className="h-6 w-6 text-blue-600" />
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">Échéances urgentes</p>
            <p className="text-3xl font-bold text-gray-900">{stats.urgent}</p>
            <div className="flex items-center gap-1 mt-2">
              <AlertTriangle className="h-4 w-4 text-gray-600" />
              <span className="text-sm text-gray-600">&lt; 7 jours</span>
            </div>
          </div>
          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-gray-600" />
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-700">Types de projets</p>
            <div className="mt-2 space-y-1">
              {Object.entries(typeStats).map(([type, count]) => (
                <div key={type} className="flex justify-between items-center">
                  <span className="text-xs text-blue-600">{type}</span>
                  <Badge variant="secondary" className="text-xs bg-blue-200">
                    {count}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
          <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center">
            <TrendingUp className="h-6 w-6 text-blue-600" />
          </div>
        </div>
      </Card>
    </div>
  );
};
