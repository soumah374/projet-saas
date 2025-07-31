import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, CheckCircle } from 'lucide-react';
import { useSignerAvenant } from '@/hooks/use-avenants';
import { Avenant } from '@/hooks/use-avenants';
import { toast } from 'sonner';

interface SignerAvenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  avenant: Avenant;
}

export const SignerAvenantModal: React.FC<SignerAvenantModalProps> = ({
  isOpen,
  onClose,
  avenant,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const signerAvenantMutation = useSignerAvenant();

  const handleFileSelect = (file: File) => {
    // Vérifier le type de fichier
    if (!file.type.includes('pdf') && !file.type.includes('image/')) {
      toast.error('Veuillez sélectionner un fichier PDF ou une image');
      return;
    }

    // Vérifier la taille (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Le fichier est trop volumineux (max 10MB)');
      return;
    }

    setSelectedFile(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      toast.error('Veuillez sélectionner un fichier');
      return;
    }

    try {
      await signerAvenantMutation.mutateAsync({
        id: avenant.id,
        fichier_signe: selectedFile,
      });

      setSelectedFile(null);
      onClose();
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setDragActive(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Signer l'avenant {avenant.numero}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations de l'avenant */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Informations de l'avenant</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Intitulé:</span> {avenant.intitule_avenant}
              </div>
              <div>
                <span className="font-medium">Type:</span> {avenant.type_modification_display}
              </div>
              <div>
                <span className="font-medium">Statut actuel:</span> {avenant.statut_display}
              </div>
            </CardContent>
          </Card>

          {/* Upload du fichier */}
          <div className="space-y-4">
            <Label htmlFor="file">Fichier de l'avenant signé *</Label>
            
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragActive
                  ? 'border-blue-500 bg-blue-50'
                  : selectedFile
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {selectedFile ? (
                <div className="space-y-2">
                  <CheckCircle className="h-8 w-8 mx-auto text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">{selectedFile.name}</p>
                    <p className="text-sm text-green-600">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedFile(null)}
                  >
                    Changer de fichier
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-8 w-8 mx-auto text-gray-400" />
                  <div>
                    <p className="font-medium">Glissez-déposez votre fichier ici</p>
                    <p className="text-sm text-gray-500">ou cliquez pour sélectionner</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('file-input')?.click()}
                  >
                    Sélectionner un fichier
                  </Button>
                </div>
              )}
            </div>

            <input
              id="file-input"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileSelect(e.target.files[0]);
                }
              }}
              className="hidden"
            />
          </div>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Instructions</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-600 space-y-2">
              <p>• Formats acceptés: PDF, JPG, JPEG, PNG</p>
              <p>• Taille maximale: 10 MB</p>
              <p>• Assurez-vous que le fichier est lisible et complet</p>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={!selectedFile || signerAvenantMutation.isPending}
            >
              {signerAvenantMutation.isPending ? 'Signature...' : 'Signer l\'avenant'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 