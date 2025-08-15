import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { ArrowLeft, Users, Shield, Edit, Trash2, UserPlus, ChevronRight, ChevronLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePermissionManager } from '@/hooks/use-permission-manager';

interface RoleDetails {
  id: number;
  name: string;
  user_count: number;
}

interface RoleUser {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  is_active: boolean;
}

interface RolePermissions {
  role: string;
  permissions: string[];
  module_permissions: {
    [key: string]: {
      view: boolean;
      add: boolean;
      change: boolean;
      delete: boolean;
    };
  };
}

export default function RoleDetailsPage() {
  const { roleId } = useParams<{ roleId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    isLoading,
    loadPermissionData,
    updateRolePermissions,
    updateRole,
    deleteRole,
    assignUserToRole,
    removeUserFromRole,
    getAllUsers,
    getUsersByGroup,
    assignPermissionToRole,
    removePermissionFromRole
  } = usePermissionManager();

  const [role, setRole] = useState<RoleDetails | null>(null);
  const [roleUsers, setRoleUsers] = useState<RoleUser[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermissions | null>(null);
  const [allUsers, setAllUsers] = useState<RoleUser[]>([]);
  const [allPermissions, setAllPermissions] = useState<any[]>([]);
  const [availableFilter, setAvailableFilter] = useState('');
  const [chosenFilter, setChosenFilter] = useState('');
  const [selectedAvailable, setSelectedAvailable] = useState<string[]>([]);
  const [selectedChosen, setSelectedChosen] = useState<string[]>([]);
  
  // États pour les modales
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAssignUserDialogOpen, setIsAssignUserDialogOpen] = useState(false);
  const [isRemoveUserDialogOpen, setIsRemoveUserDialogOpen] = useState(false);
  
  // États pour l'édition
  const [editRoleName, setEditRoleName] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [userToRemove, setUserToRemove] = useState<RoleUser | null>(null);

 

  useEffect(() => {
    if (roleId) {
      loadRoleDetails();
      loadAllUsers();
    }
  }, [roleId]);

    const loadRoleDetails = async () => {
    if (!roleId) return;

    try {
      // Charger les données de permissions pour obtenir les rôles
      const data = await loadPermissionData();
            
      // Trouver le rôle spécifique
      const roleData = data.roles.find((r: any) => r.id === parseInt(roleId));
      if (!roleData) {
        toast({
          title: "Erreur",
          description: "Rôle non trouvé",
          variant: "destructive"
        });
        // navigate('/permissions');
        return;
      }
      
      setRole(roleData);
      setEditRoleName(roleData.name);
      setAllPermissions(data.permissions || []);
      
      // Trouver les permissions du rôle
      const rolePerms = data.rolePermissions.find((rp: any) => rp.role === roleData.name);
      setRolePermissions(rolePerms || null);
      
      // Charger les utilisateurs du groupe/rôle
      const users = await getUsersByGroup(parseInt(roleId));
      setRoleUsers(users);
      
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les détails du rôle",
        variant: "destructive"
      });
    }
  };

  const loadAllUsers = async () => {
    try {
      const users = await getAllUsers();
      // Filtrer les utilisateurs qui ne sont pas déjà assignés au rôle
      // S'assurer que roleUsers est un tableau avant d'utiliser some
      const currentRoleUsers = Array.isArray(roleUsers) ? roleUsers : [];
      const availableUsers = users.filter(user => 
        !currentRoleUsers.some(roleUser => roleUser.id === user.id)
      );
      
      setAllUsers(availableUsers);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger la liste des utilisateurs",
        variant: "destructive"
      });
    }
  };

  const loadUsersByGroup = async () => {
    if (!roleId) return;
    try {
      const users = await getUsersByGroup(parseInt(roleId));
      setRoleUsers(users);
      toast({
        title: "Succès",
        description: "Liste des utilisateurs du groupe actualisée"
      });
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs du groupe:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les utilisateurs du groupe",
        variant: "destructive"
      });
    }
  };

  const handleUpdateRole = async () => {
    if (!role || !editRoleName.trim()) return;

    const success = await updateRole(role.id, editRoleName);
    if (success) {
      setRole({ ...role, name: editRoleName });
      setIsEditDialogOpen(false);
      toast({
        title: "Succès",
        description: "Rôle mis à jour avec succès"
      });
    }
  };

  const handleDeleteRole = async () => {
    if (!role) return;

    const success = await deleteRole(role.id);
    if (success) {
      toast({
        title: "Succès",
        description: "Rôle supprimé avec succès"
      });
      navigate('/permissions');
    }
  };

  const handleUpdatePermission = async (moduleName: string, permissionType: string, value: boolean) => {
    if (!role) return;

    const success = await updateRolePermissions(role.id, role.name, moduleName, permissionType, value);
    if (success) {
      // Mettre à jour l'état local des permissions au lieu de recharger tout
      if (rolePermissions) {
        const updatedRolePermissions = {
          ...rolePermissions,
          module_permissions: {
            ...rolePermissions.module_permissions,
            [moduleName]: {
              view: false,
              add: false,
              change: false,
              delete: false,
              ...rolePermissions.module_permissions[moduleName],
              [permissionType]: value
            }
          }
        };
        setRolePermissions(updatedRolePermissions);
      } else {
        // Si pas de permissions existantes, créer la structure
        setRolePermissions({
          role: role.name,
          permissions: [],
          module_permissions: {
            [moduleName]: {
              view: permissionType === 'view' ? value : false,
              add: permissionType === 'add' ? value : false,
              change: permissionType === 'change' ? value : false,
              delete: permissionType === 'delete' ? value : false
            }
          }
        });
      }
      
      toast({
        title: "Succès",
        description: `Permission ${permissionType} ${value ? 'activée' : 'désactivée'} pour ${moduleName}`
      });
    }
  };

  const handleAssignUser = async () => {
    if (!selectedUserId || !role || selectedUserId === 'no-users-available') return;

    const success = await assignUserToRole(parseInt(selectedUserId), role.name);
   
    if (success) {
      setSelectedUserId('');
      setIsAssignUserDialogOpen(false);
      loadUsersByGroup();
      loadAllUsers();
      loadRoleDetails();

      toast({
        title: "Succès",
        description: "Utilisateur assigné au groupe avec succès"
      });
    }
  };

  const handleRemoveUser = async (userId: number) => {
    if (!role) return;

    // Trouver l'utilisateur pour afficher son nom dans la confirmation
    const currentRoleUsers = Array.isArray(roleUsers) ? roleUsers : [];
    const user = currentRoleUsers.find(u => u.id === userId);
    
    if (user) {
      setUserToRemove(user);
      setIsRemoveUserDialogOpen(true);
      loadAllUsers();
    }
  };

  const confirmRemoveUser = async () => {
    if (!userToRemove || !role) return;

    const success = await removeUserFromRole(userToRemove.id, role.name);
    if (success) {
      loadUsersByGroup();
      loadAllUsers();
      loadRoleDetails();

      toast({
        title: "Succès",
        description: `${userToRemove.first_name} ${userToRemove.last_name} retiré du groupe avec succès`
      });
    }

    // Fermer le modal et réinitialiser
    setIsRemoveUserDialogOpen(false);
    setUserToRemove(null);
  };

  const chosenFullNames = rolePermissions?.permissions || [];

  const displayLabel = (p: any) => {
    const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');
    return `${cap(p.app_label)} | ${cap(p.model)} | ${p.name}`;
  };

  const filteredAvailable = allPermissions
    .filter((p) => !chosenFullNames.includes(p.full_name))
    .filter((p) => displayLabel(p).toLowerCase().includes(availableFilter.toLowerCase()));

  const filteredChosen = allPermissions
    .filter((p) => chosenFullNames.includes(p.full_name))
    .filter((p) => displayLabel(p).toLowerCase().includes(chosenFilter.toLowerCase()));

  const addSelectedPermissions = async () => {
    if (!role) return;
    const toAdd = selectedAvailable;
    if (toAdd.length === 0) return;
    await Promise.all(toAdd.map((fullName) => assignPermissionToRole(role.id, fullName)));
    setSelectedAvailable([]);
    await loadRoleDetails();
  };

  const removeSelectedPermissions = async () => {
    if (!role) return;
    const toRemoveFullNames = selectedChosen;
    if (toRemoveFullNames.length === 0) return;
    const idByFullName: Record<string, number> = {};
    allPermissions.forEach((p: any) => { idByFullName[p.full_name] = p.id; });
    const toRemoveIds = toRemoveFullNames.map((fn) => idByFullName[fn]).filter(Boolean);
    await Promise.all(toRemoveIds.map((pid) => removePermissionFromRole(role.id, pid)));
    setSelectedChosen([]);
    await loadRoleDetails();
  };

  const addAll = async () => {
    if (!role) return;
    const toAdd = filteredAvailable.map((p) => p.full_name);
    await Promise.all(toAdd.map((fullName) => assignPermissionToRole(role.id, fullName)));
    setSelectedAvailable([]);
    await loadRoleDetails();
  };

  const removeAll = async () => {
    if (!role) return;
    const idByFullName: Record<string, number> = {};
    allPermissions.forEach((p: any) => { idByFullName[p.full_name] = p.id; });
    const toRemoveIds = filteredChosen.map((p) => idByFullName[p.full_name]).filter(Boolean);
    await Promise.all(toRemoveIds.map((pid) => removePermissionFromRole(role.id, pid)));
    setSelectedChosen([]);
    await loadRoleDetails();
  };

  if (isLoading || !role) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => navigate('/permissions')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Shield className="h-8 w-8" />
              {role.name}
            </h1>
            <p className="text-muted-foreground">
              Gérez les détails et permissions de ce rôle
            </p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Éditer
          </Button>
          <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
            <Trash2 className="h-4 w-4 mr-2" />
            Supprimer
          </Button>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ID du Rôle</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">#{role.id}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilisateurs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{role.user_count}</div>
            <p className="text-xs text-muted-foreground">
              utilisateur(s) assigné(s)
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Permissions</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {rolePermissions ? Object.values(rolePermissions.module_permissions).reduce((acc, module) => {
                return acc + Object.values(module).filter(Boolean).length;
              }, 0) : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              permission(s) active(s)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Contenu principal avec onglets */}
      <Tabs defaultValue="permissions" className="space-y-6">
        <TabsList>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
        </TabsList>

        <TabsContent value="permissions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Permissions du Rôle</CardTitle>
              <CardDescription>
                Configurez les permissions pour ce rôle par module
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Gestion style "double liste" */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 border rounded bg-muted/20">
                  <div className="lg:col-span-1">
                    <Label>permissions disponible(s)</Label>
                    <Input
                      placeholder="Filtrer"
                      className="my-2"
                      value={availableFilter}
                      onChange={(e) => setAvailableFilter(e.target.value)}
                    />
                    <select
                      multiple
                      className="w-full h-64 p-2 bg-background border rounded"
                      value={selectedAvailable}
                      onChange={(e) => {
                        const values = Array.from(e.target.selectedOptions).map((o) => o.value);
                        setSelectedAvailable(values);
                      }}
                    >
                      {filteredAvailable.map((p: any) => (
                        <option key={`avail-${p.id}`} value={p.full_name}>
                          {displayLabel(p)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col items-center justify-center gap-2">
                    <Button variant="secondary" onClick={addSelectedPermissions} disabled={selectedAvailable.length === 0}>
                      <ChevronRight className="w-4 h-4 mr-2" />
                      Ajouter
                    </Button>
                    <Button variant="secondary" onClick={removeSelectedPermissions} disabled={selectedChosen.length === 0}>
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Retirer
                    </Button>
                  </div>

                  <div className="lg:col-span-1">
                    <Label>Choix des « permissions »</Label>
                    <Input
                      placeholder="Filtrer"
                      className="my-2"
                      value={chosenFilter}
                      onChange={(e) => setChosenFilter(e.target.value)}
                    />
                    <select
                      multiple
                      className="w-full h-64 p-2 bg-background border rounded"
                      value={selectedChosen}
                      onChange={(e) => {
                        const values = Array.from(e.target.selectedOptions).map((o) => o.value);
                        setSelectedChosen(values);
                      }}
                    >
                      {filteredChosen.map((p: any) => (
                        <option key={`chosen-${p.id}`} value={p.full_name}>
                          {displayLabel(p)}
                        </option>
                      ))}
                    </select>
                    <div className="flex items-center justify-between text-sm text-muted-foreground mt-2">
                      <Button variant="ghost" size="sm" onClick={addAll}>Tout choisir</Button>
                      <Button variant="ghost" size="sm" onClick={removeAll}>Tout enlever</Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Utilisateurs du Rôle</CardTitle>
                  <CardDescription>
                    Gérez les utilisateurs assignés à ce groupe ({Array.isArray(roleUsers) ? roleUsers.length : 0} utilisateur{(Array.isArray(roleUsers) ? roleUsers.length : 0) !== 1 ? 's' : ''})
                  </CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button onClick={() => {
                    setIsAssignUserDialogOpen(true);
                    loadAllUsers(); // Recharger les utilisateurs disponibles
                  }}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Assigner Utilisateur
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>

              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.isArray(roleUsers) && roleUsers.length > 0 ? roleUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">
                              {user.first_name?.charAt(0)}{user.last_name?.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium">
                              {user.first_name} {user.last_name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              @{user.username}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={user.is_active ? "default" : "secondary"}>
                          {user.is_active ? "Actif" : "Inactif"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveUser(user.id)}
                        >
                          Retirer
                        </Button>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        Aucun utilisateur assigné à ce groupe
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogue d'édition */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le Rôle</DialogTitle>
            <DialogDescription>
              Modifiez le nom de ce rôle
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editRoleName">Nom du rôle</Label>
              <Input
                id="editRoleName"
                value={editRoleName}
                onChange={(e) => setEditRoleName(e.target.value)}
                placeholder="Ex: Consultant Senior"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleUpdateRole}>Sauvegarder</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogue de suppression */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le Rôle</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer le rôle "{role.name}" ?
              Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDeleteRole}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogue d'assignation d'utilisateur */}
      <Dialog open={isAssignUserDialogOpen} onOpenChange={setIsAssignUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assigner un Utilisateur</DialogTitle>
            <DialogDescription>
              Sélectionnez un utilisateur à assigner à ce groupe
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="userSelect">Utilisateur</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un utilisateur" />
                </SelectTrigger>
                <SelectContent>
                  {allUsers.length > 0 ? (
                    allUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.first_name} {user.last_name} (@{user.username})
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-users-available" disabled>
                      Aucun utilisateur disponible
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignUserDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleAssignUser}>Assigner</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogue de suppression d'utilisateur */}
      <Dialog open={isRemoveUserDialogOpen} onOpenChange={setIsRemoveUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Retirer l'Utilisateur</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir retirer {userToRemove?.first_name} {userToRemove?.last_name} du groupe "{role?.name}" ?
              Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsRemoveUserDialogOpen(false);
              setUserToRemove(null);
            }}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={confirmRemoveUser}>
              Retirer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 