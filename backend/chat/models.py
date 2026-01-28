from django.db import models
from django.conf import settings
from django.utils import timezone

User = get_user_model()


class ConversationManager(models.Manager):
    def get_or_create_direct(self, user1, user2):
        """Récupère ou crée une conversation directe entre deux utilisateurs."""
        with transaction.atomic():
            # Chercher une conversation existante
            conversation = self.filter(
                memberships__user=user1,
                conversation_type='direct'
            ).filter(
                memberships__user=user2
            ).distinct().first()
            
            if not conversation:
                conversation = self.create(conversation_type='direct')
                ConversationMember.objects.bulk_create([
                    ConversationMember(conversation=conversation, user=user1, role='member'),
                    ConversationMember(conversation=conversation, user=user2, role='member')
                ])
            
            return conversation

class Conversation(models.Model):
    """Modèle pour représenter une conversation entre utilisateurs"""

    CONVERSATION_TYPES = [
        ('direct', 'Direct'),
        ('group', 'Groupe'),
    ]

    participants = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='conversations',
        verbose_name='Participants',
        through='ConversationMember'
    )
    conversation_type = models.CharField(
        max_length=10,
        choices=CONVERSATION_TYPES,
        default='direct',
        verbose_name='Type de conversation'
    )
    name = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name='Nom du groupe'
    )
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name='Description'
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='created_conversations',
        verbose_name='Créé par'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']
        verbose_name = 'Conversation'
        verbose_name_plural = 'Conversations'
        indexes = [
            models.Index(fields=['-updated_at']),
            models.Index(fields=['conversation_type']),
        ]

    def __str__(self):
        if self.conversation_type == 'group' and self.name:
            return f"Groupe: {self.name}"
        participants_list = ', '.join([p.username for p in self.participants.all()[:2]])
        return f"Conversation: {participants_list}"

    def get_other_participant(self, user):
        """Retourne l'autre participant de la conversation (pour les conversations directes)"""
        if self.conversation_type == 'group':
            return None
        return self.participants.exclude(id=user.id).first()

    def get_last_message(self):
        """Retourne le dernier message de la conversation"""
        return self.messages.order_by('-created_at').first()

    def mark_as_read(self, user):
        """Marque tous les messages non lus comme lus pour un utilisateur"""
        self.messages.exclude(sender=user).filter(
            is_read=False
        ).update(is_read=True, read_at=timezone.now())

    def is_admin(self, user):
        """Vérifie si l'utilisateur est admin de la conversation"""
        if self.conversation_type == 'direct':
            return True
        membership = self.memberships.filter(user=user).first()
        return membership and membership.role == 'admin'


class ConversationMember(models.Model):
    """Modèle pour représenter un membre d'une conversation"""

    MEMBER_ROLES = [
        ('admin', 'Administrateur'),
        ('member', 'Membre'),
    ]

    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name='memberships',
        verbose_name='Conversation'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='conversation_memberships',
        verbose_name='Utilisateur'
    )
    role = models.CharField(
        max_length=10,
        choices=MEMBER_ROLES,
        default='member',
        verbose_name='Rôle'
    )
    is_muted = models.BooleanField(
        default=False,
        verbose_name='Notifications désactivées'
    )
    joined_at = models.DateTimeField(auto_now_add=True)
    last_read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['joined_at']
        verbose_name = 'Membre de conversation'
        verbose_name_plural = 'Membres de conversation'
        unique_together = ['conversation', 'user']
        indexes = [
            models.Index(fields=['conversation', 'user']),
            models.Index(fields=['user', 'is_muted']),
        ]

    def __str__(self):
        return f"{self.user.username} dans {self.conversation}"


