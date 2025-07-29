import { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Download, 
  Save, 
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';

// Import de Quill
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface ContractEditorProps {
  contrat: any;
  devis: any;
  onSave?: (contenuPersonnalise: string) => void;
}

export function ContractEditor({ contrat, devis, onSave }: ContractEditorProps) {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [editedContract, setEditedContract] = useState('');
  const [isEditingContract, setIsEditingContract] = useState(false);

  // Utiliser le contenu du contrat depuis la base de données
  const contractContent = contrat.contenu_personnalise || '';

  // Synchroniser le contrat édité avec le contenu de la base de données
  useEffect(() => {
    if (!isEditingContract) {
      setEditedContract(contractContent);
    }
  }, [contractContent, isEditingContract]);

  const handleSaveEditedContract = () => {
    if (onSave) {
      onSave(editedContract);
    }
    setIsEditingContract(false);
    toast.success('Contrat sauvegardé');
  };

  const handleEditorChange = (content: string) => {
    setEditedContract(content);
    if (!isEditingContract) {
      setIsEditingContract(true);
    }
  };

  const handleGeneratePDF = async () => {
    setIsGeneratingPDF(true);
    
    try {
      // Sauvegarder d'abord le contrat édité s'il y a des modifications
      if (isEditingContract && onSave) {
        await onSave(editedContract);
      }
      
      // Télécharger le PDF depuis l'endpoint backend
      const response = await api.get(`/contrats/${contrat.id}/download_pdf/`, {
        responseType: 'blob'
      });
      
      // Vérifier que la réponse contient bien des données
      if (!response.data || response.data.size === 0) {
        throw new Error('Réponse vide du serveur');
      }
      
      // Créer un lien de téléchargement
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `contrat-${contrat.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('PDF téléchargé avec succès');
      
    } catch (error: any) {
      console.error('Erreur lors du téléchargement PDF:', error);
      
      // Afficher un message d'erreur plus détaillé
      let errorMessage = 'Erreur lors du téléchargement du PDF';
      
      if (error.response) {
        // Erreur de réponse du serveur
        if (error.response.status === 401) {
          errorMessage = 'Authentification requise';
        } else if (error.response.status === 404) {
          errorMessage = 'Contrat introuvable';
        } else if (error.response.status === 500) {
          errorMessage = 'Erreur serveur lors de la génération du PDF';
        } else {
          errorMessage = `Erreur ${error.response.status}: ${error.response.data?.detail || error.response.data?.error || 'Erreur inconnue'}`;
        }
      } else if (error.request) {
        // Erreur de réseau
        errorMessage = 'Erreur de connexion au serveur';
      } else {
        // Autre erreur
        errorMessage = error.message || 'Erreur inconnue';
      }
      
      toast.error(errorMessage);
    } finally {
      setIsGeneratingPDF(false);
    }
  };
  
  // S'assurer que les valeurs sont des strings valides
  const safeContractContent = typeof contractContent === 'string' ? contractContent : '';
  const safeEditedContract = typeof editedContract === 'string' ? editedContract : '';

  // Configuration Quill
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'align': [] }],
      ['link', 'blockquote'],
      ['clean']
    ],
  };

  const quillFormats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'list', 'bullet',
    'indent',
    'align',
    'link', 'blockquote'
  ];

  // Configuration des styles Quill
  const quillStyle = {
    fontFamily: 'Arial, Helvetica, sans-serif',
    fontSize: '14px',
    lineHeight: '1.6'
  };

  return (
    <div className="space-y-6">
      {/* Barre d'outils */}
      <div className="flex items-center justify-end">    
        <div className="flex items-center gap-2">
          <Button
              variant="outline"
              onClick={handleSaveEditedContract}
            >
              <Save size={16} className="mr-2" />
              Sauvegarder
            </Button>
          <Button 
            onClick={handleGeneratePDF}
            disabled={isGeneratingPDF}
          >
            {isGeneratingPDF ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Génération...
              </>
            ) : (
              <>
                <Download size={16} className="mr-2" />
                Télécharger le PDF
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Contenu principal */}
      <Tabs defaultValue="edit" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="edit">Édition</TabsTrigger>
          <TabsTrigger value="preview">Aperçu</TabsTrigger>
        </TabsList>
        
        <TabsContent value="edit" className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <ReactQuill
                theme="snow"
                value={editedContract}
                onChange={handleEditorChange}
                modules={quillModules}
                formats={quillFormats}
                placeholder="Saisissez le contenu du contrat..."
                style={{ height: '600px', ...quillStyle }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Aperçu du contrat</CardTitle>
              <p className="text-sm text-gray-600">
                Aperçu du contrat tel qu'il sera généré
              </p>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-6 bg-white">
                <div 
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ 
                    __html: isEditingContract ? safeEditedContract : safeContractContent 
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 