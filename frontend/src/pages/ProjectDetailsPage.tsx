import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProjectPlanning } from '@/components/projects/ProjectPlanning';
import { ProjectTimesheets } from '@/components/projects/ProjectTimesheets';
import { ProjectTrackingAlerts } from '@/components/projects/ProjectTrackingAlerts';
import { ProjectTrackingTable } from '@/components/projects/ProjectTrackingTable';
import { ProjectCalendar } from '@/components/projects/ProjectCalendar';
import { DocumentManager } from '@/components/projects/DocumentManager';
import { ClientDetailsCard } from '@/components/clients/ClientDetailsCard';
import { ContratDetailsCard } from '@/components/contrats/ContratDetailsCard';
import { useProject, useStartProject, useUpdateProject } from '@/hooks/use-projects';
import { ArrowLeft, Loader2, Edit, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { EditProjectModal } from '@/components/EditProjectModal';
import type { CreateProjectForm } from '@/lib/types';
import { ProjectActionModals } from '@/components/projects/ProjectActionModals';
import { usePermissions } from '@/hooks/use-permissions';

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'Prospection':
      return 'bg-indigo-100 text-indigo-800';
    case 'Production':
      return 'bg-blue-100 text-blue-800';
    case 'Livraison':
      return 'bg-orange-100 text-orange-800';
    case 'Terminé':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export function ProjectDetailsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('planning');

  const { 
    canManageProjects,
    canManageContrats,
    hasPermission
  } = usePermissions();
  
  const { data: project, isLoading, error } = useProject(projectId || '');
  const startProjectMutation = useStartProject();
  const updateProjectMutation = useUpdateProject();

  const isProjectStarted = project && project.status === 'Production' && project.start_date;

  const handleProjectUpdate = async (id: string, data: Partial<CreateProjectForm>) => {
    try {
      await updateProjectMutation.mutateAsync({ projectId: id, data });
    } catch (e) {
      console.error('Erreur lors de la mise à jour du projet:', e);
    }
  };

  const handleStartProject = async () => {
    if (!projectId) return;
    const today = new Date().toISOString().split('T')[0];
    try {
      await startProjectMutation.mutateAsync({ projectId, startDate: today });
    } catch (e) {
      // Optionally: handle error UI
      console.error('Erreur lors du lancement du projet:', e);
    }
  };

  const handleMoveToLivraison = async () => {
    if (!projectId) return;
    try {
      await updateProjectMutation.mutateAsync({ projectId, data: { status: 'Livraison' } });
    } catch (e) {
      console.error('Erreur lors du passage en Livraison:', e);
    }
  };

  const handleCompleteProject = async () => {
    if (!projectId) return;
    try {
      await updateProjectMutation.mutateAsync({ projectId, data: { status: 'Terminé' } });
    } catch (e) {
      console.error('Erreur lors de la finalisation du projet:', e);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !projectId || !project) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Button variant="outline" onClick={() => navigate('/projects')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour aux projets
        </Button>
        
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>
            Le projet n'a pas pu être chargé. Veuillez réessayer plus tard.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4 justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/projects')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour aux projets
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{project.title}</h1>
              <Badge variant="secondary" className={getStatusBadgeClass(project.status)}>
                {project.status}
              </Badge>
            </div>
            <p className="text-gray-600">{project.client_details?.nom_complet || 'Client non assigné'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isProjectStarted && (

            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Projet démarré</span>
            </div>
            
          )}
          {project.status !== 'Terminé' && (
            hasPermission('projects.edit_project') && (
            <EditProjectModal 
              project={project as any} 
              onProjectUpdate={handleProjectUpdate}
            >
              <Button variant="outline">
                <Edit className="w-4 h-4 mr-2" />
                Modifier
              </Button>
            </EditProjectModal>
            )
          )}
          {hasPermission('projects.start_project') && (
            <ProjectActionModals
              status={project.status}
              isStarting={startProjectMutation.isPending}
              isUpdating={updateProjectMutation.isPending}
              onStart={handleStartProject}
              onMoveToLivraison={handleMoveToLivraison}
                onComplete={handleCompleteProject}
              />
          )}
        </div>
      </div>
      
      <ProjectTrackingAlerts projectId={projectId} />
      

      {/* Tableau de suivi du projet */}
      {hasPermission('projects.sommary_project') && (
        <ProjectTrackingTable project={project} />
      )}
      
      {/* Informations client et contrat */}
      {hasPermission('projects.manage_project_members') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {project.client_details && (
            <ClientDetailsCard client={project.client_details} />
          )}
          {project.contract_details && (
            <ContratDetailsCard 
              contrat={project.contract_details} 
              showViewButton={true}
              onView={() => window.open(`/contrats/${project.contract}`, '_blank')}
            />
          )}
        </div>
      )}
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="planning">Planification</TabsTrigger>
          <TabsTrigger value="calendar">Calendrier</TabsTrigger>
          <TabsTrigger value="timesheets">Feuilles de temps</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>
        
        <TabsContent value="planning">
          {hasPermission('projects.view_projecttask') && (
            <ProjectPlanning projectId={projectId} />
          )}
        </TabsContent>
        
        <TabsContent value="calendar">
          {hasPermission('projects.view_projectevent') && (
            <ProjectCalendar project={project} />
          )}
        </TabsContent>
        
        <TabsContent value="timesheets">
          {hasPermission('projects.view_timesheet') && (
            <ProjectTimesheets projectId={projectId} />
          )}
        </TabsContent>
        
        <TabsContent value="documents">
          {hasPermission('documents.view_document') && (
            <DocumentManager projectId={projectId} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 