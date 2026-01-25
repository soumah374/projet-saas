import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { graphqlRequest, CHAT_QUERIES, CHAT_MUTATIONS } from '../services/graphql';
import { chatWebSocket, MessageData } from '../services/websocket';
import { toast } from 'sonner';

export interface User {
  id: string;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  fullName: string;
}

export interface ConversationMember {
  id: string;
  role: 'admin' | 'member';
  isMuted: boolean;
  joinedAt: string;
  user: User;
}

export interface Mention {
  id: string;
  mentionType: 'user' | 'project' | 'contrat' | 'devis' | 'facture';
  entityId: string;
  displayText: string;
  startPosition: number;
  endPosition: number;
}

export interface MentionInput {
  mentionType: string;
  entityId: string;
  displayText: string;
  startPosition: number;
  endPosition: number;
}

export interface Mentionable {
  id: string;
  mentionType: string;
  displayText: string;
  secondaryText?: string;
  reference: string;
}

export interface ReactionSummary {
  emoji: string;
  count: number;
  hasReacted: boolean;
  users?: User[];
}

export interface Message {
  id: string;
  content: string;
  sender: User;
  recipient?: User;
  isRead: boolean;
  readAt?: string;
  isEdited: boolean;
  editedAt?: string;
  isDeleted: boolean;
  replyTo?: {
    id: string;
    content: string;
    sender: User;
  };
  mentions: Mention[];
  reactions: ReactionSummary[];
  createdAt: string;
}

export interface Conversation {
  id: string;
  conversationType: 'direct' | 'group';
  name?: string;
  description?: string;
  otherParticipant?: User;
  lastMessage?: {
    id: string;
    content: string;
    sender: {
      id: string;
      username: string;
    };
    createdAt: string;
    isRead: boolean;
  };
  unreadCount: number;
  memberCount: number;
  isAdmin: boolean;
  isMuted?: boolean;
  members?: ConversationMember[];
  participantsList?: User[];
  updatedAt: string;
}

export function useConversations() {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const response = await graphqlRequest<{ conversations: Conversation[] }>(
        CHAT_QUERIES.GET_CONVERSATIONS
      );
      if (response.errors) {
        console.error('GraphQL errors:', response.errors);
        throw new Error(response.errors[0]?.message || 'Erreur lors de la récupération des conversations');
      }
      return response.data?.conversations || [];
    },
  });

  // Écouter les nouveaux messages via WebSocket
  useEffect(() => {
    const unsubscribe = chatWebSocket.subscribe('new_message', (data: { message: MessageData }) => {
      // Rafraîchir les conversations lorsqu'un nouveau message arrive
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      
      // Afficher une notification toast
      toast.info(`Nouveau message de ${data.message.sender.username}`, {
        description: data.message.content.substring(0, 100),
      });
    });

    return unsubscribe;
  }, [queryClient]);

  return {
    conversations: data || [],
    isLoading,
    error,
    refetch,
  };
}

export function useConversation(conversationId?: string, userId?: string) {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['conversation', conversationId, userId],
    queryFn: async () => {
      const response = await graphqlRequest<{ conversation: Conversation }>(
        CHAT_QUERIES.GET_CONVERSATION,
        { id: conversationId, userId }
      );
      if (response.errors) {
        throw new Error(response.errors[0]?.message || 'Erreur lors de la récupération de la conversation');
      }
      return response.data?.conversation;
    },
    enabled: !!conversationId || !!userId,
  });

  return {
    conversation: data,
    isLoading,
    error,
    refetch,
  };
}

