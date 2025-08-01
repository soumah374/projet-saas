import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin,
  ExternalLink 
} from 'lucide-react';
import type { ClientProfile } from '@/lib/types';

interface ClientDetailsCardProps {
  client: ClientProfile;
  onEdit?: () => void;
  showEditButton?: boolean;
}

export function ClientDetailsCard({ client, onEdit, showEditButton = false }: ClientDetailsCardProps) {
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <User className="h-5 w-5" />
          Informations client
        </CardTitle>
        {showEditButton && onEdit && (
          <Button variant="outline" size="sm" onClick={onEdit}>
            Modifier
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Nom */}
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">{client.nom_complet}</h3>
          <div className="flex gap-2">
            <Badge className={client.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
              {client.is_active ? 'Actif' : 'Inactif'}
            </Badge>
          </div>
        </div>

        {/* Informations de contact */}
        <div className="space-y-3">
          {client.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{client.email}</span>
            </div>
          )}
          
          {client.telephone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{client.telephone}</span>
            </div>
          )}
        </div>

        {/* Adresse */}
        {(client.adresse || client.ville || client.code_postal || client.pays) && (
          <div className="space-y-2 border-t pt-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              Adresse
            </div>
            <div className="text-sm text-muted-foreground pl-6">
              <p>
                {[client.adresse, client.ville, client.code_postal, client.pays]
                  .filter(Boolean)
                  .join(', ')}
              </p>
            </div>
          </div>
        )}

        {/* Informations supplémentaires */}
        <div className="space-y-2 border-t pt-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Créé le</span>
            <span>{new Date(client.created_at).toLocaleDateString('fr-FR')}</span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Dernière mise à jour</span>
            <span>{new Date(client.updated_at).toLocaleDateString('fr-FR')}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 