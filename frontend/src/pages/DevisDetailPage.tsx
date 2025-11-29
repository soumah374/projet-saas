import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, Edit, Download, Send, Check, X, Plus, Trash2, FileCheck } from 'lucide-react';
import { 
  useDevisById,
  useUpdateDevis,
  useEnvoyerDevis,
  useAccepterDevis,
  useRefuserDevis,
  useCreateLigneDevis,
  useDeleteLigneDevis,
  useActivitesParService,
} from '@/hooks/use-devis';
import { useCreateContratFromDevis } from '@/hooks/use-contrats';
import { lignesDevisAPI } from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import { useServices } from '@/hooks/use-services';
import { useUnitesStandards } from '@/hooks/use-unites';
import { formatMontant } from '@/lib/formatters';
import { PDFExport } from '@/components/PDFExport';
import { useFraisCategories } from '@/hooks/use-frais-categories';
import { useLignesFraisByCategory } from '@/hooks/use-lignes-frais';
import { DevisDetailModals } from '@/components/devis/DevisDetailModals';
import type { LigneFrais } from '@/lib/types';
import { useEnvoyerEmailPDF } from '@/hooks/use-devis';
import { usePermissions } from '@/hooks/use-permissions';
interface LigneForm {
  type_ligne: 'prestation' | 'frais' | '';
  type_frais?: 'standard' | 'forfait' | 'offert';
  service_id?: string;
  activity_id?: string;
  frais_category_id?: string;
  ligne_frais_id?: string;
  description: string;
  quantite: string;
  unite_id: string;
  prix_unitaire?: string;
}