export function useMessages(conversationId: string) {
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const limit = 50;

  const fetchMessages = useCallback(async (reset = false) => {
    const currentOffset = reset ? 0 : offset;
    
    const response = await graphqlRequest<{ messages: Message[] }>(
      CHAT_QUERIES.GET_MESSAGES,
      {
        conversationId,
        limit,
        offset: currentOffset,
      }
    );

    if (response.errors) {
      throw new Error(response.errors[0]?.message || 'Erreur lors de la récupération des messages');
    }

    const newMessages = response.data?.messages || [];
    
    // Les messages sont triés du plus ancien au plus récent (created_at croissant)
    if (reset) {
      setMessages(newMessages);
      setOffset(newMessages.length);
    } else {
      // Ajouter les nouveaux messages à la fin (messages plus anciens)
      setMessages((prev) => [...prev, ...newMessages]);
      setOffset((prev) => prev + newMessages.length);
    }

    setHasMore(newMessages.length === limit);
  }, [conversationId, offset]);

  useEffect(() => {
    if (conversationId) {
      fetchMessages(true);
      // S'abonner aux messages de cette conversation
      chatWebSocket.subscribeToConversation(conversationId);
    }

    return () => {
      if (conversationId) {
        chatWebSocket.unsubscribeFromConversation(conversationId);
      }
    };
  }, [conversationId]);

  // Écouter les nouveaux messages via WebSocket
  useEffect(() => {
    if (!conversationId) return;

    const unsubscribe = chatWebSocket.subscribe('message_added', (data: { message: MessageData }) => {
      if (data.message.conversation_id === conversationId) {
        // Vérifier si le message n'existe pas déjà (éviter les doublons)
        setMessages((prev) => {
          const messageExists = prev.some((msg) => msg.id === data.message.id);
          if (messageExists) {
            return prev;
          }
          
          // Ajouter le nouveau message à la fin (car les messages sont triés par date croissante)
          const newMessage: Message = {
            id: data.message.id,
            content: data.message.content,
            sender: {
              id: data.message.sender.id,
              username: data.message.sender.username,
              firstName: '',
              lastName: '',
              fullName: data.message.sender.full_name,
            },
            recipient: data.message.recipient_id ? {
              id: data.message.recipient_id,
              username: '',
              fullName: '',
            } : undefined,
            isRead: false,
            isEdited: data.message.is_edited || false,
            isDeleted: false,
            mentions: (data.message.mentions || []).map((m) => ({
              id: '',
              mentionType: m.mention_type as 'user' | 'project' | 'contrat' | 'devis' | 'facture',
              entityId: m.entity_id,
              displayText: m.display_text,
              startPosition: 0,
              endPosition: 0,
            })),
            reactions: [],
            createdAt: data.message.created_at,
          };
          
          return [...prev, newMessage];
        });
        
        // Rafraîchir les conversations
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      }
    });

    return unsubscribe;
  }, [conversationId, queryClient]);

  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  const loadMore = useCallback(() => {
    if (hasMore && !isLoadingMessages) {
      setIsLoadingMessages(true);
      fetchMessages().finally(() => setIsLoadingMessages(false));
    }
  }, [hasMore, isLoadingMessages, fetchMessages]);

  return {
    messages,
    isLoading: isLoadingMessages,
    hasMore,
    loadMore,
    refetch: () => fetchMessages(true),
  };
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      conversationId,
      recipientId,
      content,
      replyToId,
      mentions,
    }: {
      conversationId?: string;
      recipientId?: string;
      content: string;
      replyToId?: string;
      mentions?: MentionInput[];
    }) => {
      const response = await graphqlRequest<{
        sendMessage: {
          message: Message;
          conversation: Conversation;
        };
      }>(
        CHAT_MUTATIONS.SEND_MESSAGE,
        {
          conversationId,
          recipientId,
          content,
          replyToId,
          mentions,
        }
      );

      if (response.errors) {
        console.error('GraphQL send message errors:', response.errors);
        throw new Error(response.errors[0]?.message || 'Erreur lors de l\'envoi du message');
      }
      return response.data?.sendMessage;
    },
    onSuccess: (data, variables) => {
      // Rafraîchir les conversations
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      
      // Rafraîchir les messages de la conversation
      const convId = data?.conversation.id || variables.conversationId;
      if (convId) {
        queryClient.invalidateQueries({ queryKey: ['messages', convId] });
      }
      
      // Le message sera aussi reçu via WebSocket, donc pas besoin de l'ajouter manuellement
    },
  });

  return mutation;
}

