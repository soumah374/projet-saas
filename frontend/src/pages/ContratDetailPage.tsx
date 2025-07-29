import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Play, 
  Check, 
  X, 
  Pause, 
  CalendarIcon,
  Plus,
  FileText,
  Bell,
  AlertTriangle,
  Clock,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import { 
  useContratById,
  useUpdateContrat,
  useDeleteContrat,
  useActiverContrat,
  useTerminerContrat,
  useAnnulerContrat,
  useSuspendreContrat,
  type Contrat
} from '@/hooks/use-contrats';
import { formatDate, formatMontant } from '@/lib/formatters';
import { ContractEditor } from '@/components/ContractEditor';
import { useEcheances } from '@/hooks/use-echeances';
import { Echeance } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

export function ContratDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const contratId = parseInt(id || '0');
  
  // États pour les modals
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [echeancierDialogOpen, setEcheancierDialogOpen] = useState(false);
  const [selectedEcheancierType, setSelectedEcheancierType] = useState<string>('');
  const [editForm, setEditForm] = useState({
    date_debut: '',
    date_fin: '',
    conditions: '',
    notes: '',
    echeancier_type: 'standard', // 'standard', 'tranches', 'personnalise'
    nombre_echeances: 3,
    echeances: [] as Array<{
      numero: number;
      type: 'acompte' | 'tranche' | 'solde';
      pourcentage: number;
      date_echeance: string;
      commentaire: string;
    }>
  });
  const [editDateDebut, setEditDateDebut] = useState<Date | undefined>(undefined);
  const [editDateFin, setEditDateFin] = useState<Date | undefined>(undefined);
  const [showContractEditor, setShowContractEditor] = useState(false);

  // États pour les filtres d'échéances
  const [filterStatut, setFilterStatut] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'numero' | 'date' | 'montant'>('numero');

  // Hooks
  const { data: contrat, isLoading, error } = useContratById(contratId);
  const updateContratMutation = useUpdateContrat();
  const deleteContratMutation = useDeleteContrat();
  const activerContratMutation = useActiverContrat();
  const terminerContratMutation = useTerminerContrat();
  const annulerContratMutation = useAnnulerContrat();
  const suspendreContratMutation = useSuspendreContrat();

  // Hook pour les échéances
  const {
    echeances,
    isLoading: isLoadingEcheances,
    genererEcheancier,
    marquerPaye,
    envoyerAlerte
  } = useEcheances(contratId);

  // Fonction pour filtrer et trier les échéances
  const getFilteredAndSortedEcheances = () => {
    if (!echeances || !Array.isArray(echeances)) return [];
    
    let filtered = echeances;
    
    // Filtrage par statut
    if (filterStatut !== 'all') {
      filtered = filtered.filter(echeance => {
        switch (filterStatut) {
          case 'paye':
            return echeance.statut === 'paye';
          case 'en_attente':
            return echeance.statut === 'en_attente';
          case 'alerte':
            return echeance.doit_alerter;
          case 'retard':
            return echeance.est_en_retard;
          default:
            return true;
        }
      });
    }
    
    // Tri
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'numero':
          return a.numero_echeance - b.numero_echeance;
        case 'date':
          return new Date(a.date_echeance).getTime() - new Date(b.date_echeance).getTime();
        case 'montant':
          return b.montant_ttc - a.montant_ttc;
        default:
          return 0;
      }
    });
    
    return filtered;
  };

  // Gestionnaires d'événements
  const handleUpdateContrat = async () => {
    if (!contrat) return;

    // Validation des données
    if (!editForm.date_debut || !editForm.date_fin) {
      toast.error('Les dates de début et de fin sont obligatoires');
      return;
    }

    if (new Date(editForm.date_debut) >= new Date(editForm.date_fin)) {
      toast.error('La date de fin doit être postérieure à la date de début');
      return;
    }

    // Validation des échéances
    if (editForm.echeances.length > 0) {
      const totalPourcentage = editForm.echeances.reduce((sum, e) => sum + e.pourcentage, 0);
      if (totalPourcentage !== 100) {
        toast.error('Le total des pourcentages des échéances doit être égal à 100%');
        return;
      }
    }

    console.log('Début de la mise à jour du contrat:', contrat.id);
    console.log('Données à envoyer:', {
      date_debut: editForm.date_debut,
      date_fin: editForm.date_fin,
      conditions: editForm.conditions,
      notes: editForm.notes,
      echeances: editForm.echeances
    });

    try {
      const result = await updateContratMutation.mutateAsync({
        id: contrat.id,
        data: {
          date_debut: editForm.date_debut,
          date_fin: editForm.date_fin,
          conditions: editForm.conditions || '',
          notes: editForm.notes || '',
          echeances: editForm.echeances
        }
      });
      
      console.log('Résultat de la mise à jour:', result);
      setEditDialogOpen(false);
    } catch (err) {
      console.error('Erreur détaillée lors de la mise à jour:', err);
      // Error handled by hook
    }
  };

  const handleSaveContractContent = async (contenuPersonnalise: string) => {
    if (!contrat) return;

    try {
      await updateContratMutation.mutateAsync({
        id: contrat.id,
        data: {
          contenu_personnalise: contenuPersonnalise
        }
      });
      toast.success('Contenu du contrat sauvegardé');
    } catch (err) {
      console.error('Erreur lors de la sauvegarde du contenu:', err);
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const handleDeleteContrat = async () => {
    if (!contrat) return;

    try {
      await deleteContratMutation.mutateAsync(contrat.id);
      navigate('/contrats');
    } catch (err) {
      // Error handled by hook
    }
  };

  const handleActionContrat = async (action: string) => {
    if (!contrat) return;

    // Pour l'annulation, afficher le modal de confirmation
    if (action === 'annuler') {
      setCancelDialogOpen(true);
      return;
    }

    try {
      switch (action) {
        case 'activer':
          await activerContratMutation.mutateAsync(contrat.id);
          break;
        case 'terminer':
          await terminerContratMutation.mutateAsync(contrat.id);
          break;
        case 'suspendre':
          await suspendreContratMutation.mutateAsync(contrat.id);
          break;
      }
    } catch (err) {
      // Error handled by hook
    }
  };

  const handleConfirmAnnuler = async () => {
    if (!contrat) return;

    try {
      await annulerContratMutation.mutateAsync(contrat.id);
      setCancelDialogOpen(false);
    } catch (err) {
      // Error handled by hook
    }
  };

  const handleGenererEcheancier = async (type: string) => {
    setSelectedEcheancierType(type);
    setEcheancierDialogOpen(true);
  };

  const handleConfirmGenererEcheancier = async () => {
    try {
      await genererEcheancier(selectedEcheancierType, getEcheancierDetails(selectedEcheancierType)?.echeances);
      setEcheancierDialogOpen(false);
    } catch (err) {
      console.error('Erreur lors de la génération de l\'échéancier:', err);
    }
  };

  const handleMarquerPaye = async (echeanceId: number) => {
    try {
      const datePaiement = new Date().toISOString();
      await marquerPaye(echeanceId, datePaiement);
    } catch (err) {
      console.error('Erreur lors du marquage:', err);
    }
  };

  const handleEnvoyerAlerte = async (echeanceId: number) => {
    try {
      await envoyerAlerte(echeanceId);
    } catch (err) {
      console.error('Erreur lors de l\'envoi de l\'alerte:', err);
    }
  };

  const openEditDialog = () => {
    if (!contrat) return;
    
    setEditForm({
      date_debut: contrat.date_debut,
      date_fin: contrat.date_fin,
      conditions: contrat.conditions || '',
      notes: contrat.notes || '',
      echeancier_type: 'standard',
      nombre_echeances: 3,
      echeances: []
    });
    setEditDateDebut(new Date(contrat.date_debut));
    setEditDateFin(new Date(contrat.date_fin));
    setEditDialogOpen(true);
  };

  // Fonctions pour générer automatiquement les échéances
  const generateStandardEcheances = () => {
    const echeances = contrat.echeances_contrat || [
      {
        numero: 1,
        type: 'acompte' as const,
        pourcentage: 30,
        date_echeance: editForm.date_debut,
        commentaire: 'Acompte à la commande'
      },
      {
        numero: 2,
        type: 'tranche' as const,
        pourcentage: 40,
        date_echeance: editForm.date_fin,
        commentaire: 'Paiement à la livraison'
      },
      {
        numero: 3,
        type: 'solde' as const,
        pourcentage: 30,
        date_echeance: editForm.date_fin,
        commentaire: 'Solde après réception'
      }
    ];
    setEditForm({ ...editForm, echeances });
  };

  const generateTranchesEcheances = () => {
    const echeances = [];
    const pourcentageParTranche = 100 / editForm.nombre_echeances;
    
    for (let i = 1; i <= editForm.nombre_echeances; i++) {
      echeances.push({
        numero: i,
        type: i === 1 ? 'acompte' as const : 'tranche' as const,
        pourcentage: pourcentageParTranche,
        date_echeance: editForm.date_debut,
        commentaire: `Tranche ${i}`
      });
    }
    setEditForm({ ...editForm, echeances });
  };

  const updateEcheance = (index: number, field: string, value: any) => {
    const newEcheances = [...editForm.echeances];
    newEcheances[index] = { ...newEcheances[index], [field]: value };
    setEditForm({ ...editForm, echeances: newEcheances });
  };

  const addEcheance = () => {
    const newEcheance = {
      numero: editForm.echeances.length + 1,
      type: 'tranche' as const,
      pourcentage: 0,
      date_echeance: editForm.date_debut,
      commentaire: ''
    };
    setEditForm({ 
      ...editForm, 
      echeances: [...editForm.echeances, newEcheance] 
    });
  };

  const removeEcheance = (index: number) => {
    const newEcheances = editForm.echeances.filter((_, i) => i !== index);
    // Recalculer les numéros
    newEcheances.forEach((echeance, i) => {
      echeance.numero = i + 1;
    });
    setEditForm({ ...editForm, echeances: newEcheances });
  };

  // Effets pour générer automatiquement les échéances
  useEffect(() => {
    if (editForm.echeancier_type === 'standard' && editForm.date_debut && editForm.date_fin) {
      generateStandardEcheances();
    }
  }, [editForm.echeancier_type, editForm.date_debut, editForm.date_fin]);

  useEffect(() => {
    if (editForm.echeancier_type === 'tranches' && editForm.date_debut && editForm.date_fin) {
      generateTranchesEcheances();
    }
  }, [editForm.echeancier_type, editForm.nombre_echeances, editForm.date_debut, editForm.date_fin]);

  const openDeleteDialog = () => {
    setDeleteDialogOpen(true);
  };

  const getStatutBadge = (statut: string) => {
    const variants = {
      brouillon: 'secondary',
      actif: 'default',
      termine: 'default',
      annule: 'destructive',
      suspendu: 'destructive',
    } as const;
    
    return <Badge variant={variants[statut as keyof typeof variants]}>{statut}</Badge>;
  };

  const getEcheanceStatutBadge = (echeance: Echeance) => {
    if (echeance.statut === 'paye') {
      return <Badge variant="default" className="bg-green-500"><CheckCircle size={12} className="mr-1" />Payé</Badge>;
    } else if (echeance.est_en_retard) {
      return <Badge variant="destructive"><AlertTriangle size={12} className="mr-1" />En retard</Badge>;
    } else if (echeance.doit_alerter) {
      return <Badge variant="secondary" className="bg-yellow-500"><Clock size={12} className="mr-1" />Alerte</Badge>;
    } else {
      return <Badge variant="outline"><Clock size={12} className="mr-1" />En attente</Badge>;
    }
  };

  const getTypeEcheanceLabel = (type: string) => {
    const labels = {
      'acompte': 'Acompte',
      'tranche': 'Tranche',
      'solde': 'Solde',
      'retention': 'Retenue'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getEcheancierDetails = (type: string) => {
    if (!contrat) return null;    
    const details = {
      'standard': {
        title: 'Échéancier Standard',
        description: 'Échéancier classique avec acompte, tranches et solde',
        echeances: contrat.echeances_contrat || [
          { numero: 1, type: 'acompte', pourcentage: 30, description: 'Acompte à la signature', date_echeance: contrat.date_debut, commentaire: 'Acompte à la signature'},
          { numero: 2, type: 'tranche', pourcentage: 40, description: 'Tranche intermédiaire', date_echeance: contrat.date_fin, commentaire: 'Tranche intermédiaire' },
          { numero: 3, type: 'solde', pourcentage: 30, description: 'Solde à la réception', date_echeance: contrat.date_fin, commentaire: 'Solde à la réception' }
        ]
      },
      'tranches': {
        title: 'Échéancier en Tranches',
        description: 'Échéancier avec plusieurs tranches de paiement',
        echeances: contrat.echeances_contrat || [
          { numero: 1, type: 'acompte', pourcentage: 25, description: 'Acompte à la signature', date_echeance: contrat.date_debut, commentaire: 'Acompte à la signature' },
          { numero: 2, type: 'tranche', pourcentage: 25, description: '1ère tranche', date_echeance: contrat.date_debut, commentaire: '1ère tranche' },
          { numero: 3, type: 'tranche', pourcentage: 25, description: '2ème tranche', date_echeance: contrat.date_fin, commentaire: '2ème tranche' },
          { numero: 4, type: 'solde', pourcentage: 25, description: 'Solde à la réception', date_echeance: contrat.date_fin, commentaire: 'Solde à la réception' }
        ]
      }
    };
    return details[type as keyof typeof details];
  };

  const getActionButtons = () => {
    if (!contrat) return [];
    
    const buttons = [];
    
    if (contrat.statut === 'brouillon') {
      buttons.push(
        <Button
          key="activer"
          onClick={() => handleActionContrat('activer')}
          disabled={activerContratMutation.isPending}
        >
          <Play size={16} className="mr-2" />
          Activer
        </Button>
      );
    }
    
    if (contrat.statut === 'actif') {
      buttons.push(
        <Button
          key="terminer"
          variant="outline"
          onClick={() => handleActionContrat('terminer')}
          disabled={terminerContratMutation.isPending}
        >
          <Check size={16} className="mr-2" />
          Terminer
        </Button>,
        <Button
          key="suspendre"
          variant="outline"
          onClick={() => handleActionContrat('suspendre')}
          disabled={suspendreContratMutation.isPending}
        >
          <Pause size={16} className="mr-2" />
          Suspendre
        </Button>
      );
    }
    
    if (contrat.statut === 'suspendu') {
      buttons.push(
        <Button
          key="activer"
          onClick={() => handleActionContrat('activer')}
          disabled={activerContratMutation.isPending}
        >
          <Play size={16} className="mr-2" />
          Réactiver
        </Button>
      );
    }
    
    if (['brouillon', 'actif', 'suspendu'].includes(contrat.statut)) {
      buttons.push(
        <Button
          key="annuler"
          variant="destructive"
          onClick={() => handleActionContrat('annuler')}
          disabled={annulerContratMutation.isPending}
        >
          <X size={16} className="mr-2" />
          Annuler
        </Button>
      );
    }
    
    return buttons;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error || !contrat) {
    return (
      <div className="text-center py-10">
        <p className="text-red-600">Erreur lors du chargement du contrat</p>
        <Button onClick={() => navigate('/contrats')} className="mt-4">
          Retour aux contrats
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-8xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/contrats')}>
            <ArrowLeft size={16} className="mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Contrat {contrat.numero}</h1>
            <p className="text-gray-600">Client: {contrat.client.nom_complet}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={openEditDialog} variant="outline">
            <Edit size={16} className="mr-2" />
            Modifier
          </Button>
          <Button onClick={() => setShowContractEditor(true)} variant="outline">
            <FileText size={16} className="mr-2" />
            Éditer contrat
          </Button>
          {contrat.statut === 'brouillon' && (
            <Button onClick={openDeleteDialog} variant="destructive">
              <Trash2 size={16} className="mr-2" />
              Supprimer
            </Button>
          )}
          {getActionButtons()}
        </div>
      </div>

      {/* Onglets principaux */}
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">Général</TabsTrigger>
          <TabsTrigger value="echeancier">Échéancier</TabsTrigger>
          <TabsTrigger value="lignes">Lignes</TabsTrigger>
          <TabsTrigger value="alertes">Alertes</TabsTrigger>
        </TabsList>

        {/* Onglet Général */}
        <TabsContent value="general" className="space-y-6">
          {/* Informations générales */}
          <Card>
            <CardHeader>
              <CardTitle>Informations générales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Numéro</Label>
                  <p className="font-medium">{contrat.numero}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Client</Label>
                  <p className="font-medium">{contrat.client.nom_complet}</p>
                  <p className="text-sm text-gray-600">{contrat.client.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Devis associé</Label>
                  <p className="font-medium">{contrat.devis.numero}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Statut</Label>
                  <div className="mt-1">
                    {getStatutBadge(contrat.statut)}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Date de création</Label>
                  <p className="font-medium">{formatDate(contrat.date_creation)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Date de début</Label>
                  <p className="font-medium">{formatDate(contrat.date_debut)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Date de fin</Label>
                  <p className="font-medium">{formatDate(contrat.date_fin)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Dernière modification</Label>
                  <p className="font-medium">{formatDate(contrat.updated_at)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configuration TVA */}
          <Card>
            <CardHeader>
              <CardTitle>Configuration TVA</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Taux TVA</Label>
                  <p className="font-medium">{contrat.taux_tva}%</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Appliquer TVA</Label>
                  <p className="font-medium">{contrat.appliquer_tva ? 'Oui' : 'Non'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configuration Frais d'Agence */}
          <Card>
            <CardHeader>
              <CardTitle>Configuration Frais d'Agence</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Taux Frais d'Agence</Label>
                  <p className="font-medium">{contrat.taux_frais_agence}%</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Appliquer Frais d'Agence</Label>
                  <p className="font-medium">{contrat.appliquer_frais_agence ? 'Oui' : 'Non'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Montants */}
          <Card>
            <CardHeader>
              <CardTitle>Montants</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Montant HT</Label>
                  <p className="text-lg font-bold">{formatMontant(contrat.montant_ht)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Montant TVA</Label>
                  <p className="text-lg font-bold">{formatMontant(contrat.montant_tva)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Montant Frais d'Agence</Label>
                  <p className="text-lg font-bold">{formatMontant(contrat.montant_frais_agence)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Montant TTC</Label>
                  <p className="text-lg font-bold text-blue-600">{formatMontant(contrat.montant_ttc)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Conditions et notes */}
          {(contrat.conditions || contrat.notes) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {contrat.conditions && (
                <Card>
                  <CardHeader>
                    <CardTitle>Conditions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap">{contrat.conditions}</p>
                  </CardContent>
                </Card>
              )}
              {contrat.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle>Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap">{contrat.notes}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        {/* Onglet Échéancier */}
        <TabsContent value="echeancier" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon size={20} />
                Échéancier de paiement
              </CardTitle>
              <p className="text-sm text-gray-600">
                Gestion des échéances de paiement du contrat
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Statistiques des échéances */}
                {echeances && Array.isArray(echeances) && echeances.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {echeances.length}
                      </div>
                      <div className="text-sm text-gray-600">Total échéances</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {echeances.filter(e => e.statut === 'paye').length}
                      </div>
                      <div className="text-sm text-gray-600">Payées</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">
                        {echeances.filter(e => e.doit_alerter).length}
                      </div>
                      <div className="text-sm text-gray-600">Alertes</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {echeances.filter(e => e.est_en_retard).length}
                      </div>
                      <div className="text-sm text-gray-600">En retard</div>
                    </div>
                  </div>
                )}

                {/* Boutons de génération d'échéancier */}
                {contrat.statut !== 'termine' && (
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => handleGenererEcheancier('standard')}
                    disabled={isLoadingEcheances}
                  >
                    <Plus size={16} className="mr-2" />
                    Générer échéancier
                  </Button>
                </div>
                )}

                {/* Contrôles de filtres et tri */}
                {echeances && Array.isArray(echeances) && echeances.length > 0 && (
                  <div className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">Filtrer par :</span>
                      <select 
                        value={filterStatut} 
                        onChange={(e) => setFilterStatut(e.target.value)}
                        className="text-sm border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="all">Toutes</option>
                        <option value="en_attente">En attente</option>
                        <option value="paye">Payées</option>
                        <option value="alerte">Alertes</option>
                        <option value="retard">En retard</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">Trier par :</span>
                      <select 
                        value={sortBy} 
                        onChange={(e) => setSortBy(e.target.value as 'numero' | 'date' | 'montant')}
                        className="text-sm border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="numero">Numéro</option>
                        <option value="date">Date</option>
                        <option value="montant">Montant</option>
                      </select>
                    </div>
                    <div className="text-sm text-gray-600">
                      {getFilteredAndSortedEcheances().length} échéance(s) affichée(s)
                    </div>
                  </div>
                )}

                {/* Liste des échéances */}
                {isLoadingEcheances ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw size={24} className="animate-spin" />
                    <span className="ml-2">Chargement des échéances...</span>
                  </div>
                ) : echeances && Array.isArray(echeances) && echeances.length > 0 ? (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                    {getFilteredAndSortedEcheances().map((echeance) => (
                      <div key={echeance.id} className={`border rounded-lg p-4 transition-all duration-200 hover:shadow-md ${
                        echeance.est_en_retard ? 'border-red-200 bg-red-50' :
                        echeance.doit_alerter ? 'border-yellow-200 bg-yellow-50' :
                        echeance.statut === 'paye' ? 'border-green-200 bg-green-50' :
                        'border-gray-200 bg-white'
                      }`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${
                              echeance.statut === 'paye' ? 'bg-green-500' :
                              echeance.est_en_retard ? 'bg-red-500' :
                              echeance.doit_alerter ? 'bg-yellow-500' :
                              'bg-gray-400'
                            }`} />
                            <span className="font-semibold text-lg">
                              Échéance {echeance.numero_echeance}
                            </span>
                            {getEcheanceStatutBadge(echeance)}
                          </div>
                          <div className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {getTypeEcheanceLabel(echeance.type_echeance)}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                          <div className="bg-white p-3 rounded border">
                            <span className="text-gray-500 text-xs uppercase tracking-wide">Montant TTC</span>
                            <div className="font-bold text-lg text-blue-600">
                              {formatMontant(echeance.montant_ttc)}
                            </div>
                          </div>
                          <div className="bg-white p-3 rounded border">
                            <span className="text-gray-500 text-xs uppercase tracking-wide">Pourcentage</span>
                            <div className="font-bold text-lg">{echeance.pourcentage}%</div>
                          </div>
                          <div className="bg-white p-3 rounded border">
                            <span className="text-gray-500 text-xs uppercase tracking-wide">Date échéance</span>
                            <div className="font-bold text-lg">
                              {format(new Date(echeance.date_echeance), 'dd/MM/yyyy', { locale: fr })}
                            </div>
                          </div>
                          <div className="bg-white p-3 rounded border">
                            <span className="text-gray-500 text-xs uppercase tracking-wide">Jours restants</span>
                            <div className={`font-bold text-lg ${
                              echeance.jours_restants < 0 ? 'text-red-500' : 
                              echeance.jours_restants <= 3 ? 'text-yellow-500' : 
                              'text-green-500'
                            }`}>
                              {echeance.jours_restants} jours
                            </div>
                          </div>
                        </div>

                        {echeance.commentaire && (
                          <div className="mt-3 p-3 bg-gray-50 rounded border-l-4 border-blue-200">
                            <span className="text-sm font-medium text-gray-700">Commentaire :</span>
                            <div className="text-sm text-gray-600 mt-1">{echeance.commentaire}</div>
                          </div>
                        )}

                        {echeance.statut === 'en_attente' && (
                          <div className="mt-4 flex gap-2">
                            <Button 
                              size="sm"
                              onClick={() => handleMarquerPaye(echeance.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle size={14} className="mr-1" />
                              Marquer comme payé
                            </Button>
                            {echeance.doit_alerter && (
                              <Button 
                                size="sm"
                                variant="outline"
                                onClick={() => handleEnvoyerAlerte(echeance.id)}
                                className="border-yellow-500 text-yellow-600 hover:bg-yellow-50"
                              >
                                <Bell size={14} className="mr-1" />
                                Envoyer alerte
                              </Button>
                            )}
                          </div>
                        )}

                        {echeance.statut === 'paye' && echeance.date_paiement && (
                          <div className="mt-3 p-2 bg-green-100 rounded text-sm">
                            <span className="font-medium text-green-800">Payé le :</span>
                            <span className="ml-2 text-green-700">
                              {format(new Date(echeance.date_paiement), 'dd/MM/yyyy', { locale: fr })}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <CalendarIcon size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune échéance définie</h3>
                    <p className="text-gray-600 mb-4">
                      Générez un échéancier pour commencer à suivre les paiements de ce contrat.
                    </p>
                    <div className="flex gap-2 justify-center">
                      <Button 
                        variant="outline" 
                        onClick={() => handleGenererEcheancier('standard')}
                        disabled={isLoadingEcheances}
                      >
                        <Plus size={16} className="mr-2" />
                        Générer échéancier
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Lignes */}
        <TabsContent value="lignes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Lignes du contrat</CardTitle>
            </CardHeader>
            <CardContent>
              {contrat.lignes.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">Aucune ligne dans ce contrat</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Désignation</TableHead>
                      <TableHead>Quantité</TableHead>
                      <TableHead>Unité</TableHead>
                      <TableHead>Prix unitaire HT</TableHead>
                      <TableHead>Montant HT</TableHead>
                      <TableHead>Intervenants</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contrat.lignes.map((ligne) => (
                      <TableRow key={ligne.id}>
                        <TableCell>
                          <Badge variant={ligne.type_ligne === 'prestation' ? 'default' : 'secondary'}>
                            {ligne.type_ligne}
                          </Badge>
                        </TableCell>
                        <TableCell>{ligne.activity.intitule || ligne.ligne_frais.type_frais}</TableCell>
                        <TableCell>{ligne.quantite}</TableCell>
                        <TableCell>{ligne.unite.intitule}</TableCell>
                        <TableCell>{formatMontant(ligne.prix_unitaire_ht)}</TableCell>
                        <TableCell className="font-medium">{formatMontant(ligne.montant_ht)}</TableCell>
                        <TableCell>
                          {ligne.intervenants.length > 0 ? (
                            <div className="space-y-1">
                              {ligne.intervenants.map((intervenant) => (
                                <div key={intervenant.id} className="text-sm">
                                  <span className="font-medium">{intervenant.profile_intervenant.intitule}</span>
                                  <br />
                                  <span className="text-gray-600">
                                    {intervenant.temps_intervenant}h × {formatMontant(intervenant.taux_horaire)}/h
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Alertes */}
        <TabsContent value="alertes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell size={20} />
                Alertes et notifications
              </CardTitle>
              <p className="text-sm text-gray-600">
                Suivi des échéances nécessitant une attention
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Échéances nécessitant une alerte */}
                <div>
                  <h4 className="font-semibold mb-2">Échéances nécessitant une alerte</h4>
                  {echeances && Array.isArray(echeances) && echeances.filter(e => e.doit_alerter).length > 0 ? (
                    <div className="space-y-2">
                      {echeances.filter(e => e.doit_alerter).map((echeance) => (
                        <div key={echeance.id} className="border border-yellow-200 bg-yellow-50 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-semibold">Échéance {echeance.numero_echeance}</span>
                              <div className="text-sm text-gray-600">
                                Échéance dans {echeance.jours_restants} jours
                              </div>
                            </div>
                            <Badge variant="secondary" className="bg-yellow-500">
                              Alerte
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">Aucune échéance nécessitant une alerte</p>
                  )}
                </div>

                {/* Échéances en retard */}
                <div>
                  <h4 className="font-semibold mb-2">Échéances en retard</h4>
                  {echeances && Array.isArray(echeances) && echeances.filter(e => e.est_en_retard).length > 0 ? (
                    <div className="space-y-2">
                      {echeances.filter(e => e.est_en_retard).map((echeance) => (
                        <div key={echeance.id} className="border border-red-200 bg-red-50 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-semibold">Échéance {echeance.numero_echeance}</span>
                              <div className="text-sm text-gray-600">
                                En retard de {Math.abs(echeance.jours_restants)} jours
                              </div>
                            </div>
                            <Badge variant="destructive">
                              En retard
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">Aucune échéance en retard</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal d'édition */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Modifier le contrat</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto max-h-[calc(90vh-140px)] pr-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date de début *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {editDateDebut ? format(editDateDebut, "PPP", { locale: fr }) : "Sélectionner une date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" 
                    align="start"
                    side="bottom"
                    sideOffset={4}
                  >
                    <Calendar
                      mode="single"
                      selected={editDateDebut}
                      onSelect={(date) => {
                        setEditDateDebut(date);
                        setEditForm({ ...editForm, date_debut: date ? date.toISOString().split('T')[0] : '' });
                      }}
                      initialFocus
                      locale={fr}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>Date de fin *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {editDateFin ? format(editDateFin, "PPP", { locale: fr }) : "Sélectionner une date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" 
                    align="start"
                    side="bottom"
                    sideOffset={4}
                  >
                    <Calendar
                      mode="single"
                      selected={editDateFin}
                      onSelect={(date) => {
                        setEditDateFin(date);
                        setEditForm({ ...editForm, date_fin: date ? date.toISOString().split('T')[0] : '' });
                      }}
                      initialFocus
                      locale={fr}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div>
              <Label htmlFor="edit-conditions">Conditions</Label>
              <Textarea
                id="edit-conditions"
                value={editForm.conditions}
                onChange={(e) => setEditForm({ ...editForm, conditions: e.target.value })}
                placeholder="Conditions du contrat..."
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                placeholder="Notes du contrat..."
                rows={4}
              />
            </div>

            {/* Section Échéanciers */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-semibold">Échéancier de paiement</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generateStandardEcheances}
                  >
                    Standard (30-40-30)
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generateTranchesEcheances}
                  >
                    Tranches égales
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Type d'échéancier</Label>
                  <Select 
                    value={editForm.echeancier_type} 
                    onValueChange={(value) => setEditForm({ ...editForm, echeancier_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard (30-40-30)</SelectItem>
                      <SelectItem value="tranches">Tranches égales</SelectItem>
                      <SelectItem value="personnalise">Personnalisé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {editForm.echeancier_type === 'tranches' && (
                  <div>
                    <Label>Nombre de tranches</Label>
                    <Select 
                      value={editForm.nombre_echeances.toString()} 
                      onValueChange={(value) => setEditForm({ ...editForm, nombre_echeances: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">2 tranches</SelectItem>
                        <SelectItem value="3">3 tranches</SelectItem>
                        <SelectItem value="4">4 tranches</SelectItem>
                        <SelectItem value="5">5 tranches</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Liste des échéances */}
              {editForm.echeances.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="font-medium">Échéances</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addEcheance}
                    >
                      Ajouter une échéance
                    </Button>
                  </div>
                  
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {editForm.echeances.map((echeance, index) => (
                      <div key={index} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Échéance {echeance.numero}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeEcheance(index)}
                            className="text-red-500"
                          >
                            <X size={14} />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label>Type</Label>
                            <Select 
                              value={echeance.type} 
                              onValueChange={(value) => updateEcheance(index, 'type', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="acompte">Acompte</SelectItem>
                                <SelectItem value="tranche">Tranche</SelectItem>
                                <SelectItem value="solde">Solde</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <Label>Pourcentage (%)</Label>
                            <Input
                              type="number"
                              value={echeance.pourcentage}
                              onChange={(e) => updateEcheance(index, 'pourcentage', parseFloat(e.target.value) || 0)}
                              min="0"
                              max="100"
                              step="0.01"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <Label>Date d'échéance</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full justify-start text-left font-normal">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {echeance.date_echeance ? format(new Date(echeance.date_echeance), "PPP", { locale: fr }) : "Sélectionner une date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent 
                              className="w-auto p-0" 
                              align="start"
                              side="bottom"
                              sideOffset={4}
                            >
                              <Calendar
                                mode="single"
                                selected={echeance.date_echeance ? new Date(echeance.date_echeance) : undefined}
                                onSelect={(date) => updateEcheance(index, 'date_echeance', date ? date.toISOString().split('T')[0] : '')}
                                initialFocus
                                locale={fr}
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        
                        <div>
                          <Label>Commentaire</Label>
                          <Input
                            value={echeance.commentaire}
                            onChange={(e) => updateEcheance(index, 'commentaire', e.target.value)}
                            placeholder="Commentaire optionnel..."
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Résumé des pourcentages */}
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Total des pourcentages :</span>
                      <span className={`font-bold ${editForm.echeances.reduce((sum, e) => sum + e.pourcentage, 0) === 100 ? 'text-green-600' : 'text-red-600'}`}>
                        {editForm.echeances.reduce((sum, e) => sum + e.pourcentage, 0).toFixed(2)}%
                      </span>
                    </div>
                    {editForm.echeances.reduce((sum, e) => sum + e.pourcentage, 0) !== 100 && (
                      <p className="text-sm text-red-600 mt-1">
                        Le total doit être égal à 100%
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleUpdateContrat}
              disabled={updateContratMutation.isPending}
            >
              {updateContratMutation.isPending ? 'Mise à jour...' : 'Mettre à jour'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de suppression */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le contrat</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600">
              Êtes-vous sûr de vouloir supprimer ce contrat ? Cette action est irréversible.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-medium">{contrat.numero}</p>
              <p className="text-gray-600">{contrat.client.nom_complet}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteContrat}
              disabled={deleteContratMutation.isPending}
            >
              {deleteContratMutation.isPending ? 'Suppression...' : 'Supprimer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal d'annulation */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Annuler le contrat</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600">
              Êtes-vous sûr de vouloir annuler ce contrat ? Cette action est irréversible.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-medium">{contrat.numero}</p>
              <p className="text-gray-600">{contrat.client.nom_complet}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmAnnuler}
              disabled={annulerContratMutation.isPending}
            >
              {annulerContratMutation.isPending ? 'Annulation...' : 'Annuler le contrat'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de génération d'échéancier */}
      <Dialog open={echeancierDialogOpen} onOpenChange={setEcheancierDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Générer l'échéancier</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 overflow-y-auto max-h-[calc(90vh-140px)] pr-2">
            {selectedEcheancierType && getEcheancierDetails(selectedEcheancierType) && (
              <>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">
                    {getEcheancierDetails(selectedEcheancierType)?.title}
                  </h3>
                  <p className="text-blue-700 text-sm">
                    {getEcheancierDetails(selectedEcheancierType)?.description}
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Répartition des échéances :</h4>
                  <div className="space-y-3">
                    {getEcheancierDetails(selectedEcheancierType)?.echeances.map((echeance, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold text-sm">
                            {echeance.numero}
                          </div>
                          <div>
                            <div className="font-medium">{getTypeEcheanceLabel(echeance.type)}</div>
                            <div className="text-sm text-gray-600">{echeance.description}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-blue-600">{echeance.pourcentage}%</div>
                          <div className="text-sm text-gray-500">
                            {formatMontant((contrat.montant_ttc * echeance.pourcentage) / 100)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-green-900">Total</h4>
                      <p className="text-green-700 text-sm">100% du montant TTC</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-green-600">
                        {formatMontant(contrat.montant_ttc)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-900 mb-2">⚠️ Important</h4>
                  <ul className="text-yellow-800 text-sm space-y-1">
                    <li>• Les dates d'échéance seront calculées automatiquement</li>
                    <li>• L'acompte sera exigible à la signature du contrat</li>
                    <li>• Le solde sera exigible à la réception des travaux</li>
                    <li>• Les échéances peuvent être modifiées après génération</li>
                  </ul>
                </div>
              </>
            )}

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-medium">Contrat {contrat.numero}</p>
              <p className="text-gray-600">Client: {contrat.client.nom_complet}</p>
              <p className="text-gray-600">Montant TTC: {formatMontant(contrat.montant_ttc)}</p>
            </div>
          </div>
          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setEcheancierDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleConfirmGenererEcheancier}
              disabled={isLoadingEcheances}
            >
              {isLoadingEcheances ? 'Génération...' : 'Générer l\'échéancier'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Éditeur de contrat */}
      {showContractEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-7xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold">Éditeur de contrat - {contrat.numero}</h2>
              <Button variant="outline" onClick={() => setShowContractEditor(false)}>
                Fermer
              </Button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <ContractEditor
                contrat={contrat}
                devis={contrat.devis}
                onSave={handleSaveContractContent}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 