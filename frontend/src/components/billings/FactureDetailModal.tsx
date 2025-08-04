import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Calendar, 
  DollarSign, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Download,
  CreditCard,
  User,
  Building,
  Receipt
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Facture } from '@/hooks/use-factures';

interface FactureDetailModalProps {
  facture: Facture | null;
  isOpen: boolean;
  onClose: () => void;
  onPaiement?: (facture: Facture) => void;
  onPDF?: (facture: Facture) => void;
}

const formatMontant = (montant: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'GNF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(montant);
};

const getStatutColor = (statut: Facture['statut']) => {
  switch (statut) {
    case 'payee':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'emise':
      return 'bg-blue-100 text-blue-800 border-green-200';
    case 'envoyee':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'en_retard':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'partiellement_payee':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'annulee':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getStatutLabel = (statut: Facture['statut']) => {
  switch (statut) {
    case 'payee':
      return 'Payée';
    case 'emise':
      return 'Émise';
    case 'envoyee':
      return 'Envoyée';
    case 'en_retard':
      return 'En retard';
    case 'partiellement_payee':
      return 'Partiellement payée';
    case 'annulee':
      return 'Annulée';
    case 'brouillon':
      return 'Brouillon';
    default:
      return statut;
  }
};

export const FactureDetailModal: React.FC<FactureDetailModalProps> = ({
  facture,
  isOpen,
  onClose,
  onPaiement,
  onPDF,
}) => {
  if (!facture) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Détails de la facture {facture.numero}</span>
          </DialogTitle>
          <DialogDescription>
            Informations complètes de la facture et historique des paiements
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* En-tête avec statut */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">{facture.numero}</h3>
              <p className="text-sm text-muted-foreground">
                Client: {facture.client_nom}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={getStatutColor(facture.statut)}>
                {getStatutLabel(facture.statut)}
              </Badge>
              {onPDF && (
                <Button variant="outline" size="sm" onClick={() => onPDF(facture)}>
                  <Download className="h-4 w-4 mr-2" />
                  PDF
                </Button>
              )}
            </div>
          </div>

          {/* Informations principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center space-x-2">
                  <Building className="h-4 w-4" />
                  <span>Informations contrat</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Contrat:</span>
                  <span className="text-sm">{facture.contrat_numero}</span>
                </div>
                {facture.echeance_numero && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Échéance:</span>
                    <span className="text-sm">#{facture.echeance_numero}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Mode de paiement:</span>
                  <span className="text-sm capitalize">{facture.mode_paiement}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>Dates</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Émission:</span>
                  <span className="text-sm">
                    {format(new Date(facture.date_emission), 'dd/MM/yyyy', { locale: fr })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Échéance:</span>
                  <span className="text-sm">
                    {format(new Date(facture.date_echeance), 'dd/MM/yyyy', { locale: fr })}
                  </span>
                </div>
                {facture.date_paiement && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Paiement:</span>
                    <span className="text-sm text-green-600">
                      {format(new Date(facture.date_paiement), 'dd/MM/yyyy', { locale: fr })}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Montants */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center space-x-2">
                <DollarSign className="h-4 w-4" />
                <span>Montants</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-600">
                    {formatMontant(facture.montant_ht)}
                  </div>
                  <div className="text-xs text-muted-foreground">Montant HT</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-600">
                    {formatMontant(facture.montant_tva)}
                  </div>
                  <div className="text-xs text-muted-foreground">TVA ({facture.taux_tva}%)</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">
                    {formatMontant(facture.montant_ttc)}
                  </div>
                  <div className="text-xs text-muted-foreground">Montant TTC</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-orange-600">
                    {formatMontant(facture.montant_restant)}
                  </div>
                  <div className="text-xs text-muted-foreground">Restant</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lignes de facture */}
          {facture.lignes && facture.lignes.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center space-x-2">
                  <Receipt className="h-4 w-4" />
                  <span>Lignes de facture</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {facture.lignes.map((ligne, index) => (
                    <div key={ligne.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <div className="flex-1">
                        <div className="font-medium">{ligne.description}</div>
                        <div className="text-sm text-muted-foreground">
                          {ligne.quantite} x {formatMontant(ligne.prix_unitaire_ht)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{formatMontant(ligne.montant_ht)}</div>
                        <div className="text-xs text-muted-foreground capitalize">
                          {ligne.type_ligne}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Historique des paiements */}
          {facture.paiements && facture.paiements.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center space-x-2">
                  <CreditCard className="h-4 w-4" />
                  <span>Historique des paiements</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {facture.paiements.map((paiement) => (
                    <div key={paiement.id} className="flex justify-between items-center p-2 bg-green-50 rounded">
                      <div className="flex-1">
                        <div className="font-medium">{formatMontant(paiement.montant)}</div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(paiement.date_paiement), 'dd/MM/yyyy', { locale: fr })} - {paiement.mode_paiement}
                        </div>
                        {paiement.reference_paiement && (
                          <div className="text-xs text-muted-foreground">
                            Réf: {paiement.reference_paiement}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(paiement.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Informations bancaires */}
          {(facture.iban || facture.bic || facture.compte_bancaire) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center space-x-2">
                  <Building className="h-4 w-4" />
                  <span>Informations bancaires</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {facture.iban && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">IBAN:</span>
                    <span className="text-sm font-mono">{facture.iban}</span>
                  </div>
                )}
                {facture.bic && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">BIC:</span>
                    <span className="text-sm font-mono">{facture.bic}</span>
                  </div>
                )}
                {facture.compte_bancaire && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Compte:</span>
                    <span className="text-sm font-mono">{facture.compte_bancaire}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {facture.notes && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span>Notes</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{facture.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            {onPaiement && facture.montant_restant > 0 && (
              <Button onClick={() => onPaiement(facture)}>
                <CreditCard className="h-4 w-4 mr-2" />
                Enregistrer un paiement
              </Button>
            )}
            <Button variant="outline" onClick={onClose}>
              Fermer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 