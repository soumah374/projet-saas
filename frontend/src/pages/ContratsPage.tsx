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
import { CalendarIcon, Plus, Search, Filter, Eye, Edit, Trash2, Play, Check, X, Pause } from 'lucide-react';
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
import { ContratsModals } from '@/components/contrats/ContratsModals';

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
    notes: ''
  });
  
  // États pour le formulaire d'édition
  const [editForm, setEditForm] = useState({
    date_debut: '',
    date_fin: '',
    conditions: '',
    notes: ''
  });
  
  // Dates pour les calendriers
  const [dateDebut, setDateDebut] = useState<Date | undefined>(undefined);
  const [dateFin, setDateFin] = useState<Date | undefined>(undefined);
  const [editDateDebut, setEditDateDebut] = useState<Date | undefined>(undefined);
  const [editDateFin, setEditDateFin] = useState<Date | undefined>(undefined);

  // Hooks
  const { data: contratsData, isLoading } = useContrats({
    search: searchTerm,
    statut: statusFilter === 'all' ? undefined : statusFilter,
    page: currentPage,
    page_size: pageSize,
  });
  
  const { data: devisDisponiblesData } = useDevisDisponibles();
  const createContratMutation = useCreateContratFromDevis();
  const updateContratMutation = useUpdateContrat();
  const deleteContratMutation = useDeleteContrat();
  const activerContratMutation = useActiverContrat();
  const terminerContratMutation = useTerminerContrat();
  const annulerContratMutation = useAnnulerContrat();
  const suspendreContratMutation = useSuspendreContrat();

  const contrats = contratsData?.results || [];
  const totalCount = contratsData?.count || 0;
  const devisDisponibles = devisDisponiblesData?.devis || [];

  // Gestionnaires d'événements
  const handleCreateContrat = async () => {
    if (!createForm.devis_id || !createForm.date_debut || !createForm.date_fin) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      await createContratMutation.mutateAsync({
        devis_id: parseInt(createForm.devis_id),
        date_debut: createForm.date_debut,
        date_fin: createForm.date_fin,
        conditions: createForm.conditions,
        notes: createForm.notes,
      });
      
      setCreateDialogOpen(false);
      resetCreateForm();
    } catch (err) {
      // Error handled by hook
    }
  };

  const handleUpdateContrat = async () => {
    if (!contratToEdit) return;

    try {
      await updateContratMutation.mutateAsync({
        id: contratToEdit.id,
        data: {
          date_debut: editForm.date_debut,
          date_fin: editForm.date_fin,
          conditions: editForm.conditions,
          notes: editForm.notes,
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
    setEditForm({
      date_debut: contrat.date_debut,
      date_fin: contrat.date_fin,
      conditions: contrat.conditions || '',
      notes: contrat.notes || '',
    });
    setEditDateDebut(new Date(contrat.date_debut));
    setEditDateFin(new Date(contrat.date_fin));
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
      notes: ''
    });
    setDateDebut(undefined);
    setDateFin(undefined);
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
                    <TableCell className="font-medium">{formatMontant(contrat.montant_ttc)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigate(`/contrats/${contrat.id}`)}
                        >
                          <Eye size={14} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditDialog(contrat)}
                        >
                          <Edit size={14} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openDeleteDialog(contrat)}
                        >
                          <Trash2 size={14} />
                        </Button>
                        {getActionButtons(contrat)}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <ContratsModals
        // Modal de création
        createDialogOpen={createDialogOpen}
        setCreateDialogOpen={setCreateDialogOpen}
        createForm={createForm}
        setCreateForm={setCreateForm}
        dateDebut={dateDebut}
        setDateDebut={setDateDebut}
        dateFin={dateFin}
        setDateFin={setDateFin}
        devisDisponibles={devisDisponibles}
        onCreateContrat={handleCreateContrat}
        isCreatePending={createContratMutation.isPending}
        
        // Modal d'édition
        editDialogOpen={editDialogOpen}
        setEditDialogOpen={setEditDialogOpen}
        editForm={editForm}
        setEditForm={setEditForm}
        editDateDebut={editDateDebut}
        setEditDateDebut={setEditDateDebut}
        editDateFin={editDateFin}
        setEditDateFin={setEditDateFin}
        contratToEdit={contratToEdit}
        onUpdateContrat={handleUpdateContrat}
        isUpdatePending={updateContratMutation.isPending}
        
        // Modal de suppression
        deleteDialogOpen={deleteDialogOpen}
        setDeleteDialogOpen={setDeleteDialogOpen}
        contratToDelete={contratToDelete}
        onDeleteContrat={handleDeleteContrat}
        isDeletePending={deleteContratMutation.isPending}
      />
    </div>
  );
} 