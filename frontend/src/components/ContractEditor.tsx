import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Edit, 
  Eye, 
  Download, 
  Save, 
  FileText, 
  Settings,
  Copy,
  Check
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  ContractTemplateData, 
  DEFAULT_CONTRACT_TEMPLATE, 
  generateContractFromTemplate,
  generateDefaultContractData 
} from '@/lib/contractTemplate';

interface ContractEditorProps {
  contrat: any;
  devis: any;
  onSave?: (template: string, data: ContractTemplateData) => void;
  onGeneratePDF?: (contractText: string) => void;
}

export function ContractEditor({ contrat, devis, onSave, onGeneratePDF }: ContractEditorProps) {
  const [template, setTemplate] = useState(DEFAULT_CONTRACT_TEMPLATE);
  const [templateData, setTemplateData] = useState<ContractTemplateData>({} as ContractTemplateData);
  const [previewMode, setPreviewMode] = useState(false);
  const [editDataDialogOpen, setEditDataDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Générer les données par défaut au chargement
  useEffect(() => {
    if (contrat && devis) {
      const defaultData = generateDefaultContractData(contrat, devis);
      setTemplateData(defaultData);
    }
  }, [contrat, devis]);

  const generatedContract = generateContractFromTemplate(template, templateData);

  const handleSaveTemplate = () => {
    if (onSave) {
      onSave(template, templateData);
      toast.success('Template sauvegardé');
    }
  };

  const handleGeneratePDF = () => {
    if (onGeneratePDF) {
      onGeneratePDF(generatedContract);
    }
  };

  const handleCopyContract = async () => {
    try {
      await navigator.clipboard.writeText(generatedContract);
      setCopied(true);
      toast.success('Contrat copié dans le presse-papiers');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Erreur lors de la copie');
    }
  };

  const updateTemplateData = (field: keyof ContractTemplateData, value: string) => {
    setTemplateData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Header avec actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Éditeur de contrat</h2>
          <p className="text-gray-600">Personnalisez le template et générez le contrat final</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setEditDataDialogOpen(true)}
          >
            <Settings size={16} className="mr-2" />
            Données
          </Button>
          <Button
            variant="outline"
            onClick={() => setPreviewMode(!previewMode)}
          >
            {previewMode ? <Edit size={16} className="mr-2" /> : <Eye size={16} className="mr-2" />}
            {previewMode ? 'Éditer' : 'Aperçu'}
          </Button>
          <Button
            variant="outline"
            onClick={handleCopyContract}
          >
            {copied ? <Check size={16} className="mr-2" /> : <Copy size={16} className="mr-2" />}
            {copied ? 'Copié' : 'Copier'}
          </Button>
          <Button
            variant="outline"
            onClick={handleSaveTemplate}
          >
            <Save size={16} className="mr-2" />
            Sauvegarder
          </Button>
          <Button onClick={handleGeneratePDF}>
            <Download size={16} className="mr-2" />
            Générer PDF
          </Button>
        </div>
      </div>

      {/* Contenu principal */}
      <Tabs defaultValue="template" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="template">Template</TabsTrigger>
          <TabsTrigger value="preview">Aperçu</TabsTrigger>
        </TabsList>
        
        <TabsContent value="template" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Template du contrat</CardTitle>
              <p className="text-sm text-gray-600">
                {/* Utilisez les variables entre {{ }} pour insérer les données dynamiques */}
              </p>
            </CardHeader>
            <CardContent>
              <Textarea
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                className="min-h-[600px] font-mono text-sm"
                placeholder="Entrez votre template de contrat..."
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Aperçu du contrat généré</CardTitle>
              <p className="text-sm text-gray-600">
                Contrat généré avec les données actuelles
              </p>
            </CardHeader>
            <CardContent>
              <div className="bg-white border rounded-lg p-6 min-h-[600px] overflow-auto">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                  {generatedContract}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal d'édition des données */}
      <Dialog open={editDataDialogOpen} onOpenChange={setEditDataDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier les données du contrat</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Informations prestataire */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Informations prestataire</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Raison sociale</Label>
                  <Input
                    value={templateData.raison_sociale_prestataire || ''}
                    onChange={(e) => updateTemplateData('raison_sociale_prestataire', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Forme juridique</Label>
                  <Input
                    value={templateData.forme_juridique || ''}
                    onChange={(e) => updateTemplateData('forme_juridique', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Capital (GNF)</Label>
                  <Input
                    value={templateData.montant_capital || ''}
                    onChange={(e) => updateTemplateData('montant_capital', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Ville RCS</Label>
                  <Input
                    value={templateData.ville_rcs || ''}
                    onChange={(e) => updateTemplateData('ville_rcs', e.target.value)}
                  />
                </div>
                <div>
                  <Label>SIRET</Label>
                  <Input
                    value={templateData.siret || ''}
                    onChange={(e) => updateTemplateData('siret', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Adresse</Label>
                  <Input
                    value={templateData.adresse_prestataire || ''}
                    onChange={(e) => updateTemplateData('adresse_prestataire', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Nom représentant</Label>
                  <Input
                    value={templateData.nom_representant || ''}
                    onChange={(e) => updateTemplateData('nom_representant', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Fonction représentant</Label>
                  <Input
                    value={templateData.fonction_representant || ''}
                    onChange={(e) => updateTemplateData('fonction_representant', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Informations client */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Informations client</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Nom client</Label>
                  <Input
                    value={templateData.nom_client || ''}
                    onChange={(e) => updateTemplateData('nom_client', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Type client</Label>
                  <Select
                    value={templateData.type_client || 'Particulier'}
                    onValueChange={(value) => updateTemplateData('type_client', value as 'Société' | 'Particulier')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Particulier">Particulier</SelectItem>
                      <SelectItem value="Société">Société</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Adresse client</Label>
                  <Input
                    value={templateData.adresse_client || ''}
                    onChange={(e) => updateTemplateData('adresse_client', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Numéro d'identification</Label>
                  <Input
                    value={templateData.numero_identification || ''}
                    onChange={(e) => updateTemplateData('numero_identification', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Nom représentant client</Label>
                  <Input
                    value={templateData.nom_representant_client || ''}
                    onChange={(e) => updateTemplateData('nom_representant_client', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Fonction représentant client</Label>
                  <Input
                    value={templateData.fonction_representant_client || ''}
                    onChange={(e) => updateTemplateData('fonction_representant_client', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Informations contrat */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Informations contrat</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Numéro devis</Label>
                  <Input
                    value={templateData.numero_devis || ''}
                    onChange={(e) => updateTemplateData('numero_devis', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Date devis</Label>
                  <Input
                    value={templateData.date_devis || ''}
                    onChange={(e) => updateTemplateData('date_devis', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Durée estimée</Label>
                  <Input
                    value={templateData.duree_estimee || ''}
                    onChange={(e) => updateTemplateData('duree_estimee', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Date début prestation</Label>
                  <Input
                    value={templateData.date_debut_prestation || ''}
                    onChange={(e) => updateTemplateData('date_debut_prestation', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Montant TTC (GNF)</Label>
                  <Input
                    value={templateData.montant_ttc || ''}
                    onChange={(e) => updateTemplateData('montant_ttc', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Délai résiliation (jours)</Label>
                  <Input
                    value={templateData.delai_resiliation || ''}
                    onChange={(e) => updateTemplateData('delai_resiliation', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Ville signature</Label>
                  <Input
                    value={templateData.ville_signature || ''}
                    onChange={(e) => updateTemplateData('ville_signature', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Date signature</Label>
                  <Input
                    value={templateData.date_signature || ''}
                    onChange={(e) => updateTemplateData('date_signature', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Description et modalités */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Description et modalités</h3>
              <div className="space-y-4">
                <div>
                  <Label>Description des prestations</Label>
                  <Textarea
                    value={templateData.description_prestation || ''}
                    onChange={(e) => updateTemplateData('description_prestation', e.target.value)}
                    rows={4}
                  />
                </div>
                <div>
                  <Label>Modalités de paiement</Label>
                  <Textarea
                    value={templateData.modalites_paiement || ''}
                    onChange={(e) => updateTemplateData('modalites_paiement', e.target.value)}
                    rows={4}
                  />
                </div>
                <div>
                  <Label>Conditions spécifiques</Label>
                  <Textarea
                    value={templateData.conditions_specifiques || ''}
                    onChange={(e) => updateTemplateData('conditions_specifiques', e.target.value)}
                    rows={3}
                    placeholder="Conditions particulières du contrat..."
                  />
                </div>
                <div>
                  <Label>Notes additionnelles</Label>
                  <Textarea
                    value={templateData.notes_additionnelles || ''}
                    onChange={(e) => updateTemplateData('notes_additionnelles', e.target.value)}
                    rows={3}
                    placeholder="Notes complémentaires..."
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDataDialogOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 