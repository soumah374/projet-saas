import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  Send, 
  FileText, 
  Edit, 
  Trash2, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  XCircle
} from 'lucide-react';
import { Avenant } from '@/hooks/use-avenants';
import { useDownloadAvenantPDF, useEnvoyerAvenant, useAnnulerAvenant } from '@/hooks/use-avenants';
import { toast } from 'sonner';

interface AvenantCardProps {
  avenant: Avenant;
  onEdit?: (avenant: Avenant) => void;
  onDelete?: (avenant: Avenant) => void;
}

export const AvenantCard: React.FC<AvenantCardProps> = ({
  avenant,
  onEdit,
  onDelete,
}) => {
  const downloadPDFMutation = useDownloadAvenantPDF();
  const envoyerMutation = useEnvoyerAvenant();
  const annulerMutation = useAnnulerAvenant();

  const getStatusIcon = () => {
    switch (avenant.statut) {
      case 'signe':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'envoye':
        return <Send className="h-4 w-4 text-blue-600" />;
      case 'brouillon':
        return <Clock className="h-4 w-4 text-gray-600" />;
      case 'annule':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusColor = () => {
    switch (avenant.statut) {
      case 'signe':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'envoye':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'brouillon':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'annule':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const handleDownloadPDF = () => {
    downloadPDFMutation.mutate({ contratId: avenant.contrat.id, id: avenant.id });
  };

  const handleEnvoyer = (avenant: Avenant) => {
    console.log(avenant);
    console.log(avenant);
    envoyerMutation.mutate({ contratId: avenant.contrat.id, id: avenant.id });
  };

  const handleAnnuler = (avenant: Avenant) => {
    if (confirm('Êtes-vous sûr de vouloir annuler cet avenant ?')) {
      annulerMutation.mutate(avenant.id);
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <CardTitle className="text-lg">{avenant.numero}</CardTitle>
          </div>
          <Badge className={getStatusColor()}>
            {avenant.statut_display}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Informations principales */}
        <div className="space-y-2">
          <div>
            <h4 className="font-medium text-gray-900">{avenant.intitule_avenant}</h4>
            <p className="text-sm text-gray-600">{avenant.objet_avenant}</p>
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span>Type: {avenant.type_modification_display}</span>
            <span>•</span>
            <span>Créé le: {new Date(avenant.date_creation).toLocaleDateString('fr-FR')}</span>
            {avenant.date_signature && (
              <>
                <span>•</span>
                <span>Signé le: {new Date(avenant.date_signature).toLocaleDateString('fr-FR')}</span>
              </>
            )}
          </div>
        </div>

        {/* Modifications */}
        {avenant.modifications && avenant.modifications.length > 0 && (
          <div className="space-y-2">
            <h5 className="font-medium text-sm text-gray-700">Modifications:</h5>
            <div className="space-y-2">
              {avenant.modifications.slice(0, 2).map((mod, index) => (
                <div key={index} className="text-sm bg-gray-50 p-2 rounded">
                  <span className="font-medium">{mod.clause}</span>
                </div>
              ))}
              {avenant.modifications.length > 2 && (
                <p className="text-sm text-gray-500">
                  +{avenant.modifications.length - 2} autres modifications
                </p>
              )}
            </div>
          </div>
        )}

        {/* Fichier signé */}
        {avenant.fichier_signe && (
          <div className="flex items-center space-x-2 text-sm text-green-600">
            <FileText className="h-4 w-4" />
            <span>Fichier signé disponible</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center space-x-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPDF}
            disabled={downloadPDFMutation.isPending}
          >
            <Download className="h-4 w-4 mr-1" />
            PDF
          </Button>

          {avenant.statut === 'brouillon' && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={()=>handleEnvoyer(avenant)}
                disabled={envoyerMutation.isPending}
              >
                <Send className="h-4 w-4 mr-1" />
                Envoyer
              </Button>
              
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(avenant)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Modifier
                </Button>
              )}
            </>
          )}

          {avenant.statut === 'envoye' && (
            <Button
              variant="outline"
              size="sm"
              onClick={()=>handleAnnuler(avenant)}
              disabled={annulerMutation.isPending}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Annuler
            </Button>
          )}

          {onDelete && avenant.statut === 'brouillon' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(avenant)}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Supprimer
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}; 