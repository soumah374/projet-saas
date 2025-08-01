import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Users, FileText, Clock, LogOut, User } from 'lucide-react';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { TopNavigation } from '@/components/TopNavigation';
import { StatsOverview } from '@/components/StatsOverview';
import { UserSidebar } from '@/components/UserSidebar';
import { CreateProjectModal } from '@/components/projects/CreateProjectModal';
import { ProjectDetailsPage } from '@/pages/ProjectDetailsPage';
import { DocumentManager } from '@/components/DocumentManager';
import { ProjectCalendar } from '@/components/projects/ProjectCalendar';
import { useAuth } from '@/hooks/use-auth';

const Index = () => {
  const { user, logout } = useAuth();
  const [selectedRole, setSelectedRole] = useState(user?.role || 'Chef de projet');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentView, setCurrentView] = useState<'dashboard' | 'project-details' | 'documents' | 'calendar'>('dashboard');
  const [selectedProject, setSelectedProject] = useState<any>(null);

  // Données d'exemple
  const [projects, setProjects] = useState([
    {
      id: "PROJ-2024-001",
      title: "Lancement Produit TechCorp",
      type: "Événementiel",
      status: "En cours",
      progress: 75,
      deadline: "2024-12-25",
      team: ["Sarah M.", "Pierre L.", "Marie D."],
      client: "TechCorp Solutions",
      createdAt: "2024-01-10T10:00:00Z",
      description: "Organisation de l'événement de lancement du nouveau produit TechCorp avec présentation officielle, démonstrations et networking.",
      budget: "25000",
      priority: "Haute"
    },
    {
      id: "PROJ-2024-002", 
      title: "Campagne RP StartupX",
      type: "Communication",
      status: "Planification",
      progress: 30,
      deadline: "2024-12-30",
      team: ["Antoine R.", "Julie B."],
      client: "StartupX",
      createdAt: "2024-01-12T14:30:00Z",
      description: "Campagne de relations publiques pour le lancement de StartupX incluant communiqués de presse et relations médias.",
      budget: "15000",
      priority: "Normale"
    },
    {
      id: "PROJ-2024-003",
      title: "Production Vidéo Corporate",
      type: "Audiovisuel",
      status: "Production",
      progress: 60,
      deadline: "2024-12-28",
      team: ["Marc V.", "Laura S.", "Tom K."],
      client: "Corporate Inc",
      createdAt: "2024-01-08T09:15:00Z",
      description: "Réalisation d'une vidéo corporate institutionnelle avec tournage, montage et post-production.",
      budget: "35000",
      priority: "Haute"
    }
  ]);

  const handleProjectCreate = (newProject: any) => {
    setProjects(prev => [...prev, newProject]);
  };

  const handleProjectUpdate = (updatedProject: any) => {
    setProjects(prev => 
      prev.map(p => p.id === updatedProject.id ? updatedProject : p)
    );
  };

  const handleProjectView = (project: any) => {
    setSelectedProject(project);
    setCurrentView('project-details');
  };

  const handleViewChange = (view: 'dashboard' | 'project-details' | 'documents' | 'calendar') => {
    setCurrentView(view);
    if (view !== 'project-details') {
      setSelectedProject(null);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'project-details':
        return (
          <ProjectDetailsPage 
            project={selectedProject}
            onBack={() => setCurrentView('dashboard')}
            onUpdateProject={handleProjectUpdate}
          />
        );
      case 'documents':
        return <DocumentManager projectId={selectedProject?.id || 'general'} />;
      case 'calendar':
        return <ProjectCalendar projects={projects} />;
      default:
        return (
          <div className="max-w-7xl mx-auto space-y-8">
            {/* En-tête de bienvenue avec informations utilisateur */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-8 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold mb-2">Bienvenue sur saKom</h1>
                  <p className="text-blue-100 text-lg">Plateforme de gestion collaborative des projets</p>
                  <div className="mt-4 flex gap-4">
                    <Badge variant="secondary" className="bg-blue-600/20 text-blue-100 hover:bg-blue-600/30">
                      {selectedRole}
                    </Badge>
                    <Badge variant="secondary" className="bg-blue-600/20 text-blue-100 hover:bg-blue-600/30">
                      {projects.length} projets actifs
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-medium">{user?.first_name} {user?.last_name}</p>
                    <p className="text-blue-200 text-sm">{user?.email}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="text-white hover:bg-blue-600"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Déconnexion
                  </Button>
                </div>
              </div>
            </div>

            {/* Navigation principale */}
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
                <TabsTrigger value="projects">Projets</TabsTrigger>
                <TabsTrigger value="planning" onClick={() => setCurrentView('calendar')}>Planning</TabsTrigger>
                <TabsTrigger value="documents" onClick={() => setCurrentView('documents')}>Documents</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <div className="space-y-8">
                  {/* Statistiques générales */}
                  <StatsOverview projects={projects} />

                  {/* Actions rapides */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <CreateProjectModal onProjectCreate={handleProjectCreate}>
                      <Button className="h-16 bg-blue-600 hover:bg-blue-600 flex items-center gap-3">
                        <FileText className="h-5 w-5" />
                        Nouveau Projet
                      </Button>
                    </CreateProjectModal>
                    <Button 
                      variant="outline" 
                      className="h-16 flex items-center gap-3"
                      onClick={() => setCurrentView('calendar')}
                    >
                      <Calendar className="h-5 w-5" />
                      Planning
                    </Button>
                    <Button variant="outline" className="h-16 flex items-center gap-3">
                      <Users className="h-5 w-5" />
                      Équipes
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-16 flex items-center gap-3"
                      onClick={() => setCurrentView('documents')}
                    >
                      <Clock className="h-5 w-5" />
                      Documents
                    </Button>
                  </div>

                  {/* Vue planning rapide */}
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      Échéances à venir
                    </h3>
                    <div className="space-y-3">
                      {projects.map(project => (
                        <div key={project.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div>
                            <span className="font-medium">{project.title}</span>
                            <span className="text-sm text-gray-500 ml-2">({project.type})</span>
                          </div>
                          <Badge variant={
                            new Date(project.deadline) < new Date(Date.now() + 7*24*60*60*1000) 
                              ? "destructive" 
                              : "secondary"
                          }>
                            {new Date(project.deadline).toLocaleDateString('fr-FR')}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="projects">
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-semibold text-gray-900">Projets en cours</h2>
                    <div className="flex gap-2">
                      <Badge variant="outline">Événementiel</Badge>
                      <Badge variant="outline">Communication</Badge>
                      <Badge variant="outline">Audiovisuel</Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {projects.map(project => (
                      <div key={project.id} onClick={() => handleProjectView(project)} className="cursor-pointer">
                        <ProjectCard project={project} userRole={selectedRole} />
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="planning">
                <ProjectCalendar projects={projects} />
              </TabsContent>

              <TabsContent value="documents">
                <DocumentManager projectId="general" />
              </TabsContent>
            </Tabs>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <TopNavigation 
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        user={user}
        onLogout={handleLogout}
      />
      
      <div className="flex">
        <UserSidebar 
          isOpen={isSidebarOpen}
          currentRole={selectedRole}
          onRoleChange={setSelectedRole}
          currentView={currentView}
          onViewChange={handleViewChange}
          projects={projects}
          user={user}
        />
        
        <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
          <div className="p-6">
            {renderCurrentView()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
