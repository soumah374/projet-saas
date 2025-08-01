import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, X } from 'lucide-react';
import { useCreateAvenant } from '@/hooks/use-avenants';
import { toast } from 'sonner';

interface CreateAvenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  contratId: number;
  contratNumero: string;
}

interface Modification {
  clause: string;
  ancienne_version: string;
  nouvelle_version: string;
}

export const CreateAvenantModal: React.FC<CreateAvenantModalProps> = ({
  isOpen,
  onClose,
  contratId,
  contratNumero,
}) => {
  const [intituleAvenant, setIntituleAvenant] = useState('');
  const [objetAvenant, setObjetAvenant] = useState('');
  const [typeModification, setTypeModification] = useState<'modifier' | 'completer' | 'preciser' | 'prolonger' | 'reduire' | 'annuler'>('modifier');
  const [modifications, setModifications] = useState<Modification[]>([]);
  const [contenuPersonnalise, setContenuPersonnalise] = useState('');

  const createAvenantMutation = useCreateAvenant();

  const handleAddModification = () => {
    setModifications([
      ...modifications,
      { clause: '', ancienne_version: '', nouvelle_version: '' }
    ]);
  };

  const handleRemoveModification = (index: number) => {
    setModifications(modifications.filter((_, i) => i !== index));
  };

  const handleModificationChange = (index: number, field: keyof Modification, value: string) => {
    const newModifications = [...modifications];
    newModifications[index] = { ...newModifications[index], [field]: value };
    setModifications(newModifications);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!intituleAvenant.trim() || !objetAvenant.trim()) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (modifications.length === 0) {
      toast.error('Veuillez ajouter au moins une modification');
      return;
    }

    // Vérifier que toutes les modifications ont des valeurs
    const hasEmptyModifications = modifications.some(
      mod => !mod.clause.trim() || !mod.ancienne_version.trim() || !mod.nouvelle_version.trim()
    );

    if (hasEmptyModifications) {
      toast.error('Veuillez remplir tous les champs des modifications');
      return;
    }

    try {
      await createAvenantMutation.mutateAsync({
        data: {
          contrat_id: contratId,
          intitule_avenant: intituleAvenant,
          objet_avenant: objetAvenant,
          type_modification: typeModification,
          modifications: modifications,
          contenu_personnalise: contenuPersonnalise,
        }
      });

      // Reset form
      setIntituleAvenant('');
      setObjetAvenant('');
      setTypeModification('modifier');
      setModifications([]);
      setContenuPersonnalise('');
      onClose();
    } catch (error: any) {
      // L'erreur est déjà gérée par la mutation avec toast
      console.error('Erreur lors de la création de l\'avenant:', error);
    }
  };

  const handleClose = () => {
    setIntituleAvenant('');
    setObjetAvenant('');
    setTypeModification('modifier');
    setModifications([]);
    setContenuPersonnalise('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Créer un avenant pour le contrat {contratNumero}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations générales */}
          <Card>
            <CardHeader>
              <CardTitle>Informations générales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="intitule">Intitulé de l'avenant *</Label>
                  <Input
                    id="intitule"
                    value={intituleAvenant}
                    onChange={(e) => setIntituleAvenant(e.target.value)}
                    placeholder="Ex: Avenant n°1 au contrat de prestation"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type de modification *</Label>
                  <Select value={typeModification} onValueChange={(value: any) => setTypeModification(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="modifier">Modifier</SelectItem>
                      <SelectItem value="completer">Compléter</SelectItem>
                      <SelectItem value="preciser">Préciser</SelectItem>
                      <SelectItem value="prolonger">Prolonger</SelectItem>
                      <SelectItem value="reduire">Réduire</SelectItem>
                      <SelectItem value="annuler">Annuler</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="objet">Objet de l'avenant *</Label>
                <Textarea
                  id="objet"
                  value={objetAvenant}
                  onChange={(e) => setObjetAvenant(e.target.value)}
                  placeholder="Décrivez l'objet de cet avenant..."
                  rows={3}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Modifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Modifications
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddModification}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter une modification
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {modifications.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  Aucune modification ajoutée. Cliquez sur "Ajouter une modification" pour commencer.
                </p>
              ) : (
                modifications.map((modification, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Modification {index + 1}</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveModification(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <Label>Clause modifiée *</Label>
                        <Input
                          value={modification.clause}
                          onChange={(e) => handleModificationChange(index, 'clause', e.target.value)}
                          placeholder="Ex: Article 4 – Durée du contrat"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Ancienne version *</Label>
                        <Textarea
                          value={modification.ancienne_version}
                          onChange={(e) => handleModificationChange(index, 'ancienne_version', e.target.value)}
                          placeholder="Ancienne version de la clause..."
                          rows={2}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Nouvelle version *</Label>
                        <Textarea
                          value={modification.nouvelle_version}
                          onChange={(e) => handleModificationChange(index, 'nouvelle_version', e.target.value)}
                          placeholder="Nouvelle version de la clause..."
                          rows={2}
                          required
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Contenu personnalisé */}
          <Card>
            <CardHeader>
              <CardTitle>Contenu personnalisé (optionnel)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="contenu">Contenu HTML personnalisé</Label>
                <Textarea
                  id="contenu"
                  value={contenuPersonnalise}
                  onChange={(e) => setContenuPersonnalise(e.target.value)}
                  placeholder="Contenu HTML personnalisé pour l'avenant..."
                  rows={6}
                />
                <p className="text-sm text-muted-foreground">
                  Laissez vide pour utiliser le template par défaut avec les variables automatiques.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={createAvenantMutation.isPending}
            >
              {createAvenantMutation.isPending ? 'Création...' : 'Créer l\'avenant'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 