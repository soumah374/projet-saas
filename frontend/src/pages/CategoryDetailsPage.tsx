import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, 
  Edit, 
  Clock, 
  Activity, 
  Loader2, 
  Building2,
  FileText,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

// Types
interface Category {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

interface Service {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  activities_count?: number;
}

interface PaginatedResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Service[];
}

export function CategoryDetailsPage() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [category, setCategory] = useState<Category | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: ''
  });
  const [saving, setSaving] = useState(false);
  
  // États de pagination pour les services
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 10;
  
  // État pour la recherche de services
  const [serviceSearchTerm, setServiceSearchTerm] = useState('');

  // Fonctions de pagination pour les services
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

  // Reset à la première page quand la recherche change
  useEffect(() => {
    setCurrentPage(1);
  }, [serviceSearchTerm]);

  const fetchCategoryDetails = async () => {
    if (!categoryId) return;
    
    setLoading(true);
    try {
      const res = await api.get(`/catalog/categories/${categoryId}/`);
      setCategory(res.data);
    } catch (err) {
      toast.error('Erreur lors du chargement de la catégorie');
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async (page = 1) => {
    if (!categoryId) return;
    
    setServicesLoading(true);
    try {
      const params: any = { 
        page, 
        page_size: pageSize,
        category: categoryId
      };
      if (serviceSearchTerm) params.search = serviceSearchTerm;
      
      const res = await api.get('/catalog/services/', { params });
      const data: PaginatedResponse = res.data;
      setServices(data.results);
      setTotalPages(Math.ceil(data.count / pageSize));
      setHasNext(!!data.next);
      setHasPrev(!!data.previous);
      setTotalItems(data.count);
    } catch (err) {
      toast.error('Erreur lors du chargement des services');
    } finally {
      setServicesLoading(false);
    }
  };

  useEffect(() => {
    fetchCategoryDetails();
  }, [categoryId]);

  useEffect(() => {
    if (category) {
      fetchServices(currentPage);
    }
  }, [category, currentPage, serviceSearchTerm]);

  // Pré-remplir le formulaire d'édition quand on ouvre la modale
  const handleOpenEditDialog = () => {
    if (!category) return;
    setEditForm({
      name: category.name || ''
    });
    setDialogOpen(true);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditForm({ ...editForm, [name]: value });
  };

  const handleSaveEdit = async () => {
    if (!category || !editForm.name.trim()) {
      toast.error('Le nom de la catégorie est requis');
      return;
    }
    
    setSaving(true);
    try {
      await api.put(`/catalog/categories/${category.id}/`, {
        name: editForm.name.trim()
      });
      toast.success('Catégorie modifiée');
      setDialogOpen(false);
      fetchCategoryDetails();
    } catch (err: any) {
      if (err.response?.data?.name) {
        toast.error('Une catégorie avec ce nom existe déjà');
      } else {
        toast.error('Erreur lors de la modification');
      }
    } finally {
      setSaving(false);
    }
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

  if (loading) {
    return (
      <div className="max-w-8xl mx-auto">
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin" size={32} />
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="max-w-8xl mx-auto">
        <div className="text-center py-10">
          <p className="text-gray-500">Catégorie non trouvée</p>
          <Link to="/categories-services">
            <Button className="mt-4">Retour aux catégories</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-8xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/categories-services">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{category.name}</h1>
            <p className="text-gray-500">Détails de la catégorie</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={handleOpenEditDialog}>
            <Edit className="h-4 w-4 mr-2" />
            Modifier
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informations principales */}
        <div className="lg:col-span-2 space-y-6">
          {/* Détails de la catégorie */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Informations générales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Nom</label>
                  <p className="text-gray-900">{category.name}</p>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="text-sm font-medium text-gray-500">Créé le</label>
                  <p className="text-gray-900">{formatDate(category.created_at)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Modifié le</label>
                  <p className="text-gray-900">{formatDate(category.updated_at)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Services associés */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Services associés ({totalItems})
              </CardTitle>
              <Link to="/services">
                <Button size="sm" className="gap-2">
                  <Plus size={16} />
                  Voir tous les services
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {/* Barre de recherche */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Rechercher un service..."
                    value={serviceSearchTerm}
                    onChange={(e) => setServiceSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                  {serviceSearchTerm && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setServiceSearchTerm('')}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                    >
                      ×
                    </Button>
                  )}
                </div>
              </div>

              {servicesLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="animate-spin" size={24} />
                </div>
              ) : services.length > 0 ? (
                <>
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
                      {services.map(service => (
                        <TableRow key={service.id}>
                          <TableCell className="font-medium">
                            <Link 
                              to={`/services/${service.id}`}
                              className="text-blue-600 hover:text-blue-600 hover:underline"
                            >
                              {service.name}
                            </Link>
                          </TableCell>
                          <TableCell className="max-w-md">
                            <p className="truncate text-sm text-gray-600">
                              {service.description || 'Aucune description'}
                            </p>
                          </TableCell>
                          <TableCell>
                            <Badge variant={service.is_active ? "default" : "destructive"}>
                              {service.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Link to={`/services/${service.id}`}>
                              <Button variant="outline" size="sm">
                                <Activity className="h-4 w-4 mr-2" />
                                Voir détails
                              </Button>
                            </Link>
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
                          {totalItems} services au total
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
                          <span className="ml-1 hidden lg:inline">Première</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPageSafely(currentPage - 1)}
                          disabled={!hasPrev || currentPage === 1}
                        >
                          <ChevronLeft size={16} />
                          <span className="ml-1 hidden lg:inline">Précédent</span>
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
                          <span className="mr-1 hidden lg:inline">Suivant</span>
                          <ChevronRight size={16} />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPageSafely(totalPages)}
                          disabled={currentPage === totalPages}
                          className="hidden sm:flex"
                        >
                          <span className="mr-1 hidden lg:inline">Dernière</span>
                          <ChevronsRight size={16} />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : serviceSearchTerm ? (
                <div className="text-center py-8 text-gray-500">
                  <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Aucun service trouvé pour "{serviceSearchTerm}"</p>
                  <Button 
                    onClick={() => setServiceSearchTerm('')} 
                    className="mt-4" 
                    variant="outline"
                  >
                    Effacer la recherche
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Aucun service associé à cette catégorie</p>
                  <Link to="/services">
                    <Button className="mt-4" variant="outline">
                      <Plus size={16} className="mr-2" />
                      Voir tous les services
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar avec statistiques */}
        <div className="space-y-6">
          {/* Statistiques */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Statistiques</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <span className="text-sm text-gray-600">Services</span>
                </div>
                <span className="font-semibold">{totalItems}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-gray-600">Services actifs</span>
                </div>
                <span className="font-semibold">
                  {services.filter(s => s.is_active).length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-purple-500" />
                  <span className="text-sm text-gray-600">Créée le</span>
                </div>
                <span className="font-semibold text-sm">
                  {formatDate(category.created_at)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Actions rapides */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Actions rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link to="/services">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Voir tous les services
                </Button>
              </Link>
              <Link to="/categories">
                <Button variant="outline" className="w-full justify-start">
                  <Building2 className="h-4 w-4 mr-2" />
                  Retour aux catégories
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal d'édition de la catégorie */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier la catégorie</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nom de la catégorie</label>
              <Input
                name="name"
                placeholder="Ex: SERVICE D'EXÉCUTION"
                value={editForm.name}
                onChange={handleEditChange}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving ? <Loader2 className="animate-spin" size={16}/> : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 