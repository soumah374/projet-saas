from django.db import models
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.conf import settings

class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ('project_member', 'Membre de projet'),
        ('task_assignment', 'Attribution de tâche'),
        ('task_update', 'Mise à jour de tâche'),
        ('event_created', 'Événement créé'),
        ('event_update', 'Mise à jour d\'événement'),
        ('document_shared', 'Document partagé'),
        ('team_update', 'Mise à jour d\'équipe'),
    ]

    # Destinataire de la notification
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications_received'
    )

    # Type de notification
    type = models.CharField(max_length=50, choices=NOTIFICATION_TYPES)
    
    # Contenu générique (peut pointer vers n'importe quel modèle)
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.CharField(max_length=50)  # CharField pour supporter UUID et int
    content_object = GenericForeignKey('content_type', 'object_id')

    # Métadonnées supplémentaires (stockées en JSON)
    metadata = models.JSONField(default=dict, blank=True)
    
    # Message de la notification
    message = models.TextField()
    
    # État de la notification
    is_read = models.BooleanField(default=False)
    
    # Horodatage
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', '-created_at']),
            models.Index(fields=['content_type', 'object_id']),
        ]

    def __str__(self):
        return f"Notification pour {self.recipient.username}: {self.message[:50]}"
