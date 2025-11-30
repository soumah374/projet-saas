import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Loader2, Search, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LigneFrais {
  id: number;
  description: string;
  type_frais?: string;
}

interface LigneFraisAutocompleteProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  showClearButton?: boolean;
  lignesFrais: LigneFrais[];
  isLoading?: boolean;
  onLigneFraisSelect?: (ligneFrais: LigneFrais | null) => void;
  categorySelected?: boolean;
}

export function LigneFraisAutocomplete({
  value = '',
  onValueChange,
  placeholder = "Rechercher une ligne de frais...",
  className = "w-full",
  disabled = false,
  showClearButton = true,
  lignesFrais = [],
  isLoading = false,
  onLigneFraisSelect,
  categorySelected = false
}: LigneFraisAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedLigneFrais, setSelectedLigneFrais] = useState<LigneFrais | null>(null);

  // Filtrer les lignes de frais selon la recherche
  const filteredLignesFrais = lignesFrais.filter(ligne =>
    ligne.description.toLowerCase().includes(search.toLowerCase())
  );

  // Synchroniser avec la valeur externe
  useEffect(() => {
    if (value && !selectedLigneFrais) {
      const ligne = lignesFrais.find(lf => lf.id.toString() === value);
      if (ligne) {
        setSelectedLigneFrais(ligne);
        setSearch(ligne.description);
      }
    } else if (!value && selectedLigneFrais) {
      setSelectedLigneFrais(null);
      setSearch('');
    }
  }, [value, lignesFrais, selectedLigneFrais]);

  const handleLigneFraisSelect = (ligne: LigneFrais) => {
    setSelectedLigneFrais(ligne);
    setSearch(ligne.description);
    onValueChange(ligne.id.toString());
    onLigneFraisSelect?.(ligne);
    setOpen(false);
  };

  const handleClear = () => {
    setSelectedLigneFrais(null);
    setSearch('');
    onValueChange('');
    onLigneFraisSelect?.(null);
  };

  const handleSearchChange = (newSearch: string) => {
    setSearch(newSearch);
    if (!newSearch) {
      handleClear();
    }
  };

  const getPlaceholder = () => {
    if (!categorySelected) {
      return "Sélectionnez d'abord une catégorie";
    }
    if (isLoading) {
      return "Chargement des lignes de frais...";
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
            disabled={disabled || !categorySelected}
          >
            <span className="truncate flex-1">
              {selectedLigneFrais ? selectedLigneFrais.description : getPlaceholder()}
            </span>
            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Rechercher une ligne de frais..."
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
                ) : !categorySelected ? (
                  <div className="py-6 text-center text-sm pr-2 pl-2">
                    Veuillez d'abord sélectionner une catégorie.
                  </div>
                ) : lignesFrais.length === 0 ? (
                  <div className="py-6 text-center text-sm pr-2 pl-2">
                    Aucune ligne de frais trouvée pour cette catégorie.
                  </div>
                ) : (
                  <div className="py-6 text-center text-sm pr-2 pl-2">
                    Aucune ligne trouvée. Commencez à taper pour rechercher.
                  </div>
                )}
              </CommandEmpty>
              <CommandGroup>
                {filteredLignesFrais.map((ligne) => (
                  <CommandItem
                    key={ligne.id}
                    value={ligne.description}
                    onSelect={() => handleLigneFraisSelect(ligne)}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4 shrink-0",
                        selectedLigneFrais?.id === ligne.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="truncate font-medium">{ligne.description}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {showClearButton && selectedLigneFrais && (
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
