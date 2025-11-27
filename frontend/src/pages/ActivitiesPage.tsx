import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatTemps } from '@/lib/formatters';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Loader2, ChevronLeft, ChevronRight, Search as SearchIcon, ArrowLeft, Upload } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { ImportActivitiesModal } from '@/components/ImportActivitiesModal';

interface IntervenantProfile {
  id: number;
  name: string;
}

interface Service {
  id: number;
  name: string;
  description: string;
  category?: {
    id: number;
    name: string;
  };
}

interface ActivityProfile {
  id: number;
  profile_intervenant: IntervenantProfile;
  temps_intervenant: number;
}

interface Activity {
  id: number;
  name: string;
  duree_standard: number;
  service: Service;
  service_id?: number;
  activity_profiles: ActivityProfile[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface PaginatedResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Activity[];
}

export function ActivitiesPage() {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editActivity, setEditActivity] = useState<Activity | null>(null);
  const [form, setForm] = useState<Partial<Activity>>({ 
    name: '', 
    duree_standard: 0, 
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
  const [services, setServices] = useState<Service[]>([]);
  const [profilesData, setProfilesData] = useState<Array<{
    profile_intervenant_id: number;
    temps_intervenant: string;
  }>>([]);
  const [newProfileName, setNewProfileName] = useState('');
  const [profileFilter, setProfileFilter] = useState<number | ''>('');
  const [serviceFilter, setServiceFilter] = useState<number | ''>('');
  const [serviceId, setServiceId] = useState<number | null>(null);
  const [togglingActivities, setTogglingActivities] = useState<Set<number>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState<Activity | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  // Charger les services
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await api.get('/catalog/services/');
        setServices(res.data.results || res.data);
      } catch (err) {
        setServices([]);
      }
    };
    fetchServices();
  }, [dialogOpen, importDialogOpen]);

  const fetchActivities = async (page = 1) => {
    setLoading(true);
    try {
      const params: any = { page, page_size: pageSize };
      if (search) params.search = search;
      if (statusFilter) params.is_active = statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined;
      if (profileFilter) params.profiles_intervenant = profileFilter;
      if (serviceFilter) params.service = serviceFilter;
      const res = await api.get('/catalog/activities/', { params });
      const data: PaginatedResponse = res.data;
      setActivities(data.results);
      setTotalPages(Math.ceil(data.count / pageSize));
      setHasNext(!!data.next);
      setHasPrev(!!data.previous);
    } catch (err) {
      toast.error('Erreur lors du chargement des activités');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities(currentPage);
    // eslint-disable-next-line
  }, [search, statusFilter, profileFilter, serviceFilter, currentPage]);

  const handleOpenDialog = (activity?: Activity) => {
    if (activity) {
      setEditActivity(activity);
      setForm(activity);
      setServiceId(activity.service?.id || null);
      setProfilesData(activity.activity_profiles?.map(p => ({
        profile_intervenant_id: p.profile_intervenant.id,
        temps_intervenant: p.temps_intervenant.toString()
      })) || []);
      setNewProfileName('');
    } else {
      setEditActivity(null);
      setForm({ name: '', duree_standard: 0, is_active: true });
      setServiceId(null);
      setProfilesData([]);
      setNewProfileName('');
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditActivity(null);
    setForm({ name: '', duree_standard: 0, is_active: true });
    setServiceId(null);
    setProfilesData([]);
    setNewProfileName('');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm({ 
      ...form, 
      [name]: name === 'duree_standard' ? parseFloat(value) || 0 : value 
    });
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'other') {
      return;
    }
    
    const profileId = parseInt(value);
    if (isNaN(profileId)) return;
    
    // Vérifier si le profil est déjà ajouté
    const existingProfile = profilesData.find(p => p.profile_intervenant_id === profileId);
    if (existingProfile) {
      toast.error('Ce profil est déjà ajouté');
      return;
    }
    
    setProfilesData(prev => [...prev, {
      profile_intervenant_id: profileId,
      temps_intervenant: ''
    }]);
  };

  const handleProfileTimeChange = (profileId: number, temps: string) => {
    setProfilesData(prev => prev.map(p => 
      p.profile_intervenant_id === profileId 
        ? { ...p, temps_intervenant: temps }
        : p
    ));
  };

  const handleRemoveProfile = (profileId: number) => {
    setProfilesData(prev => prev.filter(p => p.profile_intervenant_id !== profileId));
  };

  const handleAddProfile = async () => {
    if (!newProfileName.trim()) {
      toast.error('Le nom du profil est requis');
      return;
    }

    try {
      const res = await api.post('/catalog/profiles/', { name: newProfileName.trim() });
      const newProfile = res.data;
      
      setProfiles(prev => [...prev, newProfile]);
      
      setProfilesData(prev => [...prev, {
        profile_intervenant_id: newProfile.id,
        temps_intervenant: ''
      }]);
      
      setNewProfileName('');
      toast.success('Profil créé et ajouté');
    } catch (err) {
      toast.error('Erreur lors de la création du profil');
    }
  };

  const handleSave = async () => {
    if (!form.name?.trim()) {
      toast.error('Le nom de l\'activité est requis');
      return;
    }

    if (!form.duree_standard) {
      toast.error('La durée standard est requise');
      return;
    }

    if (profilesData.length === 0) {
      toast.error('Au moins un profil intervenant est requis');
      return;
    }

    // Vérifier que tous les temps intervenant sont remplis
    const incompleteProfiles = profilesData.filter(p => !p.temps_intervenant);
    if (incompleteProfiles.length > 0) {
      toast.error('Tous les temps intervenant doivent être renseignés');
      return;
    }

    setSaving(true);
    try {
      const payload = { 
        ...form, 
        service_id: serviceId,
        profiles_data: profilesData.map(p => ({
          ...p,
          temps_intervenant: parseFloat(p.temps_intervenant)
        }))
      };
      
      if (editActivity) {
        await api.put(`/catalog/activities/${editActivity.id}/`, payload);
        toast.success('Activité modifiée');
      } else {
        await api.post('/catalog/activities/', payload);
        toast.success('Activité ajoutée');
      }
      fetchActivities(currentPage);
      handleCloseDialog();
    } catch (err) {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (activity: Activity) => {
    try {
      await api.delete(`/catalog/activities/${activity.id}/`);
      setDeleteDialogOpen(false);
      setActivityToDelete(null);
      toast.success('Activité supprimée');
      fetchActivities(currentPage);
    } catch (err) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const openDeleteDialog = (activity: Activity) => {
    setActivityToDelete(activity);
    setDeleteDialogOpen(true);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
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

  const handleServiceFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setServiceFilter(e.target.value ? Number(e.target.value) : '');
    setCurrentPage(1);
  };

  const handleToggleStatus = async (activity: Activity) => {
    setTogglingActivities(prev => new Set(prev).add(activity.id));
    try {
      const updatedActivity = { ...activity, is_active: !activity.is_active };
      await api.put(`/catalog/activities/${activity.id}/`, updatedActivity);
      toast.success(`Activité ${updatedActivity.is_active ? 'activée' : 'désactivée'}`);
      fetchActivities(currentPage);
    } catch (err) {
      toast.error('Erreur lors du changement de statut');
    } finally {
      setTogglingActivities(prev => {
        const newSet = new Set(prev);
        newSet.delete(activity.id);
        return newSet;
      });
    }
  };

  return (
    <div className="max-w-10xl mx-auto space-y-6">
      {/* Header avec bouton retour */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} className="mr-2" />
          Retour
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Gestion des Activités</h1>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <CardTitle>Liste des Activités</CardTitle>
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
            <select value={serviceFilter} onChange={handleServiceFilter} className="border rounded px-2 py-1">
              <option value="">Toutes prestations</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
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
                  <DialogTitle>{editActivity ? 'Modifier' : 'Ajouter'} une activité</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {/* Sélecteur de service */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Prestation</label>
                    <select 
                      className="border rounded px-2 py-1 w-full"
                      value={serviceId ?? ''}
                      onChange={e => setServiceId(e.target.value ? Number(e.target.value) : null)}
                      required
                    >
                      <option value="">Sélectionner une prestation...</option>
                      {services.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <Input name="name" placeholder="Nom de l'activité" value={form.name || ''} onChange={handleChange} required />
                   
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Durée standard (h)</label>
                      <Input
                        name="duree_standard"
                        type="number"
                        step="0.5"
                        placeholder="0.0"
                        value={form.duree_standard || ''}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Profils intervenant</label>
                    <div className="space-y-3">
                      {/* Select pour ajouter un profil */}
                      <div className="flex gap-2">
                        <select 
                          className="flex-1 border rounded-md px-3 py-2 text-sm"
                          onChange={handleProfileChange}
                          value=""
                        >
                          <option value="">Sélectionner un profil</option>
                          {profiles.map(profile => (
                            <option key={profile.id} value={profile.id}>
                              {profile.name}
                            </option>
                          ))}
                          <option value="other">Autre (créer un nouveau profil)</option>
                        </select>
                      </div>
                      
                      {/* Champ pour créer un nouveau profil */}
                      <div className="flex gap-2">
                        <Input
                          placeholder="Nouveau profil intervenant"
                          value={newProfileName}
                          onChange={(e) => setNewProfileName(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleAddProfile()}
                        />
                        <Button 
                          onClick={handleAddProfile} 
                          size="sm" 
                          variant="outline"
                          disabled={!newProfileName.trim()}
                        >
                          Ajouter
                        </Button>
                      </div>
                      
                      {/* Liste des profils sélectionnés avec temps */}
                      {profilesData.length > 0 && (
                        <div className="space-y-2">
                          <label className="block text-sm font-medium">Profils sélectionnés :</label>
                          <div className="space-y-2">
                            {profilesData.map(profileData => {
                              const profile = profiles.find(p => p.id === profileData.profile_intervenant_id);
                              return profile ? (
                                <div key={profileData.profile_intervenant_id} className="flex items-center gap-2 p-2 border rounded">
                                  <Badge variant="secondary" className="text-xs">
                                    {profile.name}
                                  </Badge>
                                  <Input
                                    type="number"
                                    step="0.5"
                                    placeholder="Temps (h)"
                                    value={profileData.temps_intervenant}
                                    onChange={(e) => handleProfileTimeChange(profileData.profile_intervenant_id, e.target.value)}
                                    className="w-24 text-xs"
                                    required
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveProfile(profileData.profile_intervenant_id)}
                                    className="text-red-600 hover:text-red-800"
                                  >
                                    ×
                                  </button>
                                </div>
                              ) : null;
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleSave} disabled={saving}>{saving ? <Loader2 className="animate-spin" size={16}/> : 'Enregistrer'}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button 
              size="sm" 
              variant="outline" 
              className="gap-2" 
              onClick={() => setImportDialogOpen(true)}
            >
              <Upload size={16}/> Importer
            </Button>
            <ImportActivitiesModal 
              open={importDialogOpen} 
              onClose={() => setImportDialogOpen(false)} 
              services={services}
              onImportSuccess={async (importedActivities) => {
                await new Promise(resolve => setTimeout(resolve, 500));
                fetchActivities(currentPage);
              }}
            />
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
                    <TableHead>Service</TableHead>
                    <TableHead>Durée standard</TableHead>
                    <TableHead>Profils et temps</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activities.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center">Aucune activité</TableCell></TableRow>
                  ) : activities.map(activity => (
                    <TableRow key={activity.id}>
                      <TableCell className="font-medium">{activity.name}</TableCell>
                      <TableCell>{activity.service?.name || '-'}</TableCell>
                      <TableCell>{formatTemps(activity.duree_standard)} h</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {activity.activity_profiles?.map(profile => (
                            <div key={profile.id} className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                {profile.profile_intervenant.name}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {formatTemps(profile.temps_intervenant)} h
                              </span>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant={activity.is_active ? "default" : "destructive"}>
                            {activity.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleToggleStatus(activity)}
                            disabled={togglingActivities.has(activity.id)}
                            className="text-xs"
                          >
                            {togglingActivities.has(activity.id) ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              activity.is_active ? 'Désactiver' : 'Activer'
                            )}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="flex gap-2">
                        <Button size="icon" variant="ghost" onClick={() => handleOpenDialog(activity)}><Edit size={16}/></Button>
                        <Button size="icon" variant="ghost" onClick={() => openDeleteDialog(activity)}><Trash2 size={16}/></Button>
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

      {/* Dialog de suppression d'activité */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer l'activité</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600">
              Êtes-vous sûr de vouloir supprimer cette activité ?
            </p>
            {activityToDelete && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Nom :</span>
                    <p className="text-gray-600">{activityToDelete.name}</p>
                  </div>
                  <div>
                    <span className="font-medium">Service :</span>
                    <p className="text-gray-600">{activityToDelete.service?.name || 'Aucun'}</p>
                  </div>
                  <div>
                    <span className="font-medium">Durée standard :</span>
                    <p className="text-gray-600">{formatTemps(activityToDelete.duree_standard)} heures</p>
                  </div>
                  <div>
                    <span className="font-medium">Profils intervenant :</span>
                    <div className="mt-1 space-y-1">
                      {activityToDelete.activity_profiles?.map(profile => (
                        <div key={profile.id} className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {profile.profile_intervenant.name}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {formatTemps(profile.temps_intervenant)} h
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            <p className="text-sm text-red-600">
              Cette action est irréversible et supprimera également tous les taux horaires associés à cette activité.
            </p>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setDeleteDialogOpen(false);
                setActivityToDelete(null);
              }}
            >
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => handleDelete(activityToDelete!)}
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 