import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Edit, Loader2, User, Mail, Phone, Building, Calendar, Upload, Camera } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usersAPI } from '@/lib/api';
import { toast } from 'sonner';
import type { UserList, UserUpdate, UserProfileRole } from '@/lib/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface EditUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserList;
  onSuccess: () => void;
}

export const EditUserModal = ({ open, onOpenChange, user, onSuccess }: EditUserModalProps) => {
  const [formData, setFormData] = useState({
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

  // Initialize form data with user values
  useEffect(() => {
    if (user && open) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        profile: {
          role: user.profile.role,
          phone: user.profile.phone || '',
          bio: user.profile.bio || '',
          department: user.profile.department || '',
          position: user.profile.position || '',
          hire_date: user.profile.hire_date || '',
          is_active: user.profile.is_active
        }
      });
    }
  }, [user, open]);

  const updateUserMutation = useMutation({
    mutationFn: (userData: UserUpdate) => usersAPI.updateUser(user.id, userData),
    onSuccess: () => {
      toast.success('Utilisateur modifié avec succès');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onSuccess();
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la modification de l\'utilisateur');
      console.error('Error updating user:', error);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
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

    const userData: UserUpdate = {
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
        created_at: user.profile.created_at,
        updated_at: new Date().toISOString()
      }
    };

    updateUserMutation.mutate(userData);
  };

  const roles: UserProfileRole[] = [
    'Chef de projet', 
    'Designer', 
    'Développeur', 
    'Rédacteur', 
    'Consultant', 
    'Assistant', 
    'Managing Director', 
    'Finance/Admin'
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="w-5 h-5 text-blue-600" />
            Modifier l'utilisateur: {user.full_name}
          </DialogTitle>
          <DialogDescription>
            Modifiez les informations personnelles et professionnelles de l'utilisateur.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* User Avatar and Basic Info */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="relative">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={user.profile.avatar} />
                    <AvatarFallback className="text-lg">
                      {user.first_name[0]}{user.last_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full p-0"
                  >
                    <Camera className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{user.full_name}</h3>
                  <p className="text-gray-600">@{user.username}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={user.is_active ? "default" : "secondary"}>
                      {user.is_active ? 'Actif' : 'Inactif'}
                    </Badge>
                    <Badge variant="outline">
                      {user.project_count} projet{parseInt(user.project_count) > 1 ? 's' : ''}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                <div>
                  <strong>Créé le:</strong> {format(new Date(user.profile.created_at), 'PPP', { locale: fr })}
                </div>
                <div>
                  <strong>Dernière mise à jour:</strong> {format(new Date(user.profile.updated_at), 'PPP', { locale: fr })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informations personnelles */}
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
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Nom *</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                    required
                  />
                </div>
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
              disabled={updateUserMutation.isPending}
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={updateUserMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {updateUserMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Modification...
                </>
              ) : (
                <>
                  <Edit className="w-4 h-4 mr-2" />
                  Modifier l'utilisateur
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 