import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  FileText,
  Download,
  Calendar,
  User,
  Tag,
  Globe,
  Lock,
  File,
  Image,
  Video,
  Archive,
  FileX,
  Music
} from "lucide-react";
import type { Document } from "@/lib/types";

interface DocumentDetailsModalProps {
  document: Document;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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
    case 'mp3': return <Music className="h-8 w-8 text-purple-500" />;
    case 'zip': return <Archive className="h-8 w-8 text-yellow-500" />;
    default: return <FileX className="h-8 w-8 text-gray-500" />;
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'proposal': return 'bg-purple-100 text-purple-800';
    case 'report': return 'bg-green-100 text-green-800';
    case 'presentation': return 'bg-yellow-100 text-yellow-800';
    case 'design': return 'bg-pink-100 text-pink-800';
    case 'video': return 'bg-blue-100 text-blue-600';
    case 'audio': return 'bg-purple-100 text-purple-800';
    case 'photo': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const DocumentDetailsModal = ({ document, open, onOpenChange }: DocumentDetailsModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Détails du document</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* En-tête du document */}
          <div className="flex items-start gap-4">
            {getFileIcon(document.document_type)}
            <div className="flex-1">
              <h3 className="text-lg font-semibold">{document.title}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={getCategoryColor(document.category)}>
                  {document.category}
                </Badge>
                <Badge variant="outline">
                  {document.document_type.toUpperCase()}
                </Badge>
                <Badge variant={document.is_public ? "default" : "secondary"}>
                  {document.is_public ? (
                    <Globe className="w-3 h-3 mr-1" />
                  ) : (
                    <Lock className="w-3 h-3 mr-1" />
                  )}
                  {document.is_public ? 'Public' : 'Privé'}
                </Badge>
              </div>
            </div>
            <Button variant="outline" size="sm" className="shrink-0" asChild>
              <a href={document.file} download>
                <Download className="w-4 h-4 mr-2" />
                Télécharger
              </a>
            </Button>
          </div>

          {/* Description */}
          {document.description && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-gray-500">Description</h4>
              <p className="text-sm text-gray-700">{document.description}</p>
            </div>
          )}

          {/* Métadonnées */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-medium text-gray-500">Informations</h4>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>Créé le {format(new Date(document.created_at), 'dd MMMM yyyy', { locale: fr })}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <User className="w-4 h-4" />
                  <span>Par {document.uploaded_by_name}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <File className="w-4 h-4" />
                  <span>Taille: {(document.file_size / 1024).toFixed(1)} KB</span>
                </div>
              </div>
            </div>

            {/* Tags */}
            {document.tags && document.tags.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-gray-500">Tags</h4>
                <div className="flex flex-wrap gap-1">
                  {document.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center">
                      <Tag className="w-3 h-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Aperçu si c'est une image */}
          {['jpg', 'jpeg', 'png', 'gif'].includes(document.document_type) && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-gray-500">Aperçu</h4>
              <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={document.file}
                  alt={document.title}
                  className="object-contain w-full h-full"
                />
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}; 