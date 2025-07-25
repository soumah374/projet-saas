import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { 
  Plus, Edit, Trash2, Eye, FileText, Search, Filter,
  Play, Pause, Check, X
} from 'lucide-react';
import { 
  useTemplatesContrat, 
  useCreateTemplateContrat, 
  useUpdateTemplateContrat, 
  useDeleteTemplateContrat,
  useTypesTemplates,
  type TemplateContrat 
} from '@/hooks/use-contrats';
import { toast } from 'sonner';

export function TemplatesContratPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateContrat | null>(null);
  
  // Formulaire de création/édition
  const [formData, setFormData] = useState({
    nom: '',
    type_template: 'prestation',
    description: '',
    contenu: '',
    variables_defaut: {},
    est_actif: true,
    est_public: true
  });

  // Hooks
  const { data: templatesData, isLoading } = useTemplatesContrat({
    search: searchTerm || undefined,
    type_template: typeFilter !== 'all' ? typeFilter : undefined,
    est_actif: statusFilter !== 'all' ? statusFilter === 'actif' : undefined,
    ordering: 'nom'
  });
  
  const { data: typesData } = useTypesTemplates();
  const createTemplate = useCreateTemplateContrat();
  const updateTemplate = useUpdateTemplateContrat();
  const deleteTemplate = useDeleteTemplateContrat();

  const templates = templatesData?.results || [];
  const types = typesData?.types || [];

  const handleCreateTemplate = async () => {
    try {
      await createTemplate.mutateAsync(formData);
      setCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleUpdateTemplate = async () => {
    if (!selectedTemplate) return;
    
    try {
      await updateTemplate.mutateAsync({
        id: selectedTemplate.id,
        data: formData
      });
      setEditDialogOpen(false);
      resetForm();
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleDeleteTemplate = async () => {
    if (!selectedTemplate) return;
    
    try {
      await deleteTemplate.mutateAsync(selectedTemplate.id);
      setDeleteDialogOpen(false);
      setSelectedTemplate(null);
    } catch (error) {
      // Error handled by hook
    }
  };

  const resetForm = () => {
    setFormData({
      nom: '',
      type_template: 'prestation',
      description: '',
      contenu: '',
      variables_defaut: {},
      est_actif: true,
      est_public: true
    });
  };

  const openEditDialog = (template: TemplateContrat) => {
    setSelectedTemplate(template);
    setFormData({
      nom: template.nom,
      type_template: template.type_template,
      description: template.description,
      contenu: template.contenu,
      variables_defaut: template.variables_defaut,
      est_actif: template.est_actif,
      est_public: template.est_public
    });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (template: TemplateContrat) => {
    setSelectedTemplate(template);
    setDeleteDialogOpen(true);
  };

  const getTypeBadge = (type: string) => {
    const variants = {
      prestation: 'default',
      maintenance: 'secondary',
      formation: 'outline',
      conseil: 'outline',
      personnalise: 'destructive',
    } as const;
    
    return <Badge variant={variants[type as keyof typeof variants]}>{type}</Badge>;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Templates de contrat</h1>
          <p className="text-gray-600">Gérez vos modèles de contrat</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Créer un nouveau template</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nom">Nom du template</Label>
                  <Input
                    id="nom"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    placeholder="Nom du template"
                  />
                </div>
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={formData.type_template}
                    onValueChange={(value) => setFormData({ ...formData, type_template: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {types.map((type) => (
                        <SelectItem key={type[0]} value={type[0]}>
                          {type[1]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description du template"
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="contenu">Contenu du template</Label>
                <Textarea
                  id="contenu"
                  value={formData.contenu}
                  onChange={(e) => setFormData({ ...formData, contenu: e.target.value })}
                  placeholder="Contenu du template avec variables [VARIABLE]"
                  rows={15}
                  className="font-mono text-sm"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="est_actif"
                    checked={formData.est_actif}
                    onCheckedChange={(checked) => setFormData({ ...formData, est_actif: checked })}
                  />
                  <Label htmlFor="est_actif">Template actif</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="est_public"
                    checked={formData.est_public}
                    onCheckedChange={(checked) => setFormData({ ...formData, est_public: checked })}
                  />
                  <Label htmlFor="est_public">Template public</Label>
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleCreateTemplate} disabled={createTemplate.isPending}>
                  {createTemplate.isPending ? 'Création...' : 'Créer'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
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
            <div className="flex gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  {types.map((type) => (
                    <SelectItem key={type[0]} value={type[0]}>
                      {type[1]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="actif">Actifs</SelectItem>
                  <SelectItem value="inactif">Inactifs</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des templates */}
      <Card>
        <CardHeader>
          <CardTitle>Templates ({templates.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Chargement...</div>
          ) : templates.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Aucun template trouvé</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Variables</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{template.nom}</p>
                        <p className="text-sm text-gray-600">
                          Créé le {new Date(template.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{getTypeBadge(template.type_template)}</TableCell>
                    <TableCell>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {template.description || 'Aucune description'}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {template.variables_disponibles.slice(0, 3).map((variable) => (
                          <Badge key={variable} variant="outline" className="text-xs">
                            {variable}
                          </Badge>
                        ))}
                        {template.variables_disponibles.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{template.variables_disponibles.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant={template.est_actif ? 'default' : 'secondary'}>
                          {template.est_actif ? 'Actif' : 'Inactif'}
                        </Badge>
                        {template.est_public && (
                          <Badge variant="outline">Public</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(template)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteDialog(template)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog d'édition */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier le template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-nom">Nom du template</Label>
                <Input
                  id="edit-nom"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  placeholder="Nom du template"
                />
              </div>
              <div>
                <Label htmlFor="edit-type">Type</Label>
                <Select
                  value={formData.type_template}
                  onValueChange={(value) => setFormData({ ...formData, type_template: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {types.map((type) => (
                      <SelectItem key={type[0]} value={type[0]}>
                        {type[1]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description du template"
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="edit-contenu">Contenu du template</Label>
              <Textarea
                id="edit-contenu"
                value={formData.contenu}
                onChange={(e) => setFormData({ ...formData, contenu: e.target.value })}
                placeholder="Contenu du template avec variables [VARIABLE]"
                rows={15}
                className="font-mono text-sm"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-est_actif"
                  checked={formData.est_actif}
                  onCheckedChange={(checked) => setFormData({ ...formData, est_actif: checked })}
                />
                <Label htmlFor="edit-est_actif">Template actif</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-est_public"
                  checked={formData.est_public}
                  onCheckedChange={(checked) => setFormData({ ...formData, est_public: checked })}
                />
                <Label htmlFor="edit-est_public">Template public</Label>
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleUpdateTemplate} disabled={updateTemplate.isPending}>
                {updateTemplate.isPending ? 'Mise à jour...' : 'Mettre à jour'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de suppression */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              Êtes-vous sûr de vouloir supprimer le template "{selectedTemplate?.nom}" ?
              Cette action est irréversible.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Annuler
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDeleteTemplate}
                disabled={deleteTemplate.isPending}
              >
                {deleteTemplate.isPending ? 'Suppression...' : 'Supprimer'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 