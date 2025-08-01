import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Building, 
  FileText,
  ExternalLink 
} from 'lucide-react';
import type { ClientProfile } from '@/hooks/use-clients';

interface ClientDetailsCardProps {
  client: ClientProfile;
  onEdit?: () => void;
  showEditButton?: boolean;
}

export function ClientDetailsCard({ client, onEdit, showEditButton = false }: ClientDetailsCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'actif':
        return 'bg-green-100 text-green-800';
      case 'prospect':
        return 'bg-blue-100 text-blue-800';
      case 'inactif':
        return 'bg-gray-100 text-gray-800';
      case 'bloque':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    return type === 'personne_morale' 
      ? 'bg-purple-100 text-purple-800' 
      : 'bg-orange-100 text-orange-800';
  };

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
        {/* Nom et statut */}
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">{client.nom_complet}</h3>
          <div className="flex gap-2">
            <Badge className={getStatusColor(client.statut_commercial)}>
              {client.statut_commercial_display}
            </Badge>
            <Badge className={getTypeColor(client.type_client)}>
              {client.type_client_display}
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

        {/* Informations pour personne morale */}
        {client.type_client === 'personne_morale' && (
          <div className="space-y-3 border-t pt-3">
            {client.raison_sociale && (
              <div className="flex items-center gap-2 text-sm">
                <Building className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{client.raison_sociale}</span>
              </div>
            )}
            
            {client.rccm_nif && (
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span>RCCM/NIF: {client.rccm_nif}</span>
              </div>
            )}
            
            {client.contact && (
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>Contact: {client.contact}</span>
              </div>
            )}
          </div>
        )}

        {/* Adresse */}
        {(client.adresse || client.ville || client.code_postal || client.pays) && (
          <div className="space-y-2 border-t pt-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              Adresse
            </div>
            <div className="text-sm text-muted-foreground pl-6">
              {client.adresse_complete && (
                <p>{client.adresse_complete}</p>
              )}
              {!client.adresse_complete && (
                <p>
                  {[client.adresse, client.ville, client.code_postal, client.pays]
                    .filter(Boolean)
                    .join(', ')}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Informations supplémentaires */}
        <div className="space-y-2 border-t pt-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Inscrit le</span>
            <span>{new Date(client.date_inscription).toLocaleDateString('fr-FR')}</span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Statut</span>
            <Badge variant={client.is_active ? "default" : "secondary"}>
              {client.is_active ? 'Actif' : 'Inactif'}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 