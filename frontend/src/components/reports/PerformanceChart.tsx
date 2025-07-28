import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PerformanceData {
  timeline: {
    labels: string[];
    projects_completed: number[];
    tasks_completed: number[];
  };
  team: {
    avg_productivity: number;
  };
}

interface PerformanceChartProps {
  data: PerformanceData;
}

export function PerformanceChart({ data }: PerformanceChartProps) {
  const projectData = data.timeline.labels.map((label, index) => ({
    name: label,
    "Projets complétés": data.timeline.projects_completed[index],
    "Activités complétées": data.timeline.tasks_completed[index],
  }));

  const formatNumber = (value: number) => value.toString();

  return (
    <Tabs defaultValue="projects" className="space-y-4">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="projects">Performance des projets</TabsTrigger>
        <TabsTrigger value="team">Performance de l'équipe</TabsTrigger>
      </TabsList>

      <TabsContent value="projects">
        <Card>
          <CardHeader>
            <CardTitle>Évolution des projets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={projectData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={formatNumber} />
                  <Tooltip 
                    formatter={formatNumber}
                    contentStyle={{ 
                      backgroundColor: 'white',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      padding: '8px'
                    }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="Projets complétés" 
                    fill="#22c55e" 
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="Activités complétées" 
                    fill="#3b82f6" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="team">
        <Card>
          <CardHeader>
            <CardTitle>Productivité de l'équipe</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-[400px]">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  {data.team.avg_productivity}%
                </div>
                <div className="text-gray-600">
                  Productivité moyenne de l'équipe
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
} 