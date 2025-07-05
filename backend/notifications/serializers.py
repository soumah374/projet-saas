from rest_framework import serializers
from django.contrib.contenttypes.models import ContentType
from .models import Notification

class NotificationSerializer(serializers.ModelSerializer):
    content_type_str = serializers.SerializerMethodField()
    recipient_name = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            'id',
            'recipient',
            'recipient_name',
            'type',
            'content_type_str',
            'object_id',
            'metadata',
            'message',
            'is_read',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_content_type_str(self, obj):
        return obj.content_type.model

    def get_recipient_name(self, obj):
        return f"{obj.recipient.first_name} {obj.recipient.last_name}" 