# Guide de débogage du système de Chat

## Vérifications à faire

### 1. Vérifier que les migrations sont appliquées

```bash
cd backend
python manage.py makemigrations chat
python manage.py migrate
```

### 2. Vérifier que Redis est en cours d'exécution

```bash
docker-compose ps redis
# ou
redis-cli ping
# Devrait répondre: PONG
```

### 3. Vérifier les logs du backend

```bash
docker-compose logs backend
# Chercher les erreurs liées à:
# - GraphQL
# - WebSocket
# - Channels
# - Redis
```

### 4. Vérifier la console du navigateur

Ouvrez la console du navigateur (F12) et vérifiez:
- Les erreurs JavaScript
- Les messages de connexion WebSocket
- Les erreurs GraphQL

### 5. Tester GraphQL directement

1. Ouvrez `http://localhost:8000/graphql/` dans votre navigateur
2. Testez cette requête (remplacez YOUR_TOKEN par votre token JWT):

```graphql
query {
  conversations {
    id
    otherParticipant {
      username
      fullName
    }
  }
}
```

Dans les headers, ajoutez:
```
Authorization: Bearer YOUR_TOKEN
```

### 6. Tester l'envoi de message

```graphql
mutation {
  sendMessage(recipientId: "2", content: "Test message") {
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

### 7. Vérifier le WebSocket

Dans la console du navigateur, vous devriez voir:
- `WebSocket connected successfully` quand la connexion réussit
- Les erreurs de connexion sinon

### 8. Vérifier l'authentification

Le token JWT doit être présent dans:
- `localStorage.getItem('access_token')` pour GraphQL
- Les query params du WebSocket: `ws://localhost:8000/ws/chat/?token=YOUR_TOKEN`

### 9. Problèmes courants

#### Le WebSocket ne se connecte pas
- Vérifiez que le token est valide
- Vérifiez que Redis est en cours d'exécution
- Vérifiez les CORS dans settings.py
- Vérifiez que Daphne est utilisé au lieu de runserver

#### Les messages GraphQL échouent
- Vérifiez que le token JWT est valide
- Vérifiez que l'utilisateur est authentifié
- Vérifiez les logs du backend pour les erreurs détaillées

#### Les messages ne s'affichent pas
- Vérifiez que le WebSocket est connecté
- Vérifiez que vous êtes abonné à la conversation
- Vérifiez les logs dans la console du navigateur

### 10. Commandes utiles

```bash
# Redémarrer le backend
docker-compose restart backend

# Voir les logs en temps réel
docker-compose logs -f backend

# Vérifier les connexions Redis
redis-cli
> CLIENT LIST

# Vérifier les channels actifs
redis-cli
> PUBSUB CHANNELS
```

