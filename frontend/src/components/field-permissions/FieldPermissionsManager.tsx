import React, { useState } from 'react';
import {
  useFieldPermissions,
  useDeleteFieldPermission,
} from '@/hooks/use-field-permissions';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Trash2, Edit, Eye, Shield, Search, ChevronLeft, ChevronRight } from 'lucide-react';

export const FieldPermissionsManager: React.FC = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data: permissionsData, isLoading } = useFieldPermissions({
    search,
    page,
    page_size: pageSize,
  });
  const deleteMutation = useDeleteFieldPermission();

  const permissions = permissionsData?.results || [];
  const totalCount = permissionsData?.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  const handleDelete = (id: number) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette permission ?')) {
      deleteMutation.mutate(id);
    }
  };


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
        </CardHeader>
        <CardContent>
          {/* Barre de recherche */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                placeholder="Rechercher par utilisateur, modèle ou champ..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1); // Reset to first page on search
                }}
                className="pl-10"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8">Chargement...</div>
          ) : permissions && permissions.length > 0 ? (
            <>
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
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
                      <Badge variant="outline">👤 {perm.user_display || 'N/A'}</Badge>
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

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-600">
                Affichage {permissions.length > 0 ? ((page - 1) * pageSize + 1) : 0} à {Math.min(page * pageSize, totalCount)} sur {totalCount} permissions
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1 || isLoading}
                >
                  <ChevronLeft size={16} className="mr-1" />
                  Précédent
                </Button>
                <div className="flex items-center px-3 text-sm">
                  Page {page} sur {totalPages || 1}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= totalPages || isLoading}
                >
                  Suivant
                  <ChevronRight size={16} className="ml-1" />
                </Button>
              </div>
            </div>
          </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              {search ? 'Aucun résultat trouvé' : 'Aucune permission configurée'}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
