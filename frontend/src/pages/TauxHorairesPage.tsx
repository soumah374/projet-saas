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

interface IntervenantProfile {
  id: number;
  name: string;
}

interface Activity {
  id: number;
  name: string;
  service: {
    id: number;
    name: string;
  };
  activity_profiles: Array<{
    id: number;
    profile_intervenant: IntervenantProfile;
    temps_intervenant: number;
  }>;
}

interface TauxHoraire {
  id: number;
  niveau_intervenant: 'intermediaire' | 'operationnel' | 'senior';
  taux_heure: number;
  activity: Activity;
  activity_id?: number;
  profile_intervenant: IntervenantProfile;
  profile_intervenant_id?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface PaginatedResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: TauxHoraire[];
}

export function TauxHorairesPage() {
  const [tauxHoraires, setTauxHoraires] = useState<TauxHoraire[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTauxHoraire, setEditTauxHoraire] = useState<TauxHoraire | null>(null);
  const [form, setForm] = useState<Partial<TauxHoraire>>({ 
    niveau_intervenant: 'intermediaire',
    taux_heure: 0,
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
  const [profiles, setProfiles] = useState<IntervenantProfile[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activityId, setActivityId] = useState<number | null>(null);
  const [profileId, setProfileId] = useState<number | null>(null);
  const [niveauFilter, setNiveauFilter] = useState('');
  const [activityFilter, setActivityFilter] = useState<number | ''>('');
  const [profileFilter, setProfileFilter] = useState<number | ''>('');
  const [togglingTauxHoraires, setTogglingTauxHoraires] = useState<Set<number>>(new Set());

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

  // Charger les activités
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const res = await api.get('/catalog/activities/');
        setActivities(res.data.results || res.data);
      } catch (err) {
        setActivities([]);
      }
    };
    fetchActivities();
  }, [dialogOpen]);

  const fetchTauxHoraires = async (page = 1) => {
    setLoading(true);
    try {
      const params: any = { page, page_size: pageSize };
      if (search) params.search = search;
      if (statusFilter) params.is_active = statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined;
      if (niveauFilter) params.niveau_intervenant = niveauFilter;
      if (activityFilter) params.activity = activityFilter;
      if (profileFilter) params.profile_intervenant = profileFilter;
      const res = await api.get('/catalog/taux-horaires/', { params });
      const data: PaginatedResponse = res.data;
      setTauxHoraires(data.results);
      setTotalPages(Math.ceil(data.count / pageSize));
      setHasNext(!!data.next);
      setHasPrev(!!data.previous);
    } catch (err) {
      toast.error('Erreur lors du chargement des taux horaires');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTauxHoraires(currentPage);
    // eslint-disable-next-line
  }, [search, statusFilter, niveauFilter, activityFilter, profileFilter, currentPage]);

  // Obtenir les profils disponibles pour l'activité sélectionnée
  const getAvailableProfiles = () => {
    if (!activityId) return [];
    
    const selectedActivity = activities.find(a => a.id === activityId);
    if (!selectedActivity) return [];
    
    return selectedActivity.activity_profiles?.map(ap => ap.profile_intervenant) || [];
  };

  // Réinitialiser le profil sélectionné quand l'activité change
  const handleActivityChange = (newActivityId: number | null) => {
    setActivityId(newActivityId);
    setProfileId(null); // Réinitialiser le profil sélectionné
    
    // Si on est en mode édition et que le profil actuel n'est pas disponible pour la nouvelle activité
    if (editTauxHoraire && newActivityId) {
      const availableProfiles = getAvailableProfiles();
      const currentProfileAvailable = availableProfiles.some(p => p.id === profileId);
      if (!currentProfileAvailable) {
        setProfileId(null);
      }
    }
  };

  const handleOpenDialog = (tauxHoraire?: TauxHoraire) => {
    if (tauxHoraire) {
      setEditTauxHoraire(tauxHoraire);
      setForm(tauxHoraire);
      setActivityId(tauxHoraire.activity?.id || null);
      setProfileId(tauxHoraire.profile_intervenant?.id || null);
    } else {
      setEditTauxHoraire(null);
      setForm({ niveau_intervenant: 'intermediaire', taux_heure: 0, is_active: true });
      setActivityId(null);
      setProfileId(null);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditTauxHoraire(null);
    setForm({ niveau_intervenant: 'intermediaire', taux_heure: 0, is_active: true });
    setActivityId(null);
    setProfileId(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm({ 
      ...form, 
      [name]: name === 'taux_heure' ? parseFloat(value) || 0 : value 
    });
  };

  const handleSave = async () => {
    if (!form.taux_heure || form.taux_heure <= 0) {
      toast.error('Le taux horaire doit être supérieur à 0');
      return;
    }

    if (!activityId) {
      toast.error('Veuillez sélectionner une activité');
      return;
    }

    if (!profileId) {
      toast.error('Veuillez sélectionner un profil intervenant');
      return;
    }

    setSaving(true);
    try {
      const payload = { 
        ...form, 
        activity_id: activityId,
        profile_intervenant_id: profileId
      };
      
      if (editTauxHoraire) {
        await api.put(`/catalog/taux-horaires/${editTauxHoraire.id}/`, payload);
        toast.success('Taux horaire modifié');
      } else {
        await api.post('/catalog/taux-horaires/', payload);
        toast.success('Taux horaire ajouté');
      }
      fetchTauxHoraires(currentPage);
      handleCloseDialog();
    } catch (err) {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (tauxHoraire: TauxHoraire) => {
    if (!window.confirm(`Supprimer le taux horaire "${tauxHoraire.activity.name} - ${tauxHoraire.profile_intervenant.name}" ?`)) return;
    try {
      await api.delete(`/catalog/taux-horaires/${tauxHoraire.id}/`);
      toast.success('Taux horaire supprimé');
      fetchTauxHoraires(currentPage);
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

  const handleNiveauFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setNiveauFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleActivityFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setActivityFilter(e.target.value ? Number(e.target.value) : '');
    setCurrentPage(1);
  };

  const handleProfileFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setProfileFilter(e.target.value ? Number(e.target.value) : '');
    setCurrentPage(1);
  };

  const handleToggleStatus = async (tauxHoraire: TauxHoraire) => {
    setTogglingTauxHoraires(prev => new Set(prev).add(tauxHoraire.id));
    try {
      const updatedTauxHoraire = { ...tauxHoraire, is_active: !tauxHoraire.is_active };
      await api.put(`/catalog/taux-horaires/${tauxHoraire.id}/`, updatedTauxHoraire);
      toast.success(`Taux horaire ${updatedTauxHoraire.is_active ? 'activé' : 'désactivé'}`);
      fetchTauxHoraires(currentPage);
    } catch (err) {
      toast.error('Erreur lors du changement de statut');
    } finally {
      setTogglingTauxHoraires(prev => {
        const newSet = new Set(prev);
        newSet.delete(tauxHoraire.id);
        return newSet;
      });
    }
  };

  const getNiveauDisplay = (niveau: string) => {
    switch (niveau) {
      case 'intermediaire': return 'Intermédiaire';
      case 'operationnel': return 'Opérationnel';
      case 'senior': return 'Senior';
      default: return niveau;
    }
  };

  return (
    <div className="max-w-10xl mx-auto">
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <CardTitle>Gestion des Taux Horaires</CardTitle>
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
              <option value="active">Actifs</option>
              <option value="inactive">Inactifs</option>
            </select>
            <select value={niveauFilter} onChange={handleNiveauFilter} className="border rounded px-2 py-1">
              <option value="">Tous niveaux</option>
              <option value="intermediaire">Intermédiaire</option>
              <option value="operationnel">Opérationnel</option>
              <option value="senior">Senior</option>
            </select>
            <select value={activityFilter} onChange={handleActivityFilter} className="border rounded px-2 py-1">
              <option value="">Toutes activités</option>
              {activities.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
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
                  <DialogTitle>{editTauxHoraire ? 'Modifier' : 'Ajouter'} un taux horaire</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input name="taux_heure" placeholder="Taux horaire (€)" type="number" step="0.01" value={form.taux_heure || ''} onChange={handleChange} />
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Niveau intervenant</label>
                    <select
                      name="niveau_intervenant"
                      className="border rounded px-2 py-1 w-full"
                      value={form.niveau_intervenant || 'intermediaire'}
                      onChange={handleChange}
                    >
                      <option value="intermediaire">Intermédiaire</option>
                      <option value="operationnel">Opérationnel</option>
                      <option value="senior">Senior</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Activité</label>
                    <select
                      className="border rounded px-2 py-1 w-full"
                      value={activityId ?? ''}
                      onChange={e => handleActivityChange(e.target.value ? Number(e.target.value) : null)}
                      required
                    >
                      <option value="">Sélectionner une activité...</option>
                      {activities.map((a) => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Profil intervenant</label>
                    <select
                      className="border rounded px-2 py-1 w-full"
                      value={profileId ?? ''}
                      onChange={e => setProfileId(e.target.value ? Number(e.target.value) : null)}
                      required
                      disabled={!activityId}
                    >
                      <option value="">
                        {activityId ? 'Sélectionner un profil...' : 'Sélectionnez d\'abord une activité'}
                      </option>
                      {getAvailableProfiles().map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    {activityId && getAvailableProfiles().length === 0 && (
                      <p className="text-xs text-red-500 mt-1">
                        Aucun profil intervenant associé à cette activité
                      </p>
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
                    <TableHead>Activité</TableHead>
                    <TableHead>Profil intervenant</TableHead>
                    <TableHead>Niveau</TableHead>
                    <TableHead>Taux horaire</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tauxHoraires.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center">Aucun taux horaire</TableCell></TableRow>
                  ) : tauxHoraires.map(tauxHoraire => (
                    <TableRow key={tauxHoraire.id}>
                      <TableCell>{tauxHoraire.activity?.name || '-'}</TableCell>
                      <TableCell>{tauxHoraire.profile_intervenant?.name || '-'}</TableCell>
                      <TableCell>{getNiveauDisplay(tauxHoraire.niveau_intervenant)}</TableCell>
                      <TableCell>{tauxHoraire.taux_heure} €/h</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant={tauxHoraire.is_active ? "default" : "destructive"}>
                            {tauxHoraire.is_active ? 'Actif' : 'Inactif'}
                          </Badge>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleToggleStatus(tauxHoraire)}
                            disabled={togglingTauxHoraires.has(tauxHoraire.id)}
                            className="text-xs"
                          >
                            {togglingTauxHoraires.has(tauxHoraire.id) ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              tauxHoraire.is_active ? 'Désactiver' : 'Activer'
                            )}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="flex gap-2">
                        <Button size="icon" variant="ghost" onClick={() => handleOpenDialog(tauxHoraire)}><Edit size={16}/></Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(tauxHoraire)}><Trash2 size={16}/></Button>
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