export function useMarkMessagesAsRead() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (conversationId: string) => {
      const response = await graphqlRequest<{
        markMessagesAsRead: {
          success: boolean;
          conversation: { id: string };
        };
      }>(
        CHAT_MUTATIONS.MARK_MESSAGES_AS_READ,
        { conversationId }
      );

      if (response.errors) {
        throw new Error(response.errors[0]?.message || 'Erreur lors du marquage des messages');
      }

      return response.data?.markMessagesAsRead;
    },
    onSuccess: (data) => {
      // Rafraîchir les conversations et les messages
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      if (data?.conversation.id) {
        queryClient.invalidateQueries({ queryKey: ['messages', data.conversation.id] });
      }
      // Rafraîchir aussi les notifications pour mettre à jour leur statut
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  return mutation;
}

export function useUnreadCount() {
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['unreadMessagesCount'],
    queryFn: async () => {
      const response = await graphqlRequest<{ unreadMessagesCount: number }>(
        CHAT_QUERIES.GET_UNREAD_COUNT
      );
      if (response.errors) {
        throw new Error(response.errors[0]?.message || 'Erreur lors de la récupération du nombre de messages non lus');
      }
      return response.data?.unreadMessagesCount || 0;
    },
    refetchInterval: 30000, // Rafraîchir toutes les 30 secondes
  });

  // Écouter les nouveaux messages pour mettre à jour le compteur
  useEffect(() => {
    const unsubscribe = chatWebSocket.subscribe('new_message', () => {
      queryClient.invalidateQueries({ queryKey: ['unreadMessagesCount'] });
    });

    return unsubscribe;
  }, [queryClient]);

  return data || 0;
}

// Hook pour rechercher des éléments mentionnables
export function useSearchMentionables(query: string, mentionType?: string) {
  const { data, isLoading } = useQuery({
    queryKey: ['searchMentionables', query, mentionType],
    queryFn: async () => {
      if (!query || query.length < 1) return [];
      const response = await graphqlRequest<{ searchMentionables: Mentionable[] }>(
        CHAT_QUERIES.SEARCH_MENTIONABLES,
        { query, mentionType, limit: 10 }
      );
      if (response.errors) {
        throw new Error(response.errors[0]?.message);
      }
      return response.data?.searchMentionables || [];
    },
    enabled: query.length >= 1,
    staleTime: 5000,
  });

  return {
    mentionables: data || [],
    isLoading,
  };
}

// Hook pour rechercher dans les messages
export function useSearchMessages(query: string, conversationId?: string) {
  const { data, isLoading } = useQuery({
    queryKey: ['searchMessages', query, conversationId],
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      const response = await graphqlRequest<{ searchMessages: Message[] }>(
        CHAT_QUERIES.SEARCH_MESSAGES,
        { query, conversationId, limit: 50 }
      );
      if (response.errors) {
        throw new Error(response.errors[0]?.message);
      }
      return response.data?.searchMessages || [];
    },
    enabled: query.length >= 2,
  });

  return {
    messages: data || [],
    isLoading,
  };
}

// Hook pour créer un groupe
export function useCreateGroupConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      description,
      participantIds,
    }: {
      name: string;
      description?: string;
      participantIds: string[];
    }) => {
      const response = await graphqlRequest<{
        createGroupConversation: { conversation: Conversation };
      }>(CHAT_MUTATIONS.CREATE_GROUP_CONVERSATION, {
        name,
        description,
        participantIds,
      });

      if (response.errors) {
        throw new Error(response.errors[0]?.message || 'Erreur lors de la création du groupe');
      }

      return response.data?.createGroupConversation.conversation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast.success('Groupe créé avec succès');
    },
  });
}

