import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDevisDisponibles } from '@/hooks/use-contrats';
import { toast } from 'sonner';
import { formatMontant } from '@/lib/formatters';
import { CalendarIcon, Plus, Trash2, Wand2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { fr } from 'date-fns/locale';
import { format, addMonths, addDays } from 'date-fns';

interface Echeance {
  numero: number;
  type: 'acompte' | 'tranche' | 'solde';
  pourcentage: number;
  date_echeance: string;
  commentaire: string;
}

interface DevisSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedDevisIds: number[], devisPrincipalId: number, echeances?: Echeance[]) => void;
  existingDevisIds?: number[];
  selectedClientId?: number;
  title?: string;
  contratMontantTtc?: number;
}

export const DevisSelectionModal: React.FC<DevisSelectionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  existingDevisIds = [],
  selectedClientId,
  title = "Sélectionner les devis",
  contratMontantTtc = 0
}) => {
  const [selectedDevisIds, setSelectedDevisIds] = useState<number[]>([]);
  const [devisPrincipalId, setDevisPrincipalId] = useState<number | null>(null);
  const [echeances, setEcheances] = useState<Echeance[]>([
    { numero: 1, type: 'acompte', pourcentage: 30, date_echeance: '', commentaire: 'Acompte à la signature' },
    { numero: 2, type: 'tranche', pourcentage: 40, date_echeance: '', commentaire: 'Tranche intermédiaire' },
    { numero: 3, type: 'solde', pourcentage: 30, date_echeance: '', commentaire: 'Solde à la réception' }
  ]);
  const [showEcheancesConfig, setShowEcheancesConfig] = useState(false);
  const [intervalType, setIntervalType] = useState<'monthly' | 'custom'>('monthly');
  const [customDays, setCustomDays] = useState<number>(30);
  
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

  const handleAddEcheance = () => {
    const newNumero = echeances.length + 1;
    setEcheances([...echeances, {
      numero: newNumero,
      type: 'tranche',
      pourcentage: 0,
      date_echeance: '',
      commentaire: `Tranche ${newNumero}`
    }]);
  };

  const handleRemoveEcheance = (numero: number) => {
    setEcheances(echeances.filter(e => e.numero !== numero).map((e, index) => ({
      ...e,
      numero: index + 1
    })));
  };

  const handleEcheanceChange = (numero: number, field: keyof Echeance, value: any) => {
    setEcheances(echeances.map(e =>
      e.numero === numero ? { ...e, [field]: value } : e
    ));
  };

  const handleCalculateAutomaticDates = () => {
    const startDate = new Date(); // Commence aujourd'hui
    const updatedEcheances = echeances.map((echeance, index) => {
      let calculatedDate: Date;

      if (intervalType === 'monthly') {
        // Ajouter un mois pour chaque échéance (1er mois pour la 1ère échéance, etc.)
        calculatedDate = addMonths(startDate, index + 1);
      } else {
        // Ajouter des jours personnalisés pour chaque échéance
        calculatedDate = addDays(startDate, (index + 1) * customDays);
      }

      return {
        ...echeance,
        date_echeance: calculatedDate.toISOString().split('T')[0]
      };
    });

    setEcheances(updatedEcheances);
    toast.success('Les dates ont été calculées automatiquement');
  };

  const getTotalPourcentage = () => {
    return echeances.reduce((sum, e) => sum + (e.pourcentage || 0), 0);
  };

  const getNouvelleTotalContrat = () => {
    const nouveauDevisMontant = availableDevis
      .filter(d => selectedDevisIds.includes(d.id))
      .reduce((sum, d) => sum + d.montant_ttc, 0);
    return nouveauDevisMontant;
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

    // Validation des échéances si configurées
    if (showEcheancesConfig && existingDevisIds.length > 0) {
      const totalPourcentage = getTotalPourcentage();
      if (Math.abs(totalPourcentage - 100) > 0.01) {
        toast.error(`Le total des pourcentages doit être 100% (actuellement ${totalPourcentage.toFixed(2)}%)`);
        return;
      }

      const missingDates = echeances.some(e => !e.date_echeance);
      if (missingDates) {
        toast.error('Veuillez définir toutes les dates d\'échéance');
        return;
      }
    }

    onConfirm(selectedDevisIds, devisPrincipalId, showEcheancesConfig ? echeances : undefined);
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
                    <span className="font-medium">Devis :</span> {
                      availableDevis.find(d => d.id === devisPrincipalId)?.numero
                    }
                  </p>
                )}
                <p className="text-sm">
                  <span className="font-medium">Montant nouveaux devis:</span> {
                    formatMontant(availableDevis
                      .filter(d => selectedDevisIds.includes(d.id))
                      .reduce((sum, d) => sum + d.montant_ttc, 0))
                  }
                </p>
                {existingDevisIds.length > 0 && (
                  <>
                    <p className="text-sm">
                      <span className="font-medium">Montant contrat actuel:</span> {formatMontant(contratMontantTtc)}
                    </p>
                    <p className="text-sm font-bold text-blue-600">
                      <span className="font-medium">Nouveau montant total contrat:</span> {formatMontant(getNouvelleTotalContrat())}
                    </p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Configuration des échéances (uniquement pour ajout à contrat existant) */}
          {selectedDevisIds.length > 0 && existingDevisIds.length > 0 && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CalendarIcon size={18} />
                      Configuration des échéances
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Définissez les échéances de paiement pour le nouveau montant total du contrat
                    </p>
                  </div>
                  <Checkbox
                    checked={showEcheancesConfig}
                    onCheckedChange={(checked) => setShowEcheancesConfig(checked as boolean)}
                  />
                </div>
              </CardHeader>
              {showEcheancesConfig && (
                <CardContent className="space-y-4">
                  <div className="bg-white p-4 rounded-lg">
                    <h4 className="font-medium mb-2 text-sm">⚠️ Important</h4>
                    <p className="text-xs text-gray-600">
                      Les échéances seront recalculées sur le <strong>nouveau montant total du contrat</strong> ({formatMontant(getNouvelleTotalContrat())})
                      qui inclut les nouveaux devis.
                    </p>
                  </div>

                  {/* Calcul automatique des dates */}
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-medium mb-3 text-sm flex items-center gap-2">
                      <Wand2 size={16} />
                      Calcul automatique des dates
                    </h4>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Type d'intervalle</Label>
                          <Select
                            value={intervalType}
                            onValueChange={(value) => setIntervalType(value as 'monthly' | 'custom')}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="monthly">Mensuel</SelectItem>
                              <SelectItem value="custom">Personnalisé (jours)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {intervalType === 'custom' && (
                          <div>
                            <Label className="text-xs">Intervalle (jours)</Label>
                            <Input
                              type="number"
                              min="1"
                              value={customDays}
                              onChange={(e) => setCustomDays(parseInt(e.target.value) || 30)}
                              className="mt-1"
                              placeholder="30"
                            />
                          </div>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCalculateAutomaticDates}
                        className="w-full bg-white hover:bg-blue-100"
                      >
                        <Wand2 size={14} className="mr-2" />
                        Calculer les dates automatiquement
                      </Button>
                      <p className="text-xs text-gray-600">
                        {intervalType === 'monthly'
                          ? "Les dates seront espacées d'un mois à partir d'aujourd'hui"
                          : `Les dates seront espacées de ${customDays} jours à partir d'aujourd'hui`
                        }
                      </p>
                    </div>
                  </div>

                  {/* Liste des échéances */}
                  <div className="space-y-3">
                    {echeances.map((echeance) => (
                      <div key={echeance.numero} className="bg-white p-4 rounded-lg border">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-medium">Échéance {echeance.numero}</h5>
                          {echeances.length > 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveEcheance(echeance.numero)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 size={14} />
                            </Button>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">Type</Label>
                            <Select
                              value={echeance.type}
                              onValueChange={(value) => handleEcheanceChange(echeance.numero, 'type', value)}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="acompte">Acompte</SelectItem>
                                <SelectItem value="tranche">Tranche</SelectItem>
                                <SelectItem value="solde">Solde</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs">Pourcentage</Label>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={echeance.pourcentage}
                              onChange={(e) => handleEcheanceChange(echeance.numero, 'pourcentage', parseFloat(e.target.value) || 0)}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Date d'échéance</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="w-full justify-start text-left font-normal mt-1"
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {echeance.date_echeance ? (
                                    format(new Date(echeance.date_echeance), 'dd/MM/yyyy', { locale: fr })
                                  ) : (
                                    <span>Choisir une date</span>
                                  )}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start" side="bottom" sideOffset={4}>
                                <Calendar
                                  mode="single"
                                  selected={echeance.date_echeance ? new Date(echeance.date_echeance) : undefined}
                                  onSelect={(date) => {
                                    if (date) {
                                      handleEcheanceChange(echeance.numero, 'date_echeance', date.toISOString().split('T')[0]);
                                    }
                                  }}
                                  initialFocus
                                  locale={fr}
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                          <div>
                            <Label className="text-xs">Montant estimé</Label>
                            <div className="mt-1 px-3 py-2 bg-gray-50 border rounded-md text-sm font-medium">
                              {formatMontant((getNouvelleTotalContrat() * echeance.pourcentage) / 100)}
                            </div>
                          </div>
                          <div className="col-span-2">
                            <Label className="text-xs">Commentaire</Label>
                            <Input
                              value={echeance.commentaire}
                              onChange={(e) => handleEcheanceChange(echeance.numero, 'commentaire', e.target.value)}
                              className="mt-1"
                              placeholder="Description de l'échéance"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Bouton ajouter échéance */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddEcheance}
                    className="w-full"
                  >
                    <Plus size={14} className="mr-2" />
                    Ajouter une échéance
                  </Button>

                  {/* Résumé des échéances */}
                  <div className={`p-3 rounded-lg border-2 ${
                    Math.abs(getTotalPourcentage() - 100) < 0.01
                      ? 'bg-green-50 border-green-300'
                      : 'bg-red-50 border-red-300'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">Total des pourcentages:</span>
                      <span className={`font-bold ${
                        Math.abs(getTotalPourcentage() - 100) < 0.01
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}>
                        {getTotalPourcentage().toFixed(2)}%
                      </span>
                    </div>
                    {Math.abs(getTotalPourcentage() - 100) > 0.01 && (
                      <p className="text-xs text-red-600 mt-1">
                        Le total doit être égal à 100%
                      </p>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
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