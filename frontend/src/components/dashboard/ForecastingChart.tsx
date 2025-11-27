import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from 'recharts';
import { TrendingUp, AlertCircle, Calendar, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HistoricalData {
  period: string;
  value: number;
  actual?: boolean;
}

interface ForecastData extends HistoricalData {
  forecast?: number;
  lowerBound?: number;
  upperBound?: number;
  confidence?: number;
}

interface ForecastingChartProps {
  historicalData: HistoricalData[];
  metric: string;
  unit?: string;
  forecastPeriods?: number;
  onForecastUpdate?: (forecast: ForecastData[]) => void;
}

const FORECAST_METHODS = [
  { value: 'linear', label: 'Régression Linéaire' },
  { value: 'moving_average', label: 'Moyenne Mobile' },
  { value: 'exponential', label: 'Lissage Exponentiel' },
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
  return new Intl.NumberFormat('fr-FR').format(Math.round(value));
};

export const ForecastingChart: React.FC<ForecastingChartProps> = ({
  historicalData,
  metric,
  unit = 'currency',
  forecastPeriods = 6,
  onForecastUpdate,
}) => {
  const [forecastMethod, setForecastMethod] = useState('linear');
  const [selectedPeriods, setSelectedPeriods] = useState(forecastPeriods);

  // Calculate linear regression forecast
  const calculateLinearForecast = (data: HistoricalData[]): ForecastData[] => {
    const n = data.length;
    const xValues = Array.from({ length: n }, (_, i) => i);
    const yValues = data.map((d) => d.value);

    // Calculate means
    const xMean = xValues.reduce((a, b) => a + b, 0) / n;
    const yMean = yValues.reduce((a, b) => a + b, 0) / n;

    // Calculate slope and intercept
    let numerator = 0;
    let denominator = 0;
    for (let i = 0; i < n; i++) {
      numerator += (xValues[i] - xMean) * (yValues[i] - yMean);
      denominator += Math.pow(xValues[i] - xMean, 2);
    }
    const slope = numerator / denominator;
    const intercept = yMean - slope * xMean;

    // Calculate standard error for confidence intervals
    const predictions = xValues.map((x) => slope * x + intercept);
    const residuals = yValues.map((y, i) => y - predictions[i]);
    const standardError =
      Math.sqrt(residuals.reduce((sum, r) => sum + r * r, 0) / (n - 2)) * 1.96;

    // Generate forecast
    const forecast: ForecastData[] = [];
    for (let i = 0; i <= selectedPeriods; i++) {
      const x = n - 1 + i;
      const forecastValue = slope * x + intercept;
      const period = i === 0 ? data[data.length - 1].period : `F${i}`;

      forecast.push({
        period,
        value: i === 0 ? data[data.length - 1].value : forecastValue,
        forecast: forecastValue,
        lowerBound: forecastValue - standardError,
        upperBound: forecastValue + standardError,
        confidence: 95,
        actual: i === 0,
      });
    }

    return forecast;
  };

  // Calculate moving average forecast
  const calculateMovingAverageForecast = (data: HistoricalData[]): ForecastData[] => {
    const windowSize = Math.min(3, data.length);
    const recentValues = data.slice(-windowSize).map((d) => d.value);
    const average = recentValues.reduce((a, b) => a + b, 0) / windowSize;
    const variance =
      recentValues.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / windowSize;
    const standardDeviation = Math.sqrt(variance) * 1.96;

    const forecast: ForecastData[] = [];
    for (let i = 0; i <= selectedPeriods; i++) {
      const period = i === 0 ? data[data.length - 1].period : `F${i}`;
      forecast.push({
        period,
        value: i === 0 ? data[data.length - 1].value : average,
        forecast: average,
        lowerBound: average - standardDeviation,
        upperBound: average + standardDeviation,
        confidence: 95,
        actual: i === 0,
      });
    }

    return forecast;
  };

  // Calculate exponential smoothing forecast
  const calculateExponentialForecast = (data: HistoricalData[]): ForecastData[] => {
    const alpha = 0.3; // Smoothing factor
    let smoothedValue = data[0].value;

    data.forEach((point) => {
      smoothedValue = alpha * point.value + (1 - alpha) * smoothedValue;
    });

    const variance =
      data.reduce((sum, point) => sum + Math.pow(point.value - smoothedValue, 2), 0) /
      data.length;
    const standardDeviation = Math.sqrt(variance) * 1.96;

    const forecast: ForecastData[] = [];
    for (let i = 0; i <= selectedPeriods; i++) {
      const period = i === 0 ? data[data.length - 1].period : `F${i}`;
      forecast.push({
        period,
        value: i === 0 ? data[data.length - 1].value : smoothedValue,
        forecast: smoothedValue,
        lowerBound: smoothedValue - standardDeviation,
        upperBound: smoothedValue + standardDeviation,
        confidence: 95,
        actual: i === 0,
      });
    }

    return forecast;
  };

  const forecastData = useMemo(() => {
    if (historicalData.length < 2) return [];

    let forecast: ForecastData[];
    switch (forecastMethod) {
      case 'linear':
        forecast = calculateLinearForecast(historicalData);
        break;
      case 'moving_average':
        forecast = calculateMovingAverageForecast(historicalData);
        break;
      case 'exponential':
        forecast = calculateExponentialForecast(historicalData);
        break;
      default:
        forecast = calculateLinearForecast(historicalData);
    }

    if (onForecastUpdate) {
      onForecastUpdate(forecast);
    }

    return forecast;
  }, [historicalData, forecastMethod, selectedPeriods]);

  const chartData = useMemo(() => {
    const historical = historicalData.map((item) => ({
      ...item,
      actual: item.value,
    }));
    return [...historical, ...forecastData.slice(1)];
  }, [historicalData, forecastData]);

  const avgForecast =
    forecastData.length > 1
      ? forecastData.slice(1).reduce((sum, d) => sum + (d.forecast || 0), 0) /
        (forecastData.length - 1)
      : 0;

  const currentValue = historicalData[historicalData.length - 1]?.value || 0;
  const trend = avgForecast - currentValue;
  const trendPercent = currentValue !== 0 ? (trend / currentValue) * 100 : 0;

  const formatter = unit === 'currency' ? formatCurrency : formatNumber;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-purple-600" />
            Prévisions: {metric}
            <Badge
              variant="outline"
              className={cn(
                'ml-2',
                trendPercent > 0
                  ? 'text-green-600 bg-green-50 border-green-200'
                  : 'text-red-600 bg-red-50 border-red-200'
              )}
            >
              {trendPercent > 0 ? '+' : ''}
              {trendPercent.toFixed(1)}%
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={forecastMethod} onValueChange={setForecastMethod}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Méthode" />
              </SelectTrigger>
              <SelectContent>
                {FORECAST_METHODS.map((method) => (
                  <SelectItem key={method.value} value={method.value}>
                    {method.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={selectedPeriods.toString()}
              onValueChange={(value) => setSelectedPeriods(parseInt(value))}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 périodes</SelectItem>
                <SelectItem value="6">6 périodes</SelectItem>
                <SelectItem value="12">12 périodes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Valeur Actuelle</span>
              </div>
              <div className="text-2xl font-bold text-blue-900">
                {formatter(currentValue)}
              </div>
            </div>
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-900">Prévision Moyenne</span>
              </div>
              <div className="text-2xl font-bold text-purple-900">
                {formatter(avgForecast)}
              </div>
            </div>
            <div
              className={cn(
                'p-4 border rounded-lg',
                trend > 0
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp
                  className={cn('h-4 w-4', trend > 0 ? 'text-green-600' : 'text-red-600')}
                />
                <span
                  className={cn(
                    'text-sm font-medium',
                    trend > 0 ? 'text-green-900' : 'text-red-900'
                  )}
                >
                  Tendance
                </span>
              </div>
              <div
                className={cn(
                  'text-2xl font-bold',
                  trend > 0 ? 'text-green-900' : 'text-red-900'
                )}
              >
                {trend > 0 ? '+' : ''}
                {formatter(trend)}
              </div>
            </div>
          </div>

          {/* Chart */}
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="period" stroke="#6b7280" tick={{ fontSize: 12 }} />
              <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '12px',
                }}
                formatter={(value: any) => formatter(value)}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
              <ReferenceLine
                x={historicalData[historicalData.length - 1]?.period}
                stroke="#9ca3af"
                strokeDasharray="3 3"
                label={{ value: 'Aujourd\'hui', position: 'top', fill: '#6b7280' }}
              />
              <ReferenceArea
                x1={historicalData[historicalData.length - 1]?.period}
                fill="#f3f4f6"
                fillOpacity={0.3}
              />
              <Area
                type="monotone"
                dataKey="upperBound"
                stroke="none"
                fill="#e9d5ff"
                fillOpacity={0.3}
                name="Intervalle de confiance"
              />
              <Area
                type="monotone"
                dataKey="lowerBound"
                stroke="none"
                fill="#ffffff"
                fillOpacity={1}
              />
              <Area
                type="monotone"
                dataKey="actual"
                fill="url(#colorActual)"
                stroke="#3b82f6"
                strokeWidth={3}
                name="Valeurs Réelles"
              />
              <Line
                type="monotone"
                dataKey="forecast"
                stroke="#8b5cf6"
                strokeWidth={3}
                strokeDasharray="5 5"
                dot={{ r: 5, fill: '#8b5cf6' }}
                name="Prévisions"
              />
            </AreaChart>
          </ResponsiveContainer>

          {/* Confidence Info */}
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="flex-1 text-sm">
              <p className="font-medium text-amber-900 mb-1">
                Niveau de confiance: 95%
              </p>
              <p className="text-amber-700">
                Les prévisions sont basées sur{' '}
                <strong>{FORECAST_METHODS.find((m) => m.value === forecastMethod)?.label}</strong>
                . Les intervalles de confiance indiquent la plage probable des valeurs futures.
                Plus l'intervalle est large, plus l'incertitude est grande.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
