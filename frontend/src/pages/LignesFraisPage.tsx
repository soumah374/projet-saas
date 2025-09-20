import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Switch } from '../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from '../components/ui/pagination';
import { useToast } from '../hooks/use-toast';
import { 
  useLignesFrais, 
  useCreateLigneFrais, 
  useUpdateLigneFrais, 
  useDeleteLigneFrais 
} from '../hooks/use-lignes-frais';
import { useFraisCategories } from '../hooks/use-frais-categories';
import { LigneFraisCreateData, LigneFraisList } from '../lib/types';
import { Search, Plus, Edit, Trash2, X, RotateCcw } from 'lucide-react';
import { usePermissions } from '@/hooks/use-permissions';

const TYPE_FRAIS_OPTIONS = [
  { value: 'rh', label: 'Budget RH mobilisé' },
  { value: 'technique', label: 'Frais techniques et matériels' },
  { value: 'sous_traitance', label: 'Sous-traitance / prestataires externes' },
  { value: 'deplacement', label: 'Déplacements et logistique' },
  { value: 'administratif', label: 'Frais administratifs et annexes' },
  { value: 'marge', label: 'Marge commerciale et ajustements' },
  { value: 'taxes', label: 'Taxes et TVA' },
];

const LignesFraisPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingLigne, setEditingLigne] = useState<LigneFraisList | null>(null);
  const [deletingLigne, setDeletingLigne] = useState<LigneFraisList | null>(null);
  const [form, setForm] = useState<LigneFraisCreateData>({
    type_frais: 'rh',
    category_id: 0,
    description: '',
    is_active: true,
  });

  const { toast } = useToast();
  const { data: lignesData, isLoading, error } = useLignesFrais(
    currentPage, 
    pageSize, 
    debouncedSearchTerm || undefined, 
    selectedType !== 'all' ? selectedType : undefined, 
    selectedCategory !== 'all' ? selectedCategory : undefined
  );
  const { data: categories = [], isLoading: categoriesLoading } = useFraisCategories();
  const createMutation = useCreateLigneFrais();
  const updateMutation = useUpdateLigneFrais();
  const deleteMutation = useDeleteLigneFrais();

  const lignes = lignesData?.results || [];
  const totalCount = lignesData?.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  const { 
    hasPermission
  } = usePermissions();

  // Reset to first page when page size changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [pageSize]);

  // Debounce pour la recherche
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleOpenCreateDialog = () => {
    setForm({ type_frais: 'rh', category_id: 0, description: '', is_active: true });
    setIsCreateDialogOpen(true);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setSelectedType('all');
    setSelectedCategory('all');
    setCurrentPage(1);
  };

  const handleOpenEditDialog = (ligne: LigneFraisList) => {
    setEditingLigne(ligne);
    setForm({
      type_frais: ligne.type_frais,
      category_id: ligne.category?.id || 0, 
      description: ligne.description,
      is_active: ligne.is_active,
    });
  };

  const handleSave = async () => {
    try {
      if (editingLigne) {
        await updateMutation.mutateAsync({ id: editingLigne.id, data: form });
        toast({
          title: "Succès",
          description: "Ligne de frais mise à jour avec succès",
        });
        setEditingLigne(null);
      } else {
        await createMutation.mutateAsync(form);
        toast({
          title: "Succès",
          description: "Ligne de frais créée avec succès",
        });
        setIsCreateDialogOpen(false);
      }
      setForm({ type_frais: 'rh', category_id: 0, description: '', is_active: true });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la sauvegarde",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!deletingLigne) return;
    
    try {
      await deleteMutation.mutateAsync(deletingLigne.id);
      toast({
        title: "Succès",
        description: "Ligne de frais supprimée avec succès",
      });
      setDeletingLigne(null);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression",
        variant: "destructive",
      });
    }
  };

  const getCategoryName = (categoryId: number | undefined) => {
    if (!categoryId || !Array.isArray(categories)) return 'Catégorie inconnue';
    const category = categories.find(cat => cat.id === categoryId);
    return category?.name || 'Catégorie inconnue';
  };

  const getTypeFraisLabel = (type: string) => {
    const option = TYPE_FRAIS_OPTIONS.find(opt => opt.value === type);
    return option?.label || type;
  };

  if (error) {
    return (
      <div className="max-w-8xl mx-auto space-y-8">
        <Card>
          <CardContent className="p-6">
            <p className="text-red-500">Erreur lors du chargement des lignes de frais</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-8xl mx-auto space-y-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Lignes de Frais</h1>
        {hasPermission('catalog.add_lignefrais') && (
          <Button onClick={handleOpenCreateDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle Ligne
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gestion des Lignes de Frais</CardTitle>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une ligne..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
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
              <div className="flex gap-2">
               <Select value={selectedType} onValueChange={(value) => {
                 setSelectedType(value);
                 setCurrentPage(1);
               }}>
                 <SelectTrigger className="w-[200px]">
                   <SelectValue placeholder="Type de frais" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="all">Tous les types</SelectItem>
                   {TYPE_FRAIS_OPTIONS.map((option) => (
                     <SelectItem key={option.value} value={option.value}>
                       {option.label}
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
               <Select value={selectedCategory} onValueChange={(value) => {
                 setSelectedCategory(value);
                 setCurrentPage(1);
               }}>
                 <SelectTrigger className="w-[200px]" disabled={categoriesLoading}>
                   <SelectValue placeholder={categoriesLoading ? "Chargement..." : "Catégorie"} />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="all">Toutes les catégories</SelectItem>
                   {Array.isArray(categories) && categories.map((category) => (
                     <SelectItem key={category.id} value={category.id.toString()}>
                       {category.name}
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
               {(debouncedSearchTerm || selectedType !== 'all' || selectedCategory !== 'all') && (
                 <Button
                   variant="outline"
                   size="sm"
                   onClick={handleResetFilters}
                   className="flex items-center gap-2"
                 >
                   <RotateCcw className="h-4 w-4" />
                   Réinitialiser
                 </Button>
               )}
             </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Chargement des lignes de frais...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lignes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                       {searchTerm || selectedType !== 'all' || selectedCategory !== 'all' ? 'Aucune ligne trouvée' : 'Aucune ligne de frais'}
                    </TableCell>
                  </TableRow>
                ) : (
                  lignes.map((ligne) => (
                    <TableRow key={ligne.id}>
                      <TableCell>
                        <Badge variant="outline">
                          {getTypeFraisLabel(ligne.type_frais)}
                        </Badge>
                      </TableCell>
                          <TableCell className="font-medium">
                          {ligne.category.name}
                        </TableCell>
                      <TableCell className="max-w-md truncate">
                        {ligne.description}
                      </TableCell>
                      <TableCell>
                        <Badge variant={ligne.is_active ? "default" : "secondary"}>
                          {ligne.is_active ? "Actif" : "Inactif"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {hasPermission('catalog.change_lignefrais') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEditDialog(ligne)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          )}
                          {hasPermission('catalog.delete_lignefrais') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeletingLigne(ligne)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Affichage de</span>
                  <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(parseInt(value))}>
                    <SelectTrigger className="w-20 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                  <span>éléments par page</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalCount)} sur {totalCount} lignes
                </div>
              </div>
              
              <Pagination>
                <PaginationContent>
                  {/* Première page */}
                  <PaginationItem>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage(1);
                      }}
                      className={currentPage <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      aria-label="Aller à la première page"
                    >
                      <span className="text-sm">«</span>
                    </PaginationLink>
                  </PaginationItem>
                  
                  {/* Page précédente */}
                  <PaginationItem>
                    <PaginationPrevious 
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) {
                          setCurrentPage(currentPage - 1);
                        }
                      }}
                      className={currentPage <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  
                  {/* Numéros de pages */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(pageNum);
                          }}
                          isActive={currentPage === pageNum}
                          className="cursor-pointer"
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  
                  {/* Page suivante */}
                  <PaginationItem>
                    <PaginationNext 
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < totalPages) {
                          setCurrentPage(currentPage + 1);
                        }
                      }}
                      className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  
                  {/* Dernière page */}
                  <PaginationItem>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage(totalPages);
                      }}
                      className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      aria-label="Aller à la dernière page"
                    >
                      <span className="text-sm">»</span>
                    </PaginationLink>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de création/édition */}
      <Dialog open={isCreateDialogOpen || !!editingLigne} onOpenChange={(open) => {
        if (!open) {
          setIsCreateDialogOpen(false);
          setEditingLigne(null);
          setForm({ type_frais: 'rh', category_id: 0, description: '', is_active: true });
        }
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingLigne ? 'Modifier la Ligne' : 'Nouvelle Ligne de Frais'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="type_frais">Type de frais</Label>
              <Select value={form.type_frais} onValueChange={(value) => setForm({ ...form, type_frais: value as any })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_FRAIS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Catégorie</Label>
              <Select value={(form.category_id || 0).toString()} onValueChange={(value) => setForm({ ...form, category_id: parseInt(value) })}>
                <SelectTrigger disabled={categoriesLoading}>
                  <SelectValue placeholder={categoriesLoading ? "Chargement..." : "Sélectionner une catégorie"} />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(categories) && categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Description de la ligne de frais"
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
                setEditingLigne(null);
                setForm({ type_frais: 'rh', category_id: 0, description: '', is_active: true });
              }}
            >
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={!form.description.trim() || form.category_id === 0}>
              {editingLigne ? 'Modifier' : 'Créer'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmation de suppression */}
      <Dialog open={!!deletingLigne} onOpenChange={(open) => !open && setDeletingLigne(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <p>
            Êtes-vous sûr de vouloir supprimer la ligne "{deletingLigne?.description}" ?
            Cette action est irréversible.
          </p>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setDeletingLigne(null)}>
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

export default LignesFraisPage; 