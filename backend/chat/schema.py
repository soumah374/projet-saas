import graphene
from graphene_django import DjangoObjectType
from graphql import GraphQLError
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from django.db.models import Q
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from .models import Conversation, Message
from notifications.models import Notification
from django.contrib.contenttypes.models import ContentType

User = get_user_model()


def get_user_from_context(info):
    """Récupère l'utilisateur depuis le contexte GraphQL"""
    request = info.context
    user = getattr(request, 'user', None)
    
    # Si pas d'utilisateur, essayer d'authentifier avec JWT
    if not user or isinstance(user, AnonymousUser):
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            try:
                jwt_auth = JWTAuthentication()
                validated_token = jwt_auth.get_validated_token(token)
                user = jwt_auth.get_user(validated_token)
                request.user = user
            except (InvalidToken, TokenError):
                user = AnonymousUser()
    
    return user


class UserType(DjangoObjectType):
    """Type GraphQL pour les utilisateurs"""
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name')
    
    full_name = graphene.String()
    
    def resolve_full_name(self, info):
        return f"{self.first_name} {self.last_name}".strip() or self.username


class MessageType(DjangoObjectType):
    """Type GraphQL pour les messages"""
    class Meta:
        model = Message
        fields = '__all__'


class ConversationType(DjangoObjectType):
    """Type GraphQL pour les conversations"""
    class Meta:
        model = Conversation
        fields = '__all__'
    
    other_participant = graphene.Field(UserType)
    last_message = graphene.Field(MessageType)
    unread_count = graphene.Int()
    
    def resolve_other_participant(self, info):
        user = get_user_from_context(info)
        if not user or not user.is_authenticated:
            return None
        return self.get_other_participant(user)
    
    def resolve_last_message(self, info):
        return self.get_last_message()
    
    def resolve_unread_count(self, info):
        user = get_user_from_context(info)
        if not user or not user.is_authenticated:
            return 0
        return self.messages.filter(recipient=user, is_read=False).count()


class Query(graphene.ObjectType):
    """Queries GraphQL pour le chat"""
    
    conversations = graphene.List(
        ConversationType,
        description="Récupère toutes les conversations de l'utilisateur connecté"
    )
    
    conversation = graphene.Field(
        ConversationType,
        id=graphene.ID(required=True),
        user_id=graphene.ID(required=False),
        description="Récupère une conversation spécifique ou en crée une nouvelle avec un utilisateur"
    )
    
    messages = graphene.List(
        MessageType,
        conversation_id=graphene.ID(required=True),
        limit=graphene.Int(required=False),
        offset=graphene.Int(required=False),
        description="Récupère les messages d'une conversation"
    )
    
    unread_messages_count = graphene.Int(
        description="Récupère le nombre total de messages non lus"
    )
    
    def resolve_conversations(self, info):
        """Récupère toutes les conversations de l'utilisateur connecté"""
        user = get_user_from_context(info)
        if not user or not user.is_authenticated:
            raise GraphQLError("Vous devez être connecté pour voir vos conversations")
        
        return Conversation.objects.filter(participants=user).distinct()
    
    def resolve_conversation(self, info, id=None, user_id=None):
        """Récupère une conversation spécifique ou en crée une nouvelle"""
        user = get_user_from_context(info)
        if not user or not user.is_authenticated:
            raise GraphQLError("Vous devez être connecté")
        
        # Si un ID est fourni, récupérer la conversation existante
        if id:
            try:
                conversation = Conversation.objects.get(id=id, participants=user)
                return conversation
            except Conversation.DoesNotExist:
                raise GraphQLError("Conversation non trouvée")
        
        # Si un user_id est fourni, créer ou récupérer une conversation avec cet utilisateur
        if user_id:
            try:
                other_user = User.objects.get(id=user_id)
                if other_user == user:
                    raise GraphQLError("Vous ne pouvez pas créer une conversation avec vous-même")
                
                # Chercher une conversation existante
                conversation = Conversation.objects.filter(
                    participants=user
                ).filter(
                    participants=other_user
                ).distinct().first()
                
                # Si aucune conversation n'existe, en créer une nouvelle
                if not conversation:
                    conversation = Conversation.objects.create()
                    conversation.participants.add(user, other_user)
                
                return conversation
            except User.DoesNotExist:
                raise GraphQLError("Utilisateur non trouvé")
        
        raise GraphQLError("Vous devez fournir un ID de conversation ou un ID d'utilisateur")
    
    def resolve_messages(self, info, conversation_id, limit=50, offset=0):
        """Récupère les messages d'une conversation"""
        user = get_user_from_context(info)
        if not user or not user.is_authenticated:
            raise GraphQLError("Vous devez être connecté pour voir les messages")
        
        try:
            conversation = Conversation.objects.get(id=conversation_id, participants=user)
        except Conversation.DoesNotExist:
            raise GraphQLError("Conversation non trouvée")
        
        return conversation.messages.all()[offset:offset+limit]
    
    def resolve_unread_messages_count(self, info):
        """Récupère le nombre total de messages non lus"""
        user = get_user_from_context(info)
        if not user or not user.is_authenticated:
            return 0
        
        return Message.objects.filter(recipient=user, is_read=False).count()


