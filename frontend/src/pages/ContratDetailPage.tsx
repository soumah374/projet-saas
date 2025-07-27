import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Play, 
  Check, 
  X, 
  Pause, 
  FileCheck, 
  CalendarIcon,
  Plus,
  Eye,
  Download,
  FileText
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

export function ContratDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const contratId = parseInt(id || '0');
  
  // États pour les modals
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    date_debut: '',
    date_fin: '',
    conditions: '',
    notes: ''
  });
  const [editDateDebut, setEditDateDebut] = useState<Date | undefined>(undefined);
  const [editDateFin, setEditDateFin] = useState<Date | undefined>(undefined);
  const [showContractEditor, setShowContractEditor] = useState(false);

  // Hooks
  const { data: contrat, isLoading, error } = useContratById(contratId);
  const updateContratMutation = useUpdateContrat();
  const deleteContratMutation = useDeleteContrat();
  const activerContratMutation = useActiverContrat();
  const terminerContratMutation = useTerminerContrat();
  const annulerContratMutation = useAnnulerContrat();
  const suspendreContratMutation = useSuspendreContrat();

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

    console.log('Début de la mise à jour du contrat:', contrat.id);
    console.log('Données à envoyer:', {
      date_debut: editForm.date_debut,
      date_fin: editForm.date_fin,
      conditions: editForm.conditions,
      notes: editForm.notes,
    });

    try {
      const result = await updateContratMutation.mutateAsync({
        id: contrat.id,
        data: {
          date_debut: editForm.date_debut,
          date_fin: editForm.date_fin,
          conditions: editForm.conditions || '',
          notes: editForm.notes || '',
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

  const openEditDialog = () => {
    if (!contrat) return;
    
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
    <div className="max-w-7xl mx-auto space-y-6">
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
          <Button onClick={openDeleteDialog} variant="destructive">
            <Trash2 size={16} className="mr-2" />
            Supprimer
          </Button>
          {getActionButtons()}
        </div>
      </div>

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

      {/* Lignes du contrat */}
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
                    <TableCell>{ligne.description || ligne.intitule}</TableCell>
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

      {/* Modal d'édition */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Modifier le contrat</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
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
                  <PopoverContent className="w-auto p-0 z-50" align="start">
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
                  <PopoverContent className="w-auto p-0 z-50" align="start">
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
          </div>
          <DialogFooter>
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
                onGeneratePDF={(contractText) => {
                  // Ici on peut implémenter la génération PDF du contrat personnalisé
                  console.log('Générer PDF du contrat:', contractText);
                  toast.success('PDF du contrat généré');
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 