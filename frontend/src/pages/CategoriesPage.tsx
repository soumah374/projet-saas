import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Loader2, ChevronLeft, ChevronRight, Search as SearchIcon, Eye, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface Category {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

interface PaginatedResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Category[];
}

export function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [form, setForm] = useState<Partial<Category>>({ name: '' });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const pageSize = 20;
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [totalItems, setTotalItems] = useState(0);

  // Fonctions de pagination améliorées
  const setPageSafely = (page: number) => {
    const safePage = Math.max(1, page);
    if (totalPages > 0) {
      const maxPage = Math.max(1, totalPages);
      setCurrentPage(Math.min(safePage, maxPage));
    } else {
      setCurrentPage(safePage);
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      let start = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
      let end = Math.min(totalPages, start + maxVisiblePages - 1);
      
      if (end === totalPages) {
        start = Math.max(1, end - maxVisiblePages + 1);
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };

  const fetchCategories = async (page = 1) => {
    setLoading(true);
    try {
      const params: any = { page, page_size: pageSize };
      if (search) params.search = search;
      const res = await api.get('/catalog/categories/', { params });
      const data: PaginatedResponse = res.data;
      setCategories(data.results);
      setTotalPages(Math.ceil(data.count / pageSize));
      setHasNext(!!data.next);
      setHasPrev(!!data.previous);
      setTotalItems(data.count);
    } catch (err) {
      toast.error('Erreur lors du chargement des catégories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories(currentPage);
    // eslint-disable-next-line
  }, [search, currentPage]);

  const handleOpenDialog = (category?: Category) => {
    if (category) {
      setEditCategory(category);
      setForm(category);
    } else {
      setEditCategory(null);
      setForm({ name: '' });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditCategory(null);
    setForm({ name: '' });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSave = async () => {
    if (!form.name?.trim()) {
      toast.error('Le nom de la catégorie est requis');
      return;
    }

    setSaving(true);
    try {
      const payload = { name: form.name.trim() };
      
      if (editCategory) {
        await api.put(`/catalog/categories/${editCategory.id}/`, payload);
        toast.success('Catégorie modifiée');
      } else {
        await api.post('/catalog/categories/', payload);
        toast.success('Catégorie ajoutée');
      }
      fetchCategories(currentPage);
      handleCloseDialog();
    } catch (err: any) {
      if (err.response?.data?.name) {
        toast.error('Une catégorie avec ce nom existe déjà');
      } else {
        toast.error('Erreur lors de la sauvegarde');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category: Category) => {
    try {
      await api.delete(`/catalog/categories/${category.id}/`);
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
      toast.success('Catégorie supprimée');
      fetchCategories(currentPage);
    } catch (err: any) {
      if (err.response?.status === 400) {
        toast.error('Impossible de supprimer cette catégorie car elle est utilisée par des prestations');
      } else {
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  const openDeleteDialog = (category: Category) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-10xl mx-auto">
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <CardTitle>Catégories des Prestations</CardTitle>
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative">
              <Input
                placeholder="Rechercher une catégorie..."
                value={search}
                onChange={handleSearchChange}
                className="pl-8 pr-2"
              />
              <SearchIcon className="absolute left-2 top-2.5 text-gray-400" size={16} />
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                {/* <Button onClick={() => handleOpenDialog()} size="sm" className="gap-2"><Plus size={16}/> Ajouter</Button> */}
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editCategory ? 'Modifier' : 'Ajouter'} une catégorie</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nom de la catégorie</label>
                    <Input 
                      name="name" 
                      placeholder="Ex: SERVICE D'EXÉCUTION" 
                      value={form.name || ''} 
                      onChange={handleChange} 
                      required 
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 className="animate-spin" size={16}/> : 'Enregistrer'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin" size={32}/></div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    {/* <TableHead>Prestations associées</TableHead> */}
                    {/* <TableHead>Date de création</TableHead> */}
                    {/* <TableHead>Dernière modification</TableHead> */}
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center">Aucune catégorie</TableCell></TableRow>
                  ) : categories.map(category => (
                    <TableRow key={category.id}>
                      <TableCell className="">
                        <Link 
                          to={`/categories-services/${category.id}`}
                          className="font-medium text-blue-600 hover:text-blue-600 hover:underline"
                        >
                          {category.name}
                        </Link>
                      </TableCell>
                      {/* <TableCell>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-600">
                          Voir prestations
                        </Badge>
                      </TableCell> */}
                      {/* <TableCell>{formatDate(category.created_at)}</TableCell> */}
                      {/* <TableCell>{formatDate(category.updated_at)}</TableCell> */}
                      <TableCell className="flex gap-2">
                        <Link to={`/categories-services/${category.id}`}>
                          <Button size="icon" variant="ghost" title="Voir les détails">
                            <Eye size={16}/>
                          </Button>
                        </Link>
                        {/* <Button size="icon" variant="ghost" onClick={() => handleOpenDialog(category)}>
                          <Edit size={16}/>
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => openDeleteDialog(category)}>
                          <Trash2 size={16}/>
                        </Button> */}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
                  {/* Informations de pagination */}
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>
                      Page {currentPage} sur {totalPages}
                    </span>
                    <span className="hidden sm:inline">•</span>
                    <span className="hidden sm:inline">
                      {totalItems} catégories au total
                    </span>
                  </div>

                  {/* Contrôles de pagination */}
                  <div className="flex items-center gap-2">
                    {/* Boutons de navigation rapide */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPageSafely(1)}
                      disabled={currentPage === 1}
                      className="hidden sm:flex"
                    >
                      <ChevronsLeft size={16} />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPageSafely(currentPage - 1)}
                      disabled={!hasPrev || currentPage === 1}
                    >
                      <ChevronLeft size={16} />
                    </Button>

                    {/* Numéros de page */}
                    <div className="flex items-center gap-1">
                      {getPageNumbers().map(pageNum => (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setPageSafely(pageNum)}
                          className="w-8 h-8 text-xs hidden sm:flex"
                        >
                          {pageNum}
                        </Button>
                      ))}
                      {/* Version mobile avec sélecteur */}
                      <div className="sm:hidden flex items-center gap-2">
                        <span className="text-sm text-gray-600">Page</span>
                        <select
                          value={currentPage}
                          onChange={(e) => setPageSafely(parseInt(e.target.value))}
                          className="border rounded px-2 py-1 text-sm"
                        >
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                            <option key={pageNum} value={pageNum}>
                              {pageNum}
                            </option>
                          ))}
                        </select>
                        <span className="text-sm text-gray-600">sur {totalPages}</span>
                      </div>
                    </div>

                    {/* Boutons de navigation rapide */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPageSafely(currentPage + 1)}
                      disabled={!hasNext || currentPage === totalPages}
                    >
                      <ChevronRight size={16} />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPageSafely(totalPages)}
                      disabled={currentPage === totalPages}
                      className="hidden sm:flex"
                    >
                      <ChevronsRight size={16} />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog de suppression de catégorie */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer la catégorie</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600">
              Êtes-vous sûr de vouloir supprimer cette catégorie ?
            </p>
            {categoryToDelete && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Nom :</span>
                    <p className="text-gray-600">{categoryToDelete.name}</p>
                  </div>
                  <div>
                    <span className="font-medium">Date de création :</span>
                    <p className="text-gray-600">{formatDate(categoryToDelete.created_at)}</p>
                  </div>
                </div>
              </div>
            )}
            <p className="text-sm text-red-600">
              Cette action est irréversible. Si cette catégorie est utilisée par des prestations, la suppression sera impossible.
            </p>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setDeleteDialogOpen(false);
                setCategoryToDelete(null);
              }}
            >
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => handleDelete(categoryToDelete!)}
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 