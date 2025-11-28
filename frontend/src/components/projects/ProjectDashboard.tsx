import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Users,
  CheckCircle2,
  AlertTriangle,
  Target,
  Activity
} from 'lucide-react';
import type { Project } from '@/lib/types';
import { differenceInDays, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ProjectCharts } from './ProjectCharts';

interface ProjectDashboardProps {
  project: Project;
}

export function ProjectDashboard({ project }: ProjectDashboardProps) {
  const metrics = useMemo(() => {
    const tasks = project.tasks || [];
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'Terminé').length;
    const inProgressTasks = tasks.filter(t => t.status === 'En cours').length;
    const todoTasks = tasks.filter(t => t.status === 'À faire').length;
    const pausedTasks = tasks.filter(t => t.status === 'En pause').length;

    // Calcul de la vélocité (tâches/semaine)
    const startDate = project.start_date ? new Date(project.start_date) : null;
    const today = new Date();
    const weeksElapsed = startDate
      ? Math.max(1, Math.ceil(differenceInDays(today, startDate) / 7))
      : 1;
    const velocity = completedTasks / weeksElapsed;

    // Calcul du temps restant
    const deadline = new Date(project.deadline);
    const daysRemaining = differenceInDays(deadline, today);
    const isOverdue = daysRemaining < 0;

    // Estimation de fin basée sur la vélocité
    const remainingTasks = totalTasks - completedTasks;
    const estimatedWeeksToComplete = velocity > 0 ? remainingTasks / velocity : 0;
    const estimatedDaysToComplete = Math.ceil(estimatedWeeksToComplete * 7);

    // Health score (0-100)
    let healthScore = 100;
    if (isOverdue) healthScore -= 30;
    if (project.progress < 50 && daysRemaining < 30) healthScore -= 20;
    if (pausedTasks > totalTasks * 0.3) healthScore -= 15;
    if (velocity < 1 && totalTasks > 5) healthScore -= 15;
    healthScore = Math.max(0, healthScore);

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      todoTasks,
      pausedTasks,
      velocity: velocity.toFixed(1),
      daysRemaining,
      isOverdue,
      estimatedDaysToComplete,
      healthScore,
      completionRate: totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(0) : '0'
    };
  }, [project]);

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    if (score >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getHealthLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Bon';
    if (score >= 40) return 'Attention';
    return 'Critique';
  };

  return (
    <div className="space-y-6">
      {/* KPIs Header */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Health Score */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Santé du Projet
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">{metrics.healthScore}</div>
                <Badge className={`mt-2 ${getHealthColor(metrics.healthScore)}`}>
                  {getHealthLabel(metrics.healthScore)}
                </Badge>
              </div>
              <div className="text-6xl font-bold text-gray-100">
                {metrics.healthScore >= 80 ? '💚' : metrics.healthScore >= 60 ? '💛' : '🔴'}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Completion Rate */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4" />
              Taux d'Achèvement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">{metrics.completionRate}%</div>
                <p className="text-sm text-muted-foreground mt-1">
                  {metrics.completedTasks}/{metrics.totalTasks} tâches
                </p>
              </div>
              <CheckCircle2 className="h-12 w-12 text-green-500 opacity-20" />
            </div>
            {/* Progress bar */}
            <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${metrics.completionRate}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Velocity */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Vélocité
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">{metrics.velocity}</div>
                <p className="text-sm text-muted-foreground mt-1">tâches/semaine</p>
              </div>
              {parseFloat(metrics.velocity) >= 2 ? (
                <TrendingUp className="h-12 w-12 text-blue-500 opacity-20" />
              ) : (
                <TrendingDown className="h-12 w-12 text-orange-500 opacity-20" />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Time Remaining */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Temps Restant
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className={`text-3xl font-bold ${metrics.isOverdue ? 'text-red-600' : ''}`}>
                  {metrics.isOverdue ? `-${Math.abs(metrics.daysRemaining)}` : metrics.daysRemaining}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {metrics.isOverdue ? 'jours de retard' : 'jours restants'}
                </p>
              </div>
              {metrics.isOverdue ? (
                <AlertTriangle className="h-12 w-12 text-red-500 opacity-20" />
              ) : (
                <Clock className="h-12 w-12 text-blue-500 opacity-20" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Répartition des Tâches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Stacked bar */}
              <div className="flex h-12 rounded-lg overflow-hidden">
                {metrics.completedTasks > 0 && (
                  <div
                    className="bg-green-500 flex items-center justify-center text-white text-sm font-medium"
                    style={{ width: `${(metrics.completedTasks / metrics.totalTasks) * 100}%` }}
                    title={`${metrics.completedTasks} Terminées`}
                  >
                    {metrics.completedTasks}
                  </div>
                )}
                {metrics.inProgressTasks > 0 && (
                  <div
                    className="bg-blue-500 flex items-center justify-center text-white text-sm font-medium"
                    style={{ width: `${(metrics.inProgressTasks / metrics.totalTasks) * 100}%` }}
                    title={`${metrics.inProgressTasks} En cours`}
                  >
                    {metrics.inProgressTasks}
                  </div>
                )}
                {metrics.pausedTasks > 0 && (
                  <div
                    className="bg-orange-500 flex items-center justify-center text-white text-sm font-medium"
                    style={{ width: `${(metrics.pausedTasks / metrics.totalTasks) * 100}%` }}
                    title={`${metrics.pausedTasks} En pause`}
                  >
                    {metrics.pausedTasks}
                  </div>
                )}
                {metrics.todoTasks > 0 && (
                  <div
                    className="bg-gray-400 flex items-center justify-center text-white text-sm font-medium"
                    style={{ width: `${(metrics.todoTasks / metrics.totalTasks) * 100}%` }}
                    title={`${metrics.todoTasks} À faire`}
                  >
                    {metrics.todoTasks}
                  </div>
                )}
              </div>

              {/* Legend */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-green-500" />
                  <span className="text-sm">Terminé ({metrics.completedTasks})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-blue-500" />
                  <span className="text-sm">En cours ({metrics.inProgressTasks})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-orange-500" />
                  <span className="text-sm">En pause ({metrics.pausedTasks})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-gray-400" />
                  <span className="text-sm">À faire ({metrics.todoTasks})</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Forecast */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Prévisions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium">Date limite</span>
                <span className="text-sm">{format(new Date(project.deadline), 'dd MMMM yyyy', { locale: fr })}</span>
              </div>

              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="text-sm font-medium">Estimation de fin</span>
                <span className="text-sm font-medium text-blue-600">
                  {metrics.estimatedDaysToComplete > 0
                    ? `${metrics.estimatedDaysToComplete} jours`
                    : 'Données insuffisantes'}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <span className="text-sm font-medium">Tâches restantes</span>
                <span className="text-sm font-medium text-purple-600">
                  {metrics.totalTasks - metrics.completedTasks}
                </span>
              </div>

              {metrics.estimatedDaysToComplete > metrics.daysRemaining && !metrics.isOverdue && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-orange-900">Risque de retard</p>
                      <p className="text-xs text-orange-700 mt-1">
                        Au rythme actuel, le projet risque de dépasser la deadline de{' '}
                        {Math.ceil(metrics.estimatedDaysToComplete - metrics.daysRemaining)} jours
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {!metrics.isOverdue && metrics.estimatedDaysToComplete < metrics.daysRemaining && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-green-900">Dans les temps</p>
                      <p className="text-xs text-green-700 mt-1">
                        Le projet devrait se terminer dans les délais prévus
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <ProjectCharts project={project} />

      {/* Team Activity */}
      {project.team_count && parseInt(project.team_count) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Équipe ({project.team_count} membres)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Charge moyenne par membre: {(metrics.totalTasks / parseInt(project.team_count)).toFixed(1)} tâches
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
