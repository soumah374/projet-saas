import { config } from '../lib/config';

const GRAPHQL_URL = config.api.baseUrl.replace('/api/v1', '/graphql/');

export interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{
    message: string;
    extensions?: any;
  }>;
}

export async function graphqlRequest<T>(
  query: string,
  variables?: Record<string, any>
): Promise<GraphQLResponse<T>> {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  if (!response.ok) {
    throw new Error(`GraphQL request failed: ${response.statusText}`);
  }

  return response.json();
}

// Queries GraphQL pour le chat
export const CHAT_QUERIES = {
  GET_CONVERSATIONS: `
    query GetConversations {
      conversations {
        id
        otherParticipant {
          id
          username
          email
          firstName
          lastName
          fullName
        }
        lastMessage {
          id
          content
          sender {
            id
            username
          }
          createdAt
          isRead
        }
        unreadCount
        updatedAt
      }
    }
  `,
  
  GET_CONVERSATION: `
    query GetConversation($id: ID, $userId: ID) {
      conversation(id: $id, userId: $userId) {
        id
        otherParticipant {
          id
          username
          email
          firstName
          lastName
          fullName
        }
        lastMessage {
          id
          content
          sender {
            id
            username
          }
          createdAt
          isRead
        }
        unreadCount
        updatedAt
      }
    }
  `,
  
  GET_MESSAGES: `
    query GetMessages($conversationId: ID!, $limit: Int, $offset: Int) {
      messages(conversationId: $conversationId, limit: $limit, offset: $offset) {
        id
        content
        sender {
          id
          username
          firstName
          lastName
          fullName
        }
        recipient {
          id
          username
        }
        isRead
        readAt
        createdAt
      }
    }
  `,
  
  GET_UNREAD_COUNT: `
    query GetUnreadMessagesCount {
      unreadMessagesCount
    }
  `,
};

// Mutations GraphQL pour le chat
export const CHAT_MUTATIONS = {
  SEND_MESSAGE: `
    mutation SendMessage($conversationId: ID, $recipientId: ID, $content: String!) {
      sendMessage(conversationId: $conversationId, recipientId: $recipientId, content: $content) {
        message {
          id
          content
          sender {
            id
            username
            firstName
            lastName
            fullName
          }
          recipient {
            id
            username
          }
          isRead
          createdAt
        }
        conversation {
          id
          updatedAt
        }
      }
    }
  `,
  
  MARK_MESSAGES_AS_READ: `
    mutation MarkMessagesAsRead($conversationId: ID!) {
      markMessagesAsRead(conversationId: $conversationId) {
        success
        conversation {
          id
        }
      }
    }
  `,
};

