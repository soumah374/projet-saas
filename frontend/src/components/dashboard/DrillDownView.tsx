import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  ChevronRight,
  Home,
  ArrowLeft,
  TrendingUp,
  Users,
  FolderKanban,
  DollarSign,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DrillDownLevel {
  level: number;
  title: string;
  data: any[];
  metric: string;
}

interface DrillDownViewProps {
  initialData?: any[];
  onDrillDown?: (level: number, item: any) => any[];
  onItemSelect?: (item: any) => void;
}

const COLORS = {
  primary: '#3b82f6',
  secondary: '#10b981',
  tertiary: '#f59e0b',
  quaternary: '#8b5cf6',
  quinary: '#ec4899',
};

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

export const DrillDownView: React.FC<DrillDownViewProps> = ({
  initialData = [],
  onDrillDown,
  onItemSelect,
}) => {
  const [drillPath, setDrillPath] = useState<DrillDownLevel[]>([
    {
      level: 0,
      title: 'Vue d\'ensemble',
      data: initialData,
      metric: 'revenue',
    },
  ]);

  const currentLevel = drillPath[drillPath.length - 1];

  const handleDrillDown = (item: any) => {
    if (onDrillDown && currentLevel.level < 3) {
      const nextLevelData = onDrillDown(currentLevel.level + 1, item);
      if (nextLevelData && nextLevelData.length > 0) {
        setDrillPath([
          ...drillPath,
          {
            level: currentLevel.level + 1,
            title: item.name || item.label || 'Détails',
            data: nextLevelData,
            metric: currentLevel.metric,
          },
        ]);
      }
    }
  };

  const handleNavigate = (targetLevel: number) => {
    setDrillPath(drillPath.slice(0, targetLevel + 1));
  };

  const handleGoBack = () => {
    if (drillPath.length > 1) {
      setDrillPath(drillPath.slice(0, -1));
    }
  };

  const getLevelIcon = (level: number) => {
    switch (level) {
      case 0:
        return <Home className="h-4 w-4" />;
      case 1:
        return <Users className="h-4 w-4" />;
      case 2:
        return <FolderKanban className="h-4 w-4" />;
      case 3:
        return <DollarSign className="h-4 w-4" />;
      default:
        return <ChevronRight className="h-4 w-4" />;
    }
  };

  const getChartData = () => {
    return currentLevel.data.map((item) => ({
      ...item,
      displayValue: item[currentLevel.metric] || item.value || 0,
      displayName: item.name || item.label || 'Sans nom',
    }));
  };

  const chartData = getChartData();
  const totalValue = chartData.reduce((sum, item) => sum + item.displayValue, 0);

  return (
    <div className="space-y-6">
      {/* Navigation Breadcrumb */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <Breadcrumb>
              <BreadcrumbList>
                {drillPath.map((level, index) => (
                  <React.Fragment key={level.level}>
                    <BreadcrumbItem>
                      <BreadcrumbLink
                        onClick={() => handleNavigate(level.level)}
                        className={cn(
                          'flex items-center gap-2 cursor-pointer hover:text-primary transition-colors',
                          index === drillPath.length - 1 && 'font-semibold text-primary'
                        )}
                      >
                        {getLevelIcon(level.level)}
                        {level.title}
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    {index < drillPath.length - 1 && <BreadcrumbSeparator />}
                  </React.Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
            {drillPath.length > 1 && (
              <Button variant="outline" size="sm" onClick={handleGoBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-600 rounded-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-blue-600 font-medium">Total</p>
                <p className="text-2xl font-bold text-blue-900">
                  {formatCurrency(totalValue)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-600 rounded-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-green-600 font-medium">Éléments</p>
                <p className="text-2xl font-bold text-green-900">
                  {formatNumber(chartData.length)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-600 rounded-lg">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-purple-600 font-medium">Moyenne</p>
                <p className="text-2xl font-bold text-purple-900">
                  {formatCurrency(chartData.length > 0 ? totalValue / chartData.length : 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Interactive Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {getLevelIcon(currentLevel.level)}
              {currentLevel.title}
              <Badge variant="secondary" className="ml-2">
                Niveau {currentLevel.level + 1}
              </Badge>
            </CardTitle>
            {currentLevel.level < 3 && (
              <Badge variant="outline" className="text-blue-600 border-blue-200">
                Cliquez sur une barre pour explorer
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="displayName"
                angle={-45}
                textAnchor="end"
                height={100}
                tick={{ fontSize: 12, fill: '#6b7280' }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#6b7280' }}
                tickFormatter={(value) => formatCurrency(value)}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '12px',
                }}
                formatter={(value: any) => formatCurrency(value)}
                labelStyle={{ fontWeight: 'bold', marginBottom: '8px' }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar
                dataKey="displayValue"
                name="Valeur"
                radius={[8, 8, 0, 0]}
                onClick={(data: any) => handleDrillDown(data)}
                style={{ cursor: currentLevel.level < 3 ? 'pointer' : 'default' }}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      Object.values(COLORS)[index % Object.values(COLORS).length]
                    }
                    className="hover:opacity-80 transition-opacity"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detailed List */}
      <Card>
        <CardHeader>
          <CardTitle>Détails des Éléments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {chartData.map((item, index) => {
              const percentage = totalValue > 0 ? (item.displayValue / totalValue) * 100 : 0;
              return (
                <div
                  key={index}
                  className={cn(
                    'flex items-center justify-between p-4 rounded-lg border transition-all',
                    currentLevel.level < 3
                      ? 'hover:bg-gray-50 hover:border-primary cursor-pointer'
                      : 'bg-gray-50'
                  )}
                  onClick={() => currentLevel.level < 3 && handleDrillDown(item)}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor:
                          Object.values(COLORS)[index % Object.values(COLORS).length],
                      }}
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{item.displayName}</h4>
                      {item.description && (
                        <p className="text-sm text-gray-500">{item.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-bold text-gray-900">
                        {formatCurrency(item.displayValue)}
                      </div>
                      <div className="text-sm text-gray-500">{percentage.toFixed(1)}%</div>
                    </div>
                    <div className="w-32">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all duration-500"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor:
                              Object.values(COLORS)[index % Object.values(COLORS).length],
                          }}
                        />
                      </div>
                    </div>
                    {currentLevel.level < 3 && (
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
