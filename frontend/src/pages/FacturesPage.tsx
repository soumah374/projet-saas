import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  Settings, 
  Download,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  RefreshCw,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import { useFactures, type Facture } from '@/hooks/use-factures';
import { PaiementModal } from '@/components/billings/PaiementModal';
import { StatistiquesFacturation } from '@/components/billings/StatistiquesFacturation';
import { ConfigurationFacturationModal } from '@/components/billings/ConfigurationFacturationModal';
import { FactureDetailModal } from '@/components/billings/FactureDetailModal';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { usePermissions } from '@/hooks/use-permissions';
import { ProtectedField } from '@/components/field-permissions/ProtectedField';

// -------- Utils
const formatMontant = (montant: number) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'GNF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(montant);

// Petit hook de debounce local
function useDebounce<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

function statutBadge(statut?: string) {
  switch (statut) {
    case 'payee':
      return { label: 'Payée', className: 'bg-green-100 text-green-800', variant: 'default' as const };
    case 'en_retard':
      return { label: 'En retard', className: 'bg-red-100 text-red-800', variant: 'destructive' as const };
    case 'partiellement_payee':
      return { label: 'Partiellement payée', className: 'bg-yellow-100 text-yellow-800', variant: 'secondary' as const };
    case 'annulee':
      return { label: 'Annulée', className: 'bg-gray-100 text-gray-800', variant: 'outline' as const };
    case 'emise':
      return { label: 'Émise', className: 'bg-blue-100 text-blue-800', variant: 'outline' as const };
    case 'envoyee':
      return { label: 'Envoyée', className: 'bg-blue-100 text-blue-800', variant: 'outline' as const };
    default:
      return { label: statut ?? 'N/A', className: 'bg-blue-100 text-blue-800', variant: 'outline' as const };
  }
}

