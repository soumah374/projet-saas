import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, Search, Eye, Edit, Trash2, Play, Check, X, Pause, MoreHorizontal, Archive } from 'lucide-react';
import { 
  useContrats,
  useCreateContratFromDevis,
  useUpdateContrat,
  useDeleteContrat,
  useActiverContrat,
  useCloturerContrat,
  useAnnulerContrat,
  useSuspendreContrat,
  useArchiverContrat,
  type Contrat
} from '@/hooks/use-contrats';
import { formatDate, formatMontant } from '@/lib/formatters';
import { EditContratModal } from '@/components/contrats/EditContratModal';
import { CreateContratModal } from '@/components/contrats/CreateContratModal';
import { statutContrat } from '@/lib/utils';
import { usePermissions } from '@/hooks/use-permissions';
export function ContratsPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pageSize, setPageSize] = useState(20);
  const { hasPermission } = usePermissions();
  // États pour les modals
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contratToEdit, setContratToEdit] = useState<Contrat | null>(null);
  const [contratToDelete, setContratToDelete] = useState<Contrat | null>(null);

  // Hooks
  const { data: contratsData, isLoading } = useContrats({
    search: searchTerm,
    statut: statusFilter === 'all' ? undefined : statusFilter,
    page: 1,
    page_size: pageSize,
  });
  
  const createContratMutation = useCreateContratFromDevis();
  const updateContratMutation = useUpdateContrat();
  const deleteContratMutation = useDeleteContrat();
  const activerContratMutation = useActiverContrat();
  const cloturerContratMutation = useCloturerContrat();
  const archiverContratMutation = useArchiverContrat();
  const annulerContratMutation = useAnnulerContrat();
  const suspendreContratMutation = useSuspendreContrat();

  const contrats = contratsData?.results || [];

  // Gestionnaires d'événements
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
      console.log(err);
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
      console.log(err);
    }
  };

  const handleActionContrat = async (contrat: Contrat, action: string) => {
    try {
      switch (action) {
        case 'activer':
          await activerContratMutation.mutateAsync(contrat.id);
          break;
        case 'cloturer':
          await cloturerContratMutation.mutateAsync(contrat.id);
          break;
        case 'archiver':
          await archiverContratMutation.mutateAsync(contrat.id);
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
      console.log(err);
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

  const getStatutBadge = (statut: string) => {
    const variants = {
      brouillon: 'secondary',
      actif: 'default',
      termine: 'default',
      annule: 'destructive',
      suspendu: 'destructive',
    } as const;
    
    return <Badge variant={variants[statut as keyof typeof variants]}>{statutContrat(statut)}</Badge>;
  };

  // const getActionButtons = (contrat: Contrat) => {
  //   const buttons = [];
    
  //   if (contrat.statut === 'brouillon') {
  //     buttons.push(
  //       <Button
  //         key="activer"
  //         size="sm"
  //         onClick={() => handleActionContrat(contrat, 'activer')}
  //         disabled={activerContratMutation.isPending}
  //       >
  //         <Play size={14} className="mr-1" />
  //         Activer
  //       </Button>
  //     );
  //   }
    
  //   if (contrat.statut === 'actif') {
  //     buttons.push(
  //       <Button
  //         key="cloturer"
  //         size="sm"
  //         variant="outline"
  //         onClick={() => handleActionContrat(contrat, 'cloturer')}
  //         disabled={cloturerContratMutation.isPending}
  //       >
  //         <Check size={14} className="mr-1" />
  //         Clôturer
  //       </Button>,
  //       <Button
  //         key="suspendre"
  //         size="sm"
  //         variant="outline"
  //         onClick={() => handleActionContrat(contrat, 'suspendre')}
  //         disabled={suspendreContratMutation.isPending}
  //       >
  //         <Pause size={14} className="mr-1" />
  //         Suspendre
  //       </Button>
  //     );
  //   }
    
  //   if (contrat.statut === 'suspendu') {
  //     buttons.push(
  //       <Button
  //         key="activer"
  //         size="sm"
  //         onClick={() => handleActionContrat(contrat, 'activer')}
  //         disabled={activerContratMutation.isPending}
  //       >
  //         <Play size={14} className="mr-1" />
  //         Réactiver
  //       </Button>
  //     );
  //   }
    
  //   if (['brouillon', 'actif', 'suspendu'].includes(contrat.statut)) {
  //     buttons.push(
  //       <Button
  //         key="annuler"
  //         size="sm"
  //         variant="destructive"
  //         onClick={() => handleActionContrat(contrat, 'annuler')}
  //         disabled={annulerContratMutation.isPending}
  //       >
  //         <X size={14} className="mr-1" />
  //         Annuler
  //       </Button>
  //     );
  //   }
    
  //   return buttons;
  // };

  const getAvailableActions = (contrat: Contrat) => {
    const actions = [];
    
    // Actions de base toujours disponibles
    if (hasPermission('contrats.view_contrat')) {
    actions.push({
      label: 'Voir les détails',
      icon: <Eye size={14} />,
      onClick: () => navigate(`/contrats/${contrat.id}`),
      disabled: false
    });
   }
   if (hasPermission('contrats.edit_contrat')) {
    actions.push({
      label: 'Modifier',
      icon: <Edit size={14} />,
      onClick: () => openEditDialog(contrat),
      disabled: false
    });
   }    
    if (contrat.statut === 'cloture' || contrat.statut === 'signe') {
      if (hasPermission('contrats.archiver_contrat')) {
        actions.push({
          label: 'Archiver',
          icon: <Archive size={14} />,
          onClick: () => handleActionContrat(contrat, 'archiver'),
          disabled: archiverContratMutation.isPending
        }); 
      }
    }
    
    if (contrat.statut === 'suspendu') {
      if (hasPermission('contrats.activer_contrat')) {
        actions.push({
          label: 'Réactiver',
          icon: <Play size={14} />,
          onClick: () => handleActionContrat(contrat, 'activer'),
          disabled: activerContratMutation.isPending
        });
      }
    }
    
    // Actions destructives
    if (['brouillon', 'actif', 'suspendu'].includes(contrat.statut)) {
      if (hasPermission('contrats.annuler_contrat')) {
        actions.push({
          label: 'Annuler',
          icon: <X size={14} />,
          onClick: () => handleActionContrat(contrat, 'annuler'),
          disabled: annulerContratMutation.isPending,
          destructive: true
        });
      }
    }
    
    if (contrat.statut === 'brouillon') {
      if (hasPermission('contrats.delete_contrat')) {
        actions.push({
          label: 'Supprimer',
          icon: <Trash2 size={14} />,
          onClick: () => openDeleteDialog(contrat),
          disabled: deleteContratMutation.isPending,
          destructive: true
        });
      }
    }
    
    return actions;
  };

  const handleCreateContrat = async (data: {
    client_id: number;
    devis_ids: number[];
    devis_principal_id: number;
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
    try {
      await createContratMutation.mutateAsync({
        devis_ids: data.devis_ids,
        devis_principal_id: data.devis_principal_id,
        date_debut: data.date_debut,
        date_fin: data.date_fin,
        conditions: data.conditions,
        notes: data.notes,
        echeances: data.echeances
      });
      
      setCreateDialogOpen(false);
    } catch (err) {
      // Error handled by hook
      console.log(err);
    }
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
                    <TableCell>
                      {contrat.devis.length > 0 ? (
                        <div className="space-y-1">
                          {contrat.devis.length === 1 ? (
                            <span>{contrat.devis[0].numero}</span>
                          ) : (
                            <div>
                              <span className="font-medium">{contrat.devis.length} devis</span>
                              <div className="text-xs text-gray-500">
                                {contrat.devis.map(d => d.numero).join(', ')}
                              </div>
                              {contrat.devis_principal && (
                                <div className="text-xs text-blue-600">
                                  Principal: {contrat.devis_principal.numero}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </TableCell>
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

      {/* Modal de création */}
      <CreateContratModal
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSave={handleCreateContrat}
        isLoading={createContratMutation.isPending}
      />
    </div>
  );
} 