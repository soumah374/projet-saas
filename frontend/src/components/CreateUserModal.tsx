import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { UserPlus, Loader2, Upload, User, Mail, Phone, Building, MapPin, Calendar } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usersAPI } from '@/lib/api';
import { toast } from 'sonner';
import type { UserCreate, UserProfileRole } from '@/lib/types';

interface CreateUserModalProps {
  children: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const CreateUserModal = ({ children, open, onOpenChange, onSuccess }: CreateUserModalProps) => {
  const [formData, setFormData] = useState({
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    profile: {
      role: undefined as UserProfileRole | undefined,
      phone: '',
      bio: '',
      department: '',
      position: '',
      hire_date: '',
      is_active: true
    }
  });

  const queryClient = useQueryClient();

  const createUserMutation = useMutation({
    mutationFn: (userData: UserCreate) => usersAPI.createUser(userData),
    onSuccess: () => {
      toast.success('Utilisateur créé avec succès');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onSuccess();
      resetForm();
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la création de l\'utilisateur');
      console.error('Error creating user:', error);
    }
  });

  const resetForm = () => {
    setFormData({
      username: '',
      first_name: '',
      last_name: '',
      email: '',
      profile: {
        role: undefined,
        phone: '',
        bio: '',
        department: '',
        position: '',
        hire_date: '',
        is_active: true
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.username.trim()) {
      toast.error('Le nom d\'utilisateur est requis');
      return;
    }
    
    if (!formData.email.trim()) {
      toast.error('L\'email est requis');
      return;
    }
    
    if (!formData.first_name.trim()) {
      toast.error('Le prénom est requis');
      return;
    }
    
    if (!formData.last_name.trim()) {
      toast.error('Le nom est requis');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Format d\'email invalide');
      return;
    }

    const userData: UserCreate = {
      username: formData.username.trim(),
      first_name: formData.first_name.trim(),
      last_name: formData.last_name.trim(),
      email: formData.email.trim(),
      profile: {
        role: formData.profile.role,
        phone: formData.profile.phone.trim() || undefined,
        bio: formData.profile.bio.trim() || undefined,
        department: formData.profile.department.trim() || undefined,
        position: formData.profile.position.trim() || undefined,
        hire_date: formData.profile.hire_date || undefined,
        is_active: formData.profile.is_active,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    };

    createUserMutation.mutate(userData);
  };

  const roles: UserProfileRole[] = [
    "Managing Director",
    "Chef de projet",
    "Directeur de production",
    "Responsable communication",
    "Administrateur financier",
    "Assistant",
    "Consultant"
  ];

  const departments = [
    'Développement',
    'Design', 
    'Marketing',
    'Commercial',
    'Finance',
    'RH',
    'Direction'
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-600" />
            Créer un nouvel utilisateur
          </DialogTitle>
          <DialogDescription>
            Ajoutez un nouvel utilisateur au système avec ses informations personnelles et professionnelles.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations de base */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5" />
                Informations personnelles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">Prénom *</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                    placeholder="Jean"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Nom *</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                    placeholder="Dupont"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="username">Nom d'utilisateur *</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="jean.dupont"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  Utilisé pour la connexion au système
                </p>
              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="jean.dupont@sakom.com"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="phone">Téléphone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="phone"
                    value={formData.profile.phone}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      profile: { ...prev.profile, phone: e.target.value }
                    }))}
                    placeholder="+224 xxx xxx xxx"
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="bio">Bio / Description</Label>
                <Textarea
                  id="bio"
                  value={formData.profile.bio}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    profile: { ...prev.profile, bio: e.target.value }
                  }))}
                  placeholder="Description courte de l'utilisateur..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Informations professionnelles */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building className="w-5 h-5" />
                Informations professionnelles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="role">Rôle</Label>
                  <Select 
                    value={formData.profile.role || 'none'} 
                    onValueChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      profile: { ...prev.profile, role: value === 'none' ? undefined : value as UserProfileRole }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un rôle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucun rôle</SelectItem>
                      {roles.map(role => (
                        <SelectItem key={role} value={role}>{role}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="department">Département</Label>
                  <Select 
                    value={formData.profile.department || 'none'} 
                    onValueChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      profile: { ...prev.profile, department: value === 'none' ? '' : value }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un département" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucun département</SelectItem>
                      {departments.map(dept => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="position">Poste</Label>
                <Input
                  id="position"
                  value={formData.profile.position}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    profile: { ...prev.profile, position: e.target.value }
                  }))}
                  placeholder="Développeur Senior, Chef de projet..."
                />
              </div>

              <div>
                <Label htmlFor="hire_date">Date d'embauche</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="hire_date"
                    type="date"
                    value={formData.profile.hire_date}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      profile: { ...prev.profile, hire_date: e.target.value }
                    }))}
                    className="pl-10"
                  />
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="is_active" className="text-base font-medium">
                    Compte actif
                  </Label>
                  <p className="text-sm text-gray-500">
                    L'utilisateur peut se connecter et accéder au système
                  </p>
                </div>
                <Switch
                  id="is_active"
                  checked={formData.profile.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ 
                    ...prev, 
                    profile: { ...prev.profile, is_active: checked }
                  }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createUserMutation.isPending}
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={createUserMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {createUserMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Créer l'utilisateur
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 