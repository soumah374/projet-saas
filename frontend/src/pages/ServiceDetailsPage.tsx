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
  Activity, 
  Loader2, 
  Building2,
  FileText,
  Plus,
  Currency,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { formatMontant } from '@/lib/formatters';
import { usePermissions } from '@/hooks/use-permissions';

// Types
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

// Interface pour le formulaire d'activité
interface ActivityFormData {
  name: string;
  duree_standard: string;
  profiles_data: Array<{
    profile_intervenant_id: number;
    temps_intervenant: string;
  }>;
  is_active: boolean;
}

// Composant pour la gestion des profils
interface ProfileManagerProps {
  profiles: IntervenantProfile[];
  profilesData: ActivityFormData['profiles_data'];
  onProfileAdd: (profileId: number) => void;
  onProfileTimeChange: (profileId: number, temps: string) => void;
  onProfileRemove: (profileId: number) => void;
  newProfileName?: string;
  onNewProfileNameChange?: (name: string) => void;
  onAddNewProfile?: () => void;
}

const ProfileManager: React.FC<ProfileManagerProps> = ({
  profiles,
  profilesData,
  onProfileAdd,
  onProfileTimeChange,
  onProfileRemove,
  newProfileName = '',
  onNewProfileNameChange,
  onAddNewProfile
}) => {
  // Local state to track select value so we can show the "other" input only when chosen
  const [selectedOption, setSelectedOption] = useState<string>('');

  const handleProfileChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedOption(value);
    if (value === 'other' || !value) return;
    
    const profileId = parseInt(value);
    if (isNaN(profileId)) return;
    
    // Vérifier si le profil est déjà ajouté
    const existingProfile = profilesData.find(p => p.profile_intervenant_id === profileId);
    if (existingProfile) {
      toast.error('Ce profil est déjà ajouté');
      // reset selection so user can choose again
      setSelectedOption('');
      return;
    }
    
    onProfileAdd(profileId);
    // reset selection after adding
    setSelectedOption('');
  };

  // Handler to trigger creation of a new profile and reset selection afterwards
  const handleAddNewProfileClick = async () => {
    if (!onAddNewProfile) return;
    try {
      const maybePromise: any = onAddNewProfile ? (onAddNewProfile as any)() : null;
      if (maybePromise && typeof maybePromise.then === 'function') {
        await maybePromise;
      }
      // After successful creation, reset the select so it doesn't stay on 'other'
      setSelectedOption('');
    } catch (err) {
      // onAddNewProfile should show errors via toast; still ensure select reset is safe
      setSelectedOption('');
    }
  };

  const { 
    hasPermission
  } = usePermissions();

  return (
    <div className="space-y-3">
      {/* Select pour ajouter un profil */}
      <div className="flex gap-2">
        <select 
          className="flex-1 border rounded-md px-3 py-2 text-sm"
          onChange={handleProfileChange}
          value={selectedOption}
        >
          <option value="">Sélectionner un profil</option>
          {profiles.map(profile => (
            <option key={profile.id} value={profile.id}>
              {profile.name}
            </option>
          ))}
          {onAddNewProfile && <option value="other">Autre (créer un nouveau profil)</option>}
        </select>
      </div>
      
      {/* Champ pour créer un nouveau profil */}
      {/* Show new profile input only when the user selected "other" */}
      {onAddNewProfile && selectedOption === 'other' && (
        <div className="flex gap-2">
          <Input
            placeholder="Nouveau profil intervenant"
            value={newProfileName}
            onChange={(e) => onNewProfileNameChange?.(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddNewProfileClick()}
          />
          <Button 
            onClick={() => handleAddNewProfileClick()} 
            size="sm" 
            variant="outline"
            disabled={!newProfileName.trim()}
          >
            Ajouter
          </Button>
        </div>
      )}
      
      {/* Liste des profils sélectionnés avec temps */}
      {profilesData.length > 0 && (
        <div className="space-y-2 pr-1">
          <label className="block text-sm font-medium">Profils sélectionnés :</label>
          {/* === MARQUEE: début de la zone marquée === */}
          <div className="space-y-2 max-h-64 overflow-y-auto pb-2 pt-2 bg-grey-50 rounded-md border">
            {profilesData.map(profileData => {
              const profile = profiles.find(p => p.id === profileData.profile_intervenant_id);
              return profile ? (
                <div key={profileData.profile_intervenant_id} className="flex items-center gap-2 p-2 border rounded w-full">
                  <Badge variant="secondary" className="text-xs">
                    {profile.name}
                  </Badge>
                  <Input
                    type="number"
                    step="0.5"
                    placeholder="Temps (h)"
                    value={profileData.temps_intervenant}
                    onChange={(e) => onProfileTimeChange(profileData.profile_intervenant_id, e.target.value)}
                    className="w-30 text-xs"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => onProfileRemove(profileData.profile_intervenant_id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    ×
                  </button>
                </div>
              ) : null;
            })}
          </div>
          {/* === MARQUEE: fin de la zone marquée === */}
        </div>
      )}
    </div>
  );
};

// (no exported helpers)

// Hook personnalisé pour la gestion des activités
const useActivityForm = (profiles: IntervenantProfile[], setProfiles?: React.Dispatch<React.SetStateAction<IntervenantProfile[]>>) => {
  const [form, setForm] = useState<ActivityFormData>({
    name: '',
    duree_standard: '',
    profiles_data: [],
    is_active: true
  });
  const [newProfileName, setNewProfileName] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    if (type === 'number') {
      // Pour les champs number, garder la valeur comme string pour éviter les problèmes de parsing
      setForm({ ...form, [name]: value });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleProfileAdd = (profileId: number) => {
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

  const handleProfileRemove = (profileId: number) => {
    setForm(prev => ({
      ...prev,
      profiles_data: prev.profiles_data.filter(p => p.profile_intervenant_id !== profileId)
    }));
  };

  const handleAddNewProfile = async () => {
    if (!newProfileName.trim()) {
      toast.error('Le nom du profil est requis');
      return;
    }

    try {
      const res = await api.post('/catalog/profiles/', { name: newProfileName.trim() });
      const newProfile = res.data;
      
      // Mettre à jour la liste des profils dans le composant parent
      if (setProfiles) {
        setProfiles(prev => [...prev, newProfile]);
      }
      
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

  const resetForm = () => {
    setForm({
      name: '',
      duree_standard: '',
      profiles_data: [],
      is_active: true
    });
    setNewProfileName('');
  };

  const populateForm = (activity: Activity) => {
    setForm({
      name: activity.name,
      duree_standard: activity.duree_standard.toString(),
      profiles_data: activity.activity_profiles?.map(profile => ({
        profile_intervenant_id: profile.profile_intervenant.id,
        temps_intervenant: profile.temps_intervenant.toString()
      })) || [],
      is_active: activity.is_active
    });
  };

  const validateForm = (): boolean => {
    if (!form.name.trim()) {
      toast.error('Le nom de l\'activité est requis');
      return false;
    }

    if (!form.duree_standard || isNaN(parseFloat(form.duree_standard)) || parseFloat(form.duree_standard) <= 0) {
      toast.error('La durée standard doit être un nombre positif');
      return false;
    }

    if (form.profiles_data.length === 0) {
      toast.error('Au moins un profil intervenant est requis');
      return false;
    }

    const incompleteProfiles = form.profiles_data.filter(p => !p.temps_intervenant);
    if (incompleteProfiles.length > 0) {
      toast.error('Tous les temps intervenant doivent être renseignés');
      return false;
    }

    // Vérifier que tous les temps sont des nombres valides
    const invalidTimes = form.profiles_data.filter(p => {
      const time = parseFloat(p.temps_intervenant);
      return isNaN(time) || time <= 0;
    });
    if (invalidTimes.length > 0) {
      toast.error('Tous les temps intervenant doivent être des nombres positifs');
      return false;
    }

    return true;
  };

  const updateForm = (newForm: ActivityFormData) => {
    setForm(newForm);
  };

  return {
    form,
    newProfileName,
    setNewProfileName,
    handleChange,
    handleProfileAdd,
    handleProfileTimeChange,
    handleProfileRemove,
    handleAddNewProfile,
    resetForm,
    populateForm,
    validateForm,
    updateForm
  };
};

export function ServiceDetailsPage() {
  const { serviceId } = useParams<{ serviceId: string }>();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [tauxHoraires, setTauxHoraires] = useState<TauxHoraire[]>([]);
  const [loadingTaux, setLoadingTaux] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profiles, setProfiles] = useState<IntervenantProfile[]>([]);
  
  // Hook personnalisé pour la gestion des formulaires d'activité
  const createActivityForm = useActivityForm(profiles, setProfiles);
  const editActivityForm = useActivityForm(profiles, setProfiles);
  
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    category_id: '',
    description: '',
    is_active: true
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [savingEdit, setSavingEdit] = useState(false);
  
  // États pour la modification d'activité
  const [editActivityDialogOpen, setEditActivityDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [savingEditActivity, setSavingEditActivity] = useState(false);
  
  // États pour la suppression d'activité
  const [deleteActivityDialogOpen, setDeleteActivityDialogOpen] = useState(false);
  const [deletingActivity, setDeletingActivity] = useState<Activity | null>(null);
  const [deletingActivityLoading, setDeletingActivityLoading] = useState(false);

  // État pour la recherche d'activités
  const [activitySearchTerm, setActivitySearchTerm] = useState('');

  // États de pagination pour les activités
  const [currentActivityPage, setCurrentActivityPage] = useState(1);
  const [activityPageSize] = useState(10); // 10 activités par page

  // Fonction pour filtrer les activités
  const filteredActivities = service?.activities?.filter(activity => {
    if (!activitySearchTerm.trim()) return true;
    
    const searchLower = activitySearchTerm.toLowerCase();
    return (
      activity.name.toLowerCase().includes(searchLower) ||
      activity.duree_standard.toString().includes(searchLower) ||
      activity.activity_profiles?.some(profile => 
        profile.profile_intervenant.name.toLowerCase().includes(searchLower)
      ) ||
      (activity.is_active ? 'active' : 'inactive').includes(searchLower)
    );
  }) || [];

  // Calculs de pagination pour les activités
  const totalActivityPages = Math.ceil(filteredActivities.length / activityPageSize);
  const startActivityIndex = (currentActivityPage - 1) * activityPageSize;
  const endActivityIndex = startActivityIndex + activityPageSize;
  const paginatedActivities = filteredActivities.slice(startActivityIndex, endActivityIndex);
  const hasActivityPrev = currentActivityPage > 1;
  const hasActivityNext = currentActivityPage < totalActivityPages;

  // Fonctions de pagination pour les activités
  const resetActivityPage = () => setCurrentActivityPage(1);
  
  const setActivityPageSafely = (page: number) => {
    const safePage = Math.max(1, page);
    if (totalActivityPages > 0) {
      const maxPage = Math.max(1, totalActivityPages);
      setCurrentActivityPage(Math.min(safePage, maxPage));
    } else {
      setCurrentActivityPage(safePage);
    }
  };

  const { 
    hasPermission
  } = usePermissions();

  const getActivityPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalActivityPages <= maxVisiblePages) {
      for (let i = 1; i <= totalActivityPages; i++) {
        pages.push(i);
      }
    } else {
      let start = Math.max(1, currentActivityPage - Math.floor(maxVisiblePages / 2));
      let end = Math.min(totalActivityPages, start + maxVisiblePages - 1);
      
      if (end === totalActivityPages) {
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
    resetActivityPage();
  }, [activitySearchTerm]);

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

  const handleSaveActivity = async () => {
    if (!createActivityForm.validateForm()) return;

    setSaving(true);
    try {
      const payload = {
        ...createActivityForm.form,
        service_id: serviceId,
        duree_standard: parseFloat(createActivityForm.form.duree_standard),
        profiles_data: createActivityForm.form.profiles_data.map(p => ({
          ...p,
          temps_intervenant: parseFloat(p.temps_intervenant)
        }))
      };

      await api.post('/catalog/activities/', payload);
      toast.success('Activité ajoutée avec succès');
      handleCloseDialog();
      fetchServiceDetails();
    } catch (err) {
      console.error('Erreur lors de l\'ajout de l\'activité:', err);
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
      case 'intermediaire': return 'bg-blue-100 text-blue-600';
      case 'operationnel': return 'bg-green-100 text-green-800';
      case 'senior': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Fonction utilitaire pour formater les durées
  const formatDuration = (hours: number): string => {
    if (hours === 0) return '0 h';
    if (Number.isInteger(hours)) return `${hours} h`;
    return `${hours.toFixed(1)} h`;
  };

  // Fonction pour calculer la durée totale des activités
  const calculateTotalDuration = (): string => {
    if (!service?.activities || service.activities.length === 0) {
      return '0 h';
    }
    
    const totalDuration = service.activities.reduce((sum, activity) => {
      const duration = typeof activity.duree_standard === 'number' 
        ? activity.duree_standard 
        : parseFloat(activity.duree_standard) || 0;
      return sum + duration;
    }, 0);
    
    return formatDuration(totalDuration);
  };

  const handleOpenDialog = () => {
    createActivityForm.resetForm();
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    createActivityForm.resetForm();
  };

  // Fonctions pour la modification d'activité
  const handleOpenEditActivityDialog = (activity: Activity) => {
    setEditingActivity(activity);
    editActivityForm.populateForm(activity);
    setEditActivityDialogOpen(true);
  };

  const handleSaveEditActivity = async () => {
    if (!editingActivity || !editActivityForm.validateForm()) return;

    setSavingEditActivity(true);
    try {
      const payload = {
        ...editActivityForm.form,
        service_id: serviceId, // Ajouter le service_id requis
        duree_standard: parseFloat(editActivityForm.form.duree_standard),
        profiles_data: editActivityForm.form.profiles_data.map(p => ({
          ...p,
          temps_intervenant: parseFloat(p.temps_intervenant)
        }))
      };

      await api.put(`/catalog/activities/${editingActivity.id}/`, payload);
      toast.success('Activité modifiée avec succès');
      setEditActivityDialogOpen(false);
      setEditingActivity(null);
      fetchServiceDetails();
    } catch (err) {
      toast.error('Erreur lors de la modification de l\'activité');
    } finally {
      setSavingEditActivity(false);
    }
  };

  const handleCloseEditActivityDialog = () => {
    setEditActivityDialogOpen(false);
    setEditingActivity(null);
    editActivityForm.resetForm();
  };

  // Fonctions pour la suppression d'activité
  const handleOpenDeleteActivityDialog = (activity: Activity) => {
    setDeletingActivity(activity);
    setDeleteActivityDialogOpen(true);
  };

  const handleDeleteActivity = async () => {
    if (!deletingActivity) return;

    setDeletingActivityLoading(true);
    try {
      await api.delete(`/catalog/activities/${deletingActivity.id}/`);
      toast.success('Activité supprimée avec succès');
      setDeleteActivityDialogOpen(false);
      setDeletingActivity(null);
      fetchServiceDetails();
    } catch (err) {
      toast.error('Erreur lors de la suppression de l\'activité');
    } finally {
      setDeletingActivityLoading(false);
    }
  };

  const handleCloseDeleteActivityDialog = () => {
    setDeleteActivityDialogOpen(false);
    setDeletingActivity(null);
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
    <div className="max-w-8xl mx-auto space-y-6">
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
          {hasPermission('catalog.can_edit_catalog') && (
          <Button size="sm" variant="outline" onClick={handleOpenEditDialog}>
            <Edit className="h-4 w-4 mr-2" />
            Modifier
          </Button>
          )}
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
                Activités associées ({filteredActivities.length}/{service.activities?.length || 0})
              </CardTitle>
              {hasPermission('catalog.can_add_catalog') && (
              <Button onClick={handleOpenDialog} size="sm" className="gap-2">
                <Plus size={16} />
                Ajouter une activité
              </Button>
              )}
            </CardHeader>
            <CardContent>
              {/* Barre de recherche */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Rechercher une activité..."
                    value={activitySearchTerm}
                    onChange={(e) => setActivitySearchTerm(e.target.value)}
                    className="pl-10"
                  />
                  {activitySearchTerm && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActivitySearchTerm('')}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                    >
                      ×
                    </Button>
                  )}
                </div>
              </div>

              {paginatedActivities.length > 0 ? (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nom</TableHead>
                        <TableHead>Temps standard</TableHead>
                        <TableHead>Profils et temps</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedActivities.map(activity => (
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
                          <TableCell>
                            <div className="flex gap-2">
                              {hasPermission('catalog.can_edit_catalog') && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenEditActivityDialog(activity)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                              {hasPermission('catalog.can_delete_catalog') && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenDeleteActivityDialog(activity)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  {totalActivityPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
                      {/* Informations de pagination */}
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>
                          Page {currentActivityPage} sur {totalActivityPages}
                        </span>
                        <span className="hidden sm:inline">•</span>
                        <span className="hidden sm:inline">
                          {filteredActivities.length} activités au total
                        </span>
                      </div>

                      {/* Contrôles de pagination */}
                      <div className="flex items-center gap-2">
                        {/* Boutons de navigation rapide */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setActivityPageSafely(1)}
                          disabled={currentActivityPage === 1}
                          className="hidden sm:flex"
                        >
                          <ChevronsLeft size={16} />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setActivityPageSafely(currentActivityPage - 1)}
                          disabled={!hasActivityPrev || currentActivityPage === 1}
                        >
                          <ChevronLeft size={16} />
                        </Button>

                        {/* Numéros de page */}
                        <div className="flex items-center gap-1">
                          {getActivityPageNumbers().map(pageNum => (
                            <Button
                              key={pageNum}
                              variant={currentActivityPage === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => setActivityPageSafely(pageNum)}
                              className="w-8 h-8 text-xs hidden sm:flex"
                            >
                              {pageNum}
                            </Button>
                          ))}
                          {/* Version mobile avec sélecteur */}
                          <div className="sm:hidden flex items-center gap-2">
                            <span className="text-sm text-gray-600">Page</span>
                            <select
                              value={currentActivityPage}
                              onChange={(e) => setActivityPageSafely(parseInt(e.target.value))}
                              className="border rounded px-2 py-1 text-sm"
                            >
                              {Array.from({ length: totalActivityPages }, (_, i) => i + 1).map(pageNum => (
                                <option key={pageNum} value={pageNum}>
                                  {pageNum}
                                </option>
                              ))}
                            </select>
                            <span className="text-sm text-gray-600">sur {totalActivityPages}</span>
                          </div>
                        </div>

                        {/* Boutons de navigation rapide */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setActivityPageSafely(currentActivityPage + 1)}
                          disabled={!hasActivityNext || currentActivityPage === totalActivityPages}
                        >
                          <ChevronRight size={16} />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setActivityPageSafely(totalActivityPages)}
                          disabled={currentActivityPage === totalActivityPages}
                          className="hidden sm:flex"
                        >
                          <ChevronsRight size={16} />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : activitySearchTerm ? (
                <div className="text-center py-8 text-gray-500">
                  <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Aucune activité trouvée pour "{activitySearchTerm}"</p>
                  <Button 
                    onClick={() => setActivitySearchTerm('')} 
                    className="mt-4" 
                    variant="outline"
                  >
                    Effacer la recherche
                  </Button>
                </div>
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
                  <Activity className="h-5 w-5 text-blue-600" />
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
                  {calculateTotalDuration()}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Taux horaires */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Currency className="h-5 w-5" />
                Taux horaires
                {loadingTaux && <Loader2 className="h-4 w-4 animate-spin" />}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tauxHoraires.length > 0 ? (
                <div className="max-h-64 overflow-y-auto space-y-3 pr-2">
                  {tauxHoraires.map(taux => (
                    <div key={taux.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{taux.profile_intervenant.name}</p>
                        <Badge className={`text-xs ${getNiveauColor(taux.niveau_intervenant)}`}>
                          {getNiveauDisplay(taux.niveau_intervenant)}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatMontant(taux.taux_heure)}/h</p>
                        <Badge variant={taux.is_active ? "default" : "destructive"} className="text-xs">
                          {taux.is_active ? 'Actif' : 'Inactif'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <Currency className="h-8 w-8 mx-auto mb-2 text-gray-300" />
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
                  <Currency className="h-4 w-4 mr-2" />
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
                value={createActivityForm.form.name}
                onChange={createActivityForm.handleChange}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Durée standard (h)</label>
              <Input
                name="duree_standard"
                type="number"
                step="0.5"
                placeholder="0.0"
                value={createActivityForm.form.duree_standard}
                onChange={createActivityForm.handleChange}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Profils intervenant</label>
              <ProfileManager
                profiles={profiles}
                profilesData={createActivityForm.form.profiles_data}
                onProfileAdd={createActivityForm.handleProfileAdd}
                onProfileTimeChange={createActivityForm.handleProfileTimeChange}
                onProfileRemove={createActivityForm.handleProfileRemove}
                newProfileName={createActivityForm.newProfileName}
                onNewProfileNameChange={createActivityForm.setNewProfileName}
                onAddNewProfile={createActivityForm.handleAddNewProfile}
              />
            </div>
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={createActivityForm.form.is_active}
                  onChange={(e) => {
                    const newForm = { ...createActivityForm.form, is_active: e.target.checked };
                    createActivityForm.updateForm(newForm);
                  }}
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

      {/* Modale de modification d'activité */}
      <Dialog open={editActivityDialogOpen} onOpenChange={setEditActivityDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier l'activité</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nom de l'activité</label>
              <Input
                name="name"
                placeholder="Nom de l'activité"
                value={editActivityForm.form.name}
                onChange={editActivityForm.handleChange}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Durée standard (h)</label>
              <Input
                name="duree_standard"
                type="number"
                step="0.5"
                placeholder="0.0"
                value={editActivityForm.form.duree_standard}
                onChange={editActivityForm.handleChange}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Profils intervenant</label>
              <ProfileManager
                profiles={profiles}
                profilesData={editActivityForm.form.profiles_data}
                onProfileAdd={editActivityForm.handleProfileAdd}
                onProfileTimeChange={editActivityForm.handleProfileTimeChange}
                onProfileRemove={editActivityForm.handleProfileRemove}
                newProfileName={editActivityForm.newProfileName}
                onNewProfileNameChange={editActivityForm.setNewProfileName}
                onAddNewProfile={editActivityForm.handleAddNewProfile}
              />
            </div>
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={editActivityForm.form.is_active}
                  onChange={(e) => {
                    const newForm = { ...editActivityForm.form, is_active: e.target.checked };
                    editActivityForm.updateForm(newForm);
                  }}
                  className="rounded"
                />
                <span className="text-sm">Activité active</span>
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseEditActivityDialog}>
              Annuler
            </Button>
            <Button onClick={handleSaveEditActivity} disabled={savingEditActivity}>
              {savingEditActivity ? <Loader2 className="animate-spin" size={16}/> : 'Modifier'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modale de confirmation de suppression d'activité */}
      <Dialog open={deleteActivityDialogOpen} onOpenChange={setDeleteActivityDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600">
              Êtes-vous sûr de vouloir supprimer l'activité <strong>"{deletingActivity?.name}"</strong> ?
            </p>
            <p className="text-sm text-red-600">
              Cette action est irréversible et supprimera définitivement l'activité et toutes ses données associées.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDeleteActivityDialog}>
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteActivity}
              disabled={deletingActivityLoading}
            >
              {deletingActivityLoading ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={16} />
                  Suppression...
                </>
              ) : (
                'Supprimer'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 