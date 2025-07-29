import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { CalendarIcon, Plus, Search, Eye, Edit, Trash2, Play, Check, X, Pause, ChevronsUpDown, MoreHorizontal } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import { 
  useContrats,
  useCreateContratFromDevis,
  useUpdateContrat,
  useDeleteContrat,
  useActiverContrat,
  useTerminerContrat,
  useAnnulerContrat,
  useSuspendreContrat,
  useDevisDisponibles,
  type Contrat
} from '@/hooks/use-contrats';
import { formatDate, formatMontant } from '@/lib/formatters';
import { Echeance } from '@/lib/types';
import { EditContratModal } from '@/components/EditContratModal';

export function ContratsPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  
  // États pour les modals
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contratToEdit, setContratToEdit] = useState<Contrat | null>(null);
  const [contratToDelete, setContratToDelete] = useState<Contrat | null>(null);
  
  // États pour le formulaire de création
  const [createForm, setCreateForm] = useState({
    devis_id: '',
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
  
  // Dates pour les calendriers
  const [dateDebut, setDateDebut] = useState<Date | undefined>(undefined);
  const [dateFin, setDateFin] = useState<Date | undefined>(undefined);

  // États pour l'autocomplete des devis
  const [devisSearchOpen, setDevisSearchOpen] = useState(false);
  const [devisSearchValue, setDevisSearchValue] = useState('');

  // Hooks
  const { data: contratsData, isLoading } = useContrats({
    search: searchTerm,
    statut: statusFilter === 'all' ? undefined : statusFilter,
    page: currentPage,
    page_size: pageSize,
  });
  
  const { data: devisDisponiblesData, isLoading: isLoadingDevis } = useDevisDisponibles();
  const createContratMutation = useCreateContratFromDevis();
  const updateContratMutation = useUpdateContrat();
  const deleteContratMutation = useDeleteContrat();
  const activerContratMutation = useActiverContrat();
  const terminerContratMutation = useTerminerContrat();
  const annulerContratMutation = useAnnulerContrat();
  const suspendreContratMutation = useSuspendreContrat();

  const contrats = contratsData?.results || [];
  const totalCount = contratsData?.count || 0;
  const devisDisponibles = devisDisponiblesData || [];

  // Fonction pour obtenir le devis sélectionné
  const getSelectedDevis = () => {
    if (!createForm.devis_id) return null;
    return devisDisponibles.find(devis => devis.id.toString() === createForm.devis_id);
  };

  const selectedDevis = getSelectedDevis();

  // Gestionnaires d'événements
  const handleCreateContrat = async () => {
    if (!createForm.devis_id || !createForm.date_debut || !createForm.date_fin) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    // Validation des échéances
    if (createForm.echeances.length > 0) {
      const totalPourcentage = createForm.echeances.reduce((sum, e) => sum + e.pourcentage, 0);
      if (totalPourcentage !== 100) {
        toast.error('Le total des pourcentages des échéances doit être égal à 100%');
        return;
      }
    }

    try {
      await createContratMutation.mutateAsync({
        devis_id: parseInt(createForm.devis_id),
        date_debut: createForm.date_debut,
        date_fin: createForm.date_fin,
        conditions: createForm.conditions,
        notes: createForm.notes,
        echeances: createForm.echeances
      });
      
      setCreateDialogOpen(false);
      resetCreateForm();
    } catch (err) {
      // Error handled by hook
    }
  };

  const handleUpdateContrat = async (data: {
    date_debut: string;
    date_fin: string;
    conditions: string;
    notes: string;
    echeances: Array<{
      numero: number;
      type: 'acompte' | 'tranche' | 'solde';
      pourcentage: number;
      date_echeance: string;
      commentaire: string;
    }>;
  }) => {
    if (!contratToEdit) return;

    try {
      await updateContratMutation.mutateAsync({
        id: contratToEdit.id,
        data: {
          date_debut: data.date_debut,
          date_fin: data.date_fin,
          conditions: data.conditions,
          notes: data.notes,
          echeances: data.echeances
        }
      });
      
      setEditDialogOpen(false);
      setContratToEdit(null);
    } catch (err) {
      // Error handled by hook
    }
  };

  const handleDeleteContrat = async () => {
    if (!contratToDelete) return;

    try {
      await deleteContratMutation.mutateAsync(contratToDelete.id);
      setDeleteDialogOpen(false);
      setContratToDelete(null);
    } catch (err) {
      // Error handled by hook
    }
  };

  const handleActionContrat = async (contrat: Contrat, action: string) => {
    try {
      switch (action) {
        case 'activer':
          await activerContratMutation.mutateAsync(contrat.id);
          break;
        case 'terminer':
          await terminerContratMutation.mutateAsync(contrat.id);
          break;
        case 'annuler':
          await annulerContratMutation.mutateAsync(contrat.id);
          break;
        case 'suspendre':
          await suspendreContratMutation.mutateAsync(contrat.id);
          break;
      }
    } catch (err) {
      // Error handled by hook
    }
  };

  const openEditDialog = (contrat: Contrat) => {
    setContratToEdit(contrat);
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (contrat: Contrat) => {
    setContratToDelete(contrat);
    setDeleteDialogOpen(true);
  };

  const resetCreateForm = () => {
    setCreateForm({
      devis_id: '',
      date_debut: '',
      date_fin: '',
      conditions: '',
      notes: '',
      echeancier_type: 'standard',
      nombre_echeances: 3,
      echeances: []
    });
    setDateDebut(undefined);
    setDateFin(undefined);
  };

  // Fonctions pour générer automatiquement les échéances
  const generateStandardEcheances = () => {
    const echeances = [
      {
        numero: 1,
        type: 'acompte' as const,
        pourcentage: 30,
        date_echeance: createForm.date_debut,
        commentaire: 'Acompte à la commande'
      },
      {
        numero: 2,
        type: 'tranche' as const,
        pourcentage: 40,
        date_echeance: createForm.date_fin,
        commentaire: 'Paiement à la livraison'
      },
      {
        numero: 3,
        type: 'solde' as const,
        pourcentage: 30,
        date_echeance: createForm.date_fin,
        commentaire: 'Solde après réception'
      }
    ];
    setCreateForm({ ...createForm, echeances });
  };

  const generateTranchesEcheances = () => {
    const echeances = [];
    const pourcentageParTranche = 100 / createForm.nombre_echeances;
    
    for (let i = 1; i <= createForm.nombre_echeances; i++) {
      echeances.push({
        numero: i,
        type: i === 1 ? 'acompte' as const : 'tranche' as const,
        pourcentage: pourcentageParTranche,
        date_echeance: createForm.date_debut,
        commentaire: `Tranche ${i}`
      });
    }
    setCreateForm({ ...createForm, echeances });
  };

  const updateEcheance = (index: number, field: string, value: any) => {
    const newEcheances = [...createForm.echeances];
    newEcheances[index] = { ...newEcheances[index], [field]: value };
    setCreateForm({ ...createForm, echeances: newEcheances });
  };

  const addEcheance = () => {
    const newEcheance = {
      numero: createForm.echeances.length + 1,
      type: 'tranche' as const,
      pourcentage: 0,
      date_echeance: createForm.date_debut,
      commentaire: ''
    };
    setCreateForm({ 
      ...createForm, 
      echeances: [...createForm.echeances, newEcheance] 
    });
  };

  const removeEcheance = (index: number) => {
    const newEcheances = createForm.echeances.filter((_, i) => i !== index);
    // Recalculer les numéros
    newEcheances.forEach((echeance, i) => {
      echeance.numero = i + 1;
    });
    setCreateForm({ ...createForm, echeances: newEcheances });
  };

  // Effets pour générer automatiquement les échéances
  useEffect(() => {
    if (createForm.echeancier_type === 'standard' && createForm.date_debut && createForm.date_fin) {
      generateStandardEcheances();
    }
  }, [createForm.echeancier_type, createForm.date_debut, createForm.date_fin]);

  useEffect(() => {
    if (createForm.echeancier_type === 'tranches' && createForm.date_debut && createForm.date_fin) {
      generateTranchesEcheances();
    }
  }, [createForm.echeancier_type, createForm.nombre_echeances, createForm.date_debut, createForm.date_fin]);

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

  const getActionButtons = (contrat: Contrat) => {
    const buttons = [];
    
    if (contrat.statut === 'brouillon') {
      buttons.push(
        <Button
          key="activer"
          size="sm"
          onClick={() => handleActionContrat(contrat, 'activer')}
          disabled={activerContratMutation.isPending}
        >
          <Play size={14} className="mr-1" />
          Activer
        </Button>
      );
    }
    
    if (contrat.statut === 'actif') {
      buttons.push(
        <Button
          key="terminer"
          size="sm"
          variant="outline"
          onClick={() => handleActionContrat(contrat, 'terminer')}
          disabled={terminerContratMutation.isPending}
        >
          <Check size={14} className="mr-1" />
          Terminer
        </Button>,
        <Button
          key="suspendre"
          size="sm"
          variant="outline"
          onClick={() => handleActionContrat(contrat, 'suspendre')}
          disabled={suspendreContratMutation.isPending}
        >
          <Pause size={14} className="mr-1" />
          Suspendre
        </Button>
      );
    }
    
    if (contrat.statut === 'suspendu') {
      buttons.push(
        <Button
          key="activer"
          size="sm"
          onClick={() => handleActionContrat(contrat, 'activer')}
          disabled={activerContratMutation.isPending}
        >
          <Play size={14} className="mr-1" />
          Réactiver
        </Button>
      );
    }
    
    if (['brouillon', 'actif', 'suspendu'].includes(contrat.statut)) {
      buttons.push(
        <Button
          key="annuler"
          size="sm"
          variant="destructive"
          onClick={() => handleActionContrat(contrat, 'annuler')}
          disabled={annulerContratMutation.isPending}
        >
          <X size={14} className="mr-1" />
          Annuler
        </Button>
      );
    }
    
    return buttons;
  };

  const getAvailableActions = (contrat: Contrat) => {
    const actions = [];
    
    // Actions de base toujours disponibles
    actions.push({
      label: 'Voir les détails',
      icon: <Eye size={14} />,
      onClick: () => navigate(`/contrats/${contrat.id}`),
      disabled: false
    });
    
    actions.push({
      label: 'Modifier',
      icon: <Edit size={14} />,
      onClick: () => openEditDialog(contrat),
      disabled: false
    });
    
    // Actions selon le statut
    if (contrat.statut === 'brouillon') {
      actions.push({
        label: 'Activer',
        icon: <Play size={14} />,
        onClick: () => handleActionContrat(contrat, 'activer'),
        disabled: activerContratMutation.isPending
      });
    }
    
    if (contrat.statut === 'actif') {
      actions.push(
        {
          label: 'Terminer',
          icon: <Check size={14} />,
          onClick: () => handleActionContrat(contrat, 'terminer'),
          disabled: terminerContratMutation.isPending
        },
        {
          label: 'Suspendre',
          icon: <Pause size={14} />,
          onClick: () => handleActionContrat(contrat, 'suspendre'),
          disabled: suspendreContratMutation.isPending
        }
      );
    }
    
    if (contrat.statut === 'suspendu') {
      actions.push({
        label: 'Réactiver',
        icon: <Play size={14} />,
        onClick: () => handleActionContrat(contrat, 'activer'),
        disabled: activerContratMutation.isPending
      });
    }
    
    // Actions destructives
    if (['brouillon', 'actif', 'suspendu'].includes(contrat.statut)) {
      actions.push({
        label: 'Annuler',
        icon: <X size={14} />,
        onClick: () => handleActionContrat(contrat, 'annuler'),
        disabled: annulerContratMutation.isPending,
        destructive: true
      });
    }
    
    if (contrat.statut === 'brouillon') {
      actions.push({
        label: 'Supprimer',
        icon: <Trash2 size={14} />,
        onClick: () => openDeleteDialog(contrat),
        disabled: deleteContratMutation.isPending,
        destructive: true
      });
    }
    
    return actions;
  };

  return (
    <div className="max-w-8xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contrats</h1>
          <p className="text-gray-600">Gestion des contrats basés sur les devis acceptés</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus size={16} className="mr-2" />
          Nouveau contrat
        </Button>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Rechercher</Label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-3 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Numéro, client..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status">Statut</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="brouillon">Brouillon</SelectItem>
                  <SelectItem value="actif">Actif</SelectItem>
                  <SelectItem value="termine">Terminé</SelectItem>
                  <SelectItem value="annule">Annulé</SelectItem>
                  <SelectItem value="suspendu">Suspendu</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="pageSize">Éléments par page</Label>
              <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des contrats */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des contrats</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : contrats.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Aucun contrat trouvé</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numéro</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Devis</TableHead>
                  <TableHead>Date début</TableHead>
                  <TableHead>Date fin</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Montant HT</TableHead>
                  <TableHead>TVA</TableHead>
                  <TableHead>Frais Agence</TableHead>
                  <TableHead>Montant TTC</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contrats.map((contrat) => (
                  <TableRow key={contrat.id}>
                    <TableCell className="font-medium">
                      <Button
                        variant="link"
                        className="p-0 h-auto"
                        onClick={() => navigate(`/contrats/${contrat.id}`)}
                      >
                        {contrat.numero}
                      </Button>
                    </TableCell>
                    <TableCell>{contrat.client.nom_complet}</TableCell>
                    <TableCell>{contrat.devis.numero}</TableCell>
                    <TableCell>{formatDate(contrat.date_debut)}</TableCell>
                    <TableCell>{formatDate(contrat.date_fin)}</TableCell>
                    <TableCell>{getStatutBadge(contrat.statut)}</TableCell>
                    <TableCell className="font-medium">{formatMontant(contrat.montant_ht)}</TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {contrat.appliquer_tva ? `${contrat.taux_tva}%` : '—'}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {contrat.appliquer_frais_agence ? `${contrat.taux_frais_agence}%` : '—'}
                    </TableCell>
                    <TableCell className="font-medium">{formatMontant(contrat.montant_ttc)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Ouvrir menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          {getAvailableActions(contrat).map((action, index) => {
                            // Ajouter un séparateur avant les actions destructives
                            const isDestructive = action.destructive;
                            const previousAction = getAvailableActions(contrat)[index - 1];
                            const shouldAddSeparator = isDestructive && previousAction && !previousAction.destructive;
                            
                            return (
                              <div key={index}>
                                {shouldAddSeparator && <DropdownMenuSeparator />}
                                <DropdownMenuItem
                                  onClick={action.onClick}
                                  disabled={action.disabled}
                                  className={`flex items-center gap-2 ${
                                    action.destructive ? 'text-red-600 focus:text-red-600' : ''
                                  }`}
                                >
                                  {action.icon}
                                  {action.label}
                                </DropdownMenuItem>
                              </div>
                            );
                          })}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal de création */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Créer un contrat</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[calc(90vh-140px)] pr-2 space-y-4">
            <div>
              <Label htmlFor="devis">Devis *</Label>
              <Popover open={devisSearchOpen} onOpenChange={setDevisSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={devisSearchOpen}
                    className="w-full justify-between"
                  >
                    {selectedDevis ? (
                      `${selectedDevis.numero} - ${selectedDevis.client?.nom_complet || 'Client inconnu'} (${formatMontant(selectedDevis.montant_ttc || 0)})`
                    ) : (
                      "Sélectionner un devis accepté..."
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput 
                      placeholder="Rechercher un devis..." 
                      value={devisSearchValue}
                      onValueChange={setDevisSearchValue}
                    />
                    <CommandList>
                      {isLoadingDevis ? (
                        <div className="p-4 text-center text-gray-500">
                          Chargement des devis...
                        </div>
                      ) : devisDisponibles.length === 0 ? (
                        <CommandEmpty>Aucun devis disponible.</CommandEmpty>
                      ) : (
                        <>
                          <CommandEmpty>Aucun devis trouvé.</CommandEmpty>
                          <CommandGroup>
                            {devisDisponibles
                              .filter(devis => 
                                devis.id && 
                                devis.numero && 
                                (devisSearchValue === '' || 
                                 devis.numero.toLowerCase().includes(devisSearchValue.toLowerCase()) ||
                                 devis.client?.nom_complet?.toLowerCase().includes(devisSearchValue.toLowerCase()))
                              )
                              .map((devis) => (
                                <CommandItem
                                  key={devis.id}
                                  value={devis.id.toString()}
                                  onSelect={(value) => {
                                    setCreateForm({ ...createForm, devis_id: value });
                                    setDevisSearchOpen(false);
                                    setDevisSearchValue('');
                                  }}
                                >
                                  <div className="flex flex-col">
                                    <span className="font-medium">
                                      {devis.numero} - {devis.client?.nom_complet || 'Client inconnu'}
                                    </span>
                                    <span className="text-sm text-gray-500">
                                      {formatMontant(devis.montant_ttc || 0)} • {formatDate(devis.date_creation)}
                                    </span>
                                  </div>
                                </CommandItem>
                              ))}
                          </CommandGroup>
                        </>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date de début *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateDebut ? format(dateDebut, "PPP", { locale: fr }) : "Sélectionner une date"}
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
                      selected={dateDebut}
                      onSelect={(date) => {
                        setDateDebut(date);
                        setCreateForm({ ...createForm, date_debut: date ? date.toISOString().split('T')[0] : '' });
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
                      {dateFin ? format(dateFin, "PPP", { locale: fr }) : "Sélectionner une date"}
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
                      selected={dateFin}
                      onSelect={(date) => {
                        setDateFin(date);
                        setCreateForm({ ...createForm, date_fin: date ? date.toISOString().split('T')[0] : '' });
                      }}
                      initialFocus
                      locale={fr}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div>
              <Label htmlFor="conditions">Conditions</Label>
              <textarea
                id="conditions"
                value={createForm.conditions}
                onChange={(e) => setCreateForm({ ...createForm, conditions: e.target.value })}
                className="w-full min-h-[100px] p-3 border border-gray-300 rounded-md"
                placeholder="Conditions du contrat..."
              />
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                value={createForm.notes}
                onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                className="w-full min-h-[100px] p-3 border border-gray-300 rounded-md"
                placeholder="Notes du contrat..."
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
                    value={createForm.echeancier_type} 
                    onValueChange={(value) => setCreateForm({ ...createForm, echeancier_type: value })}
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
                {createForm.echeancier_type === 'tranches' && (
                  <div>
                    <Label>Nombre de tranches</Label>
                    <Select 
                      value={createForm.nombre_echeances.toString()} 
                      onValueChange={(value) => setCreateForm({ ...createForm, nombre_echeances: parseInt(value) })}
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
              {createForm.echeances.length > 0 && (
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
                    {createForm.echeances.map((echeance, index) => (
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
                      <span className={`font-bold ${createForm.echeances.reduce((sum, e) => sum + e.pourcentage, 0) === 100 ? 'text-green-600' : 'text-red-600'}`}>
                        {createForm.echeances.reduce((sum, e) => sum + e.pourcentage, 0).toFixed(2)}%
                      </span>
                    </div>
                    {createForm.echeances.reduce((sum, e) => sum + e.pourcentage, 0) !== 100 && (
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
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleCreateContrat}
              disabled={createContratMutation.isPending}
            >
              {createContratMutation.isPending ? 'Création...' : 'Créer le contrat'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal d'édition */}
      <EditContratModal
        contrat={contratToEdit}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={handleUpdateContrat}
        isLoading={updateContratMutation.isPending}
      />

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
            {contratToDelete && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-medium">{contratToDelete.numero}</p>
                <p className="text-gray-600">{contratToDelete.client.nom_complet}</p>
              </div>
            )}
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
    </div>
  );
} 