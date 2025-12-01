import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Loader2, Search, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Activity {
  id: number;
  intitule: string;
  description?: string;
}

interface ActivityAutocompleteProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  showClearButton?: boolean;
  activities: Activity[];
  isLoading?: boolean;
  onActivitySelect?: (activity: Activity | null) => void;
  serviceSelected?: boolean;
  onSearchChange?: (search: string) => void; // Nouvelle prop pour la recherche côté serveur
}

export function ActivityAutocomplete({
  value = '',
  onValueChange,
  placeholder = "Rechercher une activité...",
  className = "w-full",
  disabled = false,
  showClearButton = true,
  activities = [],
  isLoading = false,
  onActivitySelect,
  serviceSelected = false,
  onSearchChange
}: ActivityAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

  // Si onSearchChange est fourni, ne pas filtrer côté client (recherche côté serveur)
  // Sinon, filtrer les activités selon la recherche (comportement par défaut)
  const filteredActivities = onSearchChange
    ? activities
    : activities.filter(activity =>
        activity.intitule.toLowerCase().includes(search.toLowerCase()) ||
        activity.description?.toLowerCase().includes(search.toLowerCase())
      );

  // Synchroniser avec la valeur externe
  useEffect(() => {
    if (value && !selectedActivity) {
      // Si on a une valeur mais pas d'activité sélectionnée, essayer de la trouver
      const activity = activities.find(a => a.id.toString() === value);
      if (activity) {
        setSelectedActivity(activity);
        setSearch(activity.intitule);
      }
    } else if (!value && selectedActivity) {
      setSelectedActivity(null);
      setSearch('');
    }
  }, [value, activities, selectedActivity]);

  const handleActivitySelect = (activity: Activity) => {
    setSelectedActivity(activity);
    setSearch(activity.intitule);
    onValueChange(activity.id.toString());
    onActivitySelect?.(activity);
    setOpen(false);
  };

  const handleClear = () => {
    setSelectedActivity(null);
    setSearch('');
    onValueChange('');
    onActivitySelect?.(null);
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

  const getPlaceholder = () => {
    if (!serviceSelected) {
      return "Sélectionnez d'abord un service";
    }
    if (isLoading) {
      return "Chargement des activités...";
    }
    return placeholder;
  };

  return (
    <div className="flex items-center gap-2 w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("justify-between text-left font-normal", className)}
            disabled={disabled || !serviceSelected}
          >
            <span className="truncate flex-1">
              {selectedActivity ? selectedActivity.intitule : getPlaceholder()}
            </span>
            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Rechercher une activité..."
              value={search}
              onValueChange={handleSearchChange}
            />
            <CommandList className="max-h-[300px] overflow-y-auto">
              <CommandEmpty>
                {isLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="ml-2">Chargement...</span>
                  </div>
                ) : !serviceSelected ? (
                  <div className="py-6 text-center text-sm pr-2 pl-2">
                    Veuillez d'abord sélectionner un service.
                  </div>
                ) : activities.length === 0 ? (
                  <div className="py-6 text-center text-sm pr-2 pl-2">
                    Aucune activité trouvée pour ce service.
                  </div>
                ) : (
                  <div className="py-6 text-center text-sm pr-2 pl-2">
                    Aucune activité trouvée. Commencez à taper pour rechercher.
                  </div>
                )}
              </CommandEmpty>
              <CommandGroup>
                {filteredActivities.map((activity) => (
                  <CommandItem
                    key={activity.id}
                    value={activity.intitule}
                    onSelect={() => handleActivitySelect(activity)}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4 shrink-0",
                        selectedActivity?.id === activity.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="truncate font-medium">{activity.intitule}</span>
                      {activity.description && (
                        <span className="text-xs text-muted-foreground truncate">
                          {activity.description}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {showClearButton && selectedActivity && (
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
