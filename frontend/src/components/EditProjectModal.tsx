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
import { Edit, X, Plus, Users, DollarSign, FileText, Loader2, UserPlus } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { 
  Project,
  CreateProjectForm, 
  ProjectType, 
  ProjectCategory, 
  ProjectStatus, 
  ProjectPriority, 
  ProjectMemberRole,
  User,
  Team
} from '@/lib/types';
import { useUsers } from '@/hooks/use-users';
import { useTeams } from '@/hooks/use-teams';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import type { ExtendedProject } from '@/lib/types';
import { cn } from '@/lib/utils';

interface EditProjectModalProps {
  children: React.ReactNode;
  project: ExtendedProject;
  onProjectUpdate: (projectId: string, data: Partial<CreateProjectForm>) => void;
}

interface TeamMember {
  id: string;
  user_id: number;
  name: string;
  role: string;
  email: string;
}

// Custom styles for date inputs and calendar
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

  /* Calendar component styles */
  .rdp-day {
    cursor: pointer !important;
  }
  
  .rdp-day:hover {
    cursor: pointer !important;
  }
  
  .rdp-day_button {
    cursor: pointer !important;
  }
  
  .rdp-day_button:hover {
    cursor: pointer !important;
  }
  
  .rdp-nav_button {
    cursor: pointer !important;
  }
  
  .rdp-nav_button:hover {
    cursor: pointer !important;
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
  const [isLoading, setIsLoading] = useState(false);
  const [formKey, setFormKey] = useState(0);
  
  // Form data state
  const [formData, setFormData] = useState({
    title: project.title || '',
    type: project.type as ProjectType,
    client: project.client || '',
    description: project.description || '',
    objectives: project.objectives || '',
    budget: project.budget || '',
    budgetDetails: {
      production: project.budget_details?.production || '',
      personnel: project.budget_details?.personnel || '',
      marketing: project.budget_details?.marketing || '',
      other: project.budget_details?.other || ''
    },
    deadline: project.deadline ? parseISO(project.deadline) : undefined,
    startDate: project.start_date ? parseISO(project.start_date) : undefined,
    priority: project.priority as ProjectPriority,
    status: project.status as ProjectStatus,
    category: project.category as ProjectCategory,
    tags: Array.isArray(project.tags) ? project.tags : []
  });

  // Team management state
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [newMember, setNewMember] = useState({
    user_id: '',
    role: ''
  });
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [teamSelectionMode, setTeamSelectionMode] = useState<'individual' | 'team'>('individual');

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
  const projectTypes = ['Externe', 'Interne'] as const;
  const priorities = ['Basse', 'Normale', 'Haute', 'Urgente'] as const;
  const statuses = ['Prospection', 'Devis', 'Production', 'Livraison', 'Terminé'] as const;
  const categories = ['Corporate', 'Marketing', 'Institutionnel', 'Commercial', 'Interne'] as const;
  const memberRoles = ['Chef de projet', 'Designer', 'Développeur', 'Rédacteur', 'Consultant', 'Assistant'] as const;

  // Initialize form data with project values
  useEffect(() => {
    if (project && open) {
      setFormData({
        title: project.title || '',
        type: project.type as ProjectType,
        client: project.client || '',
        description: project.description || '',
        objectives: project.objectives || '',
        budget: project.budget || '',
        budgetDetails: {
          production: project.budget_details?.production || '',
          personnel: project.budget_details?.personnel || '',
          marketing: project.budget_details?.marketing || '',
          other: project.budget_details?.other || ''
        },
        deadline: project.deadline ? parseISO(project.deadline) : undefined,
        startDate: project.start_date ? parseISO(project.start_date) : undefined,
        priority: project.priority as ProjectPriority,
        status: project.status as ProjectStatus,
        category: project.category as ProjectCategory,
        tags: Array.isArray(project.tags) ? project.tags : []
      });

      // Initialize team members
      const existingMembers: TeamMember[] = project.team_members?.map(member => ({
        id: member.id.toString(),
        user_id: member.user.id,
        name: `${member.user.first_name} ${member.user.last_name}`,
        role: member.role,
        email: member.user.email
      })) || [];
      setTeamMembers(existingMembers);
    }
  }, [project, open]);

  const addTeamMember = () => {
    if (!newMember.user_id || !newMember.role) return;

    const selectedUser = users?.results?.find(user => user.id.toString() === newMember.user_id);
    if (!selectedUser) return;

    // Check if user is already in team
    if (teamMembers.some(member => member.user_id === selectedUser.id)) {
      alert('Cet utilisateur fait déjà partie de l\'équipe');
      return;
    }

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

  const calculateTotalBudget = () => {
    const total = Object.values(formData.budgetDetails).reduce((sum, value) => {
      return sum + (parseFloat(value) || 0);
    }, 0);
    return total;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validation finale
      if (!formData.title.trim()) {
        alert('Le titre du projet est requis');
        setCurrentStep(1);
        setIsLoading(false);
        return;
      }
      
      if (!formData.type) {
        alert('Le type de projet est requis');
        setCurrentStep(1);
        setIsLoading(false);
        return;
      }
      
      if (!formData.client.trim()) {
        alert('Le client est requis');
        setCurrentStep(1);
        setIsLoading(false);
        return;
      }
      
      if (!formData.deadline) {
        alert('La date d\'échéance est requise');
        setCurrentStep(2);
        setIsLoading(false);
        return;
      }

      if (teamMembers.length === 0) {
        alert('Veuillez ajouter au moins un membre à l\'équipe');
        setCurrentStep(3);
        setIsLoading(false);
        return;
      }
      
      const totalBudget = formData.budget ? parseFloat(formData.budget) : calculateTotalBudget();
      
      // Format data for API
      const projectData: Partial<CreateProjectForm> = {
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

      await onProjectUpdate(project.id, projectData);
      setOpen(false);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du projet:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    // Reset to original project values
    if (project) {
      setFormData({
        title: project.title || '',
        type: project.type as ProjectType,
        client: project.client || '',
        description: project.description || '',
        objectives: project.objectives || '',
        budget: project.budget || '',
        budgetDetails: {
          production: project.budget_details?.production || '',
          personnel: project.budget_details?.personnel || '',
          marketing: project.budget_details?.marketing || '',
          other: project.budget_details?.other || ''
        },
        deadline: project.deadline ? parseISO(project.deadline) : undefined,
        startDate: project.start_date ? parseISO(project.start_date) : undefined,
        priority: project.priority as ProjectPriority,
        status: project.status as ProjectStatus,
        category: project.category as ProjectCategory,
        tags: Array.isArray(project.tags) ? project.tags : []
      });

      const existingMembers: TeamMember[] = project.team_members?.map(member => ({
        id: member.id.toString(),
        user_id: member.user.id,
        name: `${member.user.first_name} ${member.user.last_name}`,
        role: member.role,
        email: member.user.email
      })) || [];
      setTeamMembers(existingMembers);
    }
    
    setSelectedTeam('');
    setTeamSelectionMode('individual');
    setStartDateOpen(false);
    setDeadlineOpen(false);
    setCurrentStep(1);
    setFormKey(prev => prev + 1);
  };

  const nextStep = () => {
    if (currentStep < 3) {
      // Validation avant de passer à l'étape suivante
      if (currentStep === 1) {
        if (!formData.title.trim() || !formData.type || !formData.client.trim()) {
          alert('Veuillez remplir tous les champs obligatoires (*)');
          return;
        }
      } else if (currentStep === 2) {
        if (!formData.deadline) {
          alert('La date d\'échéance est requise');
          return;
        }
      }
      setCurrentStep(prev => prev + 1);
    }
  };
  
  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const getStepTitle = (step: number) => {
    switch (step) {
      case 1:
        return "Informations générales";
      case 2:
        return "Budget et paramètres";
      case 3:
        return "Équipe du projet";
      default:
        return "";
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              {getStepTitle(currentStep)}
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
              {getStepTitle(currentStep)}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Date de début</Label>
                <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.startDate ? format(formData.startDate, 'PPP', { locale: fr }) : 'Sélectionner une date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent 
                    className="w-auto p-0" 
                    align="start"
                    side="bottom"
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
                      type="button"
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.deadline ? format(formData.deadline, 'PPP', { locale: fr }) : 'Sélectionner une date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent 
                    className="w-auto p-0"
                    align="start"
                    side="bottom"
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
                <Label htmlFor="status">Statut</Label>
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
              {getStepTitle(currentStep)}
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

      default:
        return null;
    }
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={(newOpen) => {
        // Empêcher la fermeture si on est en train de sélectionner une date
        if (!newOpen && (startDateOpen || deadlineOpen)) {
          return;
        }
        setOpen(newOpen);
        if (!newOpen) {
          resetForm();
        }
      }}
      modal={true}
    >
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent 
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
        onPointerDownOutside={(e) => {
          // Empêcher la fermeture si on clique sur un popover
          if (startDateOpen || deadlineOpen) {
            e.preventDefault();
          }
        }}
        onEscapeKeyDown={(e) => {
          // Empêcher la fermeture par la touche Escape si un popover est ouvert
          if (startDateOpen || deadlineOpen) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-blue-900">
            Modifier le projet: {project?.title}
          </DialogTitle>
          <div className="flex items-center justify-center mt-4">
            <div className="flex items-center space-x-2">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step === currentStep 
                        ? 'bg-blue-600 text-white' 
                        : step < currentStep 
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-200 text-gray-600'
                    }`}>
                      {step < currentStep ? '✓' : step}
                    </div>
                    <span className="text-xs mt-1 text-gray-600 whitespace-nowrap">
                      {getStepTitle(step)}
                    </span>
                  </div>
                  {step < 3 && <div className={`w-12 h-px mx-2 ${
                    step < currentStep ? 'bg-green-600' : 'bg-gray-300'
                  }`} />}
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
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
                Annuler
              </Button>
              {currentStep < 3 ? (
                <Button type="button" onClick={nextStep} className="bg-blue-600 hover:bg-blue-700">
                  Suivant
                </Button>
              ) : ''}
              {currentStep === 3 && (
                <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Mise à jour...
                    </>
                  ) : (
                    <>
                      <Edit className="w-4 h-4 mr-2" />
                      Mettre à jour
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 