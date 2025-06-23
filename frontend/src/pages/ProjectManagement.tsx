import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Filter, Plus, Eye, Edit, Archive, MoreHorizontal } from 'lucide-react';
import { ProjectCard } from '@/components/ProjectCard';
import { CreateProjectModal } from '@/components/CreateProjectModal';
import { ProjectDetailsPage } from '@/components/ProjectDetailsPage';

const ProjectManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [selectedProject, setSelectedProject] = useState<any>(null);

  // Données d'exemple étendues
  const [projects] = useState([
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
      description: "Organisation de l'événement de lancement du nouveau produit TechCorp.",
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
      description: "Campagne de relations publiques pour le lancement de StartupX.",
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
      description: "Réalisation d'une vidéo corporate institutionnelle.",
      budget: "35000",
      priority: "Haute"
    }
  ]);

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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgente': return 'bg-red-100 text-red-800';
      case 'Haute': return 'bg-orange-100 text-orange-800';
      case 'Normale': return 'bg-blue-100 text-blue-800';
      case 'Basse': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleProjectView = (project: any) => {
    setSelectedProject(project);
  };

  const handleBackToList = () => {
    setSelectedProject(null);
  };

  const handleUpdateProject = (updatedProject: any) => {
    // In a real app, this would update the project in the backend
    console.log('Updated project:', updatedProject);
  };

  // If a project is selected, show the details page
  if (selectedProject) {
    return (
      <ProjectDetailsPage
        project={selectedProject}
        onBack={handleBackToList}
        onUpdateProject={handleUpdateProject}
      />
    );
  }

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    const matchesType = typeFilter === 'all' || project.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-10xl mx-auto space-y-8">
        {/* En-tête */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestion des Projets</h1>
            <p className="text-gray-600 mt-2">Gérez tous vos projets depuis cette interface centralisée</p>
          </div>
          <CreateProjectModal onProjectCreate={() => {}}>
            <Button className="bg-blue-600 hover:bg-blue-700 rounded-full px-6 py-2 text-base font-semibold shadow-sm">
              <Plus className="h-4 w-4 mr-2" />
              Nouveau Projet
            </Button>
          </CreateProjectModal>
        </div>

        {/* Filtres et recherche */}
        <Card className="p-6 rounded-2xl shadow-sm">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-1 gap-4 items-center">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par nom, client ou ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 rounded-full bg-gray-50 border-0"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40 rounded-full">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="En cours">En cours</SelectItem>
                  <SelectItem value="Planification">Planification</SelectItem>
                  <SelectItem value="Production">Production</SelectItem>
                  <SelectItem value="En pause">En pause</SelectItem>
                  <SelectItem value="Terminé">Terminé</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40 rounded-full">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="Événementiel">Événementiel</SelectItem>
                  <SelectItem value="Communication">Communication</SelectItem>
                  <SelectItem value="Audiovisuel">Audiovisuel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                className="rounded-full px-4"
                onClick={() => setViewMode('grid')}
              >
                Grille
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                className="rounded-full px-4"
                onClick={() => setViewMode('table')}
              >
                Tableau
              </Button>
            </div>
          </div>
        </Card>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6 rounded-2xl bg-blue-50 border-0 shadow-sm flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-2">
              <Plus className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-blue-700">{projects.length}</div>
            <div className="text-sm text-gray-600">Total Projets</div>
          </Card>
          <Card className="p-6 rounded-2xl bg-green-50 border-0 shadow-sm flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-2">
              <Eye className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-green-700">{projects.filter(p => p.status === 'En cours').length}</div>
            <div className="text-sm text-gray-600">En Cours</div>
          </Card>
          <Card className="p-6 rounded-2xl bg-orange-50 border-0 shadow-sm flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mb-2">
              <Filter className="w-6 h-6 text-orange-600" />
            </div>
            <div className="text-3xl font-bold text-orange-700">{projects.filter(p => p.priority === 'Haute').length}</div>
            <div className="text-sm text-gray-600">Priorité Haute</div>
          </Card>
          <Card className="p-6 rounded-2xl bg-purple-50 border-0 shadow-sm flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-2">
              <Archive className="w-6 h-6 text-purple-600" />
            </div>
            <div className="text-3xl font-bold text-purple-700">{projects.filter(p => p.status === 'Terminé').length}</div>
            <div className="text-sm text-gray-600">Terminés</div>
          </Card>
        </div>

        {/* Liste des projets */}
        <Card className="p-6 rounded-2xl shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">
              Projets ({filteredProjects.length})
            </h2>
            <Button variant="outline" size="sm" className="rounded-full px-4">
              <Filter className="h-4 w-4 mr-2" />
              Filtres avancés
            </Button>
          </div>

          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProjects.map(project => (
                <div key={project.id} onClick={() => handleProjectView(project)} className="cursor-pointer">
                  <ProjectCard project={project} userRole="Chef de projet" />
                </div>
              ))}
            </div>
          ) : (
            <Table className="rounded-xl overflow-hidden">
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead>Projet</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Priorité</TableHead>
                  <TableHead>Échéance</TableHead>
                  <TableHead>Progrès</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.map(project => (
                  <TableRow key={project.id} className="hover:bg-blue-50 transition-colors">
                    <TableCell>
                      <div>
                        <div className="font-medium">{project.title}</div>
                        <div className="text-sm text-gray-500">{project.id}</div>
                      </div>
                    </TableCell>
                    <TableCell>{project.client}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="rounded-full px-3 py-1 text-sm font-medium border-gray-200 bg-gray-100 text-gray-700">{project.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(project.status) + " rounded-full px-3 py-1 text-sm font-medium"}>
                        {project.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(project.priority) + " rounded-full px-3 py-1 text-sm font-medium"}>
                        {project.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(project.deadline).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                        <span className="text-sm">{project.progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="rounded-full">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="rounded-full">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="rounded-full">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {filteredProjects.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">Aucun projet trouvé</div>
              <Button variant="outline" className="rounded-full px-4">
                Effacer les filtres
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ProjectManagement;
