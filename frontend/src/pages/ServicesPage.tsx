import { useEffect, useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Loader2, ChevronLeft, ChevronRight, Search as SearchIcon, Eye, ChevronsLeft, ChevronsRight, Upload } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { ImportExcelModal } from '@/components/services/ImportExcelModal';
import { usePermissions } from '@/hooks/use-permissions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Category {
  id: number;
  name: string;
}

interface Service {
  id: number;
  name: string;
  description: string;
  category?: Category;
  category_id?: number;
  price?: number | null;
  duration?: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface PaginatedResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Service[];
}


export function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editService, setEditService] = useState<Service | null>(null);
  const [form, setForm] = useState<Partial<Service>>({ name: '', description: '', price: null, duration: null, is_active: true });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<number | ''>('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [categoryId, setCategoryId] = useState<number | 'other' | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [togglingServices, setTogglingServices] = useState<Set<number>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
  const { 
    hasPermission
  } = usePermissions();
  const [totalItems, setTotalItems] = useState(0);

  // États pour l'import Excel
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  // Charger toutes les catégories depuis l'API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/catalog/categories/');
        setCategories(res.data.results || res.data);
      } catch (err) {
        setCategories([]);
      }
    };
    fetchCategories();
  }, []);

  const fetchServices = useCallback(async (page = 1) => {
    setLoading(true);
    setIsTransitioning(true);
    try {
      const params: any = { page, page_size: pageSize };
      if (search) params.search = search;
      if (categoryFilter) params.category = categoryFilter;
      if (statusFilter) params.is_active = statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined;
      const res = await api.get('/catalog/services/', { params });
      const data: PaginatedResponse = res.data;

      // Animation de transition
      setTimeout(() => {
        setServices(data.results);
        setTotalPages(Math.ceil(data.count / pageSize));
        setHasNext(!!data.next);
        setHasPrev(!!data.previous);
        setTotalItems(data.count);
        setIsTransitioning(false);
      }, 150);
    } catch (err) {
      toast.error('Erreur lors du chargement des prestations');
      setIsTransitioning(false);
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, statusFilter, pageSize]);

  useEffect(() => {
    fetchServices(currentPage);
  }, [fetchServices, currentPage]);

  const handleOpenDialog = (service?: Service) => {
    if (service) {
      setEditService(service);
      setForm(service);
      setCategoryId(service.category?.id || null);
      setNewCategoryName('');
    } else {
      setEditService(null);
      setForm({ name: '', description: '', price: null, duration: null, is_active: true });
      setCategoryId(null);
      setNewCategoryName('');
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditService(null);
    setForm({ name: '', description: '', price: null, duration: null, is_active: true });
    setCategoryId(null);
    setNewCategoryName('');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'price' || name === 'duration') {
      setForm({ ...form, [name]: value === '' ? null : parseFloat(value) });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let finalCategoryId = categoryId;
      
      // Si "Autre" pour catégorie, créer la catégorie d'abord
      if (categoryId === 'other' && newCategoryName.trim()) {
        const res = await api.post('/catalog/categories/', { name: newCategoryName.trim() });
        finalCategoryId = res.data.id;
        setCategories((prev) => [...prev, res.data]);
      }
      
      const payload = { 
        ...form, 
        category_id: finalCategoryId || null
      };
      
      if (editService) {
        await api.put(`/catalog/services/${editService.id}/`, payload);
        toast.success('Prestation modifiée');
      } else {
        await api.post('/catalog/services/', payload);
        toast.success('Prestation ajoutée');
      }
      fetchServices(currentPage);
      handleCloseDialog();
    } catch (err) {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (service: Service) => {
    try {
      await api.delete(`/catalog/services/${service.id}/`);
      setDeleteDialogOpen(false);
      setServiceToDelete(null);
      toast.success('Prestation supprimée');
      fetchServices(currentPage);
    } catch (err) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const openDeleteDialog = (service: Service) => {
    setServiceToDelete(service);
    setDeleteDialogOpen(true);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleCategoryFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCategoryFilter(e.target.value ? Number(e.target.value) : '');
    setCurrentPage(1);
  };

  const handleStatusFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleToggleStatus = async (service: Service) => {
    setTogglingServices(prev => new Set(prev).add(service.id));
    try {
      const updatedService = { ...service, is_active: !service.is_active };
      await api.put(`/catalog/services/${service.id}/`, updatedService);
      toast.success(`Prestation ${updatedService.is_active ? 'activée' : 'désactivée'}`);
      fetchServices(currentPage);
    } catch (err) {
      toast.error('Erreur lors du changement de statut');
    } finally {
      setTogglingServices(prev => {
        const newSet = new Set(prev);
        newSet.delete(service.id);
        return newSet;
      });
    }
  };


  // Fonctions de pagination améliorées avec optimisation
  const setPageSafely = useCallback((page: number) => {
    const safePage = Math.max(1, page);
    if (totalPages > 0) {
      const maxPage = Math.max(1, totalPages);
      setCurrentPage(Math.min(safePage, maxPage));
    } else {
      setCurrentPage(safePage);
    }
  }, [totalPages]);

  const getPageNumbers = useMemo(() => {
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
  }, [currentPage, totalPages]);

  // Gestionnaire de changement de taille de page
  const handlePageSizeChange = useCallback((value: string) => {
    setPageSize(Number(value));
    setCurrentPage(1); // Retour à la première page lors du changement de taille
  }, []);

  // Calcul des informations de pagination
  const paginationInfo = useMemo(() => {
    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, totalItems);
    return { start, end };
  }, [currentPage, pageSize, totalItems]);

  return (
    <div className="max-w-10xl mx-auto">
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <CardTitle>Catalogue des Prestations</CardTitle>
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative">
              <Input
                placeholder="Rechercher..."
                value={search}
                onChange={handleSearchChange}
                className="pl-8 pr-2"
              />
              <SearchIcon className="absolute left-2 top-2.5 text-gray-400" size={16} />
            </div>
            <select value={categoryFilter} onChange={handleCategoryFilter} className="border rounded px-2 py-1">
              <option value="">Toutes catégories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <select value={statusFilter} onChange={handleStatusFilter} className="border rounded px-2 py-1">
              <option value="">Tous statuts</option>
              <option value="active">Actives</option>
              <option value="inactive">Inactives</option>
            </select>
            {hasPermission('catalog.can_import_catalog') && (
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={() => setImportDialogOpen(true)}
              >
                <Upload size={16}/> Importer Excel
              </Button>
            )}

            {hasPermission('catalog.can_add_catalog') && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => handleOpenDialog()} size="sm" className="gap-2"><Plus size={16}/> Ajouter</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editService ? 'Modifier' : 'Ajouter'} une prestation</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {/* Sélecteur de catégorie */}
                    <div>
                      <label className="block text-sm font-medium mb-1">Catégorie</label>
                      <select
                        className="border rounded px-2 py-1 w-full"
                        value={categoryId ?? ''}
                        onChange={e => {
                          const val = e.target.value;
                          if (val === 'other') setCategoryId('other');
                          else setCategoryId(val ? Number(val) : null);
                        }}
                      >
                        <option value="">Sélectionner...</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                        <option value="other">Autre...</option>
                      </select>
                      {categoryId === 'other' && (
                        <Input
                          className="mt-2"
                          placeholder="Nouvelle catégorie"
                          value={newCategoryName}
                          onChange={e => setNewCategoryName(e.target.value)}
                        />
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Nom</label>
                      <Input name="name" placeholder="Nom" value={form.name || ''} onChange={handleChange} required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Description</label>
                      <textarea name="description" placeholder="Description" className="w-full border rounded p-2" value={form.description || ''} onChange={handleChange} ></textarea>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleSave} disabled={saving}>{saving ? <Loader2 className="animate-spin" size={16}/> : 'Enregistrer'}</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin" size={32}/></div>
          ) : (
            <>
              <div className={`transition-opacity duration-300 ${isTransitioning ? 'opacity-50' : 'opacity-100'}`}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Catégorie</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {services.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center">Aucune prestation</TableCell></TableRow>
                    ) : services.map(service => (
                      <TableRow key={service.id} className="transition-all duration-200 hover:bg-gray-50">
                      <TableCell>
                        <Link 
                          to={`/services/${service.id}`}
                          className="font-medium text-blue-600 hover:text-blue-600 hover:underline"
                        >
                          {service.name}
                        </Link>
                      </TableCell>
                      <TableCell>{service.category?.name || '-'}</TableCell>
                      <TableCell>{service.description}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant={service.is_active ? "default" : "destructive"}>
                            {service.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleToggleStatus(service)}
                            disabled={togglingServices.has(service.id)}
                            className="text-xs"
                          >
                            {togglingServices.has(service.id) ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              service.is_active ? 'Désactiver' : 'Activer'
                            )}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="flex gap-2">
                        <Link to={`/services/${service.id}`}>
                          <Button size="icon" variant="ghost" title="Voir les détails">
                            <Eye size={16}/>
                          </Button>
                        </Link>
                        {hasPermission('catalog.can_edit_catalog') && (
                          <Button size="icon" variant="ghost" onClick={() => handleOpenDialog(service)}><Edit size={16}/></Button>
                        )}
                        {hasPermission('catalog.can_delete_catalog') && (
                          <Button size="icon" variant="ghost" onClick={() => openDeleteDialog(service)}><Trash2 size={16}/></Button>
                        )}
                      </TableCell>
                    </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination améliorée */}
              <div className="flex flex-col lg:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t">
                {/* Informations de pagination et sélecteur de taille */}
                <div className="flex flex-col sm:flex-row items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Afficher</span>
                    <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                      <SelectTrigger className="w-20 h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className="text-gray-600">par page</span>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 text-gray-600">
                    <span>•</span>
                    <span>
                      Affichage de <span className="font-semibold text-gray-900">{paginationInfo.start}</span> à{' '}
                      <span className="font-semibold text-gray-900">{paginationInfo.end}</span> sur{' '}
                      <span className="font-semibold text-gray-900">{totalItems}</span> résultats
                    </span>
                  </div>
                </div>

                {/* Contrôles de pagination améliorés */}
                <div className="flex items-center gap-2">
                  {/* Bouton Première page */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPageSafely(1)}
                    disabled={currentPage === 1}
                    className="hidden sm:flex h-9 transition-all duration-200 hover:scale-105"
                    title="Première page"
                  >
                    <ChevronsLeft size={16} />
                    <span className="ml-1 hidden lg:inline">Première</span>
                  </Button>

                  {/* Bouton Précédent */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPageSafely(currentPage - 1)}
                    disabled={!hasPrev || currentPage === 1}
                    className="h-9 transition-all duration-200 hover:scale-105"
                    title="Page précédente"
                  >
                    <ChevronLeft size={16} />
                    <span className="ml-1 hidden lg:inline">Précédent</span>
                  </Button>

                  {/* Numéros de page */}
                  <div className="flex items-center gap-1">
                    {getPageNumbers.map(pageNum => (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPageSafely(pageNum)}
                        className={`w-9 h-9 hidden sm:flex transition-all duration-200 ${
                          currentPage === pageNum
                            ? 'scale-110 shadow-md'
                            : 'hover:scale-105'
                        }`}
                      >
                        {pageNum}
                      </Button>
                    ))}

                    {/* Version mobile avec sélecteur amélioré */}
                    <div className="sm:hidden flex items-center gap-2">
                      <span className="text-sm text-gray-600">Page</span>
                      <Select value={currentPage.toString()} onValueChange={(val) => setPageSafely(parseInt(val))}>
                        <SelectTrigger className="w-16 h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                            <SelectItem key={pageNum} value={pageNum.toString()}>
                              {pageNum}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span className="text-sm text-gray-600">/ {totalPages}</span>
                    </div>
                  </div>

                  {/* Bouton Suivant */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPageSafely(currentPage + 1)}
                    disabled={!hasNext || currentPage === totalPages}
                    className="h-9 transition-all duration-200 hover:scale-105"
                    title="Page suivante"
                  >
                    <span className="mr-1 hidden lg:inline">Suivant</span>
                    <ChevronRight size={16} />
                  </Button>

                  {/* Bouton Dernière page */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPageSafely(totalPages)}
                    disabled={currentPage === totalPages}
                    className="hidden sm:flex h-9 transition-all duration-200 hover:scale-105"
                    title="Dernière page"
                  >
                    <span className="mr-1 hidden lg:inline">Dernière</span>
                    <ChevronsRight size={16} />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog de suppression de service */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer la prestation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600">
              Êtes-vous sûr de vouloir supprimer cette prestation ?
            </p>
            {serviceToDelete && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Nom :</span>
                    <p className="text-gray-600">{serviceToDelete.name}</p>
                  </div>
                  <div>
                    <span className="font-medium">Catégorie :</span>
                    <p className="text-gray-600">{serviceToDelete.category?.name || 'Aucune'}</p>
                  </div>
                  <div>
                    <span className="font-medium">Description :</span>
                    <p className="text-gray-600">{serviceToDelete.description || 'Aucune'}</p>
                  </div>
                  <div>
                    <span className="font-medium">Statut :</span>
                    <div className="mt-1">
                      <Badge variant={serviceToDelete.is_active ? "default" : "destructive"}>
                        {serviceToDelete.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <p className="text-sm text-red-600">
              Cette action est irréversible et supprimera définitivement cette prestation et toutes ses activités associées.
            </p>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setDeleteDialogOpen(false);
                setServiceToDelete(null);
              }}
            >
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => handleDelete(serviceToDelete!)}
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal d'import Excel */}
      <ImportExcelModal
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        categories={categories}
        onImportSuccess={() => fetchServices(currentPage)}
      />
    </div>
  );
} 