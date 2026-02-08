from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.contenttypes.models import ContentType
from .models import Message
from notifications.models import Notification


@receiver(post_save, sender=Message)
def create_message_notification(sender, instance, created, **kwargs):
    """Créer une notification lorsqu'un nouveau message est créé"""
    if created and instance.recipient:
        content_type = ContentType.objects.get_for_model(instance)
        Notification.objects.create(
            recipient=instance.recipient,
            type='message',
            content_type=content_type,
            object_id=str(instance.id),
            message=f"Nouveau message de {instance.sender.username}: {instance.content[:100]}",
            metadata={
                'sender_id': str(instance.sender.id),
                'sender_username': instance.sender.username,
                'conversation_id': str(instance.conversation.id),
                'message_preview': instance.content[:100]
            }
        )

