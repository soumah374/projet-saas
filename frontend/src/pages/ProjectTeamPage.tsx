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
  MoreHorizontal
} from "lucide-react";
import { projectApi, Project } from '@/lib/api';

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
  const [project, setProject] = useState<Project | null>(null);
  const [teamMembers, setTeamMembers] = useState<ProjectMember[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (projectId) {
      loadProjectTeam();
    }
  }, [projectId]);

  const loadProjectTeam = async () => {
    try {
      setIsLoading(true);
      const projectData = await projectApi.getProject(projectId!);
      setProject(projectData);
      setTeamMembers(projectData.team_members || []);
    } catch (err) {
      setError('Erreur lors du chargement de l\'équipe du projet');
      console.error('Error loading project team:', err);
    } finally {
      setIsLoading(false);
    }
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

  const roles = ['Chef de projet', 'Designer', 'Développeur', 'Développeur Senior', 'Rédacteur', 'Consultant', 'Assistant'];

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
                Ajoutez un nouveau membre à l'équipe du projet.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="user">Utilisateur</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un utilisateur" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Marie Dupont (marie.dupont@sakom.com)</SelectItem>
                    <SelectItem value="2">Jean Martin (jean.martin@sakom.com)</SelectItem>
                    <SelectItem value="3">Sophie Bernard (sophie.bernard@sakom.com)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="role">Rôle</Label>
                <Select>
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
              <Button onClick={() => setIsAddMemberDialogOpen(false)}>
                Ajouter
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
          </div>
        </CardContent>
      </Card>

      {/* Team Members Grid */}
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
                <Button variant="outline" size="sm" className="flex-1">
                  <Edit className="w-4 h-4 mr-2" />
                  Modifier
                </Button>
                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

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
                <UserPlus className="w-4 h-4 mr-2" />
                Ajouter le premier membre
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
} 