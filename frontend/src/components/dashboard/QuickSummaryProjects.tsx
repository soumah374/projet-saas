import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, AlertTriangle, Target, TriangleAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface QuickSummaryProps {
  data?: {
    total_projects: number;
    active_projects: number;
    total_revenue: number;
    urgent_deadlines: number;
    overdue_projects: number;
    revenue_change?: number;
    projects_change?: number;
    selected: string[];
    userSelected: string[];
    project_performance: Array<{
      type: 'top' | 'flop';
      projects: {
        id: number;
        title: string;
        progress: number;
      };
    }>;
  };
  period: string;
}

type SummaryItem = {
  title: string;
  value: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  description: string;
  change?: number;
};

export const QuickSummaryProjects: React.FC<QuickSummaryProps> = ({ data }) => {
  if (!data) return null;

    const navigate = useNavigate();
  

  const getChangeIcon = (change?: number) => {
    if (!change) return null;
    return change > 0 ? (
      <svg className="h-4 w-4 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 17l6-6 4 4 8-8" />
      </svg>
    ) : (
      <svg className="h-4 w-4 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 7l-6 6-4-4-8 8" />
      </svg>
    );
  };

  const getChangeColor = (change?: number) => {
    if (!change) return 'text-gray-500';
    if (change > 0) return 'text-green-600';
    return 'text-red-600';
  };

  const getChangeText = (change?: number) => {
    if (!change) return 'Aucun changement';
    if (change > 0) return `+${change.toFixed(1)}%`;
    return `${change.toFixed(1)}%`;
  };

  const isSelected = (key: string) => !data.selected || data.selected.includes(key) || data.userSelected.includes(key);

  const projectItems: SummaryItem[] = [
    ...(isSelected('projects.overdue_projects') ? [{
      title: 'Projets en Retard',
      value: data.overdue_projects || 0,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      description: 'À traiter'
    }] : []),
    ...(isSelected('calendar.upcoming_deadlines') ? [{
      title: 'Échéances Urgentes',
      value: data.urgent_deadlines || 0,
      icon: Calendar,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      description: '≤ 3 jours'
    }] : []),
    ...(isSelected('projects.active_projects') ? [{
      title: 'Projets Actifs',
      value: data.active_projects || 0,
      icon: Target,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      change: data.projects_change,
      description: 'En cours'
    }] : []),
    ...(isSelected('projects.total_projects') ? [{
      title: 'Nombre total de project',
      value: data.total_projects || 0,
      icon: Target,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      change: data.projects_change,
      description: 'En cours'
    }] : []),
    ...(isSelected('projects.project_performance') ? [{
      title: 'Performance des projets',
      value: (
        <>
          <div className="space-y-1">
            {data.project_performance.map((perf) => (
              <div key={perf.type} className="flex items-center justify-between text-xs">
                <span
                  style={{ cursor: 'pointer' }}
                  className={`font-medium ${perf.type === 'top' ? 'text-green-600' : 'text-red-600'}`}
                  onClick={() => {navigate(`/projects/${perf.projects.id}`)}}
                >
                  {perf.type === 'top' ? 'Top' : 'Flop'} : {perf.projects.title}
                </span>
                <span
                  style={{ cursor: 'pointer' }}
                  className={`ml-2 text-${perf.type === 'top' ? 'green' : 'red'}-600`}>
                  {perf.projects.progress}%
                </span>
              </div>
            ))}
          </div>
        </>
      ),
      icon: TriangleAlert,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      change: data.revenue_change,
      description: 'Ce mois-ci'
    }] : []),
    
  ];
  return (
    <div>
      {isSelected('projects.quick_summary_projects') && ( 
      <div className="flex items-center gap-2 mb-3">
        <Target className="h-4 w-4 text-blue-600" />
        <h3 className="text-sm font-semibold text-gray-700">Projets</h3>
      </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {projectItems.map((item, index) => {
          const IconComponent = item.icon;
          return (
            <Card key={`project-${index}`} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`p-2 rounded-full ${item.bgColor}`}>
                        <IconComponent className={`h-4 w-4 ${item.color}`} />
                      </div>
                      <span className="text-sm font-medium text-gray-600">
                        {item.title}
                      </span>
                    </div>
                    <div className={`text-xl font-bold ${item.color}`}>
                      {item.value}
                    </div>
                    <p className="text-xs text-gray-500">
                      {item.description}
                    </p>
                  </div>
                  <div className="text-right">
                    {item.change !== undefined && (
                      <div className="flex items-center gap-1">
                        {/* {getChangeIcon(item.change)} */}
                        {/* <span className={`text-xs font-medium ${getChangeColor(item.change)}`}>
                          {getChangeText(item.change)}
                        </span> */}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}; 