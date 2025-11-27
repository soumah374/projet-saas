import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Scatter,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import {
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Maximize2,
  Download,
} from 'lucide-react';

interface InteractiveChartsProps {
  data?: {
    revenue_trend?: Array<{
      period: string;
      recettes: number;
      depenses?: number;
      type: 'daily' | 'monthly';
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
  onDrillDown?: (type: string, value: any) => void;
}

const COLORS = {
  primary: '#3b82f6',
  secondary: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6',
  pink: '#ec4899',
  teal: '#14b8a6',
  indigo: '#6366f1',
};

const STATUS_COLORS: Record<string, string> = {
  'Prospection': COLORS.warning,
  'Production': COLORS.primary,
  'Livraison': COLORS.purple,
  'Terminé': COLORS.secondary,
  'En pause': '#9ca3af',
  'Annulé': COLORS.danger,
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'GNF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDate = (dateStr: string) => {
  try {
    const date = new Date(dateStr + '-01');
    return date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
  } catch {
    return dateStr;
  }
};

const CustomTooltip = ({ active, payload, label, formatter }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-medium text-gray-900 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-600">{entry.name}:</span>
            <span className="font-medium text-gray-900">
              {formatter ? formatter(entry.value) : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const InteractiveCharts: React.FC<InteractiveChartsProps> = ({
  data,
  period,
  onDrillDown,
}) => {
  const [activeChart, setActiveChart] = useState<string | null>(null);

  if (!data) return null;

  const handleChartClick = (chartType: string, dataPoint: any) => {
    if (onDrillDown) {
      onDrillDown(chartType, dataPoint);
    }
  };

  const handleExportChart = (chartName: string) => {
    // Export functionality - could be enhanced with actual export logic
    console.log('Exporting chart:', chartName);
  };

  return (
    <div className="space-y-6">
      {/* Revenue Trend - Advanced Line & Area Chart */}
      {data.revenue_trend && data.revenue_trend.length > 0 && (
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Tendance des Revenus & Dépenses
                <Badge variant="secondary" className="ml-2">Interactif</Badge>
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleExportChart('revenue_trend')}
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveChart(activeChart === 'revenue' ? null : 'revenue')}
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={activeChart === 'revenue' ? 500 : 350}>
              <ComposedChart
                data={data.revenue_trend.map(item => ({
                  ...item,
                  period: formatDate(item.period),
                }))}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorRecettes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="colorDepenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.danger} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={COLORS.danger} stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="period"
                  stroke="#6b7280"
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  stroke="#6b7280"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                />
                <Tooltip
                  content={<CustomTooltip formatter={formatCurrency} />}
                  cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="circle"
                />
                <Area
                  type="monotone"
                  dataKey="recettes"
                  fill="url(#colorRecettes)"
                  stroke={COLORS.primary}
                  strokeWidth={3}
                  name="Recettes"
                  onClick={(data) => handleChartClick('revenue', data)}
                  style={{ cursor: 'pointer' }}
                />
                {data.revenue_trend.some(item => item.depenses) && (
                  <Area
                    type="monotone"
                    dataKey="depenses"
                    fill="url(#colorDepenses)"
                    stroke={COLORS.danger}
                    strokeWidth={2}
                    name="Dépenses"
                    onClick={(data) => handleChartClick('expenses', data)}
                    style={{ cursor: 'pointer' }}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="recettes"
                  stroke={COLORS.primary}
                  strokeWidth={2}
                  dot={{ r: 6, fill: COLORS.primary, strokeWidth: 2 }}
                  activeDot={{ r: 8 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Status Distribution - Interactive Pie Chart */}
        {data.project_status_distribution &&
          Object.keys(data.project_status_distribution).length > 0 && (
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <PieChartIcon className="h-5 w-5 text-purple-600" />
                    Distribution des Statuts
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleExportChart('status_distribution')}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={Object.entries(data.project_status_distribution).map(
                        ([status, count]) => ({
                          name: status,
                          value: count,
                        })
                      )}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                      onClick={(data) => handleChartClick('status', data)}
                      style={{ cursor: 'pointer' }}
                    >
                      {Object.keys(data.project_status_distribution).map((status, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={STATUS_COLORS[status] || COLORS.primary}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconType="circle"
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

        {/* Monthly Projects - Bar Chart */}
        {data.monthly_projects && data.monthly_projects.length > 0 && (
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-indigo-600" />
                  Projets par Mois
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleExportChart('monthly_projects')}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart
                  data={data.monthly_projects.map(item => ({
                    ...item,
                    month: formatDate(item.month),
                  }))}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="month"
                    stroke="#6b7280"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="count"
                    fill={COLORS.indigo}
                    radius={[8, 8, 0, 0]}
                    onClick={(data) => handleChartClick('monthly', data)}
                    style={{ cursor: 'pointer' }}
                  >
                    {data.monthly_projects.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={index % 2 === 0 ? COLORS.indigo : COLORS.purple}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Team Performance - Radar Chart */}
      {data.team_performance && data.team_performance.length > 0 && (
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-teal-600" />
                Performance des Équipes - Vue Radar
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleExportChart('team_performance')}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ResponsiveContainer width="100%" height={350}>
                <RadarChart
                  data={data.team_performance}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis
                    dataKey="team_name"
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 100]}
                    tick={{ fontSize: 10, fill: '#6b7280' }}
                  />
                  <Radar
                    name="Progression"
                    dataKey="avg_progress"
                    stroke={COLORS.teal}
                    fill={COLORS.teal}
                    fillOpacity={0.6}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>

              <ResponsiveContainer width="100%" height={350}>
                <BarChart
                  data={data.team_performance}
                  layout="vertical"
                  margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" stroke="#6b7280" tick={{ fontSize: 12 }} />
                  <YAxis
                    dataKey="team_name"
                    type="category"
                    stroke="#6b7280"
                    tick={{ fontSize: 12 }}
                    width={90}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar
                    dataKey="project_count"
                    fill={COLORS.secondary}
                    radius={[0, 4, 4, 0]}
                    name="Nombre de Projets"
                  />
                  <Bar
                    dataKey="avg_progress"
                    fill={COLORS.primary}
                    radius={[0, 4, 4, 0]}
                    name="Progression Moyenne %"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
