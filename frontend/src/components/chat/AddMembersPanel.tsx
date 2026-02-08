import { useState } from 'react';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Checkbox } from '../ui/checkbox';
import { Search, ArrowLeft, UserPlus } from 'lucide-react';
import { Input } from '../ui/input';
import { useUsers } from '../../hooks/use-users';
import { useAddGroupMembers, ConversationMember } from '../../hooks/use-chat';

interface AddMembersPanelProps {
  conversationId: string;
  currentMembers: ConversationMember[];
  currentUserId: string;
  groupName?: string;
  onClose: () => void;
  onMembersAdded?: () => void;
}

export function AddMembersPanel({
  conversationId,
  currentMembers,
  currentUserId,
  groupName,
  onClose,
  onMembersAdded,
}: AddMembersPanelProps) {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: usersResponse, isLoading: isLoadingUsers } = useUsers({ search: searchQuery });
  const addGroupMembersMutation = useAddGroupMembers();

  // Convert all member IDs to strings for consistent comparison
  const currentMemberIds = currentMembers.map((m) => String(m.user.id));
  const availableUsers = (usersResponse?.data?.results || []).filter(
    (user: any) => {
      const userId = String(user.id);
      return !currentMemberIds.includes(userId) && userId !== String(currentUserId);
    }
  );

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
      onMembersAdded?.();
      onClose();
    } catch (error) {
      console.error('Error adding members:', error);
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          <div>
            <h3 className="font-semibold text-sm">Ajouter des membres</h3>
            <p className="text-xs text-muted-foreground">{groupName || 'Groupe'}</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher des utilisateurs..."
            className="pl-10"
          />
        </div>
      </div>

      {/* User list */}
      <ScrollArea className="flex-1">
        {isLoadingUsers ? (
          <div className="p-4 text-center text-muted-foreground text-sm">
            Chargement...
          </div>
        ) : availableUsers.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground text-sm">
            {searchQuery ? 'Aucun utilisateur trouvé' : 'Tous les utilisateurs sont déjà membres'}
          </div>
        ) : (
          <div className="p-2">
            {availableUsers.map((user: any) => {
              const userId = String(user.id);
              const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username;
              const isSelected = selectedUsers.includes(userId);

              return (
                <label
                  key={userId}
                  className="flex items-center gap-3 p-3 rounded-md hover:bg-muted cursor-pointer"
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handleUserToggle(userId)}
                  />
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {fullName
                        .split(' ')
                        .map((n: string) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{fullName}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t flex justify-between items-center">
        <span className="text-sm text-muted-foreground">
          {selectedUsers.length} sélectionné{selectedUsers.length > 1 ? 's' : ''}
        </span>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button
            onClick={handleAddMembers}
            disabled={selectedUsers.length === 0 || addGroupMembersMutation.isPending}
          >
            {addGroupMembersMutation.isPending ? 'Ajout...' : 'Ajouter'}
          </Button>
        </div>
      </div>
    </div>
  );
}
