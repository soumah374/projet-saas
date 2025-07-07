from django.contrib import admin
from .models import Notification

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('recipient', 'type', 'message', 'is_read', 'created_at')
    list_filter = ('type', 'is_read', 'created_at')
    search_fields = ('recipient__username', 'recipient__email', 'message')
    readonly_fields = ('created_at', 'updated_at')
    raw_id_fields = ('recipient',)
    date_hierarchy = 'created_at'
