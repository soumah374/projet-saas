import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FileText, Download, Send, Eye } from 'lucide-react';
import { replaceContractVariables } from '@/lib/contractTemplate';
import { generateContratPDFFromTemplate, generateContratPDFfromElement } from '@/lib/pdfUtils';
import { useEnvoyerContratPDF } from '@/hooks/use-contrats';
import { toast } from 'sonner';

interface ContractEditorProps {
  contrat: any;
  template?: any;
  onSave?: (content: string, variables: any) => void;
}

export const ContractEditor: React.FC<ContractEditorProps> = ({
  contrat,
  template,
  onSave
}) => {
  const [content, setContent] = useState('');
  const [variables, setVariables] = useState<any>({});
  const [previewContent, setPreviewContent] = useState('');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  
  const envoyerContratPDF = useEnvoyerContratPDF();

  // Initialiser le contenu et les variables
  useEffect(() => {
    if (template) {
      setContent(template.contenu);
      setVariables(template.variables_defaut || {});
    } else {
      // Utiliser le template par défaut
      setContent(`**CONTRAT DE PRESTATION DE SERVICES**

**Entre les soussignés :**

**[RAISON_SOCIALE_PRESTATAIRE]**,
Société [FORME_JURIDIQUE] au capital de [MONTANT_CAPITAL] GNF,
immatriculée au RCS de [VILLE] sous le numéro [SIRET],
dont le siège social est situé à [ADRESSE_PRESTATAIRE],
représentée par [NOM_REPRESENTANT], en sa qualité de [FONCTION],
ci-après dénommée "le Prestataire",

**Et :**

**[NOM_CLIENT]**,
[STATUT_CLIENT] domicilié(e) à [ADRESSE_CLIENT],
immatriculé(e) sous le numéro [IDENTIFICATION_CLIENT],
représenté(e) par [NOM_REPRESENTANT_CLIENT], en sa qualité de [FONCTION_CLIENT],
ci-après dénommé "le Client",

**Il a été convenu ce qui suit :**

---

**Article 1 – Objet du contrat**

Le présent contrat a pour objet la réalisation des prestations définies dans le **devis n° [NUM_DEVIS]** daté du [DATE_DEVIS], annexé au présent contrat et accepté par le Client.

---

**Article 2 – Durée**

Le présent contrat prend effet à compter de sa date de signature pour une durée estimée de [DUREE_ESTIMEE] à compter du début des travaux fixé au [DATE_DEBUT_PRESTATION].

---

**Article 3 – Description des prestations**

Le Prestataire s'engage à réaliser les prestations suivantes :
**[DESCRIPTION_PRESTATION]**
Conformément au devis annexé.

---

**Article 4 – Modalités d'exécution**

Le Prestataire exécutera les prestations selon les règles de l'art et s'engage à respecter les délais convenus. Le Client s'engage à fournir toutes les informations et moyens nécessaires à la bonne exécution de la mission.

---

**Article 5 – Prix et modalités de paiement**

Le montant total de la prestation est fixé à **[MONTANT_TTC] GNF**, selon le devis accepté.
Modalités de paiement :

* [MODALITES_PAIEMENT]
* Paiement par virement bancaire aux coordonnées indiquées sur la facture.

---

**Article 6 – Confidentialité**

Les parties s'engagent à garder confidentielles toutes les informations échangées dans le cadre du présent contrat.

---

**Article 7 – Propriété intellectuelle**

Sauf stipulation contraire dans le devis, les livrables réalisés restent la propriété du Prestataire jusqu'au paiement intégral. Une fois le paiement effectué, le Client devient propriétaire des livrables, à l'exception des éléments tiers sous licence.

---

**Article 8 – Résiliation**

En cas de manquement grave de l'une des parties à ses obligations contractuelles, le contrat pourra être résilié de plein droit après mise en demeure restée sans effet pendant [DELAI_RESILIATION] jours.

---

**Article 9 – Litiges**

En cas de litige, les parties s'efforceront de trouver une solution amiable. À défaut, le litige sera porté devant le tribunal compétent du ressort du siège social du Prestataire.

---

Fait à [VILLE_SIGNATURE], le [DATE_SIGNATURE],
En deux exemplaires originaux.

**Le Prestataire**                          | **Le Client**
(signature)                                 | (signature)`);
      
      setVariables({
        RAISON_SOCIALE_PRESTATAIRE: 'SAKOM SARL',
        FORME_JURIDIQUE: 'SARL',
        MONTANT_CAPITAL: '10 000',
        VILLE: 'Conakry',
        SIRET: '12345678901234',
        ADRESSE_PRESTATAIRE: '123 Avenue de la République, Conakry, Guinée',
        NOM_REPRESENTANT: 'Mamadou Diallo',
        FONCTION: 'Directeur Général',
        STATUT_CLIENT: 'Société',
        MODALITES_PAIEMENT: '30% à la commande, solde à la livraison',
        DELAI_RESILIATION: '30',
        VILLE_SIGNATURE: 'Conakry',
      });
    }
  }, [template]);

  // Mettre à jour la prévisualisation
  useEffect(() => {
    const preview = replaceContractVariables(content, variables);
    setPreviewContent(preview);
  }, [content, variables]);

  // Extraire les variables du contenu
  const extractVariables = (text: string) => {
    const regex = /\[([A-Z_]+)\]/g;
    const matches = text.match(regex);
    if (matches) {
      return matches.map(match => match.slice(1, -1));
    }
    return [];
  };

  const availableVariables = extractVariables(content);

  const handleVariableChange = (variable: string, value: string) => {
    setVariables(prev => ({
      ...prev,
      [variable]: value
    }));
  };

  const handleSave = () => {
    if (onSave) {
      onSave(content, variables);
    }
    toast.success('Contrat sauvegardé');
  };

  const handleGeneratePDF = async () => {
    setIsGeneratingPDF(true);
    try {
      let pdfData: string | null = null;
      
      if (template) {
        // Générer depuis le template
        pdfData = generateContratPDFFromTemplate(contrat, template, variables);
      } else {
        // Générer depuis l'élément DOM
        pdfData = await generateContratPDFfromElement('contract-preview');
      }
      
      if (pdfData) {
        // Télécharger le PDF
        const link = document.createElement('a');
        link.href = `data:application/pdf;base64,${pdfData}`;
        link.download = `contrat_${contrat.numero}.pdf`;
        link.click();
        toast.success('PDF généré avec succès');
      } else {
        toast.error('Erreur lors de la génération du PDF');
      }
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      toast.error('Erreur lors de la génération du PDF');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleSendEmail = async () => {
    setIsSendingEmail(true);
    try {
      let pdfData: string | null = null;
      
      if (template) {
        // Générer depuis le template
        pdfData = generateContratPDFFromTemplate(contrat, template, variables);
      } else {
        // Générer depuis l'élément DOM
        pdfData = await generateContratPDFfromElement('contract-preview');
      }
      
      if (pdfData) {
        await envoyerContratPDF.mutateAsync({
          id: contrat.id,
          pdfData: pdfData
        });
      } else {
        toast.error('Erreur lors de la génération du PDF');
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi:', error);
      toast.error('Erreur lors de l\'envoi du contrat');
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Éditeur de contrat
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="editor" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="editor">Éditeur</TabsTrigger>
            <TabsTrigger value="variables">Variables</TabsTrigger>
            <TabsTrigger value="preview">Aperçu</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
          </TabsList>

          <TabsContent value="editor" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="content">Contenu du contrat</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Saisissez le contenu du contrat..."
                className="min-h-[400px] font-mono text-sm"
              />
            </div>
          </TabsContent>

          <TabsContent value="variables" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableVariables.map((variable) => (
                <div key={variable} className="space-y-2">
                  <Label htmlFor={variable}>{variable}</Label>
                  <Input
                    id={variable}
                    value={variables[variable] || ''}
                    onChange={(e) => handleVariableChange(variable, e.target.value)}
                    placeholder={`Valeur pour ${variable}`}
                  />
                </div>
              ))}
            </div>
            
            {availableVariables.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                Aucune variable trouvée dans le contenu
              </div>
            )}
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            <div className="border rounded-lg p-4 bg-white">
              <div 
                id="contract-preview"
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ 
                  __html: previewContent.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>')
                }}
              />
            </div>
          </TabsContent>

          <TabsContent value="actions" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button 
                onClick={handleSave}
                className="w-full"
                variant="outline"
              >
                Sauvegarder
              </Button>
              
              <Button 
                onClick={handleGeneratePDF}
                disabled={isGeneratingPDF}
                className="w-full"
              >
                {isGeneratingPDF ? (
                  <>Génération...</>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Générer PDF
                  </>
                )}
              </Button>
              
              <Button 
                onClick={handleSendEmail}
                disabled={isSendingEmail}
                className="w-full"
                variant="secondary"
              >
                {isSendingEmail ? (
                  <>Envoi...</>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Envoyer par email
                  </>
                )}
              </Button>
              
              <Button 
                onClick={() => window.open(`data:application/pdf;base64,${generateContratPDFFromTemplate(contrat, template || { contenu: content }, variables)}`, '_blank')}
                className="w-full"
                variant="outline"
              >
                <Eye className="h-4 w-4 mr-2" />
                Voir PDF
              </Button>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <h4 className="font-medium">Informations du contrat</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="font-medium">Numéro:</span> {contrat.numero}
                </div>
                <div>
                  <span className="font-medium">Client:</span> {contrat.client?.nom || 'N/A'}
                </div>
                <div>
                  <span className="font-medium">Montant TTC:</span> {contrat.montant_ttc?.toLocaleString('fr-FR')} GNF
                </div>
                <div>
                  <span className="font-medium">Statut:</span> 
                  <Badge variant="outline" className="ml-1">
                    {contrat.statut}
                  </Badge>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}; 