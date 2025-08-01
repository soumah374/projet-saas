import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { ClientProfile } from '@/hooks/use-clients';

interface ClientDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: ClientProfile | null;
}

export function ClientDetailModal({
  open,
  onOpenChange,
  client
}: ClientDetailModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Détail du client</DialogTitle>
        </DialogHeader>
        {client && (
          <div className="space-y-2">
            <div><b>Nom complet :</b> {client.nom_complet}</div>
            <div><b>Email :</b> {client.email}</div>
            <div><b>Téléphone :</b> {client.telephone}</div>
            <div><b>Type :</b> {client.type_client_display}</div>
            <div><b>Statut commercial :</b> {client.statut_commercial_display}</div>
            {client.type_client === 'personne_morale' && (
              <>
                <div><b>Raison sociale :</b> {client.raison_sociale}</div>
                <div><b>RCCM/NIF :</b> {client.rccm_nif}</div>
                <div><b>Contact :</b> {client.contact}</div>
              </>
            )}
            <div><b>Adresse complète :</b> {client.adresse_complete}</div>
            <div><b>Adresse :</b> {client.adresse}</div>
            <div><b>Ville :</b> {client.ville}</div>
            <div><b>Code postal :</b> {client.code_postal}</div>
            <div><b>Pays :</b> {client.pays}</div>
            <div><b>Date d'inscription :</b> {new Date(client.date_inscription).toLocaleString()}</div>
            <div><b>Statut :</b> <span className={client.is_active ? 'text-green-600' : 'text-red-600'}>{client.is_active ? 'Actif' : 'Inactif'}</span></div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 