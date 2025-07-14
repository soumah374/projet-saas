from django.contrib import admin
from .models import UserProfile, ClientProfile

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'role', 'phone', 'avatar', 'bio', 'department', 'position', 'hire_date', 'is_active']
    list_filter = ['department', 'is_active', 'role', 'created_at']
    search_fields = ['role', 'department', 'user', 'id']
    readonly_fields = ['id', 'created_at', 'updated_at']

@admin.register(ClientProfile)
class ClientProfileAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'telephone', 'adresse', 'ville', 'pays', 'is_active', 'date_inscription']
    list_filter = ['is_active', 'pays', 'ville', 'date_inscription']
    search_fields = ['user__first_name', 'user__last_name', 'user__email', 'telephone', 'adresse', 'ville', 'pays']
    readonly_fields = ['id', 'date_inscription']
    