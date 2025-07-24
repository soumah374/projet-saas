import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, Edit, Trash2, Download, Eye, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
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
import React from 'react';

export function ClientsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editClient, setEditClient] = useState<ClientProfile | null>(null);
  const pageSize = 20;
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
    page: Math.max(1, currentPage), // Ensure page is never less than 1
    page_size: pageSize, // Use default PAGE_SIZE from Django settings
    search: search || undefined,
    is_active: statusFilter === 'actif' ? true : statusFilter === 'inactif' ? false : undefined,
    type_client: typeFilter || undefined,
    statut_commercial: statutCommercialFilter || undefined,
    ville: villeFilter || undefined,
    pays: paysFilter || undefined,
  };

  // Hook pour récupérer les clients
  const { data: clientsData, isLoading: loading, error } = useClients(queryParams);

  const clients = clientsData?.results || [];
  // Use the default PAGE_SIZE from Django settings (20)
  const defaultPageSize = pageSize;
  const totalPages = clientsData ? Math.ceil(clientsData.count / defaultPageSize) : 1;
  const hasNext = !!clientsData?.next;
  const hasPrev = !!clientsData?.previous;
  const totalItems = clientsData?.count || 0;
  const startItem = (currentPage - 1) * defaultPageSize + 1;
  const endItem = Math.min(currentPage * defaultPageSize, totalItems);

  // Reset to first page when filters change
  const resetToFirstPage = () => setCurrentPage(1);

  // Handle pagination errors
  React.useEffect(() => {
    if (error && currentPage > 1) {
      // If there's an error and we're not on the first page, go back to page 1
      setCurrentPage(1);
    }
  }, [error, currentPage]);

  // Validate current page
  React.useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  // Safe page navigation function
  const setPageSafely = (page: number) => {
    const safePage = Math.max(1, page);
    if (totalPages > 0) {
      const maxPage = Math.max(1, totalPages);
      setCurrentPage(Math.min(safePage, maxPage));
    } else {
      setCurrentPage(safePage);
    }
  };

  // Get page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show pages around current page
      let start = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
      let end = Math.min(totalPages, start + maxVisiblePages - 1);
      
      // Adjust start if we're near the end
      if (end === totalPages) {
        start = Math.max(1, end - maxVisiblePages + 1);
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };

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
                  onChange={e => { setSearch(e.target.value); resetToFirstPage(); }}
                  className="w-64"
                />
                <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); resetToFirstPage(); }} className="border rounded px-2 py-1">
                  <option value="">Tous statuts</option>
                  <option value="actif">Actifs</option>
                  <option value="inactif">Inactifs</option>
                </select>
                <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); resetToFirstPage(); }} className="border rounded px-2 py-1">
                  <option value="">Tous types</option>
                  <option value="personne_physique">Personne physique</option>
                  <option value="personne_morale">Personne morale</option>
                </select>
                <select value={statutCommercialFilter} onChange={e => { setStatutCommercialFilter(e.target.value); resetToFirstPage(); }} className="border rounded px-2 py-1">
                  <option value="">Tous statuts commerciaux</option>
                  <option value="prospect">Prospect</option>
                  <option value="actif">Actif</option>
                  <option value="inactif">Inactif</option>
                  <option value="bloque">Bloqué</option>
                </select>
                <select value={villeFilter} onChange={e => { setVilleFilter(e.target.value); resetToFirstPage(); }} className="border rounded px-2 py-1">
                  <option value="">Toutes villes</option>
                  {villes.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
                <select value={paysFilter} onChange={e => { setPaysFilter(e.target.value); resetToFirstPage(); }} className="border rounded px-2 py-1">
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
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8">
                        <div className="space-y-2">
                          <p className="text-gray-600">
                            {search || statusFilter || typeFilter || statutCommercialFilter || villeFilter || paysFilter 
                              ? 'Aucun client trouvé' 
                              : 'Aucun client'
                            }
                          </p>
                          <p className="text-sm text-gray-500">
                            {search || statusFilter || typeFilter || statutCommercialFilter || villeFilter || paysFilter 
                              ? 'Essayez de modifier vos critères de recherche' 
                              : 'Commencez par créer votre premier client'
                            }
                          </p>
                          {(search || statusFilter || typeFilter || statutCommercialFilter || villeFilter || paysFilter) && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => {
                                setSearch('');
                                setStatusFilter('');
                                setTypeFilter('');
                                setStatutCommercialFilter('');
                                setVilleFilter('');
                                setPaysFilter('');
                                resetToFirstPage();
                              }}
                            >
                              Effacer les filtres
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
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
              {/* Enhanced Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
                  {/* Informations de pagination */}
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>
                      Page {currentPage} sur {totalPages}
                    </span>
                    <span className="hidden sm:inline">•</span>
                    <span className="hidden sm:inline">
                      {totalItems} clients au total
                    </span>
                  </div>

                  {/* Contrôles de pagination */}
                  <div className="flex items-center gap-2">
                    {/* Boutons de navigation rapide */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPageSafely(1)}
                      disabled={currentPage === 1}
                      className="hidden sm:flex"
                    >
                      <ChevronsLeft size={16} />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPageSafely(currentPage - 1)}
                      disabled={!hasPrev || currentPage === 1}
                    >
                      <ChevronLeft size={16} />
                    </Button>

                    {/* Numéros de page */}
                    <div className="flex items-center gap-1">
                      {getPageNumbers().map(pageNum => (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setPageSafely(pageNum)}
                          className="w-8 h-8 text-xs hidden sm:flex"
                        >
                          {pageNum}
                        </Button>
                      ))}
                      {/* Version mobile avec sélecteur */}
                      <div className="sm:hidden flex items-center gap-2">
                        <span className="text-sm text-gray-600">Page</span>
                        <select
                          value={currentPage}
                          onChange={(e) => setPageSafely(parseInt(e.target.value))}
                          className="border rounded px-2 py-1 text-sm"
                        >
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                            <option key={pageNum} value={pageNum}>
                              {pageNum}
                            </option>
                          ))}
                        </select>
                        <span className="text-sm text-gray-600">sur {totalPages}</span>
                      </div>
                    </div>

                    {/* Boutons de navigation rapide */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPageSafely(currentPage + 1)}
                      disabled={!hasNext || currentPage === totalPages}
                    >
                      <ChevronRight size={16} />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPageSafely(totalPages)}
                      disabled={currentPage === totalPages}
                      className="hidden sm:flex"
                    >
                      <ChevronsRight size={16} />
                    </Button>
                  </div>
                </div>
              )}
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