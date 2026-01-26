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
    query GetConversations($conversationType: String) {
      conversations(conversationType: $conversationType) {
        id
        conversationType
        name
        description
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
        memberCount
        isAdmin
        members {
          id
          role
          isMuted
          joinedAt
          user {
            id
            username
            firstName
            lastName
            fullName
          }
        }
        participantsList {
          id
          username
          firstName
          lastName
          fullName
        }
        updatedAt
      }
    }
  `,

  GET_CONVERSATION: `
    query GetConversation($id: ID, $userId: ID) {
      conversation(id: $id, userId: $userId) {
        id
        conversationType
        name
        description
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
        memberCount
        isAdmin
        members {
          id
          role
          isMuted
          joinedAt
          user {
            id
            username
            firstName
            lastName
            fullName
          }
        }
        participantsList {
          id
          username
          firstName
          lastName
          fullName
        }
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
        isEdited
        editedAt
        isDeleted
        replyTo {
          id
          content
          sender {
            id
            username
            fullName
          }
        }
        mentions {
          id
          mentionType
          entityId
          displayText
          startPosition
          endPosition
        }
        reactions {
          emoji
          count
          hasReacted
          users {
            id
            username
            fullName
          }
        }
        createdAt
      }
    }
  `,

  GET_UNREAD_COUNT: `
    query GetUnreadMessagesCount {
      unreadMessagesCount
    }
  `,

  SEARCH_MENTIONABLES: `
    query SearchMentionables($query: String!, $mentionType: String, $limit: Int) {
      searchMentionables(query: $query, mentionType: $mentionType, limit: $limit) {
        id
        mentionType
        displayText
        secondaryText
        reference
      }
    }
  `,

  SEARCH_MESSAGES: `
    query SearchMessages($query: String!, $conversationId: ID, $limit: Int) {
      searchMessages(query: $query, conversationId: $conversationId, limit: $limit) {
        id
        content
        sender {
          id
          username
          fullName
        }
        conversation {
          id
          name
        }
        createdAt
      }
    }
  `,
};

// Mutations GraphQL pour le chat
export const CHAT_MUTATIONS = {
  SEND_MESSAGE: `
    mutation SendMessage($conversationId: ID, $recipientId: ID, $content: String!, $replyToId: ID, $mentions: [MentionInput]) {
      sendMessage(conversationId: $conversationId, recipientId: $recipientId, content: $content, replyToId: $replyToId, mentions: $mentions) {
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
          isEdited
          replyTo {
            id
            content
            sender {
              id
              username
              fullName
            }
          }
          mentions {
            id
            mentionType
            entityId
            displayText
          }
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

  CREATE_GROUP_CONVERSATION: `
    mutation CreateGroupConversation($name: String!, $description: String, $participantIds: [ID]!) {
      createGroupConversation(name: $name, description: $description, participantIds: $participantIds) {
        conversation {
          id
          name
          description
          conversationType
          memberCount
          members {
            id
            role
            user {
              id
              username
              fullName
            }
          }
        }
      }
    }
  `,

  UPDATE_GROUP_SETTINGS: `
    mutation UpdateGroupSettings($conversationId: ID!, $name: String, $description: String) {
      updateGroupSettings(conversationId: $conversationId, name: $name, description: $description) {
        conversation {
          id
          name
          description
        }
      }
    }
  `,

  ADD_GROUP_MEMBERS: `
    mutation AddGroupMembers($conversationId: ID!, $userIds: [ID]!) {
      addGroupMembers(conversationId: $conversationId, userIds: $userIds) {
        conversation {
          id
          memberCount
        }
        addedMembers {
          id
          user {
            id
            username
            fullName
          }
          role
        }
      }
    }
  `,

  REMOVE_GROUP_MEMBER: `
    mutation RemoveGroupMember($conversationId: ID!, $userId: ID!) {
      removeGroupMember(conversationId: $conversationId, userId: $userId) {
        success
        conversation {
          id
          memberCount
        }
      }
    }
  `,

  LEAVE_GROUP: `
    mutation LeaveGroup($conversationId: ID!) {
      leaveGroup(conversationId: $conversationId) {
        success
      }
    }
  `,

  TOGGLE_MUTE_GROUP: `
    mutation ToggleMuteGroup($conversationId: ID!) {
      toggleMuteGroup(conversationId: $conversationId) {
        conversation {
          id
        }
        isMuted
      }
    }
  `,

  PROMOTE_GROUP_MEMBER: `
    mutation PromoteGroupMember($conversationId: ID!, $userId: ID!, $role: String!) {
      promoteGroupMember(conversationId: $conversationId, userId: $userId, role: $role) {
        success
        member {
          id
          role
          user {
            id
            username
            fullName
          }
        }
      }
    }
  `,

  EDIT_MESSAGE: `
    mutation EditMessage($messageId: ID!, $content: String!) {
      editMessage(messageId: $messageId, content: $content) {
        message {
          id
          content
          isEdited
          editedAt
        }
      }
    }
  `,

  DELETE_MESSAGE: `
    mutation DeleteMessage($messageId: ID!) {
      deleteMessage(messageId: $messageId) {
        success
      }
    }
  `,

  ADD_REACTION: `
    mutation AddReaction($messageId: ID!, $emoji: String!) {
      addReaction(messageId: $messageId, emoji: $emoji) {
        message {
          id
          reactions {
            emoji
            count
            hasReacted
          }
        }
      }
    }
  `,

  REMOVE_REACTION: `
    mutation RemoveReaction($messageId: ID!, $emoji: String!) {
      removeReaction(messageId: $messageId, emoji: $emoji) {
        message {
          id
          reactions {
            emoji
            count
            hasReacted
          }
        }
      }
    }
  `,
};

