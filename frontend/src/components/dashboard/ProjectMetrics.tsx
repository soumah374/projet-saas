import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Target, AlertTriangle, TrendingUp, Users } from 'lucide-react';

interface ProjectMetricsProps {
  data?: {
    status_distribution?: Record<string, number>;
    progress_distribution?: Array<{
      range: string;
      count: number;
    }>;
    recent_projects?: Array<{
      id: number;
      name: string;
      status: string;
      progress: number;
      created_at: string;
      activite_percent?: number;
      delai_percent?: number;
    }>;
    overdue_projects?: Array<{
      id: number;
      name: string;
      deadline: string;
      days_overdue: number;
    }>;
    team_performance?: Array<{
      team_name: string;
      project_count: number;
      avg_progress: number;
    }>;
    progress_retards?: {
      projects_overdue_count: number;
      unbilled_amount_total: number;
    };
    project_performance?: Array<{
      type: 'top' | 'flop';
      projects: Array<{
        title: string;
        progress: number;
      }>;
    }>;
    monthly_projects?: Array<{
      month: string;
      count: number;
    }>;
    user_role?: string;
    widgets_used?: string[];
  };
  period: string;
  selected: string[];
  userSelected: string[];
}

export const ProjectMetrics: React.FC<ProjectMetricsProps> = ({ data, period, selected, userSelected }) => {
  if (!data) return null;

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'en cours':
        return 'bg-blue-100 text-blue-800';
      case 'terminé':
        return 'bg-green-100 text-green-800';
      case 'en attente':
        return 'bg-yellow-100 text-yellow-800';
      case 'annulé':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isSelected = (key: string) => !selected || selected.includes(key) || userSelected.includes(key);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'GNF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  return (
    <div className="space-y-6">
      {/* Distribution par statut */}
      {isSelected('projects.status_distribution') && (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Distribution par Statut
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(data.status_distribution || {}).map(([status, count]) => (
              <div key={status} className="text-center">
                <div className="text-2xl font-bold text-gray-900">{count}</div>
                <Badge variant="secondary" className={getStatusColor(status)}>
                  {status}
                </Badge>
              </div>
            ))}
          </div>
          </CardContent>
        </Card>
      )}

      {/* Carte Retards */}
      {data.progress_retards && isSelected('projects.progress_retards') && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Retards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 border rounded-lg bg-red-50">
                <div className="text-sm text-red-700">Projets en retard</div>
                <div className="text-3xl font-bold text-red-800 mt-1">
                  {data.progress_retards.projects_overdue_count || 0}
                </div>
              </div>
              <div className="p-4 border rounded-lg bg-yellow-50">
                <div className="text-sm text-yellow-700">Montant total factures non émises</div>
                <div className="text-2xl font-bold text-yellow-800 mt-1">
                  {formatCurrency(data.progress_retards.unbilled_amount_total || 0)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Projets récents */}
      {isSelected('projects.recent_projects') && (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Projets Récents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.recent_projects?.slice(0, 5).map((project) => (
              <div key={project.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{project.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className={getStatusColor(project.status)}>
                      {project.status}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {new Date(project.created_at).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">{project.progress}%</div>
                  <Progress value={project.progress} className="w-20 mt-1" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      )}

      {/* Projets en retard */}
      {data.overdue_projects && data.overdue_projects.length > 0 && isSelected('projects.overdue_projects') && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Projets en Retard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.overdue_projects.slice(0, 5).map((project) => (
                <div key={project.id} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">{project.name}</h4>
                    <p className="text-sm text-red-600">
                      En retard de {Math.abs(project.days_overdue)} jours
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">
                      Échéance: {new Date(project.deadline).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance des équipes */}
      {isSelected('projects.team_performance') && (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Performance des Équipes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.team_performance?.map((team) => (
              <div key={team.team_name} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{team.team_name}</h4>
                  <p className="text-sm text-gray-500">{team.project_count} projets</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {team.avg_progress?.toFixed(1) || 0}%
                  </div>
                  <Progress 
                    value={team.avg_progress || 0} 
                    className="w-20 mt-1" 
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      )}
    </div>
  );
}; 