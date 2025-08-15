from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.contenttypes.models import ContentType
from projects.models import ProjectMember, ProjectTask, ProjectEvent
from .models import Notification

@receiver(post_save, sender=ProjectMember)
def create_project_member_notification(sender, instance, created, **kwargs):
    if created:
        content_type = ContentType.objects.get_for_model(instance.project)
        Notification.objects.create(
            recipient=instance.user,
            type='project_member',
            content_type=content_type,
            object_id=instance.project.id,
            message=f"Vous avez été ajouté au projet {instance.project.title} en tant que {instance.role}",
            metadata={
                'project_title': instance.project.title,
                'role': instance.role
            }
        )

@receiver(post_save, sender=ProjectTask)
def create_task_notification(sender, instance, created, **kwargs):
    if instance.assigned_to:
        content_type = ContentType.objects.get_for_model(instance)
        if created:
            Notification.objects.create(
                recipient=instance.assigned_to,
                type='task_assignment',
                content_type=content_type,
                object_id=instance.id,
                message=f"Une nouvelle tâche vous a été assignée : {instance.title}",
                metadata={
                    'task_title': instance.title,
                    'project_id': str(instance.project.id),
                    'project_title': instance.project.title,
                    'due_date': instance.due_date.isoformat() if instance.due_date else None
                }
            )
        elif instance.status == 'Terminé' and instance.executed_at:
            Notification.objects.create(
                recipient=instance.project.created_by,
                type='task_update',
                content_type=content_type,
                object_id=instance.id,
                message=f"La tâche '{instance.title}' a été marquée comme terminée",
                metadata={
                    'task_title': instance.title,
                    'project_id': str(instance.project.id),
                    'project_title': instance.project.title,
                    'executed_at': instance.executed_at.isoformat()
                }
            )

@receiver(post_save, sender=ProjectEvent)
def create_event_notification(sender, instance, created, **kwargs):
    """
    Signal pour créer des notifications lors de la création ou mise à jour d'un événement
    """
    if created:
        # Créer une notification pour chaque participant
        content_type = ContentType.objects.get_for_model(instance)
        event_type_label = instance.get_event_type_display()

        for participant in instance.participants.all():
            if participant != instance.created_by:  # Ne pas notifier le créateur
                Notification.objects.create(
                    recipient=participant,
                    type='event_created',
                    content_type=content_type,
                    object_id=str(instance.id),
                    message=(
                        f"Vous avez été invité à l'événement {event_type_label} : {instance.title} "
                        f"le {instance.start_date.strftime('%d/%m/%Y')} "
                        f"de {instance.start_date.strftime('%H:%M')} "
                        f"à {instance.end_date.strftime('%H:%M')}"
                    ),
                    metadata={
                        'project_id': str(instance.project.id),
                        'project_title': instance.project.title,
                        'event_type': instance.event_type,
                        'location': instance.location or 'Non spécifié'
                    }
                ) 