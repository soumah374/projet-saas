import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDevisDisponibles } from '@/hooks/use-contrats';
import { toast } from 'sonner';
import { formatMontant } from '@/lib/formatters';

interface DevisSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedDevisIds: number[], devisPrincipalId: number) => void;
  existingDevisIds?: number[];
  selectedClientId?: number;
  title?: string;
}

export const DevisSelectionModal: React.FC<DevisSelectionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  existingDevisIds = [],
  selectedClientId,
  title = "Sélectionner les devis"
}) => {
  const [selectedDevisIds, setSelectedDevisIds] = useState<number[]>([]);
  const [devisPrincipalId, setDevisPrincipalId] = useState<number | null>(null);
  
  // Charger uniquement les devis du client sélectionné
  const { data: devisDisponibles, isLoading } = useDevisDisponibles(selectedClientId);

  // Filtrer les devis disponibles (exclure ceux déjà associés)
  const availableDevis = devisDisponibles?.filter(devis => {
    // Exclure les devis déjà associés
    if (existingDevisIds.includes(devis.id)) {
      return false;
    }
    return true; 
  }) || [];

  const handleDevisToggle = (devisId: number) => {
    setSelectedDevisIds(prev => {
      if (prev.includes(devisId)) {
        // Retirer le devis
        const newSelected = prev.filter(id => id !== devisId);
        // Si c'était le devis principal, le retirer
        if (devisPrincipalId === devisId) {
          setDevisPrincipalId(null);
        }
        return newSelected;
      } else {
        // Ajouter le devis
        const newSelected = [...prev, devisId];
        // Si c'est le premier devis, le définir comme principal
        if (newSelected.length === 1) {
          setDevisPrincipalId(devisId);
        }
        return newSelected;
      }
    });
  };

  const handleDevisPrincipalChange = (devisId: number) => {
    setDevisPrincipalId(devisId);
  };

  const handleConfirm = () => {
    if (selectedDevisIds.length === 0) {
      toast.error('Veuillez sélectionner au moins un devis');
      return;
    }

    if (!devisPrincipalId) {
      toast.error('Veuillez sélectionner un devis principal');
      return;
    }

    onConfirm(selectedDevisIds, devisPrincipalId);
    onClose();
  };

  const handleClose = () => {
    setSelectedDevisIds([]);
    setDevisPrincipalId(null);
    onClose();
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent>
          <div className="flex items-center justify-center p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Instructions */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Instructions</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Sélectionnez un ou plusieurs devis acceptés du client</li>
              <li>• Choisissez un devis principal (utilisé pour les paramètres par défaut)</li>
              <li>• Vous pouvez ajouter ou retirer des devis de ce contrat</li>
              {selectedClientId && (
                <li>• Affichage des devis pour le client sélectionné uniquement</li>
              )}
            </ul>
          </div>

          {/* Liste des devis disponibles */}
          <div className="space-y-3">
            <h4 className="font-medium">Devis disponibles pour ce client ({availableDevis.length})</h4>
            
            {availableDevis.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <p>Aucun devis disponible pour ce client</p>
                <p className="text-sm mt-2">Tous les devis de ce client sont déjà associés à des contrats</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {availableDevis.map((devis) => (
                  <Card 
                    key={devis.id} 
                    className={`cursor-pointer transition-colors ${
                      selectedDevisIds.includes(devis.id) 
                        ? 'ring-2 ring-blue-500 bg-blue-50' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleDevisToggle(devis.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{devis.numero}</CardTitle>
                          <p className="text-sm text-gray-600">{devis.client.nom_complet}</p>
                        </div>
                        <Checkbox 
                          checked={selectedDevisIds.includes(devis.id)}
                          onChange={() => handleDevisToggle(devis.id)}
                        />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Montant TTC:</span>
                          <span className="font-medium">{formatMontant(devis.montant_ttc)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Statut:</span>
                          <Badge variant="secondary">{devis.statut_display}</Badge>
                        </div>
                      </div>

                      {/* Sélection devis principal */}
                      {/* {selectedDevisIds.includes(devis.id) && (
                        <div className="mt-3 pt-3 border-t">
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              checked={devisPrincipalId === devis.id}
                              onChange={() => handleDevisPrincipalChange(devis.id)}
                            />
                            <Label className="text-sm font-medium">
                              Définir comme devis principal
                            </Label>
                          </div>
                        </div>
                      )} */}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Devis déjà associés au contrat */}
          {existingDevisIds.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-600">Devis déjà associés à ce contrat ({existingDevisIds.length})</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">
                  Ces devis sont déjà associés au contrat et ne peuvent pas être modifiés ici.
                </p>
              </div>
            </div>
          )}

          {/* Résumé */}
          {selectedDevisIds.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Résumé de la sélection</h4>
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="font-medium">Devis sélectionnés:</span> {selectedDevisIds.length}
                </p>
                {devisPrincipalId && (
                  <p className="text-sm">
                    <span className="font-medium">Devis principal:</span> {
                      availableDevis.find(d => d.id === devisPrincipalId)?.numero
                    }
                  </p>
                )}
                <p className="text-sm">
                  <span className="font-medium">Montant total estimé:</span> {
                    availableDevis
                      .filter(d => selectedDevisIds.includes(d.id))
                      .reduce((sum, d) => sum + d.montant_ttc, 0)
                      .toLocaleString()
                  } €
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={handleClose}>
              Annuler
            </Button>
            <Button 
              onClick={handleConfirm}
              disabled={selectedDevisIds.length === 0 || !devisPrincipalId}
            >
              {existingDevisIds.length > 0 ? 'Ajouter les devis sélectionnés' : 'Confirmer la sélection'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 