import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Users, Target, Clock, AlertTriangle, CheckCircle } from 'lucide-react';

interface MetricsOverviewProps {
  data?: {
    total_projects: number;
    active_projects: number;
    total_users: number;
    total_clients: number;
    total_contracts: number;
    total_revenue: number;
    pending_tasks: number;
    overdue_tasks: number;
  };
  period: string;
}

export const MetricsOverview: React.FC<MetricsOverviewProps> = ({ data, period }) => {
  if (!data) return null;

  const metrics = [
    // {
    //   title: 'Projets Actifs',
    //   value: data.active_projects || 0,
    //   icon: Target,
    //   color: 'text-blue-600',
    //   bgColor: 'bg-blue-50',
    //   description: 'Projets en cours'
    // },
    {
      title: 'Total Projets',
      value: data.total_projects || 0,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: 'Tous les projets'
    },
    {
      title: 'Utilisateurs',
      value: data.total_users || 0,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      description: 'Équipe totale'
    },
    {
      title: 'Clients',
      value: data.total_clients || 0,
      icon: Users,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      description: 'Portefeuille clients'
    },
    {
      title: 'Contrats',
      value: data.total_contracts || 0,
      icon: CheckCircle,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      description: 'Contrats actifs'
    },
    {
      title: 'Revenus',
      value: `${(data.total_revenue || 0).toLocaleString('fr-FR')} €`,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: `Sur ${period}`
    },
    {
      title: 'Activités en Attente',
      value: data.pending_tasks || 0,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      description: 'À traiter'
    },
    {
      title: 'Activités en Retard',
      value: data.overdue_tasks || 0,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      description: 'Urgentes'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric, index) => {
        const IconComponent = metric.icon;
        return (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {metric.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className={`text-2xl font-bold ${metric.color}`}>
                    {metric.value}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {metric.description}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${metric.bgColor}`}>
                  <IconComponent className={`h-6 w-6 ${metric.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}; 