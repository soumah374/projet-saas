import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Upload, X, Plus, Users, DollarSign, FileText, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CreateProjectData } from '@/lib/api';

interface CreateProjectModalProps {
  children: React.ReactNode;
  onProjectCreate: (project: CreateProjectData) => void;
}

interface TeamMember {
  id: string;
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

export const CreateProjectModal = ({ children, onProjectCreate }: CreateProjectModalProps) => {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  // Form data state
  const [formData, setFormData] = useState({
    title: '',
    type: undefined as string | undefined,
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
    priority: 'Normale',
    status: 'Planification',
    category: undefined as string | undefined,
    tags: [] as string[]
  });

  // Team management state
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [newMember, setNewMember] = useState({
    name: '',
    role: '',
    email: ''
  });

  // Documents state
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [newTag, setNewTag] = useState('');

  // Form options
  const projectTypes = ['Événementiel', 'Communication', 'Audiovisuel', 'Production', 'Digital', 'Conseil'];
  const priorities = ['Basse', 'Normale', 'Haute', 'Urgente'];
  const statuses = ['Planification', 'En cours', 'Production', 'En pause', 'Terminé'];
  const categories = ['Corporate', 'Marketing', 'Institutionnel', 'Commercial', 'Interne'];
  const memberRoles = ['Chef de projet', 'Designer', 'Développeur', 'Rédacteur', 'Consultant', 'Assistant'];

  const addTeamMember = () => {
    if (newMember.name.trim() && newMember.role && newMember.email.trim()) {
      const member: TeamMember = {
        id: Date.now().toString(),
        name: newMember.name.trim(),
        role: newMember.role,
        email: newMember.email.trim()
      };
      setTeamMembers(prev => [...prev, member]);
      setNewMember({ name: '', role: '', email: '' });
    }
  };

  const removeTeamMember = (id: string) => {
    setTeamMembers(prev => prev.filter(m => m.id !== id));
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
      Array.from(files).forEach(file => {
        const doc: ProjectDocument = {
          id: Date.now().toString() + Math.random().toString(),
          name: file.name,
          type: file.type,
          size: file.size
        };
        setDocuments(prev => [...prev, doc]);
      });
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
    const projectData: CreateProjectData = {
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
        production: parseFloat(formData.budgetDetails.production) || 0,
        personnel: parseFloat(formData.budgetDetails.personnel) || 0,
        marketing: parseFloat(formData.budgetDetails.marketing) || 0,
        other: parseFloat(formData.budgetDetails.other) || 0,
      },
      // Note: team_members will be handled separately as it requires user IDs
      // For now, we'll create the project without team members
      // They can be added later through the project details page
    };
    onProjectCreate(projectData);
    setOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      title: '',
      type: '',
      client: '',
      description: '',
      objectives: '',
      budget: '',
      budgetDetails: { production: '', personnel: '', marketing: '', other: '' },
      deadline: undefined,
      startDate: undefined,
      priority: 'Normale',
      status: 'Planification',
      category: undefined,
      tags: []
    });
    setTeamMembers([]);
    setDocuments([]);
    setCurrentStep(1);
  };

  const nextStep = () => {
    console.log('Current formData before nextStep:', formData);
    setCurrentStep(prev => Math.min(prev + 1, 4));
  };
  
  const prevStep = () => {
    console.log('Current formData before prevStep:', formData);
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
    <div className="relative">
      <Label>{label}</Label>
      <div className="relative">
        <Input
          type="date"
          value={value ? format(value, 'yyyy-MM-dd') : ''}
          onChange={(e) => {
            const date = e.target.value ? new Date(e.target.value) : undefined;
            onChange(date);
          }}
          className="w-full pr-10"
          min={new Date().toISOString().split('T')[0]}
          required={required}
        />
        <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
      </div>
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
                <Select 
                  key={`type-select-${currentStep}`}
                  value={formData.type || ''} 
                  onValueChange={(value) => {
                    console.log('Type selected:', value);
                    console.log('Previous formData.type:', formData.type);
                    setFormData(prev => {
                      console.log('Setting type from', prev.type, 'to', value);
                      return { ...prev, type: value };
                    });
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
                <Select value={formData.category || ''} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
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
                <Label htmlFor="status">Statut initial</Label>
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

            <Card className="p-4">
              <h4 className="font-medium mb-3">Ajouter un membre d'équipe</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <Input
                  value={newMember.name}
                  onChange={(e) => setNewMember(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nom complet"
                />
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
                <Input
                  type="email"
                  value={newMember.email}
                  onChange={(e) => setNewMember(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Email"
                />
              </div>
              <Button type="button" onClick={addTeamMember} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter à l'équipe
              </Button>
            </Card>

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
