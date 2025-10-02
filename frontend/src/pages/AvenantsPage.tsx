import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  Search, 
  FileText,
  Calendar
} from 'lucide-react';
import { useAvenants } from '@/hooks/use-avenants';
import { AvenantCard } from '@/components/avenants/AvenantCard';
import { CreateAvenantModal } from '@/components/avenants/CreateAvenantModal';
import { SignerAvenantModal } from '@/components/avenants/SignerAvenantModal';
import { Avenant } from '@/hooks/use-avenants';
import { usePermissions } from '@/hooks/use-permissions';

export const AvenantsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAvenantForSigning, setSelectedAvenantForSigning] = useState<Avenant | null>(null);
  const { hasPermission } = usePermissions();
  
  const { data: avenants, isLoading, error } = useAvenants();

  // Filtrer les avenants
  const avenantsArray = Array.isArray(avenants) ? avenants : [];
  const filteredAvenants = avenantsArray.filter(avenant => {
    const matchesSearch = 
      avenant.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      avenant.intitule_avenant.toLowerCase().includes(searchTerm.toLowerCase()) ||
      avenant.contrat.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      avenant.contrat.client.nom_complet.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || avenant.statut === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Statistiques
  const stats = {
    total: avenantsArray.length,
    brouillon: avenantsArray.filter(a => a.statut === 'brouillon').length,
    envoye: avenantsArray.filter(a => a.statut === 'envoye').length,
    signe: avenantsArray.filter(a => a.statut === 'signe').length,
    annule: avenantsArray.filter(a => a.statut === 'annule').length,
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              Erreur lors du chargement des avenants
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Avenants</h1>
          <p className="text-gray-600">Gérez les avenants de vos contrats</p>
        </div>
        {hasPermission('contrats.can_create_avenant') && (
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Créer un avenant
        </Button>
        )}
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-gray-600">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-gray-600" />
              <div>
                <p className="text-2xl font-bold">{stats.brouillon}</p>
                <p className="text-sm text-gray-600">Brouillons</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{stats.envoye}</p>
                <p className="text-sm text-gray-600">Envoyés</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats.signe}</p>
                <p className="text-sm text-gray-600">Signés</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-2xl font-bold">{stats.annule}</p>
                <p className="text-sm text-gray-600">Annulés</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par numéro, intitulé, contrat ou client..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrer par statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="brouillon">Brouillon</SelectItem>
                  <SelectItem value="envoye">Envoyé</SelectItem>
                  <SelectItem value="signe">Signé</SelectItem>
                  <SelectItem value="annule">Annulé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des avenants */}
      {filteredAvenants.length === 0 ? (
        <Card>
          <CardContent className="p-12">
            <div className="text-center text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Aucun avenant trouvé' 
                  : 'Aucun avenant créé'
                }
              </p>
              <p className="text-sm">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Essayez de modifier vos critères de recherche'
                  : 'Commencez par créer votre premier avenant'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAvenants.map((avenant) => (
            <AvenantCard
              key={avenant.id}
              avenant={avenant}
              onEdit={(avenant) => {
                // TODO: Implémenter l'édition
                console.log('Éditer avenant:', avenant);
              }}
              onDelete={(avenant) => {
                // TODO: Implémenter la suppression
                console.log('Supprimer avenant:', avenant);
              }}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <CreateAvenantModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        contratId={0} // Sera géré dans le modal
        contratNumero=""
      />

      {selectedAvenantForSigning && (
        <SignerAvenantModal
          isOpen={!!selectedAvenantForSigning}
          onClose={() => setSelectedAvenantForSigning(null)}
          avenant={selectedAvenantForSigning}
        />
      )}
    </div>
  );
}; 