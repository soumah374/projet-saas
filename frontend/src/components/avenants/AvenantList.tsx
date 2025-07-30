import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, FileText, MoreHorizontal, Edit, Trash2, Send, Download, CheckCircle, X } from 'lucide-react';
import { useAvenantsByContrat, useDeleteAvenant, useEnvoyerAvenant, useDownloadAvenantPDF, useAnnulerAvenant } from '@/hooks/use-avenants';
import { CreateAvenantModal } from './CreateAvenantModal';
import { EditAvenantModal } from './EditAvenantModal';
import { Avenant } from '@/hooks/use-avenants';
import { toast } from 'sonner';

interface AvenantListProps {
  contratId: number;
  contratNumero: string;
}

export const AvenantList: React.FC<AvenantListProps> = ({
  contratId,
  contratNumero,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAvenant, setSelectedAvenant] = useState<Avenant | null>(null);
  const { data: avenants, isLoading, error } = useAvenantsByContrat(contratId);
  const avenantsArray = Array.isArray(avenants) ? avenants : [];

  // Hooks de mutations
  const deleteAvenantMutation = useDeleteAvenant();
  const envoyerAvenantMutation = useEnvoyerAvenant();
  const downloadAvenantPDFMutation = useDownloadAvenantPDF();
  const annulerAvenantMutation = useAnnulerAvenant();

  // Fonctions de gestion des actions
  const handleDelete = async (avenant: Avenant) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet avenant ?')) {
      try {
        await deleteAvenantMutation.mutateAsync(avenant.id);
        toast.success('Avenant supprimé avec succès');
      } catch (error) {
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  const handleEnvoyer = async (avenant: Avenant) => {
    try {
      await envoyerAvenantMutation.mutateAsync({ contratId: avenant.contrat.id, id: avenant.id });
      toast.success('Avenant envoyé avec succès');
    } catch (error) {
      toast.error('Erreur lors de l\'envoi');
    }
  };

  const handleDownload = async (avenant: Avenant) => {
    try {
      await downloadAvenantPDFMutation.mutateAsync({ contratId: avenant.contrat.id, id: avenant.id });
    } catch (error) {
      toast.error('Erreur lors du téléchargement');
    }
  };

  const handleAnnuler = async (avenant: Avenant) => {
    if (confirm('Êtes-vous sûr de vouloir annuler cet avenant ?')) {
      try {
        await annulerAvenantMutation.mutateAsync(avenant.id);
        toast.success('Avenant annulé avec succès');
      } catch (error) {
        toast.error('Erreur lors de l\'annulation');
      }
    }
  };

  const handleEdit = (avenant: Avenant) => {
    setSelectedAvenant(avenant);
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedAvenant(null);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Erreur lors du chargement des avenants
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Avenants</h3>
          <p className="text-sm text-gray-600">
            {avenantsArray.length} avenant(s) pour ce contrat
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Créer un avenant
        </Button>
      </div>

      {/* Liste des avenants */}
      {!avenantsArray || avenantsArray.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Aucun avenant créé pour ce contrat</p>
              <p className="text-sm">Cliquez sur "Créer un avenant" pour commencer</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {avenantsArray.map((avenant) => (
            <Card key={avenant.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{avenant.intitule_avenant}</CardTitle>
                    <p className="text-sm text-gray-600">N° {avenant.numero}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleDownload(avenant)}>
                        <Download className="h-4 w-4 mr-2" />
                        Télécharger PDF
                      </DropdownMenuItem>
                      
                      {avenant.statut === 'brouillon' && (
                        <>
                          <DropdownMenuItem onClick={() => handleEnvoyer(avenant)}>
                            <Send className="h-4 w-4 mr-2" />
                            Envoyer
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(avenant)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(avenant)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </>
                      )}
                      
                      {avenant.statut === 'envoye' && (
                        <DropdownMenuItem onClick={() => handleAnnuler(avenant)}>
                          <X className="h-4 w-4 mr-2" />
                          Annuler
                        </DropdownMenuItem>
                      )}
                      
                      {avenant.statut === 'signe' && (
                        <DropdownMenuItem disabled>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Signé
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">{avenant.objet_avenant}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Type: {avenant.type_modification_display}</span>
                    <span>Statut: {avenant.statut_display}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Créé le: {new Date(avenant.date_creation).toLocaleDateString('fr-FR')}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de création */}
      <CreateAvenantModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        contratId={contratId}
        contratNumero={contratNumero}
      />

      {/* Modal d'édition */}
      <EditAvenantModal
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
        avenant={selectedAvenant}
      />
    </div>
  );
}; 