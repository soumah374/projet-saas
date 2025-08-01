import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { ClientProfile } from '@/hooks/use-clients';

interface DeleteClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: ClientProfile | null;
  onDelete: (client: ClientProfile) => Promise<void>;
  isPending: boolean;
}

export function DeleteClientModal({
  open,
  onOpenChange,
  client,
  onDelete,
  isPending
}: DeleteClientModalProps) {
  const handleDelete = async () => {
    if (client) {
      await onDelete(client);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Supprimer le client</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-gray-600">
            Êtes-vous sûr de vouloir supprimer ce client ?
          </p>
          {client && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 gap-4 text-sm">
                <div>
                  <span className="font-medium">Nom complet :</span>
                  <p className="text-gray-600">{client.nom_complet}</p>
                </div>
                <div>
                  <span className="font-medium">Email :</span>
                  <p className="text-gray-600">{client.email}</p>
                </div>
                <div>
                  <span className="font-medium">Téléphone :</span>
                  <p className="text-gray-600">{client.telephone}</p>
                </div>
                <div>
                  <span className="font-medium">Type :</span>
                  <p className="text-gray-600">{client.type_client_display}</p>
                </div>
                <div>
                  <span className="font-medium">Statut commercial :</span>
                  <p className="text-gray-600">{client.statut_commercial_display}</p>
                </div>
                <div>
                  <span className="font-medium">Ville :</span>
                  <p className="text-gray-600">{client.ville}</p>
                </div>
                <div>
                  <span className="font-medium">Pays :</span>
                  <p className="text-gray-600">{client.pays}</p>
                </div>
                <div>
                  <span className="font-medium">Statut :</span>
                  <div className="mt-1">
                    <span className={client.is_active ? 'text-green-600' : 'text-red-600'}>
                      {client.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <p className="text-sm text-red-600">
            Cette action est irréversible et supprimera définitivement ce client et toutes ses données associées.
          </p>
        </div>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={isPending}
          >
            Annuler
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={isPending}
          >
            Supprimer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 