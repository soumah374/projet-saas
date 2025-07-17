import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TimeSheetList } from './TimeSheetList';
import { useTimesheets } from '@/hooks/use-timesheets';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { TimeSheet } from '@/lib/api';

interface ProjectTimesheetsProps {
  projectId: string;
}

export const ProjectTimesheets = ({ projectId }: ProjectTimesheetsProps) => {
  const [view, setView] = useState<'list' | 'summary'>('list');
  const { data: timesheetsData } = useTimesheets(projectId);
  const timeSheets = timesheetsData?.results || [];

  // Calculate summary statistics
  const summary = {
    totalHours: timeSheets.reduce((sum, ts) => sum + ts.hours, 0),
    validatedHours: timeSheets
      .filter(ts => ts.validated_by)
      .reduce((sum, ts) => sum + ts.hours, 0),
    pendingHours: timeSheets
      .filter(ts => !ts.validated_by)
      .reduce((sum, ts) => sum + ts.hours, 0),
    byTask: timeSheets.reduce((acc, ts: TimeSheet) => {
      const taskId = ts.task_details?.id;
      if (!taskId) return acc;
      if (!acc[taskId]) {
        acc[taskId] = {
          title: ts.task_details?.title,
          hours: 0,
          entries: 0
        };
      }
      acc[taskId].hours += ts?.hours || 0;
      acc[taskId].entries += 1;
      return acc;
    }, {} as Record<number, { title: string; hours: number; entries: number }>)
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feuilles de temps</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={view} onValueChange={(value: any) => setView(value)} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="list">Liste</TabsTrigger>
            <TabsTrigger value="summary">Résumé</TabsTrigger>
          </TabsList>

          <TabsContent value="list">
            <TimeSheetList projectId={projectId} />
          </TabsContent>

          <TabsContent value="summary">
            <div className="space-y-6">
              {/* Overall Statistics */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {summary.totalHours}h
                      </div>
                      <div className="text-sm text-gray-600">Total des heures</div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {summary.validatedHours}h
                      </div>
                      <div className="text-sm text-gray-600">Heures validées</div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">
                        {summary.pendingHours}h
                      </div>
                      <div className="text-sm text-gray-600">Heures en attente</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* By Task */}
              <Card>
                <CardHeader>
                  <CardTitle>Répartition par tâche</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(summary.byTask).map(([taskId, data]) => (
                      <div key={taskId} className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{data.title}</div>
                          <div className="text-sm text-gray-500">
                            {data.entries} entrée{data.entries > 1 ? 's' : ''}
                          </div>
                        </div>
                        <div className="text-lg font-semibold">
                          {data.hours}h
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}; 