import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import {
  Search,
  Filter,
  FileText,
  Download,
  Share2,
  Trash2,
  Eye,
  Upload,
  File,
  Image,
  Video,
  Archive,
} from "lucide-react";
import { DocumentDetailsModal } from "@/components/DocumentDetailsModal";
import { useDocuments, useCreateDocument, useDeleteDocument } from "@/hooks/use-documents";
import type { Document as SakomDocument, DocumentType as ProjectDocumentType, DocumentCategory } from "@/lib/types";

export function DocumentsPage() {
  const { toast } = useToast();
  const { data: documentsData, isLoading } = useDocuments();
  const documents: SakomDocument[] = documentsData?.data?.results || [];

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | ProjectDocumentType>('all');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);

  const [selectedDocument, setSelectedDocument] = useState<SakomDocument | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const [documentToDelete, setDocumentToDelete] = useState<SakomDocument | null>(null);

  // Upload form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<ProjectDocumentType>('other');
  const [category, setCategory] = useState<DocumentCategory>('other');
  const [tags, setTags] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  const createDocumentMutation = useCreateDocument();
  const deleteDocumentMutation = useDeleteDocument();

  const allowedTypes: ProjectDocumentType[] = [
    'pdf','doc','docx','xls','xlsx','ppt','pptx','txt','jpg','jpeg','png','gif','mp4','avi','mp3','zip','other'
  ];

  const filteredDocuments = useMemo(() => {
    let result = documents;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(doc =>
        doc.title.toLowerCase().includes(q) || (doc.description || '').toLowerCase().includes(q)
      );
    }
    if (typeFilter !== 'all') {
      result = result.filter(doc => doc.document_type === typeFilter);
    }
    return result;
  }, [documents, searchTerm, typeFilter]);

  const totalUsedBytes = useMemo(() => {
    return documents.reduce((sum, d) => sum + (d.file_size || 0), 0);
  }, [documents]);

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const value = bytes / Math.pow(1024, i);
    return `${value.toFixed(1)} ${sizes[i]}`;
  };

  const getFileIcon = (fileType?: string) => {
    if (!fileType) return <File className="w-5 h-5" />;

    switch (fileType.toLowerCase()) {
      case 'pdf':
        return <FileText className="w-5 h-5 text-red-500" />;
      case 'docx':
      case 'doc':
        return <FileText className="w-5 h-5 text-blue-600" />;
      case 'pptx':
      case 'ppt':
        return <FileText className="w-5 h-5 text-orange-500" />;
      case 'xlsx':
      case 'xls':
        return <FileText className="w-5 h-5 text-green-500" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <Image className="w-5 h-5 text-purple-500" />;
      case 'mp4':
      case 'avi':
        return <Video className="w-5 h-5 text-red-500" />;
      case 'zip':
        return <Archive className="w-5 h-5 text-gray-500" />;
      default:
        return <File className="w-5 h-5" />;
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    const mime = (file.type || '').toLowerCase();
    let type: ProjectDocumentType = 'other';

    // Extension-based detection
    if (['pdf'].includes(extension)) type = 'pdf';
    else if (['doc'].includes(extension)) type = 'doc';
    else if (['docx'].includes(extension)) type = 'docx';
    else if (['xls'].includes(extension)) type = 'xls';
    else if (['xlsx'].includes(extension)) type = 'xlsx';
    else if (['ppt'].includes(extension)) type = 'ppt';
    else if (['pptx'].includes(extension)) type = 'pptx';
    else if (['jpg'].includes(extension)) type = 'jpg';
    else if (['jpeg'].includes(extension)) type = 'jpeg';
    else if (['png'].includes(extension)) type = 'png';
    else if (['gif'].includes(extension)) type = 'gif';
    else if (['mp4'].includes(extension)) type = 'mp4';
    else if (['avi'].includes(extension)) type = 'avi';
    else if (['mp3'].includes(extension)) type = 'mp3';
    else if (['zip'].includes(extension)) type = 'zip';

    // MIME-based fallback
    if (type === 'other') {
      if (mime === 'application/pdf') type = 'pdf';
      else if (mime.startsWith('image/')) {
        if (['jpg','jpeg','png','gif'].includes(extension)) {
          type = extension as ProjectDocumentType;
        } else {
          type = 'jpg';
        }
      } else if (mime.startsWith('video/')) {
        type = extension === 'avi' ? 'avi' : 'mp4';
      } else if (mime.startsWith('audio/')) {
        type = 'mp3';
      } else if (mime === 'application/zip') {
        type = 'zip';
      }
    }

    setSelectedFile(file);
    setTitle(file.name.replace(/\.[^/.]+$/, ""));
    setDocumentType(type);
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setSelectedFile(null);
    setDocumentType('other');
    setCategory('other');
    setTags('');
    setIsPublic(false);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({ title: 'Erreur', description: 'Veuillez sélectionner un fichier', variant: 'destructive' });
      return;
    }
    try {
      await createDocumentMutation.mutateAsync({
        title,
        description,
        file: selectedFile,
        document_type: documentType,
        category,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        is_public: isPublic,
      });
      toast({ title: 'Succès', description: 'Document téléchargé avec succès' });
      setIsUploadDialogOpen(false);
      resetForm();
    } catch (e) {
      toast({ title: 'Erreur', description: 'Erreur lors du téléchargement du document', variant: 'destructive' });
    }
  };

  const handleDelete = async (doc: SakomDocument) => {
    try {
      await deleteDocumentMutation.mutateAsync(doc.id);
      toast({ title: 'Supprimé', description: 'Document supprimé avec succès' });
    } catch (e) {
      toast({ title: 'Erreur', description: 'Suppression impossible', variant: 'destructive' });
    } finally {
      setDocumentToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-600">Gérez vos fichiers</p>
        </div>
        <div className="flex space-x-2">
          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="w-4 h-4 mr-2" />
                Télécharger
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Télécharger un document</DialogTitle>
                <DialogDescription>Choisissez un fichier et renseignez les détails</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    id="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.mp4,.avi,.mp3,.zip,.txt"
                  />
                  <label htmlFor="file" className="cursor-pointer flex flex-col items-center justify-center">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <span className="text-sm text-gray-600">Cliquez pour sélectionner un fichier</span>
                  </label>
                  {selectedFile && (
                    <p className="mt-2 text-sm text-gray-500">Fichier sélectionné: {selectedFile.name}</p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="title">Titre</Label>
                  <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
                </div>

                <div className="grid gap-2">
                  <Label>Type</Label>
                  <div className="flex items-center gap-2 text-sm text-gray-700 border rounded-md px-3 py-2 bg-muted/20">
                    {getFileIcon(documentType)}
                    <span>{selectedFile ? documentType.toUpperCase() : 'Aucun fichier sélectionné'}</span>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>Catégorie</Label>
                  <Select value={category} onValueChange={(v: DocumentCategory) => setCategory(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="proposal">Proposition</SelectItem>
                      <SelectItem value="report">Rapport</SelectItem>
                      <SelectItem value="presentation">Présentation</SelectItem>
                      <SelectItem value="design">Design</SelectItem>
                      <SelectItem value="video">Vidéo</SelectItem>
                      <SelectItem value="audio">Audio</SelectItem>
                      <SelectItem value="photo">Photo</SelectItem>
                      <SelectItem value="other">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="tags">Tags</Label>
                  <Input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="tag1, tag2" />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox id="is_public" checked={isPublic} onCheckedChange={(v) => setIsPublic(!!v)} />
                  <Label htmlFor="is_public">Document public</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>Annuler</Button>
                <Button onClick={handleUpload} disabled={!selectedFile || !title}>Télécharger</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher des documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={(v: 'all' | ProjectDocumentType) => setTypeFilter(v)}>
          <SelectTrigger className="w-full sm:w-[220px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filtrer par type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            {allowedTypes.map(t => (
              <SelectItem key={t} value={t}>{t.toUpperCase()}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total fichiers</CardTitle>
            <File className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documents.length}</div>
            <p className="text-xs text-muted-foreground">Fichiers dans le système</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Catégories</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Set(documents.map(d => d.category)).size}</div>
            <p className="text-xs text-muted-foreground">Catégories distinctes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Publics</CardTitle>
            <Share2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documents.filter(d => d.is_public).length}</div>
            <p className="text-xs text-muted-foreground">Documents accessibles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Espace utilisé</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBytes(totalUsedBytes)}</div>
            <p className="text-xs text-muted-foreground">Taille cumulée</p>
          </CardContent>
        </Card>
      </div>

      {/* Liste des documents */}
      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
          <CardDescription>
            {filteredDocuments.length} élément(s) trouvé(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredDocuments.map((document) => (
              <div
                key={document.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  {getFileIcon(document.document_type)}
                  <div>
                    <h4 className="font-medium">{document.title}</h4>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>Par {document.uploaded_by_name}</span>
                      <span>Créé le {new Date(document.created_at).toLocaleDateString()}</span>
                      <span>{formatBytes(document.file_size)}</span>
                      {document.is_public && (
                        <Badge variant="outline" className="text-xs">Public</Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  <Button variant="ghost" size="sm" onClick={() => { setSelectedDocument(document); setShowDetails(true); }}>
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <a href={document.file} download target="_blank">
                      <Download className="w-4 h-4" />
                    </a>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setDocumentToDelete(document)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {filteredDocuments.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <FileText className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun document trouvé</h3>
              <p className="text-gray-600">
                {searchTerm || typeFilter !== 'all'
                  ? "Aucun document ne correspond à vos critères de recherche."
                  : "Commencez par télécharger votre premier document."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

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

      {/* Suppression simple (confirmation navigateur) */}
      {documentToDelete && (
        <Dialog open={!!documentToDelete} onOpenChange={(open) => !open && setDocumentToDelete(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Supprimer le document</DialogTitle>
              <DialogDescription>
                Cette action est irréversible. Voulez-vous vraiment supprimer « {documentToDelete.title} » ?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDocumentToDelete(null)}>Annuler</Button>
              <Button className="bg-red-600 hover:bg-red-700" onClick={() => handleDelete(documentToDelete)}>Supprimer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
} 