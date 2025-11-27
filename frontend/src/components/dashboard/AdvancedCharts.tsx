import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  FunnelChart,
  Funnel,
  LabelList,
} from 'recharts';
import { Filter, TrendingDown, Activity, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeatmapData {
  day: string;
  hour: number;
  value: number;
}

interface FunnelStageData {
  name: string;
  value: number;
  fill?: string;
}

interface AdvancedChartsProps {
  heatmapData?: HeatmapData[];
  funnelData?: FunnelStageData[];
  onCellClick?: (data: any) => void;
}

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

const getHeatmapColor = (value: number, max: number) => {
  const intensity = value / max;
  if (intensity >= 0.8) return '#dc2626'; // red-600
  if (intensity >= 0.6) return '#ea580c'; // orange-600
  if (intensity >= 0.4) return '#f59e0b'; // amber-500
  if (intensity >= 0.2) return '#fbbf24'; // yellow-400
  return '#e5e7eb'; // gray-200
};

const HeatmapChart: React.FC<{
  data: HeatmapData[];
  onCellClick?: (data: HeatmapData) => void;
}> = ({ data, onCellClick }) => {
  const maxValue = Math.max(...data.map((d) => d.value));

  const getDataForDayHour = (day: string, hour: number) => {
    return data.find((d) => d.day === day && d.hour === hour);
  };

  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-full">
        <div className="flex gap-1">
          {/* Hour labels */}
          <div className="flex flex-col gap-1 pt-8">
            {DAYS.map((day) => (
              <div
                key={day}
                className="h-8 w-12 flex items-center justify-end pr-2 text-xs font-medium text-gray-600"
              >
                {day}
              </div>
            ))}
          </div>
          {/* Heatmap cells */}
          <div className="flex-1">
            <div className="flex gap-1 mb-1">
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="flex-1 text-center text-xs font-medium text-gray-600"
                >
                  {hour}h
                </div>
              ))}
            </div>
            <div className="space-y-1">
              {DAYS.map((day) => (
                <div key={day} className="flex gap-1">
                  {HOURS.map((hour) => {
                    const cellData = getDataForDayHour(day, hour);
                    const value = cellData?.value || 0;
                    return (
                      <div
                        key={`${day}-${hour}`}
                        className={cn(
                          'flex-1 h-8 rounded cursor-pointer transition-all hover:scale-110 hover:shadow-lg',
                          'flex items-center justify-center text-xs font-medium'
                        )}
                        style={{
                          backgroundColor: getHeatmapColor(value, maxValue),
                          color: value / maxValue > 0.5 ? 'white' : '#374151',
                        }}
                        onClick={() => cellData && onCellClick?.(cellData)}
                        title={`${day} ${hour}h: ${value}`}
                      >
                        {value > 0 && value}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-4 text-xs">
          <span className="text-gray-600">Moins</span>
          <div className="flex gap-1">
            <div className="w-6 h-6 rounded" style={{ backgroundColor: '#e5e7eb' }} />
            <div className="w-6 h-6 rounded" style={{ backgroundColor: '#fbbf24' }} />
            <div className="w-6 h-6 rounded" style={{ backgroundColor: '#f59e0b' }} />
            <div className="w-6 h-6 rounded" style={{ backgroundColor: '#ea580c' }} />
            <div className="w-6 h-6 rounded" style={{ backgroundColor: '#dc2626' }} />
          </div>
          <span className="text-gray-600">Plus</span>
        </div>
      </div>
    </div>
  );
};

const FunnelChartComponent: React.FC<{
  data: FunnelStageData[];
  onClick?: (data: FunnelStageData) => void;
}> = ({ data, onClick }) => {
  const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

  const dataWithColors = data.map((item, index) => ({
    ...item,
    fill: item.fill || colors[index % colors.length],
  }));

  const totalValue = data[0]?.value || 1;

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={400}>
        <FunnelChart>
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '12px',
            }}
          />
          <Funnel
            dataKey="value"
            data={dataWithColors}
            isAnimationActive
            onClick={(data: any) => onClick?.(data)}
            style={{ cursor: 'pointer' }}
          >
            <LabelList
              position="right"
              fill="#000"
              stroke="none"
              dataKey="name"
              style={{ fontSize: '14px', fontWeight: 500 }}
            />
            {dataWithColors.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Funnel>
        </FunnelChart>
      </ResponsiveContainer>

      {/* Conversion rates */}
      <div className="space-y-2">
        {data.map((stage, index) => {
          const conversionRate =
            index === 0 ? 100 : ((stage.value / data[0].value) * 100).toFixed(1);
          const dropOff =
            index > 0
              ? (((data[index - 1].value - stage.value) / data[index - 1].value) * 100).toFixed(
                  1
                )
              : 0;

          return (
            <div
              key={stage.name}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              onClick={() => onClick?.(stage)}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: dataWithColors[index].fill }}
                />
                <span className="font-medium text-gray-900">{stage.name}</span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="text-right">
                  <div className="font-bold text-gray-900">
                    {new Intl.NumberFormat('fr-FR').format(stage.value)}
                  </div>
                  <div className="text-gray-500">{conversionRate}% du total</div>
                </div>
                {index > 0 && (
                  <Badge
                    variant="outline"
                    className="bg-red-50 text-red-700 border-red-200"
                  >
                    -{dropOff}%
                  </Badge>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const AdvancedCharts: React.FC<AdvancedChartsProps> = ({
  heatmapData,
  funnelData,
  onCellClick,
}) => {
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);

  const handleHeatmapClick = (data: HeatmapData) => {
    setSelectedMetric(`${data.day} à ${data.hour}h: ${data.value} activités`);
    if (onCellClick) {
      onCellClick(data);
    }
  };

  const handleFunnelClick = (data: FunnelStageData) => {
    setSelectedMetric(`${data.name}: ${data.value}`);
    if (onCellClick) {
      onCellClick(data);
    }
  };

  return (
    <div className="space-y-6">
      {/* Activity Heatmap */}
      {heatmapData && heatmapData.length > 0 && (
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-orange-600" />
                Carte de Chaleur - Activité par Heure
                {selectedMetric && (
                  <Badge variant="secondary" className="ml-2">
                    {selectedMetric}
                  </Badge>
                )}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedMetric(null)}
              >
                Réinitialiser
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <HeatmapChart data={heatmapData} onCellClick={handleHeatmapClick} />
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>💡 Astuce:</strong> Cliquez sur une cellule pour voir les détails de
                l'activité à ce moment précis.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Conversion Funnel */}
      {funnelData && funnelData.length > 0 && (
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-purple-600" />
                Entonnoir de Conversion
                <Badge variant="outline" className="ml-2">
                  Taux global:{' '}
                  {((funnelData[funnelData.length - 1].value / funnelData[0].value) * 100).toFixed(
                    1
                  )}
                  %
                </Badge>
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <FunnelChartComponent data={funnelData} onClick={handleFunnelClick} />
            <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-sm text-purple-900">
                <strong>📊 Analyse:</strong> L'entonnoir montre la progression des prospects à
                travers les différentes étapes. Les taux de conversion entre chaque étape aident
                à identifier les points de friction.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Matrix */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-600" />
            Matrice de Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {/* High Performance / High Volume */}
            <div className="p-6 bg-green-50 border-2 border-green-500 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-green-900">Stars ⭐</h4>
                <Badge className="bg-green-600">Excellent</Badge>
              </div>
              <p className="text-sm text-green-700">
                Performance élevée, volume élevé. Maintenir et optimiser.
              </p>
              <div className="mt-4 text-2xl font-bold text-green-900">45%</div>
            </div>

            {/* High Performance / Low Volume */}
            <div className="p-6 bg-blue-50 border-2 border-blue-500 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-blue-900">Opportunités 🚀</h4>
                <Badge className="bg-blue-600">Bon</Badge>
              </div>
              <p className="text-sm text-blue-700">
                Performance élevée, volume faible. Augmenter les investissements.
              </p>
              <div className="mt-4 text-2xl font-bold text-blue-900">25%</div>
            </div>

            {/* Low Performance / High Volume */}
            <div className="p-6 bg-orange-50 border-2 border-orange-500 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-orange-900">À Améliorer ⚠️</h4>
                <Badge className="bg-orange-600">Moyen</Badge>
              </div>
              <p className="text-sm text-orange-700">
                Performance faible, volume élevé. Optimiser ou réorienter.
              </p>
              <div className="mt-4 text-2xl font-bold text-orange-900">20%</div>
            </div>

            {/* Low Performance / Low Volume */}
            <div className="p-6 bg-red-50 border-2 border-red-500 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-red-900">Problèmes ❌</h4>
                <Badge className="bg-red-600">Faible</Badge>
              </div>
              <p className="text-sm text-red-700">
                Performance faible, volume faible. Reconsidérer la stratégie.
              </p>
              <div className="mt-4 text-2xl font-bold text-red-900">10%</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
