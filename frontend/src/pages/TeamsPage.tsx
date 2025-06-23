import { useState, useEffect } from 'react';
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
  Shield
} from "lucide-react";

interface TeamMember {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  avatar?: string;
  join_date: string;
  status: string;
  projects_count: number;
}

interface Team {
  id: number;
  name: string;
  description: string;
  members: TeamMember[];
  leader: TeamMember;
  project_count: number;
  created_date: string;
}

export function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [isCreateTeamDialogOpen, setIsCreateTeamDialogOpen] = useState(false);
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
  const [newTeam, setNewTeam] = useState({
    name: '',
    description: '',
    leader_id: ''
  });

  useEffect(() => {
    // Simuler le chargement des données
    const mockMembers: TeamMember[] = [
      {
        id: 1,
        first_name: "Marie",
        last_name: "Dupont",
        email: "marie.dupont@sakom.com",
        phone: "+33 1 23 45 67 89",
        role: "Chef de projet",
        department: "Développement",
        join_date: "2023-01-15",
        status: "Actif",
        projects_count: 3
      },
      {
        id: 2,
        first_name: "Jean",
        last_name: "Martin",
        email: "jean.martin@sakom.com",
        phone: "+33 1 23 45 67 90",
        role: "Développeur Senior",
        department: "Développement",
        join_date: "2022-08-20",
        status: "Actif",
        projects_count: 5
      },
      {
        id: 3,
        first_name: "Sophie",
        last_name: "Bernard",
        email: "sophie.bernard@sakom.com",
        phone: "+33 1 23 45 67 91",
        role: "Designer UX/UI",
        department: "Design",
        join_date: "2023-03-10",
        status: "Actif",
        projects_count: 4
      },
      {
        id: 4,
        first_name: "Pierre",
        last_name: "Durand",
        email: "pierre.durand@sakom.com",
        phone: "+33 1 23 45 67 92",
        role: "DevOps",
        department: "Infrastructure",
        join_date: "2022-11-05",
        status: "Actif",
        projects_count: 6
      },
      {
        id: 5,
        first_name: "Emma",
        last_name: "Leroy",
        email: "emma.leroy@sakom.com",
        phone: "+33 1 23 45 67 93",
        role: "Développeuse Frontend",
        department: "Développement",
        join_date: "2023-06-15",
        status: "Actif",
        projects_count: 2
      }
    ];

    const mockTeams: Team[] = [
      {
        id: 1,
        name: "Équipe Développement Web",
        description: "Équipe spécialisée dans le développement web moderne",
        members: [mockMembers[0], mockMembers[1], mockMembers[4]],
        leader: mockMembers[0],
        project_count: 3,
        created_date: "2023-01-15"
      },
      {
        id: 2,
        name: "Équipe Design & UX",
        description: "Équipe créative pour l'expérience utilisateur",
        members: [mockMembers[2]],
        leader: mockMembers[2],
        project_count: 2,
        created_date: "2023-03-10"
      },
      {
        id: 3,
        name: "Équipe Infrastructure",
        description: "Équipe technique pour l'infrastructure et le déploiement",
        members: [mockMembers[3]],
        leader: mockMembers[3],
        project_count: 4,
        created_date: "2022-11-05"
      }
    ];

    setMembers(mockMembers);
    setTeams(mockTeams);
  }, []);

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Actif":
        return "bg-blue-100 text-blue-800";
      case "Inactif":
        return "bg-gray-100 text-gray-800";
      case "En congé":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getDepartmentColor = (department: string) => {
    switch (department) {
      case "Développement":
        return "bg-blue-100 text-blue-800";
      case "Design":
        return "bg-blue-100 text-blue-800";
      case "Infrastructure":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Équipes</h1>
          <p className="text-gray-600">
            Gérez vos équipes et leurs membres
          </p>
        </div>
        <div className="flex space-x-2">
          <Dialog open={isAddMemberDialogOpen} onOpenChange={setIsAddMemberDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <UserPlus className="w-4 h-4 mr-2" />
                Ajouter un membre
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajouter un nouveau membre</DialogTitle>
                <DialogDescription>
                  Invitez un nouveau membre dans votre équipe
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="first_name">Prénom</Label>
                    <Input id="first_name" placeholder="Prénom" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="last_name">Nom</Label>
                    <Input id="last_name" placeholder="Nom" />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="email@exemple.com" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role">Rôle</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un rôle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="developer">Développeur</SelectItem>
                      <SelectItem value="designer">Designer</SelectItem>
                      <SelectItem value="manager">Chef de projet</SelectItem>
                      <SelectItem value="devops">DevOps</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddMemberDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={() => setIsAddMemberDialogOpen(false)}>
                  Ajouter le membre
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Dialog open={isCreateTeamDialogOpen} onOpenChange={setIsCreateTeamDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle équipe
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer une nouvelle équipe</DialogTitle>
                <DialogDescription>
                  Créez une nouvelle équipe pour organiser vos projets
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="team_name">Nom de l'équipe</Label>
                  <Input 
                    id="team_name" 
                    placeholder="Nom de l'équipe"
                    value={newTeam.name}
                    onChange={(e) => setNewTeam({...newTeam, name: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Input 
                    id="description" 
                    placeholder="Description de l'équipe"
                    value={newTeam.description}
                    onChange={(e) => setNewTeam({...newTeam, description: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="leader">Chef d'équipe</Label>
                  <Select value={newTeam.leader_id} onValueChange={(value) => setNewTeam({...newTeam, leader_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un chef d'équipe" />
                    </SelectTrigger>
                    <SelectContent>
                      {members.map((member) => (
                        <SelectItem key={member.id} value={member.id.toString()}>
                          {member.first_name} {member.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateTeamDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={() => setIsCreateTeamDialogOpen(false)}>
                  Créer l'équipe
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher un membre ou une équipe..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filtrer par département" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les départements</SelectItem>
            <SelectItem value="Développement">Développement</SelectItem>
            <SelectItem value="Design">Design</SelectItem>
            <SelectItem value="Infrastructure">Infrastructure</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total équipes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teams.length}</div>
            <p className="text-xs text-muted-foreground">
              Équipes actives
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total membres</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{members.length}</div>
            <p className="text-xs text-muted-foreground">
              Membres actifs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projets actifs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {teams.reduce((acc, team) => acc + team.project_count, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Projets en cours
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Équipes */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Équipes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <Card key={team.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{team.name}</CardTitle>
                    <CardDescription className="mt-2">
                      {team.description}
                    </CardDescription>
                  </div>
                  <div className="flex space-x-1">
                    <Button variant="ghost" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={team.leader.avatar} />
                      <AvatarFallback>
                        {team.leader.first_name[0]}{team.leader.last_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">
                        {team.leader.first_name} {team.leader.last_name}
                      </p>
                      <p className="text-xs text-gray-500">Chef d'équipe</p>
                    </div>
                  </div>
                  <Badge variant="outline">
                    {team.members.length} membres
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Projets actifs</span>
                    <span>{team.project_count}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Créée le</span>
                    <span>{new Date(team.created_date).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1">
                  {team.members.slice(0, 3).map((member) => (
                    <Avatar key={member.id} className="w-6 h-6">
                      <AvatarImage src={member.avatar} />
                      <AvatarFallback className="text-xs">
                        {member.first_name[0]}{member.last_name[0]}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {team.members.length > 3 && (
                    <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs">
                      +{team.members.length - 3}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Membres */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Membres de l'équipe</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {members.map((member) => (
            <Card key={member.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={member.avatar} />
                      <AvatarFallback>
                        {member.first_name[0]}{member.last_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">
                        {member.first_name} {member.last_name}
                      </CardTitle>
                      <CardDescription>
                        {member.role}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <Button variant="ghost" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge className={getStatusColor(member.status)}>
                    {member.status}
                  </Badge>
                  <Badge className={getDepartmentColor(member.department)}>
                    {member.department}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span>{member.email}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{member.phone}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>Arrivé le {new Date(member.join_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span>{member.projects_count} projets</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
} 