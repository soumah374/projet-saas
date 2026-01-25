import { useState, useEffect, useRef } from 'react';
import {
  useConversations,
  useMessages,
  useSendMessage,
  useMarkMessagesAsRead,
  useConversation,
  useTypingIndicator,
  useEditMessage,
  useDeleteMessage,
  useAddReaction,
  useRemoveReaction,
  Conversation,
  Message,
  MentionInput,
} from '../../hooks/use-chat';
import { graphqlRequest, CHAT_QUERIES } from '../../services/graphql';
import { useUsers } from '../../hooks/use-users';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Card, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  MessageSquare,
  X,
  Users,
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  Reply,
  Settings,
  UserPlus,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { UserSelector } from './UserSelector';
import { ChatMentionInput } from './ChatMentionInput';
import { renderMessageWithMentions, parseAndRenderMentions } from './MentionBadge';
import { MessageReactions, MessageReactionsDisplay } from './MessageReactions';
import { CreateGroupDialog } from './CreateGroupDialog';
import { GroupMembersPanel } from './GroupMembersPanel';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '../../lib/utils';

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
  const [mentions, setMentions] = useState<MentionInput[]>([]);
  const [showConversationsList, setShowConversationsList] = useState(true);
  const [showUserSelector, setShowUserSelector] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showGroupMembers, setShowGroupMembers] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
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
  const editMessageMutation = useEditMessage();
  const deleteMessageMutation = useDeleteMessage();
  const addReactionMutation = useAddReaction();
  const removeReactionMutation = useRemoveReaction();

  const CONVERSATIONGROUP: string = 'GROUP';

  // Typing indicator
  const { typingUsers, sendTypingStarted, sendTypingStopped } = useTypingIndicator(selectedConversation);

  // Marquer les messages comme lus lorsque la conversation est sélectionnée
  useEffect(() => {
    if (selectedConversation) {
      markAsReadMutation.mutate(selectedConversation, {
        onSuccess: () => {
          console.log('Messages marqués comme lus');
        },
      });
    }
  }, [selectedConversation]);

  // Faire défiler vers le bas lorsque de nouveaux messages arrivent
  useEffect(() => {
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
    return () => clearTimeout(timer);
  }, [messages, selectedConversation]);

  const handleMessageChange = (value: string, newMentions: MentionInput[]) => {
    setMessageInput(value);
    setMentions(newMentions);
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;

    // Si on édite un message existant
    if (editingMessage) {
      try {
        await editMessageMutation.mutateAsync({
          messageId: editingMessage.id,
          content: messageInput.trim(),
        });
        setMessageInput('');
        setEditingMessage(null);
        refetchMessages();
      } catch (error) {
        console.error('Error editing message:', error);
      }
      return;
    }

    // Si on a un userId mais pas de conversation, créer la conversation
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
        setMentions([]);
        setReplyTo(null);
        return;
      } catch (error) {
        console.error('Error sending message:', error);
        return;
      }
    }

    if (!selectedConversation) return;

    try {
      await sendMessageMutation.mutateAsync({
        conversationId: selectedConversation,
        content: messageInput.trim(),
        replyToId: replyTo?.id,
        mentions: mentions.length > 0 ? mentions : undefined,
      });
      setMessageInput('');
      setMentions([]);
      setReplyTo(null);
      sendTypingStopped();
      setTimeout(() => refetchMessages(), 500);
    } catch (error) {
      console.error('Error sending message:', error);
      refetchMessages();
    }
  };

  const handleSelectUser = async (userId: string) => {
    setSelectedUserId(userId);
    setSelectedConversation(null);
    setShowUserSelector(false);
    setShowConversationsList(false);

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
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await deleteMessageMutation.mutateAsync(messageId);
      refetchMessages();
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const handleReaction = async (messageId: string, emoji: string, hasReacted: boolean) => {
    try {
      if (hasReacted) {
        await removeReactionMutation.mutateAsync({ messageId, emoji });
      } else {
        await addReactionMutation.mutateAsync({ messageId, emoji });
      }
      refetchMessages();
    } catch (error) {
      console.error('Error toggling reaction:', error);
    }
  };

  const selectedConversationData = conversations.find((c) => c.id === selectedConversation);
  const isGroupConversation = selectedConversationData?.conversationType === CONVERSATIONGROUP;

  const { data: usersResponse } = useUsers({});
  const selectedUserData = selectedUserId
    ? usersResponse?.data?.results?.find((u: any) => u.id?.toString() === selectedUserId)
    : null;

  const currentUserId = localStorage.getItem('user_id') || '';

  useEffect(() => {
    if (initialUserId && !initialConversationId) {
      handleSelectUser(initialUserId);
    }
  }, [initialUserId, initialConversationId]);

  // Get conversation display info
  const getConversationDisplayInfo = (conv: Conversation) => {
    
    if (conv.conversationType === CONVERSATIONGROUP) {
      return {
        name: conv.name || 'Groupe',
        initials: (conv.name || 'G').slice(0, 2).toUpperCase(),
        subtitle: `${conv.participantsList.length || 0} membres`,
      };
    }
    return {
      name: conv.otherParticipant?.fullName || 'Utilisateur',
      initials: conv.otherParticipant?.fullName
        ?.split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'U',
      subtitle: conv.otherParticipant?.email || '',
    };
  };

  return (
    <>
      <Card className="flex flex-col h-[600px] w-full max-w-4xl mx-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            <CardTitle>Messages</CardTitle>
          </div>
        </CardHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Liste des conversations */}
          {showConversationsList && !showUserSelector && (
            <div className="w-80 border-r flex flex-col">
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="font-semibold text-sm">Conversations</h3>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8">
                      <Plus className="h-4 w-4 mr-1" />
                      Nouveau
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setShowUserSelector(true)}>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Message direct
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowCreateGroup(true)}>
                      <Users className="h-4 w-4 mr-2" />
                      Nouveau groupe
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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
                    {conversations.map((conversation) => {
                      const info = getConversationDisplayInfo(conversation);
                      return (
                        <button
                          key={conversation.id}
                          onClick={() => {
                            setSelectedConversation(conversation.id);
                            setShowConversationsList(false);
                            setShowGroupMembers(false);
                          }}
                          className={cn(
                            'w-full p-4 text-left hover:bg-muted transition-colors',
                            selectedConversation === conversation.id && 'bg-muted'
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback
                                className={cn(
                                  conversation.conversationType === CONVERSATIONGROUP && 'bg-primary/10'
                                )}
                              >
                                {conversation.conversationType === CONVERSATIONGROUP ? (
                                  <Users className="h-5 w-5" />
                                ) : (
                                  info.initials
                                )}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className="font-medium text-sm truncate">{info.name}</p>
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
                              <small className='text-xs text-muted-foreground mt-1'>{ info.subtitle }</small>
                            </div>
                          </div>
                        </button>
                      );
                    })}
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
                excludeUserIds={conversations
                  .filter((c) => c.conversationType === 'direct' && c.otherParticipant)
                  .map((c) => c.otherParticipant!.id)}
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
                          setShowGroupMembers(false);
                        }}
                      >
                        <Users className="h-4 w-4" />
                      </Button>
                    )}
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className={cn(isGroupConversation && 'bg-primary/10')}>
                        {isGroupConversation ? (
                          <Users className="h-4 w-4" />
                        ) : (
                          (() => {
                            const user =
                              selectedConversationData?.otherParticipant ||
                              newConversation?.otherParticipant ||
                              (selectedUserData
                                ? {
                                    fullName:
                                      `${selectedUserData.first_name || ''} ${selectedUserData.last_name || ''}`.trim() ||
                                      selectedUserData.username,
                                  }
                                : null);
                            return (
                              user?.fullName
                                .split(' ')
                                .map((n: string) => n[0])
                                .join('')
                                .toUpperCase()
                                .slice(0, 2) || 'U'
                            );
                          })()
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">
                        {isGroupConversation
                          ? selectedConversationData?.name || 'Groupe'
                          : selectedConversationData?.otherParticipant?.fullName ||
                            newConversation?.otherParticipant?.fullName ||
                            (selectedUserData
                              ? `${selectedUserData.first_name || ''} ${selectedUserData.last_name || ''}`.trim() ||
                                selectedUserData.username
                              : 'Utilisateur')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isGroupConversation
                          ? `${selectedConversationData?.memberCount || 0} membres`
                          : selectedConversationData?.otherParticipant?.email ||
                            newConversation?.otherParticipant?.email ||
                            selectedUserData?.email ||
                            ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {isGroupConversation && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setShowGroupMembers(!showGroupMembers)}
                          title="Membres du groupe"
                        >
                          <Users className="h-4 w-4" />
                        </Button>
                        {selectedConversationData?.isAdmin && (
                          <Button variant="ghost" size="icon" title="Paramètres du groupe">
                            <Settings className="h-4 w-4" />
                          </Button>
                        )}
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedConversation(null);
                        setSelectedUserId(null);
                        setShowConversationsList(true);
                        setShowGroupMembers(false);
                      }}
                      title="Fermer la conversation"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex flex-1 overflow-hidden">
                  {/* Messages */}
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {selectedConversation ? (
                        messages.map((message) => {
                          const isOwnMessage =
                            message.sender.id === currentUserId ||
                            message.sender.username ===
                              JSON.parse(localStorage.getItem('user') || '{}').username;

                          if (message.isDeleted) {
                            return (
                              <div
                                key={message.id}
                                className={cn(
                                  'flex gap-3',
                                  isOwnMessage ? 'flex-row-reverse' : 'flex-row'
                                )}
                              >
                                <div className="text-xs text-muted-foreground italic">
                                  Message supprimé
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div
                              key={message.id}
                              className={cn(
                                'flex gap-3 group',
                                isOwnMessage ? 'flex-row-reverse' : 'flex-row'
                              )}
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
                                className={cn(
                                  'flex flex-col max-w-[70%]',
                                  isOwnMessage ? 'items-end' : 'items-start'
                                )}
                              >
                                {/* Reply preview */}
                                {message.replyTo && (
                                  <div className="text-xs text-muted-foreground mb-1 px-2 py-1 bg-muted/50 rounded border-l-2 border-primary">
                                    <span className="font-medium">
                                      {message.replyTo.sender.fullName}:
                                    </span>{' '}
                                    {message.replyTo.content.slice(0, 50)}
                                    {message.replyTo.content.length > 50 && '...'}
                                  </div>
                                )}

                                <div className="flex items-start gap-1">
                                  <div
                                    className={cn(
                                      'rounded-lg px-4 py-2',
                                      isOwnMessage
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted'
                                    )}
                                  >
                                    <p className="text-sm whitespace-pre-wrap">
                                      {message.mentions && message.mentions.length > 0
                                        ? renderMessageWithMentions(message.content, message.mentions)
                                        : parseAndRenderMentions(message.content)}
                                    </p>
                                  </div>

                                  {/* Message actions */}
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                        <MoreVertical className="h-3 w-3" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align={isOwnMessage ? 'end' : 'start'}>
                                      <DropdownMenuItem onClick={() => setReplyTo(message)}>
                                        <Reply className="h-4 w-4 mr-2" />
                                        Répondre
                                      </DropdownMenuItem>
                                      {isOwnMessage && (
                                        <>
                                          <DropdownMenuItem
                                            onClick={() => {
                                              setEditingMessage(message);
                                              setMessageInput(message.content);
                                            }}
                                          >
                                            <Pencil className="h-4 w-4 mr-2" />
                                            Modifier
                                          </DropdownMenuItem>
                                          <DropdownMenuSeparator />
                                          <DropdownMenuItem
                                            className="text-destructive focus:text-destructive"
                                            onClick={() => handleDeleteMessage(message.id)}
                                          >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Supprimer
                                          </DropdownMenuItem>
                                        </>
                                      )}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>

                                {/* Reactions */}
                                {message.reactions && message.reactions.length > 0 && (
                                  <MessageReactionsDisplay
                                    reactions={message.reactions}
                                    onReactionClick={(emoji) => {
                                      const reaction = message.reactions.find(
                                        (r) => r.emoji === emoji
                                      );
                                      handleReaction(
                                        message.id,
                                        emoji,
                                        reaction?.hasReacted || false
                                      );
                                    }}
                                  />
                                )}

                                {/* Message info */}
                                <div className="flex items-center gap-2 mt-1">
                                  <p className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(message.createdAt), {
                                      addSuffix: true,
                                      locale: fr,
                                    })}
                                  </p>
                                  {message.isEdited && (
                                    <span className="text-xs text-muted-foreground">(modifié)</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          <div className="text-center">
                            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>Aucun message pour le moment</p>
                            <p className="text-sm mt-2">
                              Envoyez le premier message pour démarrer la conversation
                            </p>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  {/* Group members panel */}
                  {showGroupMembers && isGroupConversation && selectedConversationData?.members && (
                    <div className="w-64 border-l">
                      <GroupMembersPanel
                        members={selectedConversationData.members}
                        conversationId={selectedConversation!}
                        isAdmin={selectedConversationData.isAdmin}
                        currentUserId={currentUserId}
                        groupName={selectedConversationData.name}
                        onMemberRemoved={refetchConversations}
                      />
                    </div>
                  )}
                </div>

                {/* Typing indicator */}
                {typingUsers.length > 0 && (
                  <div className="px-4 py-1 text-xs text-muted-foreground">
                    {typingUsers.length === 1
                      ? `${typingUsers[0].fullName} est en train d'écrire...`
                      : `${typingUsers.map((u) => u.fullName).join(', ')} sont en train d'écrire...`}
                  </div>
                )}

                {/* Zone de saisie */}
                <div className="p-4 border-t">
                  <ChatMentionInput
                    value={messageInput}
                    onChange={handleMessageChange}
                    onSend={handleSendMessage}
                    placeholder={
                      editingMessage
                        ? 'Modifier votre message...'
                        : selectedUserId && !selectedConversation
                          ? 'Tapez votre premier message...'
                          : 'Tapez votre message... (@ pour mentionner)'
                    }
                    disabled={sendMessageMutation.isPending || isLoadingNewConversation}
                    replyTo={
                      replyTo
                        ? {
                            id: replyTo.id,
                            content: replyTo.content,
                            senderName: replyTo.sender.fullName,
                          }
                        : null
                    }
                    onCancelReply={() => {
                      setReplyTo(null);
                      setEditingMessage(null);
                      setMessageInput('');
                    }}
                    onTypingStart={sendTypingStarted}
                    onTypingStop={sendTypingStopped}
                  />
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="mb-4">Sélectionnez une conversation pour commencer</p>
                  <div className="flex flex-col gap-2">
                    <Button onClick={() => setShowUserSelector(true)} variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Nouveau message
                    </Button>
                    <Button onClick={() => setShowCreateGroup(true)} variant="outline">
                      <Users className="h-4 w-4 mr-2" />
                      Créer un groupe
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Create group dialog */}
      <CreateGroupDialog
        open={showCreateGroup}
        onOpenChange={setShowCreateGroup}
        onGroupCreated={(conversationId) => {
          setSelectedConversation(conversationId);
          setShowConversationsList(false);
          refetchConversations();
        }}
      />
    </>
  );
}
