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

interface UniteStandard {
  id: number;
  intitule: string;
  code: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface PaginatedResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: UniteStandard[];
}

export function UnitesStandardsPage() {
  const [unitesStandards, setUnitesStandards] = useState<UniteStandard[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editUniteStandard, setEditUniteStandard] = useState<UniteStandard | null>(null);
  const [form, setForm] = useState<Partial<UniteStandard>>({ 
    intitule: '', 
    code: '', 
    description: '', 
    is_active: true 
  });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const pageSize = 10;
  const [togglingUnitesStandards, setTogglingUnitesStandards] = useState<Set<number>>(new Set());

  const fetchUnitesStandards = async (page = 1) => {
    setLoading(true);
    try {
      const params: any = { page, page_size: pageSize };
      if (search) params.search = search;
      if (statusFilter) params.is_active = statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined;
      const res = await api.get('/catalog/unites-standards/', { params });
      const data: PaginatedResponse = res.data;
      setUnitesStandards(data.results);
      setTotalPages(Math.ceil(data.count / pageSize));
      setHasNext(!!data.next);
      setHasPrev(!!data.previous);
    } catch (err) {
      toast.error('Erreur lors du chargement des unités standards');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnitesStandards(currentPage);
    // eslint-disable-next-line
  }, [search, statusFilter, currentPage]);

  const handleOpenDialog = (uniteStandard?: UniteStandard) => {
    if (uniteStandard) {
      setEditUniteStandard(uniteStandard);
      setForm(uniteStandard);
    } else {
      setEditUniteStandard(null);
      setForm({ intitule: '', code: '', description: '', is_active: true });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditUniteStandard(null);
    setForm({ intitule: '', code: '', description: '', is_active: true });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setForm({ ...form, [name]: (e.target as HTMLInputElement).checked });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSave = async () => {
    if (!form.intitule?.trim()) {
      toast.error('L\'intitulé est requis');
      return;
    }

    if (!form.code?.trim()) {
      toast.error('Le code est requis');
      return;
    }

    setSaving(true);
    try {
      if (editUniteStandard) {
        await api.put(`/catalog/unites-standards/${editUniteStandard.id}/`, form);
        toast.success('Unité standard modifiée');
      } else {
        await api.post('/catalog/unites-standards/', form);
        toast.success('Unité standard ajoutée');
      }
      fetchUnitesStandards(currentPage);
      handleCloseDialog();
    } catch (err) {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (uniteStandard: UniteStandard) => {
    if (!window.confirm(`Supprimer l'unité standard "${uniteStandard.intitule}" ?`)) return;
    try {
      await api.delete(`/catalog/unites-standards/${uniteStandard.id}/`);
      toast.success('Unité standard supprimée');
      fetchUnitesStandards(currentPage);
    } catch (err) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleToggleStatus = async (uniteStandard: UniteStandard) => {
    setTogglingUnitesStandards(prev => new Set(prev).add(uniteStandard.id));
    try {
      const updatedUniteStandard = { ...uniteStandard, is_active: !uniteStandard.is_active };
      await api.put(`/catalog/unites-standards/${uniteStandard.id}/`, updatedUniteStandard);
      toast.success(`Unité standard ${updatedUniteStandard.is_active ? 'activée' : 'désactivée'}`);
      fetchUnitesStandards(currentPage);
    } catch (err) {
      toast.error('Erreur lors du changement de statut');
    } finally {
      setTogglingUnitesStandards(prev => {
        const newSet = new Set(prev);
        newSet.delete(uniteStandard.id);
        return newSet;
      });
    }
  };

  return (
    <div className="max-w-10xl mx-auto">
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <CardTitle>Gestion des Unités Standards</CardTitle>
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
            <select value={statusFilter} onChange={handleStatusFilter} className="border rounded px-2 py-1">
              <option value="">Tous statuts</option>
              <option value="active">Actives</option>
              <option value="inactive">Inactives</option>
            </select>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()} size="sm" className="gap-2"><Plus size={16}/> Ajouter</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editUniteStandard ? 'Modifier' : 'Ajouter'} une unité standard</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Intitulé *</label>
                    <Input 
                      name="intitule" 
                      placeholder="Intitulé de l'unité standard" 
                      value={form.intitule || ''} 
                      onChange={handleChange} 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Code *</label>
                    <Input 
                      name="code" 
                      placeholder="Code unique" 
                      value={form.code || ''} 
                      onChange={handleChange} 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea 
                      name="description" 
                      placeholder="Description de l'unité standard" 
                      className="w-full border rounded p-2 min-h-[80px]" 
                      value={form.description || ''} 
                      onChange={handleChange} 
                    />
                  </div>
                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        name="is_active"
                        checked={form.is_active || false}
                        onChange={handleChange}
                        className="rounded"
                      />
                      <span className="text-sm">Unité standard active</span>
                    </label>
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
                    <TableHead>Intitulé</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unitesStandards.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center">Aucune unité standard</TableCell></TableRow>
                  ) : unitesStandards.map(uniteStandard => (
                    <TableRow key={uniteStandard.id}>
                      <TableCell className="font-medium">{uniteStandard.intitule}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{uniteStandard.code}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate" title={uniteStandard.description}>
                          {uniteStandard.description || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant={uniteStandard.is_active ? "default" : "destructive"}>
                            {uniteStandard.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleToggleStatus(uniteStandard)}
                            disabled={togglingUnitesStandards.has(uniteStandard.id)}
                            className="text-xs"
                          >
                            {togglingUnitesStandards.has(uniteStandard.id) ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              uniteStandard.is_active ? 'Désactiver' : 'Activer'
                            )}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="flex gap-2">
                        <Button size="icon" variant="ghost" onClick={() => handleOpenDialog(uniteStandard)}>
                          <Edit size={16}/>
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(uniteStandard)}>
                          <Trash2 size={16}/>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {/* Pagination */}
              <div className="flex justify-center items-center gap-2 mt-4">
                <Button 
                  size="icon" 
                  variant="ghost" 
                  disabled={!hasPrev || currentPage === 1} 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                >
                  <ChevronLeft size={18}/>
                </Button>
                <span>Page {currentPage} / {totalPages}</span>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  disabled={!hasNext || currentPage === totalPages} 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                >
                  <ChevronRight size={18}/>
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 