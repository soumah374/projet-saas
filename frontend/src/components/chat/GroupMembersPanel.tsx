import { useState } from 'react';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { MoreVertical, Shield, ShieldOff, UserMinus, Crown, UserPlus, Search } from 'lucide-react';
import { Input } from '../ui/input';
import { ConversationMember, useRemoveGroupMember, useAddGroupMembers, usePromoteGroupMember } from '../../hooks/use-chat';
import { useUsers } from '../../hooks/use-users';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Checkbox } from '../ui/checkbox';

interface GroupMembersPanelProps {
  members: ConversationMember[];
  conversationId: string;
  isAdmin: boolean;
  currentUserId: string;
  groupName?: string;
  onMemberRemoved?: () => void;
}

export function GroupMembersPanel({
  members,
  conversationId,
  isAdmin,
  currentUserId,
  groupName,
  onMemberRemoved,
}: GroupMembersPanelProps) {
  const [memberToRemove, setMemberToRemove] = useState<ConversationMember | null>(null);
  const [memberToPromote, setMemberToPromote] = useState<ConversationMember | null>(null);
  const [memberToDemote, setMemberToDemote] = useState<ConversationMember | null>(null);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [memberSearch, setMemberSearch] = useState('');
  const removeGroupMemberMutation = useRemoveGroupMember();
  const addGroupMembersMutation = useAddGroupMembers();
  const promoteMemberMutation = usePromoteGroupMember();
  const { data: usersResponse, isLoading: isLoadingUsers } = useUsers({});

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;

    try {
      await removeGroupMemberMutation.mutateAsync({
        conversationId,
        userId: memberToRemove.user.id,
      });
      onMemberRemoved?.();
    } catch (error) {
      console.error('Error removing member:', error);
    } finally {
      setMemberToRemove(null);
    }
  };

  const handlePromoteMember = async () => {
    if (!memberToPromote) return;

    try {
      await promoteMemberMutation.mutateAsync({
        conversationId,
        userId: memberToPromote.user.id,
        role: 'admin',
      });
      onMemberRemoved?.();
    } catch (error) {
      console.error('Error promoting member:', error);
    } finally {
      setMemberToPromote(null);
    }
  };

  const handleDemoteMember = async () => {
    if (!memberToDemote) return;

    try {
      await promoteMemberMutation.mutateAsync({
        conversationId,
        userId: memberToDemote.user.id,
        role: 'member',
      });
      onMemberRemoved?.();
    } catch (error) {
      console.error('Error demoting member:', error);
    } finally {
      setMemberToDemote(null);
    }
  };

  const adminCount = members.filter((m) => m.role === 'admin').length;

  const handleUserToggle = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleAddMembers = async () => {
    if (selectedUsers.length === 0) return;

    try {
      await addGroupMembersMutation.mutateAsync({
        conversationId,
        userIds: selectedUsers,
      });
      setSelectedUsers([]);
      setShowAddMembers(false);
      onMemberRemoved?.(); // Refresh conversation data
    } catch (error) {
      console.error('Error adding members:', error);
    }
  };

  // Convert all member IDs to strings for consistent comparison
  const currentMemberIds = members.map((m) => String(m.user.id));
  const availableUsers = (usersResponse?.data?.results || []).filter(
    (user: any) => {
      const userId = String(user.id);
      return !currentMemberIds.includes(userId) && userId !== String(currentUserId);
    }
  );

  const sortedMembers = [...members]
    .filter((member) => {
      if (!memberSearch.trim()) return true;
      const searchLower = memberSearch.toLowerCase();
      return (
        member.user.fullName.toLowerCase().includes(searchLower) ||
        member.user.email?.toLowerCase().includes(searchLower) ||
        member.user.username.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => {
      // Admins first
      if (a.role === 'admin' && b.role !== 'admin') return -1;
      if (a.role !== 'admin' && b.role === 'admin') return 1;
      // Then by name
      return a.user.fullName.localeCompare(b.user.fullName);
    });

  return (
    <>
      <ScrollArea className="h-full">
        <div className="p-4 space-y-2">
          <div className="mb-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-muted-foreground">
                {groupName || 'Groupe'}
              </h3>
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddMembers(true)}
                  className="h-6 px-2 text-xs"
                >
                  <UserPlus className="h-3 w-3 mr-1" />
                  Ajouter
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Membres ({members.length})
            </p>
            {members.length > 5 && (
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className="h-7 pl-7 text-xs"
                />
              </div>
            )}
          </div>

          {sortedMembers.map((member) => {
            const isCurrentUser = String(member.user.id) === String(currentUserId);
            const isMemberAdmin = member.role === 'admin';

            return (
              <div
                key={member.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <Avatar className="h-10 w-10">
                  <AvatarFallback>
                    {member.user.fullName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">
                      {member.user.fullName}
                      {isCurrentUser && (
                        <span className="text-muted-foreground"> (vous)</span>
                      )}
                    </p>
                  </div>
                  {member.user.email && (
                    <p className="text-xs text-muted-foreground truncate">
                      {member.user.email}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    {isMemberAdmin && (
                      <Badge
                        variant="secondary"
                        className="text-xs h-5 px-1.5 bg-amber-100 text-amber-800"
                      >
                        <Crown className="h-3 w-3 mr-1" />
                        Admin
                      </Badge>
                    )}
                    {member.isMuted && (
                      <Badge variant="outline" className="text-xs h-5 px-1.5">
                        Muet
                      </Badge>
                    )}
                  </div>
                </div>

                {isAdmin && !isCurrentUser && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {!isMemberAdmin && (
                        <DropdownMenuItem onClick={() => setMemberToPromote(member)}>
                          <Shield className="h-4 w-4 mr-2" />
                          Promouvoir admin
                        </DropdownMenuItem>
                      )}
                      {isMemberAdmin && adminCount > 1 && (
                        <DropdownMenuItem onClick={() => setMemberToDemote(member)}>
                          <ShieldOff className="h-4 w-4 mr-2" />
                          Retirer admin
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setMemberToRemove(member)}
                      >
                        <UserMinus className="h-4 w-4 mr-2" />
                        Retirer du groupe
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Confirmation dialog for removing member */}
      <AlertDialog open={!!memberToRemove} onOpenChange={() => setMemberToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retirer ce membre ?</AlertDialogTitle>
            <AlertDialogDescription>
              Voulez-vous vraiment retirer{' '}
              <strong>{memberToRemove?.user.fullName}</strong> du groupe ? Cette
              personne ne pourra plus voir les messages du groupe.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removeGroupMemberMutation.isPending ? 'Suppression...' : 'Retirer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmation dialog for promoting member */}
      <AlertDialog open={!!memberToPromote} onOpenChange={() => setMemberToPromote(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Promouvoir administrateur ?</AlertDialogTitle>
            <AlertDialogDescription>
              Voulez-vous promouvoir{' '}
              <strong>{memberToPromote?.user.fullName}</strong> en tant qu'administrateur ?
              Cette personne pourra gérer les membres et les paramètres du groupe.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handlePromoteMember}>
              {promoteMemberMutation.isPending ? 'Promotion...' : 'Promouvoir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmation dialog for demoting member */}
      <AlertDialog open={!!memberToDemote} onOpenChange={() => setMemberToDemote(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retirer les droits d'administrateur ?</AlertDialogTitle>
            <AlertDialogDescription>
              Voulez-vous retirer les droits d'administrateur de{' '}
              <strong>{memberToDemote?.user.fullName}</strong> ? Cette personne ne pourra
              plus gérer les membres ni les paramètres du groupe.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDemoteMember}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {promoteMemberMutation.isPending ? 'Rétrogradation...' : 'Rétrograder'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog for adding members */}
      <Dialog open={showAddMembers} onOpenChange={setShowAddMembers}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter des membres</DialogTitle>
            <DialogDescription>
              Sélectionnez les utilisateurs à ajouter au groupe {groupName || 'ce groupe'}.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-60 overflow-y-auto space-y-2">
            {isLoadingUsers ? (
              <div className="text-sm text-muted-foreground">Chargement...</div>
            ) : availableUsers.length === 0 ? (
              <div className="text-sm text-muted-foreground">Tous les utilisateurs sont déjà membres</div>
            ) : (
              availableUsers.map((user: any) => {
                const userId = String(user.id);
                return (
                <div key={userId} className="flex items-center space-x-2">
                  <Checkbox
                    id={`user-${userId}`}
                    checked={selectedUsers.includes(userId)}
                    onCheckedChange={() => handleUserToggle(userId)}
                  />
                  <label
                    htmlFor={`user-${user.id}`}
                    className="flex items-center space-x-2 cursor-pointer flex-1"
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {user.first_name?.[0]}{user.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">
                      {user.first_name} {user.last_name}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </span>
                  </label>
                </div>
              );
            })
          )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedUsers([]);
                setShowAddMembers(false);
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={handleAddMembers}
              disabled={selectedUsers.length === 0 || addGroupMembersMutation.isPending}
            >
              {addGroupMembersMutation.isPending ? 'Ajout...' : `Ajouter (${selectedUsers.length})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
