import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus, Edit, Trash2, Download, Eye } from 'lucide-react';
import { 
  useClients, 
  useCreateClient, 
  useUpdateClient, 
  useDeleteClient,
  type ClientProfile,
  type ClientCreateData
} from '@/hooks/use-clients';
import { Label } from '@/components/ui/label';

export function ClientsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editClient, setEditClient] = useState<ClientProfile | null>(null);
  const [form, setForm] = useState<any>({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    type_client: 'personne_physique',
    statut_commercial: 'prospect',
    raison_sociale: '',
    rccm_nif: '',
    contact: '',
    adresse_complete: '',
    adresse: '',
    ville: '',
    code_postal: '',
    pays: '',
    is_active: true,
  });
  const pageSize = 10;
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statutCommercialFilter, setStatutCommercialFilter] = useState('');
  const [villeFilter, setVilleFilter] = useState('');
  const [paysFilter, setPaysFilter] = useState('');
  const [detailClient, setDetailClient] = useState<ClientProfile | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

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
    if (client) {
      setEditClient(client);
      setForm({
        nom: client.nom,
        prenom: client.prenom,
        email: client.email,
        telephone: client.telephone,
        type_client: client.type_client,
        statut_commercial: client.statut_commercial,
        raison_sociale: client.raison_sociale || '',
        rccm_nif: client.rccm_nif || '',
        contact: client.contact || '',
        adresse_complete: client.adresse_complete || '',
        adresse: client.adresse,
        ville: client.ville,
        code_postal: client.code_postal,
        pays: client.pays,
        is_active: client.is_active,
      });
    } else {
      setEditClient(null);
      setForm({
        nom: '',
        prenom: '',
        email: '',
        telephone: '',
        type_client: 'personne_physique',
        statut_commercial: 'prospect',
        raison_sociale: '',
        rccm_nif: '',
        contact: '',
        adresse_complete: '',
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
      nom: '',
      prenom: '',
      email: '',
      telephone: '',
      type_client: 'personne_physique',
      statut_commercial: 'prospect',
      raison_sociale: '',
      rccm_nif: '',
      contact: '',
      adresse_complete: '',
      adresse: '',
      ville: '',
      code_postal: '',
      pays: '',
      is_active: true,
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name: string, value: string) => {
    setForm({ ...form, [name]: value });
    // Si le type client change vers personne physique, vider les champs entreprise
    if (name === 'type_client' && value === 'personne_physique') {
      setForm(prev => ({
        ...prev,
        [name]: value,
        raison_sociale: '',
        rccm_nif: '',
      }));
    }
  };

  const handleSave = async () => {
    if (editClient) {
      // Edition
      try {
        await updateClientMutation.mutateAsync({
          id: editClient.id,
          data: {
            nom: form.nom,
            prenom: form.prenom,
            email: form.email,
            telephone: form.telephone,
            type_client: form.type_client,
            statut_commercial: form.statut_commercial,
            raison_sociale: form.type_client === 'personne_morale' ? form.raison_sociale : undefined,
            rccm_nif: form.type_client === 'personne_morale' ? form.rccm_nif : undefined,
            contact: form.contact,
            adresse_complete: form.adresse_complete,
            adresse: form.adresse,
            ville: form.ville,
            code_postal: form.code_postal,
            pays: form.pays,
            is_active: form.is_active,
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
          nom: form.nom,
          prenom: form.prenom,
          email: form.email,
          telephone: form.telephone,
          type_client: form.type_client,
          statut_commercial: form.statut_commercial,
          raison_sociale: form.type_client === 'personne_morale' ? form.raison_sociale : undefined,
          rccm_nif: form.type_client === 'personne_morale' ? form.rccm_nif : undefined,
          contact: form.contact,
          adresse_complete: form.adresse_complete,
          adresse: form.adresse,
          ville: form.ville,
          code_postal: form.code_postal,
          pays: form.pays,
          is_active: form.is_active,
        };
        await createClientMutation.mutateAsync(payload);
        handleCloseDialog();
      } catch (err) {
        // Les erreurs sont gérées par les hooks
      }
    }
  };

  const handleDelete = async (client: ClientProfile) => {
    if (!window.confirm(`Supprimer le client ${client.nom_complet} ?`)) return;
    try {
      await deleteClientMutation.mutateAsync(client.id);
    } catch (err) {
      // Les erreurs sont gérées par les hooks
    }
  };

  const handleToggleStatus = async (client: ClientProfile) => {
    try {
      await updateClientMutation.mutateAsync({
        id: client.id,
        data: { is_active: !client.is_active }
      });
    } catch (err) {
      // Les erreurs sont gérées par les hooks
    }
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
    <div className="max-w-7xl mx-auto">
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <CardTitle>Gestion des Clients</CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()} size="sm" className="gap-2"><Plus size={16}/> Ajouter</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editClient ? 'Modifier' : 'Ajouter'} un client</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Informations de base */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Prénom</Label>
                    <Input name="prenom" placeholder="Prénom" value={form.prenom} onChange={handleChange} required />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Nom</Label>
                    <Input name="nom" placeholder="Nom" value={form.nom} onChange={handleChange} required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Email</Label>
                    <Input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Téléphone</Label>
                    <Input name="telephone" placeholder="Téléphone" value={form.telephone} onChange={handleChange} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Type client</Label>
                    <Select value={form.type_client} onValueChange={(value) => handleSelectChange('type_client', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="personne_physique">Personne physique</SelectItem>
                        <SelectItem value="personne_morale">Personne morale</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Statut commercial</Label>
                    <Select value={form.statut_commercial} onValueChange={(value) => handleSelectChange('statut_commercial', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="prospect">Prospect</SelectItem>
                        <SelectItem value="actif">Actif</SelectItem>
                        <SelectItem value="inactif">Inactif</SelectItem>
                        <SelectItem value="bloque">Bloqué</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Champs pour personne morale */}
                {form.type_client === 'personne_morale' && (
                  <div className="space-y-4 border-t pt-4">
                    <h4 className="font-medium">Informations entreprise</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Raison sociale</Label>
                        <Input name="raison_sociale" placeholder="Raison sociale" value={form.raison_sociale} onChange={handleChange} />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">RCCM ou NIF</Label>
                        <Input name="rccm_nif" placeholder="RCCM ou NIF" value={form.rccm_nif} onChange={handleChange} />
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Contact</Label>
                      <Input name="contact" placeholder="Contact" value={form.contact} onChange={handleChange} />
                    </div>
                  </div>
                )}

                {/* Adresse */}
                <div className="space-y-4 border-t pt-4">
                  <h4 className="font-medium">Adresse</h4>
                  <div>
                    <Label className="text-sm font-medium">Adresse complète</Label>
                    <Textarea name="adresse_complete" placeholder="Adresse complète" value={form.adresse_complete} onChange={handleChange} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Adresse</Label>
                      <Input name="adresse" placeholder="Adresse" value={form.adresse} onChange={handleChange} />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Ville</Label>
                      <Input name="ville" placeholder="Ville" value={form.ville} onChange={handleChange} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Code postal</Label>
                      <Input name="code_postal" placeholder="Code postal" value={form.code_postal} onChange={handleChange} />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Pays</Label>
                      <Input name="pays" placeholder="Pays" value={form.pays} onChange={handleChange} />
                    </div>
                  </div>
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
                    <TableHead>Statut commercial</TableHead>
                    <TableHead>Ville</TableHead>
                    <TableHead>Pays</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.length === 0 ? (
                    <TableRow><TableCell colSpan={9} className="text-center">Aucun client</TableCell></TableRow>
                  ) : clients.map(client => (
                    <TableRow key={client.id}>
                      <TableCell>{client.nom_complet}</TableCell>
                      <TableCell>{client.email}</TableCell>
                      <TableCell>{client.telephone}</TableCell>
                      <TableCell>{client.type_client_display}</TableCell>
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
              <div><b>Nom complet :</b> {detailClient.nom_complet}</div>
              <div><b>Email :</b> {detailClient.email}</div>
              <div><b>Téléphone :</b> {detailClient.telephone}</div>
              <div><b>Type :</b> {detailClient.type_client_display}</div>
              <div><b>Statut commercial :</b> {detailClient.statut_commercial_display}</div>
              {detailClient.type_client === 'personne_morale' && (
                <>
                  <div><b>Raison sociale :</b> {detailClient.raison_sociale}</div>
                  <div><b>RCCM/NIF :</b> {detailClient.rccm_nif}</div>
                  <div><b>Contact :</b> {detailClient.contact}</div>
                </>
              )}
              <div><b>Adresse complète :</b> {detailClient.adresse_complete}</div>
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