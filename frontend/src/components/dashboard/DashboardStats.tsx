import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Target, 
  Users, 
  DollarSign, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';

interface DashboardStatsProps {
  data?: {
    total_projects: number;
    active_projects: number;
    total_users: number;
    total_clients: number;
    total_contracts: number;
    total_revenue: number;
    pending_tasks: number;
    overdue_tasks: number;
    revenue_change?: number;
    projects_change?: number;
    users_change?: number;
  };
  period: string;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ data, period }) => {
  if (!data) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'GNF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getChangeIcon = (change?: number) => {
    if (!change) return <Minus className="h-4 w-4 text-gray-400" />;
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    return <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  const getChangeColor = (change?: number) => {
    if (!change) return 'text-gray-500';
    if (change > 0) return 'text-green-600';
    return 'text-red-600';
  };

  const getChangeText = (change?: number) => {
    if (!change) return 'Aucun changement';
    if (change > 0) return `+${change.toFixed(1)}%`;
    return `${change.toFixed(1)}%`;
  };

  const stats = [
    // {
    //   title: 'Projets Actifs',
    //   value: data.active_projects || 0,
    //   icon: Target,
    //   color: 'text-blue-600',
    //   bgColor: 'bg-blue-50',
    //   change: data.projects_change,
    //   description: 'Projets en cours',
    //   trend: 'vs période précédente'
    // },
    {
      title: 'Total Projets',
      value: data.total_projects || 0,
      icon: Target,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      change: data.projects_change,
      description: 'Tous les projets',
      trend: 'vs période précédente'
    },
    {
      title: 'Utilisateurs',
      value: data.total_users || 0,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      change: data.users_change,
      description: 'Équipe totale',
      trend: 'vs période précédente'
    },
    {
      title: 'Clients',
      value: data.total_clients || 0,
      icon: Users,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      description: 'Portefeuille clients',
      trend: 'vs période précédente'
    },
    {
      title: 'Contrats',
      value: data.total_contracts || 0,
      icon: CheckCircle,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      description: 'Contrats actifs',
      trend: 'vs période précédente'
    },
    // {
    //   title: 'Revenus',
    //   value: formatCurrency(data.total_revenue || 0),
    //   icon: DollarSign,
    //   color: 'text-green-600',
    //   bgColor: 'bg-green-50',
    //   change: data.revenue_change,
    //   description: `Sur ${period}`,
    //   trend: 'vs période précédente'
    // },
    {
      title: 'Activités en Attente',
      value: data.pending_tasks || 0,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      description: 'À traiter',
      trend: 'vs période précédente'
    },
    {
      title: 'Activités en Retard',
      value: data.overdue_tasks || 0,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      description: 'Urgentes',
      trend: 'vs période précédente'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <Card key={index} className="hover:shadow-lg transition-all duration-200 hover:scale-105">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center justify-between">
                {stat.title}
                {getChangeIcon(stat.change)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className={`text-2xl font-bold ${stat.color}`}>
                    {stat.value}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {stat.description}
                  </p>
                  {stat.change !== undefined && (
                    <div className={`text-xs font-medium mt-1 ${getChangeColor(stat.change)}`}>
                      {getChangeText(stat.change)}
                    </div>
                  )}
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <IconComponent className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}; 