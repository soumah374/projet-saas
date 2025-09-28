import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
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
  Loader2,
  MoreHorizontal,
  Eye,
  UserMinus,
  Settings,
  Activity,
  Building,
  AlertCircle,
  CheckCircle,
  X
} from "lucide-react";
import { 
  useTeams, 
  useCreateTeam, 
  useDeleteTeam, 
  useUpdateTeam,
  useTeamMembers,
  useCreateTeamMember,
  useDeleteTeamMember,
  useUpdateTeamMember,
  useAddTeamMember
} from '../hooks/use-teams';
import { useUsers } from '../hooks/use-users';
import type { Team, TeamMember, TeamMemberRole } from '@/lib/types';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { TeamStatsCard } from '@/components/TeamStatsCard';
import { TeamMembersList } from '@/components/TeamMembersList';
import { useTeamStats } from '@/hooks/use-team-stats';

export function TeamsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  
  // Modal states
  const [isCreateTeamDialogOpen, setIsCreateTeamDialogOpen] = useState(false);
  const [isEditTeamDialogOpen, setIsEditTeamDialogOpen] = useState(false);
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
  const [isTeamDetailsDialogOpen, setIsTeamDetailsDialogOpen] = useState(false);
  const [isDeleteTeamDialogOpen, setIsDeleteTeamDialogOpen] = useState(false);
  
  // Form states
  const [newTeam, setNewTeam] = useState({
    name: '',
    description: ''
  });
  
  const [editTeam, setEditTeam] = useState({
    name: '',
    description: ''
  });
  
  const [newMember, setNewMember] = useState({
    user: '',
    role: 'member' as TeamMemberRole,
    is_active: true,
    team: 0
  });

  // React Query hooks
  const { data: teams, isLoading: teamsLoading, error: teamsError } = useTeams({
    search: searchTerm || undefined,
    ordering: 'name'
  });

  const { data: users, isLoading: usersLoading } = useUsers({
    is_active: true,
    ordering: 'first_name'
  });

  const { data: teamMembers, isLoading: membersLoading } = useTeamMembers({
    team: selectedTeam?.id
  });

  // Calculate team stats
  const teamStats = useTeamStats(teamMembers?.data?.results || []);

  // Mutations
  const createTeamMutation = useCreateTeam();
  const updateTeamMutation = useUpdateTeam();
  const deleteTeamMutation = useDeleteTeam();
  const addTeamMemberMutation = useAddTeamMember();
  const deleteTeamMemberMutation = useDeleteTeamMember();
  const updateTeamMemberMutation = useUpdateTeamMember();

  const teamRoles: TeamMemberRole[] = ['leader', 'member', 'consultant'];

  const getRoleIcon = (role: TeamMemberRole) => {
    switch (role) {
      case "leader":
        return <Crown className="w-4 h-4 text-yellow-600" />;
      case "consultant":
        return <Shield className="w-4 h-4 text-blue-600" />;
      default:
        return <Users className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRoleBadge = (role: TeamMemberRole) => {
    const roleColors = {
      leader: 'bg-yellow-100 text-yellow-800',
      member: 'bg-blue-100 text-blue-600',
      consultant: 'bg-purple-100 text-purple-800'
    };

    const roleLabels = {
      leader: 'Leader',
      member: 'Membre',
      consultant: 'Consultant'
    };

    return (
      <Badge className={roleColors[role]}>
        {getRoleIcon(role)}
        <span className="ml-1">{roleLabels[role]}</span>
      </Badge>
    );
  };

  const handleCreateTeam = async () => {
    if (!newTeam.name.trim()) {
      toast.error('Le nom de l\'équipe est requis');
      return;
    }

    try {
      await createTeamMutation.mutateAsync(newTeam);
      setNewTeam({ name: '', description: '' });
      setIsCreateTeamDialogOpen(false);
    } catch (error) {
      console.error('Erreur lors de la création de l\'équipe:', error);
    }
  };

  const handleEditTeam = async () => {
    if (!selectedTeam || !editTeam.name.trim()) {
      toast.error('Le nom de l\'équipe est requis');
      return;
    }

    try {
      await updateTeamMutation.mutateAsync({
        id: selectedTeam.id,
        data: editTeam
      });
      setIsEditTeamDialogOpen(false);
      setSelectedTeam(null);
    } catch (error) {
      console.error('Erreur lors de la modification de l\'équipe:', error);
    }
  };

  const handleDeleteTeam = async () => {
    if (!selectedTeam) return;

    try {
      await deleteTeamMutation.mutateAsync(selectedTeam.id);
      setIsDeleteTeamDialogOpen(false);
      setSelectedTeam(null);
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'équipe:', error);
    }
  };

  const handleAddMember = async () => {
    if (!selectedTeam || !newMember.user) {
      toast.error('Veuillez sélectionner un utilisateur');
      return;
    }

    try {
      await addTeamMemberMutation.mutateAsync({
        teamId: selectedTeam.id,
        data: {
          user: parseInt(newMember.user),
          role: newMember.role,
          is_active: newMember.is_active,
          team: selectedTeam.id
        }
      });
      setNewMember({ user: '', role: 'member', is_active: true, team: selectedTeam.id });
      setIsAddMemberDialogOpen(false);
    } catch (error) {
      console.error('Erreur lors de l\'ajout du membre:', error);
    }
  };

  const handleRemoveMember = async (memberId: number) => {
    if (confirm('Êtes-vous sûr de vouloir retirer ce membre de l\'équipe ?')) {
      try {
        await deleteTeamMemberMutation.mutateAsync(memberId);
        toast.success('Membre retiré de l\'équipe');
      } catch (error) {
        console.error('Erreur lors du retrait du membre:', error);
      }
    }
  };

  const handleUpdateMemberRole = async (memberId: number, newRole: TeamMemberRole) => {
    try {
      await updateTeamMemberMutation.mutateAsync({
        id: memberId,
        data: { role: newRole }
      });
      toast.success('Rôle du membre mis à jour');
    } catch (error) {
      console.error('Erreur lors de la mise à jour du rôle:', error);
      }
  };

  const openTeamDetails = (team: Team) => {
    setSelectedTeam(team);
    setIsTeamDetailsDialogOpen(true);
  };

  const openEditTeam = (team: Team) => {
    setSelectedTeam(team);
    setEditTeam({
      name: team.name,
      description: team.description || ''
    });
    setIsEditTeamDialogOpen(true);
  };

  const openDeleteTeam = (team: Team) => {
    setSelectedTeam(team);
    setIsDeleteTeamDialogOpen(true);
  };

  const filteredTeams = teams?.data?.results || [];

  if (teamsError) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex items-center justify-center h-96">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Erreur de chargement</h3>
              <p className="text-gray-600 mb-4">Impossible de charger les équipes</p>
              <Button onClick={() => window.location.reload()}>Réessayer</Button>
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
          <h1 className="text-2xl font-bold text-gray-900">Gestion des équipes</h1>
          <p className="text-gray-600">Gérez vos équipes et leurs membres</p>
        </div>
        <Button 
          onClick={() => setIsCreateTeamDialogOpen(true)}
          className="bg-blue-600 hover:bg-blue-600"
        >
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle équipe
            </Button>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Recherche et filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Rechercher une équipe..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'grid' | 'table')}>
              <TabsList>
                <TabsTrigger value="grid">Grille</TabsTrigger>
                <TabsTrigger value="table">Tableau</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Teams Content */}
      {teamsLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : filteredTeams.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center h-96">
            <div className="text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune équipe trouvée</h3>
              <p className="text-gray-600 mb-4">Commencez par créer votre première équipe</p>
              <Button onClick={() => setIsCreateTeamDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Créer une équipe
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredTeams.map((team) => (
            <Card key={team.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{team.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {team.description || 'Aucune description'}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => openTeamDetails(team)}>
                        <Eye className="w-4 h-4 mr-2" />
                        Voir les détails
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEditTeam(team)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Modifier
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => openDeleteTeam(team)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Membres</span>
                    <Badge variant="outline">
                      <Users className="w-3 h-3 mr-1" />
                      {team.member_count}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Créée par</span>
                    <span className="text-sm font-medium">
                      {team.created_by_name || 'N/A'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Créée le</span>
                    <span className="text-sm">
                      {team.created_at ? format(new Date(team.created_at), 'PPP', { locale: fr }) : 'N/A'}
                    </span>
                  </div>

                  <div className="pt-3 border-t">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => openTeamDetails(team)}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Gérer l'équipe
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Liste des équipes</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Membres</TableHead>
                  <TableHead>Créée par</TableHead>
                  <TableHead>Date de création</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTeams.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell className="font-medium">{team.name}</TableCell>
                    <TableCell>{team.description || 'Aucune description'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        <Users className="w-3 h-3 mr-1" />
                        {team.member_count}
                      </Badge>
                    </TableCell>
                    <TableCell>{team.created_by_name || 'N/A'}</TableCell>
                    <TableCell>
                      {team.created_at ? format(new Date(team.created_at), 'PPP', { locale: fr }) : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openTeamDetails(team)}>
                            <Eye className="w-4 h-4 mr-2" />
                            Voir les détails
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditTeam(team)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => openDeleteTeam(team)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Create Team Modal */}
      <Dialog open={isCreateTeamDialogOpen} onOpenChange={setIsCreateTeamDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Créer une nouvelle équipe</DialogTitle>
              <DialogDescription>
                Ajoutez une nouvelle équipe à votre organisation.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
              <Label htmlFor="name">Nom de l'équipe *</Label>
                <Input
                  id="name"
                  value={newTeam.name}
                  onChange={(e) => setNewTeam(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Équipe Développement"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
              <Textarea
                  id="description"
                  value={newTeam.description}
                  onChange={(e) => setNewTeam(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Description de l'équipe"
                rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateTeamDialogOpen(false)}
              >
                Annuler
              </Button>
              <Button
                onClick={handleCreateTeam}
                disabled={createTeamMutation.isPending || !newTeam.name.trim()}
              >
                {createTeamMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Créer l'équipe
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      {/* Edit Team Modal */}
      <Dialog open={isEditTeamDialogOpen} onOpenChange={setIsEditTeamDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Modifier l'équipe</DialogTitle>
            <DialogDescription>
              Modifiez les informations de l'équipe.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Nom de l'équipe *</Label>
          <Input
                id="edit-name"
                value={editTeam.name}
                onChange={(e) => setEditTeam(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Équipe Développement"
          />
        </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editTeam.description}
                onChange={(e) => setEditTeam(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Description de l'équipe"
                rows={3}
              />
      </div>
        </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditTeamDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button
              onClick={handleEditTeam}
              disabled={updateTeamMutation.isPending || !editTeam.name.trim()}
            >
              {updateTeamMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Modifier l'équipe
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Team Modal */}
      <Dialog open={isDeleteTeamDialogOpen} onOpenChange={setIsDeleteTeamDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-red-600">Supprimer l'équipe</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer cette équipe ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          {selectedTeam && (
            <div className="py-4">
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>Équipe à supprimer :</strong> {selectedTeam.name}
                  <br />
                  <strong>Membres :</strong> {selectedTeam.member_count}
                </AlertDescription>
              </Alert>
        </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteTeamDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteTeam} disabled={deleteTeamMutation.isPending}
            >
              {deleteTeamMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Supprimer l'équipe
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Team Details Modal with Member Management */}
      <Dialog open={isTeamDetailsDialogOpen} onOpenChange={setIsTeamDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              {selectedTeam?.name} - Gestion des membres
            </DialogTitle>
            <DialogDescription>
              Gérez les membres de l'équipe et leurs rôles.
            </DialogDescription>
          </DialogHeader>

          {selectedTeam && (
            <div className="space-y-6">
              {/* Team Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informations de l'équipe</CardTitle>
              </CardHeader>
              <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-600">Nom :</span>
                      <p className="font-medium">{selectedTeam.name}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Membres :</span>
                      <p className="font-medium">{selectedTeam.member_count}</p>
                  </div>
                    <div>
                      <span className="text-sm text-gray-600">Créée par :</span>
                      <p className="font-medium">{selectedTeam.created_by_name || 'N/A'}</p>
                  </div>
                    <div>
                      <span className="text-sm text-gray-600">Date de création :</span>
                      <p className="font-medium">
                        {selectedTeam.created_at ? format(new Date(selectedTeam.created_at), 'PPP', { locale: fr }) : 'N/A'}
                      </p>
                  </div>
                  </div>
                  {selectedTeam.description && (
                    <div className="mt-4">
                      <span className="text-sm text-gray-600">Description :</span>
                      <p className="mt-1">{selectedTeam.description}</p>
                </div>
                  )}
              </CardContent>
            </Card>
              {/* Team Statistics */}
               <TeamStatsCard
                 totalMembers={teamStats.totalMembers}
                 leaders={teamStats.leaders}
                 members={teamStats.members}
                 consultants={teamStats.consultants}
               />
               {/* Members List */}
               <TeamMembersList
                 members={teamMembers?.data?.results || []}
                 isLoading={membersLoading}
                 onAddMember={() => setIsAddMemberDialogOpen(true)}
                 onRemoveMember={handleRemoveMember}
                 onUpdateMemberRole={handleUpdateMemberRole}
               />
        </div>
      )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsTeamDetailsDialogOpen(false)}
            >
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Member Modal */}
      <Dialog open={isAddMemberDialogOpen} onOpenChange={setIsAddMemberDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Ajouter un membre à l'équipe</DialogTitle>
            <DialogDescription>
              Sélectionnez un utilisateur et définissez son rôle dans l'équipe.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="user">Utilisateur *</Label>
              <Select value={newMember.user} onValueChange={(value) => setNewMember(prev => ({ ...prev, user: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un utilisateur" />
                </SelectTrigger>
                <SelectContent>
                  {users?.data?.results?.map(user => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.full_name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Rôle</Label>
              <Select value={newMember.role} onValueChange={(value) => setNewMember(prev => ({ ...prev, role: value as TeamMemberRole }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {teamRoles.map(role => (
                    <SelectItem key={role} value={role}>
                      {getRoleBadge(role)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddMemberDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button
              onClick={handleAddMember}
              disabled={addTeamMemberMutation.isPending || !newMember.user}
            >
              {addTeamMemberMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Ajouter le membre
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 