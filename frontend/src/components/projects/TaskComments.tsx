import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useTaskComments, useCreateComment } from '@/hooks/use-comments';
import { MessageSquare, Send, AtSign, Paperclip, Reply } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface TaskCommentsProps {
  taskId: number;
  projectId: string;
}

interface Comment {
  id: number;
  content: string;
  author_details: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  created_at: string;
  updated_at: string;
  mentions: number[];
  mentioned_users: Array<{
    id: number;
    first_name: string;
    last_name: string;
  }>;
  replies: Comment[];
}

export function TaskComments({ taskId, projectId }: TaskCommentsProps) {
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<number | null>(null);

  const { data: comments = [], isLoading } = useTaskComments(projectId, taskId);
  const createCommentMutation = useCreateComment(projectId, taskId);

  const handleSubmit = async () => {
    if (!newComment.trim()) return;

    // Extraire les mentions (@username)
    const mentionRegex = /@(\w+)/g;
    const mentions = [...newComment.matchAll(mentionRegex)].map(m => m[1]);

    try {
      await createCommentMutation.mutateAsync({
        content: newComment,
        parent: replyTo,
        mentions: [], // TODO: Convertir usernames en IDs
      });
      setNewComment('');
      setReplyTo(null);
    } catch (error) {
      console.error('Erreur lors de la création du commentaire:', error);
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

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
            comments.map(comment => renderComment(comment))
          )}
        </div>

        {/* Formulaire de nouveau commentaire */}
        <div className="border-t pt-4">
          {replyTo && (
            <div className="mb-2 flex items-center gap-2 text-sm text-gray-600">
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
          <div className="flex gap-2">
            <Textarea
              placeholder="Écrivez un commentaire... (utilisez @ pour mentionner quelqu'un)"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[80px]"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                  handleSubmit();
                }
              }}
            />
          </div>
          <div className="flex items-center justify-between mt-2">
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" disabled>
                <AtSign className="h-4 w-4 mr-1" />
                Mentionner
              </Button>
              <Button variant="ghost" size="sm" disabled>
                <Paperclip className="h-4 w-4 mr-1" />
                Joindre
              </Button>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={!newComment.trim() || createCommentMutation.isPending}
              size="sm"
            >
              <Send className="h-4 w-4 mr-1" />
              {createCommentMutation.isPending ? 'Envoi...' : 'Envoyer'}
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Astuce: Ctrl+Entrée pour envoyer rapidement
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
