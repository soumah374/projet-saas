import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { graphqlRequest, CHAT_QUERIES, CHAT_MUTATIONS } from '../services/graphql';
import { chatWebSocket, MessageData } from '../services/websocket';
import { toast } from 'sonner';

export interface Conversation {
  id: string;
  otherParticipant: {
    id: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    fullName: string;
  };
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
  updatedAt: string;
}

export interface Message {
  id: string;
  content: string;
  sender: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    fullName: string;
  };
  recipient: {
    id: string;
    username: string;
  };
  isRead: boolean;
  readAt?: string;
  createdAt: string;
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
            recipient: {
              id: data.message.recipient_id || '',
              username: '',
            },
            isRead: false,
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
    }: {
      conversationId?: string;
      recipientId?: string;
      content: string;
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
        }
      );

      if (response.errors) {
        console.error('GraphQL send message errors:', response.errors);
        throw new Error(response.errors[0]?.message || 'Erreur lors de l\'envoi du message');
      }

      console.log('Message sent successfully:', response.data?.sendMessage);
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

