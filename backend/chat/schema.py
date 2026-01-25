import re
import graphene
from graphene_django import DjangoObjectType
from graphql import GraphQLError
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from django.db.models import Q, Count
from django.db import transaction
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from .models import (
    Conversation, Message, ConversationMember,
    MessageMention, MessageAttachment, MessageReaction
)
from notifications.models import Notification
from django.contrib.contenttypes.models import ContentType

User = get_user_model()

# Import models for mentionables
from projects.models import Project
from contrats.models import Contrat
from devis.models import Devis
from billings.models import Facture


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


class MentionType(DjangoObjectType):
    """Type GraphQL pour les mentions"""
    class Meta:
        model = MessageMention
        fields = ('id', 'mention_type', 'entity_id', 'display_text', 'start_position', 'end_position')


class AttachmentType(DjangoObjectType):
    """Type GraphQL pour les pièces jointes"""
    class Meta:
        model = MessageAttachment
        fields = ('id', 'filename', 'file_type', 'file_size', 'created_at')

    url = graphene.String()

    def resolve_url(self, info):
        if self.file:
            return self.file.url
        return None


class ReactionType(DjangoObjectType):
    """Type GraphQL pour les réactions"""
    class Meta:
        model = MessageReaction
        fields = ('id', 'emoji', 'created_at')

    user = graphene.Field(UserType)

    def resolve_user(self, info):
        return self.user


class ReactionSummaryType(graphene.ObjectType):
    """Résumé des réactions pour un message"""
    emoji = graphene.String()
    count = graphene.Int()
    users = graphene.List(UserType)
    has_reacted = graphene.Boolean()


class ConversationMemberType(DjangoObjectType):
    """Type GraphQL pour les membres de conversation"""
    class Meta:
        model = ConversationMember
        fields = ('id', 'role', 'is_muted', 'joined_at', 'last_read_at')

    user = graphene.Field(UserType)

    def resolve_user(self, info):
        return self.user


class MentionableType(graphene.ObjectType):
    """Type pour les éléments pouvant être mentionnés"""
    id = graphene.String()
    mention_type = graphene.String()
    display_text = graphene.String()
    secondary_text = graphene.String()
    reference = graphene.String()


class MessageType(DjangoObjectType):
    """Type GraphQL pour les messages"""
    class Meta:
        model = Message
        fields = (
            'id', 'content', 'is_read', 'read_at', 'is_edited', 'edited_at',
            'is_deleted', 'created_at', 'updated_at'
        )

    sender = graphene.Field(UserType)
    recipient = graphene.Field(UserType)
    conversation = graphene.Field(lambda: ConversationType)
    mentions = graphene.List(MentionType)
    attachments = graphene.List(AttachmentType)
    reactions = graphene.List(ReactionSummaryType)
    reply_to = graphene.Field(lambda: MessageType)

    def resolve_sender(self, info):
        return self.sender

    def resolve_recipient(self, info):
        return self.recipient

    def resolve_mentions(self, info):
        return self.mentions.all()

    def resolve_attachments(self, info):
        return self.attachments.all()

    def resolve_reactions(self, info):
        user = get_user_from_context(info)
        reactions = self.reactions.values('emoji').annotate(count=Count('id'))
        result = []
        for reaction in reactions:
            emoji = reaction['emoji']
            users = User.objects.filter(message_reactions__message=self, message_reactions__emoji=emoji)
            has_reacted = users.filter(id=user.id).exists() if user and user.is_authenticated else False
            result.append(ReactionSummaryType(
                emoji=emoji,
                count=reaction['count'],
                users=list(users),
                has_reacted=has_reacted
            ))
        return result

    def resolve_reply_to(self, info):
        return self.reply_to


class ConversationType(DjangoObjectType):
    """Type GraphQL pour les conversations"""
    class Meta:
        model = Conversation
        fields = ('id', 'conversation_type', 'name', 'description', 'created_at', 'updated_at')

    other_participant = graphene.Field(UserType)
    last_message = graphene.Field(MessageType)
    unread_count = graphene.Int()
    members = graphene.List(ConversationMemberType)
    participants_list = graphene.List(UserType)
    created_by = graphene.Field(UserType)
    is_admin = graphene.Boolean()
    member_count = graphene.Int()

    def resolve_other_participant(self, info):
        user = get_user_from_context(info)
        if not user or not user.is_authenticated:
            return None
        if self.conversation_type == 'group':
            return None
        return self.get_other_participant(user)

    def resolve_last_message(self, info):
        return self.messages.filter(is_deleted=False).order_by('-created_at').first()

    def resolve_unread_count(self, info):
        user = get_user_from_context(info)
        if not user or not user.is_authenticated:
            return 0
        if self.conversation_type == 'group':
            # Pour les groupes, compter les messages non lus depuis last_read_at
            membership = self.memberships.filter(user=user).first()
            if membership and membership.last_read_at:
                return self.messages.filter(
                    created_at__gt=membership.last_read_at,
                    is_deleted=False
                ).exclude(sender=user).count()
            return self.messages.filter(is_deleted=False).exclude(sender=user).count()
        return self.messages.filter(recipient=user, is_read=False, is_deleted=False).count()

    def resolve_members(self, info):
        return self.memberships.select_related('user').all()

    def resolve_participants_list(self, info):
        return self.participants.all()

    def resolve_created_by(self, info):
        return self.created_by

    def resolve_is_admin(self, info):
        user = get_user_from_context(info)
        if not user or not user.is_authenticated:
            return False
        return self.is_admin(user)

    def resolve_member_count(self, info):
        return self.participants.count()


