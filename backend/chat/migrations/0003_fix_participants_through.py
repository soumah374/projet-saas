# Generated manually to fix participants through model issue

from django.db import migrations, models
from django.conf import settings


def migrate_participants_forward(apps, schema_editor):
    """Migrate existing participants data to the through model"""
    Conversation = apps.get_model('chat', 'Conversation')
    ConversationMember = apps.get_model('chat', 'ConversationMember')

    for conversation in Conversation.objects.all():
        # Get existing participants
        participants = list(conversation.participants.all())
        for participant in participants:
            ConversationMember.objects.create(
                conversation=conversation,
                user=participant,
                role='member',
                joined_at=conversation.created_at
            )


def migrate_participants_reverse(apps, schema_editor):
    """Reverse migration - restore participants from through model"""
    Conversation = apps.get_model('chat', 'Conversation')
    ConversationMember = apps.get_model('chat', 'ConversationMember')

    for conversation in Conversation.objects.all():
        members = ConversationMember.objects.filter(conversation=conversation)
        participants = [member.user for member in members]
        conversation.participants.set(participants)


class Migration(migrations.Migration):

    dependencies = [
        ('chat', '0002_conversationmember_messageattachment_messagemention_and_more'),
    ]

    operations = [
        # First, migrate existing data
        migrations.RunPython(migrate_participants_forward, migrate_participants_reverse),

        # Remove the old participants field
        migrations.RemoveField(
            model_name='conversation',
            name='participants',
        ),

        # Add the new participants field with through model
        migrations.AddField(
            model_name='conversation',
            name='participants',
            field=models.ManyToManyField(
                related_name='conversations',
                through='ConversationMember',
                to=settings.AUTH_USER_MODEL,
                verbose_name='Participants'
            ),
        ),
    ]