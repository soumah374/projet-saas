import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Checkbox } from '../ui/checkbox';
import { ArrowLeft, Search, UserPlus } from 'lucide-react';
import { useUsers } from '../../hooks/use-users';
import { useAddGroupMembers } from '../../hooks/use-chat';

interface AddMemberViewProps {
  conversationId: string;
  currentMemberIds: string[];
  onBack: () => void;
  onMembersAdded: () => void;
}

export function AddMemberView({
  conversationId,
  currentMemberIds,
  onBack,
  onMembersAdded,
}: AddMemberViewProps) {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { data: usersResponse, isLoading: isLoadingUsers } = useUsers({
    search: searchQuery,
  });
  const addGroupMembersMutation = useAddGroupMembers();

  const availableUsers = (usersResponse?.data?.results || []).filter(
    (user: any) => !currentMemberIds.includes(String(user.id))
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
      onMembersAdded();
    } catch (error) {
      console.error('Error adding members:', error);
    }
  };

  return (
    <div className="absolute inset-0 bg-background z-20 flex flex-col animate-in fade-in duration-200">
      <div className="flex items-center gap-2 p-3 border-b">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="font-semibold text-lg">Ajouter des membres</h2>
      </div>

      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher des utilisateurs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        {isLoadingUsers ? (
          <div className="text-center text-sm text-muted-foreground py-8">
            Chargement des utilisateurs...
          </div>
        ) : availableUsers.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-8">
            {searchQuery ? 'Aucun utilisateur trouvé' : 'Tous les utilisateurs sont déjà membres'}
          </div>
        ) : (
          <div className="space-y-2">
            {availableUsers.map((user: any) => {
              const userId = String(user.id);
              return (
                <div
                  key={userId}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border"
                >
                  <Checkbox
                    id={`user-${userId}`}
                    checked={selectedUsers.includes(userId)}
                    onCheckedChange={() => handleUserToggle(userId)}
                  />
                  <label
                    htmlFor={`user-${userId}`}
                    className="flex items-center gap-3 cursor-pointer flex-1"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {user.first_name?.[0]}{user.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {user.first_name} {user.last_name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {user.email}
                      </span>
                    </div>
                  </label>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      <div className="p-4 border-t bg-muted/5 flex justify-end gap-2">
        <Button variant="outline" onClick={onBack}>
          Annuler
        </Button>
        <Button
          onClick={handleAddMembers}
          disabled={selectedUsers.length === 0 || addGroupMembersMutation.isPending}
        >
          <UserPlus className="h-4 w-4 mr-2" />
          {addGroupMembersMutation.isPending
            ? 'Ajout en cours...'
            : `Ajouter ${selectedUsers.length > 0 ? `(${selectedUsers.length})` : ''}`}
        </Button>
      </div>
    </div>
  );
}