class SendMessage(graphene.Mutation):
    """Mutation pour envoyer un message"""
    
    class Arguments:
        conversation_id = graphene.ID(required=False)
        recipient_id = graphene.ID(required=False)
        content = graphene.String(required=True)
    
    message = graphene.Field(MessageType)
    conversation = graphene.Field(ConversationType)
    
    @staticmethod
    def mutate(root, info, content, conversation_id=None, recipient_id=None):
        user = get_user_from_context(info)
        if not user or not user.is_authenticated:
            raise GraphQLError("Vous devez être connecté pour envoyer un message")
        
        if not content.strip():
            raise GraphQLError("Le contenu du message ne peut pas être vide")
        
        # Si conversation_id est fourni, utiliser cette conversation
        if conversation_id:
            try:
                conversation = Conversation.objects.get(id=conversation_id, participants=user)
                recipient = conversation.get_other_participant(user)
                if not recipient:
                    raise GraphQLError("Destinataire non trouvé dans la conversation")
            except Conversation.DoesNotExist:
                raise GraphQLError("Conversation non trouvée")
        
        # Sinon, si recipient_id est fourni, créer ou récupérer une conversation
        elif recipient_id:
            try:
                recipient = User.objects.get(id=recipient_id)
                if recipient == user:
                    raise GraphQLError("Vous ne pouvez pas vous envoyer un message")
                
                # Chercher ou créer une conversation
                conversation = Conversation.objects.filter(
                    participants=user
                ).filter(
                    participants=recipient
                ).distinct().first()
                
                if not conversation:
                    conversation = Conversation.objects.create()
                    conversation.participants.add(user, recipient)
            except User.DoesNotExist:
                raise GraphQLError("Destinataire non trouvé")
        
        else:
            raise GraphQLError("Vous devez fournir un ID de conversation ou un ID de destinataire")
        
        # Créer le message
        message = Message.objects.create(
            conversation=conversation,
            sender=user,
            recipient=recipient,
            content=content
        )
        
        # Mettre à jour la date de mise à jour de la conversation
        conversation.save()
        
        # Créer une notification pour le destinataire
        content_type = ContentType.objects.get_for_model(message)
        Notification.objects.create(
            recipient=recipient,
            type='message',
            content_type=content_type,
            object_id=str(message.id),
            message=f"Nouveau message de {user.username}: {content[:100]}",
            metadata={
                'sender_id': str(user.id),
                'sender_username': user.username,
                'conversation_id': str(conversation.id),
                'message_preview': content[:100]
            }
        )
        
        # Envoyer une notification via WebSocket
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"user_{recipient.id}",
            {
                "type": "new_message",
                "message": {
                    "id": str(message.id),
                    "conversation_id": str(conversation.id),
                    "sender": {
                        "id": str(user.id),
                        "username": user.username,
                        "full_name": f"{user.first_name} {user.last_name}".strip() or user.username
                    },
                    "content": content,
                    "created_at": message.created_at.isoformat(),
                }
            }
        )
        
        # Envoyer aussi une notification pour la conversation (pour tous les participants)
        async_to_sync(channel_layer.group_send)(
            f"conversation_{conversation.id}",
            {
                "type": "message_added",
                "message": {
                    "id": str(message.id),
                    "conversation_id": str(conversation.id),
                    "sender": {
                        "id": str(user.id),
                        "username": user.username,
                        "full_name": f"{user.first_name} {user.last_name}".strip() or user.username
                    },
                    "recipient_id": str(recipient.id),
                    "content": content,
                    "created_at": message.created_at.isoformat(),
                }
            }
        )
        
        return SendMessage(message=message, conversation=conversation)


class MarkMessagesAsRead(graphene.Mutation):
    """Mutation pour marquer les messages comme lus"""
    
    class Arguments:
        conversation_id = graphene.ID(required=True)
    
    success = graphene.Boolean()
    conversation = graphene.Field(ConversationType)
    
    @staticmethod
    def mutate(root, info, conversation_id):
        user = get_user_from_context(info)
        if not user or not user.is_authenticated:
            raise GraphQLError("Vous devez être connecté")
        
        try:
            conversation = Conversation.objects.get(id=conversation_id, participants=user)
        except Conversation.DoesNotExist:
            raise GraphQLError("Conversation non trouvée")
        
        # Marquer tous les messages non lus comme lus
        unread_messages = conversation.messages.filter(
            recipient=user,
            is_read=False
        )
        
        # Récupérer les IDs des messages avant de les marquer comme lus
        message_ids = list(unread_messages.values_list('id', flat=True))
        
        # Marquer les messages comme lus
        from django.utils import timezone
        updated = unread_messages.update(is_read=True, read_at=timezone.now())
        
        # Marquer aussi les notifications associées à ces messages comme lues
        if message_ids:
            from django.contrib.contenttypes.models import ContentType
            message_content_type = ContentType.objects.get_for_model(Message)
            Notification.objects.filter(
                recipient=user,
                type='message',
                content_type=message_content_type,
                object_id__in=[str(msg_id) for msg_id in message_ids],
                is_read=False
            ).update(is_read=True)
        
        return MarkMessagesAsRead(success=True, conversation=conversation)


class Mutation(graphene.ObjectType):
    """Mutations GraphQL pour le chat"""
    send_message = SendMessage.Field()
    mark_messages_as_read = MarkMessagesAsRead.Field()


# Note: Les subscriptions GraphQL sont gérées via WebSockets directement
# Pour une implémentation complète avec Graphene Subscriptions, 
# il faudrait utiliser channels_graphql_ws ou une bibliothèque similaire
schema = graphene.Schema(query=Query, mutation=Mutation)

