import { useState, useEffect } from 'react';
import { useUsers } from '../../hooks/use-users';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Search, User } from 'lucide-react';
import { cn } from '../../lib/utils';

interface UserSelectorProps {
  onSelectUser: (userId: string) => void;
  onClose?: () => void;
  excludeUserIds?: string[];
}

export function UserSelector({ onSelectUser, onClose, excludeUserIds = [] }: UserSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: usersResponse, isLoading } = useUsers({
    search: searchQuery || undefined,
    is_active: true,
    page_size: 50,
  });

  const users = usersResponse?.data?.results || [];
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUserId = currentUser.id?.toString();

  // Filtrer l'utilisateur actuel et les utilisateurs exclus
  const filteredUsers = users.filter((user: any) => {
    const userId = user.id?.toString();
    return userId !== currentUserId && !excludeUserIds.includes(userId);
  });

  const handleSelectUser = (userId: string) => {
    onSelectUser(userId);
    onClose?.();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un utilisateur..."
            className="pl-10"
            autoFocus
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="p-4 text-sm text-muted-foreground text-center">
            Chargement...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground text-center">
            {searchQuery ? 'Aucun utilisateur trouvé' : 'Aucun utilisateur disponible'}
          </div>
        ) : (
          <div className="divide-y">
            {filteredUsers.map((user: any) => {
              const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username;
              const userId = user.id?.toString();

              return (
                <button
                  key={user.id}
                  onClick={() => handleSelectUser(userId)}
                  className="w-full p-4 text-left hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
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
                      <p className="font-medium text-sm truncate">{fullName}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.email || user.username}
                      </p>
                      {user.role && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {user.role}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

