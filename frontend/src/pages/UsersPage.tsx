import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Search, 
  Plus, 
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Building,
  UserPlus,
  Download,
  Upload,
  Settings,
  Shield,
  Clock,
  Activity,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  UserCheck,
  UserX,
  Key,
  Lock
} from "lucide-react";
import { useUsers } from '@/hooks/use-users';
import { usePermissionManager } from '@/hooks/use-permission-manager';
import { usePermissions } from '@/hooks/use-permissions';
import { CreateUserModal } from '@/components/users/CreateUserModal';
import { EditUserModal } from '@/components/EditUserModal';
import { UserDetailsModal } from '@/components/users/UserDetailsModal';
import { DeleteUserModal } from '@/components/DeleteUserModal';
import type { UserList } from '@/lib/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/components/ui/use-toast';
import { usersAPI } from '@/lib/api';

export const UsersPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [sortBy, setSortBy] = useState<string>('first_name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserList | null>(null);

  // Import state
    const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
   const [isImporting, setIsImporting] = useState(false);
   const [importPreview, setImportPreview] = useState<any[]>([]);
   const [importRows, setImportRows] = useState<any[]>([]);
   const [importHeaders, setImportHeaders] = useState<string[]>([]);
   const [importReport, setImportReport] = useState<{ total: number; success: number; failed: number; errors: string[] } | null>(null);

  // Role management state
  const [availableRoles, setAvailableRoles] = useState<any[]>([]);
  const [isRolesLoading, setIsRolesLoading] = useState(true);
  const [isRoleManagementOpen, setIsRoleManagementOpen] = useState(false);
  const [selectedUserForRole, setSelectedUserForRole] = useState<UserList | null>(null);
  const [isAssignRoleDialogOpen, setIsAssignRoleDialogOpen] = useState(false);
  const [isRemoveRoleDialogOpen, setIsRemoveRoleDialogOpen] = useState(false);
  const [roleToRemove, setRoleToRemove] = useState<string>('');

  // Hooks
  const { toast } = useToast();
  const { canManageUsers, hasPermission } = usePermissions();
  const {
    loadPermissionData,
    assignUserToRole,
    removeUserFromRole,
    getAllUsers,
    getRoleUsers,
    isLoading: isPermissionLoading
  } = usePermissionManager();

  // Fetch users with filters
  const { data: usersData, isLoading, error, refetch, toggleUserActive, isToggling } = useUsers({
    search: searchTerm || undefined,
    profile__department: selectedDepartment && selectedDepartment !== 'all' ? selectedDepartment : undefined,
    is_active: selectedStatus === 'active' ? true : selectedStatus === 'inactive' ? false : undefined,
    ordering: sortOrder === 'desc' ? `-${sortBy}` : sortBy,
    page: currentPage
  });

  // Load roles from backend
  useEffect(() => {
    const loadRoles = async () => {
      setIsRolesLoading(true);
      try {
        const data = await loadPermissionData();
        setAvailableRoles(data.roles || []);
      } catch (error) {
        console.error('Erreur lors du chargement des rôles:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les rôles depuis le backend",
          variant: "destructive"
        });
      } finally {
        setIsRolesLoading(false);
      }
    };
    
    // Charger les rôles pour tous les utilisateurs (nécessaire pour le filtrage)
    loadRoles();
  }, [loadPermissionData, toast]);

  const users = usersData?.data?.results || [];
  const totalUsers = usersData?.data?.count || 0;
  const defaultPageSize = 20; // must align with backend PAGE_SIZE
  const totalPages = Math.max(1, Math.ceil(totalUsers / defaultPageSize));
  const startItem = totalUsers === 0 ? 0 : (currentPage - 1) * defaultPageSize + 1;
  const endItem = Math.min(currentPage * defaultPageSize, totalUsers);

  // Clamp current page when result count shrinks
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages]);

  // Compute page number window
  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
      let end = Math.min(totalPages, start + maxVisible - 1);
      if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
      for (let i = start; i <= end; i++) pages.push(i);
    }
    return pages;
  };

  const departments = ['Développement', 'Design', 'Marketing', 'Commercial', 'Finance', 'RH', 'Direction'];
  const statuses = [
    { value: 'active', label: 'Actif', color: 'bg-green-100 text-green-800' },
    { value: 'inactive', label: 'Inactif', color: 'bg-red-100 text-red-800' }
  ];


  // ===== Export CSV =====
  const handleExportCSV = () => {
    const headers = [
      'username', 'first_name', 'last_name', 'email', 'department', 'roles', 'is_active'
    ];
    const rows = users.map(u => [
      u.username,
      u.first_name || '',
      u.last_name || '',
      u.email || '',
      u.profile?.department || '',
      (u.groups || []).map(g => g.name).join('; '),
      u.is_active ? 'true' : 'false',
    ]);
    const csvContent = [headers, ...rows]
      .map(row => row.map(val => `"${(val ?? '').toString().replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'utilisateurs.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // ===== Import CSV =====
  const parseCSV = (text: string) => {
    const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length === 0) return { headers: [], rows: [] };
    const rawHeaders = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const rows = lines.slice(1).map(line => {
      const cols: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
          else { inQuotes = !inQuotes; }
        } else if (ch === ',' && !inQuotes) {
          cols.push(current);
          current = '';
        } else {
          current += ch;
        }
      }
      cols.push(current);
      const obj: Record<string, string> = {};
      rawHeaders.forEach((h, idx) => { obj[h] = (cols[idx] || '').trim().replace(/^"|"$/g, ''); });
      return obj;
    });
    return { headers: rawHeaders, rows };
  };

    const handleImportFile = async (file: File) => {
     setImportReport(null);
     const text = await file.text();
     const { headers, rows } = parseCSV(text);
     setImportHeaders(headers);
     setImportRows(rows);
     setImportPreview(rows.slice(0, 10));
     if (rows.length === 0) {
       toast({ title: 'Fichier vide', description: 'Aucune donnée trouvée dans le CSV', variant: 'destructive' });
     }
   };

  const toBoolean = (val: string | undefined) => {
    if (!val) return true;
    const v = val.toLowerCase();
    return ['true', '1', 'actif', 'yes', 'oui'].includes(v);
  };

  const generatePassword = () => {
    const base = Math.random().toString(36).slice(-8);
    return `Temp${base}!`;
  };

  const mapRolesToIds = (roleNames: string): number[] => {
    if (!roleNames) return [];
    const names = roleNames.split(/[,;|]/).map(s => s.trim()).filter(Boolean);
    const ids: number[] = [];
    names.forEach(n => {
      const role = availableRoles.find((r: any) => r.name.toLowerCase() === n.toLowerCase());
      if (role) ids.push(role.id);
    });
    return ids;
  };

  const handleConfirmImport = async () => {
    setIsImporting(true);
    const errors: string[] = [];
    let success = 0;
    const rows = importRows.length > 0 ? importRows : importPreview;
    try {
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i] as any;
        const username = row.username || (row.email ? row.email.split('@')[0] : undefined);
        const email = row.email;
        if (!username || !email) {
          errors.push(`Ligne ${i + 2}: username ou email manquant`);
          continue;
        }
        const password = row.password && row.password_confirm ? row.password : generatePassword();
        const payload: any = {
          username,
          first_name: row.first_name || '',
          last_name: row.last_name || '',
          email,
          password,
          password_confirm: row.password_confirm || password,
        };
        const profile: any = {};
        if (row.department) profile.department = row.department;
        if (row.phone) profile.phone = row.phone;
        if (row.bio) profile.bio = row.bio;
        if (row.position) profile.position = row.position;
        if (row.hire_date) profile.hire_date = row.hire_date;
        if (Object.keys(profile).length > 0) payload.profile = profile;
        if (row.roles || row.role || row.groups) {
          const roleNames = row.roles || row.role || row.groups;
          const ids = mapRolesToIds(roleNames);
          if (ids.length > 0) payload.groups = ids;
        }
        try {
          await usersAPI.createUser(payload);
          success += 1;
        } catch (e: any) {
          const msg = e?.response?.data ? JSON.stringify(e.response.data) : (e?.message || 'Erreur inconnue');
          errors.push(`Ligne ${i + 2}: ${msg}`);
        }
      }
      setImportReport({ total: rows.length, success, failed: rows.length - success, errors });
      toast({
        title: 'Import terminé',
        description: `${success}/${rows.length} utilisateur(s) importé(s)`
      });
      await refetch();
    } finally {
      setIsImporting(false);
    }
  };

  const handleUserSelect = (userId: number) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(user => user.id));
    }
  };

  const handleEdit = (user: UserList) => {
    setSelectedUser(user);
    setEditModalOpen(true);
  };

  const handleViewDetails = (user: UserList) => {
    setSelectedUser(user);
    setDetailsModalOpen(true);
  };

  const handleDelete = (user: UserList) => {
    setSelectedUser(user);
    setDeleteModalOpen(true);
  };

  const handleToggleActive = (user: UserList) => {
    if (user.id) {
      toggleUserActive(user.id);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedRole('all');
    setSelectedDepartment('all');
    setSelectedStatus('all');
    setCurrentPage(1);
  };

  // Role management functions
  const handleAssignRole = async (userId: number, roleName: string) => {
    try {
      const success = await assignUserToRole(userId, roleName);
      if (success) {
        toast({
          title: "Succès",
          description: `Utilisateur assigné au rôle "${roleName}" avec succès`
        });
        refetch(); // Recharger la liste des utilisateurs
        setIsAssignRoleDialogOpen(false);
        setSelectedUserForRole(null);
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'assigner le rôle à l'utilisateur",
        variant: "destructive"
      });
    }
  };

  const handleRemoveRole = async (userId: number, roleName: string) => {
    try {
      const success = await removeUserFromRole(userId, roleName);
      if (success) {
        toast({
          title: "Succès",
          description: `Rôle "${roleName}" retiré de l'utilisateur avec succès`
        });
        refetch(); // Recharger la liste des utilisateurs
        setIsRemoveRoleDialogOpen(false);
        setSelectedUserForRole(null);
        setRoleToRemove('');
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de retirer le rôle de l'utilisateur",
        variant: "destructive"
      });
    }
  };

  const openAssignRoleDialog = (user: UserList) => {
    setSelectedUserForRole(user);
    setIsAssignRoleDialogOpen(true);
  };

  const openRemoveRoleDialog = (user: UserList, roleName: string) => {
    setSelectedUserForRole(user);
    setRoleToRemove(roleName);
    setIsRemoveRoleDialogOpen(true);
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3 mr-1" />
        Actif
      </Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800">
        <XCircle className="w-3 h-3 mr-1" />
        Inactif
      </Badge>
    );
  };

  const getRoleBadge = (role: string) => {
    const roleColors: Record<string, string> = {
      'Managing Director': 'bg-purple-100 text-purple-800',
      'Chef de projet': 'bg-blue-100 text-blue-600',
      'Designer': 'bg-pink-100 text-pink-800',
      'Développeur': 'bg-green-100 text-green-800',
      'Rédacteur': 'bg-yellow-100 text-yellow-800',
      'Consultant': 'bg-indigo-100 text-indigo-800',
      'Assistant': 'bg-gray-100 text-gray-800',
      'Finance/Admin': 'bg-orange-100 text-orange-800'
    };

    return (
      <Badge className={roleColors[role] || 'bg-gray-100 text-gray-800'}>
        {role}
      </Badge>
    );
  };

  const getGroupsDisplay = (groups: Array<{id: number; name: string}>) => {
    if (!groups || groups.length === 0) {
      return (
        <span className="text-sm text-gray-400 italic">Aucun groupe</span>
      );
    }
    
    return (
      <div className="flex flex-wrap gap-1">
        {groups.map((group) => (
          <Badge key={group.id} variant="outline" className="text-xs">
            {group.name}
          </Badge>
        ))}
      </div>
    );
  };

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex items-center justify-center h-96">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Erreur de chargement</h3>
              <p className="text-gray-600 mb-4">Impossible de charger les utilisateurs</p>
              <Button onClick={() => refetch()}>Réessayer</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des utilisateurs</h1>
          <p className="text-gray-600">Gérez les utilisateurs, leurs rôles et permissions</p>
        </div>
        <div className="flex gap-2">
          {hasPermission('users.manage_roles') && (
            <Button variant="outline" size="sm" onClick={() => setIsRoleManagementOpen(true)}>
              <Shield className="w-4 h-4 mr-2" />
              Gestion des rôles
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setIsImportDialogOpen(true); setImportPreview([]); setImportReport(null); }}>
            <Upload className="w-4 h-4 mr-2" />
            Importer
          </Button>
          <CreateUserModal 
            open={createModalOpen}
            onOpenChange={setCreateModalOpen}
            onSuccess={() => {
              refetch();
              setCreateModalOpen(false);
            }}
          >
            <Button>
              <UserPlus className="w-4 h-4 mr-2" />
              Nouvel utilisateur
            </Button>
          </CreateUserModal>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtres et recherche
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Rechercher par nom, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue placeholder="Rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les rôles</SelectItem>
                {isRolesLoading ? (
                  <SelectItem value="loading" disabled>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Chargement des rôles...
                  </SelectItem>
                ) : availableRoles.length > 0 ? (
                  availableRoles.map(role => (
                    <SelectItem key={role.id} value={role.name}>
                      {role.name} ({role.user_count || 0})
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-roles" disabled>Aucun rôle disponible</SelectItem>
                )}
              </SelectContent>
            </Select>
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger>
                <SelectValue placeholder="Département" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les départements</SelectItem>
                {departments.map(dept => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                {statuses.map(status => (
                  <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-between items-center mt-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {totalUsers} utilisateur{totalUsers > 1 ? 's' : ''} trouvé{totalUsers > 1 ? 's' : ''}
              </span>
              {(searchTerm || (selectedRole && selectedRole !== 'all') || (selectedDepartment && selectedDepartment !== 'all') || (selectedStatus && selectedStatus !== 'all')) && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Effacer les filtres
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="first_name">Nom</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="groups__name">Groupe</SelectItem>
                  <SelectItem value="profile__department">Département</SelectItem>
                  <SelectItem value="profile__created_at">Date de création</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Liste des utilisateurs
            </CardTitle>
            <div className="flex items-center gap-2">
              {selectedUsers.length > 0 && (
                <Badge variant="secondary">
                  {selectedUsers.length} sélectionné{selectedUsers.length > 1 ? 's' : ''}
                </Badge>
              )}
              <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'table' | 'grid')}>
                <TabsList>
                  <TabsTrigger value="table">Tableau</TabsTrigger>
                  <TabsTrigger value="grid">Grille</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : viewMode === 'table' ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={selectedUsers.length === users.length && users.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300"
                      />
                    </TableHead>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Groupes</TableHead>
                    <TableHead>Département</TableHead>
                    <TableHead>Projets</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Dernière connexion</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => handleUserSelect(user.id)}
                          className="rounded border-gray-300"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={user.profile.avatar} />
                            <AvatarFallback>
                              {user.first_name[0]}{user.last_name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-gray-900">{user.full_name}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getGroupsDisplay(user.groups)}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {user.profile.department || 'Non défini'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {user.project_count} projet{parseInt(user.project_count) > 1 ? 's' : ''}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(user.is_active)}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {user.profile.updated_at ? 
                            format(new Date(user.profile.updated_at), 'PPp', { locale: fr }) : 
                            'Jamais'
                          }
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleViewDetails(user)}>
                              <Eye className="w-4 h-4 mr-2" />
                              Voir les détails
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(user)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Modifier
                            </DropdownMenuItem>
                            {hasPermission('users.manage_roles') && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel>Gestion des rôles</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => openAssignRoleDialog(user)}>
                                  <UserCheck className="w-4 h-4 mr-2" />
                                  Assigner un rôle
                                </DropdownMenuItem>
                                {user.profile.role && (
                                  <DropdownMenuItem 
                                    onClick={() => openRemoveRoleDialog(user, user.profile.role)}
                                    className="text-orange-600"
                                  >
                                    <UserX className="w-4 h-4 mr-2" />
                                    Retirer le rôle
                                  </DropdownMenuItem>
                                )}
                              </>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDelete(user)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleToggleActive(user)}
                              className={`${user.is_active ? 'text-orange-600' : 'text-green-600'}`}
                              disabled={isToggling}
                            >
                              {isToggling ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : user.is_active ? (
                                <XCircle className="w-4 h-4 mr-2" />
                              ) : (
                                <CheckCircle className="w-4 h-4 mr-2" />
                              )}
                              {isToggling ? 'Traitement...' : (user.is_active ? 'Désactiver' : 'Activer')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {users.map((user) => (
                <Card key={user.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={user.profile.avatar} />
                        <AvatarFallback>
                          {user.first_name[0]}{user.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewDetails(user)}>
                            <Eye className="w-4 h-4 mr-2" />
                            Voir les détails
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(user)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDelete(user)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleToggleActive(user)}
                              className={`${user.is_active ? 'text-orange-600' : 'text-green-600'}`}
                              disabled={isToggling}
                            >
                              {isToggling ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : user.is_active ? (
                                <XCircle className="w-4 h-4 mr-2" />
                              ) : (
                                <CheckCircle className="w-4 h-4 mr-2" />
                              )}
                              {isToggling ? 'Traitement...' : (user.is_active ? 'Désactiver' : 'Activer')}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-medium text-gray-900">{user.full_name}</h3>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      <div className="flex items-center justify-between">
                        {getStatusBadge(user.is_active)}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Building className="w-4 h-4" />
                        {user.profile.department || 'Non défini'}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Activity className="w-4 h-4" />
                        {user.project_count} projet{parseInt(user.project_count) > 1 ? 's' : ''}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Shield className="w-4 h-4" />
                        {getGroupsDisplay(user.groups)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-600">
              {totalUsers > 0 ? (
                <span>Affichage {startItem}-{endItem} sur {totalUsers}</span>
              ) : (
                <span>Aucun utilisateur</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1 || totalUsers === 0}
              >
                Précédent
              </Button>
              {getPageNumbers().map((n) => (
                <Button
                  key={n}
                  variant={n === currentPage ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPage(n)}
                >
                  {n}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || totalUsers === 0}
              >
                Suivant
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      {selectedUser && (
        <>
          <EditUserModal
            open={editModalOpen}
            onOpenChange={setEditModalOpen}
            user={selectedUser}
            onSuccess={() => {
              refetch();
              setEditModalOpen(false);
              setSelectedUser(null);
            }}
          />
          <UserDetailsModal
            open={detailsModalOpen}
            onOpenChange={setDetailsModalOpen}
            user={selectedUser}
          />
          <DeleteUserModal
            open={deleteModalOpen}
            onOpenChange={setDeleteModalOpen}
            user={selectedUser}
            onSuccess={() => {
              refetch();
              setDeleteModalOpen(false);
              setSelectedUser(null);
            }}
          />
        </>
      )}

            {/* Import Users Dialog */}
       <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
         <DialogContent className="max-w-4xl w-[90vw]">
           <DialogHeader>
             <DialogTitle>Importer des utilisateurs (CSV)</DialogTitle>
            <DialogDescription>
              Colonnes supportées: username, first_name, last_name, email, department, roles, is_active, password, password_confirm, phone, bio, position, hire_date
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Input type="file" accept=".csv" onChange={e => { const f = e.target.files?.[0]; if (f) void handleImportFile(f); }} />
            {importPreview.length > 0 && (
              <div className="border rounded p-2 max-h-48 table-auto overflow-auto w-full">
                <div className="text-sm text-gray-600 mb-2">Aperçu des 10 premières lignes</div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      {importHeaders.map(h => (<TableHead key={h}>{h}</TableHead>))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importPreview.map((row, idx) => (
                      <TableRow key={idx}>
                        {importHeaders.map(h => (
                          <TableCell key={h} className="text-xs">{row[h]}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            {importReport && (
              <div className="text-sm">
                <div>
                  Résultat: {importReport.success}/{importReport.total} succès, {importReport.failed} échecs
                </div>
                {importReport.errors.length > 0 && (
                  <div className="mt-2 max-h-24 overflow-auto text-red-600">
                    {importReport.errors.map((e, i) => (<div key={i}>• {e}</div>))}
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportDialogOpen(false)} disabled={isImporting}>Fermer</Button>
            <Button onClick={handleConfirmImport} disabled={isImporting || importPreview.length === 0}>
              {isImporting ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin"/> Import...</>) : 'Démarrer l\'import'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role Management Modals */}
      <Dialog open={isAssignRoleDialogOpen} onOpenChange={setIsAssignRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assigner un rôle</DialogTitle>
            <DialogDescription>
              Sélectionnez un rôle à assigner à {selectedUserForRole?.full_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {availableRoles.map((role) => (
                <Button
                  key={role.id}
                  variant="outline"
                  onClick={() => handleAssignRole(selectedUserForRole?.id!, role.name)}
                  className="justify-start"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  {role.name}
                </Button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignRoleDialogOpen(false)}>
              Annuler
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isRemoveRoleDialogOpen} onOpenChange={setIsRemoveRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Retirer le rôle</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir retirer le rôle "{roleToRemove}" de {selectedUserForRole?.full_name} ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRemoveRoleDialogOpen(false)}>
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => handleRemoveRole(selectedUserForRole?.id!, roleToRemove)}
            >
              Retirer le rôle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role Management Overview Modal */}
      <Dialog open={isRoleManagementOpen} onOpenChange={setIsRoleManagementOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Gestion des rôles et permissions
            </DialogTitle>
            <DialogDescription>
              Vue d'ensemble des rôles, de leurs utilisateurs et permissions
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {availableRoles.map((role) => (
              <Card key={role.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Key className="w-4 h-4" />
                        {role.name}
                      </CardTitle>
                      <CardDescription>
                        {role.user_count || 0} utilisateur{role.user_count !== 1 ? 's' : ''} assigné{role.user_count !== 1 ? 's' : ''}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">
                      ID: {role.id}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Lock className="w-4 h-4" />
                      <span className="font-medium">Permissions :</span>
                      <span>Gestion complète des utilisateurs et rôles</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="w-4 h-4" />
                      <span className="font-medium">Utilisateurs :</span>
                      <span>{role.user_count || 0} membre{role.user_count !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRoleManagementOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 