# Guide d'installation du système de Chat

Ce guide explique comment installer et configurer le système de chat en temps réel avec GraphQL.

## Prérequis

- Docker et Docker Compose installés
- Python 3.10+ (pour le développement local)
- Node.js 18+ (pour le frontend)

## Installation

### 1. Installer les dépendances backend

```bash
cd backend
pip install -r requirements.txt
```

Les nouvelles dépendances ajoutées sont:
- `graphene-django==3.2.0`
- `channels==4.0.0`
- `channels-redis==4.2.0`
- `daphne==4.1.0`

### 2. Créer les migrations

```bash
cd backend
python manage.py makemigrations chat
python manage.py migrate
```

### 3. Mettre à jour Docker Compose

Le fichier `docker-compose.yml` a été mis à jour pour utiliser Daphne au lieu de `runserver`. 

**Important**: Si vous utilisez Docker Compose, vous devez reconstruire l'image:

```bash
docker-compose build backend
docker-compose up -d
```

### 4. Vérifier l'installation

1. **Backend GraphQL**: Accédez à `http://localhost:8000/graphql/` pour voir l'interface GraphiQL

2. **WebSocket**: Vérifiez que Redis est en cours d'exécution:
```bash
docker-compose ps redis
```

### 5. Tester le système

#### Test GraphQL

1. Ouvrez `http://localhost:8000/graphql/`
2. Testez cette requête pour récupérer les conversations:

```graphql
query {
  conversations {
    id
    otherParticipant {
      username
      fullName
    }
    unreadCount
  }
}
```

#### Test WebSocket

Le WebSocket se connecte automatiquement lorsque vous utilisez le composant `ChatButton` dans le frontend.

## Utilisation dans le frontend

### Ajouter le bouton de chat

Dans votre composant de navigation (par exemple `TopNavigation.tsx`):

```tsx
import { ChatButton } from '../components/chat';

// Dans votre JSX
<ChatButton />
```

### Utiliser le composant ChatBox

```tsx
import { ChatBox } from '../components/chat';

<ChatBox 
  initialConversationId="123" // Optionnel
  initialUserId="456" // Optionnel
  onClose={() => console.log('Chat fermé')} // Optionnel
/>
```

## Configuration

### Variables d'environnement

Aucune variable d'environnement supplémentaire n'est nécessaire. Le système utilise:
- Redis pour les channels (déjà configuré)
- JWT pour l'authentification (déjà configuré)

### Permissions

Les utilisateurs peuvent uniquement:
- Voir leurs propres conversations
- Envoyer des messages dans leurs conversations
- Voir uniquement les messages des conversations auxquelles ils participent

## Dépannage

### Problème: WebSocket ne se connecte pas

1. Vérifiez que Redis est en cours d'exécution:
```bash
docker-compose ps redis
```

2. Vérifiez les logs du backend:
```bash
docker-compose logs backend
```

3. Vérifiez que le token JWT est valide dans le localStorage du navigateur

### Problème: Les messages ne s'affichent pas en temps réel

1. Vérifiez la console du navigateur pour les erreurs WebSocket
2. Vérifiez que le WebSocket est bien connecté (regardez les logs du backend)
3. Vérifiez que vous êtes bien authentifié

### Problème: Erreur "Module not found: channels"

1. Vérifiez que toutes les dépendances sont installées:
```bash
pip install -r requirements.txt
```

2. Vérifiez que `channels` est dans `INSTALLED_APPS` dans `settings.py`

### Problème: Daphne ne démarre pas

1. Vérifiez que Daphne est installé:
```bash
pip list | grep daphne
```

2. Si ce n'est pas le cas, installez-le:
```bash
pip install daphne
```

3. Vérifiez que le fichier `asgi.py` est correctement configuré

## Architecture

- **Backend**: Django + Graphene-Django (GraphQL) + Channels (WebSockets)
- **Frontend**: React + TypeScript + WebSocket API
- **Base de données**: PostgreSQL (pour les messages)
- **Cache/Message Broker**: Redis (pour les channels WebSocket)

## Support

Pour plus d'informations, consultez:
- `backend/chat/README.md` - Documentation détaillée du module chat
- Documentation Graphene-Django: https://docs.graphene-python.org/projects/django/en/latest/
- Documentation Channels: https://channels.readthedocs.io/