class Message(models.Model):
    """Modèle pour représenter un message dans une conversation"""

    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name='messages',
        verbose_name='Conversation'
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_messages',
        verbose_name='Expéditeur'
    )
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='received_messages',
        verbose_name='Destinataire',
        null=True,
        blank=True
    )
    content = models.TextField(verbose_name='Contenu')
    is_read = models.BooleanField(default=False, verbose_name='Lu')
    read_at = models.DateTimeField(null=True, blank=True, verbose_name='Lu le')
    is_edited = models.BooleanField(default=False, verbose_name='Modifié')
    edited_at = models.DateTimeField(null=True, blank=True, verbose_name='Modifié le')
    is_deleted = models.BooleanField(default=False, verbose_name='Supprimé')
    reply_to = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='replies',
        verbose_name='En réponse à'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['created_at']
        verbose_name = 'Message'
        verbose_name_plural = 'Messages'
        indexes = [
            models.Index(fields=['conversation', '-created_at']),
            models.Index(fields=['recipient', 'is_read', '-created_at']),
            models.Index(fields=['sender', '-created_at']),
            models.Index(fields=['is_deleted']),
        ]

    def __str__(self):
        recipient_name = self.recipient.username if self.recipient else 'groupe'
        return f"Message de {self.sender.username} à {recipient_name}: {self.content[:50]}"

    def mark_as_read(self):
        """Marque le message comme lu"""
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at'])

    def edit_content(self, new_content):
        """Modifie le contenu du message"""
        self.content = new_content
        self.is_edited = True
        self.edited_at = timezone.now()
        self.save(update_fields=['content', 'is_edited', 'edited_at'])

    def soft_delete(self):
        """Supprime le message (soft delete)"""
        self.is_deleted = True
        self.save(update_fields=['is_deleted'])


class MessageMention(models.Model):
    """Modèle pour représenter une mention dans un message"""

    MENTION_TYPES = [
        ('user', 'Utilisateur'),
        ('project', 'Projet'),
        ('contrat', 'Contrat'),
        ('devis', 'Devis'),
        ('facture', 'Facture'),
    ]

    message = models.ForeignKey(
        Message,
        on_delete=models.CASCADE,
        related_name='mentions',
        verbose_name='Message'
    )
    mention_type = models.CharField(
        max_length=20,
        choices=MENTION_TYPES,
        verbose_name='Type de mention'
    )
    entity_id = models.CharField(
        max_length=50,
        verbose_name='ID de l\'entité'
    )
    display_text = models.CharField(
        max_length=200,
        verbose_name='Texte d\'affichage'
    )
    start_position = models.IntegerField(
        verbose_name='Position de début'
    )
    end_position = models.IntegerField(
        verbose_name='Position de fin'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['start_position']
        verbose_name = 'Mention'
        verbose_name_plural = 'Mentions'
        indexes = [
            models.Index(fields=['message', 'mention_type']),
            models.Index(fields=['mention_type', 'entity_id']),
        ]

    def __str__(self):
        return f"Mention {self.mention_type}: {self.display_text}"


class MessageAttachment(models.Model):
    """Modèle pour représenter une pièce jointe dans un message"""

    message = models.ForeignKey(
        Message,
        on_delete=models.CASCADE,
        related_name='attachments',
        verbose_name='Message'
    )
    file = models.FileField(
        upload_to='chat/attachments/%Y/%m/',
        verbose_name='Fichier'
    )
    filename = models.CharField(
        max_length=255,
        verbose_name='Nom du fichier'
    )
    file_type = models.CharField(
        max_length=50,
        verbose_name='Type de fichier'
    )
    file_size = models.IntegerField(
        verbose_name='Taille du fichier (octets)'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']
        verbose_name = 'Pièce jointe'
        verbose_name_plural = 'Pièces jointes'

    def __str__(self):
        return f"Pièce jointe: {self.filename}"


class MessageReaction(models.Model):
    """Modèle pour représenter une réaction emoji sur un message"""

    message = models.ForeignKey(
        Message,
        on_delete=models.CASCADE,
        related_name='reactions',
        verbose_name='Message'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='message_reactions',
        verbose_name='Utilisateur'
    )
    emoji = models.CharField(
        max_length=10,
        verbose_name='Emoji'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']
        verbose_name = 'Réaction'
        verbose_name_plural = 'Réactions'
        unique_together = ['message', 'user', 'emoji']

    def __str__(self):
        return f"{self.user.username} - {self.emoji}"

