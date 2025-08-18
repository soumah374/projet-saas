import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Target,
  Users,
  DollarSign,
  Calendar,
  AlertTriangle
} from 'lucide-react';

interface QuickSummaryProps {
  data?: {
    total_projects: number;
    active_projects: number;
    total_revenue: number;
    urgent_deadlines: number;
    overdue_projects: number;
    revenue_change?: number;
    projects_change?: number;
  };
  period: string;
}

export const QuickSummary: React.FC<QuickSummaryProps> = ({ data, period }) => {
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

  const summaryItems = [
    {
      title: 'Échéances Urgentes',
      value: data.urgent_deadlines || 0,
      icon: Calendar,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      description: '≤ 3 jours'
    },
    {
      title: 'Projets en Retard',
      value: data.overdue_projects || 0,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      description: 'À traiter'
    },
    {
      title: 'Projets Actifs',
      value: data.active_projects || 0,
      icon: Target,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      change: data.projects_change,
      description: 'En cours'
    },
    {
      title: 'Revenus',
      value: formatCurrency(data.total_revenue || 0),
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      change: data.revenue_change,
      description: `Sur ${period}`
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {summaryItems.map((item, index) => {
        const IconComponent = item.icon;
        return (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`p-2 rounded-full ${item.bgColor}`}>
                      <IconComponent className={`h-4 w-4 ${item.color}`} />
                    </div>
                    <span className="text-sm font-medium text-gray-600">
                      {item.title}
                    </span>
                  </div>
                  <div className={`text-xl font-bold ${item.color}`}>
                    {item.value}
                  </div>
                  <p className="text-xs text-gray-500">
                    {item.description}
                  </p>
                </div>
                <div className="text-right">
                  {item.change !== undefined && (
                    <div className="flex items-center gap-1">
                      {getChangeIcon(item.change)}
                      <span className={`text-xs font-medium ${getChangeColor(item.change)}`}>
                        {getChangeText(item.change)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}; 