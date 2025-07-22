import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, Edit, Trash2, Download, Eye } from 'lucide-react';
import { 
  useClients, 
  useCreateClient, 
  useUpdateClient, 
  useDeleteClient,
  type ClientProfile,
  type ClientCreateData
} from '@/hooks/use-clients';
import { CreateEditClientModal } from '@/components/clients/CreateEditClientModal';
import { ClientDetailModal } from '@/components/clients/ClientDetailModal';
import { DeleteClientModal } from '@/components/clients/DeleteClientModal';

export function ClientsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editClient, setEditClient] = useState<ClientProfile | null>(null);
  const pageSize = 10;
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statutCommercialFilter, setStatutCommercialFilter] = useState('');
  const [villeFilter, setVilleFilter] = useState('');
  const [paysFilter, setPaysFilter] = useState('');
  const [detailClient, setDetailClient] = useState<ClientProfile | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<ClientProfile | null>(null);

  // Hooks pour les opérations CRUD
  const createClientMutation = useCreateClient();
  const updateClientMutation = useUpdateClient();
  const deleteClientMutation = useDeleteClient();

  // Paramètres pour la requête des clients
  const queryParams = {
    page: currentPage,
    page_size: pageSize,
    search: search || undefined,
    is_active: statusFilter === 'actif' ? true : statusFilter === 'inactif' ? false : undefined,
    type_client: typeFilter || undefined,
    statut_commercial: statutCommercialFilter || undefined,
    ville: villeFilter || undefined,
    pays: paysFilter || undefined,
  };

  // Hook pour récupérer les clients
  const { data: clientsData, isLoading: loading } = useClients(queryParams);

  const clients = clientsData?.results || [];
  const totalPages = clientsData ? Math.ceil(clientsData.count / pageSize) : 1;
  const hasNext = !!clientsData?.next;
  const hasPrev = !!clientsData?.previous;

  const handleOpenDialog = (client?: ClientProfile) => {
    setEditClient(client || null);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditClient(null);
  };

  const handleSave = async (data: ClientCreateData) => {
    if (editClient) {
      // Edition
      await updateClientMutation.mutateAsync({
        id: editClient.id,
        data
      });
    } else {
      // Création
      await createClientMutation.mutateAsync(data);
    }
    handleCloseDialog();
  };

  const handleDelete = async (client: ClientProfile) => {
    await deleteClientMutation.mutateAsync(client.id);
    setDeleteDialogOpen(false);
    setClientToDelete(null);
  };

  const openDeleteDialog = (client: ClientProfile) => {
    setClientToDelete(client);
    setDeleteDialogOpen(true);
  };

  const handleToggleStatus = async (client: ClientProfile) => {
    await updateClientMutation.mutateAsync({
      id: client.id,
      data: { is_active: !client.is_active }
    });
  };

  const handleExportCSV = () => {
    const headers = [
      'Nom', 'Prénom', 'Email', 'Téléphone', 'Type', 'Statut Commercial', 'Raison Sociale', 'RCCM/NIF', 'Contact', 
      'Adresse', 'Ville', 'Code postal', 'Pays', 'Statut'
    ];
    const rows = clients.map(c => [
      c.nom,
      c.prenom,
      c.email,
      c.telephone,
      c.type_client_display,
      c.statut_commercial_display,
      c.raison_sociale || '',
      c.rccm_nif || '',
      c.contact || '',
      c.adresse,
      c.ville,
      c.code_postal,
      c.pays,
      c.is_active ? 'Actif' : 'Inactif',
    ]);
    const csvContent = [headers, ...rows].map(row => row.map(val => `"${val ?? ''}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'clients.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleOpenDetail = (client: ClientProfile) => {
    setDetailClient(client);
    setDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setDetailOpen(false);
    setDetailClient(null);
  };

  // Générer les options uniques pour ville et pays
  const villes = Array.from(new Set(clients.map(c => c.ville).filter(Boolean))) as string[];
  const paysList = Array.from(new Set(clients.map(c => c.pays).filter(Boolean))) as string[];

  return (
    <div className="max-w-8xl mx-auto space-y-8">
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <CardTitle>Gestion des Clients</CardTitle>
          <div className="flex flex-wrap gap-2 items-center">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()} size="sm" className="gap-2"><Plus size={16}/> Ajouter</Button>
              </DialogTrigger>
            </Dialog>
            <Button onClick={handleExportCSV} size="sm" variant="outline" className="gap-2"><Download size={16}/> Exporter CSV</Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin" size={32}/></div>
          ) : (
            <>
              <div className="flex flex-wrap gap-2 mb-4 items-center">
                <Input
                  placeholder="Recherche (nom, prénom, email, téléphone, raison sociale, RCCM/NIF)"
                  value={search}
                  onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                  className="w-64"
                />
                <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }} className="border rounded px-2 py-1">
                  <option value="">Tous statuts</option>
                  <option value="actif">Actifs</option>
                  <option value="inactif">Inactifs</option>
                </select>
                <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setCurrentPage(1); }} className="border rounded px-2 py-1">
                  <option value="">Tous types</option>
                  <option value="personne_physique">Personne physique</option>
                  <option value="personne_morale">Personne morale</option>
                </select>
                <select value={statutCommercialFilter} onChange={e => { setStatutCommercialFilter(e.target.value); setCurrentPage(1); }} className="border rounded px-2 py-1">
                  <option value="">Tous statuts commerciaux</option>
                  <option value="prospect">Prospect</option>
                  <option value="actif">Actif</option>
                  <option value="inactif">Inactif</option>
                  <option value="bloque">Bloqué</option>
                </select>
                <select value={villeFilter} onChange={e => { setVilleFilter(e.target.value); setCurrentPage(1); }} className="border rounded px-2 py-1">
                  <option value="">Toutes villes</option>
                  {villes.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
                <select value={paysFilter} onChange={e => { setPaysFilter(e.target.value); setCurrentPage(1); }} className="border rounded px-2 py-1">
                  <option value="">Tous pays</option>
                  {paysList.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom complet</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Téléphone</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Statut commercial</TableHead>
                    <TableHead>Ville</TableHead>
                    <TableHead>Pays</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.length === 0 ? (
                    <TableRow><TableCell colSpan={10} className="text-center">Aucun client</TableCell></TableRow>
                  ) : clients.map(client => (
                    <TableRow key={client.id}>
                      <TableCell>{client.nom_complet}</TableCell>
                      <TableCell>{client.email}</TableCell>
                      <TableCell>{client.telephone}</TableCell>
                      <TableCell>{client.type_client_display}</TableCell>
                      <TableCell>
                        {client.type_client === 'personne_morale' && client.category_name ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {client.category_name}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>{client.statut_commercial_display}</TableCell>
                      <TableCell>{client.ville}</TableCell>
                      <TableCell>{client.pays}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={client.is_active ? 'text-green-600' : 'text-red-600'}>
                            {client.is_active ? 'Actif' : 'Inactif'}
                          </span>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleToggleStatus(client)} 
                            disabled={updateClientMutation.isPending} 
                            className="text-xs"
                          >
                            {updateClientMutation.isPending ? 
                              <Loader2 size={12} className="animate-spin" /> : 
                              client.is_active ? 'Désactiver' : 'Activer'
                            }
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button size="icon" variant="ghost" onClick={() => handleOpenDetail(client)}><Eye size={16}/></Button>
                        <Button size="icon" variant="ghost" onClick={() => handleOpenDialog(client)}><Edit size={16}/></Button>
                        <Button size="icon" variant="ghost" onClick={() => openDeleteDialog(client)}><Trash2 size={16}/></Button>
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

      {/* Modals */}
      <CreateEditClientModal
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        client={editClient}
        onSave={handleSave}
        isPending={createClientMutation.isPending || updateClientMutation.isPending}
      />

      <ClientDetailModal
        open={detailOpen}
        onOpenChange={setDetailOpen}
        client={detailClient}
      />

      <DeleteClientModal
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        client={clientToDelete}
        onDelete={handleDelete}
        isPending={deleteClientMutation.isPending}
      />
    </div>
  );
} 