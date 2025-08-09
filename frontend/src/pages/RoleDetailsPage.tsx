import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
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
import { ArrowLeft, Users, Shield, Edit, Trash2, UserPlus } from 'lucide-react';
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
    getRoleUsers,
    assignUserToRole,
    removeUserFromRole
  } = usePermissionManager();

  const [role, setRole] = useState<RoleDetails | null>(null);
  const [roleUsers, setRoleUsers] = useState<RoleUser[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermissions | null>(null);
  const [allUsers, setAllUsers] = useState<RoleUser[]>([]);
  
  // États pour les modales
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAssignUserDialogOpen, setIsAssignUserDialogOpen] = useState(false);
  
  // États pour l'édition
  const [editRoleName, setEditRoleName] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');

  const modules = [
    'users', 'projects', 'teams', 'departments', 'clients', 
    'devis', 'contrats', 'billings', 'catalog', 'documents', 
    'reports', 'calendar', 'timesheets'
  ];

  useEffect(() => {
    if (roleId) {
      loadRoleDetails();
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
        navigate('/permissions');
        return;
      }
      
      setRole(roleData);
      setEditRoleName(roleData.name);
      
      // Trouver les permissions du rôle
      const rolePerms = data.rolePermissions.find((rp: any) => rp.role === roleData.name);
      setRolePermissions(rolePerms || null);
      
             // Charger les utilisateurs du rôle
       const users = await getRoleUsers(roleId);
       setRoleUsers(users);
      
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les détails du rôle",
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
    if (!selectedUserId || !role) return;

         const success = await assignUserToRole(parseInt(selectedUserId), role.name);
     if (success) {
       setSelectedUserId('');
       setIsAssignUserDialogOpen(false);
       loadRoleDetails();
     }
   };

   const handleRemoveUser = async (userId: number) => {
     if (!role) return;

     const success = await removeUserFromRole(userId, role.name);
    if (success) {
      loadRoleDetails();
    }
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
                {modules.map((module) => {
                  const modulePerms = rolePermissions?.module_permissions[module] || {
                    view: false,
                    add: false,
                    change: false,
                    delete: false
                  };

                  return (
                    <Card key={module} className="border-l-4 border-l-blue-200">
                      <CardHeader>
                        <CardTitle className="text-lg capitalize flex items-center justify-between">
                          {module}
                          <Badge variant="outline">
                            {Object.values(modulePerms).filter(Boolean).length}/4
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={modulePerms.view}
                              onCheckedChange={(checked) => 
                                handleUpdatePermission(module, 'view', checked)
                              }
                            />
                            <Label>Voir</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={modulePerms.add}
                              onCheckedChange={(checked) => 
                                handleUpdatePermission(module, 'add', checked)
                              }
                            />
                            <Label>Créer</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={modulePerms.change}
                              onCheckedChange={(checked) => 
                                handleUpdatePermission(module, 'change', checked)
                              }
                            />
                            <Label>Modifier</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={modulePerms.delete}
                              onCheckedChange={(checked) => 
                                handleUpdatePermission(module, 'delete', checked)
                              }
                            />
                            <Label>Supprimer</Label>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
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
                    Gérez les utilisateurs assignés à ce rôle
                  </CardDescription>
                </div>
                <Button onClick={() => setIsAssignUserDialogOpen(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Assigner Utilisateur
                </Button>
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
                  {roleUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {user.first_name} {user.last_name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            @{user.username}
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
                  ))}
                </TableBody>
              </Table>
              
              {roleUsers.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Aucun utilisateur assigné à ce rôle
                </div>
              )}
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
              Sélectionnez un utilisateur à assigner à ce rôle
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
                  {allUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.first_name} {user.last_name} (@{user.username})
                    </SelectItem>
                  ))}
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
    </div>
  );
} 