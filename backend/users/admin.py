from django.contrib import admin
from django.contrib.auth.models import Group, Permission
from django.contrib.auth.admin import GroupAdmin
from .models import UserProfile, OTPCode, ClientProfile, ClientCategory

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'role', 'phone', 'avatar', 'bio', 'department', 'position', 'hire_date', 'is_active']
    list_filter = ['department', 'is_active', 'role', 'created_at']
    search_fields = ['role', 'department', 'user', 'id']
    readonly_fields = ['id', 'created_at', 'updated_at']

@admin.register(ClientProfile)
class ClientProfileAdmin(admin.ModelAdmin):
    list_display = ['id', 'nom_complet', 'email', 'telephone', 'type_client', 'statut_commercial', 'ville', 'pays', 'is_active', 'date_inscription']
    list_filter = ['is_active', 'pays', 'ville', 'type_client', 'statut_commercial', 'date_inscription']
    search_fields = ['nom', 'prenom', 'email', 'telephone', 'contact', 'raison_sociale', 'rccm_nif', 'adresse', 'ville', 'pays']
    readonly_fields = ['id', 'date_inscription', 'nom_complet']
    fieldsets = (
        ('Informations de base', {
            'fields': ('nom', 'prenom', 'email', 'telephone', 'type_client', 'statut_commercial')
        }),
        ('Informations entreprise (Personne morale)', {
            'fields': ('raison_sociale', 'rccm_nif', 'contact'),
            'classes': ('collapse',),
            'description': 'Ces champs ne s\'affichent que pour les personnes morales'
        }),
        ('Adresse', {
            'fields': ('adresse_complete', 'adresse', 'ville', 'code_postal', 'pays')
        }),
        ('Métadonnées', {
            'fields': ('is_active', 'date_inscription'),
            'classes': ('collapse',)
        }),
    )

@admin.register(ClientCategory)
class ClientCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'description')
    search_fields = ('name',)


# Personnaliser l'interface d'administration des groupes
class CustomGroupAdmin(GroupAdmin):
    list_display = ['name', 'permissions_count', 'users_count']
    search_fields = ['name']
    filter_horizontal = ['permissions']
    
    def permissions_count(self, obj):
        return obj.permissions.count()
    permissions_count.short_description = 'Permissions'
    
    def users_count(self, obj):
        return obj.user_set.count()
    users_count.short_description = 'Utilisateurs'


# Remplacer l'admin par défaut du groupe
admin.site.unregister(Group)
admin.site.register(Group, CustomGroupAdmin)
    