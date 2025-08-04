import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useConfigurationFacturation } from '@/hooks/use-factures';

interface ConfigurationFacturationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConfigurationFacturationModal: React.FC<ConfigurationFacturationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { configuration, loading, error, fetchConfiguration, updateConfiguration } = useConfigurationFacturation();
  
  const [formData, setFormData] = useState({
    facturation_automatique: true,
    delai_avant_echeance: 7,
    relance_automatique: true,
    prefixe_facture: 'FAC',
    format_numero: 'FAC{year}{numero:04d}',
    conditions_paiement_defaut: 'Paiement à 30 jours',
    iban_defaut: '',
    bic_defaut: '',
    compte_bancaire_defaut: '',
  });

  useEffect(() => {
    if (isOpen) {
      fetchConfiguration();
    }
  }, [isOpen, fetchConfiguration]);

  useEffect(() => {
    if (configuration) {
      setFormData({
        facturation_automatique: configuration.facturation_automatique,
        delai_avant_echeance: configuration.delai_avant_echeance,
        relance_automatique: configuration.relance_automatique,
        prefixe_facture: configuration.prefixe_facture,
        format_numero: configuration.format_numero,
        conditions_paiement_defaut: configuration.conditions_paiement_defaut,
        iban_defaut: configuration.iban_defaut || '',
        bic_defaut: configuration.bic_defaut || '',
        compte_bancaire_defaut: configuration.compte_bancaire_defaut || '',
      });
    }
  }, [configuration]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = await updateConfiguration(formData);
    if (result) {
      onClose();
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configuration de la Facturation</DialogTitle>
          <DialogDescription>
            Configurez les paramètres de facturation automatique et les informations par défaut.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Paramètres généraux */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Paramètres généraux</h3>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Facturation automatique</Label>
                <p className="text-sm text-muted-foreground">
                  Générer automatiquement les factures selon les échéances
                </p>
              </div>
              <Switch
                checked={formData.facturation_automatique}
                onCheckedChange={(checked) => handleInputChange('facturation_automatique', checked)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="delai_avant_echeance">Délai avant échéance (jours)</Label>
              <Input
                id="delai_avant_echeance"
                type="number"
                value={formData.delai_avant_echeance}
                onChange={(e) => handleInputChange('delai_avant_echeance', parseInt(e.target.value))}
                min="1"
                max="30"
              />
              <p className="text-xs text-muted-foreground">
                Nombre de jours avant l'échéance pour générer automatiquement la facture
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Relances automatiques</Label>
                <p className="text-sm text-muted-foreground">
                  Envoyer automatiquement des relances pour les factures en retard
                </p>
              </div>
              <Switch
                checked={formData.relance_automatique}
                onCheckedChange={(checked) => handleInputChange('relance_automatique', checked)}
              />
            </div>
          </div>

          {/* Numérotation */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Numérotation</h3>
            
            <div className="space-y-2">
              <Label htmlFor="prefixe_facture">Préfixe facture</Label>
              <Input
                id="prefixe_facture"
                value={formData.prefixe_facture}
                onChange={(e) => handleInputChange('prefixe_facture', e.target.value)}
                placeholder="FAC"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="format_numero">Format numéro</Label>
              <Input
                id="format_numero"
                value={formData.format_numero}
                onChange={(e) => handleInputChange('format_numero', e.target.value)}
                placeholder="FAC{year}{numero:04d}"
              />
              <p className="text-xs text-muted-foreground">
                Variables disponibles: {'{year}'}, {'{numero}'}
              </p>
            </div>
          </div>

          {/* Conditions de paiement */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Conditions de paiement</h3>
            
            <div className="space-y-2">
              <Label htmlFor="conditions_paiement_defaut">Conditions par défaut</Label>
              <Textarea
                id="conditions_paiement_defaut"
                value={formData.conditions_paiement_defaut}
                onChange={(e) => handleInputChange('conditions_paiement_defaut', e.target.value)}
                placeholder="Paiement à 30 jours"
                rows={3}
              />
            </div>
          </div>

          {/* Informations bancaires */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Informations bancaires par défaut</h3>
            
            <div className="space-y-2">
              <Label htmlFor="iban_defaut">IBAN par défaut</Label>
              <Input
                id="iban_defaut"
                value={formData.iban_defaut}
                onChange={(e) => handleInputChange('iban_defaut', e.target.value)}
                placeholder="GN123456789012345678901234"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bic_defaut">BIC par défaut</Label>
              <Input
                id="bic_defaut"
                value={formData.bic_defaut}
                onChange={(e) => handleInputChange('bic_defaut', e.target.value)}
                placeholder="BICGN123"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="compte_bancaire_defaut">Compte bancaire par défaut</Label>
              <Input
                id="compte_bancaire_defaut"
                value={formData.compte_bancaire_defaut}
                onChange={(e) => handleInputChange('compte_bancaire_defaut', e.target.value)}
                placeholder="1234567890"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 