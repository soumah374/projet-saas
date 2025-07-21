import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Edit, Trash2, Download, Eye, Send, Check, X } from 'lucide-react';
import { 
  useDevis, 
  useCreateDevis, 
  useUpdateDevis, 
  useDeleteDevis,
  useEnvoyerDevis,
  useAccepterDevis,
  useRefuserDevis,
  type Devis
} from '@/hooks/use-devis';
import { useClients } from '@/hooks/use-clients';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { formatMontant } from '@/lib/formatters';

export function DevisPage() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDevis, setEditDevis] = useState<Devis | null>(null);
  const [form, setForm] = useState<any>({
    client_id: '',
    date_validite: '',
    notes: '',
    conditions: '',
  });
  const pageSize = 10;
  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [devisToDelete, setDevisToDelete] = useState<Devis | null>(null);

  // Hooks pour les opérations CRUD
  const createDevisMutation = useCreateDevis();
  const updateDevisMutation = useUpdateDevis();
  const deleteDevisMutation = useDeleteDevis();
  const envoyerDevisMutation = useEnvoyerDevis();
  const accepterDevisMutation = useAccepterDevis();
  const refuserDevisMutation = useRefuserDevis();

  // Paramètres pour la requête des devis
  const queryParams = {
    page: currentPage,
    page_size: pageSize,
    search: search || undefined,
    statut: statutFilter || undefined,
    client: clientFilter ? parseInt(clientFilter) : undefined,
  };

  // Hook pour récupérer les devis
  const { data: devisData, isLoading: loading } = useDevis(queryParams);
  
  // Hook pour récupérer les clients
  const { data: clientsData } = useClients({ page_size: 1000 });

  const devis = devisData?.results || [];
  const clients = clientsData?.results || [];
  const totalPages = devisData ? Math.ceil(devisData.count / pageSize) : 1;
  const hasNext = !!devisData?.next;
  const hasPrev = !!devisData?.previous;

  const handleOpenDialog = (devis?: Devis) => {
    if (devis) {
      setEditDevis(devis);
      setForm({
        client_id: devis.client.id.toString(),
        date_validite: devis.date_validite,
        notes: devis.notes,
        conditions: devis.conditions,
      });
    } else {
      setEditDevis(null);
      setForm({
        client_id: '',
        date_validite: '',
        notes: '',
        conditions: '',
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditDevis(null);
    setForm({
      client_id: '',
      date_validite: '',
      notes: '',
      conditions: '',
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name: string, value: string) => {
    setForm({ ...form, [name]: value });
  };

  const handleSave = async () => {
    if (editDevis) {
      // Edition
      try {
        await updateDevisMutation.mutateAsync({
          id: editDevis.id,
          data: {
            client_id: parseInt(form.client_id),
            date_validite: form.date_validite,
            notes: form.notes,
            conditions: form.conditions,
          }
        });
        handleCloseDialog();
      } catch (err) {
        // Les erreurs sont gérées par les hooks
      }
    } else {
      // Création
      try {
        await createDevisMutation.mutateAsync({
          client_id: parseInt(form.client_id),
          date_validite: form.date_validite,
          notes: form.notes,
          conditions: form.conditions,
        });
        handleCloseDialog();
      } catch (err) {
        // Les erreurs sont gérées par les hooks
      }
    }
  };

  const handleDelete = async (devis: Devis) => {
    try {
      await deleteDevisMutation.mutateAsync(devis.id);
      setDeleteDialogOpen(false);
      setDevisToDelete(null);
    } catch (err) {
      // Les erreurs sont gérées par les hooks
    }
  };

  const openDeleteDialog = (devis: Devis) => {
    setDevisToDelete(devis);
    setDeleteDialogOpen(true);
  };

  const handleEnvoyer = async (devis: Devis) => {
    try {
      await envoyerDevisMutation.mutateAsync(devis.id);
    } catch (err) {
      // Les erreurs sont gérées par les hooks
    }
  };

  const handleAccepter = async (devis: Devis) => {
    try {
      await accepterDevisMutation.mutateAsync(devis.id);
    } catch (err) {
      // Les erreurs sont gérées par les hooks
    }
  };

  const handleRefuser = async (devis: Devis) => {
    try {
      await refuserDevisMutation.mutateAsync(devis.id);
    } catch (err) {
      // Les erreurs sont gérées par les hooks
    }
  };



  const handleExportCSV = () => {
    const headers = [
      'Numéro', 'Client', 'Date création', 'Date validité', 'Statut', 
      'Montant HT', 'Montant TVA', 'Montant TTC'
    ];
    const rows = devis.map(d => [
      d.numero,
      d.client.nom_complet,
      new Date(d.date_creation).toLocaleDateString(),
      new Date(d.date_validite).toLocaleDateString(),
      d.statut_display,
      d.montant_ht.toFixed(2),
      d.montant_tva.toFixed(2),
      d.montant_ttc.toFixed(2),
    ]);
    const csvContent = [headers, ...rows].map(row => row.map(val => `"${val ?? ''}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'devis.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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

  return (
    <div className="max-w-7xl mx-auto">
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <CardTitle>Gestion des Devis</CardTitle>
          <div className="flex flex-row gap-2 justify-end">
            <Button onClick={() => navigate('/devis/create')} size="sm" className="gap-2">
              <Plus size={16}/> Nouveau devis
            </Button>
            <Button onClick={handleExportCSV} size="sm" variant="outline" className="gap-2">
              <Download size={16}/> Exporter CSV
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin" size={32}/></div>
          ) : (
            <>
              <div className="flex flex-wrap gap-2 mb-4 items-center">
                <Input
                  placeholder="Recherche (numéro, client)"
                  value={search}
                  onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                  className="w-64"
                />
                <select value={statutFilter} onChange={e => { setStatutFilter(e.target.value); setCurrentPage(1); }} className="border rounded px-2 py-1">
                  <option value="">Tous statuts</option>
                  <option value="brouillon">Brouillon</option>
                  <option value="envoye">Envoyé</option>
                  <option value="accepte">Accepté</option>
                  <option value="refuse">Refusé</option>
                  <option value="expire">Expiré</option>
                </select>
                <select value={clientFilter} onChange={e => { setClientFilter(e.target.value); setCurrentPage(1); }} className="border rounded px-2 py-1">
                  <option value="">Tous clients</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>{client.nom_complet}</option>
                  ))}
                </select>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Numéro</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Date création</TableHead>
                    <TableHead>Date validité</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Montant TTC</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {devis.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center">Aucun devis</TableCell></TableRow>
                  ) : devis.map(devis => (
                    <TableRow key={devis.id}>
                      <TableCell className="font-medium">{devis.numero}</TableCell>
                      <TableCell>{devis.client.nom_complet}</TableCell>
                      <TableCell>{new Date(devis.date_creation).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(devis.date_validite).toLocaleDateString()}</TableCell>
                      <TableCell>{getStatutBadge(devis.statut)}</TableCell>
                      <TableCell>{formatMontant(devis.montant_ttc)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button size="icon" variant="ghost" asChild>
                            <a href={`/devis/${devis.id}`}><Eye size={16}/></a>
                          </Button>
                          {devis.statut === 'brouillon' && (
                            <>
                              <Button size="icon" variant="ghost" onClick={() => handleOpenDialog(devis)}>
                                <Edit size={16}/>
                              </Button>
                              <Button size="icon" variant="ghost" onClick={() => handleEnvoyer(devis)}>
                                <Send size={16}/>
                              </Button>
                            </>
                          )}
                          {devis.statut === 'envoye' && (
                            <>
                              <Button size="icon" variant="ghost" onClick={() => handleAccepter(devis)}>
                                <Check size={16}/>
                              </Button>
                              <Button size="icon" variant="ghost" onClick={() => handleRefuser(devis)}>
                                <X size={16}/>
                              </Button>
                            </>
                          )}
                          <Button size="icon" variant="ghost" onClick={() => openDeleteDialog(devis)}>
                            <Trash2 size={16}/>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {/* Pagination */}
              <div className="flex justify-center items-center gap-2 mt-4">
                <Button size="icon" variant="ghost" disabled={!hasPrev || currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>{'<'}</Button>
                <span>Page {currentPage} / {totalPages}</span>
                <Button size="icon" variant="ghost" disabled={!hasNext || currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>{'>'}</Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog de suppression de devis */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le devis</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600">
              Êtes-vous sûr de vouloir supprimer ce devis ?
            </p>
            {devisToDelete && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Numéro :</span>
                    <p className="text-gray-600">{devisToDelete.numero}</p>
                  </div>
                  <div>
                    <span className="font-medium">Client :</span>
                    <p className="text-gray-600">{devisToDelete.client.nom_complet}</p>
                  </div>
                  <div>
                    <span className="font-medium">Date de création :</span>
                    <p className="text-gray-600">{new Date(devisToDelete.date_creation).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="font-medium">Date de validité :</span>
                    <p className="text-gray-600">{new Date(devisToDelete.date_validite).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="font-medium">Statut :</span>
                    <div className="mt-1">
                      {getStatutBadge(devisToDelete.statut)}
                    </div>
                  </div>
                                      <div>
                      <span className="font-medium">Montants :</span>
                      <div className="mt-1 space-y-1 text-xs">
                        <div>HT : {formatMontant(devisToDelete.montant_ht)}</div>
                        <div>TVA : {formatMontant(devisToDelete.montant_tva)}</div>
                        <div>TTC : {formatMontant(devisToDelete.montant_ttc)}</div>
                      </div>
                    </div>
                </div>
              </div>
            )}
            <p className="text-sm text-red-600">
              Cette action est irréversible et supprimera également toutes les lignes de devis et intervenants associés.
            </p>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setDeleteDialogOpen(false);
                setDevisToDelete(null);
              }}
            >
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => handleDelete(devisToDelete!)}
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 