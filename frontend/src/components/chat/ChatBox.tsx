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
import { usePresence } from '../../hooks/use-presence';
import { MessageContent } from './MessageContent';
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
  ArrowLeft,
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
import { MessageReactionsDisplay } from './MessageReactions';
import { QuickReactionPicker } from './EmojiPicker';
import { AddMemberView } from './AddMemberView';
import { CreateGroupView } from './CreateGroupView';
import { GroupMembersPanel } from './GroupMembersPanel';
import { GroupSettingsView } from './GroupSettingsView';
import { cn } from '../../lib/utils';

interface ChatBoxProps {
  onClose?: () => void;
  initialConversationId?: string;
  initialUserId?: string;
}

const OnlineIndicator = ({ className }: { className?: string }) => (
  <span className={cn("absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background", className)} />
);

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
  const [activeOverlay, setActiveOverlay] = useState<'createGroup' | 'groupSettings' | 'addMembers' | null>(null);
  const [showGroupMembers, setShowGroupMembers] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [conversationSearch, setConversationSearch] = useState('');
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [showLeaveGroupDialog, setShowLeaveGroupDialog] = useState(false);

  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);

  const { uploadFile, isLoading: isUploading } = useChatUpload();
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const CONVERSATIONGROUP: string = 'GROUP';
  const CONVERSATIONDIRECT: string = 'DIRECT';

  const { isOnline } = usePresence();

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

  const handleSelectUser = (userId: string) => {
    // Le hook useConversation gère automatiquement la création/récupération
    // quand selectedUserId change
    setSelectedUserId(userId);
    setSelectedConversation(null);
    setShowUserSelector(false);
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
        isOnline: false, // Groups don't have online status
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
      isOnline: conv.otherParticipant?.id ? isOnline(conv.otherParticipant.id) : false,
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
      <Card className="flex flex-col h-[85vh] md:h-[600px] w-full max-w-5xl mx-auto overflow-hidden relative border rounded-lg shadow-xl">
        {/* Header */}
        <div className="flex flex-row items-center justify-between p-3 border-b bg-card">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Messages</h3>
          </div>
          <div className="flex items-center gap-1">
            {onClose && (
              <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden relative bg-muted/10">

          {/* LEFT PANE: Conversation List */}
          <div className={cn(
            "flex flex-col border-r bg-background transition-all duration-300",
            (selectedConversation || selectedUserId) ? "hidden md:flex md:w-80" : "w-full md:w-80"
          )}>
            {showUserSelector ? (
              <div className="flex flex-col h-full">
                <div className="p-3 border-b flex items-center justify-between">
                  <h3 className="font-semibold text-sm">Nouveau message</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowUserSelector(false);
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
                  }}
                  disabled={isLoadingNewConversation}
                  excludeUserIds={conversations
                    .filter((c) => c.conversationType === CONVERSATIONDIRECT && c.otherParticipant)
                    .map((c) => c.otherParticipant!.id)}
                />
              </div>
            ) : (
              <div className="flex flex-col h-full">
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
                        <DropdownMenuItem onSelect={() => setShowUserSelector(true)}>
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Message direct
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setActiveOverlay('createGroup')}>
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
                      className="pl-8 h-8 text-sm bg-muted/50"
                    />
                  </div>
                </div>
                <ScrollArea className="flex-1">
                  {conversationsLoading ? (
                    <div className="p-4 text-sm text-muted-foreground text-center">Chargement...</div>
                  ) : filteredConversations.length === 0 ? (
                    <div className="p-4 text-sm text-muted-foreground text-center">
                      {conversationSearch ? 'Aucun résultat' : 'Aucune conversation'}
                    </div>
                  ) : (
                    <div className="divide-y">
                      {filteredConversations.map((conversation) => {
                        const info = getConversationDisplayInfo(conversation);
                        console.log(info)
                        return (
                          <button
                            key={conversation.id}
                            onClick={() => {
                              setSelectedConversation(conversation.id);
                              setShowConversationsList(false); // Only relevant for mobile view logic
                              setShowGroupMembers(false);
                            }}
                            className={cn(
                              'w-full p-4 text-left hover:bg-muted/80 transition-colors',
                              selectedConversation === conversation.id && 'bg-primary/5 hover:bg-primary/10 border-l-4 border-primary pl-3'
                            )}
                          >
                            <div className="flex items-start gap-3">
                              <div className="relative">
                                <Avatar className="h-10 w-10 border shadow-sm">
                                  <AvatarFallback
                                    className={cn(
                                      conversation.conversationType === CONVERSATIONGROUP && 'bg-primary/10 text-primary'
                                    )}
                                  >
                                    {conversation.conversationType === CONVERSATIONGROUP ? (
                                      <Users className="h-5 w-5" />
                                    ) : (
                                      info.initials
                                    )}
                                  </AvatarFallback>
                                </Avatar>
                                {info.isOnline && <OnlineIndicator />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1">
                                  <p className="font-medium text-sm truncate text-foreground">{info.name}</p>
                                  {conversation.unreadCount > 0 && (
                                    <Badge variant="destructive" className="h-5 min-w-5 text-[10px] px-1">
                                      {conversation.unreadCount}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex justify-between items-center mt-1">
                                  <p className="text-xs text-muted-foreground truncate max-w-[120px]">
                                    {conversation.lastMessage ? conversation.lastMessage.content :
                                      <span className="italic">Aucun message</span>}
                                  </p>
                                  {conversation.lastMessage && (
                                    <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                                      {formatDistanceToNow(new Date(conversation.lastMessage.createdAt), {
                                        addSuffix: false,
                                        locale: fr,
                                      })}
                                    </span>
                                  )}
                                </div>
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
          </div>

          {/* RIGHT PANE: Chat Area */}
          <div className={cn(
            "flex-1 flex flex-col bg-background min-w-0",
            !(selectedConversation || selectedUserId) && "hidden md:flex"
          )}>
            {isLoadingNewConversation && selectedUserId && !selectedConversation ? (
              <div className="flex-1 flex items-center justify-center text-muted-foreground flex-col gap-2">
                <MessageSquare className="h-10 w-10 opacity-20 animate-pulse" />
                <p className="text-sm">Chargement...</p>
              </div>
            ) : selectedConversation || (selectedUserId && (newConversation || selectedUserData)) ? (
              <>
                {/* En-tête de la conversation */}
                <div className="p-3 border-b flex items-center justify-between bg-card shadow-sm z-10">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="md:hidden h-8 w-8 -ml-1"
                      onClick={() => {
                        setSelectedConversation(null);
                        setSelectedUserId(null);
                        // Back to list on mobile
                      }}
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>

                    <div className="relative">
                      <Avatar className="h-9 w-9 border">
                        <AvatarFallback className={cn(isGroupConversation && 'bg-primary/10 text-primary')}>
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

                      {/* Indicator for current chat */}
                      {!isGroupConversation && (
                        (selectedConversationData?.otherParticipant?.id && isOnline(selectedConversationData.otherParticipant.id)) ||
                        (newConversation?.otherParticipant?.id && isOnline(newConversation.otherParticipant.id)) ||
                        (selectedUserData?.id && isOnline(selectedUserData.id.toString()))
                      ) && (
                          <OnlineIndicator />
                        )}
                    </div>

                    <div className="flex flex-col">
                      <p className="font-semibold text-sm leading-none">
                        {isGroupConversation
                          ? selectedConversationData?.name || 'Groupe'
                          : selectedConversationData?.otherParticipant?.fullName ||
                          newConversation?.otherParticipant?.fullName ||
                          (selectedUserData
                            ? `${selectedUserData.first_name || ''} ${selectedUserData.last_name || ''}`.trim() ||
                            selectedUserData.username
                            : 'Utilisateur')}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-muted-foreground mt-1">
                          {isGroupConversation
                            ? `${selectedConversationData?.memberCount || 0} membres`
                            : selectedConversationData?.otherParticipant?.email ||
                            newConversation?.otherParticipant?.email ||
                            selectedUserData?.email ||
                            ''}
                        </p>
                        {/* Online Status Text */}
                        {!isGroupConversation && (
                          (selectedConversationData?.otherParticipant?.id && isOnline(selectedConversationData.otherParticipant.id)) ||
                          (newConversation?.otherParticipant?.id && isOnline(newConversation.otherParticipant.id)) ||
                          (selectedUserData?.id && isOnline(selectedUserData.id.toString()))
                        ) && (
                            <span className="text-[10px] text-green-600 font-medium flex items-center gap-1 mt-0.5">
                              • En ligne
                            </span>
                          )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {isGroupConversation && (
                      <>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant={showGroupMembers ? "secondary" : "ghost"}
                                size="icon"
                                className="h-8 w-8"
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
                            <Button variant="ghost" size="icon" className="h-8 w-8">
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
                              <DropdownMenuItem onClick={() => setActiveOverlay('groupSettings')}>
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
                  </div>
                </div>

                <div className="flex flex-1 overflow-hidden relative">
                  {/* Messages */}
                  <ScrollArea
                    className="flex-1 p-4 bg-muted/5"
                    ref={scrollAreaRef}
                    onScrollCapture={handleScroll}
                  >
                    <div className="space-y-6 pb-2">
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
                                <div className="text-xs text-muted-foreground italic px-4 py-2 bg-muted/30 rounded-lg">
                                  Message supprimé
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div
                              key={message.id}
                              className={cn(
                                'flex gap-3 group relative',
                                isOwnMessage ? 'flex-row-reverse' : 'flex-row'
                              )}
                              onMouseEnter={() => setHoveredMessageId(message.id)}
                              onMouseLeave={() => setHoveredMessageId(null)}
                            >
                              <Avatar className="h-8 w-8 shrink-0 mt-1">
                                <AvatarFallback className="text-[10px]">
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
                                  <span className="text-[10px] text-muted-foreground mb-1 ml-1">
                                    {message.sender.fullName}
                                  </span>
                                )}

                                {/* Reply preview */}
                                {message.replyTo && (
                                  <div className="text-xs text-muted-foreground mb-1 px-3 py-1.5 bg-muted/50 rounded-md border-l-2 border-primary w-full text-left">
                                    <span className="font-medium">
                                      {message.replyTo.sender.fullName}:
                                    </span>{' '}
                                    {message.replyTo.content.slice(0, 50)}
                                    {message.replyTo.content.length > 50 && '...'}
                                  </div>
                                )}

                                <div className="flex items-start gap-1 relative mt-2">
                                  <div
                                    className={cn(
                                      'rounded-2xl px-4 py-2.5 shadow-sm text-sm',
                                      isOwnMessage
                                        ? 'bg-primary text-primary-foreground rounded-tr-none'
                                        : 'bg-white border rounded-tl-none'
                                    )}
                                  >
                                    <div className="whitespace-pre-wrap leading-relaxed">
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
                                        'absolute -top-8 z-10 transition-all opacity-0 group-hover:opacity-100',
                                        isOwnMessage ? 'right-0' : 'left-0'
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
                                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity absolute top-1/2 -translate-y-1/2 -mx-8 text-muted-foreground hover:text-foreground"
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
                                  <div className={cn("mt-0", isOwnMessage ? "mr-1" : "ml-1")}>
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
                                  </div>
                                )}

                                {/* Message info */}
                                <div className={cn("flex items-center gap-1.5 mt-1 px-1", isOwnMessage ? "justify-end" : "justify-start")}>
                                  <p className="text-[10px] text-muted-foreground/70">
                                    {formatDistanceToNow(new Date(message.createdAt), {
                                      addSuffix: true,
                                      locale: fr,
                                    })}
                                  </p>
                                  {message.isEdited && (
                                    <span className="text-[10px] text-muted-foreground/70">(modifié)</span>
                                  )}
                                  {/* Read receipt for own messages */}
                                  {isOwnMessage && (
                                    <span className="text-muted-foreground/70">
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
                        <div className="flex items-center justify-center h-full pt-20 text-muted-foreground">
                          <div className="text-center">
                            <div className="bg-muted/30 p-4 rounded-full inline-block mb-4">
                              <MessageSquare className="h-8 w-8 opacity-50" />
                            </div>
                            <p>Aucun message pour le moment</p>
                            <p className="text-sm mt-2 max-w-xs mx-auto">
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
                      className="absolute bottom-20 right-4 rounded-full shadow-lg z-10 h-8 w-8 bg-background border"
                      onClick={scrollToBottom}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                  )}

                  {/* Group members panel */}
                  {showGroupMembers && isGroupConversation && selectedConversationData?.members && (
                    <div className="w-60 border-l bg-background hidden lg:block">
                      <GroupMembersPanel
                        members={selectedConversationData.members}
                        conversationId={selectedConversation!}
                        isAdmin={selectedConversationData.isAdmin}
                        currentUserId={currentUserId}
                        groupName={selectedConversationData.name}
                        onMemberRemoved={refetchConversations}
                        onAddMemberClick={() => setActiveOverlay('addMembers')}
                      />
                    </div>
                  )}
                  {/* Internal Panel for Mobile/Tablet Group Members if needed, but for now relying on split view or just desktop */}
                </div>

                {/* Typing indicator */}
                {typingUsers.length > 0 && (
                  <div className="px-4 py-1 text-[10px] font-medium text-primary animate-pulse bg-primary/5">
                    {typingUsers.length === 1
                      ? `${typingUsers[0].fullName} est en train d'écrire...`
                      : `${typingUsers.map((u) => u.fullName).join(', ')} sont en train d'écrire...`}
                  </div>
                )}

                {/* Pending files */}
                {pendingFiles.length > 0 && (
                  <div className="px-4 py-2 bg-muted/30 border-t flex flex-wrap gap-2">
                    {pendingFiles.map((file, index) => (
                      <div key={index} className="relative group bg-background border rounded-md p-2 flex items-center gap-2 pr-8 shadow-sm">
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
                <div className="p-3 border-t bg-background">
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
              <div className="flex-1 flex items-center justify-center text-muted-foreground bg-muted/5">
                <div className="text-center p-8">
                  <div className="bg-muted/50 p-6 rounded-full inline-block mb-4 shadow-sm">
                    <MessageSquare className="h-12 w-12 text-muted-foreground/50" />
                  </div>
                  <h3 className="font-medium text-foreground mb-2">Vos messages</h3>
                  <p className="mb-6 text-sm max-w-[250px] mx-auto">
                    Sélectionnez une discussion pour commencer à échanger
                  </p>
                  <div className="flex flex-col gap-3 w-full max-w-xs mx-auto">
                    <Button onClick={() => setShowUserSelector(true)} variant="default" className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Nouveau message
                    </Button>
                    <Button onClick={() => setActiveOverlay('createGroup')} variant="outline" className="w-full bg-background">
                      <Users className="h-4 w-4 mr-2" />
                      Créer un groupe
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* INTERNAL VIEWS (Overlays) */}

          {/* Create Group View */}
          {activeOverlay === 'createGroup' && (
            <CreateGroupView
              onBack={() => setActiveOverlay(null)}
              onGroupCreated={(conversationId) => {
                setSelectedConversation(conversationId);
                setActiveOverlay(null);
                refetchConversations();
              }}
            />
          )}

          {/* Group Settings View */}
          {activeOverlay === 'groupSettings' && selectedConversationData && (
            <GroupSettingsView
              onBack={() => setActiveOverlay(null)}
              conversationId={selectedConversation!}
              groupName={selectedConversationData.name}
              groupDescription={selectedConversationData.description}
              members={selectedConversationData.members || []}
              isAdmin={selectedConversationData.isAdmin}
              currentUserId={currentUserId}
              onSettingsUpdated={refetchConversations}
            />
          )}

          {/* Add Members View */}
          {activeOverlay === 'addMembers' && selectedConversationData && (
            <AddMemberView
              conversationId={selectedConversation!}
              currentMemberIds={selectedConversationData.members?.map(m => String(m.user.id)) || []}
              onBack={() => setActiveOverlay(null)}
              onMembersAdded={() => {
                setActiveOverlay(null);
                refetchConversations();
              }}
            />
          )}

        </div>
      </Card >

      {/* Leave group confirmation dialog - Keeping as Dialog/Alert since it's just a confirmation */}
      < AlertDialog open={showLeaveGroupDialog} onOpenChange={setShowLeaveGroupDialog} >
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
      </AlertDialog >

    </>
  );
}
