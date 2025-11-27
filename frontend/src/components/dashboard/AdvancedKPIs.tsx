import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Zap,
  Activity,
  BarChart3,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPIData {
  roi?: number; // Return on Investment (%)
  velocity?: number; // Projects completed per month
  burnRate?: number; // Money spent per month
  successRate?: number; // % of projects completed successfully
  utilizationRate?: number; // % of team capacity used
  avgProjectDuration?: number; // Average days to complete
  revenuePerProject?: number; // Average revenue per project
  clientSatisfaction?: number; // Client satisfaction score (0-100)
  onTimeDelivery?: number; // % of projects delivered on time
  budgetVariance?: number; // % difference from budget
  teamProductivity?: number; // Tasks completed per team member
  profitMargin?: number; // Profit margin %
}

interface AdvancedKPIsProps {
  data?: KPIData;
  period?: string;
  comparisonData?: KPIData; // For period-to-period comparison
}

interface KPICardProps {
  title: string;
  value: number | string;
  unit?: string;
  icon: React.ReactNode;
  trend?: number;
  trendLabel?: string;
  format?: 'number' | 'currency' | 'percentage' | 'days';
  colorScheme?: 'blue' | 'green' | 'orange' | 'red' | 'purple';
  reverseColors?: boolean; // For KPIs where lower is better
}

