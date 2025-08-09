import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';

import { useToast } from '@/hooks/use-toast';
import { usePermissionManager } from '@/hooks/use-permission-manager';
import { Permission, Role } from '@/hooks/use-permissions';
interface PermissionObject {
  id: number;
  name: string;
  codename: string;
  app_label: string;
  model: string;
  full_name: string;
}

interface RoleObject {
  id: number;
  name: string;
  user_count: number;
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

export default function PermissionManagerPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    isLoading,
    loadPermissionData,
    createRole: createRoleAPI,
    createPermission: createPermissionAPI,
    updateRolePermissions: updateRolePermissionsAPI,
    deleteRole: deleteRoleAPI,
    deletePermission: deletePermissionAPI,
    updateRole: updateRoleAPI,
  } = usePermissionManager();
  
  const [roles, setRoles] = useState<(Role | RoleObject)[]>([]);
  const [permissions, setPermissions] = useState<(Permission | PermissionObject)[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermissions[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [newRoleName, setNewRoleName] = useState('');
  const [newPermissionName, setNewPermissionName] = useState('');
  const [isCreateRoleDialogOpen, setIsCreateRoleDialogOpen] = useState(false);
  const [isCreatePermissionDialogOpen, setIsCreatePermissionDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [editRoleName, setEditRoleName] = useState('');
  const [isEditRoleDialogOpen, setIsEditRoleDialogOpen] = useState(false);

  // Charger les données
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const data = await loadPermissionData();
    setRoles(data.roles);
    setPermissions(data.permissions);
    setRolePermissions(data.rolePermissions);
  };

  // Créer un nouveau rôle
  const createRole = async () => {
    const success = await createRoleAPI(newRoleName);
    if (success) {
      setNewRoleName('');
      setIsCreateRoleDialogOpen(false);
      loadData();
    }
  };

  const [roleEditId, setRoleEditId] = useState<number>(null)
  // Ouvrir le dialogue d'édition d'un rôle
  const openEditRoleDialog = (roleId: number,roleName: string) => {
    setEditingRole(roleName);
    setEditRoleName(roleName);
    setIsEditRoleDialogOpen(true);
    setRoleEditId(roleId)
  };

  // Sauvegarder les modifications d'un rôle
  const saveRoleEdit = async (roleId: number) => {
    if (!editingRole || !editRoleName.trim()) return;

    const success = await updateRoleAPI(roleId,editRoleName);
    if (success) {
      setEditingRole(null);
      setEditRoleName('');
      setIsEditRoleDialogOpen(false);
      loadData()
    }
  };

  // Créer une nouvelle permission
  const handleCreatePermission = async () => {
    const success = await createPermissionAPI(newPermissionName);
    if (success) {
      setNewPermissionName('');
      setIsCreatePermissionDialogOpen(false);
      loadData();
    }
  };

  // Mettre à jour les permissions d'un rôle
  const updateRolePermissions = async (roleId: number,roleName: string, moduleName: string, permissionType: string, value: boolean) => {
    const success = await updateRolePermissionsAPI(roleId,roleName, moduleName, permissionType, value);
    if (success) {
      // loadData();
    }
  };

  // Supprimer un rôle
  const handleDeleteRole = async (roleId: number) => {
    const success = await deleteRoleAPI(roleId);
    if (success) {
      loadData();
    }
  };

  // Supprimer une permission
  const handleDeletePermission = async (permissionName: string) => {
    const success = await deletePermissionAPI(permissionName);
    if (success) {
      loadData();
    }
  };

  const modules = [
    'users', 'projects', 'teams', 'departments', 'clients', 
    'devis', 'contrats', 'billings', 'catalog', 'documents', 
    'reports', 'calendar', 'timesheets'
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestionnaire de Permissions</h1>
          <p className="text-muted-foreground">
            Gérez les rôles et permissions de votre système
          </p>
        </div>
      </div>

      <Tabs defaultValue="roles" className="space-y-6">
        <TabsList>
          <TabsTrigger value="roles">Rôles</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Rôles</CardTitle>
                  <CardDescription>
                    Gérez les rôles utilisateurs et leurs permissions
                  </CardDescription>
                </div>
                <Dialog open={isCreateRoleDialogOpen} onOpenChange={setIsCreateRoleDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>Nouveau Rôle</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Créer un nouveau rôle</DialogTitle>
                      <DialogDescription>
                        Entrez le nom du nouveau rôle
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="roleName">Nom du rôle</Label>
                        <Input
                          id="roleName"
                          value={newRoleName}
                          onChange={(e) => setNewRoleName(e.target.value)}
                          placeholder="Ex: Consultant Senior"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsCreateRoleDialogOpen(false)}>
                        Annuler
                      </Button>
                      <Button onClick={createRole}>Créer</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Dialogue d'édition de rôle */}
                <Dialog open={isEditRoleDialogOpen} onOpenChange={setIsEditRoleDialogOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Modifier le rôle</DialogTitle>
                      <DialogDescription>
                        Modifiez le nom du rôle
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
                      <Button variant="outline" onClick={() => setIsEditRoleDialogOpen(false)}>
                        Annuler
                      </Button>
                      <Button onClick={()=>saveRoleEdit(roleEditId)}>Sauvegarder</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {roles.map((role, index) => {
                  // Gérer le cas où role peut être un objet ou une chaîne
                  let roleName: string;
                  let userCount: number;
                  let roleId: string | number;
                  
                  if (typeof role === 'string') {
                    roleName = role;
                    userCount = 0;
                    roleId = role;
                  } else if (role && typeof role === 'object' && 'name' in role) {
                    roleName = (role as RoleObject).name;
                    userCount = (role as RoleObject).user_count;
                    roleId = (role as RoleObject).id;
                  } else {
                    roleName = String(role);
                    userCount = 0;
                    roleId = roleName;
                  }
                  
                  // Trouver les permissions de ce rôle
                  const rolePerm = rolePermissions.find(rp => rp.role === roleName);
                  const totalPermissions = rolePerm ? Object.values(rolePerm.module_permissions).reduce((acc, module) => {
                    return acc + Object.values(module).filter(Boolean).length;
                  }, 0) : 0;
                  
                  return (
                    <Card key={`role-${roleId}-${index}`} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{roleName}</CardTitle>
                          <Badge variant="outline">ID: {roleId}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <span>Utilisateurs</span>
                          <Badge variant="secondary">{userCount}</Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <span>Permissions actives</span>
                          <Badge variant="secondary">{totalPermissions}</Badge>
                        </div>
                        <div className="flex space-x-2 pt-2">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => navigate(`/permissions/role/${roleId}`)}
                          >
                            Permissions
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditRoleDialog((role as RoleObject).id,roleName)}
                          >
                            Éditer
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteRole((role as RoleObject).id)}
                          >
                            Supprimer
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Permissions</CardTitle>
                  <CardDescription>
                    Gérez les permissions disponibles dans le système
                  </CardDescription>
                </div>
                <Dialog open={isCreatePermissionDialogOpen} onOpenChange={setIsCreatePermissionDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>Nouvelle Permission</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Créer une nouvelle permission</DialogTitle>
                      <DialogDescription>
                        Entrez le nom de la nouvelle permission
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="permissionName">Nom de la permission</Label>
                        <Input
                          id="permissionName"
                          value={newPermissionName}
                          onChange={(e) => setNewPermissionName(e.target.value)}
                          placeholder="Ex: projects.advanced_edit"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsCreatePermissionDialogOpen(false)}>
                        Annuler
                      </Button>
                      <Button onClick={handleCreatePermission}>Créer</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" className="w-full">
                {(() => {
                  // Grouper les permissions par module
                  const groupedPermissions: { [key: string]: (Permission | PermissionObject)[] } = {};
                  
                  permissions.forEach((permission) => {
                    let moduleName: string;
                    
                    if (typeof permission === 'string') {
                      moduleName = permission.split('.')[0];
                    } else if (permission && typeof permission === 'object' && 'full_name' in permission) {
                      moduleName = (permission as PermissionObject).app_label || (permission as PermissionObject).full_name.split('.')[0];
                    } else {
                      moduleName = 'unknown';
                    }
                    
                    if (!groupedPermissions[moduleName]) {
                      groupedPermissions[moduleName] = [];
                    }
                    groupedPermissions[moduleName].push(permission);
                  });
                  
                  // Rendre les groupes de permissions
                  return Object.entries(groupedPermissions).map(([moduleName, modulePermissions]) => (
                    <AccordionItem key={`module-${moduleName}`} value={moduleName}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center justify-between w-full pr-4">
                          <span className="capitalize font-semibold">{moduleName}</span>
                          <Badge variant="secondary">{modulePermissions.length} permission(s)</Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2">
                          {modulePermissions.map((permission: Permission | PermissionObject) => {
                            let permissionName: string;
                            let displayModuleName: string;
                            
                            if (typeof permission === 'string') {
                              permissionName = permission;
                              displayModuleName = permission.split('.')[0];
                            } else if (permission && typeof permission === 'object' && 'full_name' in permission) {
                              permissionName = (permission as PermissionObject).full_name;
                              displayModuleName = (permission as PermissionObject).app_label || permissionName.split('.')[0];
                            } else {
                              permissionName = String(permission);
                              displayModuleName = 'unknown';
                            }
                            
                            // Générer une clé unique pour chaque permission
                            const uniqueKey = typeof permission === 'object' && permission.id 
                              ? `permission-${permission.id}` 
                              : `permission-${permissionName}`;
                            
                            return (
                              <div key={uniqueKey} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border-l-4 border-l-blue-200">
                                <div className="flex items-center space-x-3">
                                  <span className="font-medium">{permissionName}</span>
                                  <Badge variant="outline">{displayModuleName}</Badge>
                                </div>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDeletePermission(permissionName)}
                                >
                                  Supprimer
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ));
                })()}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 