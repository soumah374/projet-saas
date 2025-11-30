import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Loader2, Search, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Service {
  id: number;
  name: string;
  description?: string;
}

interface ServiceAutocompleteProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  showClearButton?: boolean;
  services: Service[];
  isLoading?: boolean;
  onServiceSelect?: (service: Service | null) => void;
}

export function ServiceAutocomplete({
  value = '',
  onValueChange,
  placeholder = "Rechercher un service...",
  className = "w-full",
  disabled = false,
  showClearButton = true,
  services = [],
  isLoading = false,
  onServiceSelect
}: ServiceAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  // Filtrer les services selon la recherche
  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(search.toLowerCase()) ||
    service.description?.toLowerCase().includes(search.toLowerCase())
  );

  // Synchroniser avec la valeur externe
  useEffect(() => {
    if (value && !selectedService) {
      // Si on a une valeur mais pas de service sélectionné, essayer de le trouver
      const service = services.find(s => s.id.toString() === value);
      if (service) {
        setSelectedService(service);
        setSearch(service.name);
      }
    } else if (!value && selectedService) {
      setSelectedService(null);
      setSearch('');
    }
  }, [value, services, selectedService]);

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setSearch(service.name);
    onValueChange(service.id.toString());
    onServiceSelect?.(service);
    setOpen(false);
  };

  const handleClear = () => {
    setSelectedService(null);
    setSearch('');
    onValueChange('');
    onServiceSelect?.(null);
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
              {selectedService ? selectedService.name : placeholder}
            </span>
            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Rechercher un service..."
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
                    Aucun service trouvé. Commencez à taper pour rechercher.
                  </div>
                )}
              </CommandEmpty>
              <CommandGroup>
                {filteredServices.map((service) => (
                  <CommandItem
                    key={service.id}
                    value={service.name}
                    onSelect={() => handleServiceSelect(service)}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4 shrink-0",
                        selectedService?.id === service.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="truncate font-medium">{service.name}</span>
                      {service.description && (
                        <span className="text-xs text-muted-foreground truncate">
                          {service.description}
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
      {showClearButton && selectedService && (
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
