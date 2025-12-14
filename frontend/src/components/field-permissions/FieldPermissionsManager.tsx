import React, { useState } from 'react';
import {
  useFieldPermissions,
  useAvailableModels,
  useCreateFieldPermission,
  useUpdateFieldPermission,
  useDeleteFieldPermission,
  FieldPermission,
} from '@/hooks/use-field-permissions';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Plus, Trash2, Edit, Eye, Lock, Shield } from 'lucide-react';
import { toast } from 'sonner';

export const FieldPermissionsManager: React.FC = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingPermission, setEditingPermission] = useState<FieldPermission | null>(null);

  const { data: permissions, isLoading } = useFieldPermissions();
  const { data: availableModels } = useAvailableModels();
  const createMutation = useCreateFieldPermission();
  const updateMutation = useUpdateFieldPermission();
  const deleteMutation = useDeleteFieldPermission();

  const [formData, setFormData] = useState({
    user: '',
    group: '',
    content_type: '',
    field_name: '',
    object_id: '',
    permission: 'read' as 'read' | 'write',
  });

  const handleCreate = () => {
    if (!formData.content_type || !formData.field_name) {
      toast.error('Veuillez remplir tous les champs requis');
      return;
    }

    if (!formData.user && !formData.group) {
      toast.error('Veuillez sélectionner un utilisateur ou un groupe');
      return;
    }

    createMutation.mutate({
      user: formData.user ? parseInt(formData.user) : undefined,
      group: formData.group ? parseInt(formData.group) : undefined,
      content_type: parseInt(formData.content_type),
      field_name: formData.field_name,
      object_id: formData.object_id ? parseInt(formData.object_id) : undefined,
      permission: formData.permission,
    });

    setIsCreateDialogOpen(false);
    resetForm();
  };

  const handleDelete = (id: number) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette permission ?')) {
      deleteMutation.mutate(id);
    }
  };

  const resetForm = () => {
    setFormData({
      user: '',
      group: '',
      content_type: '',
      field_name: '',
      object_id: '',
      permission: 'read',
    });
    setEditingPermission(null);
  };

  const selectedModelData = availableModels?.find(
    (m) => m.id === parseInt(formData.content_type)
  );

  const getPermissionBadge = (permission: string) => {
    if (permission === 'read') {
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          <Eye size={12} className="mr-1" />
          Lecture
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
        <Edit size={12} className="mr-1" />
        Écriture
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield size={24} />
            Gestion des Permissions par Champ
          </CardTitle>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus size={16} className="mr-2" />
            Nouvelle Permission
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Chargement...</div>
          ) : permissions && permissions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur/Groupe</TableHead>
                  <TableHead>Modèle</TableHead>
                  <TableHead>Champ</TableHead>
                  <TableHead>ID Objet</TableHead>
                  <TableHead>Permission</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {permissions.map((perm) => (
                  <TableRow key={perm.id}>
                    <TableCell>
                      {perm.user_display ? (
                        <Badge variant="outline">👤 {perm.user_display}</Badge>
                      ) : (
                        <Badge variant="outline">👥 {perm.group_display}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                        {perm.model_name}
                      </code>
                    </TableCell>
                    <TableCell>
                      <code className="text-sm font-mono">{perm.field_name}</code>
                    </TableCell>
                    <TableCell>
                      {perm.object_id ? (
                        <Badge variant="secondary">#{perm.object_id}</Badge>
                      ) : (
                        <span className="text-gray-400 text-sm">Tous</span>
                      )}
                    </TableCell>
                    <TableCell>{getPermissionBadge(perm.permission)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(perm.id)}
                      >
                        <Trash2 size={16} className="text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Aucune permission configurée
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de création/édition */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingPermission ? 'Modifier la Permission' : 'Nouvelle Permission'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Sélection Utilisateur ou Groupe */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="user">Utilisateur</Label>
                <Input
                  id="user"
                  type="number"
                  placeholder="ID utilisateur"
                  value={formData.user}
                  onChange={(e) =>
                    setFormData({ ...formData, user: e.target.value, group: '' })
                  }
                  disabled={!!formData.group}
                />
              </div>
              <div>
                <Label htmlFor="group">Groupe</Label>
                <Input
                  id="group"
                  type="number"
                  placeholder="ID groupe"
                  value={formData.group}
                  onChange={(e) =>
                    setFormData({ ...formData, group: e.target.value, user: '' })
                  }
                  disabled={!!formData.user}
                />
              </div>
            </div>

            {/* Sélection du modèle */}
            <div>
              <Label htmlFor="model">Modèle</Label>
              <Select
                value={formData.content_type}
                onValueChange={(value) =>
                  setFormData({ ...formData, content_type: value, field_name: '' })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un modèle" />
                </SelectTrigger>
                <SelectContent>
                  {availableModels?.map((model) => (
                    <SelectItem key={model.id} value={model.id.toString()}>
                      {model.app_label}.{model.model_name} ({model.model_verbose_name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sélection du champ */}
            {selectedModelData && (
              <div>
                <Label htmlFor="field">Champ</Label>
                <Select
                  value={formData.field_name}
                  onValueChange={(value) =>
                    setFormData({ ...formData, field_name: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un champ" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedModelData.fields.map((field) => (
                      <SelectItem key={field} value={field}>
                        {field}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* ID de l'objet (optionnel) */}
            <div>
              <Label htmlFor="object_id">ID Objet (optionnel)</Label>
              <Input
                id="object_id"
                type="number"
                placeholder="Laisser vide pour tous les objets"
                value={formData.object_id}
                onChange={(e) => setFormData({ ...formData, object_id: e.target.value })}
              />
              <p className="text-sm text-gray-500 mt-1">
                Si vide, la permission s'applique à tous les objets de ce modèle
              </p>
            </div>

            {/* Type de permission */}
            <div>
              <Label htmlFor="permission">Type de Permission</Label>
              <Select
                value={formData.permission}
                onValueChange={(value: 'read' | 'write') =>
                  setFormData({ ...formData, permission: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="read">
                    <div className="flex items-center gap-2">
                      <Eye size={16} />
                      Lecture
                    </div>
                  </SelectItem>
                  <SelectItem value="write">
                    <div className="flex items-center gap-2">
                      <Edit size={16} />
                      Écriture
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {editingPermission ? 'Mettre à jour' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
