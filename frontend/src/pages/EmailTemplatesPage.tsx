import React, { useState, useEffect } from 'react';
import { Plus, Mail, Eye, Edit, Trash2, Star, StarOff, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { emailTemplateService } from '@/services/emailTemplateService';
import { EmailTemplate, EMAIL_TYPES } from '@/types/email-template';
import { EmailTemplateFormModal, EmailTemplatePreviewModal } from '@/components/email-templates';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';

export const EmailTemplatesPage: React.FC = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [templateToDelete, setTemplateToDelete] = useState<EmailTemplate | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await emailTemplateService.getTemplates();
      setTemplates(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error('Erreur lors du chargement des templates');
      console.error('Erreur:', error);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = () => {
    setSelectedTemplate(null);
    setIsFormModalOpen(true);
  };

  const handleEditTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setIsFormModalOpen(true);
  };

  const handlePreviewTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setIsPreviewModalOpen(true);
  };

  const handleDeleteTemplate = async () => {
    if (!templateToDelete) return;

    try {
      await emailTemplateService.deleteTemplate(templateToDelete.id);
      toast.success('Template supprimé avec succès');
      loadTemplates();
      setTemplateToDelete(null);
    } catch (error) {
      toast.error('Erreur lors de la suppression du template');
      console.error('Erreur:', error);
    }
  };

  const handleSetAsDefault = async (template: EmailTemplate) => {
    try {
      const result = await emailTemplateService.setAsDefault(template.id);
      toast.success(result.message);
      loadTemplates();
    } catch (error) {
      toast.error('Erreur lors de la définition du template par défaut');
      console.error('Erreur:', error);
    }
  };

  const handleFormSuccess = () => {
    loadTemplates();
    setIsFormModalOpen(false);
    setSelectedTemplate(null);
  };

  // Filtrage des templates
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.sujet.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.type_email_display.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || template.type_email === selectedType;
    return matchesSearch && matchesType;
  });

  // Groupement des templates par type
  const templatesByType = filteredTemplates.reduce((acc, template) => {
    if (!acc[template.type_email]) {
      acc[template.type_email] = [];
    }
    acc[template.type_email].push(template);
    return acc;
  }, {} as Record<string, EmailTemplate[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Templates Email</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gérez les templates d'emails personnalisables pour vos communications clients
          </p>
        </div>
        <Button onClick={handleCreateTemplate} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nouveau Template
        </Button>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Rechercher un template..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Type d'email" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  {EMAIL_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des templates */}
      {Object.keys(templatesByType).length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Aucun template trouvé
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchTerm || selectedType !== 'all' 
                ? 'Aucun template ne correspond à vos critères de recherche.'
                : 'Commencez par créer votre premier template d\'email.'
              }
            </p>
            {!searchTerm && selectedType === 'all' && (
              <Button onClick={handleCreateTemplate}>
                <Plus className="h-4 w-4 mr-2" />
                Créer un template
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(templatesByType).map(([typeCode, typeTemplates]) => {
            const typeLabel = EMAIL_TYPES.find(t => t.value === typeCode)?.label || typeCode;
            return (
              <div key={typeCode}>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  {typeLabel} ({typeTemplates.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {typeTemplates.map((template) => (
                    <Card key={template.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{template.nom}</CardTitle>
                          <div className="flex items-center gap-1">
                            {template.est_defaut && (
                              <Badge variant="default" className="text-xs">
                                <Star className="h-3 w-3 mr-1" />
                                Défaut
                              </Badge>
                            )}
                            {!template.est_actif && (
                              <Badge variant="secondary" className="text-xs">
                                Inactif
                              </Badge>
                            )}
                          </div>
                        </div>
                        <CardDescription className="text-sm">
                          {template.sujet}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                          {template.contenu.substring(0, 150)}
                          {template.contenu.length > 150 && '...'}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-gray-500">
                            Modifié le {new Date(template.date_modification).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handlePreviewTemplate(template)}
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditTemplate(template)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {!template.est_defaut && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleSetAsDefault(template)}
                                className="h-8 w-8 p-0"
                                title="Définir comme défaut"
                              >
                                <StarOff className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setTemplateToDelete(template)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <EmailTemplateFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSuccess={handleFormSuccess}
        template={selectedTemplate}
      />

      <EmailTemplatePreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        template={selectedTemplate}
      />

      {/* Dialog de suppression */}
      <AlertDialog open={!!templateToDelete} onOpenChange={() => setTemplateToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le template</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le template "{templateToDelete?.nom}" ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTemplate} className="bg-red-600 hover:bg-red-700">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
