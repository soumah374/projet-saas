import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, Edit, Download, Send, Check, X } from 'lucide-react';
import { 
  useDevisById,
  useUpdateDevis,
  useEnvoyerDevis,
  useAccepterDevis,
  useRefuserDevis,
  type Devis
} from '@/hooks/use-devis';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export function DevisDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [form, setForm] = useState<any>({});

  const devisId = parseInt(id || '0');
  
  const { data: devis, isLoading, error } = useDevisById(devisId);
  const updateDevisMutation = useUpdateDevis();
  const envoyerDevisMutation = useEnvoyerDevis();
  const accepterDevisMutation = useAccepterDevis();
  const refuserDevisMutation = useRefuserDevis();

  useEffect(() => {
    if (devis) {
      setForm({
        date_validite: devis.date_validite,
        notes: devis.notes || '',
        conditions: devis.conditions || '',
      });
    }
  }, [devis]);

  const handleSave = async () => {
    try {
      await updateDevisMutation.mutateAsync({
        id: devisId,
        data: {
          date_validite: form.date_validite,
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
    try {
      await envoyerDevisMutation.mutateAsync(devisId);
    } catch (err) {
      // Error handled by hook
    }
  };

  const handleAccepter = async () => {
    try {
      await accepterDevisMutation.mutateAsync(devisId);
    } catch (err) {
      // Error handled by hook
    }
  };

  const handleRefuser = async () => {
    try {
      await refuserDevisMutation.mutateAsync(devisId);
    } catch (err) {
      // Error handled by hook
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
    toast.info('Export PDF en cours de développement');
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
    <div className="max-w-7xl mx-auto space-y-6">
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
              <Button onClick={() => setEditDialogOpen(true)} variant="outline">
                <Edit size={16} className="mr-2" />
                Modifier
              </Button>
              <Button onClick={handleEnvoyer}>
                <Send size={16} className="mr-2" />
                Envoyer
              </Button>
            </>
          )}
          {devis.statut === 'envoye' && (
            <>
              <Button onClick={handleAccepter} variant="outline">
                <Check size={16} className="mr-2" />
                Accepter
              </Button>
              <Button onClick={handleRefuser} variant="destructive">
                <X size={16} className="mr-2" />
                Refuser
              </Button>
            </>
          )}
          <Button onClick={handleExportPDF} variant="outline">
            <Download size={16} className="mr-2" />
            Exporter PDF
          </Button>
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
              <p className="font-medium">{devis.montant_ht.toFixed(2)} €</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">TVA</Label>
              <p className="font-medium">{devis.montant_tva.toFixed(2)} €</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Montant TTC</Label>
              <p className="font-medium text-lg">{devis.montant_ttc.toFixed(2)} €</p>
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
                  <TableHead>Service</TableHead>
                  <TableHead>Activité</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Quantité</TableHead>
                  <TableHead>Unité</TableHead>
                  <TableHead>Prix unitaire HT</TableHead>
                  <TableHead>Montant HT</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devis.lignes.map((ligne) => (
                  <TableRow key={ligne.id}>
                    <TableCell className="font-medium">{ligne.service.intitule}</TableCell>
                    <TableCell>{ligne.activity.intitule}</TableCell>
                    <TableCell>{ligne.description}</TableCell>
                    <TableCell>{ligne.quantite}</TableCell>
                    <TableCell>{ligne.unite.intitule}</TableCell>
                    <TableCell>{ligne.prix_unitaire_ht.toFixed(2)} €</TableCell>
                    <TableCell className="font-medium">{ligne.montant_ht.toFixed(2)} €</TableCell>
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
              <Input 
                name="date_validite" 
                type="date" 
                value={form.date_validite} 
                onChange={(e) => setForm({ ...form, date_validite: e.target.value })} 
                required 
              />
            </div>
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
    </div>
  );
} 