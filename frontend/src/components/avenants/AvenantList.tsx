import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, FileText, MoreHorizontal, Edit, Trash2, Send, Download, CheckCircle, X, AlertTriangle, Eye, Calendar, User, FileEdit } from 'lucide-react';
import { useAvenantsByContrat, useDeleteAvenant, useEnvoyerAvenant, useDownloadAvenantPDF, useAnnulerAvenant } from '@/hooks/use-avenants';
import { CreateAvenantModal } from './CreateAvenantModal';
import { EditAvenantModal } from './EditAvenantModal';
import { SignerAvenantModal } from './SignerAvenantModal';
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);
  const [selectedAvenant, setSelectedAvenant] = useState<Avenant | null>(null);
  const [avenantToDelete, setAvenantToDelete] = useState<Avenant | null>(null);
  const [avenantToCancel, setAvenantToCancel] = useState<Avenant | null>(null);
  const [avenantToSend, setAvenantToSend] = useState<Avenant | null>(null);
  const [avenantToSign, setAvenantToSign] = useState<Avenant | null>(null);
  const [avenantDetails, setAvenantDetails] = useState<Avenant | null>(null);
  const { data: avenants, isLoading, error } = useAvenantsByContrat(contratId);
  const avenantsArray = Array.isArray(avenants) ? avenants : [];

  // Hooks de mutations
  const deleteAvenantMutation = useDeleteAvenant();
  const envoyerAvenantMutation = useEnvoyerAvenant();
  const downloadAvenantPDFMutation = useDownloadAvenantPDF();
  const annulerAvenantMutation = useAnnulerAvenant();

  // Fonctions de gestion des actions
  const handleDelete = (avenant: Avenant) => {
    setAvenantToDelete(avenant);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!avenantToDelete) return;
    
    try {
      await deleteAvenantMutation.mutateAsync({ 
        id: avenantToDelete.id 
      });
      toast.success('Avenant supprimé avec succès');
      setShowDeleteModal(false);
      setAvenantToDelete(null);
    } catch (error: any) {
      console.error('Erreur lors de la suppression:', error);
      toast.error(error.response?.data?.error || 'Erreur lors de la suppression de l\'avenant');
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setAvenantToDelete(null);
  };

  const handleEnvoyer = (avenant: Avenant) => {
    setAvenantToSend(avenant);
    setShowSendModal(true);
  };

  const confirmSend = async () => {
    if (!avenantToSend) return;
    
    try {
      await envoyerAvenantMutation.mutateAsync({ 
        id: avenantToSend.id 
      });
      toast.success('Avenant envoyé avec succès');
      setShowSendModal(false);
      setAvenantToSend(null);
    } catch (error: any) {
      console.error('Erreur lors de l\'envoi:', error);
      toast.error(error.response?.data?.error || 'Erreur lors de l\'envoi de l\'avenant');
    }
  };

  const cancelSend = () => {
    setShowSendModal(false);
    setAvenantToSend(null);
  };

  const handleDownload = async (avenant: Avenant) => {
    try {
      await downloadAvenantPDFMutation.mutateAsync({ 
        id: avenant.id 
      });
    } catch (error: any) {
      console.error('Erreur lors du téléchargement:', error);
      toast.error(error.response?.data?.error || 'Erreur lors du téléchargement');
    }
  };

  const handleAnnuler = (avenant: Avenant) => {
    setAvenantToCancel(avenant);
    setShowCancelModal(true);
  };

  const confirmCancel = async () => {
    if (!avenantToCancel) return;
    
    try {
      await annulerAvenantMutation.mutateAsync({ 
        id: avenantToCancel.id 
      });
      toast.success('Avenant annulé avec succès');
      setShowCancelModal(false);
      setAvenantToCancel(null);
    } catch (error: any) {
      console.error('Erreur lors de l\'annulation:', error);
      toast.error(error.response?.data?.error || 'Erreur lors de l\'annulation');
    }
  };

  const cancelAnnulation = () => {
    setShowCancelModal(false);
    setAvenantToCancel(null);
  };

  const handleShowDetails = (avenant: Avenant) => {
    setAvenantDetails(avenant);
    setShowDetailsModal(true);
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setAvenantDetails(null);
  };

  const handleEdit = (avenant: Avenant) => {
    setSelectedAvenant(avenant);
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedAvenant(null);
  };

  const handleSign = (avenant: Avenant) => {
    setAvenantToSign(avenant);
    setShowSignModal(true);
  };

  const handleCloseSignModal = () => {
    setShowSignModal(false);
    setAvenantToSign(null);
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
                    <div className="flex gap-1 mt-1">
                      {avenant.statut === 'brouillon' && (
                        <span className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                          Modifiable
                        </span>
                      )}
                      {avenant.modifications && avenant.modifications.length > 0 && (
                        <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                          {avenant.modifications.length} modification(s)
                        </span>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleShowDetails(avenant)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Voir les détails
                      </DropdownMenuItem>
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
                            className="text-red-600 focus:text-red-600"
                            disabled={deleteAvenantMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {deleteAvenantMutation.isPending ? 'Suppression...' : 'Supprimer'}
                          </DropdownMenuItem>
                        </>
                      )}
                      
                      {avenant.statut === 'envoye' && (
                        <>
                          <DropdownMenuItem onClick={() => handleSign(avenant)}>
                            <FileEdit className="h-4 w-4 mr-2" />
                            Signer
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleAnnuler(avenant)}
                            disabled={annulerAvenantMutation.isPending}
                          >
                            <X className="h-4 w-4 mr-2" />
                            {annulerAvenantMutation.isPending ? 'Annulation...' : 'Annuler'}
                          </DropdownMenuItem>
                        </>
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
                  <div className="pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleShowDetails(avenant)}
                      className="w-full"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Voir les détails
                    </Button>
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

      {/* Modal de suppression */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Confirmer la suppression
            </DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer l'avenant "{avenantToDelete?.intitule_avenant}" ?
              <br />
              <span className="text-red-600 font-medium">Cette action est irréversible.</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={cancelDelete} disabled={deleteAvenantMutation.isPending}>
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              disabled={deleteAvenantMutation.isPending}
            >
              {deleteAvenantMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Suppression...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal d'annulation */}
      <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <X className="h-5 w-5 text-orange-600" />
              Confirmer l'annulation
            </DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir annuler l'avenant "{avenantToCancel?.intitule_avenant}" ?
              <br />
              <span className="text-orange-600 font-medium">Cette action changera le statut de l'avenant.</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={cancelAnnulation} disabled={annulerAvenantMutation.isPending}>
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmCancel}
              disabled={annulerAvenantMutation.isPending}
            >
              {annulerAvenantMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Annulation...
                </>
              ) : (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Annuler l'avenant
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal d'envoi */}
      <Dialog open={showSendModal} onOpenChange={setShowSendModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-blue-600" />
              Confirmer l'envoi
            </DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir envoyer l'avenant "{avenantToSend?.intitule_avenant}" ?
              <br />
              <span className="text-blue-600 font-medium">
                Une fois envoyé, l'avenant ne pourra plus être modifié.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={cancelSend} disabled={envoyerAvenantMutation.isPending}>
              Annuler
            </Button>
            <Button 
              onClick={confirmSend}
              disabled={envoyerAvenantMutation.isPending}
            >
              {envoyerAvenantMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Envoi...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Envoyer l'avenant
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de signature */}
      {avenantToSign && (
        <SignerAvenantModal
          isOpen={showSignModal}
          onClose={handleCloseSignModal}
          avenant={avenantToSign}
        />
      )}

      {/* Modal de détails */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileEdit className="h-5 w-5 text-blue-600" />
              Détails de l'avenant
            </DialogTitle>
          </DialogHeader>
          
          {avenantDetails && (
            <div className="space-y-6">
              {/* Informations générales */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{avenantDetails.intitule_avenant}</h3>
                  <Badge 
                    variant={
                      avenantDetails.statut === 'brouillon' ? 'secondary' :
                      avenantDetails.statut === 'envoye' ? 'default' :
                      avenantDetails.statut === 'signe' ? 'default' :
                      'destructive'
                    }
                  >
                    {avenantDetails.statut_display}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">Numéro :</span>
                      <span>{avenantDetails.numero}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">Créé le :</span>
                      <span>{new Date(avenantDetails.date_creation).toLocaleDateString('fr-FR')}</span>
                    </div>
                    {avenantDetails.date_signature && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">Signé le :</span>
                        <span>{new Date(avenantDetails.date_signature).toLocaleDateString('fr-FR')}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">Client :</span>
                      <span>{avenantDetails.contrat.client.nom_complet}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">Contrat :</span>
                      <span>{avenantDetails.contrat.numero}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileEdit className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">Type :</span>
                      <span>{avenantDetails.type_modification_display}</span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Objet de l'avenant */}
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900">Objet de l'avenant</h4>
                <p className="text-gray-700 bg-gray-50 p-3 rounded-md">
                  {avenantDetails.objet_avenant}
                </p>
              </div>

              {/* Modifications */}
              {avenantDetails.modifications && avenantDetails.modifications.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Modifications apportées</h4>
                  <div className="space-y-3">
                    {avenantDetails.modifications.map((modification, index) => (
                      <div key={index} className="border rounded-lg p-4 bg-gray-50">
                        <h5 className="font-medium text-gray-900 mb-2">
                          Clause : {modification.clause}
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h6 className="text-sm font-medium text-red-600 mb-1">Ancienne version</h6>
                            <p className="text-sm text-gray-700 bg-white p-2 rounded border-l-4 border-red-200">
                              {modification.ancienne_version}
                            </p>
                          </div>
                          <div>
                            <h6 className="text-sm font-medium text-green-600 mb-1">Nouvelle version</h6>
                            <p className="text-sm text-gray-700 bg-white p-2 rounded border-l-4 border-green-200">
                              {modification.nouvelle_version}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Contenu personnalisé */}
              {avenantDetails.contenu_personnalise && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900">Contenu personnalisé</h4>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                      {avenantDetails.contenu_personnalise}
                    </pre>
                  </div>
                </div>
              )}

              {/* Variables personnalisées */}
              {avenantDetails.variables_personnalisees && Object.keys(avenantDetails.variables_personnalisees).length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900">Variables personnalisées</h4>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {Object.entries(avenantDetails.variables_personnalisees).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="font-medium text-gray-700">{key} :</span>
                          <span className="text-gray-600">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Fichier signé */}
              {avenantDetails.fichier_signe && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900">Fichier signé</h4>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-gray-700">Document signé disponible</span>
                    <Button variant="outline" size="sm" onClick={() => handleDownload(avenantDetails)}>
                      <Download className="h-4 w-4 mr-1" />
                      Télécharger
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeDetailsModal}>
              Fermer
            </Button>
            {avenantDetails?.statut === 'brouillon' && (
              <Button onClick={() => {
                closeDetailsModal();
                handleEdit(avenantDetails);
              }}>
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 