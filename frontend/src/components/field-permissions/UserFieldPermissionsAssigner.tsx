import React, { useState } from 'react';
import {
  useAvailableModels,
  useCreateFieldPermission,
  useGroups,
} from '@/hooks/use-field-permissions';
import { useUsers } from '@/hooks/use-users';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  UserPlus,
  Check,
  X,
  Eye,
  Edit,
  Shield,
  Users
} from 'lucide-react';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Role } from '@/hooks/use-permissions';

interface FieldPermissionSelection {
  field_name: string;
  read: boolean;
  write: boolean;
}

export const UserFieldPermissionsAssigner: React.FC = () => {
  const [selectedTargetType, setSelectedTargetType] = useState<'user' | 'group'>('user');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [objectId, setObjectId] = useState<string>('');
  const [fieldPermissions, setFieldPermissions] = useState<FieldPermissionSelection[]>([]);
  const [roles, setRoles] = useState<(Role)[]>([]);

  // Utiliser les hooks pour charger les données
  const { data: usersResponse } = useUsers({ page_size: 1000 });
  const { data: groupsResponse } = useGroups();
  const { data: availableModels } = useAvailableModels();
  const createMutation = useCreateFieldPermission();


  // Extraire les données des réponses
  const users = usersResponse?.data?.results || [];
  const groups = groupsResponse || [];

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
    if (selectedTargetType === 'user' && !selectedUserId) {
      toast.error('Veuillez sélectionner un utilisateur');
      return;
    }
    if (selectedTargetType === 'group' && !selectedGroupId) {
      toast.error('Veuillez sélectionner un groupe');
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

    // Créer les permissions
    const targetId = selectedTargetType === 'user'
      ? parseInt(selectedUserId)
      : parseInt(selectedGroupId);

    const targetName = selectedTargetType === 'user'
      ? users.find(u => u.id === targetId)?.get_full_name
      : groups.find(g => g.id === targetId)?.name;

    let successCount = 0;
    let errorCount = 0;

    for (const fp of selectedPermissions) {
      // Créer permission read si cochée
      if (fp.read) {
        try {
          await createMutation.mutateAsync({
            [selectedTargetType]: targetId,
            content_type: parseInt(selectedModelId),
            field_name: fp.field_name,
            object_id: objectId ? parseInt(objectId) : undefined,
            permission: 'read',
          });
          successCount++;
        } catch (error) {
          errorCount++;
          console.error(`Erreur création permission read pour ${fp.field_name}:`, error);
        }
      }

      // Créer permission write si cochée (et différente de read)
      if (fp.write) {
        try {
          await createMutation.mutateAsync({
            [selectedTargetType]: targetId,
            content_type: parseInt(selectedModelId),
            field_name: fp.field_name,
            object_id: objectId ? parseInt(objectId) : undefined,
            permission: 'write',
          });
          successCount++;
        } catch (error) {
          errorCount++;
          console.error(`Erreur création permission write pour ${fp.field_name}:`, error);
        }
      }
    }

    if (errorCount === 0) {
      toast.success(
        `${successCount} permission(s) assignée(s) à ${targetName} avec succès`
      );
      // Reset
      setSelectedUserId('');
      setSelectedGroupId('');
      setSelectedModelId('');
      setObjectId('');
      setFieldPermissions([]);
    } else {
      toast.warning(
        `${successCount} permission(s) créée(s), ${errorCount} erreur(s)`
      );
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
          Sélectionnez un utilisateur ou un groupe, puis choisissez les champs auxquels accorder des permissions
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sélection Utilisateur ou Groupe */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Button
              variant={selectedTargetType === 'user' ? 'default' : 'outline'}
              onClick={() => {
                setSelectedTargetType('user');
                setSelectedGroupId('');
              }}
              className="flex items-center gap-2"
            >
              <UserPlus size={16} />
              Utilisateur
            </Button>
            {/* <Button
              variant={selectedTargetType === 'group' ? 'default' : 'outline'}
              onClick={() => {
                setSelectedTargetType('group');
                setSelectedUserId('');
              }}
              className="flex items-center gap-2"
            >
              <Users size={16} />
              Groupe
            </Button> */}
          </div>

          {selectedTargetType === 'user' ? (
            <div>
              <Label htmlFor="user-select">Utilisateur</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger id="user-select">
                  <SelectValue placeholder="Sélectionner un utilisateur" />
                </SelectTrigger>
                <SelectContent>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{user.get_full_name || user.username}</span>
                        <span className="text-gray-500 text-sm">({user.email})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div>
              <Label htmlFor="group-select">Groupe</Label>
              <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                <SelectTrigger id="group-select">
                  <SelectValue placeholder="Sélectionner un groupe" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map(group => (
                    <SelectItem key={group.id} value={group.id.toString()}>
                      👥 {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
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

        {/* ID Objet optionnel */}
        <div>
          <Label htmlFor="object-id">ID Objet (optionnel)</Label>
          <Input
            id="object-id"
            type="number"
            placeholder="Laisser vide pour tous les objets"
            value={objectId}
            onChange={e => setObjectId(e.target.value)}
          />
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
                  <strong>Cible:</strong>{' '}
                  {selectedTargetType === 'user'
                    ? users.find(u => u.id.toString() === selectedUserId)?.get_full_name
                    : groups.find(g => g.id.toString() === selectedGroupId)?.name}
                </div>
                <div>
                  <strong>Modèle:</strong> {selectedModel.model_verbose_name}
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
                createMutation.isPending ||
                fieldPermissions.filter(fp => fp.read || fp.write).length === 0
              }
              className="w-full"
              size="lg"
            >
              {createMutation.isPending ? (
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
