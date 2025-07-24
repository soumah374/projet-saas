import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Edit, Trash2, Download, Eye, Send, Check, X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { ClientFilter } from '@/components/ui/ClientFilter';
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
    page: Math.max(1, currentPage), // Ensure page is never less than 1
    search: search || undefined,
    statut: statutFilter || undefined,
    client: clientFilter ? parseInt(clientFilter) : undefined,
    ordering: '-date_creation', // Default ordering as per backend
  };

  // Hook pour récupérer les devis
  const { data: devisData, isLoading: loading, error } = useDevis(queryParams);

  const devis = devisData?.results || [];
  // Use the default PAGE_SIZE from Django settings (20)
  const defaultPageSize = 20;
  const totalPages = devisData ? Math.ceil(devisData.count / defaultPageSize) : 1;
  const hasNext = !!devisData?.next;
  const hasPrev = !!devisData?.previous;
  const totalItems = devisData?.count || 0;
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

  // Generate page numbers for pagination
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

  return (
    <div className="max-w-8xl mx-auto space-y-8">
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
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-4">
              <div className="text-red-600 text-center">
                <p className="font-medium">Erreur lors du chargement des devis</p>
                <p className="text-sm mt-1">
                  {error?.message || 'Une erreur inattendue s\'est produite'}
                </p>
              </div>
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline"
                size="sm"
              >
                Réessayer
              </Button>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-2 mb-4 items-center">
                <Input
                  placeholder="Recherche (numéro, client)"
                  value={search}
                  onChange={e => { setSearch(e.target.value); resetToFirstPage(); }}
                  className="w-64"
                />
                <select value={statutFilter} onChange={e => { setStatutFilter(e.target.value); resetToFirstPage(); }} className="border rounded px-2 py-1">
                  <option value="">Tous statuts</option>
                  <option value="brouillon">Brouillon</option>
                  <option value="envoye">Envoyé</option>
                  <option value="accepte">Accepté</option>
                  <option value="refuse">Refusé</option>
                  <option value="expire">Expiré</option>
                </select>
                <ClientFilter
                  value={clientFilter}
                  onValueChange={(value) => { setClientFilter(value); resetToFirstPage(); }}
                  onReset={resetToFirstPage}
                />
              </div>
              
              {/* Pagination Info */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 text-sm text-gray-600">
                  <span>
                    Affichage de <span className="font-medium">{startItem}</span> à <span className="font-medium">{endItem}</span> sur <span className="font-medium">{totalItems}</span> devis
                  </span>
                  {totalPages > 1 && (
                    <>
                      <span className="hidden sm:inline">•</span>
                      <span>
                        Page <span className="font-medium">{currentPage}</span> sur <span className="font-medium">{totalPages}</span>
                      </span>
                    </>
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  {defaultPageSize} éléments par page
                </div>
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
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12">
                        <div className="flex flex-col items-center gap-2">
                          <div className="text-gray-400 text-lg font-medium">
                            {search || statutFilter || clientFilter ? 'Aucun devis trouvé' : 'Aucun devis'}
                          </div>
                          <div className="text-gray-500 text-sm">
                            {search || statutFilter || clientFilter 
                              ? 'Essayez de modifier vos critères de recherche'
                              : 'Commencez par créer votre premier devis'
                            }
                          </div>
                          {(search || statutFilter || clientFilter) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSearch('');
                                setStatutFilter('');
                                setClientFilter('');
                                resetToFirstPage();
                              }}
                              className="mt-2"
                            >
                              Effacer les filtres
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
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
                      {totalItems} devis au total
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
                      <span className="ml-1 hidden lg:inline">Première</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPageSafely(currentPage - 1)}
                      disabled={!hasPrev || currentPage === 1}
                    >
                      <ChevronLeft size={16} />
                      <span className="ml-1 hidden lg:inline">Précédent</span>
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
                      <span className="mr-1 hidden lg:inline">Suivant</span>
                      <ChevronRight size={16} />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPageSafely(totalPages)}
                      disabled={currentPage === totalPages}
                      className="hidden sm:flex"
                    >
                      <span className="mr-1 hidden lg:inline">Dernière</span>
                      <ChevronsRight size={16} />
                    </Button>
                  </div>
                </div>
              )}
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