export const FacturesPage: React.FC = () => {
  const {
    factures,
    loading,
    error,
    pagination,
    fetchFactures,
    enregistrerPaiement,
    genererPDF,
    fetchStatistiques,
    fetchFacturesEnRetard,
    fetchFacturesAVenir,
  } = useFactures();

  const {
    isLoading,
    canManageBillings,
    hasPermission
  } = usePermissions()

  const [statistiques, setStatistiques] = useState<any>(null);
  const [facturesEnRetard, setFacturesEnRetard] = useState<Facture[]>([]);
  const [facturesAVenir, setFacturesAVenir] = useState<Facture[]>([]);
  const [selectedFacture, setSelectedFacture] = useState<Facture | null>(null);
  const [showPaiementModal, setShowPaiementModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Filtres (UI)
  const [filtres, setFiltres] = useState({
    statut: '',
    mode_paiement: '',
    search: '',
  });

  // Debounce sur la recherche
  const debouncedSearch = useDebounce(filtres.search, 400);

  // Filtres envoyés à l’API (sanitization)
  const effectiveFilters = useMemo(() => {
    const sanitize = (v: string) => (v && v !== 'all' ? v : '');
    return {
      statut: sanitize(filtres.statut),
      mode_paiement: sanitize(filtres.mode_paiement),
      search: (debouncedSearch ?? '').trim(),
    };
  }, [filtres.statut, filtres.mode_paiement, debouncedSearch]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Chaque fois que les filtres (debounced) changent → revenir page 1
  useEffect(() => {
    setCurrentPage(1);
  }, [effectiveFilters.statut, effectiveFilters.mode_paiement, effectiveFilters.search]);

  // Charger factures + blocs annexes quand page / taille / filtres changent
  useEffect(() => {
    fetchFactures({
      ...effectiveFilters,
      page: currentPage,
      page_size: pageSize,
    });
    (async () => {
      const [stats, retard, aVenir] = await Promise.all([
        fetchStatistiques(),
        fetchFacturesEnRetard(),
        fetchFacturesAVenir(),
      ]);
      if (stats) setStatistiques(stats);
      setFacturesEnRetard(retard || []);
      setFacturesAVenir(aVenir || []);
    })();
  }, [currentPage, pageSize, effectiveFilters, fetchFactures, fetchStatistiques, fetchFacturesEnRetard, fetchFacturesAVenir]);

  const count = pagination?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(count / pageSize));

  const getPageNumbers = useCallback(() => {
    const pages: (number | 'ellipsis')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }
    pages.push(1);
    if (currentPage > 4) pages.push('ellipsis');
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (currentPage < totalPages - 3) pages.push('ellipsis');
    pages.push(totalPages);
    return pages;
  }, [currentPage, totalPages]);

  // Actions
  const handlePaiement = (facture: Facture) => {
    setSelectedFacture(facture);
    setShowPaiementModal(true);
  };

  const handleViewDetails = (facture: Facture) => {
    setSelectedFacture(facture);
    setShowDetailModal(true);
  };

  const reloadAll = useCallback(() => {
    fetchFactures({
      ...effectiveFilters,
      page: currentPage,
      page_size: pageSize,
    });
    fetchStatistiques().then(s => s && setStatistiques(s));
    fetchFacturesEnRetard().then(setFacturesEnRetard);
    fetchFacturesAVenir().then(setFacturesAVenir);
  }, [fetchFactures, fetchStatistiques, fetchFacturesEnRetard, fetchFacturesAVenir, effectiveFilters, currentPage, pageSize]);

  const handleEnregistrerPaiement = async (data: {
    montant: number;
    date_paiement: string;
    mode_paiement: string;
    reference_paiement?: string;
    notes?: string;
  }) => {
    if (!selectedFacture) return;
    const ok = await enregistrerPaiement(selectedFacture.id, data);
    if (ok) {
      setShowPaiementModal(false);
      setSelectedFacture(null);
      reloadAll();
    }
  };

  const handleGenererPDF = async (facture: Facture) => {
    await genererPDF(facture, true);
  };

  const handleRefresh = () => {
    reloadAll();
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };
  
  // Sécurité : si factures n’est pas un tableau, affiche un loader
  if (!Array.isArray(factures)) {
    return (
      <div className="max-w-8xl mx-auto space-y-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600" />
        </div>
      </div>
    );
  }

  const payees = (factures ?? []).filter(f => f.statut === 'payee').length;
  const enRetard = (factures ?? []).filter(f => f.statut === 'en_retard').length;

  return (
    <div className="max-w-8xl mx-auto space-y-8">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Facturation</h1>
          <p className="text-muted-foreground">Gestion des factures et suivi des paiements</p>
        </div>
        <div className="flex items-center space-x-2">
          {canManageBillings('add_configurationfacturation') && (
            <Button variant="outline" onClick={() => setShowConfigModal(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Configuration
            </Button>
          )}
          <Button onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      {statistiques && (
        <>
          {hasPermission('billings.can_view_financial_reports') && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Statistiques</h2>
              <StatistiquesFacturation statistiques={statistiques} loading={loading} />
            </div>
          )}
        </>
      )}

      {/* Alertes */}
      {(facturesEnRetard.length > 0 || facturesAVenir.length > 0) && (
        <>
        {hasPermission('billings.can_view_financial_reports') && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Alertes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {facturesEnRetard.length > 0 && (
                <Card className="border-red-200 bg-red-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center space-x-2 text-red-800">
                      <AlertTriangle className="h-5 w-5" />
                      <span>Factures en retard</span>
                      <Badge variant="destructive">{facturesEnRetard.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-red-700">
                      {facturesEnRetard.length} facture(s) en retard de paiement
                    </p>
                  </CardContent>
                </Card>
              )}
              {facturesAVenir.length > 0 && (
                <Card className="border-yellow-200 bg-yellow-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center space-x-2 text-yellow-800">
                      <Clock className="h-5 w-5" />
                      <span>Échéances à venir</span>
                      <Badge variant="secondary">{facturesAVenir.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-yellow-700">
                      {facturesAVenir.length} facture(s) à échéance dans les 30 jours
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
        </>
      )}

      {/* En-tête liste */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Factures ({count})</h1>
          <div className="flex items-center space-x-2">
            <Badge variant="outline">{payees} payées</Badge>
            <Badge variant="outline">{enRetard} en retard</Badge>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filtres</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="search">Recherche</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Numéro, client, contrat..."
                  value={filtres.search}
                  onChange={(e) => setFiltres(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="statut">Statut</Label>
              <Select
                value={filtres.statut}
                onValueChange={(value) => setFiltres(prev => ({ ...prev, statut: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="emise">Émise</SelectItem>
                  <SelectItem value="envoyee">Envoyée</SelectItem>
                  <SelectItem value="payee">Payée</SelectItem>
                  <SelectItem value="en_retard">En retard</SelectItem>
                  <SelectItem value="partiellement_payee">Partiellement payée</SelectItem>
                  <SelectItem value="annulee">Annulée</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mode_paiement">Mode de paiement</Label>
              <Select
                value={filtres.mode_paiement}
                onValueChange={(value) => setFiltres(prev => ({ ...prev, mode_paiement: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous les modes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les modes</SelectItem>
                  <SelectItem value="virement">Virement bancaire</SelectItem>
                  <SelectItem value="cheque">Chèque</SelectItem>
                  <SelectItem value="especes">Espèces</SelectItem>
                  <SelectItem value="carte">Carte bancaire</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des factures */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    <div className="h-4 bg-gray-200 rounded w-24" />
                    <div className="h-4 bg-gray-200 rounded w-32" />
                    <div className="h-4 bg-gray-200 rounded w-20" />
                    <div className="h-4 bg-gray-200 rounded w-24" />
                    <div className="h-4 bg-gray-200 rounded w-20" />
                    <div className="h-8 bg-gray-200 rounded w-24" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card>
            <CardContent className="p-6">
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>
        ) : (factures ?? []).length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg text-muted-foreground mb-2">Aucune facture trouvée</p>
              <p className="text-sm text-muted-foreground">
                Essayez de modifier vos filtres ou créez une nouvelle facture
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          N° Facture
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Client
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Montant
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Statut
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date émission
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Échéance
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {(factures ?? []).map((facture) => {
                        const badge = statutBadge(facture.statut);
                        return (
                          <tr key={facture.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {facture.numero || `FAC-${facture.id}`}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {facture.client_nom || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                              <ProtectedField
                                modelName="facture"
                                appLabel="billings"
                                fieldName="montant_ttc"
                                mode="hide"
                                fallback={<div className="text-gray-400 italic">Non autorisé</div>}
                              >
                                {formatMontant(facture.montant_ttc || 0)}
                              </ProtectedField>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge variant={badge.variant} className={badge.className}>
                                {badge.label}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {facture.date_emission ? format(new Date(facture.date_emission), 'dd/MM/yyyy', { locale: fr }) : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {facture.date_echeance ? format(new Date(facture.date_echeance), 'dd/MM/yyyy', { locale: fr }) : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center space-x-2">
                                {canManageBillings('view_facture') && (
                                  <Button
                                    aria-label="Détails de la facture"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleViewDetails(facture)}
                                    className="h-8 px-3"
                                  >
                                    <FileText className="h-4 w-4" />
                                  </Button>
                                )}
                               
                                {facture.statut !== 'payee' && facture.statut !== 'annulee' && (
                                  <>
                                    {canManageBillings('can_pay_facture') && (
                                        <Button
                                          aria-label="Enregistrer un paiement"
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handlePaiement(facture)}
                                          className="h-8 px-3"
                                        >
                                          <CheckCircle className="h-4 w-4" />
                                        </Button>
                                    )}
                                  </>
                                )}
                                {canManageBillings('can_generate_invoice') && (
                                  <Button
                                    aria-label="Télécharger le PDF"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleGenererPDF(facture)}
                                    className="h-8 px-3"
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                )}
                               
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-6">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      {currentPage === 1 ? (
                        <Button variant="outline" size="icon" disabled className="cursor-not-allowed">
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                      ) : (
                        <PaginationPrevious onClick={(e) =>{ 
                          e.preventDefault()
                          handlePageChange(currentPage - 1)}} />
                      )}
                    </PaginationItem>

                    {getPageNumbers().map((p, idx) =>
                      p === 'ellipsis' ? (
                        <PaginationItem key={`ellipsis-${idx}`}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      ) : (
                        <PaginationItem key={p}>
                          <PaginationLink
                            onClick={(e) => { 
                              e.preventDefault();
                              handlePageChange(p as number)}}
                            isActive={currentPage === p}
                          >
                            {p}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    )}

                    <PaginationItem>
                      {currentPage === totalPages ? (
                        <Button variant="outline" size="icon" disabled className="cursor-not-allowed">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      ) : (
                        <PaginationNext onClick={(e) => {
                          e.preventDefault()
                          handlePageChange(currentPage + 1)}} />
                      )}
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      <PaiementModal
        facture={selectedFacture}
        isOpen={showPaiementModal}
        onClose={() => {
          setShowPaiementModal(false);
          setSelectedFacture(null);
        }}
        onSubmit={handleEnregistrerPaiement}
        loading={loading}
      />

      <ConfigurationFacturationModal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
      />

      <FactureDetailModal
        facture={selectedFacture}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedFacture(null);
        }}
        onPaiement={handlePaiement}
        onPDF={handleGenererPDF}
      />
    </div>
  );
};
