import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Target, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Star,
  Award,
  TrendingUp
} from 'lucide-react';

interface TeamPerformanceMember {
  id: number;
  name: string;
  role: string;
  productivity: number;
  tasks_completed: number;
  projects_involved: number;
}

interface TeamPerformanceProps {
  members: TeamPerformanceMember[];
  topPerformers: TeamPerformanceMember[];
  averageProductivity: number;
  totalTasks: number;
  completedTasks: number;
  activeProjects: number;
}

export function TeamPerformance({
  members,
  topPerformers,
  averageProductivity,
  totalTasks,
  completedTasks,
  activeProjects
}: TeamPerformanceProps) {
  const taskCompletionRate = totalTasks > 0 
    ? Math.round((completedTasks / totalTasks) * 100)
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Statistiques générales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            Performance globale
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">Productivité moyenne</p>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-2xl font-bold">{averageProductivity}%</span>
              </div>
            </div>
            <Progress value={averageProductivity} className="w-24" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Activités complétées</p>
              <p className="text-lg font-semibold">{completedTasks}/{totalTasks}</p>
              <Progress value={taskCompletionRate} className="h-2" />
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Projets actifs</p>
              <p className="text-lg font-semibold">{activeProjects}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top performers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-500" />
            Top performers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topPerformers.slice(0, 3).map((member, index) => (
              <div key={member.id} className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  {index === 0 ? (
                    <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                      <Star className="h-5 w-5 text-yellow-500" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <span className="text-gray-600 font-medium">{index + 1}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{member.name}</p>
                  <p className="text-xs text-gray-500">{member.role}</p>
                </div>
                <div className="text-right">
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {member.productivity}%
                  </Badge>
                  <p className="text-xs text-gray-500 mt-1">
                    {member.tasks_completed} activités
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Liste des membres */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Membres de l'équipe
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map((member) => (
              <div
                key={member.id}
                className="p-4 rounded-lg border bg-card text-card-foreground"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-gray-500">{member.role}</p>
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={member.productivity >= 75 ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}
                  >
                    {member.productivity}%
                  </Badge>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Projets</span>
                    <span>{member.projects_involved}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Activités complétées</span>
                    <span>{member.tasks_completed}</span>
                  </div>
                  <Progress 
                    value={member.productivity} 
                    className="h-1.5"
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 