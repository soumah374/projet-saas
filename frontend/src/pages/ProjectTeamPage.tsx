import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  ArrowLeft,
  Plus, 
  Search, 
  Users, 
  Mail, 
  Phone,
  MapPin,
  Calendar,
  Edit,
  Trash2,
  UserPlus,
  Crown,
  Shield,
  MoreHorizontal,
  Loader2,
  Save,
  LayoutGrid,
  List
} from "lucide-react";
import { projectsAPI, usersAPI } from '@/lib/api';
import type { Project, User, ProjectMemberRole, ProjectMemberUpdate } from '@/lib/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useUsers } from '@/hooks/use-users';

interface ProjectMember {
  id: number;
  user: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar?: string;
  };
  role: string;
  joined_at: string;
  is_active: boolean;
}

export function ProjectTeamPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [project, setProject] = useState<Project | null>(null);
  const [teamMembers, setTeamMembers] = useState<ProjectMember[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [memberToDelete, setMemberToDelete] = useState<ProjectMember | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<ProjectMember | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editRole, setEditRole] = useState<string>('');
  const [editIsActive, setEditIsActive] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // React Query hooks
  const { data: users, isLoading: usersLoading, error: usersError } = useUsers({
    is_active: true,
    ordering: 'first_name'
  });

  // Mutations
  const addMemberMutation = useMutation({
    mutationFn: ({ projectId, userId, role }: { projectId: string; userId: number; role: ProjectMemberRole }) =>
      projectsAPI.addMember(projectId, { user_id: userId, role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      loadProjectTeam();
      setIsAddMemberDialogOpen(false);
      setSelectedUser('');
      setSelectedRole('');
      toast.success('Membre ajouté à l\'équipe avec succès');
    },
    onError: (error) => {
      toast.error('Erreur lors de l\'ajout du membre');
      console.error('Error adding member:', error);
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: ({ projectId, memberId }: { projectId: string; memberId: number }) =>
      projectsAPI.removeMember(projectId, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      loadProjectTeam();
      toast.success('Membre retiré de l\'équipe');
    },
    onError: (error) => {
      toast.error('Erreur lors du retrait du membre');
      console.error('Error removing member:', error);
    },
  });

  const updateMemberMutation = useMutation({
    mutationFn: ({ projectId, memberId, data }: { projectId: string; memberId: number; data: ProjectMemberUpdate }) =>
      projectsAPI.updateMember(projectId, memberId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      loadProjectTeam();
      setIsEditDialogOpen(false);
      setMemberToEdit(null);
      toast.success('Membre mis à jour avec succès');
    },
    onError: (error) => {
      toast.error('Erreur lors de la mise à jour du membre');
      console.error('Error updating member:', error);
    },
  });

  useEffect(() => {
    if (projectId) {
      loadProjectTeam();
    }
  }, [projectId]);

  const loadProjectTeam = async () => {
    try {
      setIsLoading(true);
      const projectData = await projectsAPI.getProject(projectId!);
      setProject(projectData);
      setTeamMembers(projectData.team_members || []);
    } catch (err) {
      setError('Erreur lors du chargement de l\'équipe du projet');
      console.error('Error loading project team:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMember = () => {
    if (!selectedUser || !selectedRole) {
      toast.error('Veuillez sélectionner un utilisateur et un rôle');
      return;
    }

    addMemberMutation.mutate({
      projectId: projectId!,
      userId: parseInt(selectedUser),
      role: selectedRole as ProjectMemberRole
    });
  };

  const handleRemoveMember = (memberId: number) => {
    removeMemberMutation.mutate({
      projectId: projectId!,
      memberId
    });
    setMemberToDelete(null);
    setIsDeleteDialogOpen(false);
  };

  const handleEditMember = () => {
    if (!memberToEdit || !editRole) {
      toast.error('Veuillez sélectionner un rôle');
      return;
    }

    updateMemberMutation.mutate({
      projectId: projectId!,
      memberId: memberToEdit.id,
      data: {
        role: editRole,
        is_active: editIsActive
      }
    });
  };

  const openEditDialog = (member: ProjectMember) => {
    setMemberToEdit(member);
    setEditRole(member.role);
    setEditIsActive(member.is_active);
    setIsEditDialogOpen(true);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "Chef de projet":
        return <Crown className="w-4 h-4 text-yellow-600" />;
      case "Développeur Senior":
      case "DevOps":
        return <Shield className="w-4 h-4 text-blue-600" />;
      default:
        return <Users className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "Chef de projet":
        return "bg-yellow-100 text-yellow-800";
      case "Développeur Senior":
        return "bg-blue-100 text-blue-800";
      case "Designer":
        return "bg-purple-100 text-purple-800";
      case "Développeur":
        return "bg-green-100 text-green-800";
      case "Rédacteur":
        return "bg-orange-100 text-orange-800";
      case "Consultant":
        return "bg-indigo-100 text-indigo-800";
      case "Assistant":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredMembers = teamMembers.filter(member => {
    const matchesSearch = member.user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.role.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  // Filtrer les utilisateurs qui ne sont pas déjà dans l'équipe
  const availableUsers = users?.results?.filter(user => 
    !teamMembers.some(member => member.user.id === user.id)
  ) || [];

  const roles: ProjectMemberRole[] = ['Chef de projet', 'Designer', 'Développeur', 'Rédacteur', 'Consultant', 'Assistant'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement de l'équipe...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Équipe du projet
            </h1>
            {project && (
              <p className="text-gray-600">
                {project.title} • {teamMembers.length} membre{teamMembers.length > 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
        
        <Dialog open={isAddMemberDialogOpen} onOpenChange={setIsAddMemberDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="w-4 h-4 mr-2" />
              Ajouter un membre
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter un membre à l'équipe</DialogTitle>
              <DialogDescription>
                Sélectionnez un utilisateur et un rôle pour l'ajouter à l'équipe du projet.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="user">Utilisateur</Label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un utilisateur" />
                  </SelectTrigger>
                  <SelectContent>
                    {usersLoading ? (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Chargement des utilisateurs...
                      </div>
                    ) : availableUsers.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        Tous les utilisateurs sont déjà dans l'équipe
                      </div>
                    ) : (
                      availableUsers.map(user => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.first_name} {user.last_name} ({user.email})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="role">Rôle</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map(role => (
                      <SelectItem key={role} value={role}>{role}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddMemberDialogOpen(false)}>
                Annuler
              </Button>
              <Button 
                onClick={handleAddMember}
                disabled={!selectedUser || !selectedRole || addMemberMutation.isPending}
              >
                {addMemberMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Ajout en cours...
                  </>
                ) : (
                  'Ajouter'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Rechercher un membre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-48">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrer par rôle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les rôles</SelectItem>
                  {roles.map(role => (
                    <SelectItem key={role} value={role}>{role}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Members View */}
      {viewMode === 'grid' ? (
        // Grid View
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMembers.map((member) => (
            <Card key={member.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={member.user.avatar} />
                      <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                        {member.user.first_name[0]}{member.user.last_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {member.user.first_name} {member.user.last_name}
                      </h3>
                      <p className="text-sm text-gray-500">{member.user.email}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    {getRoleIcon(member.role)}
                    <Badge className={getRoleColor(member.role)}>
                      {member.role}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>Rejoint le {new Date(member.joined_at).toLocaleDateString('fr-FR')}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4" />
                    <span>{member.user.email}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={member.is_active ? "default" : "secondary"}>
                      {member.is_active ? "Actif" : "Inactif"}
                    </Badge>
                  </div>
                </div>

                <div className="flex gap-2 mt-4 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => openEditDialog(member)}
                    disabled={updateMemberMutation.isPending}
                  >
                    {updateMemberMutation.isPending && memberToEdit?.id === member.id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Modification...
                      </>
                    ) : (
                      <>
                        <Edit className="h-4 w-4 mr-2" />
                        Modifier
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-red-600 hover:text-red-700"
                    onClick={() => {
                      setMemberToDelete(member);
                      setIsDeleteDialogOpen(true);
                    }}
                    disabled={removeMemberMutation.isPending}
                  >
                    {removeMemberMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        // List View
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Membre</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Date d'ajout</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={member.user.avatar} />
                        <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold text-xs">
                          {member.user.first_name[0]}{member.user.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{member.user.first_name} {member.user.last_name}</div>
                        <div className="text-sm text-gray-500">{member.user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getRoleIcon(member.role)}
                      <Badge className={getRoleColor(member.role)}>
                        {member.role}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(member.joined_at).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell>
                    <Badge variant={member.is_active ? "default" : "secondary"}>
                      {member.is_active ? "Actif" : "Inactif"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(member)}
                        disabled={updateMemberMutation.isPending}
                      >
                        {updateMemberMutation.isPending && memberToEdit?.id === member.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Edit className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => {
                          setMemberToDelete(member);
                          setIsDeleteDialogOpen(true);
                        }}
                        disabled={removeMemberMutation.isPending}
                      >
                        {removeMemberMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Empty State */}
      {filteredMembers.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || roleFilter !== 'all' ? 'Aucun membre trouvé' : 'Aucun membre dans l\'équipe'}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || roleFilter !== 'all' 
                ? 'Essayez de modifier vos critères de recherche.'
                : 'Commencez par ajouter des membres à votre équipe.'
              }
            </p>
            {!searchTerm && roleFilter === 'all' && (
              <Button onClick={() => setIsAddMemberDialogOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Ajouter le premier membre
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit Member Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le membre de l'équipe</DialogTitle>
            <DialogDescription>
              Modifiez le rôle et le statut de {memberToEdit?.user.first_name} {memberToEdit?.user.last_name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Rôle</Label>
              <Select value={editRole} onValueChange={setEditRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un rôle" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map(role => (
                    <SelectItem key={role} value={role}>{role}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label>Statut actif</Label>
              <Switch
                checked={editIsActive}
                onCheckedChange={setEditIsActive}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setMemberToEdit(null);
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={handleEditMember}
              disabled={!editRole || updateMemberMutation.isPending}
            >
              {updateMemberMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Mise à jour...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Enregistrer les modifications
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir retirer {memberToDelete?.user.first_name} {memberToDelete?.user.last_name} de l'équipe ?
              Cette action ne peut pas être annulée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setMemberToDelete(null)}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => handleRemoveMember(memberToDelete!.id)}
              disabled={removeMemberMutation.isPending}
            >
              {removeMemberMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Suppression...
                </>
              ) : (
                'Confirmer la suppression'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 