from django.contrib import admin
from .models import Department, DepartmentManagerHistory


@admin.register(DepartmentManagerHistory)
class DepartmentManagerHistoryAdmin(admin.ModelAdmin):
    list_display = ['department', 'manager', 'start_date', 'end_date']
    list_filter = ['department', 'manager', 'start_date']
    search_fields = ['department__name', 'manager__username', 'manager__first_name', 'manager__last_name']
    date_hierarchy = 'start_date'
    ordering = ['-start_date']


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ['name', 'current_manager', 'is_active', 'created_at']
    list_filter = ['is_active']
    search_fields = ['name', 'description']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['name']

    def current_manager(self, obj):
        manager = obj.current_manager
        return manager.get_full_name() if manager else '-'
    current_manager.short_description = 'Manager actuel'
