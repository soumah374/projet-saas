import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  FileText, Upload, Download, Eye, Trash2, Plus, Search,
  File, Image, Video, Archive, FileX, Calendar, Loader2, Music
} from 'lucide-react';
import { useDocuments, useCreateDocument, useDeleteDocument } from '@/hooks/use-documents';
import type { Document, DocumentType, DocumentCategory } from '@/lib/types';
import { useToast } from '@/components/ui/use-toast';
import { DocumentDetailsModal } from '../DocumentDetailsModal';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DocumentManagerProps {
  projectId: string;
}

const getDocumentType = (file: File): DocumentType => {
  const extension = file.name.split('.').pop()?.toLowerCase();
  const mimeType = file.type.toLowerCase();

  // Images
  if (mimeType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif'].includes(extension || '')) {
    if (extension === 'jpg' || extension === 'jpeg') return 'jpg';
    if (extension === 'png') return 'png';
    if (extension === 'gif') return 'gif';
    return 'jpg'; // default image type
  }

  // Documents
  if (mimeType === 'application/pdf' || extension === 'pdf') return 'pdf';
  if (mimeType === 'application/msword' || extension === 'doc') return 'doc';
  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || extension === 'docx') return 'docx';
  if (mimeType === 'application/vnd.ms-excel' || extension === 'xls') return 'xls';
  if (mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || extension === 'xlsx') return 'xlsx';
  if (mimeType === 'application/vnd.ms-powerpoint' || extension === 'ppt') return 'ppt';
  if (mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' || extension === 'pptx') return 'pptx';
  if (mimeType === 'text/plain' || extension === 'txt') return 'txt';

  // Vidéos
  if (mimeType.startsWith('video/') || ['mp4', 'avi'].includes(extension || '')) {
    if (extension === 'mp4') return 'mp4';
    if (extension === 'avi') return 'avi';
    return 'mp4'; // default video type
  }

  // Audio
  if (mimeType.startsWith('audio/') || extension === 'mp3') return 'mp3';

  // Archives
  if (mimeType === 'application/zip' || extension === 'zip') return 'zip';

  return 'other';
};

interface DocumentFormData {
  title: string;
  description: string;
  file: File | null;
  document_type: DocumentType;
  category: DocumentCategory;
  tags: string;
  is_public: boolean;
}