// Hook pour modifier les paramètres du groupe
export function useUpdateGroupSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      conversationId,
      name,
      description,
    }: {
      conversationId: string;
      name?: string;
      description?: string;
    }) => {
      const response = await graphqlRequest<{
        updateGroupSettings: { conversation: Conversation };
      }>(CHAT_MUTATIONS.UPDATE_GROUP_SETTINGS, {
        conversationId,
        name,
        description,
      });

      if (response.errors) {
        throw new Error(response.errors[0]?.message);
      }

      return response.data?.updateGroupSettings.conversation;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['conversation', variables.conversationId] });
    },
  });
}

// Hook pour ajouter des membres au groupe
export function useAddGroupMembers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      conversationId,
      userIds,
    }: {
      conversationId: string;
      userIds: string[];
    }) => {
      const response = await graphqlRequest<{
        addGroupMembers: { conversation: Conversation; addedMembers: ConversationMember[] };
      }>(CHAT_MUTATIONS.ADD_GROUP_MEMBERS, { conversationId, userIds });

      if (response.errors) {
        throw new Error(response.errors[0]?.message);
      }

      return response.data?.addGroupMembers;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['conversation', variables.conversationId] });
      toast.success('Membres ajoutés avec succès');
    },
  });
}

// Hook pour retirer un membre du groupe
export function useRemoveGroupMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      conversationId,
      userId,
    }: {
      conversationId: string;
      userId: string;
    }) => {
      const response = await graphqlRequest<{
        removeGroupMember: { success: boolean };
      }>(CHAT_MUTATIONS.REMOVE_GROUP_MEMBER, { conversationId, userId });

      if (response.errors) {
        throw new Error(response.errors[0]?.message);
      }

      return response.data?.removeGroupMember;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['conversation', variables.conversationId] });
      toast.success('Membre retiré du groupe');
    },
  });
}

// Hook pour quitter un groupe
export function useLeaveGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      const response = await graphqlRequest<{
        leaveGroup: { success: boolean };
      }>(CHAT_MUTATIONS.LEAVE_GROUP, { conversationId });

      if (response.errors) {
        throw new Error(response.errors[0]?.message);
      }

      return response.data?.leaveGroup;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast.success('Vous avez quitté le groupe');
    },
  });
}

// Hook pour activer/désactiver les notifications d'un groupe
export function useToggleMuteGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      const response = await graphqlRequest<{
        toggleMuteGroup: { conversation: Conversation; isMuted: boolean };
      }>(CHAT_MUTATIONS.TOGGLE_MUTE_GROUP, { conversationId });

      if (response.errors) {
        throw new Error(response.errors[0]?.message);
      }

      return response.data?.toggleMuteGroup;
    },
    onSuccess: (data, conversationId) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });
      toast.success(data?.isMuted ? 'Notifications désactivées' : 'Notifications activées');
    },
  });
}

// Hook pour promouvoir ou rétrograder un membre du groupe
export function usePromoteGroupMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      conversationId,
      userId,
      role,
    }: {
      conversationId: string;
      userId: string;
      role: 'admin' | 'member';
    }) => {
      const response = await graphqlRequest<{
        promoteGroupMember: { success: boolean; member: ConversationMember };
      }>(CHAT_MUTATIONS.PROMOTE_GROUP_MEMBER, { conversationId, userId, role });

      if (response.errors) {
        throw new Error(response.errors[0]?.message);
      }

      return response.data?.promoteGroupMember;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['conversation', variables.conversationId] });
      const isPromotion = variables.role === 'admin';
      toast.success(isPromotion ? 'Membre promu administrateur' : 'Administrateur rétrogradé');
    },
  });
}

