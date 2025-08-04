import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ProjectPlanning } from '@/components/projects/ProjectPlanning';
import { ProjectTimesheets } from '@/components/projects/ProjectTimesheets';
import { ProjectTrackingAlerts } from '@/components/projects/ProjectTrackingAlerts';
import { ProjectTrackingTable } from '@/components/projects/ProjectTrackingTable';
import { ProjectCalendar } from '@/components/projects/ProjectCalendar';
import { DocumentManager } from '@/components/projects/DocumentManager';
import { ClientDetailsCard } from '@/components/clients/ClientDetailsCard';
import { ContratDetailsCard } from '@/components/contrats/ContratDetailsCard';
import { StartProjectModal } from '@/components/projects/StartProjectModal';
import { EditProjectModal } from '@/components/EditProjectModal';
import { useProject, useUpdateProject } from '@/hooks/use-projects';
import { ArrowLeft, Loader2, Play, CheckCircle, Edit } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { differenceInDays, format } from 'date-fns';
import { useProjectAlerts } from '@/hooks/use-project-alerts';
import { useToast } from '@/hooks/use-toast';

export function ProjectDetailsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('planning');
  const [activeTrackingTab, setActiveTrackingTab] = useState('tracking');
  const { toast } = useToast();
  
  const { data: project, isLoading, error } = useProject(projectId || '');
  const updateProjectMutation = useUpdateProject();
  
  // Récupération du nombre d'alertes
  const { data: alerts = [] } = useProjectAlerts(projectId || '');

  const handleProjectUpdate = async (projectId: string, data: any) => {
    try {
      await updateProjectMutation.mutateAsync({ projectId, data });
      toast({
        title: "Projet mis à jour",
        description: "Le projet a été modifié avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le projet. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  };

  const canStartProject = project && (
    project.status === 'Prospection' || 
    project.status === 'Devis' ||
    (project.status === 'Production' && !project.start_date)
  );

  const isProjectStarted = project && project.status === 'Production' && project.start_date;

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
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate('/projects')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour aux projets
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{project.title}</h1>
          <p className="text-gray-600">{project.client_details?.nom_complet || 'Client non assigné'}</p>
        </div>
        <div className="flex gap-2">
          <EditProjectModal 
            project={project as any} 
            onProjectUpdate={handleProjectUpdate}
          >
            <Button variant="outline">
              <Edit className="w-4 h-4 mr-2" />
              Modifier
            </Button>
          </EditProjectModal>
          {canStartProject && (
            <StartProjectModal project={project}>
              <Button className="bg-green-600 hover:bg-green-700">
                <Play className="w-4 h-4 mr-2" />
                Démarrer le projet
              </Button>
            </StartProjectModal>
          )}
        </div>
        {isProjectStarted && (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Projet démarré</span>
          </div>
        )}
      </div>

      <Tabs value={activeTrackingTab} onValueChange={setActiveTrackingTab} className="mb-6">
        <TabsList className='grid w-full grid-cols-4'>
          <TabsTrigger value="tracking">Tableau de suivi du projet</TabsTrigger>
          <TabsTrigger value="tracking-alert">
            Suivi alertes
            {alerts.length > 0 && (
              <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
                {alerts.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="tracking">
          {/* Affichage de la durée totale du projet */}
          {(() => {
            if (project.contract_details?.date_debut && project.contract_details?.date_fin) {
              try {
                const debut = new Date(project.contract_details.date_debut);
                const fin = new Date(project.contract_details.date_fin);
                const jours = differenceInDays(fin, debut);
                if (jours > 0) {
                  return (
                    <div className="mb-4 text-base text-gray-700">
                      <span className="font-semibold">Durée totale du projet :</span> {jours} jours <br />
                      <span className="font-semibold text-xs text-gray-500">Date de démarrage :</span> <span className="text-xs">{ project.start_date ? format(new Date(project.start_date), 'dd/MM/yyyy') : 'Non définie'}</span> <br />
                    </div>
                  );
                }
              } catch (e) {
                console.log(e)
              }
            }
            return null;
          })()}
          <ProjectTrackingTable project={project} />
        </TabsContent>
        <TabsContent value="tracking-alert"> 
          <ProjectTrackingAlerts projectId={projectId} />
        </TabsContent>
      </Tabs>
      {/* Section Tableau de suivi */}
      
      {/* Informations client et contrat */}
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="planning">Planification</TabsTrigger>
          <TabsTrigger value="calendar">Calendrier</TabsTrigger>
          <TabsTrigger value="timesheets">Feuilles de temps</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="planning">
          <ProjectPlanning projectId={projectId} />
        </TabsContent>

        <TabsContent value="calendar">
          <ProjectCalendar project={project} />
        </TabsContent>

        <TabsContent value="timesheets">
          <ProjectTimesheets projectId={projectId} />
        </TabsContent>

        <TabsContent value="documents">
          <DocumentManager projectId={projectId} />
        </TabsContent>
      </Tabs>
    </div>
  );
} 