import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Loader2, Search, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Unite {
  id: number;
  intitule: string;
  code: string;
}

interface UniteAutocompleteProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  showClearButton?: boolean;
  unites: Unite[];
  isLoading?: boolean;
  onUniteSelect?: (unite: Unite | null) => void;
}

export function UniteAutocomplete({
  value = '',
  onValueChange,
  placeholder = "Rechercher une unité...",
  className = "w-full",
  disabled = false,
  showClearButton = true,
  unites = [],
  isLoading = false,
  onUniteSelect
}: UniteAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedUnite, setSelectedUnite] = useState<Unite | null>(null);

  // Filtrer les unités selon la recherche
  const filteredUnites = unites.filter(unite =>
    unite.intitule.toLowerCase().includes(search.toLowerCase()) ||
    unite.code.toLowerCase().includes(search.toLowerCase())
  );

  // Synchroniser avec la valeur externe
  useEffect(() => {
    if (value && !selectedUnite) {
      const unite = unites.find(u => u.id.toString() === value);
      if (unite) {
        setSelectedUnite(unite);
        setSearch(`${unite.intitule} (${unite.code})`);
      }
    } else if (!value && selectedUnite) {
      setSelectedUnite(null);
      setSearch('');
    }
  }, [value, unites, selectedUnite]);

  const handleUniteSelect = (unite: Unite) => {
    setSelectedUnite(unite);
    setSearch(`${unite.intitule} (${unite.code})`);
    onValueChange(unite.id.toString());
    onUniteSelect?.(unite);
    setOpen(false);
  };

  const handleClear = () => {
    setSelectedUnite(null);
    setSearch('');
    onValueChange('');
    onUniteSelect?.(null);
  };

  const handleSearchChange = (newSearch: string) => {
    setSearch(newSearch);
    if (!newSearch) {
      handleClear();
    }
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
            disabled={disabled}
          >
            <span className="truncate flex-1">
              {selectedUnite ? `${selectedUnite.intitule} (${selectedUnite.code})` : placeholder}
            </span>
            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Rechercher une unité..."
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
                ) : (
                  <div className="py-6 text-center text-sm pr-2 pl-2">
                    Aucune unité trouvée. Commencez à taper pour rechercher.
                  </div>
                )}
              </CommandEmpty>
              <CommandGroup>
                {filteredUnites.map((unite) => (
                  <CommandItem
                    key={unite.id}
                    value={`${unite.intitule} (${unite.code})`}
                    onSelect={() => handleUniteSelect(unite)}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4 shrink-0",
                        selectedUnite?.id === unite.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="truncate font-medium">{unite.intitule}</span>
                      <span className="text-xs text-muted-foreground shrink-0">({unite.code})</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {showClearButton && selectedUnite && (
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