class Query(graphene.ObjectType):
    """Queries GraphQL pour le chat"""

    conversations = graphene.List(
        ConversationType,
        conversation_type=graphene.String(required=False),
        description="Récupère toutes les conversations de l'utilisateur connecté"
    )

    conversation = graphene.Field(
        ConversationType,
        id=graphene.ID(required=False),
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

    search_mentionables = graphene.List(
        MentionableType,
        query=graphene.String(required=True),
        mention_type=graphene.String(required=False),
        limit=graphene.Int(required=False),
        description="Recherche des éléments pouvant être mentionnés"
    )

    search_messages = graphene.List(
        MessageType,
        query=graphene.String(required=True),
        conversation_id=graphene.ID(required=False),
        limit=graphene.Int(required=False),
        description="Recherche dans les messages"
    )

    def resolve_conversations(self, info, conversation_type=None):
        """Récupère toutes les conversations de l'utilisateur connecté"""
        user = get_user_from_context(info)
        if not user or not user.is_authenticated:
            raise GraphQLError("Vous devez être connecté pour voir vos conversations")

        queryset = Conversation.objects.filter(participants=user).distinct()
        if conversation_type:
            queryset = queryset.filter(conversation_type=conversation_type)
        return queryset

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

        # Si un user_id est fourni, créer ou récupérer une conversation directe avec cet utilisateur
        if user_id:
            try:
                other_user = User.objects.get(id=user_id)
                if other_user == user:
                    raise GraphQLError("Vous ne pouvez pas créer une conversation avec vous-même")

                # Chercher une conversation directe existante
                conversation = Conversation.objects.filter(
                    memberships__user=user,
                    conversation_type='direct'
                ).filter(
                    memberships__user=other_user
                ).distinct().first()

                # Si aucune conversation n'existe, en créer une nouvelle
                if not conversation:
                    with transaction.atomic():
                        conversation = Conversation.objects.create(conversation_type='direct')
                        ConversationMember.objects.create(
                            conversation=conversation,
                            user=user,
                            role='member'
                        )
                        ConversationMember.objects.create(
                            conversation=conversation,
                            user=other_user,
                            role='member'
                        )

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

        return conversation.messages.filter(is_deleted=False)[offset:offset+limit]

    def resolve_unread_messages_count(self, info):
        """Récupère le nombre total de messages non lus"""
        user = get_user_from_context(info)
        if not user or not user.is_authenticated:
            return 0

        # Messages non lus dans les conversations directes
        direct_count = Message.objects.filter(
            recipient=user,
            is_read=False,
            is_deleted=False
        ).count()

        # Messages non lus dans les groupes
        group_memberships = ConversationMember.objects.filter(
            user=user,
            conversation__conversation_type='group'
        )
        group_count = 0
        for membership in group_memberships:
            if membership.last_read_at:
                group_count += Message.objects.filter(
                    conversation=membership.conversation,
                    created_at__gt=membership.last_read_at,
                    is_deleted=False
                ).exclude(sender=user).count()
            else:
                group_count += Message.objects.filter(
                    conversation=membership.conversation,
                    is_deleted=False
                ).exclude(sender=user).count()

        return direct_count + group_count

    def resolve_search_mentionables(self, info, query, mention_type=None, limit=10):
        """Recherche des éléments pouvant être mentionnés"""
        user = get_user_from_context(info)
        if not user or not user.is_authenticated:
            raise GraphQLError("Vous devez être connecté")

        results = []
        query_lower = query.lower()

        # Recherche d'utilisateurs
        if not mention_type or mention_type == 'user':
            users = User.objects.filter(
                Q(username__icontains=query) |
                Q(first_name__icontains=query) |
                Q(last_name__icontains=query) |
                Q(email__icontains=query)
            ).exclude(id=user.id)[:limit]

            for u in users:
                full_name = f"{u.first_name} {u.last_name}".strip() or u.username
                results.append(MentionableType(
                    id=str(u.id),
                    mention_type='user',
                    display_text=full_name,
                    secondary_text=u.email,
                    reference=f"@{u.username}"
                ))

        # Recherche de projets
        if not mention_type or mention_type == 'project':
            try:
                projects = Project.objects.filter(
                    Q(nom__icontains=query) |
                    Q(reference__icontains=query)
                )[:limit]

                for p in projects:
                    results.append(MentionableType(
                        id=str(p.id),
                        mention_type='project',
                        display_text=p.nom,
                        secondary_text=p.reference if hasattr(p, 'reference') else '',
                        reference=f"@p:{p.id}"
                    ))
            except Exception:
                pass

        # Recherche de contrats
        if not mention_type or mention_type == 'contrat':
            try:
                contrats = Contrat.objects.filter(
                    Q(numero__icontains=query) |
                    Q(client__nom__icontains=query)
                )[:limit]

                for c in contrats:
                    results.append(MentionableType(
                        id=str(c.id),
                        mention_type='contrat',
                        display_text=f"Contrat {c.numero}",
                        secondary_text=c.client.nom if hasattr(c, 'client') and c.client else '',
                        reference=f"@c:{c.numero}"
                    ))
            except Exception:
                pass

        # Recherche de devis
        if not mention_type or mention_type == 'devis':
            try:
                devis_list = Devis.objects.filter(
                    Q(numero__icontains=query) |
                    Q(client__nom__icontains=query)
                )[:limit]

                for d in devis_list:
                    results.append(MentionableType(
                        id=str(d.id),
                        mention_type='devis',
                        display_text=f"Devis {d.numero}",
                        secondary_text=d.client.nom if hasattr(d, 'client') and d.client else '',
                        reference=f"@d:{d.numero}"
                    ))
            except Exception:
                pass

        # Recherche de factures
        if not mention_type or mention_type == 'facture':
            try:
                factures = Facture.objects.filter(
                    Q(numero__icontains=query) |
                    Q(client__nom__icontains=query)
                )[:limit]

                for f in factures:
                    results.append(MentionableType(
                        id=str(f.id),
                        mention_type='facture',
                        display_text=f"Facture {f.numero}",
                        secondary_text=f.client.nom if hasattr(f, 'client') and f.client else '',
                        reference=f"@f:{f.numero}"
                    ))
            except Exception:
                pass

        return results[:limit]

    def resolve_search_messages(self, info, query, conversation_id=None, limit=50):
        """Recherche dans les messages"""
        user = get_user_from_context(info)
        if not user or not user.is_authenticated:
            raise GraphQLError("Vous devez être connecté")

        queryset = Message.objects.filter(
            conversation__participants=user,
            is_deleted=False,
            content__icontains=query
        )

        if conversation_id:
            queryset = queryset.filter(conversation_id=conversation_id)

        return queryset.order_by('-created_at')[:limit]


class MentionInput(graphene.InputObjectType):
    """Input pour les mentions"""
    mention_type = graphene.String(required=True)
    entity_id = graphene.String(required=True)
    display_text = graphene.String(required=True)
    start_position = graphene.Int(required=True)
    end_position = graphene.Int(required=True)


def parse_mentions_from_content(content):
    """Parse les mentions depuis le contenu du message"""
    mentions = []

    # Pattern pour les mentions: @username, @p:id, @projet:id, @c:numero, @contrat:numero, @d:numero, @devis:numero, @f:numero, @facture:numero
    patterns = [
        (r'@(\w+)', 'user'),
        (r'@p:(\S+)', 'project'),
        (r'@projet:(\S+)', 'project'),
        (r'@c:(\S+)', 'contrat'),
        (r'@contrat:(\S+)', 'contrat'),
        (r'@d:(\S+)', 'devis'),
        (r'@devis:(\S+)', 'devis'),
        (r'@f:(\S+)', 'facture'),
        (r'@facture:(\S+)', 'facture'),
    ]

    for pattern, mention_type in patterns:
        for match in re.finditer(pattern, content):
            entity_ref = match.group(1)
            entity_id = None
            display_text = match.group(0)

            try:
                if mention_type == 'user':
                    user = User.objects.filter(username=entity_ref).first()
                    if user:
                        entity_id = str(user.id)
                        display_text = f"@{user.first_name} {user.last_name}".strip() or f"@{user.username}"
                elif mention_type == 'project':
                    project = Project.objects.filter(Q(id=entity_ref) | Q(reference=entity_ref)).first()
                    if project:
                        entity_id = str(project.id)
                        display_text = f"@{project.nom}"
                elif mention_type == 'contrat':
                    contrat = Contrat.objects.filter(Q(id=entity_ref) | Q(numero=entity_ref)).first()
                    if contrat:
                        entity_id = str(contrat.id)
                        display_text = f"@Contrat {contrat.numero}"
                elif mention_type == 'devis':
                    devis = Devis.objects.filter(Q(id=entity_ref) | Q(numero=entity_ref)).first()
                    if devis:
                        entity_id = str(devis.id)
                        display_text = f"@Devis {devis.numero}"
                elif mention_type == 'facture':
                    facture = Facture.objects.filter(Q(id=entity_ref) | Q(numero=entity_ref)).first()
                    if facture:
                        entity_id = str(facture.id)
                        display_text = f"@Facture {facture.numero}"
            except Exception:
                pass

            if entity_id:
                mentions.append({
                    'mention_type': mention_type,
                    'entity_id': entity_id,
                    'display_text': display_text,
                    'start_position': match.start(),
                    'end_position': match.end()
                })

    return mentions


class SendMessage(graphene.Mutation):
    """Mutation pour envoyer un message"""

    class Arguments:
        conversation_id = graphene.ID(required=False)
        recipient_id = graphene.ID(required=False)
        content = graphene.String(required=True)
        reply_to_id = graphene.ID(required=False)
        mentions = graphene.List(MentionInput, required=False)

    message = graphene.Field(MessageType)
    conversation = graphene.Field(ConversationType)

    @staticmethod
    def mutate(root, info, content, conversation_id=None, recipient_id=None, reply_to_id=None, mentions=None):
        user = get_user_from_context(info)
        if not user or not user.is_authenticated:
            raise GraphQLError("Vous devez être connecté pour envoyer un message")

        if not content.strip():
            raise GraphQLError("Le contenu du message ne peut pas être vide")

        recipient = None
        conversation = None

        # Si conversation_id est fourni, utiliser cette conversation
        if conversation_id:
            try:
                conversation = Conversation.objects.get(id=conversation_id, participants=user)
                if conversation.conversation_type == 'direct':
                    recipient = conversation.get_other_participant(user)
            except Conversation.DoesNotExist:
                raise GraphQLError("Conversation non trouvée")

        # Sinon, si recipient_id est fourni, créer ou récupérer une conversation directe
        elif recipient_id:
            try:
                recipient = User.objects.get(id=recipient_id)
                if recipient == user:
                    raise GraphQLError("Vous ne pouvez pas vous envoyer un message")

                # Chercher ou créer une conversation directe
                conversation = Conversation.objects.filter(
                    memberships__user=user,
                    conversation_type='direct'
                ).filter(
                    memberships__user=recipient
                ).distinct().first()

                if not conversation:
                    with transaction.atomic():
                        conversation = Conversation.objects.create(conversation_type='direct')
                        # Éviter les doublons de membres
                        if not conversation.memberships.filter(user=user).exists():
                            ConversationMember.objects.create(
                                conversation=conversation,
                                user=user,
                                role='member'
                            )
                        if not conversation.memberships.filter(user=recipient).exists():
                            ConversationMember.objects.create(
                                conversation=conversation,
                                user=recipient,
                                role='member'
                            )
            except User.DoesNotExist:
                raise GraphQLError("Destinataire non trouvé")

        else:
            raise GraphQLError("Vous devez fournir un ID de conversation ou un ID de destinataire")

        # Vérifier reply_to
        reply_to = None
        if reply_to_id:
            try:
                reply_to = Message.objects.get(id=reply_to_id, conversation=conversation)
            except Message.DoesNotExist:
                raise GraphQLError("Message de référence non trouvé")

        with transaction.atomic():
            # Créer le message
            message = Message.objects.create(
                conversation=conversation,
                sender=user,
                recipient=recipient,
                content=content,
                reply_to=reply_to
            )

            # Traiter les mentions (depuis l'input ou parser automatiquement)
            if mentions:
                for mention in mentions:
                    MessageMention.objects.create(
                        message=message,
                        mention_type=mention.mention_type,
                        entity_id=mention.entity_id,
                        display_text=mention.display_text,
                        start_position=mention.start_position,
                        end_position=mention.end_position
                    )
            else:
                # Parser automatiquement les mentions depuis le contenu
                parsed_mentions = parse_mentions_from_content(content)
                for mention in parsed_mentions:
                    MessageMention.objects.create(message=message, **mention)

            # Mettre à jour la date de mise à jour de la conversation
            conversation.save()

        # Créer des notifications
        content_type = ContentType.objects.get_for_model(message)

        if conversation.conversation_type == 'direct' and recipient:
            # Notification pour le destinataire direct
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
        elif conversation.memberships.exists():
            # Notification pour tous les participants (sauf l'expéditeur) si la conversation a des membres
            for member in conversation.memberships.exclude(user=user).filter(is_muted=False):
                if member.user:
                    Notification.objects.create(
                        recipient=member.user,
                        type='message',
                        content_type=content_type,
                        object_id=str(message.id),
                        message=f"Nouveau message de {user.username} dans {conversation.name or 'conversation'}: {content[:100]}",
                        metadata={
                            'sender_id': str(user.id),
                            'sender_username': user.username,
                            'conversation_id': str(conversation.id),
                            'conversation_name': conversation.name,
                            'message_preview': content[:100]
                        }
                    )

        # Notifier les utilisateurs mentionnés
        for mention_obj in message.mentions.filter(mention_type='user'):
            try:
                mentioned_user = User.objects.get(id=mention_obj.entity_id)
                if mentioned_user and mentioned_user != user and mentioned_user != recipient:
                    Notification.objects.create(
                        recipient=mentioned_user,
                        type='mention',
                        content_type=content_type,
                        object_id=str(message.id),
                        message=f"{user.username} vous a mentionné: {content[:100]}",
                        metadata={
                            'sender_id': str(user.id),
                            'sender_username': user.username,
                            'conversation_id': str(conversation.id),
                            'message_preview': content[:100]
                        }
                    )
            except User.DoesNotExist:
                pass

        # Envoyer une notification via WebSocket
        channel_layer = get_channel_layer()

        message_data = {
            "id": str(message.id),
            "conversation_id": str(conversation.id),
            "sender": {
                "id": str(user.id),
                "username": user.username,
                "full_name": f"{user.first_name} {user.last_name}".strip() or user.username
            },
            "content": content,
            "created_at": message.created_at.isoformat(),
            "reply_to_id": str(reply_to.id) if reply_to else None,
            "mentions": [
                {
                    "mention_type": m.mention_type,
                    "entity_id": m.entity_id,
                    "display_text": m.display_text
                }
                for m in message.mentions.all()
            ]
        }

        if conversation.conversation_type == 'direct' and recipient:
            async_to_sync(channel_layer.group_send)(
                f"user_{recipient.id}",
                {
                    "type": "new_message",
                    "message": {**message_data, "recipient_id": str(recipient.id)}
                }
            )
        else:
            # Envoyer à tous les participants du groupe
            for member in conversation.memberships.exclude(user=user):
                async_to_sync(channel_layer.group_send)(
                    f"user_{member.user.id}",
                    {
                        "type": "new_message",
                        "message": message_data
                    }
                )

        # Envoyer aussi une notification pour la conversation
        async_to_sync(channel_layer.group_send)(
            f"conversation_{conversation.id}",
            {
                "type": "message_added",
                "message": message_data
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

        from django.utils import timezone
        now = timezone.now()

        if conversation.conversation_type == 'group':
            # Pour les groupes, mettre à jour last_read_at sur la membership
            ConversationMember.objects.filter(
                conversation=conversation,
                user=user
            ).update(last_read_at=now)

            # Marquer aussi les notifications du groupe comme lues
            message_content_type = ContentType.objects.get_for_model(Message)
            Notification.objects.filter(
                recipient=user,
                type__in=['message', 'mention'],
                content_type=message_content_type,
                metadata__conversation_id=str(conversation.id),
                is_read=False
            ).update(is_read=True)
        else:
            # Pour les conversations directes, marquer les messages comme lus
            unread_messages = conversation.messages.filter(
                recipient=user,
                is_read=False
            )

            message_ids = list(unread_messages.values_list('id', flat=True))
            unread_messages.update(is_read=True, read_at=now)

            if message_ids:
                message_content_type = ContentType.objects.get_for_model(Message)
                Notification.objects.filter(
                    recipient=user,
                    type__in=['message', 'mention'],
                    content_type=message_content_type,
                    object_id__in=[str(msg_id) for msg_id in message_ids],
                    is_read=False
                ).update(is_read=True)

        return MarkMessagesAsRead(success=True, conversation=conversation)


class CreateGroupConversation(graphene.Mutation):
    """Mutation pour créer une conversation de groupe"""

    class Arguments:
        name = graphene.String(required=True)
        description = graphene.String(required=False)
        participant_ids = graphene.List(graphene.ID, required=True)

    conversation = graphene.Field(ConversationType)

    @staticmethod
    def mutate(root, info, name, participant_ids, description=None):
        user = get_user_from_context(info)
        if not user or not user.is_authenticated:
            raise GraphQLError("Vous devez être connecté")

        if not name.strip():
            raise GraphQLError("Le nom du groupe ne peut pas être vide")

        if len(participant_ids) < 1:
            raise GraphQLError("Vous devez ajouter au moins un autre participant")

        with transaction.atomic():
            conversation = Conversation.objects.create(
                conversation_type='group',
                name=name.strip(),
                description=description.strip() if description else None,
                created_by=user
            )

            # Ajouter le créateur comme admin
            ConversationMember.objects.create(
                conversation=conversation,
                user=user,
                role='admin'
            )

            # Ajouter les autres participants
            for pid in participant_ids:
                try:
                    participant = User.objects.get(id=pid)
                    if participant != user and not conversation.memberships.filter(user=participant).exists():
                        ConversationMember.objects.create(
                            conversation=conversation,
                            user=participant,
                            role='member'
                        )
                except User.DoesNotExist:
                    pass

        # Notifier les participants
        channel_layer = get_channel_layer()
        for member in conversation.memberships.exclude(user=user):
            async_to_sync(channel_layer.group_send)(
                f"user_{member.user.id}",
                {
                    "type": "group_created",
                    "conversation": {
                        "id": str(conversation.id),
                        "name": conversation.name,
                        "created_by": {
                            "id": str(user.id),
                            "username": user.username
                        }
                    }
                }
            )

        return CreateGroupConversation(conversation=conversation)


class UpdateGroupSettings(graphene.Mutation):
    """Mutation pour modifier les paramètres d'un groupe"""

    class Arguments:
        conversation_id = graphene.ID(required=True)
        name = graphene.String(required=False)
        description = graphene.String(required=False)

    conversation = graphene.Field(ConversationType)

    @staticmethod
    def mutate(root, info, conversation_id, name=None, description=None):
        user = get_user_from_context(info)
        if not user or not user.is_authenticated:
            raise GraphQLError("Vous devez être connecté")

        try:
            conversation = Conversation.objects.get(
                id=conversation_id,
                participants=user,
                conversation_type='group'
            )
        except Conversation.DoesNotExist:
            raise GraphQLError("Groupe non trouvé")

        if not conversation.is_admin(user):
            raise GraphQLError("Vous devez être administrateur pour modifier ce groupe")

        if name is not None:
            conversation.name = name.strip() if name else conversation.name
        if description is not None:
            conversation.description = description.strip() if description else None
        conversation.save()

        return UpdateGroupSettings(conversation=conversation)


class AddGroupMembers(graphene.Mutation):
    """Mutation pour ajouter des membres à un groupe"""

    class Arguments:
        conversation_id = graphene.ID(required=True)
        user_ids = graphene.List(graphene.ID, required=True)

    conversation = graphene.Field(ConversationType)
    added_members = graphene.List(ConversationMemberType)

    @staticmethod
    def mutate(root, info, conversation_id, user_ids):
        user = get_user_from_context(info)
        if not user or not user.is_authenticated:
            raise GraphQLError("Vous devez être connecté")

        try:
            conversation = Conversation.objects.get(
                id=conversation_id,
                participants=user,
                conversation_type='group'
            )
        except Conversation.DoesNotExist:
            raise GraphQLError("Groupe non trouvé")

        if not conversation.is_admin(user):
            raise GraphQLError("Vous devez être administrateur pour ajouter des membres")

        added = []
        with transaction.atomic():
            for uid in user_ids:
                try:
                    new_member = User.objects.get(id=uid)
                    if not conversation.memberships.filter(user=new_member).exists():
                        membership = ConversationMember.objects.create(
                            conversation=conversation,
                            user=new_member,
                            role='member'
                        )
                        added.append(membership)
                except User.DoesNotExist:
                    pass

        return AddGroupMembers(conversation=conversation, added_members=added)


class RemoveGroupMember(graphene.Mutation):
    """Mutation pour retirer un membre d'un groupe"""

    class Arguments:
        conversation_id = graphene.ID(required=True)
        user_id = graphene.ID(required=True)

    success = graphene.Boolean()
    conversation = graphene.Field(ConversationType)

    @staticmethod
    def mutate(root, info, conversation_id, user_id):
        user = get_user_from_context(info)
        if not user or not user.is_authenticated:
            raise GraphQLError("Vous devez être connecté")

        try:
            conversation = Conversation.objects.get(
                id=conversation_id,
                participants=user,
                conversation_type='group'
            )
        except Conversation.DoesNotExist:
            raise GraphQLError("Groupe non trouvé")

        if not conversation.is_admin(user):
            raise GraphQLError("Vous devez être administrateur pour retirer des membres")

        try:
            member_to_remove = User.objects.get(id=user_id)
            membership = conversation.memberships.get(user=member_to_remove)

            # Ne pas retirer le dernier admin
            if membership.role == 'admin':
                admin_count = conversation.memberships.filter(role='admin').count()
                if admin_count <= 1:
                    raise GraphQLError("Impossible de retirer le dernier administrateur")

            membership.delete()
        except (User.DoesNotExist, ConversationMember.DoesNotExist):
            raise GraphQLError("Membre non trouvé")

        return RemoveGroupMember(success=True, conversation=conversation)


class LeaveGroup(graphene.Mutation):
    """Mutation pour quitter un groupe"""

    class Arguments:
        conversation_id = graphene.ID(required=True)

    success = graphene.Boolean()

    @staticmethod
    def mutate(root, info, conversation_id):
        user = get_user_from_context(info)
        if not user or not user.is_authenticated:
            raise GraphQLError("Vous devez être connecté")

        try:
            conversation = Conversation.objects.get(
                id=conversation_id,
                participants=user,
                conversation_type='group'
            )
        except Conversation.DoesNotExist:
            raise GraphQLError("Groupe non trouvé")

        membership = conversation.memberships.get(user=user)

        # Si c'est le dernier admin, transférer le rôle ou supprimer le groupe
        if membership.role == 'admin':
            admin_count = conversation.memberships.filter(role='admin').count()
            if admin_count <= 1:
                other_members = conversation.memberships.exclude(user=user)
                if other_members.exists():
                    # Promouvoir un autre membre comme admin
                    other_members.first().role = 'admin'
                    other_members.first().save()
                else:
                    # Supprimer le groupe s'il n'y a plus personne
                    conversation.delete()
                    return LeaveGroup(success=True)

        membership.delete()
        return LeaveGroup(success=True)


class ToggleMuteGroup(graphene.Mutation):
    """Mutation pour activer/désactiver les notifications d'un groupe"""

    class Arguments:
        conversation_id = graphene.ID(required=True)

    conversation = graphene.Field(ConversationType)
    is_muted = graphene.Boolean()

    @staticmethod
    def mutate(root, info, conversation_id):
        user = get_user_from_context(info)
        if not user or not user.is_authenticated:
            raise GraphQLError("Vous devez être connecté")

        try:
            membership = ConversationMember.objects.get(
                conversation_id=conversation_id,
                user=user
            )
        except ConversationMember.DoesNotExist:
            raise GraphQLError("Vous n'êtes pas membre de cette conversation")

        membership.is_muted = not membership.is_muted
        membership.save()

        return ToggleMuteGroup(
            conversation=membership.conversation,
            is_muted=membership.is_muted
        )


class PromoteGroupMember(graphene.Mutation):
    """Mutation pour promouvoir ou rétrograder un membre du groupe"""

    class Arguments:
        conversation_id = graphene.ID(required=True)
        user_id = graphene.ID(required=True)
        role = graphene.String(required=True)  # 'admin' ou 'member'

    success = graphene.Boolean()
    member = graphene.Field(ConversationMemberType)

    @staticmethod
    def mutate(root, info, conversation_id, user_id, role):
        user = get_user_from_context(info)
        if not user or not user.is_authenticated:
            raise GraphQLError("Vous devez être connecté")

        if role not in ['admin', 'member']:
            raise GraphQLError("Le rôle doit être 'admin' ou 'member'")

        try:
            conversation = Conversation.objects.get(
                id=conversation_id,
                participants=user,
                conversation_type='group'
            )
        except Conversation.DoesNotExist:
            raise GraphQLError("Groupe non trouvé")

        if not conversation.is_admin(user):
            raise GraphQLError("Vous devez être administrateur pour modifier les rôles")

        try:
            target_user = User.objects.get(id=user_id)
            membership = conversation.memberships.get(user=target_user)
        except (User.DoesNotExist, ConversationMember.DoesNotExist):
            raise GraphQLError("Membre non trouvé")

        # Ne pas permettre de se rétrograder soi-même si c'est le dernier admin
        if target_user == user and role == 'member':
            admin_count = conversation.memberships.filter(role='admin').count()
            if admin_count <= 1:
                raise GraphQLError("Vous ne pouvez pas vous rétrograder car vous êtes le seul administrateur")

        # Ne pas permettre de rétrograder le dernier admin
        if membership.role == 'admin' and role == 'member':
            admin_count = conversation.memberships.filter(role='admin').count()
            if admin_count <= 1:
                raise GraphQLError("Impossible de rétrograder le dernier administrateur")

        membership.role = role
        membership.save()

        # Notifier via WebSocket
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"conversation_{conversation.id}",
            {
                "type": "member_role_changed",
                "data": {
                    "conversation_id": str(conversation.id),
                    "user_id": str(target_user.id),
                    "new_role": role,
                    "changed_by": {
                        "id": str(user.id),
                        "username": user.username
                    }
                }
            }
        )

        return PromoteGroupMember(success=True, member=membership)


class EditMessage(graphene.Mutation):
    """Mutation pour modifier un message"""

    class Arguments:
        message_id = graphene.ID(required=True)
        content = graphene.String(required=True)

    message = graphene.Field(MessageType)

    @staticmethod
    def mutate(root, info, message_id, content):
        user = get_user_from_context(info)
        if not user or not user.is_authenticated:
            raise GraphQLError("Vous devez être connecté")

        if not content.strip():
            raise GraphQLError("Le contenu du message ne peut pas être vide")

        try:
            message = Message.objects.get(id=message_id, sender=user)
        except Message.DoesNotExist:
            raise GraphQLError("Message non trouvé ou vous n'êtes pas l'auteur")

        if message.is_deleted:
            raise GraphQLError("Ce message a été supprimé")

        message.edit_content(content.strip())

        # Notifier via WebSocket
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"conversation_{message.conversation.id}",
            {
                "type": "message_edited",
                "message": {
                    "id": str(message.id),
                    "conversation_id": str(message.conversation.id),
                    "content": message.content,
                    "is_edited": True,
                    "edited_at": message.edited_at.isoformat()
                }
            }
        )

        return EditMessage(message=message)


class DeleteMessage(graphene.Mutation):
    """Mutation pour supprimer un message"""

    class Arguments:
        message_id = graphene.ID(required=True)

    success = graphene.Boolean()

    @staticmethod
    def mutate(root, info, message_id):
        user = get_user_from_context(info)
        if not user or not user.is_authenticated:
            raise GraphQLError("Vous devez être connecté")

        try:
            message = Message.objects.get(id=message_id, sender=user)
        except Message.DoesNotExist:
            raise GraphQLError("Message non trouvé ou vous n'êtes pas l'auteur")

        message.soft_delete()

        # Notifier via WebSocket
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"conversation_{message.conversation.id}",
            {
                "type": "message_deleted",
                "message": {
                    "id": str(message.id),
                    "conversation_id": str(message.conversation.id)
                }
            }
        )

        return DeleteMessage(success=True)


