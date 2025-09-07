import React, { useState, useEffect } from 'react';
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
  Plus, 
  Settings, 
  Download,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import { useFactures, type Facture } from '@/hooks/use-factures';
import { FactureCard } from '@/components/billings/FactureCard';
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

const formatMontant = (montant: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'GNF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(montant);
};

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

  const [statistiques, setStatistiques] = useState<any>(null);
  const [facturesEnRetard, setFacturesEnRetard] = useState<Facture[]>([]);
  const [facturesAVenir, setFacturesAVenir] = useState<Facture[]>([]);
  const [selectedFacture, setSelectedFacture] = useState<Facture | null>(null);
  const [showPaiementModal, setShowPaiementModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // Filtres
  const [filtres, setFiltres] = useState({
    statut: '',
    mode_paiement: '',
    search: '',
  });

  // État de pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    fetchFactures({
      ...filtres,
      page: currentPage,
      page_size: pageSize,
    });
    loadStatistiques();
    loadFacturesEnRetard();
    loadFacturesAVenir();
  }, [currentPage, pageSize]);

  // Effet pour recharger les factures quand les filtres changent
  useEffect(() => {
    setCurrentPage(1); // Reset à la première page
    fetchFactures({
      ...filtres,
      page: 1,
      page_size: pageSize,
    });
  }, [filtres]);

  const loadStatistiques = async () => {
    const stats = await fetchStatistiques();
    if (stats) {
      setStatistiques(stats);
    }
  };

  const loadFacturesEnRetard = async () => {
    const factures = await fetchFacturesEnRetard();
    setFacturesEnRetard(factures);
  };

  const loadFacturesAVenir = async () => {
    const factures = await fetchFacturesAVenir();
    setFacturesAVenir(factures);
  };

  const handlePaiement = (facture: Facture) => {
    setSelectedFacture(facture);
    setShowPaiementModal(true);
  };

  const handleViewDetails = (facture: Facture) => {
    setSelectedFacture(facture);
    setShowDetailModal(true);
  };

  const handleEnregistrerPaiement = async (data: {
    montant: number;
    date_paiement: string;
    mode_paiement: string;
    reference_paiement?: string;
    notes?: string;
  }) => {
    if (!selectedFacture) return;

    const result = await enregistrerPaiement(selectedFacture.id, data);
    if (result) {
      setShowPaiementModal(false);
      setSelectedFacture(null);
      // Recharger les données
      fetchFactures();
      loadStatistiques();
      loadFacturesEnRetard();
    }
  };

  const handleGenererPDF = async (facture: Facture) => {
    await genererPDF(facture, true);
  };

  const handleRefresh = () => {
    fetchFactures({
      ...filtres,
      page: currentPage,
      page_size: pageSize,
    });
    loadStatistiques();
    loadFacturesEnRetard();
    loadFacturesAVenir();
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset à la première page
  };

  // Vérification de sécurité pour les données
  if (!Array.isArray(factures)) {
    return (
      <div className="max-w-8xl mx-auto space-y-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-8xl mx-auto space-y-8">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Facturation</h1>
          <p className="text-muted-foreground">
            Gestion des factures et suivi des paiements
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setShowConfigModal(true)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Configuration
          </Button>
          <Button onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      {statistiques && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Statistiques</h2>
          <StatistiquesFacturation statistiques={statistiques} loading={loading} />
        </div>
      )}

      {/* Alertes */}
      {(facturesEnRetard.length > 0 || facturesAVenir.length > 0) && (
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

      {/* Liste des factures */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">
            Factures ({pagination.count})
          </h1>
          <div className="flex items-center space-x-2">
             <Badge variant="outline">
               {(factures || []).filter(f => f.statut === 'payee').length} payées
             </Badge>
             <Badge variant="outline">
               {(factures || []).filter(f => f.statut === 'en_retard').length} en retard
             </Badge>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Recherche</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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

            <div className="space-y-2">
              <Label htmlFor="page_size">Éléments par page</Label>
              <Select
                value={pageSize.toString()}
                onValueChange={(value) => handlePageSizeChange(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="10" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
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
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                    <div className="h-8 bg-gray-200 rounded w-24"></div>
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
        ) : factures.length === 0 ? (
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
            {/* Tableau des factures */}
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
                      {factures.map((facture) => (
                        <tr key={facture.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {facture.numero || `FAC-${facture.id}`}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {facture.client_nom || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                            {formatMontant(facture.montant_ttc || 0)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge 
                              variant={
                                facture.statut === 'payee' ? 'default' :
                                facture.statut === 'en_retard' ? 'destructive' :
                                facture.statut === 'partiellement_payee' ? 'secondary' :
                                facture.statut === 'annulee' ? 'outline' :
                                'outline'
                              }
                              className={
                                facture.statut === 'payee' ? 'bg-green-100 text-green-800' :
                                facture.statut === 'en_retard' ? 'bg-red-100 text-red-800' :
                                facture.statut === 'partiellement_payee' ? 'bg-yellow-100 text-yellow-800' :
                                facture.statut === 'annulee' ? 'bg-gray-100 text-gray-800' :
                                'bg-blue-100 text-blue-800'
                              }
                            >
                              {facture.statut === 'payee' ? 'Payée' :
                               facture.statut === 'en_retard' ? 'En retard' :
                               facture.statut === 'partiellement_payee' ? 'Partiellement payée' :
                               facture.statut === 'annulee' ? 'Annulée' :
                               facture.statut === 'emise' ? 'Émise' :
                               facture.statut === 'envoyee' ? 'Envoyée' :
                               facture.statut}
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
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewDetails(facture)}
                                className="h-8 px-3"
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                              {facture.statut !== 'payee' && facture.statut !== 'annulee' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handlePaiement(facture)}
                                  className="h-8 px-3"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleGenererPDF(facture)}
                                className="h-8 px-3"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Informations de pagination */}
            {pagination.count > 0 && (
              <div className="flex items-center justify-between mt-8 p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">
                  Affichage de {((currentPage - 1) * pageSize) + 1} à {Math.min(currentPage * pageSize, pagination.count)} sur {pagination.count} factures
                </div>

                {/* Contrôles de pagination */}
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (pagination.previous) {
                            handlePageChange(currentPage - 1);
                          }
                        }}
                        className={!pagination.previous ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>

                    {/* Pages numérotées */}
                    {(() => {
                      const totalPages = Math.ceil(pagination.count / pageSize);
                      const pages = [];
                      const maxVisiblePages = 5;
                      
                      if (totalPages <= maxVisiblePages) {
                        // Afficher toutes les pages
                        for (let i = 1; i <= totalPages; i++) {
                          pages.push(
                            <PaginationItem key={i}>
                              <PaginationLink
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handlePageChange(i);
                                }}
                                isActive={currentPage === i}
                              >
                                {i}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        }
                      } else {
                        // Logique pour afficher les pages avec ellipsis
                        if (currentPage <= 3) {
                          // Début
                          for (let i = 1; i <= 3; i++) {
                            pages.push(
                              <PaginationItem key={i}>
                                <PaginationLink
                                  href="#"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handlePageChange(i);
                                  }}
                                  isActive={currentPage === i}
                                >
                                  {i}
                                </PaginationLink>
                              </PaginationItem>
                            );
                          }
                          pages.push(
                            <PaginationItem key="ellipsis1">
                              <PaginationEllipsis />
                            </PaginationItem>
                          );
                          pages.push(
                            <PaginationItem key={totalPages}>
                              <PaginationLink
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handlePageChange(totalPages);
                                }}
                                isActive={currentPage === totalPages}
                              >
                                {totalPages}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        } else if (currentPage >= totalPages - 2) {
                          // Fin
                          pages.push(
                            <PaginationItem key={1}>
                              <PaginationLink
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handlePageChange(1);
                                }}
                                isActive={currentPage === 1}
                              >
                                1
                              </PaginationLink>
                            </PaginationItem>
                          );
                          pages.push(
                            <PaginationItem key="ellipsis2">
                              <PaginationEllipsis />
                            </PaginationItem>
                          );
                          for (let i = totalPages - 2; i <= totalPages; i++) {
                            pages.push(
                              <PaginationItem key={i}>
                                <PaginationLink
                                  href="#"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handlePageChange(i);
                                  }}
                                  isActive={currentPage === i}
                                >
                                  {i}
                                </PaginationLink>
                              </PaginationItem>
                            );
                          }
                        } else {
                          // Milieu
                          pages.push(
                            <PaginationItem key={1}>
                              <PaginationLink
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handlePageChange(1);
                                }}
                                isActive={currentPage === 1}
                              >
                                1
                              </PaginationLink>
                            </PaginationItem>
                          );
                          pages.push(
                            <PaginationItem key="ellipsis3">
                              <PaginationEllipsis />
                            </PaginationItem>
                          );
                          for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                            pages.push(
                              <PaginationItem key={i}>
                                <PaginationLink
                                  href="#"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handlePageChange(i);
                                  }}
                                  isActive={currentPage === i}
                                >
                                  {i}
                                </PaginationLink>
                              </PaginationItem>
                            );
                          }
                          pages.push(
                            <PaginationItem key="ellipsis4">
                              <PaginationEllipsis />
                            </PaginationItem>
                          );
                          pages.push(
                            <PaginationItem key={totalPages}>
                              <PaginationLink
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handlePageChange(totalPages);
                                }}
                                isActive={currentPage === totalPages}
                              >
                                {totalPages}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        }
                      }
                      
                      return pages;
                    })()}

                    <PaginationItem>
                      <PaginationNext 
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (pagination.next) {
                            handlePageChange(currentPage + 1);
                          }
                        }}
                        className={!pagination.next ? "pointer-events-none opacity-50" : ""}
                      />
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