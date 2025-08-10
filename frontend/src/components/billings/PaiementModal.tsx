import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { Facture } from '@/hooks/use-factures';
import { cn } from '@/lib/utils';

interface PaiementModalProps {
  facture: Facture | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    facture: number;
    montant: number;
    date_paiement: string;
    mode_paiement: string;
    reference_paiement?: string;
    notes?: string;
  }) => void;
  loading?: boolean;
}

const formatMontant = (montant: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'GNF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(montant);
};

export const PaiementModal: React.FC<PaiementModalProps> = ({
  facture,
  isOpen,
  onClose,
  onSubmit,
  loading = false,
}) => {
  const [montant, setMontant] = useState('');
  const [datePaiement, setDatePaiement] = useState<Date>(new Date());
  const [modePaiement, setModePaiement] = useState('virement');
  const [referencePaiement, setReferencePaiement] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!facture || !montant) return;

    const montantNum = parseFloat(montant);
    if (montantNum <= 0) {
      alert('Le montant doit être supérieur à 0');
      return;
    }

    if (montantNum > facture.montant_restant) {
      alert(`Le montant ne peut pas dépasser ${formatMontant(facture.montant_restant)}`);
      return;
    }

    onSubmit({
      facture: facture.id,
      montant: montantNum,
      date_paiement: format(datePaiement, 'yyyy-MM-dd'),
      mode_paiement: modePaiement,
      reference_paiement: referencePaiement || undefined,
      notes: notes || undefined,
    });

    // Reset form
    setMontant('');
    setDatePaiement(new Date());
    setModePaiement('virement');
    setReferencePaiement('');
    setNotes('');
  };

  const handleClose = () => {
    onClose();
    // Reset form
    setMontant('');
    setDatePaiement(new Date());
    setModePaiement('virement');
    setReferencePaiement('');
    setNotes('');
  };

  if (!facture) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Enregistrer un paiement</DialogTitle>
          <DialogDescription>
            Enregistrer un paiement pour la facture {facture.numero}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Informations de la facture */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">Facture:</span>
              <span className="text-sm font-semibold">{facture.numero}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">Client:</span>
              <span className="text-sm">{facture.client_nom}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">Montant TTC:</span>
              <span className="text-sm font-semibold">{formatMontant(facture.montant_ttc)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">Déjà payé:</span>
              <span className="text-sm">{formatMontant(facture.montant_paye)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">Restant à payer:</span>
              <span className="text-sm font-semibold text-orange-600">
                {formatMontant(facture.montant_restant)}
              </span>
            </div>
          </div>

          {/* Montant du paiement */}
          <div className="space-y-2">
            <Label htmlFor="montant">Montant du paiement *</Label>
            <Input
              id="montant"
              type="number"
              value={montant}
              onChange={(e) => setMontant(e.target.value)}
              placeholder="0"
              min="0"
              max={facture.montant_restant}
              step="0.01"
              required
            />
            <p className="text-xs text-gray-500">
              Montant maximum: {formatMontant(facture.montant_restant)}
            </p>
          </div>

          {/* Date de paiement */}
          <div className="space-y-2">
            <Label htmlFor="date_paiement">Date de paiement *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !datePaiement && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {datePaiement ? format(datePaiement, "PPP", { locale: fr }) : <span>Sélectionner une date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={datePaiement}
                  onSelect={(date) => date && setDatePaiement(date)}
                  initialFocus
                  disabled={(date) => date > new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Mode de paiement */}
          <div className="space-y-2">
            <Label htmlFor="mode_paiement">Mode de paiement *</Label>
            <Select value={modePaiement} onValueChange={setModePaiement}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un mode de paiement" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="virement">Virement bancaire</SelectItem>
                <SelectItem value="cheque">Chèque</SelectItem>
                <SelectItem value="especes">Espèces</SelectItem>
                <SelectItem value="carte">Carte bancaire</SelectItem>
                <SelectItem value="mobile_money">Mobile Money</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Référence de paiement */}
          <div className="space-y-2">
            <Label htmlFor="reference_paiement">Référence de paiement</Label>
            <Input
              id="reference_paiement"
              value={referencePaiement}
              onChange={(e) => setReferencePaiement(e.target.value)}
              placeholder="Numéro de transaction, référence chèque, etc."
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Informations supplémentaires sur le paiement"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading || !montant}>
              {loading ? 'Enregistrement...' : 'Enregistrer le paiement'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 