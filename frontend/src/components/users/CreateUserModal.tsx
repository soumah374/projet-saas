import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from '@/components/ui/calendar';
import { UserPlus, Loader2, User, Mail, Phone, Building, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usersAPI } from '@/lib/api';
import { toast } from 'sonner';
import type { UserCreate } from '@/lib/types';
import { usePermissionManager } from '@/hooks/use-permission-manager';
import { useDepartments } from '@/hooks/use-departments';

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
    password: '',
    password_confirm: '',
    groups: [] as number[],
    profile: {
      phone: '',
      bio: '',
      department: '',
      position: '',
      hire_date: '',
      is_active: true
    }
  });

  const queryClient = useQueryClient();

  // Hooks pour récupérer les données depuis la base de données
  const { loadPermissionData } = usePermissionManager();
  const { departments: departmentsData, loading: isDepartmentsLoading } = useDepartments();

  // États pour les données dynamiques
  const [availableRoles, setAvailableRoles] = useState<any[]>([]);
  const [isRolesLoading, setIsRolesLoading] = useState(true);

  // Charger les groupes depuis le backend
  useEffect(() => {
    const loadRoles = async () => {
      setIsRolesLoading(true);
      try {
        const data = await loadPermissionData();
        setAvailableRoles(data.roles || []);
      } catch (error) {
        console.error('Erreur lors du chargement des groupes:', error);
        toast.error('Impossible de charger les groupes depuis le backend');
      } finally {
        setIsRolesLoading(false);
      }
    };

    loadRoles();
  }, [loadPermissionData]);

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
      password: '',
      password_confirm: '',
      groups: [],
      profile: {
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

    // Password validation
    if (!formData.password.trim()) {
      toast.error('Le mot de passe est requis');
      return;
    }

    if (formData.password.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    if (formData.password !== formData.password_confirm) {
      toast.error('Les mots de passe ne correspondent pas');
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
      password: formData.password,
      password_confirm: formData.password_confirm,
      groups: formData.groups,
      profile: {
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
                    placeholder="jean.dupont@project_saas.com"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="password">Mot de passe *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="••••••••"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Minimum 8 caractères
                  </p>
                </div>
                <div>
                  <Label htmlFor="password_confirm">Confirmer le mot de passe *</Label>
                  <Input
                    id="password_confirm"
                    type="password"
                    value={formData.password_confirm}
                    onChange={(e) => setFormData(prev => ({ ...prev, password_confirm: e.target.value }))}
                    placeholder="••••••••"
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
                  <Label htmlFor="groups">Groupes/Rôles</Label>
                  <Select 
                    value={formData.groups.length > 0 ? formData.groups[0].toString() : 'none'} 
                    onValueChange={(value) => {
                      if (value === 'none') {
                        setFormData(prev => ({ ...prev, groups: [] }));
                      } else {
                        const groupId = parseInt(value);
                        if (!formData.groups.includes(groupId)) {
                          setFormData(prev => ({ ...prev, groups: [...prev.groups, groupId] }));
                        }
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un groupe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucun groupe</SelectItem>
                      {isRolesLoading ? (
                        <SelectItem value="loading" disabled>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Chargement des groupes...
                        </SelectItem>
                      ) : availableRoles.length > 0 ? (
                        availableRoles.map((role: any) => (
                          <SelectItem key={role.id} value={role.id.toString()}>{role.name}</SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-roles" disabled>Aucun groupe disponible</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {formData.groups.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {formData.groups.map((groupId) => {
                        const group = availableRoles.find(r => r.id === groupId);
                        return group ? (
                          <div key={groupId} className="flex items-center gap-2 bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm">
                            <span>{group.name}</span>
                            <button
                              type="button"
                              onClick={() => setFormData(prev => ({ 
                                ...prev, 
                                groups: prev.groups.filter(id => id !== groupId) 
                              }))}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              ×
                            </button>
                          </div>
                        ) : null;
                      })}
                    </div>
                  )}
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
                      {isDepartmentsLoading ? (
                        <SelectItem value="loading" disabled>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Chargement des départements...
                        </SelectItem>
                      ) : departmentsData && departmentsData.length > 0 ? (
                        departmentsData.map((dept: any) => (
                          <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-depts" disabled>Aucun département disponible</SelectItem>
                      )}
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
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {formData.profile.hire_date ? (
                        format(new Date(formData.profile.hire_date), 'PPP', { locale: fr })
                      ) : (
                        <span className="text-muted-foreground">Sélectionner une date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarIcon
                      mode="single"
                      selected={formData.profile.hire_date ? new Date(formData.profile.hire_date) : undefined}
                      onSelect={(date) => setFormData(prev => ({ 
                        ...prev, 
                        profile: { ...prev.profile, hire_date: date ? date.toISOString().split('T')[0] : '' }
                      }))}
                      disabled={(date) => date > new Date()}
                      initialFocus
                      locale={fr}
                    />
                  </PopoverContent>
                </Popover>
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
              className="bg-blue-600 hover:bg-blue-600"
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