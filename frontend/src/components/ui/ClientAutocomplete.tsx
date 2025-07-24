import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Loader2, Search, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useClients } from '@/hooks/use-clients';

interface Client {
  id: number;
  nom_complet: string;
  email?: string;
  telephone?: string;
}

interface ClientAutocompleteProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  showClearButton?: boolean;
  onClientSelect?: (client: Client | null) => void;
}

export function ClientAutocomplete({
  value = '',
  onValueChange,
  placeholder = "Rechercher un client...",
  className = "w-full",
  disabled = false,
  showClearButton = true,
  onClientSelect
}: ClientAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Hook pour rechercher les clients
  const { data: clientsData, isLoading } = useClients({ 
    search: debouncedSearch || undefined,
    page_size: 10
  });

  const clients = clientsData?.results || [];

  // Debounce pour la recherche
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  // Synchroniser avec la valeur externe
  useEffect(() => {
    if (value && !selectedClient) {
      // Si on a une valeur mais pas de client sélectionné, essayer de le trouver
      const client = clients.find(c => c.id.toString() === value);
      if (client) {
        setSelectedClient(client);
        setSearch(client.nom_complet);
      }
    } else if (!value && selectedClient) {
      setSelectedClient(null);
      setSearch('');
    }
  }, [value, clients, selectedClient]);

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
    setSearch(client.nom_complet);
    onValueChange(client.id.toString());
    onClientSelect?.(client);
    setOpen(false);
  };

  const handleClear = () => {
    setSelectedClient(null);
    setSearch('');
    onValueChange('');
    onClientSelect?.(null);
  };

  const handleSearchChange = (newSearch: string) => {
    setSearch(newSearch);
    if (!newSearch) {
      handleClear();
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("justify-between", className)}
            disabled={disabled}
          >
            {selectedClient ? selectedClient.nom_complet : placeholder}
            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput 
              placeholder="Rechercher un client..." 
              value={search}
              onValueChange={handleSearchChange}
            />
            <CommandList>
              <CommandEmpty>
                {isLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="ml-2">Recherche en cours...</span>
                  </div>
                ) : (
                  <div className="py-6 text-center text-sm pr-2 pl-2">
                    Aucun client trouvé. Commencez à taper pour rechercher.
                  </div>
                )}
              </CommandEmpty>
              <CommandGroup>
                {clients.map((client) => (
                  <CommandItem
                    key={client.id}
                    value={client.nom_complet}
                    onSelect={() => handleClientSelect(client)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedClient?.id === client.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                      <span>{client.nom_complet}</span>
                      {client.email && (
                        <span className="text-xs text-muted-foreground">{client.email}</span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {showClearButton && selectedClient && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="text-red-600 hover:text-red-700"
          title="Effacer la sélection"
        >
          <X size={14} />
        </Button>
      )}
    </div>
  );
} 