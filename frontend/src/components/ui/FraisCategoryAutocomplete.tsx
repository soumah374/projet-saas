import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Loader2, Search, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FraisCategory {
  id: number;
  name: string;
}

interface FraisCategoryAutocompleteProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  showClearButton?: boolean;
  categories: FraisCategory[];
  isLoading?: boolean;
  onCategorySelect?: (category: FraisCategory | null) => void;
  onSearchChange?: (search: string) => void; // Nouvelle prop pour la recherche côté serveur
}

export function FraisCategoryAutocomplete({
  value = '',
  onValueChange,
  placeholder = "Rechercher une catégorie de frais...",
  className = "w-full",
  disabled = false,
  showClearButton = true,
  categories = [],
  isLoading = false,
  onCategorySelect,
  onSearchChange
}: FraisCategoryAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FraisCategory | null>(null);

  // Si onSearchChange est fourni, ne pas filtrer côté client (recherche côté serveur)
  // Sinon, filtrer les catégories selon la recherche (comportement par défaut)
  const filteredCategories = onSearchChange
    ? categories
    : categories.filter(category =>
        category.name.toLowerCase().includes(search.toLowerCase())
      );

  // Synchroniser avec la valeur externe
  useEffect(() => {
    if (value && !selectedCategory) {
      const category = categories.find(c => c.id.toString() === value);
      if (category) {
        setSelectedCategory(category);
        setSearch(category.name);
      }
    } else if (!value && selectedCategory) {
      setSelectedCategory(null);
      setSearch('');
    }
  }, [value, categories, selectedCategory]);

  const handleCategorySelect = (category: FraisCategory) => {
    setSelectedCategory(category);
    setSearch(category.name);
    onValueChange(category.id.toString());
    onCategorySelect?.(category);
    setOpen(false);
  };

  const handleClear = () => {
    setSelectedCategory(null);
    setSearch('');
    onValueChange('');
    onCategorySelect?.(null);
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
              {selectedCategory ? selectedCategory.name : placeholder}
            </span>
            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Rechercher une catégorie..."
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
                ) : categories.length === 0 ? (
                  <div className="py-6 text-center text-sm pr-2 pl-2">
                    Aucune catégorie de frais trouvée.
                  </div>
                ) : (
                  <div className="py-6 text-center text-sm pr-2 pl-2">
                    Aucune catégorie trouvée. Commencez à taper pour rechercher.
                  </div>
                )}
              </CommandEmpty>
              <CommandGroup>
                {filteredCategories.map((category) => (
                  <CommandItem
                    key={category.id}
                    value={category.name}
                    onSelect={() => handleCategorySelect(category)}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4 shrink-0",
                        selectedCategory?.id === category.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="truncate font-medium">{category.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {showClearButton && selectedCategory && (
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
