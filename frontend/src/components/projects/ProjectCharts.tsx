import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { Project } from '@/lib/types';
import { differenceInDays, eachWeekOfInterval, startOfWeek, endOfWeek, format, isWithinInterval } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ProjectChartsProps {
  project: Project;
}

export function ProjectCharts({ project }: ProjectChartsProps) {
  const chartData = useMemo(() => {
    const tasks = project.tasks || [];
    const completedTasks = tasks.filter(t => t.status === 'Terminé');

    if (completedTasks.length === 0 || !project.start_date) {
      return null;
    }

    const startDate = new Date(project.start_date);
    const endDate = new Date(project.deadline);
    const today = new Date();

    // Générer les semaines
    const weeks = eachWeekOfInterval(
      { start: startDate, end: today > endDate ? today : endDate },
      { weekStartsOn: 1 }
    );

    // Calculer la vélocité par semaine
    const velocityData = weeks.map((weekStart, index) => {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      const tasksCompletedThisWeek = completedTasks.filter(task => {
        // Utiliser la date de création ou une estimation
        const completionDate = task.created_at ? new Date(task.created_at) : startDate;
        return isWithinInterval(completionDate, { start: weekStart, end: weekEnd });
      }).length;

      return {
        week: `S${index + 1}`,
        count: tasksCompletedThisWeek,
        label: format(weekStart, 'dd MMM', { locale: fr })
      };
    });

    // Calculer le burn-down
    const totalTasks = tasks.length;
    const burndownData = weeks.map((weekStart, index) => {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      const tasksCompletedUntilNow = completedTasks.filter(task => {
        const completionDate = task.created_at ? new Date(task.created_at) : startDate;
        return completionDate <= weekEnd;
      }).length;

      const remaining = totalTasks - tasksCompletedUntilNow;
      const ideal = totalTasks - ((totalTasks / weeks.length) * (index + 1));

      return {
        week: `S${index + 1}`,
        remaining,
        ideal: Math.max(0, Math.round(ideal)),
        label: format(weekStart, 'dd MMM', { locale: fr })
      };
    });

    // Calculer les métriques
    const avgVelocity = velocityData.reduce((sum, d) => sum + d.count, 0) / velocityData.length;
    const maxVelocity = Math.max(...velocityData.map(d => d.count));
    const currentRemaining = burndownData[burndownData.length - 1]?.remaining || 0;
    const idealRemaining = burndownData[burndownData.length - 1]?.ideal || 0;
    const isAheadOfSchedule = currentRemaining < idealRemaining;

    return {
      velocityData,
      burndownData,
      avgVelocity: avgVelocity.toFixed(1),
      maxVelocity,
      totalWeeks: weeks.length,
      isAheadOfSchedule,
      deviation: Math.abs(currentRemaining - idealRemaining)
    };
  }, [project]);

  if (!chartData) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Vélocité
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <p>Pas de données disponibles</p>
              <p className="text-sm mt-2">Terminez quelques tâches pour voir votre vélocité</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5" />
              Burn-down Chart
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <p>Pas de données disponibles</p>
              <p className="text-sm mt-2">Commencez le projet pour voir le burn-down</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const maxVelocityHeight = chartData.maxVelocity;
  const maxBurndownValue = Math.max(
    ...chartData.burndownData.map(d => Math.max(d.remaining, d.ideal))
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Velocity Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Vélocité
            </CardTitle>
            <div className="text-sm text-muted-foreground">
              Moy: <span className="font-semibold">{chartData.avgVelocity}</span> tâches/sem
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Bar Chart */}
            <div className="h-48 flex items-end gap-2">
              {chartData.velocityData.map((data, index) => {
                const height = maxVelocityHeight > 0
                  ? (data.count / maxVelocityHeight) * 100
                  : 0;

                return (
                  <div key={index} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex items-end" style={{ height: '100%' }}>
                      <div
                        className="w-full bg-blue-500 rounded-t-md hover:bg-blue-600 transition-colors relative group"
                        style={{ height: `${height}%`, minHeight: data.count > 0 ? '8px' : '0' }}
                        title={`${data.label}: ${data.count} tâches`}
                      >
                        {data.count > 0 && (
                          <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-semibold">
                            {data.count}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground mt-1">{data.week}</span>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Nombre de tâches terminées par semaine sur les {chartData.totalWeeks} dernières semaines
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Burn-down Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5" />
              Burn-down Chart
            </CardTitle>
            <div className={`text-sm font-semibold ${chartData.isAheadOfSchedule ? 'text-green-600' : 'text-orange-600'}`}>
              {chartData.isAheadOfSchedule ? '✓ En avance' : '⚠ En retard'}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Line Chart */}
            <div className="h-48 relative">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                {/* Grid lines */}
                {[0, 25, 50, 75, 100].map(y => (
                  <line
                    key={y}
                    x1="0"
                    y1={y}
                    x2="100"
                    y2={y}
                    stroke="#e5e7eb"
                    strokeWidth="0.5"
                  />
                ))}

                {/* Ideal line (straight from start to end) */}
                <polyline
                  points={chartData.burndownData
                    .map((d, i) => {
                      const x = (i / (chartData.burndownData.length - 1)) * 100;
                      const y = 100 - ((d.ideal / maxBurndownValue) * 100);
                      return `${x},${y}`;
                    })
                    .join(' ')}
                  fill="none"
                  stroke="#9ca3af"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                />

                {/* Actual line */}
                <polyline
                  points={chartData.burndownData
                    .map((d, i) => {
                      const x = (i / (chartData.burndownData.length - 1)) * 100;
                      const y = 100 - ((d.remaining / maxBurndownValue) * 100);
                      return `${x},${y}`;
                    })
                    .join(' ')}
                  fill="none"
                  stroke={chartData.isAheadOfSchedule ? '#10b981' : '#f97316'}
                  strokeWidth="3"
                />

                {/* Data points */}
                {chartData.burndownData.map((d, i) => {
                  const x = (i / (chartData.burndownData.length - 1)) * 100;
                  const y = 100 - ((d.remaining / maxBurndownValue) * 100);
                  return (
                    <circle
                      key={i}
                      cx={x}
                      cy={y}
                      r="2"
                      fill={chartData.isAheadOfSchedule ? '#10b981' : '#f97316'}
                      className="hover:r-4"
                    />
                  );
                })}
              </svg>

              {/* Y-axis labels */}
              <div className="absolute -left-8 top-0 h-full flex flex-col justify-between text-xs text-muted-foreground">
                <span>{maxBurndownValue}</span>
                <span>{Math.round(maxBurndownValue * 0.75)}</span>
                <span>{Math.round(maxBurndownValue * 0.5)}</span>
                <span>{Math.round(maxBurndownValue * 0.25)}</span>
                <span>0</span>
              </div>
            </div>

            {/* X-axis labels */}
            <div className="flex justify-between text-xs text-muted-foreground px-2">
              {chartData.burndownData
                .filter((_, i) => i % Math.ceil(chartData.burndownData.length / 5) === 0)
                .map((d, i) => (
                  <span key={i}>{d.label}</span>
                ))}
            </div>

            {/* Legend */}
            <div className="pt-4 border-t flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-0.5 bg-gray-400 border-dashed border-2" />
                <span className="text-sm text-muted-foreground">Idéal</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-8 h-1 rounded ${chartData.isAheadOfSchedule ? 'bg-green-500' : 'bg-orange-500'}`} />
                <span className="text-sm text-muted-foreground">Réel</span>
              </div>
              <div className="ml-auto text-sm text-muted-foreground">
                Écart: <span className="font-semibold">{chartData.deviation}</span> tâches
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
