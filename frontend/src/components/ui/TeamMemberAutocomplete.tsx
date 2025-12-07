import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Loader2, Search, Check, X, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ProjectMember } from '@/lib/types';

// Type étendu pour inclure le user_name qui vient de l'API
interface ProjectTeamMember extends ProjectMember {
  user_name?: string;
}

interface TeamMemberAutocompleteProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  showClearButton?: boolean;
  teamMembers: any[];
  isLoading?: boolean;
  onMemberSelect?: (member: ProjectTeamMember | null) => void;
  onSearchChange?: (search: string) => void; // Nouvelle prop pour la recherche côté serveur
}

export function TeamMemberAutocomplete({
  value = '',
  onValueChange,
  placeholder = "Rechercher un membre...",
  className = "w-full",
  disabled = false,
  showClearButton = true,
  teamMembers = [],
  isLoading = false,
  onMemberSelect,
  onSearchChange
}: TeamMemberAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedMember, setSelectedMember] = useState<ProjectTeamMember | null>(null);

  // Si onSearchChange est fourni, ne pas filtrer côté client (recherche côté serveur)
  // Sinon, filtrer les membres selon la recherche (comportement par défaut)
  const filteredMembers = onSearchChange
    ? teamMembers
    : teamMembers.filter(member => {
        const userName = member.user_name || `${member.user_details.first_name} ${member.user_details.last_name}`;
        const fullName = `${member.user_details.first_name} ${member.user_details.last_name}`;
        return userName.toLowerCase().includes(search.toLowerCase()) ||
          fullName.toLowerCase().includes(search.toLowerCase()) ||
          member.role.toLowerCase().includes(search.toLowerCase());
      });

  // Synchroniser avec la valeur externe
  useEffect(() => {
    if (value && !selectedMember) {
      // Si on a une valeur mais pas de membre sélectionné, essayer de le trouver
      const member = teamMembers.find(m => m.user.toString() === value);
      if (member) {
        setSelectedMember(member);
        const displayName = member.user_name || `${member.user_details.first_name} ${member.user_details.last_name}`;
        setSearch(displayName);
      }
    } else if (!value && selectedMember) {
      setSelectedMember(null);
      setSearch('');
    }
  }, [value, teamMembers, selectedMember]);

  const handleMemberSelect = (member: ProjectTeamMember) => {
    setSelectedMember(member);
    const displayName = member.user_name || `${member.user_details.first_name} ${member.user_details.last_name}`;
    setSearch(displayName);
    onValueChange(member.user.toString());
    onMemberSelect?.(member);
    setOpen(false);
  };

  const handleClear = () => {
    setSelectedMember(null);
    setSearch('');
    onValueChange('');
    onMemberSelect?.(null);
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
              {selectedMember ? (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>{selectedMember.user_name || `${selectedMember.user_details.first_name} ${selectedMember.user_details.last_name}`}</span>
                  <Badge variant="outline" className="text-xs">
                    {selectedMember.role}
                  </Badge>
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
              placeholder="Rechercher un membre..."
              value={search}
              onValueChange={handleSearchChange}
            />
            <CommandList className="max-h-[300px] overflow-y-auto">
              <CommandEmpty>
                {isLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="ml-2">Chargement des membres...</span>
                  </div>
                ) : teamMembers.length === 0 ? (
                  <div className="py-6 text-center text-sm pr-2 pl-2">
                    Aucun membre disponible.
                  </div>
                ) : (
                  <div className="py-6 text-center text-sm pr-2 pl-2">
                    Aucun membre trouvé. Commencez à taper pour rechercher.
                  </div>
                )}
              </CommandEmpty>
              <CommandGroup>
                {filteredMembers.map((member) => {
                  const displayName = member.user_name || `${member.user_details.first_name} ${member.user_details.last_name}`;
                  const fullName = `${member.user_details.first_name} ${member.user_details.last_name}`;

                  return (
                    <CommandItem
                      key={member.id}
                      value={displayName}
                      onSelect={() => handleMemberSelect(member)}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4 shrink-0",
                          selectedMember?.id === member.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Users className="h-4 w-4 shrink-0" />
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="truncate font-medium">{displayName}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {member.role}
                            </Badge>
                            <span className="text-xs text-muted-foreground truncate">
                              {fullName}
                            </span>
                          </div>
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
      {showClearButton && selectedMember && (
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
