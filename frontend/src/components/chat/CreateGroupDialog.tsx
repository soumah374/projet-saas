import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import { Search, X, Users } from 'lucide-react';
import { useUsers } from '../../hooks/use-users';
import { useCreateGroupConversation } from '../../hooks/use-chat';

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGroupCreated?: (conversationId: string) => void;
}

export function CreateGroupDialog({
  open,
  onOpenChange,
  onGroupCreated,
}: CreateGroupDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: usersResponse, isLoading: isLoadingUsers } = useUsers({ search: searchQuery });
  const createGroupMutation = useCreateGroupConversation();

  const users = usersResponse?.data?.results || [];
  const currentUserId = localStorage.getItem('user_id');

  const filteredUsers = users.filter(
    (user: any) => user.id?.toString() !== currentUserId
  );

  const handleUserToggle = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers((prev) => prev.filter((id) => id !== userId));
  };

  const handleCreate = async () => {
    if (!name.trim() || selectedUsers.length === 0) return;

    try {
      const conversation = await createGroupMutation.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        participantIds: selectedUsers,
      });

      if (conversation?.id && onGroupCreated) {
        onGroupCreated(conversation.id);
      }

      // Reset form
      setName('');
      setDescription('');
      setSelectedUsers([]);
      setSearchQuery('');
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };

  const getSelectedUsersInfo = () => {
    return selectedUsers
      .map((id) => users.find((u: any) => u.id?.toString() === id))
      .filter(Boolean);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Nouveau groupe
          </DialogTitle>
          <DialogDescription>
            Créez un groupe de discussion avec plusieurs participants.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Group name */}
          <div className="space-y-2">
            <Label htmlFor="name">Nom du groupe *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Équipe projet Alpha"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description du groupe (optionnel)"
              rows={2}
            />
          </div>

          {/* Selected users */}
          {selectedUsers.length > 0 && (
            <div className="space-y-2">
              <Label>Membres sélectionnés ({selectedUsers.length})</Label>
              <div className="flex flex-wrap gap-2">
                {getSelectedUsersInfo().map((user: any) => (
                  <Badge
                    key={user.id}
                    variant="secondary"
                    className="flex items-center gap-1 pr-1"
                  >
                    <span>
                      {user.first_name} {user.last_name}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 hover:bg-transparent"
                      onClick={() => handleRemoveUser(user.id.toString())}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* User search */}
          <div className="space-y-2">
            <Label>Ajouter des participants *</Label>
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
          <ScrollArea className="h-48 rounded-md border">
            {isLoadingUsers ? (
              <div className="p-4 text-center text-muted-foreground">
                Chargement...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                Aucun utilisateur trouvé
              </div>
            ) : (
              <div className="p-2">
                {filteredUsers.map((user: any) => {
                  const userId = user.id?.toString();
                  const isSelected = selectedUsers.includes(userId);
                  const fullName =
                    `${user.first_name || ''} ${user.last_name || ''}`.trim() ||
                    user.username;

                  return (
                    <label
                      key={userId}
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-muted cursor-pointer"
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleUserToggle(userId)}
                      />
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleCreate}
            disabled={
              !name.trim() ||
              selectedUsers.length === 0 ||
              createGroupMutation.isPending
            }
          >
            {createGroupMutation.isPending ? 'Création...' : 'Créer le groupe'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
