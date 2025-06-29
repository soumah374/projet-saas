import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Upload, X, Plus, Users, DollarSign, FileText, Calendar, Loader2, Edit, UserPlus } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Project, UpdateProjectData } from '@/lib/api';
import { useUsers } from '@/hooks/use-users';
import { useTeams } from '@/hooks/use-teams';

interface EditProjectModalProps {
  children: React.ReactNode;
  project: Project;
  onProjectUpdate: (projectId: string, data: UpdateProjectData) => void;
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

// Custom styles for date inputs
const dateInputStyles = `
  input[type="date"]::-webkit-calendar-picker-indicator {
    background: transparent;
    bottom: 0;
    color: transparent;
    cursor: pointer;
    height: auto;
    left: 0;
    position: absolute;
    right: 0;
    top: 0;
    width: auto;
  }
  
  input[type="date"]::-webkit-datetime-edit {
    padding: 0;
  }
  
  input[type="date"]::-webkit-datetime-edit-fields-wrapper {
    padding: 0;
  }
  
  input[type="date"]::-webkit-datetime-edit-text {
    padding: 0 2px;
  }
  
  input[type="date"]::-webkit-datetime-edit-month-field,
  input[type="date"]::-webkit-datetime-edit-day-field,
  input[type="date"]::-webkit-datetime-edit-year-field {
    padding: 0 2px;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = dateInputStyles;
  document.head.appendChild(style);
}

export const EditProjectModal = ({ children, project, onProjectUpdate }: EditProjectModalProps) => {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  // Form data state
  const [formData, setFormData] = useState({
    title: project.title,
    type: project.type,
    client: project.client,
    description: project.description,
    objectives: project.objectives || '',
    budget: project.budget || '',
    budgetDetails: {
      production: project.budget_details?.production?.toString() || '',
      personnel: project.budget_details?.personnel?.toString() || '',
      marketing: project.budget_details?.marketing?.toString() || '',
      other: project.budget_details?.other?.toString() || ''
    },
    deadline: project.deadline ? new Date(project.deadline) : undefined,
    startDate: project.start_date ? new Date(project.start_date) : undefined,
    priority: project.priority,
    status: project.status,
    category: project.category || '',
    tags: project.tags || []
  });

  // Team management state
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(
    project.team_members?.map(member => ({
      id: member.id.toString(),
      user_id: member.user.id,
      name: `${member.user.first_name} ${member.user.last_name}`,
      role: member.role,
      email: member.user.email
    })) || []
  );
  const [newMember, setNewMember] = useState({
    user_id: '',
    role: ''
  });
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [teamSelectionMode, setTeamSelectionMode] = useState<'individual' | 'team'>('individual');

  // Documents state
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [newTag, setNewTag] = useState('');

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
  const memberRoles = ['Chef de projet', 'Designer', 'Développeur', 'Développeur Senior', 'Rédacteur', 'Consultant', 'Assistant'];

  const addTeamMember = () => {
    if (!newMember.user_id || !newMember.role) return;

    const selectedUser = users?.find(user => user.id.toString() === newMember.user_id);
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
    if (teamId) {
      const selectedTeamData = teams?.find(team => team.id.toString() === teamId);
      if (selectedTeamData && selectedTeamData.team_members) {
        const teamMembersFromTeam = selectedTeamData.team_members.map(member => ({
          id: member.id.toString(),
          user_id: member.user.id,
          name: `${member.user.first_name} ${member.user.last_name}`,
          role: member.role,
          email: member.user.email
        }));
        setTeamMembers(teamMembersFromTeam);
      }
    }
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
    const projectData: UpdateProjectData = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      objectives: formData.objectives?.trim() || undefined,
      type: formData.type,
      category: formData.category || undefined,
      status: formData.status,
      priority: formData.priority,
      start_date: formData.startDate ? format(formData.startDate, 'yyyy-MM-dd') : undefined,
      deadline: formData.deadline ? format(formData.deadline, 'yyyy-MM-dd') : '',
      budget: totalBudget.toString(),
      client: formData.client.trim(),
      tags: formData.tags.length > 0 ? formData.tags : undefined,
      budget_details: {
        production: parseFloat(formData.budgetDetails.production) || 0,
        personnel: parseFloat(formData.budgetDetails.personnel) || 0,
        marketing: parseFloat(formData.budgetDetails.marketing) || 0,
        other: parseFloat(formData.budgetDetails.other) || 0,
      },
      team_members: teamMembers.map(member => ({
        user_id: member.user_id,
        role: member.role
      })),
    };

    onProjectUpdate(project.id, projectData);
    setOpen(false);
  };

  const resetForm = () => {
    setFormData({
      title: project.title,
      type: project.type,
      client: project.client,
      description: project.description,
      objectives: project.objectives || '',
      budget: project.budget || '',
      budgetDetails: {
        production: project.budget_details?.production?.toString() || '',
        personnel: project.budget_details?.personnel?.toString() || '',
        marketing: project.budget_details?.marketing?.toString() || '',
        other: project.budget_details?.other?.toString() || ''
      },
      deadline: project.deadline ? new Date(project.deadline) : undefined,
      startDate: project.start_date ? new Date(project.start_date) : undefined,
      priority: project.priority,
      status: project.status,
      category: project.category || '',
      tags: project.tags || []
    });
    setTeamMembers(
      project.team_members?.map(member => ({
        id: member.id.toString(),
        user_id: member.user.id,
        name: `${member.user.first_name} ${member.user.last_name}`,
        role: member.role,
        email: member.user.email
      })) || []
    );
    setDocuments([]);
    setCurrentStep(1);
  };

  const nextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, 4));
  };
  
  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // Styled Date Input Component
  const StyledDateInput = ({ 
    value, 
    onChange, 
    label, 
    placeholder, 
    required = false 
  }: {
    value: Date | undefined;
    onChange: (date: Date | undefined) => void;
    label: string;
    placeholder: string;
    required?: boolean;
  }) => (
    <div className="space-y-2">
      <Label htmlFor={label.toLowerCase().replace(/\s+/g, '-')}>
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <Input
        id={label.toLowerCase().replace(/\s+/g, '-')}
        type="date"
        value={value ? value.toISOString().split('T')[0] : ''}
        onChange={(e) => onChange(e.target.value ? new Date(e.target.value) : undefined)}
        required={required}
        className="w-full"
      />
    </div>
  );

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
                <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un type" />
                  </SelectTrigger>
                  <SelectContent>
                    {projectTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="category">Catégorie</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
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
              <StyledDateInput
                value={formData.startDate}
                onChange={(date) => setFormData(prev => ({ ...prev, startDate: date }))}
                label="Date de début"
                placeholder="Sélectionnez la date de début"
              />

              <StyledDateInput
                value={formData.deadline}
                onChange={(date) => setFormData(prev => ({ ...prev, deadline: date }))}
                label="Date d'échéance *"
                placeholder="Sélectionnez la date d'échéance"
                required
              />

              <div>
                <Label htmlFor="priority">Priorité</Label>
                <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
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
                <Label htmlFor="status">Statut</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
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
                      ) : teams?.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          Aucune équipe disponible
                        </div>
                      ) : (
                        teams?.map(team => (
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
                      ) : users?.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          Aucun utilisateur disponible
                        </div>
                      ) : (
                        users?.map(user => (
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
              Documents du projet
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
            Modifier le projet
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
        
        <form onSubmit={handleSubmit} className="space-y-6">
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
                  <Edit className="h-4 w-4 mr-2" />
                  Mettre à jour le projet
                </Button>
              )}
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 