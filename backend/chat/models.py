from django.db import models
from django.conf import settings
from django.utils import timezone


class Conversation(models.Model):
    """Modèle pour représenter une conversation entre deux utilisateurs"""
    
    participants = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='conversations',
        verbose_name='Participants'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-updated_at']
        verbose_name = 'Conversation'
        verbose_name_plural = 'Conversations'
        indexes = [
            models.Index(fields=['-updated_at']),
        ]
    
    def __str__(self):
        participants_list = ', '.join([p.username for p in self.participants.all()[:2]])
        return f"Conversation: {participants_list}"
    
    def get_other_participant(self, user):
        """Retourne l'autre participant de la conversation"""
        return self.participants.exclude(id=user.id).first()
    
    def get_last_message(self):
        """Retourne le dernier message de la conversation"""
        return self.messages.first()
    
    def mark_as_read(self, user):
        """Marque tous les messages non lus comme lus pour un utilisateur"""
        self.messages.filter(
            recipient=user,
            is_read=False
        ).update(is_read=True, read_at=timezone.now())


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
        verbose_name='Destinataire'
    )
    content = models.TextField(verbose_name='Contenu')
    is_read = models.BooleanField(default=False, verbose_name='Lu')
    read_at = models.DateTimeField(null=True, blank=True, verbose_name='Lu le')
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
        ]
    
    def __str__(self):
        return f"Message de {self.sender.username} à {self.recipient.username}: {self.content[:50]}"
    
    def mark_as_read(self):
        """Marque le message comme lu"""
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at'])