class AddReaction(graphene.Mutation):
    """Mutation pour ajouter une réaction à un message"""

    class Arguments:
        message_id = graphene.ID(required=True)
        emoji = graphene.String(required=True)

    message = graphene.Field(MessageType)

    @staticmethod
    def mutate(root, info, message_id, emoji):
        user = get_user_from_context(info)
        if not user or not user.is_authenticated:
            raise GraphQLError("Vous devez être connecté")

        try:
            message = Message.objects.get(id=message_id)
            if user not in message.conversation.participants.all():
                raise GraphQLError("Vous n'êtes pas participant de cette conversation")
        except Message.DoesNotExist:
            raise GraphQLError("Message non trouvé")

        if message.is_deleted:
            raise GraphQLError("Ce message a été supprimé")

        reaction, created = MessageReaction.objects.get_or_create(
            message=message,
            user=user,
            emoji=emoji
        )

        # Notifier via WebSocket
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"conversation_{message.conversation.id}",
            {
                "type": "reaction_added",
                "message": {
                    "id": str(message.id),
                    "conversation_id": str(message.conversation.id),
                    "reaction": {
                        "emoji": emoji,
                        "user_id": str(user.id),
                        "username": user.username
                    }
                }
            }
        )

        return AddReaction(message=message)


class RemoveReaction(graphene.Mutation):
    """Mutation pour retirer une réaction d'un message"""

    class Arguments:
        message_id = graphene.ID(required=True)
        emoji = graphene.String(required=True)

    message = graphene.Field(MessageType)

    @staticmethod
    def mutate(root, info, message_id, emoji):
        user = get_user_from_context(info)
        if not user or not user.is_authenticated:
            raise GraphQLError("Vous devez être connecté")

        try:
            message = Message.objects.get(id=message_id)
        except Message.DoesNotExist:
            raise GraphQLError("Message non trouvé")

        MessageReaction.objects.filter(
            message=message,
            user=user,
            emoji=emoji
        ).delete()

        # Notifier via WebSocket
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"conversation_{message.conversation.id}",
            {
                "type": "reaction_removed",
                "message": {
                    "id": str(message.id),
                    "conversation_id": str(message.conversation.id),
                    "reaction": {
                        "emoji": emoji,
                        "user_id": str(user.id)
                    }
                }
            }
        )

        return RemoveReaction(message=message)


class Mutation(graphene.ObjectType):
    """Mutations GraphQL pour le chat"""
    # Messages
    send_message = SendMessage.Field()
    mark_messages_as_read = MarkMessagesAsRead.Field()
    edit_message = EditMessage.Field()
    delete_message = DeleteMessage.Field()

    # Groupes
    create_group_conversation = CreateGroupConversation.Field()
    update_group_settings = UpdateGroupSettings.Field()
    add_group_members = AddGroupMembers.Field()
    remove_group_member = RemoveGroupMember.Field()
    leave_group = LeaveGroup.Field()
    toggle_mute_group = ToggleMuteGroup.Field()
    promote_group_member = PromoteGroupMember.Field()

    # Réactions
    add_reaction = AddReaction.Field()
    remove_reaction = RemoveReaction.Field()


# Note: Les subscriptions GraphQL sont gérées via WebSockets directement
# Pour une implémentation complète avec Graphene Subscriptions, 
# il faudrait utiliser channels_graphql_ws ou une bibliothèque similaire
schema = graphene.Schema(query=Query, mutation=Mutation)

