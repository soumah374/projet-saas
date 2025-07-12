import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Loader2, ChevronLeft, ChevronRight, Search as SearchIcon } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface Category {
  id: number;
  name: string;
}

interface IntervenantProfile {
  id: number;
  name: string;
}

interface Service {
  id: number;
  name: string;
  description: string;
  category?: Category;
  category_id?: number;
  price: string;
  duration?: number;
  profile_intervenant?: IntervenantProfile;
  profile_intervenant_id?: number;
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
  const [form, setForm] = useState<Partial<Service>>({ name: '', description: '', price: '', duration: undefined, is_active: true });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<number | ''>('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const pageSize = 10;
  const [profiles, setProfiles] = useState<IntervenantProfile[]>([]);
  const [profileId, setProfileId] = useState<number | 'other' | null>(null);
  const [newProfileName, setNewProfileName] = useState('');
  const [profileFilter, setProfileFilter] = useState<number | ''>('');
  const [categoryId, setCategoryId] = useState<number | 'other' | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [togglingServices, setTogglingServices] = useState<Set<number>>(new Set());

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

  // Charger les profils intervenant
  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const res = await api.get('/catalog/profiles/');
        setProfiles(res.data.results || res.data);
      } catch (err) {
        setProfiles([]);
      }
    };
    fetchProfiles();
  }, [dialogOpen]);

  const fetchServices = async (page = 1) => {
    setLoading(true);
    try {
      const params: any = { page, page_size: pageSize };
      if (search) params.search = search;
      if (categoryFilter) params.category = categoryFilter;
      if (statusFilter) params.is_active = statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined;
      if (profileFilter) params.profile_intervenant = profileFilter;
      const res = await api.get('/catalog/services/', { params });
      const data: PaginatedResponse = res.data;
      setServices(data.results);
      setTotalPages(Math.ceil(data.count / pageSize));
      setHasNext(!!data.next);
      setHasPrev(!!data.previous);
    } catch (err) {
      toast.error('Erreur lors du chargement des prestations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices(currentPage);
    // eslint-disable-next-line
  }, [search, categoryFilter, statusFilter, profileFilter, currentPage]);

  const handleOpenDialog = (service?: Service) => {
    if (service) {
      setEditService(service);
      setForm(service);
      setProfileId(service.profile_intervenant?.id || null);
      setCategoryId(service.category?.id || null);
      setNewProfileName('');
      setNewCategoryName('');
    } else {
      setEditService(null);
      setForm({ name: '', description: '', price: '', duration: undefined, is_active: true });
      setProfileId(null);
      setCategoryId(null);
      setNewProfileName('');
      setNewCategoryName('');
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditService(null);
    setForm({ name: '', description: '', price: '', duration: undefined, is_active: true });
    setProfileId(null);
    setCategoryId(null);
    setNewProfileName('');
    setNewCategoryName('');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let finalProfileId = profileId;
      let finalCategoryId = categoryId;
      
      // Si "Autre" pour profil, créer le profil d'abord
      if (profileId === 'other' && newProfileName.trim()) {
        const res = await api.post('/catalog/profiles/', { name: newProfileName.trim() });
        finalProfileId = res.data.id;
        setProfiles((prev) => [...prev, res.data]);
      }
      
      // Si "Autre" pour catégorie, créer la catégorie d'abord
      if (categoryId === 'other' && newCategoryName.trim()) {
        const res = await api.post('/catalog/categories/', { name: newCategoryName.trim() });
        finalCategoryId = res.data.id;
        setCategories((prev) => [...prev, res.data]);
      }
      
      const payload = { 
        ...form, 
        profile_intervenant_id: finalProfileId || null,
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
    if (!window.confirm(`Supprimer la prestation "${service.name}" ?`)) return;
    try {
      await api.delete(`/catalog/services/${service.id}/`);
      toast.success('Prestation supprimée');
      fetchServices(currentPage);
    } catch (err) {
      toast.error('Erreur lors de la suppression');
    }
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

  const handleProfileFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setProfileFilter(e.target.value ? Number(e.target.value) : '');
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
            <select value={profileFilter} onChange={handleProfileFilter} className="border rounded px-2 py-1">
              <option value="">Tous profils</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()} size="sm" className="gap-2"><Plus size={16}/> Ajouter</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editService ? 'Modifier' : 'Ajouter'} une prestation</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input name="name" placeholder="Nom" value={form.name || ''} onChange={handleChange} required />
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
                  <Input name="price" placeholder="Prix" type="number" value={form.price || ''} onChange={handleChange} />
                  <Input name="duration" placeholder="Durée (heures)" type="number" step="0.01" value={form.duration || ''} onChange={handleChange} />
                  <textarea name="description" placeholder="Description" className="w-full border rounded p-2" value={form.description || ''} onChange={handleChange} />
                  {/* Sélecteur de profil intervenant */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Profil intervenant</label>
                    <select
                      className="border rounded px-2 py-1 w-full"
                      value={profileId ?? ''}
                      onChange={e => {
                        const val = e.target.value;
                        if (val === 'other') setProfileId('other');
                        else setProfileId(val ? Number(val) : null);
                      }}
                    >
                      <option value="">Sélectionner...</option>
                      {profiles.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                      <option value="other">Autre...</option>
                    </select>
                    {profileId === 'other' && (
                      <Input
                        className="mt-2"
                        placeholder="Nouveau profil intervenant"
                        value={newProfileName}
                        onChange={e => setNewProfileName(e.target.value)}
                      />
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleSave} disabled={saving}>{saving ? <Loader2 className="animate-spin" size={16}/> : 'Enregistrer'}</Button>
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
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Prix</TableHead>
                    <TableHead>Durée</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Profil intervenant</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center">Aucune prestation</TableCell></TableRow>
                  ) : services.map(service => (
                    <TableRow key={service.id}>
                      <TableCell>{service.name}</TableCell>
                      <TableCell>{service.category?.name || '-'}</TableCell>
                      <TableCell>{service.price} €</TableCell>
                      <TableCell>{service.duration ? service.duration + ' h' : '-'}</TableCell>
                      <TableCell>{service.description}</TableCell>
                      <TableCell>{service.profile_intervenant?.name || '-'}</TableCell>
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
                        <Button size="icon" variant="ghost" onClick={() => handleOpenDialog(service)}><Edit size={16}/></Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(service)}><Trash2 size={16}/></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {/* Pagination */}
              <div className="flex justify-center items-center gap-2 mt-4">
                <Button size="icon" variant="ghost" disabled={!hasPrev || currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}><ChevronLeft size={18}/></Button>
                <span>Page {currentPage} / {totalPages}</span>
                <Button size="icon" variant="ghost" disabled={!hasNext || currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}><ChevronRight size={18}/></Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 