import { useParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { ProjectCalendar } from '@/components/ProjectCalendar';
import { useProject } from '@/hooks/use-projects';
import { Loader2 } from 'lucide-react';

export function ProjectCalendarPage() {
  const { projectId } = useParams();
  const { data: project, isLoading } = useProject(projectId || '');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Projet non trouvé</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Calendrier du Projet</h1>
        <p className="text-gray-600 mt-1">{project.title}</p>
      </div>

      <Card className="p-6">
        <ProjectCalendar projects={[project]} />
      </Card>
    </div>
  );
} 