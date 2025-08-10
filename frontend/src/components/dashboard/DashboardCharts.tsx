import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Calendar,
  DollarSign,
  Users
} from 'lucide-react';

interface DashboardChartsProps {
  data?: {
    revenue_trend?: Array<{
      month: string;
      revenue: number;
    }>;
    project_status_distribution?: Record<string, number>;
    team_performance?: Array<{
      team_name: string;
      project_count: number;
      avg_progress: number;
    }>;
    monthly_projects?: Array<{
      month: string;
      count: number;
    }>;
  };
  period: string;
}

export const DashboardCharts: React.FC<DashboardChartsProps> = ({ data, period }) => {
  if (!data) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'GNF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'en cours':
        return 'bg-blue-500';
      case 'terminé':
        return 'bg-green-500';
      case 'en attente':
        return 'bg-yellow-500';
      case 'annulé':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 60) return 'bg-yellow-500';
    if (progress >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Tendance des revenus */}
      {data.revenue_trend && data.revenue_trend.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Tendance des Revenus
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {data.revenue_trend.map((month, index) => (
                  <div key={index} className="text-center">
                    <div className="text-lg font-bold text-gray-900">
                      {formatCurrency(month.revenue)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(month.month + '-01').toLocaleDateString('fr-FR', { 
                        month: 'short', 
                        year: 'numeric' 
                      })}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Barre de progression simple */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Évolution des revenus</span>
                </div>
                <div className="flex items-end gap-1 h-32">
                  {data.revenue_trend.map((month, index) => {
                    const maxRevenue = Math.max(...data.revenue_trend.map(m => m.revenue));
                    const height = maxRevenue > 0 ? (month.revenue / maxRevenue) * 100 : 0;
                    return (
                      <div key={index} className="flex-1 bg-blue-200 rounded-t transition-all duration-300 hover:bg-blue-300">
                        <div 
                          className="bg-blue-600 rounded-t transition-all duration-300"
                          style={{ height: `${height}%` }}
                        ></div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Distribution des statuts de projets */}
      {data.project_status_distribution && Object.keys(data.project_status_distribution).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Distribution des Statuts de Projets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                {Object.entries(data.project_status_distribution).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full ${getStatusColor(status)}`}></div>
                      <span className="text-sm font-medium text-gray-700">{status}</span>
                    </div>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                ))}
              </div>
              
              <div className="flex items-center justify-center">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    {(() => {
                      const total = Object.values(data.project_status_distribution).reduce((a, b) => a + b, 0);
                      let currentAngle = 0;
                      return Object.entries(data.project_status_distribution).map(([status, count], index) => {
                        const percentage = (count / total) * 100;
                        const angle = (percentage / 100) * 360;
                        const x1 = 50 + 40 * Math.cos((currentAngle * Math.PI) / 180);
                        const y1 = 50 + 40 * Math.sin((currentAngle * Math.PI) / 180);
                        const x2 = 50 + 40 * Math.cos(((currentAngle + angle) * Math.PI) / 180);
                        const y2 = 50 + 40 * Math.sin(((currentAngle * Math.PI) / 180));
                        
                        const largeArcFlag = angle > 180 ? 1 : 0;
                        const pathData = [
                          `M 50 50`,
                          `L ${x1} ${y1}`,
                          `A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                          'Z'
                        ].join(' ');
                        
                        currentAngle += angle;
                        
                        return (
                          <path
                            key={status}
                            d={pathData}
                            fill={getStatusColor(status).replace('bg-', '')}
                            className="transition-all duration-300 hover:opacity-80"
                          />
                        );
                      });
                    })()}
                  </svg>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance des équipes */}
      {data.team_performance && data.team_performance.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Performance des Équipes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.team_performance.map((team, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">{team.team_name}</h4>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">
                        {team.avg_progress?.toFixed(1) || 0}%
                      </div>
                      <div className="text-sm text-gray-500">{team.project_count} projets</div>
                    </div>
                  </div>
                  
                  {/* Barre de progression */}
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all duration-300 ${getProgressColor(team.avg_progress || 0)}`}
                      style={{ width: `${team.avg_progress || 0}%` }}
                    ></div>
                  </div>
                  
                  {/* Indicateurs de performance */}
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div className="text-center p-2 bg-blue-50 rounded">
                      <div className="text-sm font-bold text-blue-600">{team.project_count}</div>
                      <div className="text-xs text-blue-600">Projets</div>
                    </div>
                    <div className="text-center p-2 bg-green-50 rounded">
                      <div className="text-sm font-bold text-green-600">
                        {team.avg_progress?.toFixed(1) || 0}%
                      </div>
                      <div className="text-xs text-green-600">Progression</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Projets par mois */}
      {data.monthly_projects && data.monthly_projects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Évolution des Projets par Mois
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {data.monthly_projects.map((month, index) => (
                  <div key={index} className="text-center">
                    <div className="text-lg font-bold text-gray-900">{month.count}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(month.month + '-01').toLocaleDateString('fr-FR', { 
                        month: 'short', 
                        year: 'numeric' 
                      })}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Graphique en barres */}
              <div className="mt-6">
                <div className="flex items-end gap-2 h-32">
                  {data.monthly_projects.map((month, index) => {
                    const maxCount = Math.max(...data.monthly_projects.map(m => m.count));
                    const height = maxCount > 0 ? (month.count / maxCount) * 100 : 0;
                    return (
                      <div key={index} className="flex-1 bg-indigo-200 rounded-t transition-all duration-300 hover:bg-indigo-300">
                        <div 
                          className="bg-indigo-600 rounded-t transition-all duration-300"
                          style={{ height: `${height}%` }}
                        ></div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 