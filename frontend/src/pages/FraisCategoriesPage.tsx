import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Switch } from '../components/ui/switch';
import { useToast } from '../hooks/use-toast';
import { 
  useFraisCategories, 
  useCreateFraisCategory, 
  useUpdateFraisCategory, 
  useDeleteFraisCategory 
} from '../hooks/use-frais-categories';
import { FraisCategory, FraisCategoryCreateData, FraisCategoryUpdateData } from '../lib/types';
import { Search, Plus, Edit, Trash2, X } from 'lucide-react';

const FraisCategoriesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<FraisCategory | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<FraisCategory | null>(null);
  const [form, setForm] = useState<FraisCategoryCreateData>({
    name: '',
    description: '',
    is_active: true,
  });

  const { toast } = useToast();
  const { data: categories = [], isLoading, error } = useFraisCategories();
  const createMutation = useCreateFraisCategory();
  const updateMutation = useUpdateFraisCategory();
  const deleteMutation = useDeleteFraisCategory();

  // Filtrer les catégories par recherche
  const filteredCategories = useMemo(() => {
    if (!Array.isArray(categories)) return [];
    return categories.filter(category =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [categories, searchTerm]);

  const handleOpenCreateDialog = () => {
    setForm({ name: '', description: '', is_active: true });
    setIsCreateDialogOpen(true);
  };

  const handleOpenEditDialog = (category: FraisCategory) => {
    setEditingCategory(category);
    setForm({
      name: category.name,
      description: category.description,
      is_active: category.is_active,
    });
  };

  const handleSave = async () => {
    try {
      if (editingCategory) {
        await updateMutation.mutateAsync({ id: editingCategory.id, data: form });
        toast({
          title: "Succès",
          description: "Catégorie de frais mise à jour avec succès",
        });
        setEditingCategory(null);
      } else {
        await createMutation.mutateAsync(form);
        toast({
          title: "Succès",
          description: "Catégorie de frais créée avec succès",
        });
        setIsCreateDialogOpen(false);
      }
      setForm({ name: '', description: '', is_active: true });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la sauvegarde",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!deletingCategory) return;
    
    try {
      await deleteMutation.mutateAsync(deletingCategory.id);
      toast({
        title: "Succès",
        description: "Catégorie de frais supprimée avec succès",
      });
      setDeletingCategory(null);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression",
        variant: "destructive",
      });
    }
  };

  if (error) {
    return (
      <div className="max-w-8xl mx-auto space-y-8">
        <Card>
          <CardContent className="p-6">
            <p className="text-red-500">Erreur lors du chargement des catégories de frais</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-8xl mx-auto space-y-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Catégories de Frais</h1>
        <Button onClick={handleOpenCreateDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle Catégorie
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gestion des Catégories de Frais</CardTitle>
          <div className="flex items-center space-x-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une catégorie..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setSearchTerm('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Chargement...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      {searchTerm ? 'Aucune catégorie trouvée' : 'Aucune catégorie de frais'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCategories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell className="max-w-md truncate">
                        {category.description}
                      </TableCell>
                      <TableCell>
                        <Badge variant={category.is_active ? "default" : "secondary"}>
                          {category.is_active ? "Actif" : "Inactif"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEditDialog(category)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeletingCategory(category)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog de création/édition */}
      <Dialog open={isCreateDialogOpen || !!editingCategory} onOpenChange={(open) => {
        if (!open) {
          setIsCreateDialogOpen(false);
          setEditingCategory(null);
          setForm({ name: '', description: '', is_active: true });
        }
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Modifier la Catégorie' : 'Nouvelle Catégorie'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nom</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nom de la catégorie"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Description de la catégorie"
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={form.is_active}
                onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
              />
              <Label htmlFor="is_active">Actif</Label>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                setEditingCategory(null);
                setForm({ name: '', description: '', is_active: true });
              }}
            >
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={!form.name.trim()}>
              {editingCategory ? 'Modifier' : 'Créer'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmation de suppression */}
      <Dialog open={!!deletingCategory} onOpenChange={(open) => !open && setDeletingCategory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <p>
            Êtes-vous sûr de vouloir supprimer la catégorie "{deletingCategory?.name}" ?
            Cette action est irréversible.
          </p>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setDeletingCategory(null)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Supprimer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FraisCategoriesPage; 