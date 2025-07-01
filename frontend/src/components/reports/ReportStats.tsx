import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Users, 
  Target,
  Clock,
  DollarSign,
  Activity,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { ReportSummary } from '@/hooks/use-reports';

interface ReportStatsProps {
  summary: ReportSummary;
  isLoading?: boolean;
}

export const ReportStats = ({ summary, isLoading }: ReportStatsProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const getProjectSuccessRate = () => {
    return summary.projects.total > 0 
      ? Math.round((summary.projects.completed / summary.projects.total) * 100)
      : 0;
  };

  const getBudgetUtilization = () => {
    return summary.budget.total_allocated > 0
      ? Math.round((summary.budget.total_spent / summary.budget.total_allocated) * 100)
      : 0;
  };

  const getOnTimeRate = () => {
    return summary.projects.total > 0
      ? Math.round((summary.projects.on_time / summary.projects.total) * 100)
      : 0;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-GN', {
      style: 'currency',
      currency: 'GNF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Projets */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Projets</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.projects.total}</div>
          <div className="flex items-center space-x-2 text-xs text-muted-foreground mb-2">
            <TrendingUp className="w-3 h-3 text-green-500" />
            <span>Taux de réussite: {getProjectSuccessRate()}%</span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-green-500" />
                Terminés
              </span>
              <span className="font-medium text-green-600">
                {summary.projects.completed}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="flex items-center gap-1">
                <Activity className="w-3 h-3 text-blue-500" />
                Actifs
              </span>
              <span className="font-medium text-blue-600">
                {summary.projects.active}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-red-500" />
                En retard
              </span>
              <span className="font-medium text-red-600">
                {summary.projects.delayed}
              </span>
            </div>
          </div>
          <div className="mt-2">
            <Progress value={getProjectSuccessRate()} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Tâches */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tâches</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.tasks.total}</div>
          <div className="flex items-center space-x-2 text-xs text-muted-foreground mb-2">
            <Target className="w-3 h-3 text-blue-500" />
            <span>Complétion: {summary.tasks.completion_rate}%</span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-green-500" />
                Terminées
              </span>
              <span className="font-medium text-green-600">
                {summary.tasks.completed}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-yellow-500" />
                En attente
              </span>
              <span className="font-medium text-yellow-600">
                {summary.tasks.pending}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="flex items-center gap-1">
                <XCircle className="w-3 h-3 text-red-500" />
                En retard
              </span>
              <span className="font-medium text-red-600">
                {summary.tasks.overdue}
              </span>
            </div>
          </div>
          <div className="mt-2">
            <Progress value={summary.tasks.completion_rate} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Équipe */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Équipe</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.team.total_members}</div>
          <div className="flex items-center space-x-2 text-xs text-muted-foreground mb-2">
            <TrendingUp className="w-3 h-3 text-green-500" />
            <span>Productivité: {summary.team.avg_productivity}%</span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span>Projets actifs</span>
              <span className="font-medium text-blue-600">
                {summary.team.active_projects}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span>Membres actifs</span>
              <span className="font-medium text-green-600">
                {summary.team.total_members}
              </span>
            </div>
          </div>
          <div className="mt-2">
            <Progress value={summary.team.avg_productivity} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Budget */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Budget</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(summary.budget.total_allocated)}
          </div>
          <div className="flex items-center space-x-2 text-xs text-muted-foreground mb-2">
            {getBudgetUtilization() > 90 ? (
              <TrendingDown className="w-3 h-3 text-red-500" />
            ) : (
              <TrendingUp className="w-3 h-3 text-green-500" />
            )}
            <span>Utilisation: {getBudgetUtilization()}%</span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span>Dépensé</span>
              <span className="font-medium text-orange-600">
                {formatCurrency(summary.budget.total_spent)}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span>Restant</span>
              <span className="font-medium text-green-600">
                {formatCurrency(summary.budget.remaining)}
              </span>
            </div>
          </div>
          <div className="mt-2">
            <Progress 
              value={getBudgetUtilization()} 
              className="h-2"
            />
          </div>
          {getBudgetUtilization() > 90 && (
            <div className="mt-2">
              <Badge variant="destructive" className="text-xs">
                Budget critique
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Métriques de performance */}
      <Card className="md:col-span-2 lg:col-span-4">
        <CardHeader>
          <CardTitle className="text-lg">Métriques de performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-1">
                {getOnTimeRate()}%
              </div>
              <div className="text-sm text-muted-foreground">
                Projets livrés à temps
              </div>
              <Progress value={getOnTimeRate()} className="mt-2 h-2" />
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-1">
                {summary.tasks.completion_rate}%
              </div>
              <div className="text-sm text-muted-foreground">
                Taux de complétion des tâches
              </div>
              <Progress value={summary.tasks.completion_rate} className="mt-2 h-2" />
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-1">
                {summary.team.avg_productivity}%
              </div>
              <div className="text-sm text-muted-foreground">
                Productivité moyenne de l'équipe
              </div>
              <Progress value={summary.team.avg_productivity} className="mt-2 h-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 