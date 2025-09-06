import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Users, Briefcase, Clock } from 'lucide-react';

interface DashboardStatsProps {
  data?: {
    total_projects?: number;
    active_projects?: number;
    total_contracts?: number;
    total_revenue?: number;
    pending_tasks?: number;
    overdue_tasks?: number;
    revenue_change?: number;
    projects_change?: number;
    users_change?: number;
    selected: string[];
    userSelected: string[];
  };
  period: string;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ data, period }) => {
  const totalProjects = data?.total_projects ?? 0;
  const activeProjects = data?.active_projects ?? 0;
  const totalContracts = data?.total_contracts ?? 0;
  const totalRevenue = data?.total_revenue ?? 0;
  const pendingTasks = data?.pending_tasks ?? 0;
  const overdueTasks = data?.overdue_tasks ?? 0;

  const isSelected = (key: string) => !data?.selected || data?.selected.includes(key) || data?.userSelected.includes(key);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'GNF', minimumFractionDigits: 0 }).format(amount || 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {isSelected('projects.total_projects') && (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Projets ({period})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-gray-900">{totalProjects}</div>
          <div className="text-sm text-gray-500">{activeProjects} actifs</div>
        </CardContent>
      </Card>
      )}

      {isSelected('projects.active_projects') && (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Recettes ({period})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</div>
          <div className="text-sm text-gray-500">
            {typeof data?.revenue_change === 'number' ? `${data?.revenue_change?.toFixed(1)}%` : '—'}
          </div>
        </CardContent>
      </Card>
      )}

      {isSelected('projects.pending_tasks') && (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Tâches ({period})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-gray-900">{pendingTasks}</div>
          <div className="text-sm text-gray-500">{overdueTasks} en retard</div>
        </CardContent>
      </Card>
      )}

      {isSelected('projects.total_contracts') && (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Contrats ({period})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-gray-900">{totalContracts}</div>
          <div className="text-sm text-gray-500">—</div>
        </CardContent>
      </Card>
      )}
    </div>
  );
}; 