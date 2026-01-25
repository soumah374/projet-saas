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
import { MoreVertical, Shield, UserMinus, Crown } from 'lucide-react';
import { ConversationMember, useRemoveGroupMember } from '../../hooks/use-chat';

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
  const removeGroupMemberMutation = useRemoveGroupMember();

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

  const sortedMembers = [...members].sort((a, b) => {
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
          <div className="mb-4">
            <h3 className="font-semibold text-sm text-muted-foreground mb-1">
              {groupName || 'Groupe'}
            </h3>
            <p className="text-xs text-muted-foreground">
              Membres ({members.length})
            </p>
          </div>

          {sortedMembers.map((member) => {
            const isCurrentUser = member.user.id === currentUserId;
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
                  <div className="flex items-center gap-2">
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
                        <DropdownMenuItem disabled>
                          <Shield className="h-4 w-4 mr-2" />
                          Promouvoir admin
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
    </>
  );
}
