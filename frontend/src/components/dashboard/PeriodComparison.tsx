import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Area,
} from 'recharts';
import {
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  TrendingUp,
  Calendar,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ComparisonData {
  metric: string;
  current: number;
  previous: number;
  change: number;
  changePercent: number;
}

interface TimeSeriesData {
  period: string;
  current: number;
  previous: number;
  metric: string;
}

interface PeriodComparisonProps {
  currentPeriod: {
    label: string;
    data: {
      revenue?: number;
      projects?: number;
      clients?: number;
      tasks?: number;
      [key: string]: number | undefined;
    };
  };
  previousPeriod: {
    label: string;
    data: {
      revenue?: number;
      projects?: number;
      clients?: number;
      tasks?: number;
      [key: string]: number | undefined;
    };
  };
  timeSeriesData?: TimeSeriesData[];
  onPeriodChange?: (current: string, previous: string) => void;
}

const periodOptions = [
  { value: '7d', label: '7 derniers jours' },
  { value: '30d', label: '30 derniers jours' },
  { value: '90d', label: '3 derniers mois' },
  { value: 'ytd', label: 'Année en cours' },
  { value: 'custom', label: 'Personnalisé' },
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'GNF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatNumber = (value: number) => {
  return new Intl.NumberFormat('fr-FR').format(value);
};

const getTrendIcon = (change: number) => {
  if (change > 0) return <ArrowUpRight className="h-4 w-4" />;
  if (change < 0) return <ArrowDownRight className="h-4 w-4" />;
  return <Minus className="h-4 w-4" />;
};

const getTrendColor = (change: number) => {
  if (change > 5) return 'text-green-600 bg-green-50 border-green-200';
  if (change < -5) return 'text-red-600 bg-red-50 border-red-200';
  return 'text-gray-600 bg-gray-50 border-gray-200';
};

export const PeriodComparison: React.FC<PeriodComparisonProps> = ({
  currentPeriod,
  previousPeriod,
  timeSeriesData,
  onPeriodChange,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [comparisonType, setComparisonType] = useState<'absolute' | 'percentage'>('percentage');

  const calculateComparison = (
    metric: string,
    currentValue: number | undefined,
    previousValue: number | undefined
  ): ComparisonData => {
    const current = currentValue || 0;
    const previous = previousValue || 0;
    const change = current - previous;
    const changePercent = previous !== 0 ? (change / previous) * 100 : 0;

    return {
      metric,
      current,
      previous,
      change,
      changePercent,
    };
  };

  const metrics = [
    {
      key: 'revenue',
      label: 'Revenus',
      format: formatCurrency,
      icon: '💰',
    },
    {
      key: 'projects',
      label: 'Projets',
      format: formatNumber,
      icon: '📊',
    },
    {
      key: 'clients',
      label: 'Clients',
      format: formatNumber,
      icon: '👥',
    },
    {
      key: 'tasks',
      label: 'Tâches',
      format: formatNumber,
      icon: '✓',
    },
  ];

  const comparisonData = metrics.map((metric) =>
    calculateComparison(
      metric.label,
      currentPeriod.data[metric.key],
      previousPeriod.data[metric.key]
    )
  );

  const handlePeriodChange = (value: string) => {
    setSelectedPeriod(value);
    if (onPeriodChange) {
      onPeriodChange(value, value); // In real app, calculate previous period
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Comparaison de Périodes
            </CardTitle>
            <div className="flex items-center gap-3">
              <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Sélectionner période" />
                </SelectTrigger>
                <SelectContent>
                  {periodOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-1 border rounded-lg p-1">
                <Button
                  variant={comparisonType === 'percentage' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setComparisonType('percentage')}
                >
                  %
                </Button>
                <Button
                  variant={comparisonType === 'absolute' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setComparisonType('absolute')}
                >
                  #
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span className="font-medium">{currentPeriod.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-400 rounded"></div>
              <span className="font-medium">{previousPeriod.label}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {comparisonData.map((data, index) => {
          const metric = metrics[index];
          return (
            <Card key={data.metric} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{metric.icon}</span>
                    <Badge
                      variant="outline"
                      className={cn('font-medium', getTrendColor(data.changePercent))}
                    >
                      {getTrendIcon(data.changePercent)}
                      {comparisonType === 'percentage'
                        ? `${Math.abs(data.changePercent).toFixed(1)}%`
                        : metric.format(Math.abs(data.change))}
                    </Badge>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-600 mb-1">
                      {data.metric}
                    </h4>
                    <div className="text-2xl font-bold text-gray-900">
                      {metric.format(data.current)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Précédent:</span>
                    <span className="font-medium">{metric.format(data.previous)}</span>
                  </div>
                  {/* Progress bar */}
                  <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'absolute h-full rounded-full transition-all duration-500',
                        data.changePercent > 0 ? 'bg-green-500' : 'bg-red-500'
                      )}
                      style={{
                        width: `${Math.min(Math.abs(data.changePercent), 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Time Series Comparison Chart */}
      {timeSeriesData && timeSeriesData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Évolution Comparative
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart
                data={timeSeriesData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="colorPrevious" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#9ca3af" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#9ca3af" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="period"
                  stroke="#6b7280"
                  tick={{ fontSize: 12 }}
                />
                <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '12px',
                  }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="circle"
                />
                <Area
                  type="monotone"
                  dataKey="current"
                  fill="url(#colorCurrent)"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name={currentPeriod.label}
                />
                <Area
                  type="monotone"
                  dataKey="previous"
                  fill="url(#colorPrevious)"
                  stroke="#9ca3af"
                  strokeWidth={2}
                  name={previousPeriod.label}
                />
                <Line
                  type="monotone"
                  dataKey="current"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#3b82f6' }}
                />
                <Line
                  type="monotone"
                  dataKey="previous"
                  stroke="#9ca3af"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 4, fill: '#9ca3af' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Summary Insights */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-2">
                Résumé de la Comparaison
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {comparisonData.map((data) => {
                  const isPositive = data.changePercent > 0;
                  return (
                    <div key={data.metric} className="flex items-center gap-2">
                      <div
                        className={cn(
                          'w-2 h-2 rounded-full',
                          isPositive ? 'bg-green-500' : 'bg-red-500'
                        )}
                      />
                      <span className="text-gray-700">
                        <strong>{data.metric}</strong>:{' '}
                        {isPositive ? 'hausse' : 'baisse'} de{' '}
                        <strong>{Math.abs(data.changePercent).toFixed(1)}%</strong>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
