import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  Loader2
} from "lucide-react";
import { useTeams, useCreateTeam, useDeleteTeam } from '../hooks/use-teams';
import { useUsers } from '../hooks/use-users';
import { Team, TeamMember } from '../lib/api';

export function TeamsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | undefined>(undefined);
  const [isCreateTeamDialogOpen, setIsCreateTeamDialogOpen] = useState(false);
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
  const [newTeam, setNewTeam] = useState({
    name: '',
    description: ''
  });

  // React Query hooks
  const { data: teams, isLoading: teamsLoading, error: teamsError } = useTeams({
    search: searchTerm || undefined,
    is_active: isActiveFilter,
    ordering: 'name'
  });

  const { data: users, isLoading: usersLoading } = useUsers({
    is_active: true,
    ordering: 'first_name'
  });

  const createTeamMutation = useCreateTeam();
  const deleteTeamMutation = useDeleteTeam();

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "Chef de projet":
        return <Crown className="w-4 h-4" />;
      case "Développeur Senior":
      case "DevOps":
        return <Shield className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800";
  };

  const handleCreateTeam = async () => {
    if (!newTeam.name.trim()) return;

    try {
      await createTeamMutation.mutateAsync(newTeam);
      setNewTeam({ name: '', description: '' });
      setIsCreateTeamDialogOpen(false);
    } catch (error) {
      console.error('Erreur lors de la création de l\'équipe:', error);
    }
  };

  const handleDeleteTeam = async (teamId: number) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette équipe ?')) {
      try {
        await deleteTeamMutation.mutateAsync(teamId);
      } catch (error) {
        console.error('Erreur lors de la suppression de l\'équipe:', error);
      }
    }
  };

  const filteredTeams = teams || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Équipes</h1>
          <p className="text-gray-600 mt-1">Gérez vos équipes et leurs membres</p>
        </div>
        <Dialog open={isCreateTeamDialogOpen} onOpenChange={setIsCreateTeamDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle équipe
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Créer une nouvelle équipe</DialogTitle>
              <DialogDescription>
                Ajoutez une nouvelle équipe à votre organisation.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nom de l'équipe</Label>
                <Input
                  id="name"
                  value={newTeam.name}
                  onChange={(e) => setNewTeam(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Équipe Développement"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={newTeam.description}
                  onChange={(e) => setNewTeam(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Description de l'équipe"
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
      </div>

      {/* Filters */}
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
        <Select value={isActiveFilter?.toString() || 'all'} onValueChange={(value) => {
          if (value === 'all') setIsActiveFilter(undefined);
          else setIsActiveFilter(value === 'true');
        }}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="true">Actives</SelectItem>
            <SelectItem value="false">Inactives</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Teams Grid */}
      {teamsLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : teamsError ? (
        <div className="text-center py-12">
          <p className="text-red-600">Erreur lors du chargement des équipes</p>
        </div>
      ) : filteredTeams.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune équipe trouvée</h3>
          <p className="text-gray-600">Commencez par créer votre première équipe.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredTeams.map((team) => (
            <Card key={team.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{team.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {team.description}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTeam(team.id)}
                      disabled={deleteTeamMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Team Stats */}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Membres</span>
                    <span className="font-medium">{team.member_count}</span>
                  </div>
                  
                  {/* Status */}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">Statut</span>
                    <Badge className={getStatusColor(team.is_active)}>
                      {team.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>

                  {/* Created by */}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">Créée par</span>
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="text-xs">
                          {team.created_by?.first_name?.[0] || ''}{team.created_by?.last_name?.[0] || ''}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">
                        {team.created_by?.first_name || ''} {team.created_by?.last_name || ''}
                      </span>
                    </div>
                  </div>

                  {/* Created date */}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Créée le</span>
                    <span>{team.created_at ? new Date(team.created_at).toLocaleDateString('fr-FR') : 'N/A'}</span>
                  </div>

                  {/* Team Members Preview */}
                  {team.team_members && team.team_members.length > 0 && (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600 text-sm">Membres</span>
                        <Button variant="ghost" size="sm">
                          <UserPlus className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {team.team_members.slice(0, 3).map((member) => (
                          <div key={member.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Avatar className="w-6 h-6">
                                <AvatarFallback className="text-xs">
                                  {member.user?.first_name?.[0] || ''}{member.user?.last_name?.[0] || ''}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm">
                                {member.user?.first_name || ''} {member.user?.last_name || ''}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              {getRoleIcon(member.role)}
                              <span className="text-xs text-gray-500">{member.role}</span>
                            </div>
                          </div>
                        ))}
                        {team.team_members.length > 3 && (
                          <div className="text-xs text-gray-500 text-center">
                            +{team.team_members.length - 3} autres membres
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 