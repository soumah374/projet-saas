import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { Loader2, Plus, Edit, Trash2, Download, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface ClientProfile {
  id: number;
  user: User;
  adresse: string;
  ville: string;
  code_postal: string;
  pays: string;
  telephone: string;
  date_inscription: string;
  is_active: boolean;
}

interface PaginatedResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ClientProfile[];
}

export function ClientsPage() {
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editClient, setEditClient] = useState<ClientProfile | null>(null);
  const [form, setForm] = useState<any>({
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    password_confirm: '',
    telephone: '',
    adresse: '',
    ville: '',
    code_postal: '',
    pays: '',
    is_active: true,
  });
  const pageSize = 10;
  const [toggling, setToggling] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [villeFilter, setVilleFilter] = useState('');
  const [paysFilter, setPaysFilter] = useState('');
  const [detailClient, setDetailClient] = useState<ClientProfile | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const fetchClients = async (page = 1) => {
    setLoading(true);
    try {
      const params: any = { page, page_size: pageSize };
      if (search) params.search = search;
      if (statusFilter) params.is_active = statusFilter === 'actif' ? true : statusFilter === 'inactif' ? false : undefined;
      if (villeFilter) params.ville = villeFilter;
      if (paysFilter) params.pays = paysFilter;
      const res = await api.get('/users/clients/', { params });
      const data: PaginatedResponse = res.data;
      setClients(data.results);
      setTotalPages(Math.ceil(data.count / pageSize));
      setHasNext(!!data.next);
      setHasPrev(!!data.previous);
    } catch (err) {
      toast.error('Erreur lors du chargement des clients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients(currentPage);
    // eslint-disable-next-line
  }, [search, statusFilter, villeFilter, paysFilter, currentPage]);

  const handleOpenDialog = (client?: ClientProfile) => {
    if (client) {
      setEditClient(client);
      setForm({
        username: client.user.username,
        first_name: client.user.first_name,
        last_name: client.user.last_name,
        email: client.user.email,
        password: '',
        password_confirm: '',
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
        password: '',
        password_confirm: '',
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
      password: '',
      password_confirm: '',
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
    setSaving(true);
    try {
      if (editClient) {
        // Edition
        // 1. Mettre à jour le profil client
        await api.patch(`/users/clients/${editClient.id}/`, {
          telephone: form.telephone,
          adresse: form.adresse,
          ville: form.ville,
          code_postal: form.code_postal,
          pays: form.pays,
          is_active: form.is_active,
        });
        // 2. Mettre à jour l'utilisateur (nom, prénom, email, username)
        await api.patch(`/users/users/${editClient.user.id}/`, {
          username: form.username,
          first_name: form.first_name,
          last_name: form.last_name,
          email: form.email,
        });
        toast.success('Client modifié');
        fetchClients(currentPage);
        handleCloseDialog();
      } else {
        // Création
        const payload = {
          username: form.username,
          first_name: form.first_name,
          last_name: form.last_name,
          email: form.email,
          password: form.password,
          password_confirm: form.password_confirm,
          client_profile: {
            telephone: form.telephone,
            adresse: form.adresse,
            ville: form.ville,
            code_postal: form.code_postal,
            pays: form.pays,
            is_active: form.is_active,
          },
        };
        await api.post('/auth/clients-create/', payload);
        toast.success('Client ajouté');
        fetchClients(currentPage);
        handleCloseDialog();
      }
    } catch (err: any) {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (client: ClientProfile) => {
    if (!window.confirm(`Supprimer le client ${client.user.first_name} ${client.user.last_name} ?`)) return;
    try {
      await api.delete(`/users/clients/${client.id}/`);
      toast.success('Client supprimé');
      fetchClients(currentPage);
    } catch (err) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleToggleStatus = async (client: ClientProfile) => {
    setToggling(client.id);
    try {
      await api.patch(`/users/clients/${client.id}/`, { is_active: !client.is_active });
      toast.success(`Client ${client.is_active ? 'désactivé' : 'activé'}`);
      fetchClients(currentPage);
    } catch (err) {
      toast.error('Erreur lors du changement de statut');
    } finally {
      setToggling(null);
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
  const villes = Array.from(new Set(clients.map(c => c.ville).filter(Boolean)));
  const paysList = Array.from(new Set(clients.map(c => c.pays).filter(Boolean)));

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
                <Input name="username" placeholder="Nom d'utilisateur" value={form.username} onChange={handleChange} required />
                <Input name="first_name" placeholder="Prénom" value={form.first_name} onChange={handleChange} required />
                <Input name="last_name" placeholder="Nom" value={form.last_name} onChange={handleChange} required />
                <Input name="email" placeholder="Email" value={form.email} onChange={handleChange} required />
                {!editClient && <Input name="password" type="password" placeholder="Mot de passe" value={form.password} onChange={handleChange} required />}
                {!editClient && <Input name="password_confirm" type="password" placeholder="Confirmer le mot de passe" value={form.password_confirm} onChange={handleChange} required />}
                <Input name="telephone" placeholder="Téléphone" value={form.telephone} onChange={handleChange} />
                <Input name="adresse" placeholder="Adresse" value={form.adresse} onChange={handleChange} />
                <Input name="ville" placeholder="Ville" value={form.ville} onChange={handleChange} />
                <Input name="code_postal" placeholder="Code postal" value={form.code_postal} onChange={handleChange} />
                <Input name="pays" placeholder="Pays" value={form.pays} onChange={handleChange} />
              </div>
              <DialogFooter>
                <Button onClick={handleSave} disabled={saving}>{saving ? <Loader2 className="animate-spin" size={16}/> : 'Enregistrer'}</Button>
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
                          <Button size="sm" variant="ghost" onClick={() => handleToggleStatus(client)} disabled={toggling === client.id} className="text-xs">
                            {toggling === client.id ? <Loader2 size={12} className="animate-spin" /> : client.is_active ? 'Désactiver' : 'Activer'}
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