import React, { useState, useEffect } from 'react';
import { Mail, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { emailTemplateService } from '@/services/emailTemplateService';
import { EmailTemplate, EmailTemplatePreview } from '@/types/email-template';

interface EmailTemplatePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: EmailTemplate | null;
}

export const EmailTemplatePreviewModal: React.FC<EmailTemplatePreviewModalProps> = ({
  isOpen,
  onClose,
  template
}) => {
  const [preview, setPreview] = useState<EmailTemplatePreview | null>(null);
  const [customContext, setCustomContext] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && template) {
      loadPreview();
    }
  }, [isOpen, template]);

  const loadPreview = async (context?: Record<string, string>) => {
    if (!template) return;

    setLoading(true);
    try {
      const previewData = await emailTemplateService.previewTemplate(template.id, context);
      setPreview(previewData);
      
      if (!context) {
        setCustomContext(previewData.context_used);
      }
    } catch (error) {
      toast.error('Erreur lors de la prévisualisation');
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContextChange = (key: string, value: string) => {
    const newContext = { ...customContext, [key]: value };
    setCustomContext(newContext);
  };

  const handleRefreshPreview = () => {
    loadPreview(customContext);
  };

  if (!template) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Prévisualisation - {template.nom}
          </DialogTitle>
          <DialogDescription>
            Prévisualisez le rendu final de votre template avec des données de test.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Variables de test */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Variables de test</CardTitle>
                <Button
                  size="sm"
                  onClick={handleRefreshPreview}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Actualiser
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(customContext).map(([key, value]) => (
                  <div key={key} className="space-y-1">
                    <Label htmlFor={key} className="text-xs">
                      {`{{${key}}}`}
                    </Label>
                    <Input
                      id={key}
                      value={value}
                      onChange={(e) => handleContextChange(key, e.target.value)}
                      className="text-sm"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Prévisualisation */}
          {preview && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Prévisualisation de l'email</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {/* En-tête de l'email */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">De:</span>
                        <span className="text-gray-600 dark:text-gray-400">
                          project_saas &lt;noreply@project_saas.com&gt;
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">À:</span>
                        <span className="text-gray-600 dark:text-gray-400">
                          Client &lt;client@example.com&gt;
                        </span>
                      </div>
                      <Separator />
                      <div>
                        <span className="font-medium">Objet:</span>
                        <div className="mt-1 font-semibold">{preview.subject}</div>
                      </div>
                    </div>
                  </div>

                  {/* Corps de l'email */}
                  <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border shadow-sm">
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {preview.content}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={onClose}>
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};