import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Plus, 
  Search, 
  Filter, 
  FileText, 
  Folder,
  Download,
  Share2,
  Edit,
  Trash2,
  Eye,
  Upload,
  FolderPlus,
  File,
  Image,
  Video,
  Archive
} from "lucide-react";

interface Document {
  id: number;
  name: string;
  type: 'file' | 'folder';
  fileType?: string;
  size?: string;
  lastModified: string;
  createdBy: string;
  path: string;
  isShared: boolean;
  permissions: string[];
}

export function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentPath, setCurrentPath] = useState('/');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isCreateFolderDialogOpen, setIsCreateFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  useEffect(() => {
    // Simuler le chargement des documents
    const mockDocuments: Document[] = [
      {
        id: 1,
        name: "Documentation API",
        type: 'folder',
        lastModified: "2024-02-10",
        createdBy: "Jean Martin",
        path: "/Documentation API",
        isShared: true,
        permissions: ['read', 'write']
      },
      {
        id: 2,
        name: "Spécifications projet",
        type: 'file',
        fileType: 'pdf',
        size: '2.5 MB',
        lastModified: "2024-02-08",
        createdBy: "Marie Dupont",
        path: "/Spécifications projet.pdf",
        isShared: false,
        permissions: ['read']
      },
      {
        id: 3,
        name: "Maquettes design",
        type: 'folder',
        lastModified: "2024-02-05",
        createdBy: "Sophie Bernard",
        path: "/Maquettes design",
        isShared: true,
        permissions: ['read', 'write']
      },
      {
        id: 4,
        name: "Code source",
        type: 'folder',
        lastModified: "2024-02-12",
        createdBy: "Pierre Durand",
        path: "/Code source",
        isShared: true,
        permissions: ['read', 'write', 'admin']
      },
      {
        id: 5,
        name: "Rapport mensuel",
        type: 'file',
        fileType: 'docx',
        size: '1.2 MB',
        lastModified: "2024-02-01",
        createdBy: "Emma Leroy",
        path: "/Rapport mensuel.docx",
        isShared: true,
        permissions: ['read']
      },
      {
        id: 6,
        name: "Images assets",
        type: 'folder',
        lastModified: "2024-02-03",
        createdBy: "Sophie Bernard",
        path: "/Images assets",
        isShared: false,
        permissions: ['read', 'write']
      },
      {
        id: 7,
        name: "Base de données",
        type: 'file',
        fileType: 'sql',
        size: '5.8 MB',
        lastModified: "2024-01-28",
        createdBy: "Pierre Durand",
        path: "/Base de données.sql",
        isShared: true,
        permissions: ['read', 'write']
      },
      {
        id: 8,
        name: "Présentation client",
        type: 'file',
        fileType: 'pptx',
        size: '8.3 MB',
        lastModified: "2024-02-11",
        createdBy: "Marie Dupont",
        path: "/Présentation client.pptx",
        isShared: true,
        permissions: ['read']
      }
    ];

    setDocuments(mockDocuments);
    setFilteredDocuments(mockDocuments);
  }, []);

  useEffect(() => {
    let filtered = documents;

    // Filtre par recherche
    if (searchTerm) {
      filtered = filtered.filter(doc =>
        doc.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtre par type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(doc => doc.type === typeFilter);
    }

    setFilteredDocuments(filtered);
  }, [documents, searchTerm, typeFilter]);

  const handleCreateFolder = () => {
    const newFolder: Document = {
      id: documents.length + 1,
      name: newFolderName,
      type: 'folder',
      lastModified: new Date().toISOString().split('T')[0],
      createdBy: "Utilisateur actuel",
      path: `${currentPath}${newFolderName}`,
      isShared: false,
      permissions: ['read', 'write']
    };

    setDocuments([...documents, newFolder]);
    setNewFolderName('');
    setIsCreateFolderDialogOpen(false);
  };

  const getFileIcon = (fileType?: string) => {
    if (!fileType) return <File className="w-5 h-5" />;
    
    switch (fileType.toLowerCase()) {
      case 'pdf':
        return <FileText className="w-5 h-5 text-red-500" />;
      case 'docx':
      case 'doc':
        return <FileText className="w-5 h-5 text-blue-500" />;
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
      case 'mov':
        return <Video className="w-5 h-5 text-red-500" />;
      case 'zip':
      case 'rar':
        return <Archive className="w-5 h-5 text-gray-500" />;
      case 'sql':
        return <FileText className="w-5 h-5 text-yellow-500" />;
      default:
        return <File className="w-5 h-5" />;
    }
  };

  const formatFileSize = (size: string) => {
    return size;
  };

  const getBreadcrumbItems = () => {
    const items = currentPath.split('/').filter(item => item);
    return items;
  };

  const navigateToPath = (path: string) => {
    setCurrentPath(path);
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-600">
            Gérez vos fichiers et dossiers
          </p>
        </div>
        <div className="flex space-x-2">
          <Dialog open={isCreateFolderDialogOpen} onOpenChange={setIsCreateFolderDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <FolderPlus className="w-4 h-4 mr-2" />
                Nouveau dossier
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer un nouveau dossier</DialogTitle>
                <DialogDescription>
                  Créez un nouveau dossier dans l'emplacement actuel
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="folder_name">Nom du dossier</Label>
                  <Input
                    id="folder_name"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Nom du dossier"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateFolderDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
                  Créer le dossier
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="w-4 h-4 mr-2" />
                Télécharger
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Télécharger des fichiers</DialogTitle>
                <DialogDescription>
                  Sélectionnez les fichiers à télécharger
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600">
                    Glissez-déposez vos fichiers ici ou cliquez pour sélectionner
                  </p>
                  <Button variant="outline" className="mt-2">
                    Sélectionner des fichiers
                  </Button>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={() => setIsUploadDialogOpen(false)}>
                  Télécharger
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Fil d'Ariane */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2 text-sm">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateToPath('/')}
              className="text-blue-600 hover:text-blue-800"
            >
              Accueil
            </Button>
            {getBreadcrumbItems().map((item, index) => (
              <div key={index} className="flex items-center space-x-2">
                <span className="text-gray-400">/</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateToPath('/' + getBreadcrumbItems().slice(0, index + 1).join('/'))}
                  className="text-blue-600 hover:text-blue-800"
                >
                  {item}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

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
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filtrer par type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            <SelectItem value="folder">Dossiers</SelectItem>
            <SelectItem value="file">Fichiers</SelectItem>
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
            <div className="text-2xl font-bold">
              {documents.filter(d => d.type === 'file').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Fichiers dans le système
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total dossiers</CardTitle>
            <Folder className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {documents.filter(d => d.type === 'folder').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Dossiers organisés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Partagés</CardTitle>
            <Share2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {documents.filter(d => d.isShared).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Documents partagés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Espace utilisé</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.8 GB</div>
            <p className="text-xs text-muted-foreground">
              Sur 10 GB disponibles
            </p>
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
                  {document.type === 'folder' ? (
                    <Folder className="w-5 h-5 text-blue-500" />
                  ) : (
                    getFileIcon(document.fileType)
                  )}
                  <div>
                    <h4 className="font-medium">{document.name}</h4>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>Créé par {document.createdBy}</span>
                      <span>Modifié le {new Date(document.lastModified).toLocaleDateString()}</span>
                      {document.size && (
                        <span>{formatFileSize(document.size)}</span>
                      )}
                      {document.isShared && (
                        <Badge variant="outline" className="text-xs">
                          Partagé
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-1">
                  <Button variant="ghost" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                  {document.type === 'file' && (
                    <Button variant="ghost" size="sm">
                      <Download className="w-4 h-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="sm">
                    <Share2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
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
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucun document trouvé
              </h3>
              <p className="text-gray-600">
                {searchTerm || typeFilter !== 'all' 
                  ? "Aucun document ne correspond à vos critères de recherche."
                  : "Commencez par télécharger votre premier document."
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 