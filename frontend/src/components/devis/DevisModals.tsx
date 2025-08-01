import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatMontant } from '@/lib/formatters';
import type { Devis } from '@/hooks/use-devis';

interface DevisModalsProps {
  // Modal de suppression
  deleteDialogOpen: boolean;
  setDeleteDialogOpen: (open: boolean) => void;
  devisToDelete: Devis | null;
  setDevisToDelete: (devis: Devis | null) => void;
  onDelete: () => void;
  
  // Modal d'envoi
  envoyerDialogOpen: boolean;
  setEnvoyerDialogOpen: (open: boolean) => void;
  devisToEnvoyer: Devis | null;
  setDevisToEnvoyer: (devis: Devis | null) => void;
  onEnvoyer: () => void;
  
  // Modal d'acceptation
  accepterDialogOpen: boolean;
  setAccepterDialogOpen: (open: boolean) => void;
  devisToAccepter: Devis | null;
  setDevisToAccepter: (devis: Devis | null) => void;
  onAccepter: () => void;
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

export const DevisModals: React.FC<DevisModalsProps> = ({
  // Modal de suppression
  deleteDialogOpen,
  setDeleteDialogOpen,
  devisToDelete,
  setDevisToDelete,
  onDelete,
  
  // Modal d'envoi
  envoyerDialogOpen,
  setEnvoyerDialogOpen,
  devisToEnvoyer,
  setDevisToEnvoyer,
  onEnvoyer,
  
  // Modal d'acceptation
  accepterDialogOpen,
  setAccepterDialogOpen,
  devisToAccepter,
  setDevisToAccepter,
  onAccepter,
}) => {
  return (
    <>
      {/* Dialog de suppression de devis */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le devis</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600">
              Êtes-vous sûr de vouloir supprimer ce devis ?
            </p>
            {devisToDelete && <DevisInfoCard devis={devisToDelete} />}
            <p className="text-sm text-red-600">
              Cette action est irréversible et supprimera également toutes les lignes de devis et intervenants associés.
            </p>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setDeleteDialogOpen(false);
                setDevisToDelete(null);
              }}
            >
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={onDelete}
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            {devisToEnvoyer && <DevisInfoCard devis={devisToEnvoyer} />}
            <p className="text-sm text-blue-600">
              Une fois envoyé, le devis ne pourra plus être modifié.
            </p>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setEnvoyerDialogOpen(false);
                setDevisToEnvoyer(null);
              }}
            >
              Annuler
            </Button>
            <Button 
              variant="default" 
              onClick={onEnvoyer}
            >
              Envoyer
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
            {devisToAccepter && <DevisInfoCard devis={devisToAccepter} />}
            <p className="text-sm text-green-600">
              Une fois accepté, le devis deviendra définitif.
            </p>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setAccepterDialogOpen(false);
                setDevisToAccepter(null);
              }}
            >
              Annuler
            </Button>
            <Button 
              variant="default" 
              onClick={onAccepter}
            >
              Accepter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}; 