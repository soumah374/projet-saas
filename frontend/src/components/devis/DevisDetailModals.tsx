import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { formatMontant } from '@/lib/formatters';
import type { Devis } from '@/hooks/use-devis';

interface DevisDetailModalsProps {
  // Modal d'envoi
  envoyerDialogOpen: boolean;
  setEnvoyerDialogOpen: (open: boolean) => void;
  onEnvoyer: () => void;
  isEnvoyerPending: boolean;
  
  // Modal d'acceptation
  accepterDialogOpen: boolean;
  setAccepterDialogOpen: (open: boolean) => void;
  onAccepter: () => void;
  isAccepterPending: boolean;
  
  // Modal de refus
  refuserDialogOpen: boolean;
  setRefuserDialogOpen: (open: boolean) => void;
  onRefuser: () => void;
  isRefuserPending: boolean;
  
  // Données du devis
  devis: Devis | null;
}

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

const DevisInfoCard: React.FC<{ devis: Devis }> = ({ devis }) => (
  <div className="bg-gray-50 p-4 rounded-lg">
    <div className="grid grid-cols-1 gap-4 text-sm">
      <div>
        <span className="font-medium">Numéro :</span>
        <p className="text-gray-600">{devis.numero}</p>
      </div>
      <div>
        <span className="font-medium">Client :</span>
        <p className="text-gray-600">{devis.client.nom_complet}</p>
      </div>
      <div>
        <span className="font-medium">Date de création :</span>
        <p className="text-gray-600">{new Date(devis.date_creation).toLocaleDateString()}</p>
      </div>
      <div>
        <span className="font-medium">Date de validité :</span>
        <p className="text-gray-600">{new Date(devis.date_validite).toLocaleDateString()}</p>
      </div>
      <div>
        <span className="font-medium">Statut :</span>
        <div className="mt-1">
          {getStatutBadge(devis.statut)}
        </div>
      </div>
      <div>
        <span className="font-medium">Montants :</span>
        <div className="mt-1 space-y-1 text-xs">
          <div>HT : {formatMontant(devis.montant_ht)}</div>
          <div>TVA : {formatMontant(devis.montant_tva)}</div>
          <div>TTC : {formatMontant(devis.montant_ttc)}</div>
        </div>
      </div>
    </div>
  </div>
);

export const DevisDetailModals: React.FC<DevisDetailModalsProps> = ({
  // Modal d'envoi
  envoyerDialogOpen,
  setEnvoyerDialogOpen,
  onEnvoyer,
  isEnvoyerPending,
  
  // Modal d'acceptation
  accepterDialogOpen,
  setAccepterDialogOpen,
  onAccepter,
  isAccepterPending,
  
  // Modal de refus
  refuserDialogOpen,
  setRefuserDialogOpen,
  onRefuser,
  isRefuserPending,
  
  // Données du devis
  devis,
}) => {
  return (
    <>
      {/* Dialog de confirmation d'envoi de devis */}
      <Dialog open={envoyerDialogOpen} onOpenChange={setEnvoyerDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Envoi du devis</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600">
              Êtes-vous sûr de vouloir envoyer ce devis ?
            </p>
            {devis && <DevisInfoCard devis={devis} />}
            <p className="text-sm text-blue-600">
              Une fois envoyé, le devis ne pourra plus être modifié.
            </p>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setEnvoyerDialogOpen(false)}
              disabled={isEnvoyerPending}
            >
              Annuler
            </Button>
            <Button 
              variant="default" 
              onClick={onEnvoyer}
              disabled={isEnvoyerPending}
            >
              {isEnvoyerPending ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={16}/>
                  Envoi...
                </>
              ) : (
                'Envoyer'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmation d'acceptation de devis */}
      <Dialog open={accepterDialogOpen} onOpenChange={setAccepterDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Acceptation du devis</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600">
              Êtes-vous sûr de vouloir accepter ce devis ?
            </p>
            {devis && <DevisInfoCard devis={devis} />}
            <div className="space-y-2">
              <p className="text-sm text-green-600">
                Une fois accepté, le devis deviendra définitif.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setAccepterDialogOpen(false)}
              disabled={isAccepterPending}
            >
              Annuler
            </Button>
            <Button 
              variant="default" 
              onClick={onAccepter}
              disabled={isAccepterPending}
            >
              {isAccepterPending ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={16}/>
                  Acceptation...
                </>
              ) : (
                'Accepter'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmation de refus de devis */}
      <Dialog open={refuserDialogOpen} onOpenChange={setRefuserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refus du devis</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600">
              Êtes-vous sûr de vouloir refuser ce devis ?
            </p>
            {devis && <DevisInfoCard devis={devis} />}
            <p className="text-sm text-red-600">
              Une fois refusé, le devis ne pourra plus être modifié et sera marqué comme refusé.
            </p>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setRefuserDialogOpen(false)}
              disabled={isRefuserPending}
            >
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={onRefuser}
              disabled={isRefuserPending}
            >
              {isRefuserPending ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={16}/>
                  Refus...
                </>
              ) : (
                'Refuser'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}; 