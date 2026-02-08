from django.contrib import admin
from .models import (
    Project, ProjectMember, ProjectBudget, ProjectTask, ProjectEvent,
    TimeSheet, TimesheetTimer, ProjectNotification, TaskComment
)


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'type', 'status', 'priority', 'progress', 'deadline', 'client', 'created_by']
    list_filter = ['type', 'status', 'priority', 'created_at']
    search_fields = ['title', 'description', 'client', 'id']
    readonly_fields = ['id', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Informations de base', {
            'fields': ('id', 'title', 'description', 'objectives')
        }),
        ('Classification', {
            'fields': ('type', 'status', 'priority')
        }),
        ('Dates', {
            'fields': ('start_date', 'deadline', 'created_at', 'updated_at')
        }),
        ('Progression et budget', {
            'fields': ('progress', 'budget')
        }),
        ('Relations', {
            'fields': ('client', 'created_by', 'departments')
        }),
        ('Métadonnées', {
            'fields': ('tags', 'contract')
        }),
    )


@admin.register(ProjectMember)
class ProjectMemberAdmin(admin.ModelAdmin):
    list_display = ['project', 'user', 'role', 'joined_at', 'is_active']
    list_filter = ['role', 'is_active', 'joined_at']
    search_fields = ['project__title', 'user__username', 'user__first_name', 'user__last_name']
    readonly_fields = ['joined_at']


@admin.register(ProjectBudget)
class ProjectBudgetAdmin(admin.ModelAdmin):
    list_display = ['project', 'production', 'personnel', 'marketing', 'other', 'total']
    search_fields = ['project__title']
    readonly_fields = ['total']


@admin.register(ProjectTask)
class ProjectTaskAdmin(admin.ModelAdmin):
    list_display = ['title', 'project', 'status', 'assigned_to', 'due_date']
    list_filter = ['status', 'due_date', 'created_at']
    search_fields = ['title', 'description', 'project__title']
    readonly_fields = ['created_at', 'updated_at'] 


@admin.register(ProjectEvent)
class ProjectEventAdmin(admin.ModelAdmin):
    list_display = ['title', 'project', 'event_type', 'start_date', 'end_date', 'created_by']
    list_filter = ['event_type', 'start_date', 'created_at']
    search_fields = ['title', 'description', 'project__title']
    readonly_fields = ['created_at', 'updated_at']

    fieldsets = (
        ('Informations de base', {
            'fields': ('title', 'description', 'event_type')
        }),
        ('Projet et participants', {
            'fields': ('project', 'participants', 'created_by')
        }),
        ('Dates', {
            'fields': ('start_date', 'end_date', 'is_all_day')
        }),
        ('Lieu', {
            'fields': ('location',)
        }),
        ('Métadonnées', {
            'fields': ('created_at', 'updated_at')
        }),
    )


@admin.register(TimeSheet)
class TimeSheetAdmin(admin.ModelAdmin):
    list_display = ['user', 'project', 'task', 'hours', 'date', 'validated_by', 'validated_at']
    list_filter = ['date', 'validated_at']
    search_fields = ['user__username', 'project__title', 'task__title', 'description']
    readonly_fields = ['created_at', 'updated_at', 'validated_at']

    fieldsets = (
        ('Informations de base', {
            'fields': ('user', 'project', 'task')
        }),
        ('Temps et détails', {
            'fields': ('date', 'hours', 'description')
        }),
        ('Validation', {
            'fields': ('validated_by', 'validated_at')
        }),
        ('Métadonnées', {
            'fields': ('created_at', 'updated_at')
        }),
    )


@admin.register(TimesheetTimer)
class TimesheetTimerAdmin(admin.ModelAdmin):
    list_display = ['user', 'project', 'task', 'start_time', 'end_time', 'is_running', 'elapsed_time']
    list_filter = ['is_running', 'start_time']
    search_fields = ['user__username', 'project__title', 'task__title', 'description']
    readonly_fields = ['created_at', 'elapsed_time']

    def elapsed_time(self, obj):
        """Affiche le temps écoulé formaté"""
        return f"{obj.elapsed_time:.2f}h"
    elapsed_time.short_description = 'Temps écoulé'


@admin.register(ProjectNotification)
class ProjectNotificationAdmin(admin.ModelAdmin):
    list_display = ['title', 'recipient', 'notification_type', 'is_read', 'created_at']
    list_filter = ['notification_type', 'is_read', 'created_at']
    search_fields = ['title', 'message', 'recipient__username']
    readonly_fields = ['created_at']

    fieldsets = (
        ('Notification', {
            'fields': ('recipient', 'notification_type', 'title', 'message')
        }),
        ('Liens', {
            'fields': ('related_project', 'related_task', 'related_comment', 'related_timesheet')
        }),
        ('Statut', {
            'fields': ('is_read',)
        }),
        ('Métadonnées', {
            'fields': ('created_at',)
        }),
    )


@admin.register(TaskComment)
class TaskCommentAdmin(admin.ModelAdmin):
    list_display = ['task', 'author', 'content_preview', 'created_at', 'parent']
    list_filter = ['created_at']
    search_fields = ['content', 'author__username', 'task__title']
    readonly_fields = ['created_at', 'updated_at']

    def content_preview(self, obj):
        """Affiche un aperçu du commentaire"""
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
    content_preview.short_description = 'Contenu' 