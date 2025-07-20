import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, Edit, Trash2, Download, Eye } from 'lucide-react';
import { 
  useClients, 
  useCreateClient, 
  useUpdateClient, 
  useUpdateClientUser, 
  useDeleteClient, 
  useToggleClientStatus,
  type ClientProfile,
  type ClientCreateData
} from '@/hooks/use-clients';
import { Label } from 'recharts';

export function ClientsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editClient, setEditClient] = useState<ClientProfile | null>(null);
  const [form, setForm] = useState<any>({
    first_name: '',
    last_name: '',
    email: '',
    telephone: '',
    adresse: '',
    ville: '',
    code_postal: '',
    pays: '',
    is_active: true,
  });
  const pageSize = 10;
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [villeFilter, setVilleFilter] = useState('');
  const [paysFilter, setPaysFilter] = useState('');
  const [detailClient, setDetailClient] = useState<ClientProfile | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Hooks pour les opérations CRUD
  const createClientMutation = useCreateClient();
  const updateClientMutation = useUpdateClient();
  const updateClientUserMutation = useUpdateClientUser();
  const deleteClientMutation = useDeleteClient();
  const toggleClientStatusMutation = useToggleClientStatus();

  // Paramètres pour la requête des clients
  const queryParams = {
    page: currentPage,
    page_size: pageSize,
    search: search || undefined,
    is_active: statusFilter === 'actif' ? true : statusFilter === 'inactif' ? false : undefined,
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
    if (client) {
      setEditClient(client);
      setForm({
        username: client.user.username,
        first_name: client.user.first_name,
        last_name: client.user.last_name,
        email: client.user.email,
        telephone: client.telephone,
        adresse: client.adresse,
        ville: client.ville,
        code_postal: client.code_postal,
        pays: client.pays,
        is_active: client.is_active,
      });
    } else {
      setEditClient(null);
      setForm({
        username: '',
        first_name: '',
        last_name: '',
        email: '',
        telephone: '',
        adresse: '',
        ville: '',
        code_postal: '',
        pays: '',
        is_active: true,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditClient(null);
    setForm({
      username: '',
      first_name: '',
      last_name: '',
      email: '',
      telephone: '',
      adresse: '',
      ville: '',
      code_postal: '',
      pays: '',
      is_active: true,
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (editClient) {
      // Edition
      try {
        // 1. Mettre à jour le profil client
        await updateClientMutation.mutateAsync({
          id: editClient.id,
          data: {
            telephone: form.telephone,
            adresse: form.adresse,
            ville: form.ville,
            code_postal: form.code_postal,
            pays: form.pays,
            is_active: form.is_active,
          }
        });
        
        // 2. Mettre à jour l'utilisateur (nom, prénom, email, username)
        await updateClientUserMutation.mutateAsync({
          id: editClient.user.id,
          data: {
            username: form.username,
            first_name: form.first_name,
            last_name: form.last_name,
            email: form.email,
          }
        });
        
        handleCloseDialog();
      } catch (err) {
        // Les erreurs sont gérées par les hooks
      }
    } else {
      // Création
      try {
        const payload: ClientCreateData = {
          first_name: form.first_name,
          last_name: form.last_name,
          email: form.email,
          client_profile: {
            telephone: form.telephone,
            adresse: form.adresse,
            ville: form.ville,
            code_postal: form.code_postal,
            pays: form.pays,
            is_active: form.is_active,
          },
        };
        await createClientMutation.mutateAsync(payload);
        handleCloseDialog();
      } catch (err) {
        // Les erreurs sont gérées par les hooks
      }
    }
  };

  const handleDelete = async (client: ClientProfile) => {
    if (!window.confirm(`Supprimer le client ${client.user.first_name} ${client.user.last_name} ?`)) return;
    try {
      await deleteClientMutation.mutateAsync(client.id);
    } catch (err) {
      // Les erreurs sont gérées par les hooks
    }
  };

  const handleToggleStatus = async (client: ClientProfile) => {
    try {
      await toggleClientStatusMutation.mutateAsync({
        id: client.id,
        isActive: !client.is_active
      });
    } catch (err) {
      // Les erreurs sont gérées par les hooks
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Nom', 'Prénom', 'Email', 'Téléphone', 'Adresse', 'Ville', 'Code postal', 'Pays', 'Statut'
    ];
    const rows = clients.map(c => [
      c.user.last_name,
      c.user.first_name,
      c.user.email,
      c.telephone,
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
    <div className="max-w-7xl mx-auto">
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <CardTitle>Gestion des Clients</CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()} size="sm" className="gap-2"><Plus size={16}/> Ajouter</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editClient ? 'Modifier' : 'Ajouter'} un client</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">Prénom</Label>
                  <Input name="first_name" placeholder="Prénom" value={form.first_name} onChange={handleChange} required />
                </div>
                <div>
                  <Label className="text-sm font-medium">Nom</Label>
                  <Input name="last_name" placeholder="Nom" value={form.last_name} onChange={handleChange} required />
                </div>
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <Input name="email" placeholder="Email" value={form.email} onChange={handleChange} required />
                </div>
                <div>
                  <Label className="text-sm font-medium">Téléphone</Label>
                  <Input name="telephone" placeholder="Téléphone" value={form.telephone} onChange={handleChange} />
                </div>
                <div>
                  <Label className="text-sm font-medium">Adresse</Label>
                  <Input name="adresse" placeholder="Adresse" value={form.adresse} onChange={handleChange} />
                </div>
                <div>
                  <Label className="text-sm font-medium">Code postal</Label>
                  <Input name="code_postal" placeholder="Code postal" value={form.code_postal} onChange={handleChange} />
                </div>
                <div>
                  <Label className="text-sm font-medium">Pays</Label>
                  <Input name="pays" placeholder="Pays" value={form.pays} onChange={handleChange} />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  onClick={handleSave} 
                  disabled={createClientMutation.isPending || updateClientMutation.isPending}
                >
                  {(createClientMutation.isPending || updateClientMutation.isPending) ? 
                    <Loader2 className="animate-spin" size={16}/> : 'Enregistrer'
                  }
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button onClick={handleExportCSV} size="sm" variant="outline" className="gap-2"><Download size={16}/> Exporter CSV</Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin" size={32}/></div>
          ) : (
            <>
              <div className="flex flex-wrap gap-2 mb-4 items-center">
                <Input
                  placeholder="Recherche (nom, prénom, email, téléphone)"
                  value={search}
                  onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                  className="w-64"
                />
                <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }} className="border rounded px-2 py-1">
                  <option value="">Tous statuts</option>
                  <option value="actif">Actifs</option>
                  <option value="inactif">Inactifs</option>
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
                    <TableHead>Nom</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Téléphone</TableHead>
                    <TableHead>Adresse</TableHead>
                    <TableHead>Ville</TableHead>
                    <TableHead>Pays</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center">Aucun client</TableCell></TableRow>
                  ) : clients.map(client => (
                    <TableRow key={client.id}>
                      <TableCell>{client.user.first_name} {client.user.last_name}</TableCell>
                      <TableCell>{client.user.email}</TableCell>
                      <TableCell>{client.telephone}</TableCell>
                      <TableCell>{client.adresse}</TableCell>
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
                            disabled={toggleClientStatusMutation.isPending} 
                            className="text-xs"
                          >
                            {toggleClientStatusMutation.isPending ? 
                              <Loader2 size={12} className="animate-spin" /> : 
                              client.is_active ? 'Désactiver' : 'Activer'
                            }
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button size="icon" variant="ghost" onClick={() => handleOpenDetail(client)}><Eye size={16}/></Button>
                        <Button size="icon" variant="ghost" onClick={() => handleOpenDialog(client)}><Edit size={16}/></Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(client)}><Trash2 size={16}/></Button>
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
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Détail du client</DialogTitle>
          </DialogHeader>
          {detailClient && (
            <div className="space-y-2">
              <div><b>Nom :</b> {detailClient.user.first_name} {detailClient.user.last_name}</div>
              <div><b>Email :</b> {detailClient.user.email}</div>
              <div><b>Téléphone :</b> {detailClient.telephone}</div>
              <div><b>Adresse :</b> {detailClient.adresse}</div>
              <div><b>Ville :</b> {detailClient.ville}</div>
              <div><b>Code postal :</b> {detailClient.code_postal}</div>
              <div><b>Pays :</b> {detailClient.pays}</div>
              <div><b>Date d'inscription :</b> {new Date(detailClient.date_inscription).toLocaleString()}</div>
              <div><b>Statut :</b> <span className={detailClient.is_active ? 'text-green-600' : 'text-red-600'}>{detailClient.is_active ? 'Actif' : 'Inactif'}</span></div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 