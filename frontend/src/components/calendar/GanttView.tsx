
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface GanttViewProps {
  projects: any[];
}

export const GanttView = ({ projects }: GanttViewProps) => {
  const [currentMonth] = useState(new Date());
  
  const today = new Date();
  const startDate = new Date(today.getFullYear(), today.getMonth(), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Diagramme de Gantt</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Diagramme de Gantt</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="px-4 py-2 text-sm font-medium">
                {startDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
              </span>
              <Button variant="outline" size="sm">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border overflow-hidden">
            <div className="p-4 border-b bg-gray-50">
              <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-600">
                {Array.from({ length: 31 }, (_, i) => (
                  <div key={i} className="text-center p-1">
                    {i + 1}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-4 space-y-4">
              {projects.map((project) => (
                <div key={project.id} className="space-y-2">
                  <div className="flex items-center gap-4">
                    <div className="w-48 text-sm font-medium">
                      {project.title}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {project.progress}%
                    </Badge>
                    <div className="text-xs text-gray-500">
                      Échéance: {new Date(project.deadline).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-12 gap-2 h-8">
                    {Array.from({ length: 31 }, (_, i) => {
                      const isActive = i < (31 * project.progress / 100);
                      const isToday = i === new Date().getDate() - 1;
                      return (
                        <div 
                          key={i} 
                          className={`rounded-sm border ${
                            isActive 
                              ? 'bg-blue-500 border-blue-600' 
                              : 'bg-gray-100 border-gray-200'
                          } ${isToday ? 'ring-2 ring-orange-400' : ''}`}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
