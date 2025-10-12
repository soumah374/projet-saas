import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, X } from 'lucide-react';
import { useUpdateAvenant, TYPE_MODIFICATION_CHOICES, TypeModification, Avenant } from '@/hooks/use-avenants';
import { toast } from 'sonner';

interface EditAvenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  avenant: Avenant | null;
}

interface Modification {
  clause: string;
  ancienne_version: string;
  nouvelle_version: string;
}

export const EditAvenantModal: React.FC<EditAvenantModalProps> = ({
  isOpen,
  onClose,
  avenant,
}) => {
  const [intituleAvenant, setIntituleAvenant] = useState('');
  const [objetAvenant, setObjetAvenant] = useState('');
  const [typeModification, setTypeModification] = useState<TypeModification>('modifier');
  const [modifications, setModifications] = useState<Modification[]>([]);
  const [contenuPersonnalise, setContenuPersonnalise] = useState('');

  const updateAvenantMutation = useUpdateAvenant();

  // Initialiser les valeurs quand l'avenant change
  useEffect(() => {
    if (avenant) {
      setIntituleAvenant(avenant.intitule_avenant);
      setObjetAvenant(avenant.objet_avenant);
      setTypeModification(avenant.type_modification);
      setModifications(avenant.modifications || []);
      setContenuPersonnalise(avenant.contenu_personnalise || '');
    }
  }, [avenant]);

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

    if (!avenant) return;

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
      await updateAvenantMutation.mutateAsync({
        id: avenant.id,
        data: {
          intitule_avenant: intituleAvenant,
          objet_avenant: objetAvenant,
          type_modification: typeModification,
          modifications: modifications,
          contenu_personnalise: contenuPersonnalise,
        }
      });

      onClose();
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const handleClose = () => {
    // Reset form
    if (avenant) {
      setIntituleAvenant(avenant.intitule_avenant);
      setObjetAvenant(avenant.objet_avenant);
      setTypeModification(avenant.type_modification);
      setModifications(avenant.modifications || []);
      setContenuPersonnalise(avenant.contenu_personnalise || '');
    }
    onClose();
  };

  if (!avenant) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier l'avenant {avenant.numero}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations de base */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="intitule">Intitulé de l'avenant *</Label>
              <Input
                id="intitule"
                value={intituleAvenant}
                onChange={(e) => setIntituleAvenant(e.target.value)}
                placeholder="Ex: Avenant pour prolongation de durée"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type de modification *</Label>
              <Select value={typeModification} onValueChange={(value: TypeModification) => setTypeModification(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_MODIFICATION_CHOICES.map((choice) => (
                    <SelectItem key={choice.value} value={choice.value}>
                      {choice.label}
                    </SelectItem>
                  ))}
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
            />
          </div>

          {/* Modifications */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Modifications apportées</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {modifications.map((modification, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
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

                  <div className="space-y-3">
                    <div>
                      <Label>Clause modifiée</Label>
                      <Input
                        value={modification.clause}
                        onChange={(e) => handleModificationChange(index, 'clause', e.target.value)}
                        placeholder="Ex: Article 4 - Durée du contrat"
                      />
                    </div>

                    <div className="flex flex-col gap-3">
                      <div>
                        <Label>Ancienne version</Label>
                        <Textarea
                          value={modification.ancienne_version}
                          onChange={(e) => handleModificationChange(index, 'ancienne_version', e.target.value)}
                          placeholder="Ancienne version de la clause..."
                          rows={3}
                        />
                      </div>

                      <div>
                        <Label>Nouvelle version</Label>
                        <Textarea
                          value={modification.nouvelle_version}
                          onChange={(e) => handleModificationChange(index, 'nouvelle_version', e.target.value)}
                          placeholder="Nouvelle version de la clause..."
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={handleAddModification}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une modification
              </Button>
            </CardContent>
          </Card>

          {/* Contenu personnalisé */}
          <div className="space-y-2">
            <Label htmlFor="contenu">Contenu personnalisé (optionnel)</Label>
            <Textarea
              id="contenu"
              value={contenuPersonnalise}
              onChange={(e) => setContenuPersonnalise(e.target.value)}
              placeholder="Contenu personnalisé de l'avenant..."
              rows={6}
            />
            <p className="text-sm text-gray-500">
              Laissez vide pour utiliser le template par défaut
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={handleClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={updateAvenantMutation.isPending}>
              {updateAvenantMutation.isPending ? 'Modification...' : 'Modifier l\'avenant'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 