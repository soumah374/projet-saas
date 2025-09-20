import React, { useState, useEffect } from 'react';
import { X, Save, HelpCircle, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { emailTemplateService } from '@/services/emailTemplateService';
import { EmailTemplate, EmailTemplateCreate, EmailTemplateVariable, EMAIL_TYPES } from '@/types/email-template';

interface EmailTemplateFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  template?: EmailTemplate | null;
}

export const EmailTemplateFormModal: React.FC<EmailTemplateFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  template
}) => {
  const [formData, setFormData] = useState<EmailTemplateCreate>({
    nom: '',
    type_email: '',
    sujet: '',
    contenu: '',
    est_actif: true,
    est_defaut: false
  });
  const [variables, setVariables] = useState<EmailTemplateVariable[]>([]);
  const [loading, setLoading] = useState(false);
  const [showVariables, setShowVariables] = useState(true);

  useEffect(() => {
    if (isOpen) {
      if (template) {
        setFormData({
          nom: template.nom,
          type_email: template.type_email,
          sujet: template.sujet,
          contenu: template.contenu,
          est_actif: template.est_actif,
          est_defaut: template.est_defaut
        });
      } else {
        setFormData({
          nom: '',
          type_email: '',
          sujet: '',
          contenu: '',
          est_actif: true,
          est_defaut: false
        });
      }
      loadVariables();
    }
  }, [isOpen, template]);

  const loadVariables = async () => {
    try {
      const variablesByType = await emailTemplateService.getVariablesByType();
      const allVariables = Object.values(variablesByType).flatMap(group => group.variables);
      setVariables(allVariables);
    } catch (error) {
      console.error('Erreur lors du chargement des variables:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (template) {
        await emailTemplateService.updateTemplate(template.id, formData);
        toast.success('Template mis à jour avec succès');
      } else {
        await emailTemplateService.createTemplate(formData);
        toast.success('Template créé avec succès');
      }
      onSuccess();
    } catch (error: any) {
      const errorMessage = error.response?.data?.non_field_errors?.[0] || 
                          error.response?.data?.message || 
                          'Erreur lors de la sauvegarde du template';
      toast.error(errorMessage);
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const insertVariableIntoField = (fieldName: 'sujet' | 'contenu', variable: string) => {
    const variableText = `{{${variable}}}`;
    
    if (fieldName === 'sujet') {
      const currentText = formData.sujet;
      setFormData(prev => ({ 
        ...prev, 
        sujet: currentText + (currentText ? ' ' : '') + variableText 
      }));
    } else {
      const textarea = document.getElementById('contenu') as HTMLTextAreaElement;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = formData.contenu;
        const before = text.substring(0, start);
        const after = text.substring(end, text.length);
        const newText = before + variableText + after;
        
        setFormData(prev => ({ ...prev, contenu: newText }));
        
        // Repositionner le curseur après l'insertion
        setTimeout(() => {
          textarea.focus();
          const newPosition = start + variableText.length;
          textarea.setSelectionRange(newPosition, newPosition);
        }, 0);
      } else {
        // Fallback si le textarea n'est pas trouvé
        setFormData(prev => ({ 
          ...prev, 
          contenu: prev.contenu + (prev.contenu ? '\n' : '') + variableText 
        }));
      }
    }
  };

  // Filtrer les variables selon le type d'email sélectionné
  const currentTypeVariables = variables.filter(v => v.type_email === formData.type_email);

  // Variables statiques par type d'email (basées sur la documentation)
  const getStaticVariables = (type: string) => {
    const variablesMap: Record<string, Array<{name: string, description: string, example: string}>> = {
      'devis': [
        { name: 'numero', description: 'Numéro du devis', example: 'DEV-2024-001' },
        { name: 'client_nom', description: 'Nom du client', example: 'Dupont' },
        { name: 'client_prenom', description: 'Prénom du client', example: 'Jean' },
        { name: 'client_raison_sociale', description: 'Raison sociale', example: 'Entreprise SARL' },
        { name: 'montant_ht', description: 'Montant HT', example: '1500.00' },
        { name: 'montant_ttc', description: 'Montant TTC', example: '1800.00' },
        { name: 'date_creation', description: 'Date de création', example: '15/01/2024' },
        { name: 'date_validite', description: 'Date de validité', example: '15/02/2024' }
      ],
      'contrat': [
        { name: 'numero', description: 'Numéro du contrat', example: 'CTR-2024-001' },
        { name: 'client_nom', description: 'Nom du client', example: 'Dupont' },
        { name: 'client_prenom', description: 'Prénom du client', example: 'Jean' },
        { name: 'client_raison_sociale', description: 'Raison sociale', example: 'Entreprise SARL' },
        { name: 'montant_total', description: 'Montant total', example: '5000.00' },
        { name: 'date_debut', description: 'Date de début', example: '01/02/2024' },
        { name: 'date_fin', description: 'Date de fin', example: '31/12/2024' }
      ],
      'avenant': [
        { name: 'numero', description: 'Numéro de l\'avenant', example: 'AVE-2024-001' },
        { name: 'contrat_numero', description: 'Numéro du contrat principal', example: 'CTR-2024-001' },
        { name: 'client_nom', description: 'Nom du client', example: 'Dupont' },
        { name: 'client_prenom', description: 'Prénom du client', example: 'Jean' },
        { name: 'client_raison_sociale', description: 'Raison sociale', example: 'Entreprise SARL' }
      ],
      'facture': [
        { name: 'numero', description: 'Numéro de facture', example: 'FAC-2024-001' },
        { name: 'client_nom', description: 'Nom du client', example: 'Dupont' },
        { name: 'client_prenom', description: 'Prénom du client', example: 'Jean' },
        { name: 'montant_ht', description: 'Montant HT', example: '2000.00' },
        { name: 'montant_ttc', description: 'Montant TTC', example: '2400.00' },
        { name: 'date_facture', description: 'Date de facture', example: '01/03/2024' },
        { name: 'date_echeance', description: 'Date d\'échéance', example: '31/03/2024' }
      ],
      'relance': [
        { name: 'numero_facture', description: 'Numéro de facture', example: 'FAC-2024-001' },
        { name: 'client_nom', description: 'Nom du client', example: 'Dupont' },
        { name: 'montant_du', description: 'Montant dû', example: '2400.00' },
        { name: 'jours_retard', description: 'Jours de retard', example: '15' },
        { name: 'date_echeance', description: 'Date d\'échéance', example: '31/03/2024' }
      ],
      'rappel': [
        { name: 'client_nom', description: 'Nom du client', example: 'Dupont' },
        { name: 'objet', description: 'Objet du rappel', example: 'Rendez-vous prévu' },
        { name: 'date_rappel', description: 'Date du rappel', example: '15/04/2024' }
      ]
    };
    return variablesMap[type] || [];
  };

  const staticVariables = getStaticVariables(formData.type_email);
  const displayVariables = staticVariables.length > 0 ? staticVariables : currentTypeVariables.map(v => ({
    name: v.nom_variable,
    description: v.description,
    example: v.exemple
  }));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {template ? 'Modifier le template' : 'Créer un nouveau template'}
          </DialogTitle>
          <DialogDescription>
            Créez ou modifiez un template d'email personnalisable.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nom">Nom du template</Label>
              <Input
                id="nom"
                value={formData.nom}
                onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
                placeholder="Ex: Template Devis Standard"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type_email">Type d'email</Label>
              <Select
                value={formData.type_email}
                onValueChange={(value) => setFormData(prev => ({ ...prev, type_email: value }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  {EMAIL_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="sujet">Sujet de l'email</Label>
              {displayVariables.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowVariables(!showVariables)}
                  className="text-xs"
                >
                  <HelpCircle className="h-3 w-3 mr-1" />
                  Variables ({displayVariables.length})
                </Button>
              )}
            </div>
            <div className="relative">
              <Input
                id="sujet"
                value={formData.sujet}
                onChange={(e) => setFormData(prev => ({ ...prev, sujet: e.target.value }))}
                placeholder="Ex: Votre devis n°{{numero}}"
                required
              />
              {displayVariables.length > 0 && (
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                  {displayVariables.slice(0, 3).map((variable, index) => (
                    <Button
                      key={`quick-${index}`}
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => insertVariableIntoField('sujet', variable.name)}
                      className="h-6 px-2 text-xs text-blue-600 hover:text-blue-700"
                      title={`Insérer {{${variable.name}}} - ${variable.description}`}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="contenu">Contenu de l'email</Label>
              {displayVariables.length > 0 && (
                <div className="flex gap-1">
                  {displayVariables.slice(0, 4).map((variable, index) => (
                    <Button
                      key={`content-quick-${index}`}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => insertVariableIntoField('contenu', variable.name)}
                      className="h-6 px-2 text-xs"
                      title={`${variable.description} - Ex: ${variable.example}`}
                    >
                      {`{{${variable.name}}}`}
                    </Button>
                  ))}
                </div>
              )}
            </div>
            <Textarea
              id="contenu"
              value={formData.contenu}
              onChange={(e) => setFormData(prev => ({ ...prev, contenu: e.target.value }))}
              placeholder="Bonjour {{client_prenom}} {{client_nom}}..."
              rows={6}
              required
            />
          </div>

          {/* Variables disponibles */}
          {formData.type_email && displayVariables.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Variables disponibles pour {EMAIL_TYPES.find(t => t.value === formData.type_email)?.label}</CardTitle>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowVariables(!showVariables)}
                  >
                    {showVariables ? <X className="h-4 w-4" /> : <HelpCircle className="h-4 w-4" />}
                  </Button>
                </div>
                <CardDescription className="text-xs">
                  Cliquez sur une variable pour l'insérer dans le sujet ou le contenu
                </CardDescription>
              </CardHeader>
              {showVariables && (
                <CardContent className="pt-0">
                <div className="space-y-4">
                  {/* Liste organisée des variables */}
                  <div className="grid grid-cols-1 gap-3 max-h-80 overflow-y-auto pr-2">
                    {displayVariables.map((variable, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <code className="text-sm font-mono bg-white px-2 py-1 rounded border">
                              {`{{${variable.name}}}`}
                            </code>
                            <span className="text-sm font-medium text-gray-700">
                              {variable.description}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">
                            Exemple : <span className="font-mono">{variable.example}</span>
                          </p>
                        </div>
                        <div className="flex gap-1 ml-3">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => insertVariableIntoField('sujet', variable.name)}
                            className="h-8 px-3 text-xs hover:bg-blue-50 hover:border-blue-300"
                            title="Insérer dans le sujet"
                          >
                            Sujet
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => insertVariableIntoField('contenu', variable.name)}
                            className="h-8 px-3 text-xs hover:bg-green-50 hover:border-green-300"
                            title="Insérer dans le contenu"
                          >
                            Contenu
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-3 p-3 bg-gray-50 rounded-md">
                  <p className="text-xs text-gray-600">
                    <strong>Astuce :</strong> Les variables seront automatiquement remplacées par les vraies valeurs lors de l'envoi des emails.
                  </p>
                </div>
                </CardContent>
              )}
            </Card>
          )}

          <div className="flex gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="est_actif"
                checked={formData.est_actif}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, est_actif: checked }))}
              />
              <Label htmlFor="est_actif">Template actif</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="est_defaut"
                checked={formData.est_defaut}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, est_defaut: checked }))}
              />
              <Label htmlFor="est_defaut">Template par défaut</Label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              {loading ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};