import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  UserPlus, 
  Search, 
  MoreHorizontal, 
  Crown, 
  Shield, 
  Users, 
  UserMinus, 
  Mail, 
  Phone,
  Loader2
} from "lucide-react";
import type { TeamMember, TeamMemberRole } from '@/lib/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface TeamMembersListProps {
  members: TeamMember[];
  isLoading?: boolean;
  onAddMember: () => void;
  onRemoveMember: (memberId: number) => void;
  onUpdateMemberRole: (memberId: number, newRole: TeamMemberRole) => void;
}

export function TeamMembersList({
  members,
  isLoading = false,
  onAddMember,
  onRemoveMember,
  onUpdateMemberRole
}: TeamMembersListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<TeamMemberRole | 'all'>('all');

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

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.user_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Membres de l'équipe ({members.length})</CardTitle>
          <Button onClick={onAddMember} size="sm">
            <UserPlus className="w-4 h-4 mr-2" />
            Ajouter un membre
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Rechercher un membre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as TeamMemberRole | 'all')}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrer par rôle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les rôles</SelectItem>
              <SelectItem value="leader">Leaders</SelectItem>
              <SelectItem value="member">Membres</SelectItem>
              <SelectItem value="consultant">Consultants</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Members List */}
        {filteredMembers.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {members.length === 0 ? 'Aucun membre' : 'Aucun membre trouvé'}
            </h3>
            <p className="text-gray-600 mb-4">
              {members.length === 0 
                ? "Cette équipe n'a pas encore de membres" 
                : "Essayez d'ajuster vos filtres de recherche"
              }
            </p>
            {members.length === 0 && (
              <Button onClick={onAddMember}>
                <UserPlus className="w-4 h-4 mr-2" />
                Ajouter le premier membre
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      {member.user_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-900">{member.user_name}</h4>
                      {getRoleBadge(member.role)}
                    </div>
                                         <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                       <div className="flex items-center gap-1">
                         <Users className="w-3 h-3" />
                         <span>Membre depuis {format(new Date(member.joined_at), 'PPP', { locale: fr })}</span>
                       </div>
                     </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={member.role}
                    onValueChange={(newRole) => onUpdateMemberRole(member.id, newRole as TeamMemberRole)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {teamRoles.map(role => (
                        <SelectItem key={role} value={role}>
                          {role === 'leader' ? 'Leader' : role === 'member' ? 'Membre' : 'Consultant'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => onRemoveMember(member.id)}
                        className="text-red-600"
                      >
                        <UserMinus className="w-4 h-4 mr-2" />
                        Retirer de l'équipe
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 