// Hook pour modifier un message
export function useEditMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      messageId,
      content,
    }: {
      messageId: string;
      content: string;
    }) => {
      const response = await graphqlRequest<{
        editMessage: { message: Message };
      }>(CHAT_MUTATIONS.EDIT_MESSAGE, { messageId, content });

      if (response.errors) {
        throw new Error(response.errors[0]?.message);
      }

      return response.data?.editMessage.message;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

// Hook pour supprimer un message
export function useDeleteMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messageId: string) => {
      const response = await graphqlRequest<{
        deleteMessage: { success: boolean };
      }>(CHAT_MUTATIONS.DELETE_MESSAGE, { messageId });

      if (response.errors) {
        throw new Error(response.errors[0]?.message);
      }

      return response.data?.deleteMessage;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

// Hook pour ajouter une réaction
export function useAddReaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      messageId,
      emoji,
    }: {
      messageId: string;
      emoji: string;
    }) => {
      const response = await graphqlRequest<{
        addReaction: { message: Message };
      }>(CHAT_MUTATIONS.ADD_REACTION, { messageId, emoji });

      if (response.errors) {
        throw new Error(response.errors[0]?.message);
      }

      return response.data?.addReaction.message;
    },
    onSuccess: () => {
      // Les mises à jour viendront via WebSocket
    },
  });
}

// Hook pour retirer une réaction
export function useRemoveReaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      messageId,
      emoji,
    }: {
      messageId: string;
      emoji: string;
    }) => {
      const response = await graphqlRequest<{
        removeReaction: { message: Message };
      }>(CHAT_MUTATIONS.REMOVE_REACTION, { messageId, emoji });

      if (response.errors) {
        throw new Error(response.errors[0]?.message);
      }

      return response.data?.removeReaction.message;
    },
    onSuccess: () => {
      // Les mises à jour viendront via WebSocket
    },
  });
}

// Hook pour gérer l'indicateur de frappe
export function useTypingIndicator(conversationId: string | null) {
  const [typingUsers, setTypingUsers] = useState<{ id: string; username: string; fullName: string }[]>([]);
  const typingTimeouts = useRef<Record<string, NodeJS.Timeout>>({});

  useEffect(() => {
    if (!conversationId) return;

    const handleTypingStarted = (data: { user: { id: string; username: string; full_name: string }; conversation_id: string }) => {
      if (data.conversation_id !== conversationId) return;

      setTypingUsers((prev) => {
        if (prev.some((u) => u.id === data.user.id)) return prev;
        return [...prev, { id: data.user.id, username: data.user.username, fullName: data.user.full_name }];
      });

      // Clear existing timeout for this user
      if (typingTimeouts.current[data.user.id]) {
        clearTimeout(typingTimeouts.current[data.user.id]);
      }

      // Set timeout to remove user after 3 seconds of no typing
      typingTimeouts.current[data.user.id] = setTimeout(() => {
        setTypingUsers((prev) => prev.filter((u) => u.id !== data.user.id));
      }, 3000);
    };

    const handleTypingStopped = (data: { user: { id: string }; conversation_id: string }) => {
      if (data.conversation_id !== conversationId) return;

      if (typingTimeouts.current[data.user.id]) {
        clearTimeout(typingTimeouts.current[data.user.id]);
      }
      setTypingUsers((prev) => prev.filter((u) => u.id !== data.user.id));
    };

    const unsubscribeStarted = chatWebSocket.subscribe('typing_started', handleTypingStarted);
    const unsubscribeStopped = chatWebSocket.subscribe('typing_stopped', handleTypingStopped);

    return () => {
      unsubscribeStarted();
      unsubscribeStopped();
      // Clear all timeouts
      Object.values(typingTimeouts.current).forEach(clearTimeout);
      typingTimeouts.current = {};
    };
  }, [conversationId]);

  const sendTypingStarted = useCallback(() => {
    if (conversationId) {
      chatWebSocket.send({
        type: 'typing_started',
        conversation_id: conversationId,
      });
    }
  }, [conversationId]);

  const sendTypingStopped = useCallback(() => {
    if (conversationId) {
      chatWebSocket.send({
        type: 'typing_stopped',
        conversation_id: conversationId,
      });
    }
  }, [conversationId]);

  return {
    typingUsers,
    sendTypingStarted,
    sendTypingStopped,
  };
}

