import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useTaskComments, useCreateComment, useUploadAttachment, Comment } from '@/hooks/use-comments';
import { MessageSquare, Send, AtSign, Paperclip, Reply, X, FileText, Image as ImageIcon, Download } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { MentionTextarea } from './MentionTextarea';
import { useToast } from '@/components/ui/use-toast';
import { downloadFile } from '@/lib/api';

interface TaskCommentsProps {
  taskId: number;
  projectId: string;
}

export function TaskComments({ taskId, projectId }: TaskCommentsProps) {
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [attachments, setAttachments] = useState<Array<{
    name: string;
    url: string;
    type: string;
    size: number;
  }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { data: comments = [], isLoading } = useTaskComments(projectId, taskId);
  const createCommentMutation = useCreateComment(projectId, taskId);
  const uploadAttachmentMutation = useUploadAttachment(projectId, taskId);

  // Scroll vers le bas quand les commentaires changent
  const scrollToBottom = () => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [comments]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // Vérifier la taille (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'Fichier trop volumineux',
        description: 'La taille maximale est de 10MB',
        variant: 'destructive'
      });
      return;
    }

    try {
      const uploadedFile = await uploadAttachmentMutation.mutateAsync(file);
      setAttachments(prev => [...prev, uploadedFile]);
      toast({
        title: 'Fichier téléchargé',
        description: `${file.name} a été téléchargé avec succès`
      });
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error?.response?.data?.error || 'Impossible de télécharger le fichier',
        variant: 'destructive'
      });
    }

    // Réinitialiser l'input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!newComment.trim() && attachments.length === 0) return;

    try {
      await createCommentMutation.mutateAsync({
        content: newComment,
        parent: replyTo,
        attachments: attachments
      });

      setNewComment('');
      setReplyTo(null);
      setAttachments([]);

      toast({
        title: 'Commentaire ajouté',
        description: 'Votre commentaire a été publié avec succès'
      });
      // Scroll vers le bas après ajout du commentaire
      setTimeout(scrollToBottom, 100);
    } catch (error: any) {
      console.error('Erreur lors de la création du commentaire:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de publier le commentaire',
        variant: 'destructive'
      });
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const handleDownloadAttachment = async (attachment: typeof attachments[0]) => {
    await downloadFile({
      url: attachment.url,
      filename: attachment.name,
      onSuccess: (filename) => {
        toast({
          title: 'Téléchargement réussi',
          description: `${filename} a été téléchargé`
        });
      },
      onError: () => {
        toast({
          title: 'Erreur',
          description: 'Impossible de télécharger le fichier',
          variant: 'destructive'
        });
      }
    });
  };

  const renderAttachment = (attachment: typeof attachments[0], showRemove = false, onRemove?: () => void) => (
    <div className="flex items-center gap-2 p-2 bg-gray-100 rounded border">
      <div className="flex-shrink-0">
        {getFileIcon(attachment.type)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{attachment.name}</div>
        <div className="text-xs text-gray-500">{formatFileSize(attachment.size)}</div>
      </div>
      <div className="flex gap-1">
        <button
          onClick={() => handleDownloadAttachment(attachment)}
          className="p-1 hover:bg-gray-200 rounded"
          title="Télécharger le fichier"
        >
          <Download className="h-4 w-4 text-gray-600" />
        </button>
        {showRemove && onRemove && (
          <button
            onClick={onRemove}
            className="p-1 hover:bg-red-100 rounded"
            title="Supprimer le fichier"
          >
            <X className="h-4 w-4 text-red-600" />
          </button>
        )}
      </div>
    </div>
  );

  const renderComment = (comment: Comment, isReply = false) => (
    <div key={comment.id} className={`${isReply ? 'ml-12 mt-2' : ''}`}>
      <div className="flex gap-3">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
            {getInitials(comment.author_details.first_name, comment.author_details.last_name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-sm">
                {comment.author_details.first_name} {comment.author_details.last_name}
              </span>
              <span className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(comment.created_at), {
                  addSuffix: true,
                  locale: fr
                })}
              </span>
            </div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>

            {/* Mentions */}
            {comment.mentioned_users && comment.mentioned_users.length > 0 && (
              <div className="mt-2 flex gap-1 flex-wrap">
                {comment.mentioned_users.map(user => (
                  <Badge key={user.id} variant="secondary" className="text-xs">
                    <AtSign className="h-3 w-3 mr-1" />
                    {user.first_name} {user.last_name}
                  </Badge>
                ))}
              </div>
            )}

            {/* Pièces jointes */}
            {comment.attachments && comment.attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {comment.attachments.map((attachment, index) => (
                  <div key={index}>
                    {renderAttachment(attachment, false)}
                  </div>
                ))}
              </div>
            )}
          </div>

          {!isReply && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-1 text-xs"
              onClick={() => setReplyTo(comment.id)}
            >
              <Reply className="h-3 w-3 mr-1" />
              Répondre
            </Button>
          )}

          {comment.replies && comment.replies.length > 0 && (
            <div className="space-y-2 mt-2">
              {comment.replies.map(reply => renderComment(reply, true))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Commentaires
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-gray-500">Chargement...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Commentaires ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Liste des commentaires */}
        <div className="space-y-4 max-h-[400px] overflow-y-auto">
          {comments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Aucun commentaire pour le moment</p>
              <p className="text-sm">Soyez le premier à commenter</p>
            </div>
          ) : (
            <>
              {comments.map((comment: Comment) => renderComment(comment))}
              <div ref={commentsEndRef} />
            </>
          )}
        </div>

        {/* Formulaire de nouveau commentaire */}
        <div className="border-t pt-4">
          {replyTo && (
            <div className="mb-2 flex items-center gap-2 text-sm text-gray-600 bg-blue-50 p-2 rounded">
              <Reply className="h-4 w-4" />
              <span>Réponse à un commentaire</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReplyTo(null)}
                className="ml-auto"
              >
                Annuler
              </Button>
            </div>
          )}

          {/* Pièces jointes en cours */}
          {attachments.length > 0 && (
            <div className="mb-3 space-y-2">
              <div className="text-sm font-medium text-gray-700">
                Pièces jointes ({attachments.length})
              </div>
              {attachments.map((attachment, index) => (
                <div key={index}>
                  {renderAttachment(attachment, true, () => handleRemoveAttachment(index))}
                </div>
              ))}
            </div>
          )}

          <MentionTextarea
            value={newComment}
            onChange={setNewComment}
            projectId={projectId}
            placeholder="Écrivez un commentaire... (utilisez @ pour mentionner quelqu'un)"
            className="min-h-[80px]"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.ctrlKey) {
                handleSubmit();
              }
            }}
          />

          <div className="flex items-center justify-between mt-2">
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileSelect}
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadAttachmentMutation.isPending}
              >
                <Paperclip className="h-4 w-4 mr-1" />
                {uploadAttachmentMutation.isPending ? 'Upload...' : 'Joindre'}
              </Button>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={(!newComment.trim() && attachments.length === 0) || createCommentMutation.isPending}
              size="sm"
            >
              <Send className="h-4 w-4 mr-1" />
              {createCommentMutation.isPending ? 'Envoi...' : 'Envoyer'}
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Astuce: Ctrl+Entrée pour envoyer rapidement • Tapez @ pour mentionner
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
