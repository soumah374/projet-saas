import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Users, Target, TrendingUp, Clock, Award, AlertTriangle } from 'lucide-react';

interface PerformanceMetricsProps {
  data?: {
    team_productivity: Array<{
      team_name: string;
      total_tasks: number;
      completed_tasks: number;
      completion_rate: number;
    }>;
    user_performance: Array<{
      username: string;
      total_tasks: number;
      completed_tasks: number;
      completion_rate: number;
    }>;
    task_completion_rate: {
      total: number;
      completed: number;
      rate: number;
    };
    efficiency_metrics: {
      avg_completion_time_days: number;
      total_completed_tasks: number;
    };
  };
  project_performance?: {
    top?: { id: string | number; name: string; progress: number; status: string } | null;
    flop?: { id: string | number; name: string; progress: number; status: string } | null;
  };
  period: string;
}

export const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({ data, project_performance, period }) => {
  if (!data) return null;

  const getCompletionRateColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCompletionRateBadgeColor = (rate: number) => {
    if (rate >= 80) return 'bg-green-100 text-green-800';
    if (rate >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-6">
      {/* Performance projet TOP/FLOP */}
      {(project_performance?.top || project_performance?.flop) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Performance Projet
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {project_performance?.top && (
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-gray-900">TOP</span>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      {project_performance.top.progress}%
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-700">{project_performance.top.name}</div>
                  <div className="text-xs text-gray-500 mt-1">Statut: {project_performance.top.status}</div>
                </div>
              )}
              {project_performance?.flop && (
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      <span className="font-medium text-gray-900">FLOP</span>
                    </div>
                    <Badge variant="secondary" className="bg-red-100 text-red-800">
                      {project_performance.flop.progress}%
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-700">{project_performance.flop.name}</div>
                  <div className="text-xs text-gray-500 mt-1">Statut: {project_performance.flop.status}</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Taux de completion global */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Taux de Completion Global
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {data.task_completion_rate?.total || 0}
              </div>
              <p className="text-sm text-gray-600">Total Tâches</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {data.task_completion_rate?.completed || 0}
              </div>
              <p className="text-sm text-gray-600">Tâches Terminées</p>
            </div>
            <div className="text-center">
              <div className={`text-3xl font-bold ${getCompletionRateColor(data.task_completion_rate?.rate || 0)}`}>
                {data.task_completion_rate?.rate || 0}%
              </div>
              <p className="text-sm text-gray-600">Taux de Completion</p>
            </div>
          </div>
          <div className="mt-4">
            <Progress 
              value={data.task_completion_rate?.rate || 0} 
              className="h-3"
            />
          </div>
        </CardContent>
      </Card>

      {/* Performance des équipes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Performance des Équipes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.team_productivity?.map((team) => (
              <div key={team.team_name} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">{team.team_name}</h4>
                  <Badge variant="secondary" className={getCompletionRateBadgeColor(team.completion_rate)}>
                    {team.completion_rate.toFixed(1)}%
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">{team.total_tasks}</div>
                    <p className="text-sm text-gray-500">Total Tâches</p>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">{team.completed_tasks}</div>
                    <p className="text-sm text-gray-500">Terminées</p>
                  </div>
                </div>
                <Progress 
                  value={team.completion_rate} 
                  className="h-2"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Métriques d'efficacité */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Métriques d'Efficacité
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-3xl font-bold text-blue-600">
                {data.efficiency_metrics?.avg_completion_time_days || 0}
              </div>
              <p className="text-sm text-gray-600">Jours Moyens de Completion</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-3xl font-bold text-green-600">
                {data.efficiency_metrics?.total_completed_tasks || 0}
              </div>
              <p className="text-sm text-gray-600">Tâches Terminées</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Résumé de la période */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Résumé de la Période
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <p className="text-gray-600 mb-2">
              Analyse des performances sur <strong>{period}</strong>
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-lg font-bold text-blue-600">
                  {data.team_productivity?.length || 0}
                </div>
                <p className="text-sm text-blue-600">Équipes Actives</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-lg font-bold text-green-600">
                  {data.user_performance?.length || 0}
                </div>
                <p className="text-sm text-green-600">Utilisateurs Actifs</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 