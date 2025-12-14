import React, { useState } from 'react';
import {
  useAvailableModels,
  useBulkCreateFieldPermissions,
  useModelObjects,
  type BulkPermissionData,
} from '@/hooks/use-field-permissions';
import { useUsers } from '@/hooks/use-users';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { UserAutocomplete } from '@/components/ui/UserAutocomplete';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import {
  UserPlus,
  Check,
  X,
  Eye,
  Edit,
  Shield,
  Search,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface FieldPermissionSelection {
  field_name: string;
  read: boolean;
  write: boolean;
}

export const UserFieldPermissionsAssigner: React.FC = () => {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [objectId, setObjectId] = useState<string>('');
  const [selectedObjectDisplay, setSelectedObjectDisplay] = useState<string>('');
  const [fieldPermissions, setFieldPermissions] = useState<FieldPermissionSelection[]>([]);
  const [userSearch, setUserSearch] = useState<string>('');
  const [objectSearch, setObjectSearch] = useState<string>('');
  const [objectPopoverOpen, setObjectPopoverOpen] = useState(false);

  // Utiliser les hooks pour charger les données avec recherche
  const { data: usersResponse, isLoading: isLoadingUsers } = useUsers({
    search: userSearch,
    page_size: 50 // Limiter à 50 résultats pour la recherche
  });
  const { data: availableModels } = useAvailableModels();
  const { data: modelObjects, isLoading: isLoadingObjects } = useModelObjects(
    selectedModelId ? parseInt(selectedModelId) : undefined,
    objectSearch,
    !!selectedModelId
  );
  const bulkCreateMutation = useBulkCreateFieldPermissions();

  // Extraire les données des réponses
  const users = usersResponse?.data?.results || [];

  // Handler pour la recherche côté serveur
  const handleUserSearch = (search: string) => {
    setUserSearch(search);
  };

  // Handler pour la sélection d'objet
  const handleObjectSelect = (obj: { id: number; display: string }) => {
    setObjectId(obj.id.toString());
    setSelectedObjectDisplay(obj.display);
    setObjectPopoverOpen(false);
  };

  // Handler pour vider la sélection d'objet
  const handleClearObject = () => {
    setObjectId('');
    setSelectedObjectDisplay('');
    setObjectSearch('');
  };

  // Initialiser les permissions quand un modèle est sélectionné
  React.useEffect(() => {
    if (selectedModelId) {
      const model = availableModels?.find(m => m.id.toString() === selectedModelId);
      if (model) {
        setFieldPermissions(
          model.fields.map(field => ({
            field_name: field,
            read: false,
            write: false,
          }))
        );
      }
      // Réinitialiser la sélection d'objet quand le modèle change
      setObjectId('');
      setSelectedObjectDisplay('');
      setObjectSearch('');
    }
  }, [selectedModelId, availableModels]);

  const handleTogglePermission = (fieldName: string, permissionType: 'read' | 'write') => {
    setFieldPermissions(prev =>
      prev.map(fp =>
        fp.field_name === fieldName
          ? {
              ...fp,
              [permissionType]: !fp[permissionType],
              // Si on coche write, cocher aussi read
              ...(permissionType === 'write' && !fp.write ? { read: true } : {}),
              // Si on décoche read, décocher aussi write
              ...(permissionType === 'read' && fp.read ? { write: false } : {}),
            }
          : fp
      )
    );
  };

  const handleSelectAll = (permissionType: 'read' | 'write') => {
    setFieldPermissions(prev =>
      prev.map(fp => ({
        ...fp,
        [permissionType]: true,
        ...(permissionType === 'write' ? { read: true } : {}),
      }))
    );
  };

  const handleDeselectAll = () => {
    setFieldPermissions(prev =>
      prev.map(fp => ({
        ...fp,
        read: false,
        write: false,
      }))
    );
  };

  const handleAssign = async () => {
    // Validation
    if (!selectedUserId) {
      toast.error('Veuillez sélectionner un utilisateur');
      return;
    }
    if (!selectedModelId) {
      toast.error('Veuillez sélectionner un modèle');
      return;
    }

    const selectedPermissions = fieldPermissions.filter(fp => fp.read || fp.write);
    if (selectedPermissions.length === 0) {
      toast.error('Veuillez sélectionner au moins une permission');
      return;
    }

    // Construire le tableau de permissions à créer
    const userId = parseInt(selectedUserId);
    const contentTypeId = parseInt(selectedModelId);
    const permissionsToCreate: BulkPermissionData[] = [];

    selectedPermissions.forEach(fp => {
      const basePayload = {
        user: userId,
        content_type: contentTypeId,
        field_name: fp.field_name,
      };

      const payloadWithObjectId = objectId
        ? { ...basePayload, object_id: parseInt(objectId) }
        : basePayload;

      // Créer une entrée pour la permission read si cochée
      if (fp.read) {
        permissionsToCreate.push({
          ...payloadWithObjectId,
          permission: 'read' as const,
        });
      }

      // Créer une entrée pour la permission write si cochée
      if (fp.write) {
        permissionsToCreate.push({
          ...payloadWithObjectId,
          permission: 'write' as const,
        });
      }
    });
    try {
      await bulkCreateMutation.mutateAsync(permissionsToCreate);
      // Réinitialiser le formulaire après succès
      setSelectedUserId('');
      setSelectedModelId('');
      setObjectId('');
      setSelectedObjectDisplay('');
      setFieldPermissions([]);
      setUserSearch('');
      setObjectSearch('');
      toast("Permissions ajouter")
    } catch (error) {
      console.error('Erreur lors de la création des permissions:', error);
    }
  };

  const selectedModel = availableModels?.find(m => m.id.toString() === selectedModelId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus size={24} />
          Assigner des Permissions par Champ
        </CardTitle>
        <p className="text-sm text-gray-500">
          Sélectionnez un utilisateur, puis choisissez les champs auxquels accorder des permissions
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sélection Utilisateur */}
        <div>
          <Label htmlFor="user-select">Utilisateur</Label>
          <UserAutocomplete
            value={selectedUserId}
            onValueChange={setSelectedUserId}
            users={users}
            isLoading={isLoadingUsers}
            placeholder="Rechercher un utilisateur..."
            showClearButton
            onSearchChange={handleUserSearch}
          />
        </div>

        <Separator />

        {/* Sélection du Modèle */}
        <div>
          <Label htmlFor="model-select">Modèle</Label>
          <Select value={selectedModelId} onValueChange={setSelectedModelId}>
            <SelectTrigger id="model-select">
              <SelectValue placeholder="Sélectionner un modèle" />
            </SelectTrigger>
            <SelectContent>
              {availableModels?.map(model => (
                <SelectItem key={model.id} value={model.id.toString()}>
                  <div className="flex flex-col">
                    <span className="font-medium">{model.model_verbose_name}</span>
                    <span className="text-xs text-gray-500">
                      {model.app_label}.{model.model_name}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Objet optionnel avec autocomplete */}
        <div>
          <Label htmlFor="object-select">Objet spécifique (optionnel)</Label>
          <div className="flex items-center gap-2">
            <Popover open={objectPopoverOpen} onOpenChange={setObjectPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={objectPopoverOpen}
                  className="w-full justify-between text-left font-normal"
                  disabled={!selectedModelId}
                >
                  <span className="truncate flex-1">
                    {selectedObjectDisplay || "Rechercher un objet..."}
                  </span>
                  <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Rechercher..."
                    value={objectSearch}
                    onValueChange={setObjectSearch}
                  />
                  <CommandList className="max-h-[200px]">
                    <CommandEmpty>
                      {isLoadingObjects ? (
                        <div className="flex items-center justify-center py-6">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          <span>Chargement...</span>
                        </div>
                      ) : (
                        <div className="py-6 text-center text-sm">
                          {selectedModelId
                            ? "Aucun objet trouvé"
                            : "Sélectionnez d'abord un modèle"}
                        </div>
                      )}
                    </CommandEmpty>
                    <CommandGroup>
                      {modelObjects?.map((obj) => (
                        <CommandItem
                          key={obj.id}
                          value={obj.display}
                          onSelect={() => handleObjectSelect(obj)}
                          className="cursor-pointer"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4 shrink-0",
                              objectId === obj.id.toString() ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <span className="truncate">{obj.display}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {objectId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearObject}
                className="text-red-600 hover:text-red-700 shrink-0"
                title="Effacer la sélection"
              >
                <X size={14} />
              </Button>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Si vide, les permissions s'appliquent à tous les objets de ce modèle
          </p>
        </div>

        <Separator />

        {/* Sélection des Champs et Permissions */}
        {selectedModel && fieldPermissions.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">
                Sélectionner les Champs et Permissions
              </Label>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSelectAll('read')}
                >
                  <Eye size={14} className="mr-1" />
                  Tout en Lecture
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSelectAll('write')}
                >
                  <Edit size={14} className="mr-1" />
                  Tout en Écriture
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDeselectAll}
                >
                  <X size={14} className="mr-1" />
                  Tout Décocher
                </Button>
              </div>
            </div>

            <ScrollArea className="h-[400px] border rounded-lg">
              <div className="p-4 space-y-2">
                {/* En-tête */}
                <div className="grid grid-cols-[1fr_100px_100px] gap-4 pb-2 border-b font-semibold text-sm">
                  <div>Champ</div>
                  <div className="text-center flex items-center justify-center gap-1">
                    <Eye size={14} />
                    Lecture
                  </div>
                  <div className="text-center flex items-center justify-center gap-1">
                    <Edit size={14} />
                    Écriture
                  </div>
                </div>

                {/* Lignes de champs */}
                {fieldPermissions.map(fp => (
                  <div
                    key={fp.field_name}
                    className="grid grid-cols-[1fr_100px_100px] gap-4 py-2 border-b hover:bg-gray-50 items-center"
                  >
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                        {fp.field_name}
                      </code>
                      {(fp.read || fp.write) && (
                        <Badge variant="secondary" className="text-xs">
                          {fp.write ? 'R/W' : 'R'}
                        </Badge>
                      )}
                    </div>
                    <div className="flex justify-center">
                      <Checkbox
                        checked={fp.read}
                        onCheckedChange={() => handleTogglePermission(fp.field_name, 'read')}
                      />
                    </div>
                    <div className="flex justify-center">
                      <Checkbox
                        checked={fp.write}
                        onCheckedChange={() => handleTogglePermission(fp.field_name, 'write')}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Résumé */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <Shield size={16} />
                Résumé des permissions à créer
              </h4>
              <div className="text-sm space-y-1">
                <div>
                  <strong>Utilisateur:</strong>{' '}
                  {(() => {
                    const user = users.find(u => u.id.toString() === selectedUserId);
                    return user?.first_name && user?.last_name
                      ? `${user.first_name} ${user.last_name}`
                      : user?.username || 'Non sélectionné';
                  })()}
                </div>
                <div>
                  <strong>Modèle:</strong> {selectedModel?.model_verbose_name || 'Non sélectionné'}
                </div>
                <div>
                  <strong>Portée:</strong>{' '}
                  {objectId ? `Objet #${objectId}` : 'Tous les objets'}
                </div>
                <div>
                  <strong>Permissions:</strong>{' '}
                  {fieldPermissions.filter(fp => fp.read).length} en lecture,{' '}
                  {fieldPermissions.filter(fp => fp.write).length} en écriture
                </div>
              </div>
            </div>

            {/* Bouton d'assignation */}
            <Button
              onClick={handleAssign}
              disabled={
                bulkCreateMutation.isPending ||
                fieldPermissions.filter(fp => fp.read || fp.write).length === 0
              }
              className="w-full"
              size="lg"
            >
              {bulkCreateMutation.isPending ? (
                <>Assignation en cours...</>
              ) : (
                <>
                  <Check size={18} className="mr-2" />
                  Assigner les Permissions
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
