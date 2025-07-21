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
  Users, 
  Euro, 
  Activity, 
  Loader2, 
  Calendar,
  Building2,
  FileText,
  Plus
} from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { formatMontant } from '@/lib/formatters';

interface Category {
  id: number;
  name: string;
}

interface IntervenantProfile {
  id: number;
  name: string;
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
  activity_profiles: ActivityProfile[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface TauxHoraire {
  id: number;
  niveau_intervenant: 'intermediaire' | 'operationnel' | 'senior';
  taux_heure: number;
  profile_intervenant: IntervenantProfile;
  is_active: boolean;
}

interface Service {
  id: number;
  name: string;
  description: string;
  category: Category;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  activities: Activity[];
}

export function ServiceDetailsPage() {
  const { serviceId } = useParams<{ serviceId: string }>();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [tauxHoraires, setTauxHoraires] = useState<TauxHoraire[]>([]);
  const [loadingTaux, setLoadingTaux] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profiles, setProfiles] = useState<IntervenantProfile[]>([]);
  const [form, setForm] = useState({
    name: '',
    duree_standard: '',
    profiles_data: [] as Array<{
      profile_intervenant_id: number;
      temps_intervenant: string;
    }>,
    is_active: true
  });
  const [newProfileName, setNewProfileName] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    category_id: '',
    description: '',
    is_active: true
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchServiceDetails = async () => {
    if (!serviceId) return;
    
    setLoading(true);
    try {
      const res = await api.get(`/catalog/services/${serviceId}/`);
      setService(res.data);
    } catch (err) {
      toast.error('Erreur lors du chargement de la prestation');
    } finally {
      setLoading(false);
    }
  };

  const fetchTauxHoraires = async () => {
    if (!serviceId) return;
    
    setLoadingTaux(true);
    try {
      const res = await api.get('/catalog/taux-horaires/', {
        params: {
          activity__service: serviceId,
          page_size: 100
        }
      });
      setTauxHoraires(res.data.results || res.data);
    } catch (err) {
      toast.error('Erreur lors du chargement des taux horaires');
    } finally {
      setLoadingTaux(false);
    }
  };

  const fetchProfiles = async () => {
    try {
      const res = await api.get('/catalog/profiles/');
      setProfiles(res.data.results || res.data);
    } catch (err) {
      toast.error('Erreur lors du chargement des profils');
    }
  };

  useEffect(() => {
    fetchServiceDetails();
    fetchProfiles();
  }, [serviceId]);

  useEffect(() => {
    if (service) {
      fetchTauxHoraires();
    }
  }, [service]);

  // Charger les catégories pour l'édition
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

  // Pré-remplir le formulaire d'édition quand on ouvre la modale
  const handleOpenEditDialog = () => {
    if (!service) return;
    setEditForm({
      name: service.name || '',
      category_id: service.category?.id?.toString() || '',
      description: service.description || '',
      is_active: service.is_active
    });
    setEditDialogOpen(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    if (type === 'number') {
      setForm({ ...form, [name]: value ? parseFloat(value) : '' });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'other') {
      return;
    }
    
    const profileId = parseInt(value);
    if (isNaN(profileId)) return;
    
    // Vérifier si le profil est déjà ajouté
    const existingProfile = form.profiles_data.find(p => p.profile_intervenant_id === profileId);
    if (existingProfile) {
      toast.error('Ce profil est déjà ajouté');
      return;
    }
    
    setForm(prev => ({
      ...prev,
      profiles_data: [...prev.profiles_data, {
        profile_intervenant_id: profileId,
        temps_intervenant: ''
      }]
    }));
  };

  const handleProfileTimeChange = (profileId: number, temps: string) => {
    setForm(prev => ({
      ...prev,
      profiles_data: prev.profiles_data.map(p => 
        p.profile_intervenant_id === profileId 
          ? { ...p, temps_intervenant: temps }
          : p
      )
    }));
  };

  const handleRemoveProfile = (profileId: number) => {
    setForm(prev => ({
      ...prev,
      profiles_data: prev.profiles_data.filter(p => p.profile_intervenant_id !== profileId)
    }));
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
      
      setForm(prev => ({
        ...prev,
        profiles_data: [...prev.profiles_data, {
          profile_intervenant_id: newProfile.id,
          temps_intervenant: ''
        }]
      }));
      
      setNewProfileName('');
      toast.success('Profil créé et ajouté');
    } catch (err) {
      toast.error('Erreur lors de la création du profil');
    }
  };

  const handleSaveActivity = async () => {
    if (!form.name.trim()) {
      toast.error('Le nom de l\'activité est requis');
      return;
    }

    if (!form.duree_standard) {
      toast.error('La durée standard est requise');
      return;
    }

    if (form.profiles_data.length === 0) {
      toast.error('Au moins un profil intervenant est requis');
      return;
    }

    // Vérifier que tous les temps intervenant sont remplis
    const incompleteProfiles = form.profiles_data.filter(p => !p.temps_intervenant);
    if (incompleteProfiles.length > 0) {
      toast.error('Tous les temps intervenant doivent être renseignés');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        service_id: serviceId,
        duree_standard: parseFloat(form.duree_standard),
        profiles_data: form.profiles_data.map(p => ({
          ...p,
          temps_intervenant: parseFloat(p.temps_intervenant)
        }))
      };

      await api.post('/catalog/activities/', payload);
      toast.success('Activité ajoutée avec succès');
      handleCloseDialog();
      fetchServiceDetails();
    } catch (err) {
      toast.error('Erreur lors de l\'ajout de l\'activité');
    } finally {
      setSaving(false);
    }
  };

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox' && e.target instanceof HTMLInputElement) {
      setEditForm({ ...editForm, [name]: e.target.checked });
    } else {
      setEditForm({ ...editForm, [name]: value });
    }
  };

  const handleSaveEdit = async () => {
    if (!service) return;
    setSavingEdit(true);
    try {
      await api.put(`/catalog/services/${service.id}/`, {
        name: editForm.name,
        category_id: editForm.category_id ? Number(editForm.category_id) : null,
        description: editForm.description,
        is_active: editForm.is_active
      });
      toast.success('Prestation modifiée');
      setEditDialogOpen(false);
      fetchServiceDetails();
    } catch (err) {
      toast.error('Erreur lors de la modification');
    } finally {
      setSavingEdit(false);
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

  const getNiveauColor = (niveau: string) => {
    switch (niveau) {
      case 'intermediaire': return 'bg-blue-100 text-blue-800';
      case 'operationnel': return 'bg-green-100 text-green-800';
      case 'senior': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleOpenDialog = () => {
    setForm({
      name: '',
      duree_standard: '',
      profiles_data: [],
      is_active: true
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setForm({
      name: '',
      duree_standard: '',
      profiles_data: [],
      is_active: true
    });
    setNewProfileName('');
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin" size={32} />
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="text-center py-10">
          <p className="text-gray-500">Prestation non trouvée</p>
          <Link to="/services">
            <Button className="mt-4">Retour aux prestations</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/services">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{service.name}</h1>
            <p className="text-gray-500">Détails de la prestation</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={service.is_active ? "default" : "destructive"}>
            {service.is_active ? 'Active' : 'Inactive'}
          </Badge>
          <Button size="sm" variant="outline" onClick={handleOpenEditDialog}>
            <Edit className="h-4 w-4 mr-2" />
            Modifier
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informations principales */}
        <div className="lg:col-span-2 space-y-6">
          {/* Détails de la prestation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Informations générales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Nom</label>
                  <p className="text-gray-900">{service.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Catégorie</label>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900">{service.category?.name || 'Non définie'}</span>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-500">Description</label>
                  <p className="text-gray-900 mt-1">{service.description || 'Aucune description'}</p>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="text-sm font-medium text-gray-500">Créé le</label>
                  <p className="text-gray-900">{new Date(service.created_at).toLocaleDateString('fr-FR')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Modifié le</label>
                  <p className="text-gray-900">{new Date(service.updated_at).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activités associées */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Activités associées ({service.activities?.length || 0})
              </CardTitle>
              <Button onClick={handleOpenDialog} size="sm" className="gap-2">
                <Plus size={16} />
                Ajouter une activité
              </Button>
            </CardHeader>
            <CardContent>
              {service.activities && service.activities.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Durée standard</TableHead>
                      <TableHead>Profils et temps</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {service.activities.map(activity => (
                      <TableRow key={activity.id}>
                        <TableCell className="font-medium">{activity.name}</TableCell>
                        <TableCell>{activity.duree_standard} h</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {activity.activity_profiles?.map(profile => (
                              <div key={profile.id} className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-xs">
                                  {profile.profile_intervenant.name}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  {profile.temps_intervenant} h
                                </span>
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={activity.is_active ? "default" : "destructive"}>
                            {activity.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Aucune activité associée à cette prestation</p>
                  <Button onClick={handleOpenDialog} className="mt-4" variant="outline">
                    <Plus size={16} className="mr-2" />
                    Ajouter la première activité
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar avec statistiques et taux horaires */}
        <div className="space-y-6">
          {/* Statistiques */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Statistiques</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-500" />
                  <span className="text-sm text-gray-600">Activités</span>
                </div>
                <span className="font-semibold">{service.activities?.length || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-gray-600">Profils uniques</span>
                </div>
                <span className="font-semibold">
                  {new Set(service.activities?.flatMap(a => a.activity_profiles?.map(p => p.profile_intervenant.id) || []) || []).size}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-purple-500" />
                  <span className="text-sm text-gray-600">Durée totale</span>
                </div>
                <span className="font-semibold">
                  {service.activities?.reduce((sum, a) => sum + a.duree_standard, 0) || 0} h
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Taux horaires */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Euro className="h-5 w-5" />
                Taux horaires
                {loadingTaux && <Loader2 className="h-4 w-4 animate-spin" />}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tauxHoraires.length > 0 ? (
                <div className="space-y-3">
                  {tauxHoraires.map(taux => (
                    <div key={taux.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{taux.profile_intervenant.name}</p>
                        <Badge className={`text-xs ${getNiveauColor(taux.niveau_intervenant)}`}>
                          {getNiveauDisplay(taux.niveau_intervenant)}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatMontant(taux.taux_heure)} €/h</p>
                        <Badge variant={taux.is_active ? "default" : "destructive"} className="text-xs">
                          {taux.is_active ? 'Actif' : 'Inactif'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <Euro className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">Aucun taux horaire défini</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions rapides */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Actions rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link to={`/activities?service_filter=${service.id}`}>
                <Button variant="outline" className="w-full justify-start">
                  <Activity className="h-4 w-4 mr-2" />
                  Voir toutes les activités
                </Button>
              </Link>
              <Link to={`/taux-horaires?activity_filter=${service.activities?.[0]?.id || ''}`}>
                <Button variant="outline" className="w-full justify-start">
                  <Euro className="h-4 w-4 mr-2" />
                  Gérer les taux horaires
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal d'ajout d'activité */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter une activité</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nom de l'activité</label>
              <Input
                name="name"
                placeholder="Nom de l'activité"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Durée standard (h)</label>
                <Input
                  name="duree_standard"
                  type="number"
                  step="0.5"
                  placeholder="0.0"
                  value={form.duree_standard}
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
                {form.profiles_data.length > 0 && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Profils sélectionnés :</label>
                    <div className="space-y-2">
                      {form.profiles_data.map(profileData => {
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
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">Activité active</span>
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Annuler
            </Button>
            <Button onClick={handleSaveActivity} disabled={saving}>
              {saving ? <Loader2 className="animate-spin" size={16}/> : 'Ajouter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modale d'édition du service */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier la prestation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nom</label>
              <Input
                name="name"
                value={editForm.name}
                onChange={handleEditChange}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Catégorie</label>
              <select
                name="category_id"
                className="border rounded px-2 py-1 w-full"
                value={editForm.category_id}
                onChange={handleEditChange}
              >
                <option value="">Sélectionner...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                name="description"
                className="w-full border rounded p-2"
                value={editForm.description}
                onChange={handleEditChange}
              />
            </div>
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={editForm.is_active}
                  onChange={handleEditChange}
                  className="rounded"
                />
                <span className="text-sm">Prestation active</span>
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveEdit} disabled={savingEdit}>
              {savingEdit ? <Loader2 className="animate-spin" size={16}/> : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 