import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Calendar, Users, FileText, MoreHorizontal, Eye, EyeOff } from 'lucide-react';
import { Project } from '@/lib/api';

interface ProjectCardProps {
  project: Project;
  userRole: string;
}

export const ProjectCard = ({ project, userRole }: ProjectCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Planification': return 'bg-gray-100 text-gray-800';
      case 'En cours': return 'bg-blue-100 text-blue-800';
      case 'Production': return 'bg-gray-100 text-gray-800';
      case 'En pause': return 'bg-gray-100 text-gray-800';
      case 'Terminé': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Communication': return 'bg-blue-100 text-blue-800';
      case 'Événementiel': return 'bg-red-100 text-red-800';
      case 'Audiovisuel': return 'bg-blue-100 text-blue-800';
      case 'Production': return 'bg-gray-100 text-gray-800';
      case 'Digital': return 'bg-blue-100 text-blue-800';
      case 'Conseil': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const isDeadlineClose = new Date(project.deadline) < new Date(Date.now() + 7*24*60*60*1000);
  const canViewBudget = ['Managing Director', 'Finance/Admin'].includes(userRole);
  
  // Extract team member names for display - handle both detailed and list views
  const teamMemberNames = project.team_members 
    ? project.team_members.map(member => 
        `${member.user.first_name} ${member.user.last_name}`.trim() || member.user.username
      )
    : [];
  
  // Use team_count if available, otherwise use team_members length
  const teamCount = project.team_count || teamMemberNames.length;

  return (
    <Card className="p-6 hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Badge className={getTypeColor(project.type)}>
              {project.type}
            </Badge>
            <Badge className={getStatusColor(project.status)}>
              {project.status}
            </Badge>
          </div>
          <h3 className="font-semibold text-lg text-gray-900 mb-1">{project.title}</h3>
          <p className="text-sm text-gray-600">ID: {project.id}</p>
          <p className="text-sm text-gray-600">Client: {project.client}</p>
        </div>
        <Button variant="ghost" size="sm">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>

      {/* Barre de progression */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Avancement</span>
          <span className="text-sm text-gray-600">{project.progress}%</span>
        </div>
        <Progress value={project.progress} className="h-2" />
      </div>

      {/* Informations projet */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="h-4 w-4" />
          <span>Échéance:</span>
          <Badge variant={isDeadlineClose ? "destructive" : "secondary"}>
            {new Date(project.deadline).toLocaleDateString('fr-FR')}
          </Badge>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Users className="h-4 w-4" />
          <span>Équipe:</span>
          <div className="flex gap-1">
            {teamMemberNames.length > 0 ? (
              <>
                {teamMemberNames.slice(0, 3).map((member, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {member}
                  </Badge>
                ))}
                {teamMemberNames.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{teamMemberNames.length - 3}
                  </Badge>
                )}
              </>
            ) : (
              <Badge variant="outline" className="text-xs">
                {teamCount} membre{teamCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </div>

        {/* Informations budgétaires (selon le rôle) */}
        {canViewBudget ? (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FileText className="h-4 w-4" />
            <span>Budget: {project.budget || 'Non défini'}</span>
            <Badge variant="secondary">75% facturé</Badge>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <EyeOff className="h-4 w-4" />
            <span>Informations budgétaires masquées</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-4 border-t border-gray-100 mt-4">
        <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700">
          <Eye className="h-4 w-4 mr-2" />
          Voir détails
        </Button>
        <Button variant="outline" size="sm">
          <FileText className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm">
          <Users className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
};
