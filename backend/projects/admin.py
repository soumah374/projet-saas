from django.contrib import admin
from .models import Project, ProjectMember, ProjectBudget, ProjectTask


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'type', 'status', 'priority', 'progress', 'deadline', 'client', 'created_by']
    list_filter = ['type', 'status', 'priority', 'category', 'created_at']
    search_fields = ['title', 'description', 'client', 'id']
    readonly_fields = ['id', 'created_at', 'updated_at']
    filter_horizontal = ['team_members']
    
    fieldsets = (
        ('Informations de base', {
            'fields': ('id', 'title', 'description', 'objectives')
        }),
        ('Classification', {
            'fields': ('type', 'category', 'status', 'priority')
        }),
        ('Dates', {
            'fields': ('start_date', 'deadline', 'created_at', 'updated_at')
        }),
        ('Progression et budget', {
            'fields': ('progress', 'budget')
        }),
        ('Relations', {
            'fields': ('client', 'created_by', 'team_members')
        }),
        ('Métadonnées', {
            'fields': ('tags',)
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