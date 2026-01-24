# Système de Chat en Temps Réel avec GraphQL

Ce module implémente un système de chat en temps réel entre utilisateurs utilisant GraphQL pour les requêtes et mutations, et WebSockets pour les notifications en temps réel.

## Architecture

### Backend

- **Modèles** (`models.py`):
  - `Conversation`: Représente une conversation entre deux utilisateurs
  - `Message`: Représente un message dans une conversation

- **GraphQL** (`schema.py`):
  - **Queries**:
    - `conversations`: Récupère toutes les conversations de l'utilisateur connecté
    - `conversation`: Récupère une conversation spécifique ou en crée une nouvelle
    - `messages`: Récupère les messages d'une conversation
    - `unreadMessagesCount`: Récupère le nombre de messages non lus
  
  - **Mutations**:
    - `sendMessage`: Envoie un nouveau message
    - `markMessagesAsRead`: Marque les messages d'une conversation comme lus

- **WebSockets** (`consumers.py`):
  - `ChatConsumer`: Gère les connexions WebSocket pour les notifications en temps réel
  - Les utilisateurs reçoivent des notifications lorsqu'ils reçoivent un nouveau message

- **Notifications**:
  - Intégration avec le système de notifications existant
  - Création automatique d'une notification lorsqu'un message est reçu

### Frontend

- **Services**:
  - `graphql.ts`: Service pour les requêtes GraphQL
  - `websocket.ts`: Service WebSocket pour les notifications en temps réel

- **Hooks** (`use-chat.ts`):
  - `useConversations`: Récupère la liste des conversations
  - `useConversation`: Récupère une conversation spécifique
  - `useMessages`: Récupère les messages d'une conversation
  - `useSendMessage`: Envoie un message
  - `useMarkMessagesAsRead`: Marque les messages comme lus
  - `useUnreadCount`: Récupère le nombre de messages non lus

- **Composants**:
  - `ChatBox`: Composant principal de la chatbox
  - `ChatButton`: Bouton pour ouvrir la chatbox

## Installation

### Backend

1. Les dépendances sont déjà ajoutées dans `requirements.txt`:
   - `graphene-django==3.2.0`
   - `channels==4.0.0`
   - `channels-redis==4.2.0`
   - `daphne==4.1.0`

2. Créer les migrations:
```bash
python manage.py makemigrations chat
python manage.py migrate
```

3. Mettre à jour `docker-compose.yml` pour utiliser Daphne au lieu de `runserver`:
```yaml
backend:
  command: daphne -b 0.0.0.0 -p 8000 config.asgi:application
```

### Frontend

Les dépendances nécessaires sont déjà installées. Le système utilise:
- `@tanstack/react-query` pour la gestion des données
- `axios` pour les requêtes HTTP (utilisé par le service GraphQL)
- WebSocket natif pour les connexions temps réel

## Utilisation

### Ajouter le bouton de chat dans la navigation

```tsx
import { ChatButton } from './components/chat';

// Dans votre composant de navigation
<ChatButton />
```

### Utiliser le composant ChatBox directement

```tsx
import { ChatBox } from './components/chat';

<ChatBox 
  initialConversationId="123" // Optionnel
  initialUserId="456" // Optionnel
  onClose={() => console.log('Chat fermé')} // Optionnel
/>
```

### Utiliser les hooks dans vos composants

```tsx
import { useConversations, useSendMessage } from './hooks/use-chat';

function MyComponent() {
  const { conversations, isLoading } = useConversations();
  const sendMessage = useSendMessage();
  
  const handleSend = async () => {
    await sendMessage.mutateAsync({
      recipientId: '123',
      content: 'Bonjour!'
    });
  };
  
  return (
    // Votre composant
  );
}
```

## Endpoints GraphQL

### Endpoint GraphQL
- URL: `http://localhost:8000/graphql/`
- Interface GraphiQL disponible pour tester les requêtes

### Endpoint WebSocket
- URL: `ws://localhost:8000/ws/chat/`
- Authentification via token JWT dans les query params: `?token=<access_token>`

## Exemples de requêtes GraphQL

### Récupérer les conversations

```graphql
query {
  conversations {
    id
    otherParticipant {
      id
      username
      fullName
    }
    lastMessage {
      content
      createdAt
    }
    unreadCount
  }
}
```

### Envoyer un message

```graphql
mutation {
  sendMessage(recipientId: "123", content: "Bonjour!") {
    message {
      id
      content
      createdAt
    }
    conversation {
      id
    }
  }
}
```

### Récupérer les messages d'une conversation

```graphql
query {
  messages(conversationId: "123", limit: 50) {
    id
    content
    sender {
      username
      fullName
    }
    createdAt
    isRead
  }
}
```

## Configuration

### Variables d'environnement

Aucune variable d'environnement supplémentaire n'est nécessaire. Le système utilise:
- Redis pour les channels (déjà configuré dans `docker-compose.yml`)
- JWT pour l'authentification (déjà configuré)

### Permissions

Les utilisateurs peuvent uniquement:
- Voir leurs propres conversations
- Envoyer des messages dans leurs conversations
- Voir uniquement les messages des conversations auxquelles ils participent

## Notes importantes

1. **Authentification WebSocket**: L'authentification se fait via le token JWT passé dans les query params lors de la connexion WebSocket.

2. **Notifications**: Les notifications sont créées automatiquement lorsqu'un message est envoyé. Elles utilisent le système de notifications existant.

3. **Temps réel**: Les messages sont diffusés en temps réel via WebSockets. Les utilisateurs reçoivent une notification toast lorsqu'ils reçoivent un nouveau message.

4. **Performance**: Les messages sont paginés (50 par défaut) pour optimiser les performances.

5. **Sécurité**: Seuls les participants d'une conversation peuvent voir les messages de cette conversation.

