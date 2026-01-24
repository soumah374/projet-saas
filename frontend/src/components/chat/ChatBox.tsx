import { useState, useEffect, useRef } from 'react';
import { useConversations, useMessages, useSendMessage, useMarkMessagesAsRead, useConversation, Conversation, Message } from '../../hooks/use-chat';
import { graphqlRequest, CHAT_QUERIES } from '../../services/graphql';
import { useUsers } from '../../hooks/use-users';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { MessageSquare, Send, X, Users, Plus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { UserSelector } from './UserSelector';
import { useQueryClient } from '@tanstack/react-query';

interface ChatBoxProps {
  onClose?: () => void;
  initialConversationId?: string;
  initialUserId?: string;
}

export function ChatBox({ onClose, initialConversationId, initialUserId }: ChatBoxProps) {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(
    initialConversationId || null
  );
  const [selectedUserId, setSelectedUserId] = useState<string | null>(
    initialUserId || null
  );
  const [messageInput, setMessageInput] = useState('');
  const [showConversationsList, setShowConversationsList] = useState(true);
  const [showUserSelector, setShowUserSelector] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { conversations, isLoading: conversationsLoading, refetch: refetchConversations } = useConversations();
  
  // Utiliser useConversation pour créer/récupérer une conversation avec un utilisateur
  const { conversation: newConversation, isLoading: isLoadingNewConversation } = useConversation(
    selectedConversation || undefined,
    selectedUserId || undefined
  );

  // Mettre à jour selectedConversation quand une nouvelle conversation est créée
  useEffect(() => {
    if (newConversation && selectedUserId && !selectedConversation) {
      setSelectedConversation(newConversation.id);
      setSelectedUserId(null);
      setShowConversationsList(false);
      refetchConversations();
    }
  }, [newConversation, selectedUserId, selectedConversation, refetchConversations]);

  const { messages, refetch: refetchMessages } = useMessages(selectedConversation || '');
  const sendMessageMutation = useSendMessage();
  const markAsReadMutation = useMarkMessagesAsRead();

  // Marquer les messages comme lus lorsque la conversation est sélectionnée
  useEffect(() => {
    if (selectedConversation) {
      markAsReadMutation.mutate(selectedConversation, {
        onSuccess: () => {
          // Les notifications seront automatiquement rafraîchies via useMarkMessagesAsRead
          console.log('Messages marqués comme lus, notifications mises à jour');
        },
      });
    }
  }, [selectedConversation]);

  // Faire défiler vers le bas lorsque de nouveaux messages arrivent ou quand on change de conversation
  useEffect(() => {
    // Petit délai pour s'assurer que le DOM est mis à jour
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
    return () => clearTimeout(timer);
  }, [messages, selectedConversation]);

  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;

    // Si on a un userId mais pas de conversation, créer la conversation en envoyant le premier message
    if (selectedUserId && !selectedConversation) {
      try {
        const result = await sendMessageMutation.mutateAsync({
          recipientId: selectedUserId,
          content: messageInput.trim(),
        });
        if (result?.conversation?.id) {
          setSelectedConversation(result.conversation.id);
          setSelectedUserId(null);
          setShowConversationsList(false);
          refetchConversations();
        }
        setMessageInput('');
        inputRef.current?.focus();
        return;
      } catch (error) {
        console.error('Error sending message:', error);
        return;
      }
    }

    // Envoyer le message dans une conversation existante
    if (!selectedConversation) return;

    const conversation = conversations.find((c) => c.id === selectedConversation);
    if (!conversation) return;

    try {
      await sendMessageMutation.mutateAsync({
        conversationId: selectedConversation,
        content: messageInput.trim(),
      });
      setMessageInput('');
      // Ne pas refetch immédiatement, le message arrivera via WebSocket
      // Mais refetch après un court délai au cas où
      setTimeout(() => {
        refetchMessages();
      }, 500);
      inputRef.current?.focus();
    } catch (error) {
      console.error('Error sending message:', error);
      // En cas d'erreur, refetch pour s'assurer d'avoir les derniers messages
      refetchMessages();
    }
  };

  const handleSelectUser = async (userId: string) => {
    setSelectedUserId(userId);
    setSelectedConversation(null);
    setShowUserSelector(false);
    setShowConversationsList(false);
    
    // Essayer de récupérer ou créer la conversation immédiatement
    try {
      const response = await graphqlRequest<{ conversation: Conversation }>(
        CHAT_QUERIES.GET_CONVERSATION,
        { userId }
      );
      if (response.data?.conversation) {
        setSelectedConversation(response.data.conversation.id);
        setSelectedUserId(null);
        refetchConversations();
      }
    } catch (error) {
      console.error('Error fetching conversation:', error);
      // Continuer quand même pour permettre d'envoyer le premier message
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const selectedConversationData = conversations.find(
    (c) => c.id === selectedConversation
  );

  // Récupérer les informations de l'utilisateur sélectionné si on n'a pas de conversation
  const { data: usersResponse } = useUsers({});
  const selectedUserData = selectedUserId
    ? usersResponse?.data?.results?.find((u: any) => u.id?.toString() === selectedUserId)
    : null;

  // Gérer initialUserId au montage
  useEffect(() => {
    if (initialUserId && !initialConversationId) {
      handleSelectUser(initialUserId);
    }
  }, [initialUserId, initialConversationId]);

  return (
    <Card className="flex flex-col h-[600px] w-full max-w-4xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          <CardTitle>Messages</CardTitle>
        </div>
        {/* {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )} */}
      </CardHeader>

      <div className="flex flex-1 overflow-hidden">
        {/* Liste des conversations */}
        {showConversationsList && !showUserSelector && (
          <div className="w-80 border-r flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold text-sm">Conversations</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowUserSelector(true)}
                className="h-8"
              >
                <Plus className="h-4 w-4 mr-1" />
                Nouveau
              </Button>
            </div>
            <ScrollArea className="flex-1">
              {conversationsLoading ? (
                <div className="p-4 text-sm text-muted-foreground">Chargement...</div>
              ) : conversations.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground text-center">
                  Aucune conversation
                </div>
              ) : (
                <div className="divide-y">
                  {conversations.map((conversation) => (
                    <button
                      key={conversation.id}
                      onClick={() => {
                        setSelectedConversation(conversation.id);
                        setShowConversationsList(false);
                      }}
                      className={`w-full p-4 text-left hover:bg-muted transition-colors ${
                        selectedConversation === conversation.id ? 'bg-muted' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {conversation.otherParticipant.fullName
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .toUpperCase()
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium text-sm truncate">
                              {conversation.otherParticipant.fullName}
                            </p>
                            {conversation.unreadCount > 0 && (
                              <Badge variant="destructive" className="h-5 min-w-5 text-xs">
                                {conversation.unreadCount}
                              </Badge>
                            )}
                          </div>
                          {conversation.lastMessage && (
                            <p className="text-xs text-muted-foreground truncate mt-1">
                              {conversation.lastMessage.content}
                            </p>
                          )}
                          {conversation.lastMessage && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDistanceToNow(new Date(conversation.lastMessage.createdAt), {
                                addSuffix: true,
                                locale: fr,
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        )}

        {/* Sélecteur d'utilisateur */}
        {showUserSelector && (
          <div className="w-80 border-r flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold text-sm">Nouveau message</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowUserSelector(false);
                  setShowConversationsList(true);
                }}
                className="h-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <UserSelector
              onSelectUser={handleSelectUser}
              onClose={() => {
                setShowUserSelector(false);
                setShowConversationsList(true);
              }}
              excludeUserIds={conversations.map((c) => c.otherParticipant.id)}
            />
          </div>
        )}

        {/* Zone de messages */}
        <div className="flex-1 flex flex-col">
          {isLoadingNewConversation && selectedUserId && !selectedConversation ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50 animate-pulse" />
                <p>Ouverture de la conversation...</p>
              </div>
            </div>
          ) : selectedConversation || (selectedUserId && (newConversation || selectedUserData)) ? (
            <>
              {/* En-tête de la conversation */}
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {!showConversationsList && !showUserSelector && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setShowConversationsList(true);
                        setShowUserSelector(false);
                      }}
                    >
                      <Users className="h-4 w-4" />
                    </Button>
                  )}
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {(() => {
                        const user = selectedConversationData?.otherParticipant || 
                                     newConversation?.otherParticipant ||
                                     (selectedUserData ? {
                                       fullName: `${selectedUserData.first_name || ''} ${selectedUserData.last_name || ''}`.trim() || selectedUserData.username
                                     } : null);
                        return user?.fullName
                          .split(' ')
                          .map((n: string) => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2) || 'U';
                      })()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">
                      {selectedConversationData?.otherParticipant.fullName ||
                       newConversation?.otherParticipant.fullName ||
                       (selectedUserData ? `${selectedUserData.first_name || ''} ${selectedUserData.last_name || ''}`.trim() || selectedUserData.username : 'Utilisateur')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedConversationData?.otherParticipant.email ||
                       newConversation?.otherParticipant.email ||
                       selectedUserData?.email ||
                       ''}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setSelectedConversation(null);
                    setSelectedUserId(null);
                    setShowConversationsList(true);
                  }}
                  title="Fermer la conversation"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {/* Les messages sont déjà triés du plus ancien au plus récent */}
                  {selectedConversation ? (
                    messages.map((message) => {
                    const isOwnMessage =
                      message.sender.id === localStorage.getItem('user_id') ||
                      message.sender.username === JSON.parse(localStorage.getItem('user') || '{}').username;

                    return (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${
                          isOwnMessage ? 'flex-row-reverse' : 'flex-row'
                        }`}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {message.sender.fullName
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .toUpperCase()
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div
                          className={`flex flex-col max-w-[70%] ${
                            isOwnMessage ? 'items-end' : 'items-start'
                          }`}
                        >
                          <div
                            className={`rounded-lg px-4 py-2 ${
                              isOwnMessage
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(message.createdAt), {
                              addSuffix: true,
                              locale: fr,
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <div className="text-center">
                        <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Aucun message pour le moment</p>
                        <p className="text-sm mt-2">Envoyez le premier message pour démarrer la conversation</p>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Zone de saisie */}
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={
                      selectedUserId && !selectedConversation
                        ? "Tapez votre premier message..."
                        : "Tapez votre message..."
                    }
                    disabled={sendMessageMutation.isPending || isLoadingNewConversation}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={
                      !messageInput.trim() ||
                      sendMessageMutation.isPending ||
                      isLoadingNewConversation
                    }
                    size="icon"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="mb-4">Sélectionnez une conversation pour commencer</p>
                <Button
                  onClick={() => setShowUserSelector(true)}
                  variant="outline"
                  className="mt-2"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau message
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