const formatValue = (value: number, format: KPICardProps['format'], unit?: string): string => {
  if (format === 'currency') {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'GNF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }
  if (format === 'percentage') {
    return `${value.toFixed(1)}%`;
  }
  if (format === 'days') {
    return `${Math.round(value)} ${unit || 'jours'}`;
  }
  return `${value.toFixed(1)}${unit ? ' ' + unit : ''}`;
};

const getTrendIcon = (trend: number) => {
  if (trend > 0) return <ArrowUpRight className="h-4 w-4" />;
  if (trend < 0) return <ArrowDownRight className="h-4 w-4" />;
  return <Minus className="h-4 w-4" />;
};

const getTrendColor = (trend: number, reverseColors: boolean = false) => {
  const isPositive = reverseColors ? trend < 0 : trend > 0;
  const isNegative = reverseColors ? trend > 0 : trend < 0;

  if (isPositive) return 'text-green-600 bg-green-50';
  if (isNegative) return 'text-red-600 bg-red-50';
  return 'text-gray-600 bg-gray-50';
};

const getColorClasses = (colorScheme: KPICardProps['colorScheme']) => {
  switch (colorScheme) {
    case 'blue':
      return 'border-blue-200 bg-blue-50/50';
    case 'green':
      return 'border-green-200 bg-green-50/50';
    case 'orange':
      return 'border-orange-200 bg-orange-50/50';
    case 'red':
      return 'border-red-200 bg-red-50/50';
    case 'purple':
      return 'border-purple-200 bg-purple-50/50';
    default:
      return 'border-gray-200';
  }
};

const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  unit,
  icon,
  trend,
  trendLabel,
  format = 'number',
  colorScheme = 'blue',
  reverseColors = false,
}) => {
  const formattedValue =
    typeof value === 'number' ? formatValue(value, format, unit) : value;

  return (
    <Card className={cn('transition-all hover:shadow-md', getColorClasses(colorScheme))}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className={cn(
                'p-2 rounded-lg',
                colorScheme === 'blue' && 'bg-blue-100 text-blue-600',
                colorScheme === 'green' && 'bg-green-100 text-green-600',
                colorScheme === 'orange' && 'bg-orange-100 text-orange-600',
                colorScheme === 'red' && 'bg-red-100 text-red-600',
                colorScheme === 'purple' && 'bg-purple-100 text-purple-600',
              )}>
                {icon}
              </div>
              <h3 className="text-sm font-medium text-gray-600">{title}</h3>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-2">
              {formattedValue}
            </div>
            {trend !== undefined && (
              <div className="flex items-center gap-1">
                <Badge
                  variant="secondary"
                  className={cn('text-xs font-medium', getTrendColor(trend, reverseColors))}
                >
                  {getTrendIcon(trend)}
                  {Math.abs(trend).toFixed(1)}%
                </Badge>
                {trendLabel && (
                  <span className="text-xs text-gray-500">{trendLabel}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const AdvancedKPIs: React.FC<AdvancedKPIsProps> = ({
  data,
  period = '30 jours',
  comparisonData,
}) => {
  if (!data) return null;

  const calculateTrend = (current: number | undefined, previous: number | undefined): number | undefined => {
    if (current === undefined || previous === undefined || previous === 0) return undefined;
    return ((current - previous) / previous) * 100;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Indicateurs Clés de Performance</h2>
          <p className="text-sm text-gray-500 mt-1">Période: {period}</p>
        </div>
        {comparisonData && (
          <Badge variant="outline" className="text-sm">
            Comparaison activée
          </Badge>
        )}
      </div>

      {/* Indicateurs financiers */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-green-600" />
          Performance Financière
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {data.roi !== undefined && (
            <KPICard
              title="ROI"
              value={data.roi}
              icon={<TrendingUp className="h-5 w-5" />}
              format="percentage"
              colorScheme="green"
              trend={calculateTrend(data.roi, comparisonData?.roi)}
              trendLabel="vs période précédente"
            />
          )}
          {data.burnRate !== undefined && (
            <KPICard
              title="Burn Rate"
              value={data.burnRate}
              icon={<Activity className="h-5 w-5" />}
              format="currency"
              colorScheme="orange"
              trend={calculateTrend(data.burnRate, comparisonData?.burnRate)}
              reverseColors={true}
            />
          )}
          {data.revenuePerProject !== undefined && (
            <KPICard
              title="Revenu Moyen / Projet"
              value={data.revenuePerProject}
              icon={<DollarSign className="h-5 w-5" />}
              format="currency"
              colorScheme="blue"
              trend={calculateTrend(data.revenuePerProject, comparisonData?.revenuePerProject)}
            />
          )}
          {data.profitMargin !== undefined && (
            <KPICard
              title="Marge Bénéficiaire"
              value={data.profitMargin}
              icon={<BarChart3 className="h-5 w-5" />}
              format="percentage"
              colorScheme="green"
              trend={calculateTrend(data.profitMargin, comparisonData?.profitMargin)}
            />
          )}
        </div>
      </div>

      {/* Indicateurs de performance */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Target className="h-5 w-5 text-blue-600" />
          Performance Opérationnelle
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {data.velocity !== undefined && (
            <KPICard
              title="Vélocité"
              value={data.velocity}
              unit="projets/mois"
              icon={<Zap className="h-5 w-5" />}
              colorScheme="purple"
              trend={calculateTrend(data.velocity, comparisonData?.velocity)}
            />
          )}
          {data.successRate !== undefined && (
            <KPICard
              title="Taux de Réussite"
              value={data.successRate}
              icon={<CheckCircle className="h-5 w-5" />}
              format="percentage"
              colorScheme="green"
              trend={calculateTrend(data.successRate, comparisonData?.successRate)}
            />
          )}
          {data.onTimeDelivery !== undefined && (
            <KPICard
              title="Livraison À Temps"
              value={data.onTimeDelivery}
              icon={<Clock className="h-5 w-5" />}
              format="percentage"
              colorScheme="blue"
              trend={calculateTrend(data.onTimeDelivery, comparisonData?.onTimeDelivery)}
            />
          )}
          {data.avgProjectDuration !== undefined && (
            <KPICard
              title="Durée Moyenne Projet"
              value={data.avgProjectDuration}
              unit="jours"
              icon={<Clock className="h-5 w-5" />}
              format="days"
              colorScheme="orange"
              trend={calculateTrend(data.avgProjectDuration, comparisonData?.avgProjectDuration)}
              reverseColors={true}
            />
          )}
        </div>
      </div>

      {/* Indicateurs d'équipe */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-purple-600" />
          Performance d'Équipe
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {data.utilizationRate !== undefined && (
            <KPICard
              title="Taux d'Utilisation"
              value={data.utilizationRate}
              icon={<Activity className="h-5 w-5" />}
              format="percentage"
              colorScheme="blue"
              trend={calculateTrend(data.utilizationRate, comparisonData?.utilizationRate)}
            />
          )}
          {data.teamProductivity !== undefined && (
            <KPICard
              title="Productivité Équipe"
              value={data.teamProductivity}
              unit="tâches/membre"
              icon={<Users className="h-5 w-5" />}
              colorScheme="purple"
              trend={calculateTrend(data.teamProductivity, comparisonData?.teamProductivity)}
            />
          )}
          {data.clientSatisfaction !== undefined && (
            <KPICard
              title="Satisfaction Client"
              value={data.clientSatisfaction}
              unit="/100"
              icon={<CheckCircle className="h-5 w-5" />}
              colorScheme="green"
              trend={calculateTrend(data.clientSatisfaction, comparisonData?.clientSatisfaction)}
            />
          )}
          {data.budgetVariance !== undefined && (
            <KPICard
              title="Variance Budget"
              value={data.budgetVariance}
              icon={<AlertTriangle className="h-5 w-5" />}
              format="percentage"
              colorScheme={Math.abs(data.budgetVariance) > 10 ? 'red' : 'orange'}
              trend={calculateTrend(data.budgetVariance, comparisonData?.budgetVariance)}
              reverseColors={true}
            />
          )}
        </div>
      </div>
    </div>
  );
};
