
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  FileText, Upload, Download, Eye, Trash2, Plus, Search,
  File, Image, Video, Archive, FileX, Calendar
} from 'lucide-react';

interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedBy: string;
  uploadedAt: string;
  category: string;
  url?: string;
}

interface DocumentManagerProps {
  projectId: string;
}

export const DocumentManager = ({ projectId }: DocumentManagerProps) => {
  const [documents, setDocuments] = useState<Document[]>([
    {
      id: '1',
      name: 'Brief_client_v2.pdf',
      type: 'pdf',
      size: '2.3 MB',
      uploadedBy: 'Sarah Martin',
      uploadedAt: '2024-01-15',
      category: 'Brief'
    },
    {
      id: '2',
      name: 'Logo_client.png',
      type: 'image',
      size: '856 KB',
      uploadedBy: 'Pierre Lambert',
      uploadedAt: '2024-01-14',
      category: 'Assets'
    },
    {
      id: '3',
      name: 'Planning_production.xlsx',
      type: 'spreadsheet',
      size: '1.2 MB',
      uploadedBy: 'Marie Durant',
      uploadedAt: '2024-01-13',
      category: 'Planning'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  const categories = ['Tous', 'Brief', 'Assets', 'Planning', 'Contrats', 'Factures', 'Rapport'];

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileText className="h-8 w-8 text-red-500" />;
      case 'image': return <Image className="h-8 w-8 text-green-500" />;
      case 'video': return <Video className="h-8 w-8 text-blue-500" />;
      case 'spreadsheet': return <File className="h-8 w-8 text-green-600" />;
      case 'archive': return <Archive className="h-8 w-8 text-yellow-500" />;
      default: return <FileX className="h-8 w-8 text-gray-500" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Brief': return 'bg-blue-100 text-blue-800';
      case 'Assets': return 'bg-green-100 text-green-800';
      case 'Planning': return 'bg-orange-100 text-orange-800';
      case 'Contrats': return 'bg-purple-100 text-purple-800';
      case 'Factures': return 'bg-red-100 text-red-800';
      case 'Rapport': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Tous' || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const newDoc: Document = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: file.name,
          type: file.type.includes('image') ? 'image' : 
                file.type.includes('pdf') ? 'pdf' :
                file.type.includes('video') ? 'video' :
                file.type.includes('sheet') ? 'spreadsheet' : 'file',
          size: (file.size / 1024 / 1024).toFixed(1) + ' MB',
          uploadedBy: 'Sarah Martin',
          uploadedAt: new Date().toISOString().split('T')[0],
          category: 'Assets'
        };
        setDocuments(prev => [...prev, newDoc]);
      });
      setUploadDialogOpen(false);
    }
  };

  const deleteDocument = (id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header et actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestion des documents</h2>
          <p className="text-gray-600">Projet ID: {projectId}</p>
        </div>
        
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter des documents
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Uploader des documents</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <span className="text-gray-600">Glissez-déposez vos fichiers ici ou </span>
                  <span className="text-blue-600 underline">parcourez</span>
                </label>
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileUpload}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.mp4,.avi,.zip,.rar"
                />
                <p className="text-sm text-gray-400 mt-2">
                  PDF, DOC, XLS, PPT, Images, Vidéos, Archives (Max: 50MB par fichier)
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtres et recherche */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher un document..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {categories.map(category => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques documents */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total documents</p>
                <p className="text-2xl font-bold">{documents.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Images</p>
                <p className="text-2xl font-bold">{documents.filter(d => d.type === 'image').length}</p>
              </div>
              <Image className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">PDFs</p>
                <p className="text-2xl font-bold">{documents.filter(d => d.type === 'pdf').length}</p>
              </div>
              <FileText className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Taille totale</p>
                <p className="text-2xl font-bold">4.4 MB</p>
              </div>
              <Archive className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des documents */}
      <Card>
        <CardHeader>
          <CardTitle>Documents du projet ({filteredDocuments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredDocuments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileX className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Aucun document trouvé</p>
                {searchTerm && (
                  <Button variant="outline" onClick={() => setSearchTerm('')} className="mt-2">
                    Effacer la recherche
                  </Button>
                )}
              </div>
            ) : (
              filteredDocuments.map(doc => (
                <div key={doc.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    {getFileIcon(doc.type)}
                    <div>
                      <h3 className="font-medium text-gray-900">{doc.name}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{doc.size}</span>
                        <span>•</span>
                        <span>Par {doc.uploadedBy}</span>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(doc.uploadedAt).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge className={getCategoryColor(doc.category)}>
                      {doc.category}
                    </Badge>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => deleteDocument(doc.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Historique des modifications */}
      <Card>
        <CardHeader>
          <CardTitle>Historique récent</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-gray-600">15/01/2024 - 14:30</span>
              <span>Sarah Martin a uploadé Brief_client_v2.pdf</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-gray-600">14/01/2024 - 11:15</span>
              <span>Pierre Lambert a uploadé Logo_client.png</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span className="text-gray-600">13/01/2024 - 09:45</span>
              <span>Marie Durant a uploadé Planning_production.xlsx</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
