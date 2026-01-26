import { useState, useEffect, useRef, useCallback } from 'react';
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
  useLeaveGroup,
  useToggleMuteGroup,
  Conversation,
  Message,
  MentionInput,
} from '../../hooks/use-chat';
import { useChatUpload } from '../../hooks/use-chat-upload';
import { MessageContent } from './MessageContent';
import { graphqlRequest, CHAT_QUERIES } from '../../services/graphql';
import { useUsers } from '../../hooks/use-users';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Card, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
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
  Search,
  ArrowDown,
  LogOut,
  BellOff,
  Bell,
  Check,
  CheckCheck,

  File as FileIcon,
  Image as ImageIcon,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { UserSelector } from './UserSelector';
import { ChatMentionInput } from './ChatMentionInput';
import { renderMessageWithMentions, parseAndRenderMentions } from './MentionBadge';
import { MessageReactionsDisplay } from './MessageReactions';
import { QuickReactionPicker } from './EmojiPicker';
import { CreateGroupDialog } from './CreateGroupDialog';
import { GroupMembersPanel } from './GroupMembersPanel';
import { GroupSettingsDialog } from './GroupSettingsDialog';
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
  const [conversationSearch, setConversationSearch] = useState('');
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [showLeaveGroupDialog, setShowLeaveGroupDialog] = useState(false);
  const [showGroupSettings, setShowGroupSettings] = useState(false);

  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);

  const { uploadFile, isLoading: isUploading } = useChatUpload();
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const CONVERSATIONGROUP: string = 'GROUP';

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
  const leaveGroupMutation = useLeaveGroup();
  const toggleMuteMutation = useToggleMuteGroup();

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

  const handleFileSelect = (files: FileList) => {
    setPendingFiles((prev) => [...prev, ...Array.from(files)]);
  };

  const removePendingFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() && pendingFiles.length === 0) return;

    // Si on édite un message existant (pas d'upload supporté pour l'instant en édition)
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

    if (!selectedConversation) return;

    try {
      let content = messageInput.trim();

      // Upload pending files
      if (pendingFiles.length > 0) {
        const results = await Promise.all(pendingFiles.map(file => uploadFile(file)));

        results.forEach((doc, index) => {
          if (!doc) return;
          const file = pendingFiles[index];
          const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(file.name.split('.').pop()?.toLowerCase() || '');
          // Configurer l'URL complète si nécessaire, mais supposons que l'API renvoie une URL ou un chemin relatif
          // Si c'est un chemin relatif, on devra peut-être ajouter le préfixe à l'affichage, 
          // mais stockons le tel quel pour l'instant.
          const url = doc.file;

          if (isImage) {
            content += `\n![${file.name}](${url})`;
          } else {
            content += `\n[${file.name}](${url})`;
          }
        });

        setPendingFiles([]);
      }

      if (!content.trim()) return;

      await sendMessageMutation.mutateAsync({
        conversationId: selectedConversation,
        content: content,
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

  // Handle leaving group
  const handleLeaveGroup = async () => {
    if (!selectedConversation) return;
    try {
      await leaveGroupMutation.mutateAsync(selectedConversation);
      setSelectedConversation(null);
      setShowLeaveGroupDialog(false);
      refetchConversations();
    } catch (error) {
      console.error('Error leaving group:', error);
    }
  };

  // Handle mute toggle
  const handleToggleMute = async () => {
    if (!selectedConversation) return;
    try {
      await toggleMuteMutation.mutateAsync(selectedConversation);
      refetchConversations();
    } catch (error) {
      console.error('Error toggling mute:', error);
    }
  };

  // Scroll to bottom function
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Handle scroll for showing/hiding scroll-to-bottom button
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const isAtBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 100;
    setShowScrollToBottom(!isAtBottom);
  }, []);

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

  // Filter conversations by search
  const filteredConversations = conversations.filter((conv) => {
    if (!conversationSearch.trim()) return true;
    const searchLower = conversationSearch.toLowerCase();
    const info = getConversationDisplayInfo(conv);
    return (
      info.name.toLowerCase().includes(searchLower) ||
      conv.lastMessage?.content?.toLowerCase().includes(searchLower)
    );
  });

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
              <div className="p-3 border-b space-y-2">
                <div className="flex items-center justify-between">
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
                {/* Search input */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher..."
                    value={conversationSearch}
                    onChange={(e) => setConversationSearch(e.target.value)}
                    className="pl-8 h-8 text-sm"
                  />
                </div>
              </div>
              <ScrollArea className="flex-1">
                {conversationsLoading ? (
                  <div className="p-4 text-sm text-muted-foreground">Chargement...</div>
                ) : filteredConversations.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground text-center">
                    {conversationSearch ? 'Aucun résultat' : 'Aucune conversation'}
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredConversations.map((conversation) => {
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
                              {/* <small className='text-xs text-muted-foreground mt-1'>{ info.subtitle }</small> */}
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
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setShowGroupMembers(!showGroupMembers)}
                              >
                                <Users className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Membres</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={handleToggleMute}>
                              {selectedConversationData?.isMuted ? (
                                <>
                                  <Bell className="h-4 w-4 mr-2" />
                                  Activer les notifications
                                </>
                              ) : (
                                <>
                                  <BellOff className="h-4 w-4 mr-2" />
                                  Désactiver les notifications
                                </>
                              )}
                            </DropdownMenuItem>
                            {selectedConversationData?.isAdmin && (
                              <DropdownMenuItem onClick={() => setShowGroupSettings(true)}>
                                <Settings className="h-4 w-4 mr-2" />
                                Paramètres
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setShowLeaveGroupDialog(true)}
                            >
                              <LogOut className="h-4 w-4 mr-2" />
                              Quitter le groupe
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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

                <div className="flex flex-1 overflow-hidden relative">
                  {/* Messages */}
                  <ScrollArea
                    className="flex-1 p-4"
                    ref={scrollAreaRef}
                    onScrollCapture={handleScroll}
                  >
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
                                'flex gap-3 group relative mt-2',
                                isOwnMessage ? 'flex-row-reverse' : 'flex-row'
                              )}
                              onMouseEnter={() => setHoveredMessageId(message.id)}
                              onMouseLeave={() => setHoveredMessageId(null)}
                            >
                              <Avatar className="h-8 w-8 shrink-0">
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
                                {/* Sender name for group messages */}
                                {isGroupConversation && !isOwnMessage && (
                                  <span className="text-xs text-muted-foreground mb-0.5">
                                    {message.sender.fullName}
                                  </span>
                                )}

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
                                    <div className="text-sm whitespace-pre-wrap">
                                      <MessageContent
                                        content={message.content}
                                        isOwnMessage={isOwnMessage}
                                        mentions={message.mentions}
                                      />
                                    </div>
                                  </div>

                                  {/* Quick reactions on hover */}
                                  {hoveredMessageId === message.id && (
                                    <div
                                      className={cn(
                                        'absolute -top-4 z-10',
                                        isOwnMessage ? 'right-10' : 'left-10'
                                      )}
                                    >
                                      <QuickReactionPicker
                                        onReactionSelect={(emoji) => {
                                          const existingReaction = message.reactions?.find(
                                            (r) => r.emoji === emoji
                                          );
                                          handleReaction(
                                            message.id,
                                            emoji,
                                            existingReaction?.hasReacted || false
                                          );
                                        }}
                                      />
                                    </div>
                                  )}

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
                                  {/* Read receipt for own messages */}
                                  {isOwnMessage && (
                                    <span className="text-xs text-muted-foreground">
                                      {message.isRead ? (
                                        <CheckCheck className="h-3 w-3 text-primary inline" />
                                      ) : (
                                        <Check className="h-3 w-3 inline" />
                                      )}
                                    </span>
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

                  {/* Scroll to bottom button */}
                  {showScrollToBottom && (
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute bottom-20 right-4 rounded-full shadow-lg z-10 h-10 w-10"
                      onClick={scrollToBottom}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                  )}

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

                {/* Pending files */}
                {pendingFiles.length > 0 && (
                  <div className="px-4 py-2 bg-muted/30 border-t flex flex-wrap gap-2">
                    {pendingFiles.map((file, index) => (
                      <div key={index} className="relative group bg-background border rounded-md p-2 flex items-center gap-2 pr-8">
                        <div className="bg-primary/10 p-1.5 rounded-full">
                          {['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(file.name.split('.').pop()?.toLowerCase() || '') ? (
                            <ImageIcon className="h-4 w-4 text-primary" />
                          ) : (
                            <FileIcon className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        <span className="text-xs max-w-[150px] truncate" title={file.name}>{file.name}</span>
                        <button
                          onClick={() => removePendingFile(index)}
                          className="absolute right-1 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
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
                    disabled={sendMessageMutation.isPending || isLoadingNewConversation || isUploading}
                    onFileSelect={handleFileSelect}
                    hasAttachments={pendingFiles.length > 0}
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

      {/* Leave group confirmation dialog */}
      <AlertDialog open={showLeaveGroupDialog} onOpenChange={setShowLeaveGroupDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Quitter le groupe ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir quitter le groupe{' '}
              <strong>{selectedConversationData?.name}</strong> ? Vous ne pourrez plus voir
              les messages de ce groupe.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLeaveGroup}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {leaveGroupMutation.isPending ? 'Sortie...' : 'Quitter'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Group settings dialog */}
      {selectedConversationData && isGroupConversation && (
        <GroupSettingsDialog
          open={showGroupSettings}
          onOpenChange={setShowGroupSettings}
          conversationId={selectedConversation!}
          groupName={selectedConversationData.name}
          groupDescription={selectedConversationData.description}
          members={selectedConversationData.members || []}
          isAdmin={selectedConversationData.isAdmin}
          currentUserId={currentUserId}
          onSettingsUpdated={refetchConversations}
        />
      )}
    </>
  );
}
