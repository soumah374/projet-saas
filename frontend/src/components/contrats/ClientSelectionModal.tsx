import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, User, Mail, Phone, MapPin } from 'lucide-react';
import { useClients } from '@/hooks/use-clients';
import { toast } from 'sonner';

interface ClientSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (clientId: number) => void;
  title?: string;
}

export const ClientSelectionModal: React.FC<ClientSelectionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Sélectionner le client"
}) => {
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { data: clientsData, isLoading } = useClients({
    search: searchTerm,
    page_size: 100
  });

  const clients = clientsData?.results || [];

  const handleClientSelect = (clientId: number) => {
    setSelectedClientId(clientId);
  };

  const handleConfirm = () => {
    if (!selectedClientId) {
      toast.error('Veuillez sélectionner un client');
      return;
    }

    onConfirm(selectedClientId);
    onClose();
  };

  const handleClose = () => {
    setSelectedClientId(null);
    setSearchTerm('');
    onClose();
  };

  const filteredClients = clients.filter(client =>
    client.nom_complet.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <p className="text-sm text-blue-800">
              Sélectionnez le client pour lequel vous souhaitez créer un contrat. 
              Ensuite, vous pourrez choisir les devis associés à ce client.
            </p>
          </div>

          {/* Recherche */}
          <div className="space-y-2">
            <Label htmlFor="search">Rechercher un client</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="search"
                placeholder="Nom, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Liste des clients */}
          <div className="space-y-3">
            <h4 className="font-medium">Clients disponibles ({filteredClients.length})</h4>
            
            {filteredClients.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <p>Aucun client trouvé</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredClients.map((client) => (
                  <Card 
                    key={client.id} 
                    className={`cursor-pointer transition-colors ${
                      selectedClientId === client.id 
                        ? 'ring-2 ring-blue-500 bg-blue-50' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleClientSelect(client.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{client.nom_complet}</CardTitle>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="h-4 w-4" />
                            {client.email}
                          </div>
                        </div>
                        <input
                          type="radio"
                          name="selected_client"
                          checked={selectedClientId === client.id}
                          onChange={() => handleClientSelect(client.id)}
                          className="text-blue-600"
                        />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {client.telephone && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone className="h-4 w-4" />
                            {client.telephone}
                          </div>
                        )}
                        {client.adresse && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="h-4 w-4" />
                            {client.adresse}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">Statut:</span>
                          <Badge variant={client.is_active ? "default" : "secondary"}>
                            {client.is_active ? "Actif" : "Inactif"}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={handleClose}>
              Annuler
            </Button>
            <Button 
              onClick={handleConfirm}
              disabled={!selectedClientId}
            >
              Confirmer la sélection
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 