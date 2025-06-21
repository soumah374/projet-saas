from django.contrib import admin
from .models import UserProfile

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'role', 'phone', 'avatar', 'bio', 'department', 'position', 'hire_date', 'is_active']
    list_filter = ['department', 'is_active', 'role', 'created_at']
    search_fields = ['role', 'department', 'user', 'id']
    readonly_fields = ['id', 'created_at', 'updated_at']
    