export function DevisDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addLigneDialogOpen, setAddLigneDialogOpen] = useState(false);
  const [deleteLigneDialogOpen, setDeleteLigneDialogOpen] = useState(false);
  const [ligneToDelete, setLigneToDelete] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [dateValidite, setDateValidite] = useState<Date | undefined>(undefined);
  const [pdfExportOpen, setPdfExportOpen] = useState(false);
  const [envoyerDialogOpen, setEnvoyerDialogOpen] = useState(false);
  const [accepterDialogOpen, setAccepterDialogOpen] = useState(false);
  const [refuserDialogOpen, setRefuserDialogOpen] = useState(false);
  const [currentLigne, setCurrentLigne] = useState<LigneForm>({
    type_ligne: '',
    type_frais: 'standard',
    service_id: '',
    activity_id: '',
    frais_category_id: '',
    ligne_frais_id: '',
    description: '',
    quantite: '1',
    unite_id: '',
    prix_unitaire: '',
    
  });

  const devisId = parseInt(id || '0');
  
  const { hasPermission } = usePermissions();

  const { data: devis, isLoading, error } = useDevisById(devisId);
  const updateDevisMutation = useUpdateDevis();
  const envoyerDevisMutation = useEnvoyerDevis();
  const accepterDevisMutation = useAccepterDevis();
  const refuserDevisMutation = useRefuserDevis();
  const createLigneMutation = useCreateLigneDevis();
  const deleteLigneMutation = useDeleteLigneDevis();
  const createContratMutation = useCreateContratFromDevis();

  // Hooks pour les données de référence
  const { data: servicesData } = useServices({ page_size: 1000 });
  const { data: unitesData } = useUnitesStandards({ page_size: 1000, is_active: true });
  const { data: activitesData, refetch: refetchActivites, isLoading: isLoadingActivites } = useActivitesParService(
    parseInt(currentLigne.service_id) || 0
  );
  const { data: fraisCategories = [] } = useFraisCategories();
  const { data: lignesFraisRaw } = useLignesFraisByCategory(parseInt(currentLigne.frais_category_id || '0'));
  const lignesFrais: LigneFrais[] = Array.isArray(lignesFraisRaw)
    ? lignesFraisRaw
    : Array.isArray((lignesFraisRaw as any)?.results)
      ? (lignesFraisRaw as any).results
      : [];

  const services = servicesData?.results || [];
  const unites = unitesData?.results || [];
  const activites = activitesData || [];

  useEffect(() => {
    if (devis) {
      setForm({
        date_validite: devis.date_validite,
        taux_tva: devis.taux_tva,
        appliquer_tva: devis.appliquer_tva,
        taux_frais_agence: devis.taux_frais_agence || 15.00,
        appliquer_frais_agence: devis.appliquer_frais_agence || false,
        notes: devis.notes || '',
        conditions: devis.conditions || '',
      });
      setDateValidite(new Date(devis.date_validite));
    }
  }, [devis]);

  // Réinitialiser l'activité quand le service change
  useEffect(() => {
    if (currentLigne.type_ligne === 'prestation' && currentLigne.service_id) {
      setCurrentLigne(prev => ({
        ...prev,
        activity_id: ''
      }));
      refetchActivites();
    }
  }, [currentLigne.type_ligne, currentLigne.service_id, refetchActivites]);

  const handleSave = async () => {
    try {
      await updateDevisMutation.mutateAsync({
        id: devisId,
        data: {
          date_validite: dateValidite ? dateValidite.toISOString().split('T')[0] : form.date_validite,
          taux_tva: form.taux_tva,
          appliquer_tva: form.appliquer_tva,
          taux_frais_agence: form.taux_frais_agence,
          appliquer_frais_agence: form.appliquer_frais_agence,
          notes: form.notes,
          conditions: form.conditions,
        }
      });
      setEditDialogOpen(false);
    } catch (err) {
      // Error handled by hook
    }
  };

  const handleEnvoyer = async () => {
    setEnvoyerDialogOpen(true);
  };

  const handleAccepter = async () => {
    setAccepterDialogOpen(true);
  };

  const envoyerEmailPDFMutation = useEnvoyerEmailPDF();
  const handleConfirmEnvoyer = async () => {
    try {
      // await envoyerDevisMutation.mutateAsync(devisId);
      await envoyerEmailPDFMutation.mutateAsync({
        id: devis.id,
        data: {
          email_destinataire: devis.client.email,
          sujet: `Devis ${devis.numero} - ${devis.client.nom_complet}`,
          message: 'Merci de bien vouloir signer le devis et de nous le retourner.',
        }
      });
      setEnvoyerDialogOpen(false);
    } catch (err) {
      // Error handled by hook
    }
  };

  const handleConfirmAccepter = async () => {
    try {
      // Accepter le devis
      await accepterDevisMutation.mutateAsync(devisId);
      
      // Créer automatiquement un contrat à partir du devis accepté
      const dateDebut = new Date();
      const dateFin = new Date();
      dateFin.setFullYear(dateFin.getFullYear() + 1); // Contrat d'un an par défaut
      
      await createContratMutation.mutateAsync({
        devis_ids: [devisId], // Utiliser un tableau avec l'ID du devis
        date_debut: dateDebut.toISOString().split('T')[0],
        date_fin: dateFin.toISOString().split('T')[0],
        conditions: devis?.conditions || '',
        notes: `Contrat créé automatiquement lors de l'acceptation du devis ${devis?.numero}`,
      });
      
      setAccepterDialogOpen(false);
      toast.success('Devis accepté et contrat créé avec succès !');
    } catch (err) {
      // Error handled by hook
    }
  };

  const handleRefuser = async () => {
    setRefuserDialogOpen(true);
  };

  const handleConfirmRefuser = async () => {
    try {
      await refuserDevisMutation.mutateAsync(devisId);
      setRefuserDialogOpen(false);
    } catch (err) {
      // Error handled by hook
    }
  };

  const handleLigneChange = (field: keyof LigneForm, value: string) => {
    setCurrentLigne({ ...currentLigne, [field]: value });
  };

  const handleAddLigne = async () => {
    if (currentLigne.type_ligne === 'prestation') {
      if (!currentLigne.service_id || !currentLigne.activity_id || !currentLigne.unite_id) {
        toast.error('Veuillez remplir tous les champs obligatoires');
        return;
      }
      if (!currentLigne.prix_unitaire) {
        toast.error('Veuillez renseigner le prix unitaire pour la prestation');
        return;
      }
    } else if (currentLigne.type_ligne === 'frais') {
      if (!currentLigne.frais_category_id || !currentLigne.ligne_frais_id || !currentLigne.unite_id || !currentLigne.prix_unitaire) {
        toast.error('Veuillez remplir tous les champs obligatoires pour la ligne de frais');
        return;
      }
    } else {
      toast.error('Veuillez sélectionner un type de ligne');
      return;
    }

    try {
      // Créer la ligne selon le type
      if (currentLigne.type_ligne === 'prestation') {
        const createdLigne: any = (await lignesDevisAPI.createLigne({
          devis_id: devis.id,
          type_ligne: 'prestation',
          service_id: parseInt(currentLigne.service_id!),
          activity_id: parseInt(currentLigne.activity_id!),
          description: currentLigne.description,
          quantite: parseFloat(currentLigne.quantite),
          unite_id: parseInt(currentLigne.unite_id),
          prix_unitaire_ht: parseFloat(currentLigne.prix_unitaire || '0'),
        })).data;

        // Si des intervenants ont été ajoutés, les créer explicitement liés à la ligne créée
        // (intervenants retirés du formulaire; pas d'actions supplémentaires)

      } else if (currentLigne.type_ligne === 'frais') {
        // Pour les frais, utiliser l'API directe
        // Si le type de frais est 'offert', forcer le prix unitaire à 0
        const prixUnitaireNumeric = currentLigne.type_frais === 'offert' ? 0 : parseFloat(currentLigne.prix_unitaire || '0');

        const createdFrais: any = await lignesDevisAPI.createLigne({
          devis_id: devis.id,
          type_ligne: 'frais',
          frais_category_id: parseInt(currentLigne.frais_category_id!),
          ligne_frais_id: parseInt(currentLigne.ligne_frais_id!),
          description: currentLigne.description,
          quantite: parseFloat(currentLigne.quantite),
          unite_id: parseInt(currentLigne.unite_id),
          prix_unitaire_ht: prixUnitaireNumeric,
          type_frais: currentLigne.type_frais || 'standard',
        });

        // (intervenants retirés du formulaire; pas d'actions supplémentaires)
      }

      // Réinitialiser le formulaire
      setCurrentLigne({
        type_ligne: '',
        type_frais: 'standard',
        service_id: '',
        activity_id: '',
        frais_category_id: '',
        ligne_frais_id: '',
        description: '',
        quantite: '1',
        unite_id: '',
        prix_unitaire: '',
        
      });

      setAddLigneDialogOpen(false);
      toast.success('Ligne ajoutée avec succès');
      
      // Actualiser les données du devis
      queryClient.invalidateQueries({ queryKey: ['devis', devisId] });
    } catch (error) {
      console.error("Erreur lors de l'ajout de la ligne:", error);
      // Si une erreur provient d'une mutation en particulier, la gestion d'erreur du hook peut afficher les détails.
      toast.error("Erreur lors de l'ajout de la ligne");
    }
  };

  const getStatutBadge = (statut: string) => {
    const variants = {
      brouillon: 'secondary',
      envoye: 'default',
      accepte: 'default',
      refuse: 'destructive',
      expire: 'destructive',
    } as const;
    
    return <Badge variant={variants[statut as keyof typeof variants]}>{statut}</Badge>;
  };

  const handleExportPDF = () => {
    setPdfExportOpen(true);
  };

  const handleDeleteLigne = async (ligneId: number) => {
    try {
      await deleteLigneMutation.mutateAsync(ligneId);
      setDeleteLigneDialogOpen(false);
      setLigneToDelete(null);
      toast.success('Ligne supprimée avec succès');
      
      // Actualiser les données du devis
      queryClient.invalidateQueries({ queryKey: ['devis', devisId] });
    } catch (error) {
      console.error('Erreur lors de la suppression de la ligne:', error);
      toast.error('Erreur lors de la suppression de la ligne');
    }
  };

  const openDeleteDialog = (ligne: any) => {
    setLigneToDelete(ligne);
    setDeleteLigneDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="animate-spin" size={32}/>
      </div>
    );
  }

  if (error || !devis) {
    return (
      <div className="text-center py-10">
        <p className="text-red-600">Erreur lors du chargement du devis</p>
        <Button onClick={() => navigate('/devis')} className="mt-4">
          Retour aux devis
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-8xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/devis')}>
            <ArrowLeft size={16} className="mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Devis {devis.numero}</h1>
            <p className="text-gray-600">Client: {devis.client.nom_complet}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {devis.statut === 'brouillon' && (
            <>
              {hasPermission('devis.can_edit_devis') && (
                <Button onClick={() => setEditDialogOpen(true)} variant="outline">
                  <Edit size={16} className="mr-2" />
                  Modifier
                </Button>
              )}
              {hasPermission('devis.can_add_ligne_devis') && (
              <Button onClick={() => setAddLigneDialogOpen(true)} variant="outline">
                  <Plus size={16} className="mr-2" />
                  Ajouter ligne
                </Button>
              )}
              {hasPermission('devis.can_send_devis') && (
              <Button onClick={handleEnvoyer}>
                <Send size={16} className="mr-2" />
                Envoyer
              </Button>
              )}
            </>
          )}
          
          {devis.statut === 'envoye' && (
            <>
              {hasPermission('devis.can_accept_devis') && (
              <Button onClick={handleAccepter} variant="outline">
                <Check size={16} className="mr-2" />
                Accepter
              </Button>
              )}
              {hasPermission('devis.can_refuse_devis') && (
              <Button onClick={handleRefuser} variant="destructive">
                <X size={16} className="mr-2" />
                Refuser
              </Button>
              )}
            </>
          )}
          {devis.statut === 'accepte' && devis.contrat && (
            <>
            {hasPermission('devis.can_view_contrat') && (
            <Button onClick={() => navigate(`/contrats/${devis.contrat.id}`)} variant="outline">
              <FileCheck size={16} className="mr-2" />
              Voir le contrat
            </Button>
            )}
          </>
          )}
          {hasPermission('devis.can_export_pdf') && (
          <Button onClick={handleExportPDF} variant="outline">
            <Download size={16} className="mr-2" />
            Exporter PDF
          </Button>
          )}
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
              <p className="font-medium">{devis.numero}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Client</Label>
              <p className="font-medium">{devis.client.nom_complet}</p>
              <p className="text-sm text-gray-600">{devis.client.email}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Date de création</Label>
              <p>{new Date(devis.date_creation).toLocaleDateString()}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Date de validité</Label>
              <p>{new Date(devis.date_validite).toLocaleDateString()}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Statut</Label>
              <div className="mt-1">{getStatutBadge(devis.statut)}</div>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Montant HT</Label>
              <p className="font-medium">{formatMontant(devis.montant_ht)}</p>
            </div>
            {devis.appliquer_tva && (
              <div>
                <Label className="text-sm font-medium text-gray-600">TVA ({devis.taux_tva}%)</Label>
                <p className="font-medium">{formatMontant(devis.montant_tva)}</p>
              </div>
            )}
            {devis.appliquer_frais_agence && (
              <div>
                <Label className="text-sm font-medium text-gray-600">Frais d'agence ({devis.taux_frais_agence}%)</Label>
                <p className="font-medium">{formatMontant(devis.montant_frais_agence || 0)}</p>
              </div>
            )}
            <div>
              <Label className="text-sm font-medium text-gray-600">Montant TTC</Label>
              <p className="font-medium text-lg">{formatMontant(devis.montant_ttc)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lignes de devis */}
      <Card>
        <CardHeader>
          <CardTitle>Lignes de devis</CardTitle>
        </CardHeader>
        <CardContent>
          {devis.lignes.length === 0 ? (
            <p className="text-center text-gray-600 py-8">Aucune ligne de devis</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Désignation</TableHead>
                  <TableHead>Type ligne</TableHead>
                  <TableHead>Quantité</TableHead>
                  <TableHead>Unité</TableHead>
                  <TableHead>Prix unitaire HT</TableHead>
                  <TableHead>Montant HT</TableHead>
                  {devis.statut === 'brouillon' && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {devis.lignes.map((ligne) => (
                  <TableRow key={ligne.id}>
                    <TableCell className="font-medium">
                      {ligne.type_ligne === 'prestation'
                        ? ligne.activity?.intitule || '—'
                        : ligne.ligne_frais?.description || '—'}
                    </TableCell>
                    <TableCell>{ligne.type_ligne === 'prestation' ? 'Prestation' : 'Frais'}</TableCell>
                    <TableCell>{ligne.quantite}</TableCell>
                    <TableCell>{ligne.unite?.intitule || '—'}</TableCell>
                    <TableCell>{formatMontant(ligne.prix_unitaire_ht)}</TableCell>
                    <TableCell className="font-medium">{formatMontant(ligne.montant_ht)}</TableCell>
                    {devis.statut === 'brouillon' && (
                      <TableCell>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={() => openDeleteDialog(ligne)}
                          disabled={deleteLigneMutation.isPending}
                        >
                          <Trash2 size={16}/>
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Notes et conditions */}
      {(devis.notes || devis.conditions) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {devis.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{devis.notes}</p>
              </CardContent>
            </Card>
          )}
          {devis.conditions && (
            <Card>
              <CardHeader>
                <CardTitle>Conditions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{devis.conditions}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Dialog de modification */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le devis</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Date de validité</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateValidite ? (
                      format(dateValidite, "PPP", { locale: fr })
                    ) : (
                      <span className="text-muted-foreground">Sélectionner une date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateValidite}
                    onSelect={setDateValidite}
                    initialFocus
                    disabled={(date) => date < new Date()}
                    locale={fr}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label className="text-sm font-medium">Appliquer la TVA</Label>
              <div className="flex items-center space-x-2 mt-2">
                <input
                  type="checkbox"
                  id="appliquer_tva"
                  checked={form.appliquer_tva}
                  onChange={(e) => setForm({ ...form, appliquer_tva: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="appliquer_tva" className="text-sm">
                  Activer la TVA sur ce devis
                </Label>
              </div>
            </div>
            {form.appliquer_tva && (
              <div>
                <Label className="text-sm font-medium">Taux de TVA (%)</Label>
                <Input 
                  type="number"
                  name="taux_tva"
                  value={form.taux_tva}
                  onChange={(e) => setForm({ ...form, taux_tva: parseFloat(e.target.value) || 0 })}
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="18.00"
                />
              </div>
            )}
            <div>
              <Label className="text-sm font-medium">Appliquer les frais d'agence</Label>
              <div className="flex items-center space-x-2 mt-2">
                <input
                  type="checkbox"
                  id="appliquer_frais_agence"
                  checked={form.appliquer_frais_agence}
                  onChange={(e) => setForm({ ...form, appliquer_frais_agence: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="appliquer_frais_agence" className="text-sm">
                  Activer les frais d'agence (Conseil, Accompagnement & Coordination générale)
                </Label>
              </div>
            </div>
            {form.appliquer_frais_agence && (
              <div>
                <Label className="text-sm font-medium">Taux des frais d'agence (%)</Label>
                <Input 
                  type="number"
                  name="taux_frais_agence"
                  value={form.taux_frais_agence}
                  onChange={(e) => setForm({ ...form, taux_frais_agence: parseFloat(e.target.value) || 0 })}
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="15.00"
                />
              </div>
            )}
            <div>
              <Label className="text-sm font-medium">Notes</Label>
              <Textarea 
                name="notes" 
                placeholder="Notes du devis" 
                value={form.notes} 
                onChange={(e) => setForm({ ...form, notes: e.target.value })} 
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Conditions</Label>
              <Textarea 
                name="conditions" 
                placeholder="Conditions du devis" 
                value={form.conditions} 
                onChange={(e) => setForm({ ...form, conditions: e.target.value })} 
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={handleSave} 
              disabled={updateDevisMutation.isPending}
            >
              {updateDevisMutation.isPending ? 
                <Loader2 className="animate-spin" size={16}/> : 'Enregistrer'
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog d'ajout de ligne */}
      <Dialog open={addLigneDialogOpen} onOpenChange={setAddLigneDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ajouter une ligne de devis</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Informations de la ligne */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-4">
                <Label className="text-sm font-medium">Type de ligne *</Label>
                <Select value={currentLigne.type_ligne} onValueChange={(value) => handleLigneChange('type_ligne', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un type de ligne" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prestation">Prestation</SelectItem>
                    <SelectItem value="frais">Frais</SelectItem>
                  </SelectContent>
                </Select>
                {!currentLigne.type_ligne && (
                  <p className="text-sm text-muted-foreground mt-1">
                    💡 Choisissez le type de ligne pour afficher les champs correspondants
                  </p>
                )}
              </div>
              {currentLigne.type_ligne === 'prestation' && (
                <>
                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium">Service *</Label>
                    <Select value={currentLigne.service_id} onValueChange={(value) => handleLigneChange('service_id', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un service" />
                      </SelectTrigger>
                      <SelectContent>
                        {services.map(service => (
                          <SelectItem key={service.id} value={service.id.toString()}>
                            {service.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium">Activité *</Label>
                    <Select value={currentLigne.activity_id} onValueChange={(value) => handleLigneChange('activity_id', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder={
                          !currentLigne.service_id 
                            ? "Sélectionnez d'abord un service" 
                            : isLoadingActivites 
                              ? "Chargement des activités..." 
                              : "Sélectionner une activité"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {!currentLigne.service_id ? (
                          <SelectItem value="no-service" disabled>
                            Sélectionnez d'abord un service
                          </SelectItem>
                        ) : isLoadingActivites ? (
                          <SelectItem value="loading" disabled>
                            Chargement...
                          </SelectItem>
                        ) : activites.length === 0 ? (
                          <SelectItem value="no-activities" disabled>
                            Aucune activité trouvée pour ce service
                          </SelectItem>
                        ) : (
                          activites.map(activite => (
                            <SelectItem key={activite.id} value={activite.id.toString()}>
                              {activite.intitule}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-1">
                    <Label className="text-sm font-medium">Unité *</Label>
                    <Select value={currentLigne.unite_id} onValueChange={(value) => handleLigneChange('unite_id', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une unité" />
                      </SelectTrigger>
                      <SelectContent>
                        {unites.map(unite => (
                          <SelectItem key={unite.id} value={unite.id.toString()}>
                            {unite.intitule} ({unite.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-1">
                    <Label className="text-sm font-medium">Quantité</Label>
                    <Input 
                      type="number"
                      step="0.01"
                      value={currentLigne.quantite} 
                      onChange={(e) => handleLigneChange('quantite', e.target.value)}
                      placeholder="1"
                    />
                  </div>
                  <div className="md:col-span-1">
                    <Label className="text-sm font-medium">Prix unitaire HT</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={currentLigne.prix_unitaire}
                      onChange={(e) => handleLigneChange('prix_unitaire', e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div className="md:col-span-1">
                    <Label className="text-sm font-medium">Montant HT</Label>
                    <Input
                      readOnly
                      value={formatMontant((parseFloat(currentLigne.quantite || '0') || 0) * (parseFloat(currentLigne.prix_unitaire || '0') || 0))}
                      className="bg-gray-50 text-gray-700"
                    />
                  </div>
                </>
              )}
              {currentLigne.type_ligne === 'frais' && (
                <>
                  <div className="md:col-span-1">
                    <Label className="text-sm font-medium">Type de frais *</Label>
                    <Select value={currentLigne.type_frais || ''} onValueChange={(value) => handleLigneChange('type_frais', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un type de frais" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="forfait">Forfait</SelectItem>
                        <SelectItem value="offert">Offert</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-1">
                    <Label className="text-sm font-medium">Catégorie de frais *</Label>
                    <Select value={currentLigne.frais_category_id} onValueChange={(value) => handleLigneChange('frais_category_id', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une catégorie de frais" />
                      </SelectTrigger>
                      <SelectContent>
                        {fraisCategories.map(category => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-1">
                    <Label className="text-sm font-medium">Ligne de frais *</Label>
                    <Select value={currentLigne.ligne_frais_id} onValueChange={(value) => handleLigneChange('ligne_frais_id', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une ligne de frais" />
                      </SelectTrigger>
                      <SelectContent>
                        {lignesFrais.map(ligneFrais => (
                          <SelectItem key={ligneFrais.id} value={ligneFrais.id.toString()}>
                            {ligneFrais.description}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-1">
                    <Label className="text-sm font-medium">Prix unitaire *</Label>
                    <Input 
                      type="number"
                      step="0.01"
                      value={currentLigne.prix_unitaire}
                      onChange={(e) => handleLigneChange('prix_unitaire', e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div className="md:col-span-1">
                    <Label className="text-sm font-medium">Quantité</Label>
                    <Input 
                      type="number"
                      step="0.01"
                      value={currentLigne.quantite} 
                      onChange={(e) => handleLigneChange('quantite', e.target.value)}
                      placeholder="1"
                    />
                  </div>
                  <div className="md:col-span-1">
                    <Label className="text-sm font-medium">Unité</Label>
                    <Select value={currentLigne.unite_id} onValueChange={(value) => handleLigneChange('unite_id', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une unité" />
                      </SelectTrigger>
                      <SelectContent>
                        {unites.map(unite => (
                          <SelectItem key={unite.id} value={unite.id.toString()}>
                            {unite.intitule} ({unite.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>

            {/* Intervenants retirés du formulaire — gestion centralisée côté devis */}
          </div>
          <DialogFooter>
            <Button 
              onClick={handleAddLigne} 
              disabled={createLigneMutation.isPending}
            >
              {createLigneMutation.isPending ? 
                <Loader2 className="animate-spin" size={16}/> : 'Ajouter la ligne'
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de suppression de ligne */}
      <Dialog open={deleteLigneDialogOpen} onOpenChange={setDeleteLigneDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer la ligne</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600">
              Êtes-vous sûr de vouloir supprimer cette ligne de devis ?
            </p>
            {ligneToDelete && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Service :</span>
                    <p className="text-gray-600">{ligneToDelete.service.intitule}</p>
                  </div>
                  <div>
                    <span className="font-medium">Activité :</span>
                    <p className="text-gray-600">{ligneToDelete.activity.intitule}</p>
                  </div>
                  <div>
                    <span className="font-medium">Description :</span>
                    <p className="text-gray-600">{ligneToDelete.description || 'Aucune'}</p>
                  </div>
                  <div>
                    <span className="font-medium">Montant HT :</span>
                    <p className="text-gray-600">{formatMontant(ligneToDelete.montant_ht)}</p>
                  </div>
                </div>
              </div>
            )}
            <p className="text-sm text-red-600">
              Cette action est irréversible et supprimera également tous les intervenants associés à cette ligne.
            </p>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setDeleteLigneDialogOpen(false);
                setLigneToDelete(null);
              }}
              disabled={deleteLigneMutation.isPending}
            >
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => handleDeleteLigne(ligneToDelete?.id)}
              disabled={deleteLigneMutation.isPending}
            >
              {deleteLigneMutation.isPending ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={16}/>
                  Suppression...
                </>
              ) : (
                'Supprimer'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modals de confirmation */}
      <DevisDetailModals
        // Modal d'envoi
        envoyerDialogOpen={envoyerDialogOpen}
        setEnvoyerDialogOpen={setEnvoyerDialogOpen}
        onEnvoyer={handleConfirmEnvoyer}
        isEnvoyerPending={envoyerDevisMutation.isPending}
        
        // Modal d'acceptation
        accepterDialogOpen={accepterDialogOpen}
        setAccepterDialogOpen={setAccepterDialogOpen}
        onAccepter={handleConfirmAccepter}
        isAccepterPending={accepterDevisMutation.isPending}
        
        // Modal de refus
        refuserDialogOpen={refuserDialogOpen}
        setRefuserDialogOpen={setRefuserDialogOpen}
        onRefuser={handleConfirmRefuser}
        isRefuserPending={refuserDevisMutation.isPending}
        
        // Données du devis
        devis={devis}
      />

      {/* Composant d'export PDF */}
      {pdfExportOpen && devis && (
        <PDFExport 
          devis={devis} 
          onClose={() => setPdfExportOpen(false)} 
        />
      )}
    </div>
  );
} 