export const DocumentManager = ({ projectId }: DocumentManagerProps) => {

  console.log(projectId)
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<string>('other');
  const [category, setCategory] = useState<DocumentCategory>('contract');
  const [tags, setTags] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  const { data: documentsData, isLoading } = useDocuments(projectId);
  const documents = documentsData?.data?.results || [];
  const createDocumentMutation = useCreateDocument();
  const deleteDocumentMutation = useDeleteDocument();

  const categories = ['Tous', 'Brief', 'Assets', 'Planning', 'Contrats', 'Factures', 'Rapport'];

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileText className="h-8 w-8 text-red-500" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif': return <Image className="h-8 w-8 text-green-500" />;
      case 'mp4':
      case 'avi': return <Video className="h-8 w-8 text-blue-600" />;
      case 'doc':
      case 'docx':
      case 'xls':
      case 'xlsx':
      case 'ppt':
      case 'pptx':
      case 'txt': return <File className="h-8 w-8 text-green-600" />;
      case 'zip': return <Archive className="h-8 w-8 text-yellow-500" />;
      case 'mp3': return <Music className="h-8 w-8 text-green-600" />;
      default: return <FileX className="h-8 w-8 text-gray-500" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Assets': return 'bg-blue-100 text-blue-600';
      case 'Planning': return 'bg-gray-100 text-gray-800';
      case 'Contrats': return 'bg-blue-100 text-blue-600';
      case 'Factures': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Tous' || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    let documentType = 'other';

    if (['pdf'].includes(extension)) documentType = 'pdf';
    else if (['doc', 'docx'].includes(extension)) documentType = 'doc';
    else if (['xls', 'xlsx'].includes(extension)) documentType = 'xls';
    else if (['ppt', 'pptx'].includes(extension)) documentType = 'ppt';
    else if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) documentType = 'image';
    else if (['mp4', 'avi'].includes(extension)) documentType = 'video';
    else if (['mp3'].includes(extension)) documentType = 'audio';
    else if (['zip'].includes(extension)) documentType = 'archive';

    const title = file.name.replace(/\.[^/.]+$/, "");
    
    setSelectedFile(file);
    setTitle(title);
    setDocumentType(documentType);
    setCategory(documentType as DocumentCategory);
  };

  const handleCategoryChange = (value: string) => {
    setCategory(value as DocumentCategory);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un fichier",
        variant: "destructive"
      });
      return;
    }

    try {
      await createDocumentMutation.mutateAsync({
        title,
        description,
        file: selectedFile,
        document_type: documentType,
        category,
        tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
        is_public: isPublic,
        project: projectId
      });

      toast({
        title: "Succès",
        description: "Document téléchargé avec succès",
      });
      
      setUploadDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors du téléchargement du document",
        variant: "destructive"
      });
    }
  };

  const handleDeleteClick = (doc: Document) => {
    setDocumentToDelete(doc);
    setShowDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!documentToDelete) return;

    try {
      await deleteDocumentMutation.mutateAsync(documentToDelete.id);

      toast({
        title: "Succès",
        description: "Document supprimé avec succès",
      });
      
      setShowDeleteDialog(false);
      setDocumentToDelete(null);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression du document",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setSelectedFile(null);
    setDocumentType('other');
    setCategory('contract');
    setTags('');
    setIsPublic(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold tracking-tight">Documents</h2>
              <p className="text-sm text-gray-500">
                Gérez les documents associés à ce projet
              </p>
            </div>
            <Button onClick={() => setUploadDialogOpen(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Uploader
            </Button>
          </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Input
                placeholder="Rechercher un document..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Tous">Tous</SelectItem>
                <SelectItem value="proposal">Propositions</SelectItem>
                <SelectItem value="report">Rapports</SelectItem>
                <SelectItem value="presentation">Présentations</SelectItem>
                <SelectItem value="design">Design</SelectItem>
                <SelectItem value="other">Autres</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Uploader un document</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleUpload} className="space-y-4">
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      id="file"
                      className="hidden"
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.mp4,.avi,.mp3,.zip"
                    />
                    <label
                      htmlFor="file"
                      className="cursor-pointer flex flex-col items-center justify-center"
                    >
                      <Upload className="h-8 w-8 text-gray-400" />
                      <span className="mt-2 text-sm text-gray-500">
                        Cliquez pour sélectionner un fichier
                      </span>
                    </label>
                    {selectedFile && (
                      <p className="mt-2 text-sm text-gray-500">
                        Fichier sélectionné: {selectedFile.name}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      PDF, DOC, XLS, PPT, Images, Vidéos, Audio, Archives (Max: 50MB)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="title">Titre</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Catégorie</Label>
                    <Select value={category} onValueChange={handleCategoryChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez une catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="proposal">Proposition</SelectItem>
                        <SelectItem value="report">Rapport</SelectItem>
                        <SelectItem value="presentation">Présentation</SelectItem>
                        <SelectItem value="design">Design</SelectItem>
                        <SelectItem value="other">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags</Label>
                    <Input
                      id="tags"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      placeholder="tag1, tag2, tag3"
                    />
                    <p className="text-xs text-gray-500">
                      Séparez les tags par des virgules
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is_public"
                      checked={isPublic}
                      onCheckedChange={(checked) => setIsPublic(checked as boolean)}
                    />
                    <Label htmlFor="is_public">Document public</Label>
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setUploadDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit">Uploader</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocuments.map((doc) => (
              <div
                key={doc.id}
                className="p-4 border rounded-lg space-y-3 hover:border-gray-400 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {getFileIcon(doc.document_type)}
                    <div>
                      <h3 className="font-medium truncate max-w-[200px]">{doc.title}</h3>
                      <p className="text-sm text-gray-500 truncate max-w-[200px]">
                        {doc.description || 'Aucune description'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedDocument(doc);
                        setShowDetails(true);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClick(doc)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{doc.document_type.toUpperCase()}</Badge>
                  <Badge>{doc.category}</Badge>
                </div>
              </div>
            ))}
          </div>

          {selectedDocument && (
            <DocumentDetailsModal
              document={selectedDocument}
              open={showDetails}
              onOpenChange={(open) => {
                setShowDetails(open);
                if (!open) setSelectedDocument(null);
              }}
            />
          )}

          <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action est irréversible. Le document{' '}
                  <span className="font-medium">{documentToDelete?.title}</span> sera définitivement supprimé.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setDocumentToDelete(null)}>
                  Annuler
                </AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                  Supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
};
