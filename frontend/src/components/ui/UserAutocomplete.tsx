import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Loader2, Search, Check, X, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserType {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface UserAutocompleteProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  showClearButton?: boolean;
  users: UserType[];
  isLoading?: boolean;
  onUserSelect?: (user: UserType | null) => void;
  onSearchChange?: (search: string) => void; // Nouvelle prop pour la recherche côté serveur
}

export function UserAutocomplete({
  value = '',
  onValueChange,
  placeholder = "Rechercher un utilisateur...",
  className = "w-full",
  disabled = false,
  showClearButton = true,
  users = [],
  isLoading = false,
  onUserSelect,
  onSearchChange
}: UserAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);

  // Si onSearchChange est fourni, ne pas filtrer côté client (recherche côté serveur)
  // Sinon, filtrer les utilisateurs selon la recherche (comportement par défaut)
  const filteredUsers = onSearchChange
    ? users
    : users.filter(user => {
        const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
        const searchLower = search.toLowerCase();
        return fullName.includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower) ||
          user.username.toLowerCase().includes(searchLower);
      });

  // Synchroniser avec la valeur externe
  useEffect(() => {
    if (value && !selectedUser) {
      // Si on a une valeur mais pas d'utilisateur sélectionné, essayer de le trouver
      const user = users.find(u => u.id.toString() === value);
      if (user) {
        setSelectedUser(user);
        setSearch(`${user.first_name} ${user.last_name}`);
      }
    } else if (!value && selectedUser) {
      setSelectedUser(null);
      setSearch('');
    }
  }, [value, users, selectedUser]);

  const handleUserSelect = (user: UserType) => {
    setSelectedUser(user);
    setSearch(`${user.first_name} ${user.last_name}`);
    onValueChange(user.id.toString());
    onUserSelect?.(user);
    setOpen(false);
  };

  const handleClear = () => {
    setSelectedUser(null);
    setSearch('');
    onValueChange('');
    onUserSelect?.(null);
  };

  const handleSearchChange = (newSearch: string) => {
    setSearch(newSearch);
    if (!newSearch) {
      handleClear();
    }
  };

  // Effet pour la recherche côté serveur avec debounce
  useEffect(() => {
    if (onSearchChange) {
      const timeoutId = setTimeout(() => {
        onSearchChange(search);
      }, 300); // Debounce de 300ms

      return () => clearTimeout(timeoutId);
    }
  }, [search, onSearchChange]);

  return (
    <div className="flex items-center gap-2 w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("justify-between text-left font-normal", className)}
            disabled={disabled}
          >
            <span className="truncate flex-1">
              {selectedUser ? (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>{selectedUser.first_name} {selectedUser.last_name}</span>
                  <span className="text-xs text-muted-foreground">({selectedUser.email})</span>
                </div>
              ) : (
                placeholder
              )}
            </span>
            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Rechercher un utilisateur..."
              value={search}
              onValueChange={handleSearchChange}
            />
            <CommandList className="max-h-[300px] overflow-y-auto">
              <CommandEmpty>
                {isLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="ml-2">Chargement des utilisateurs...</span>
                  </div>
                ) : users.length === 0 ? (
                  <div className="py-6 text-center text-sm pr-2 pl-2">
                    Aucun utilisateur disponible.
                  </div>
                ) : (
                  <div className="py-6 text-center text-sm pr-2 pl-2">
                    Aucun utilisateur trouvé. Commencez à taper pour rechercher.
                  </div>
                )}
              </CommandEmpty>
              <CommandGroup>
                {filteredUsers.map((user) => {
                  const displayName = `${user.first_name} ${user.last_name}`;

                  return (
                    <CommandItem
                      key={user.id}
                      value={displayName}
                      onSelect={() => handleUserSelect(user)}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4 shrink-0",
                          selectedUser?.id === user.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <User className="h-4 w-4 shrink-0" />
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="truncate font-medium">{displayName}</span>
                          <span className="text-xs text-muted-foreground truncate">
                            {user.email}
                          </span>
                        </div>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {showClearButton && selectedUser && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="text-red-600 hover:text-red-700 shrink-0"
          title="Effacer la sélection"
        >
          <X size={14} />
        </Button>
      )}
    </div>
  );
}
