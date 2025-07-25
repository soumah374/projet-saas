import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  ArrowLeft, Edit, Trash2, Download, Send, FileText, 
  Calendar as CalendarIcon,
  Play, Pause, Check, X
} from 'lucide-react';
import { 
  useContratById,
  useUpdateContrat,
  useDeleteContrat,
  useActiverContrat,
  useTerminerContrat,
  useAnnulerContrat,
  useSuspendreContrat,
  useCalculerMontantsContrat,
  useEnvoyerContratPDF,
  type Contrat,
  type LigneContrat
} from '@/hooks/use-contrats';
import { ContractEditor } from '@/components/contrats/ContractEditor';
import { generateContratPDFFromTemplate, generateContratPDFfromElement } from '@/lib/pdfUtils';
import { formatDate, formatMontant } from '@/lib/formatters';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export function ContratDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
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
  
  // Dates pour les calendriers
  const [editDateDebut, setEditDateDebut] = useState<Date | undefined>(undefined);
  const [editDateFin, setEditDateFin] = useState<Date | undefined>(undefined);

  // Hooks
  const { data: contrat, isLoading, error } = useContratById(contratId);
  const updateContratMutation = useUpdateContrat();
  const deleteContratMutation = useDeleteContrat();
  const activerContratMutation = useActiverContrat();
  const terminerContratMutation = useTerminerContrat();
  const annulerContratMutation = useAnnulerContrat();
  const suspendreContratMutation = useSuspendreContrat();
  const calculerMontantsMutation = useCalculerMontantsContrat();
  const envoyerContratPDF = useEnvoyerContratPDF();

  // Initialiser le formulaire d'édition
  useEffect(() => {
    if (contrat) {
      setEditForm({
        date_debut: contrat.date_debut,
        date_fin: contrat.date_fin,
        conditions: contrat.conditions || '',
        notes: contrat.notes || '',
      });
      setEditDateDebut(new Date(contrat.date_debut));
      setEditDateFin(new Date(contrat.date_fin));
    }
  }, [contrat]);

  // Gestionnaires d'événements
  const handleUpdateContrat = async () => {
    if (!contrat) return;

    try {
      await updateContratMutation.mutateAsync({
        id: contrat.id,
        data: {
          date_debut: editForm.date_debut,
          date_fin: editForm.date_fin,
          conditions: editForm.conditions,
          notes: editForm.notes,
        }
      });
      
      setEditDialogOpen(false);
    } catch (err) {
      // Error handled by hook
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
        case 'calculer':
          await calculerMontantsMutation.mutateAsync(contrat.id);
          break;
      }
    } catch (err) {
      // Error handled by hook
    }
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

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Chargement...</div>;
  }

  if (error || !contrat) {
    return <div className="flex items-center justify-center h-64">Erreur lors du chargement du contrat</div>;
  }

  const handleAction = async (action: string) => {
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
        case 'delete':
          if (window.confirm('Êtes-vous sûr de vouloir supprimer ce contrat ?')) {
            await deleteContratMutation.mutateAsync(contrat.id);
            navigate('/contrats');
          }
          break;
      }
    } catch (error) {
      console.error(`Erreur lors de l'action ${action}:`, error);
    }
  };

  const handleGeneratePDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const pdfData = generateContratPDFFromTemplate(contrat, { contenu: '' }, {});
      
      if (pdfData) {
        const link = document.createElement('a');
        link.href = `data:application/pdf;base64,${pdfData}`;
        link.download = `contrat_${contrat.numero}.pdf`;
        link.click();
        toast.success('PDF généré avec succès');
      } else {
        toast.error('Erreur lors de la génération du PDF');
      }
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      toast.error('Erreur lors de la génération du PDF');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleSendEmail = async () => {
    setIsSendingEmail(true);
    try {
      const pdfData = generateContratPDFFromTemplate(contrat, { contenu: '' }, {});
      
      if (pdfData) {
        await envoyerContratPDF.mutateAsync({
          id: contrat.id,
          pdfData: pdfData
        });
      } else {
        toast.error('Erreur lors de la génération du PDF');
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi:', error);
      toast.error('Erreur lors de l\'envoi du contrat');
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div className="max-w-8xl mx-auto space-y-8">
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
          <Button onClick={() => setEditDialogOpen(true)} variant="outline">
            <Edit size={16} className="mr-2" />
            Modifier
          </Button>
          <Button 
            onClick={() => handleActionContrat('calculer')} 
            variant="outline"
            disabled={calculerMontantsMutation.isPending}
          >
            <FileText size={16} className="mr-2" />
            Recalculer montants
          </Button>
          <Button
            onClick={handleGeneratePDF}
            disabled={isGeneratingPDF}
            variant="outline"
          >
            {isGeneratingPDF ? (
              <>Génération...</>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Générer PDF
              </>
            )}
          </Button>
          <Button
            onClick={handleSendEmail}
            disabled={isSendingEmail}
            variant="outline"
          >
            {isSendingEmail ? (
              <>Envoi...</>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Envoyer par email
              </>
            )}
          </Button>
          {getActionButtons()}
          <Button 
            onClick={() => setDeleteDialogOpen(true)} 
            variant="destructive"
          >
            <Trash2 size={16} className="mr-2" />
            Supprimer
          </Button>
        </div>
      </div>

      {/* Contenu principal avec onglets */}
      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="details">Détails</TabsTrigger>
          <TabsTrigger value="lignes">Lignes</TabsTrigger>
          <TabsTrigger value="editeur">Éditeur</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="space-y-8">
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
                  <Label className="text-sm font-medium text-gray-600">TVA</Label>
                  <p className="font-medium">
                    {contrat.appliquer_tva ? `${contrat.taux_tva}%` : 'Non appliquée'}
                  </p>
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Label className="text-sm font-medium text-gray-600">Montant HT</Label>
                  <p className="text-2xl font-bold text-gray-900">{formatMontant(contrat.montant_ht)}</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Label className="text-sm font-medium text-gray-600">TVA</Label>
                  <p className="text-2xl font-bold text-gray-900">{formatMontant(contrat.montant_tva)}</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Label className="text-sm font-medium text-gray-600">Montant TTC</Label>
                  <p className="text-2xl font-bold text-blue-900">{formatMontant(contrat.montant_ttc)}</p>
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
        
        <TabsContent value="lignes" className="space-y-8">
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
                      <TableHead>Description</TableHead>
                      <TableHead>Quantité</TableHead>
                      <TableHead>Unité</TableHead>
                      <TableHead>Prix unitaire HT</TableHead>
                      <TableHead>Montant HT</TableHead>
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
                        <TableCell>
                          <div>
                            <p className="font-medium">{ligne.description || ligne.intitule}</p>
                            {ligne.type_ligne === 'prestation' && ligne.activity && (
                              <p className="text-sm text-gray-600">{ligne.activity.intitule}</p>
                            )}
                            {ligne.type_ligne === 'frais' && ligne.ligne_frais && (
                              <p className="text-sm text-gray-600">{ligne.ligne_frais.description}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{ligne.quantite}</TableCell>
                        <TableCell>{ligne.unite.intitule}</TableCell>
                        <TableCell>{formatMontant(ligne.prix_unitaire_ht)}</TableCell>
                        <TableCell className="font-medium">{formatMontant(ligne.montant_ht)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="editeur" className="space-y-8">
          <ContractEditor 
            contrat={contrat}
            onSave={(content, variables) => {
              toast.success('Contrat sauvegardé');
            }}
          />
        </TabsContent>
      </Tabs>

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
                  <PopoverContent 
                    className="w-auto p-0 z-50" 
                    align="start"
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
                  <PopoverContent 
                    className="w-auto p-0 z-50" 
                    align="start"
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
                className="min-h-[100px]"
              />
            </div>
            <div>
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                placeholder="Notes du contrat..."
                className="min-h-[100px]"
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
    </div>
  );
} 