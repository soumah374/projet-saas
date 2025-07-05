import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Upload, X, Plus, Users, DollarSign, FileText, Loader2, UserPlus } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { 
  CreateProjectForm, 
  ProjectType, 
  ProjectCategory, 
  ProjectStatus, 
  ProjectPriority, 
  ProjectMemberRole 
} from '@/lib/types';
import { useUsers } from '@/hooks/use-users';
import { useTeams } from '@/hooks/use-teams';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';

interface CreateProjectModalProps {
  children: React.ReactNode;
  onProjectCreate: (project: CreateProjectForm) => void;
}

interface TeamMember {
  id: string;
  user_id: number;
  name: string;
  role: string;
  email: string;
}

interface ProjectDocument {
  id: string;
  name: string;
  type: string;
  size: number;
}


export const CreateProjectModal = ({ children, onProjectCreate }: CreateProjectModalProps) => {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formKey, setFormKey] = useState(0);
  
  // Form data state
  const [formData, setFormData] = useState({
    title: '',
    type: undefined as ProjectType | undefined,
    client: '',
    description: '',
    objectives: '',
    budget: '',
    budgetDetails: {
      production: '',
      personnel: '',
      marketing: '',
      other: ''
    },
    deadline: undefined as Date | undefined,
    startDate: undefined as Date | undefined,
    priority: 'Normale' as ProjectPriority,
    status: 'Planification' as ProjectStatus,
    category: undefined as ProjectCategory | undefined,
    tags: [] as string[]
  });

  // Team management state
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [newMember, setNewMember] = useState({
    user_id: '',
    role: ''
  });
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [teamSelectionMode, setTeamSelectionMode] = useState<'individual' | 'team'>('individual');

  // Documents state
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [newTag, setNewTag] = useState('');
  
  // Popover states
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [deadlineOpen, setDeadlineOpen] = useState(false);

  // React Query hooks
  const { data: users, isLoading: usersLoading } = useUsers({
    is_active: true,
    ordering: 'first_name'
  });

  const { data: teams, isLoading: teamsLoading } = useTeams({
    is_active: true,
    ordering: 'name'
  });

  // Form options
  const projectTypes = ['Événementiel', 'Communication', 'Audiovisuel', 'Production', 'Digital', 'Conseil'];
  const priorities = ['Basse', 'Normale', 'Haute', 'Urgente'];
  const statuses = ['Planification', 'En cours', 'Production', 'En pause', 'Terminé'];
  const categories = ['Corporate', 'Marketing', 'Institutionnel', 'Commercial', 'Interne'];
  const memberRoles = ['Chef de projet', 'Designer', 'Développeur', 'Rédacteur', 'Consultant', 'Assistant'];

  const addTeamMember = () => {
    if (!newMember.user_id || !newMember.role) return;

    const selectedUser = users?.results?.find(user => user.id.toString() === newMember.user_id);
    if (!selectedUser) return;

    const member: TeamMember = {
      id: Date.now().toString(),
      user_id: selectedUser.id,
      name: `${selectedUser.first_name} ${selectedUser.last_name}`,
      role: newMember.role,
      email: selectedUser.email
    };

    setTeamMembers(prev => [...prev, member]);
    setNewMember({ user_id: '', role: '' });
  };

  const removeTeamMember = (id: string) => {
    setTeamMembers(prev => prev.filter(member => member.id !== id));
  };

  const handleTeamSelection = (teamId: string) => {
    setSelectedTeam(teamId);
    // Note: Team selection will need to be implemented when team members API is available
    // For now, we'll just set the selected team ID
  };

  const clearTeamSelection = () => {
    setSelectedTeam('');
    setTeamMembers([]);
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newDocs: ProjectDocument[] = Array.from(files).map((file, index) => ({
        id: Date.now().toString() + index,
        name: file.name,
        type: file.type,
        size: file.size
      }));
      setDocuments(prev => [...prev, ...newDocs]);
    }
  };

  const removeDocument = (id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const calculateTotalBudget = () => {
    const total = Object.values(formData.budgetDetails).reduce((sum, value) => {
      return sum + (parseFloat(value) || 0);
    }, 0);
    return total;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation côté frontend
    if (!formData.title.trim()) {
      alert('Le titre du projet est requis');
      return;
    }
    
    if (!formData.type) {
      alert('Le type de projet est requis');
      return;
    }
    
    if (!formData.client.trim()) {
      alert('Le client est requis');
      return;
    }
    
    if (!formData.deadline) {
      alert('La date d\'échéance est requise');
      return;
    }
    
    const totalBudget = formData.budget ? parseFloat(formData.budget) : calculateTotalBudget();
    
    // Format data for API
    const projectData: CreateProjectForm = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      objectives: formData.objectives?.trim() || undefined,
      type: formData.type || 'Communication',
      category: formData.category || undefined,
      status: formData.status,
      priority: formData.priority,
      start_date: formData.startDate ? format(formData.startDate, 'yyyy-MM-dd') : undefined,
      deadline: formData.deadline ? format(formData.deadline, 'yyyy-MM-dd') : '',
      budget: totalBudget.toString(),
      client: formData.client.trim(),
      tags: formData.tags.length > 0 ? formData.tags : undefined,
      budget_details: {
        production: (parseFloat(formData.budgetDetails.production) || 0).toString(),
        personnel: (parseFloat(formData.budgetDetails.personnel) || 0).toString(),
        marketing: (parseFloat(formData.budgetDetails.marketing) || 0).toString(),
        other: (parseFloat(formData.budgetDetails.other) || 0).toString(),
      },
      team_members: teamMembers.map(member => ({
        user_id: member.user_id,
        role: member.role as ProjectMemberRole
      })),
    };
    onProjectCreate(projectData);
    setOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      title: '',
      type: undefined,
      client: '',
      description: '',
      objectives: '',
      budget: '',
      budgetDetails: {
        production: '',
        personnel: '',
        marketing: '',
        other: ''
      },
      deadline: undefined,
      startDate: undefined,
      priority: 'Normale' as ProjectPriority,
      status: 'Planification' as ProjectStatus,
      category: undefined,
      tags: []
    });
    setTeamMembers([]);
    setDocuments([]);
    setSelectedTeam('');
    setTeamSelectionMode('individual');
    setStartDateOpen(false);
    setDeadlineOpen(false);
    setCurrentStep(1);
    setFormKey(prev => prev + 1);
  };

  const nextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, 4));
  };
  
  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Informations générales
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Titre du projet *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Ex: Lancement Produit TechCorp"
                  required
                />
              </div>

              <div>
                <Label htmlFor="client">Client *</Label>
                <Input
                  id="client"
                  value={formData.client}
                  onChange={(e) => setFormData(prev => ({ ...prev, client: e.target.value }))}
                  placeholder="Nom du client"
                  required
                />
              </div>

              <div>
                <Label htmlFor="type">Type de projet *</Label>
                <Select 
                  key={`type-select-${currentStep}`}
                  value={formData.type || ''} 
                  onValueChange={(value) => {
                    setFormData(prev => ({ ...prev, type: value as ProjectType }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un type" />
                  </SelectTrigger>
                  <SelectContent>
                    {projectTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.type && <p className="text-sm text-green-600 mt-1">Type sélectionné: {formData.type}</p>}
              </div>

              <div>
                <Label htmlFor="category">Catégorie</Label>
                <Select value={formData.category || ''} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value as ProjectCategory }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description du projet</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Description détaillée du projet"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="objectives">Objectifs du projet</Label>
              <Textarea
                id="objectives"
                value={formData.objectives}
                onChange={(e) => setFormData(prev => ({ ...prev, objectives: e.target.value }))}
                placeholder="Quels sont les objectifs principaux de ce projet ?"
                rows={3}
              />
            </div>

            {/* Tags */}
            <div>
              <Label>Tags du projet</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Ajouter un tag"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <Button type="button" onClick={addTag} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="px-2 py-1">
                    {tag}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="ml-1 h-4 w-4 p-0"
                      onClick={() => removeTag(tag)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Budget et paramètres
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Date de début</Label>
                <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.startDate ? format(formData.startDate, 'PPP', { locale: fr }) : 'Sélectionner une date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent 
                    className="w-auto p-0" 
                    style={{ zIndex: 9999, pointerEvents: 'auto' }}
                  >
                    <Calendar
                      mode="single"
                      selected={formData.startDate}
                      onSelect={(date) => {
                        setFormData(prev => ({ ...prev, startDate: date || undefined }));
                        setStartDateOpen(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label>Date d'échéance *</Label>
                <Popover open={deadlineOpen} onOpenChange={setDeadlineOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.deadline ? format(formData.deadline, 'PPP', { locale: fr }) : 'Sélectionner une date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent 
                    className="w-auto p-0" 
                    style={{ zIndex: 9999, pointerEvents: 'auto' }}
                  >
                    <Calendar
                       mode="single"
                       selected={formData.deadline}
                       onSelect={(date) => {
                         setFormData(prev => ({ ...prev, deadline: date || undefined }));
                         setDeadlineOpen(false);
                       }}
                       initialFocus
                     />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label htmlFor="priority">Priorité</Label>
                <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as ProjectPriority }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorities.map(priority => (
                      <SelectItem key={priority} value={priority}>{priority}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status">Statut initial</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as ProjectStatus }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map(status => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-medium mb-4">Budget du projet</h4>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="budget">Budget total (GNF)</Label>
                  <Input
                    id="budget"
                    type="number"
                    value={formData.budget}
                    onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                    placeholder="0"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="production">Production (GNF)</Label>
                    <Input
                      id="production"
                      type="number"
                      value={formData.budgetDetails.production}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        budgetDetails: { ...prev.budgetDetails, production: e.target.value }
                      }))}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="personnel">Personnel (GNF)</Label>
                    <Input
                      id="personnel"
                      type="number"
                      value={formData.budgetDetails.personnel}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        budgetDetails: { ...prev.budgetDetails, personnel: e.target.value }
                      }))}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="marketing">Marketing (GNF)</Label>
                    <Input
                      id="marketing"
                      type="number"
                      value={formData.budgetDetails.marketing}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        budgetDetails: { ...prev.budgetDetails, marketing: e.target.value }
                      }))}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="other">Autres (GNF)</Label>
                    <Input
                      id="other"
                      type="number"
                      value={formData.budgetDetails.other}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        budgetDetails: { ...prev.budgetDetails, other: e.target.value }
                      }))}
                      placeholder="0"
                    />
                  </div>
                </div>

                {calculateTotalBudget() > 0 && (
                  <Card className="p-3 bg-blue-50">
                    <p className="text-sm text-blue-700">
                      <strong>Total calculé: {calculateTotalBudget().toLocaleString()} GNF</strong>
                    </p>
                  </Card>
                )}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Équipe du projet
            </h3>

            {/* Mode de sélection */}
            <Card className="p-4">
              <h4 className="font-medium mb-4">Mode de sélection d'équipe</h4>
              <div className="flex gap-4 mb-4">
                <Button
                  type="button"
                  variant={teamSelectionMode === 'individual' ? 'default' : 'outline'}
                  onClick={() => setTeamSelectionMode('individual')}
                  className="flex-1"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Ajouter des membres individuellement
                </Button>
                <Button
                  type="button"
                  variant={teamSelectionMode === 'team' ? 'default' : 'outline'}
                  onClick={() => setTeamSelectionMode('team')}
                  className="flex-1"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Sélectionner une équipe existante
                </Button>
              </div>
            </Card>

            {teamSelectionMode === 'team' ? (
              /* Sélection d'équipe existante */
              <Card className="p-4">
                <h4 className="font-medium mb-3">Sélectionner une équipe existante</h4>
                <div className="space-y-3">
                  <Select value={selectedTeam} onValueChange={handleTeamSelection}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir une équipe existante" />
                    </SelectTrigger>
                    <SelectContent>
                      {teamsLoading ? (
                        <div className="flex items-center justify-center p-4">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Chargement des équipes...
                        </div>
                      ) : teams?.results?.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          Aucune équipe disponible
                        </div>
                      ) : (
                        teams?.results?.map(team => (
                          <SelectItem key={team.id} value={team.id.toString()}>
                            {team.name} ({team.member_count} membres)
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  
                  {selectedTeam && (
                    <div className="flex gap-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={clearTeamSelection}
                        size="sm"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Effacer la sélection
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ) : (
              /* Ajout de membres individuels */
              <Card className="p-4">
                <h4 className="font-medium mb-3">Ajouter un membre d'équipe</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <Select value={newMember.user_id} onValueChange={(value) => setNewMember(prev => ({ ...prev, user_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un utilisateur" />
                    </SelectTrigger>
                    <SelectContent>
                      {usersLoading ? (
                        <div className="flex items-center justify-center p-4">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Chargement des utilisateurs...
                        </div>
                      ) : users?.results?.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          Aucun utilisateur disponible
                        </div>
                      ) : (
                        users?.results?.map(user => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.first_name} {user.last_name} ({user.email})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <Select value={newMember.role} onValueChange={(value) => setNewMember(prev => ({ ...prev, role: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Rôle" />
                    </SelectTrigger>
                    <SelectContent>
                      {memberRoles.map(role => (
                        <SelectItem key={role} value={role}>{role}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  type="button" 
                  onClick={addTeamMember} 
                  className="w-full"
                  disabled={!newMember.user_id || !newMember.role}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter à l'équipe
                </Button>
              </Card>
            )}

            {teamMembers.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium">Membres de l'équipe ({teamMembers.length})</h4>
                {teamMembers.map(member => (
                  <Card key={member.id} className="p-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-gray-500">{member.role} • {member.email}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTeamMember(member.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Upload className="h-5 w-5 text-purple-600" />
              Documents initiaux
            </h3>

            <Card className="p-6">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <div>
                  <Label htmlFor="file-upload" className="cursor-pointer">
                    <span className="text-blue-600 hover:text-blue-700 font-medium">
                      Cliquez pour parcourir
                    </span>
                    <span className="text-gray-500"> ou glissez-déposez vos fichiers ici</span>
                  </Label>
                  <Input
                    id="file-upload"
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.gif"
                  />
                </div>
                <p className="text-sm text-gray-400 mt-2">
                  PDF, DOC, XLS, PPT, PNG, JPG jusqu'à 10MB par fichier
                </p>
              </div>
            </Card>

            {documents.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium">Documents ajoutés ({documents.length})</h4>
                {documents.map(doc => (
                  <Card key={doc.id} className="p-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded">
                          <FileText className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{doc.name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(doc.size)}</p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeDocument(doc.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-blue-900">
            Créer un nouveau projet
          </DialogTitle>
          <div className="flex items-center justify-center mt-4">
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step === currentStep 
                      ? 'bg-blue-600 text-white' 
                      : step < currentStep 
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                  }`}>
                    {step}
                  </div>
                  {step < 4 && <div className="w-12 h-px bg-gray-300 mx-2" />}
                </div>
              ))}
            </div>
          </div>
        </DialogHeader>
        
        <form key={formKey} onSubmit={handleSubmit} className="space-y-6">
          {renderStepContent()}

          <div className="flex justify-between pt-6 border-t">
            <div className="flex gap-2">
              {currentStep > 1 && (
                <Button type="button" variant="outline" onClick={prevStep}>
                  Précédent
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Annuler
              </Button>
              {currentStep < 4 ? (
                <Button type="button" onClick={nextStep} className="bg-blue-600 hover:bg-blue-700">
                  Suivant
                </Button>
              ) : (
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Créer le projet
                </Button>
              )}
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
