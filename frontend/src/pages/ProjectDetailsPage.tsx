import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft, Edit3, Users, Calendar, FileText, MessageSquare, 
  Clock, DollarSign, CheckCircle, AlertTriangle, Play, Pause, Square,
  Save, X, ArrowRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { projectApi, Project } from '@/lib/api';

export const ProjectDetailsPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [newComment, setNewComment] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const statuses = ['Planification', 'En cours', 'Production', 'En pause', 'Terminé'];
  const priorities = ['Basse', 'Normale', 'Haute', 'Urgente'];
  const types = ['Événementiel', 'Communication', 'Audiovisuel', 'Digital', 'Autre'];

  useEffect(() => {
    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  const loadProject = async () => {
    try {
      setIsLoading(true);
      const projectData = await projectApi.getProject(projectId!);
      setCurrentProject(projectData);
    } catch (err) {
      setError('Erreur lors du chargement du projet');
      console.error('Error loading project:', err);
    } finally {
      setIsLoading(false);
    }
  };

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

  const updateProject = async (updates: any) => {
    if (!currentProject) return;
    
    try {
      const updatedProject = { ...currentProject, ...updates };
      await projectApi.updateProject(currentProject.id, updatedProject);
      setCurrentProject(updatedProject);
      
      toast({
        title: "Projet mis à jour",
        description: "Les modifications ont été sauvegardées avec succès.",
      });
    } catch (err) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les modifications.",
        variant: "destructive",
      });
      console.error('Error updating project:', err);
    }
  };

  const handleSaveField = (field: string, value: any) => {
    updateProject({ [field]: value });
    setEditingField(null);
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setIsEditing(false);
  };

  const addComment = () => {
    if (newComment.trim() && currentProject) {
      const comment = {
        id: Date.now(),
        text: newComment,
        author: 'Sarah Martin',
        timestamp: new Date().toISOString(),
        type: 'comment'
      };
      
      updateProject({
        comments: [...(currentProject.comments || []), comment]
      });
      setNewComment('');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'En cours': return <Play className="h-4 w-4" />;
      case 'En pause': return <Pause className="h-4 w-4" />;
      case 'Terminé': return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const EditableField = ({ field, value, type = 'text', options = [] }: any) => {
    const isCurrentlyEditing = editingField === field;
    
    if (isCurrentlyEditing) {
      if (type === 'select') {
        return (
          <div className="flex items-center gap-2">
            <Select value={value} onValueChange={(newValue) => handleSaveField(field, newValue)}>
              <SelectTrigger className="w-auto min-w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {options.map((option: string) => (
                  <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        );
      } else if (type === 'textarea') {
        return (
          <div className="space-y-2">
            <Textarea
              value={value}
              onChange={(e) => setCurrentProject(prev => prev ? { ...prev, [field]: e.target.value } : null)}
              rows={4}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={() => handleSaveField(field, currentProject?.[field])}>
                <Save className="h-4 w-4 mr-1" />
                Sauvegarder
              </Button>
              <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                <X className="h-4 w-4 mr-1" />
                Annuler
              </Button>
            </div>
          </div>
        );
      } else {
        return (
          <div className="flex items-center gap-2">
            <Input
              value={value}
              onChange={(e) => setCurrentProject(prev => prev ? { ...prev, [field]: e.target.value } : null)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveField(field, currentProject?.[field]);
                if (e.key === 'Escape') handleCancelEdit();
              }}
              autoFocus
            />
            <Button size="sm" onClick={() => handleSaveField(field, currentProject?.[field])}>
              <Save className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        );
      }
    }

    return (
      <div 
        className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
        onClick={() => setEditingField(field)}
      >
        <span>{value}</span>
        <Edit3 className="h-3 w-3 text-gray-400" />
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement du projet...</p>
        </div>
      </div>
    );
  }

  if (error || !currentProject) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Projet non trouvé'}</p>
          <Button onClick={() => navigate('/projects')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux projets
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate('/projects')} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux projets
          </Button>
          
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="mb-2">
                <EditableField 
                  field="title" 
                  value={currentProject.title} 
                  type="text"
                />
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>ID: {currentProject.id}</span>
                <span>•</span>
                <span>Client: {currentProject.client}</span>
                <span>•</span>
                <span>Créé le {new Date(currentProject.created_at || Date.now()).toLocaleDateString('fr-FR')}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setIsEditing(!isEditing)} variant="outline">
                <Edit3 className="h-4 w-4 mr-2" />
                {isEditing ? 'Mode lecture' : 'Mode édition'}
              </Button>
            </div>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-2">Statut</p>
                  <EditableField 
                    field="status" 
                    value={currentProject.status} 
                    type="select"
                    options={statuses}
                  />
                </div>
                {getStatusIcon(currentProject.status)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-2">Priorité</p>
                  <EditableField 
                    field="priority" 
                    value={currentProject.priority || 'Normale'} 
                    type="select"
                    options={priorities}
                  />
                </div>
                <AlertTriangle className="h-4 w-4 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-2">Avancement</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold">{currentProject.progress}%</span>
                      {isEditing && (
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={currentProject.progress}
                          onChange={(e) => updateProject({ progress: parseInt(e.target.value) || 0 })}
                          className="w-20 h-8"
                        />
                      )}
                    </div>
                    <Progress value={currentProject.progress} className="w-full" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-2">Échéance</p>
                  <p className="font-semibold">
                    {new Date(currentProject.deadline).toLocaleDateString('fr-FR')}
                  </p>
                  <p className="text-xs text-gray-500">
                    {Math.ceil((new Date(currentProject.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} jours restants
                  </p>
                </div>
                <Calendar className="h-4 w-4 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="team">Équipe</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="budget">Budget</TabsTrigger>
            <TabsTrigger value="comments">Commentaires</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Description du projet</CardTitle>
                </CardHeader>
                <CardContent>
                  <EditableField 
                    field="description" 
                    value={currentProject.description || 'Aucune description disponible'} 
                    type="textarea"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Informations générales</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Type:</span>
                    <EditableField 
                      field="type" 
                      value={currentProject.type} 
                      type="select"
                      options={types}
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Client:</span>
                    <EditableField 
                      field="client" 
                      value={currentProject.client} 
                      type="text"
                    />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Chef de projet:</span>
                    <span className="font-medium">Sarah Martin</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date de création:</span>
                    <span className="font-medium">
                      {new Date(currentProject.created_at || Date.now()).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="team">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Équipe du projet
                  </div>
                  <Button 
                    onClick={() => navigate(`/projects/${currentProject.id}/team`)}
                    variant="outline"
                    size="sm"
                  >
                    Voir l'équipe complète
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(currentProject.team_members || []).map((member: any, index: number) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold">
                          {member.user?.first_name?.[0]}{member.user?.last_name?.[0] || member.user?.username?.[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">
                          {member.user?.first_name} {member.user?.last_name || member.user?.username}
                        </p>
                        <p className="text-sm text-gray-500">{member.role}</p>
                      </div>
                    </div>
                  ))}
                  {(!currentProject.team_members || currentProject.team_members.length === 0) && (
                    <div className="col-span-full text-center py-8">
                      <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-500 mb-4">Aucun membre d'équipe assigné</p>
                      <Button 
                        onClick={() => navigate(`/projects/${currentProject.id}/team`)}
                        variant="outline"
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Gérer l'équipe
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Documents du projet
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Aucun document uploadé pour le moment</p>
                  <Button className="mt-4">Ajouter des documents</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="budget">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Budget du projet
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-4">Budget total</h4>
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {currentProject.budget ? `${currentProject.budget.toLocaleString()} GNF` : 'Non défini'}
                    </div>
                    <div className="text-sm text-gray-600">
                      Budget alloué au projet
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-4">Dépenses</h4>
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      0 GNF
                    </div>
                    <div className="text-sm text-gray-600">
                      Dépenses engagées
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="comments">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Commentaires et notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Ajouter un commentaire..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="flex-1"
                    />
                    <Button onClick={addComment} disabled={!newComment.trim()}>
                      Ajouter
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {(currentProject.comments || []).map((comment: any) => (
                      <div key={comment.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium">{comment.author}</span>
                          <span className="text-sm text-gray-500">
                            {new Date(comment.timestamp).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        <p className="text-gray-700">{comment.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}; 