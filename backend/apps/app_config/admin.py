from django.contrib import admin
from django.utils.html import format_html
from .models import ApplicationConfig


@admin.register(ApplicationConfig)
class ApplicationConfigAdmin(admin.ModelAdmin):
    """Interface d'administration pour la configuration de l'application"""
    
    list_display = [
        'app_name', 
        'company_name', 
        'logo_preview', 
        'favicon_preview',
        'updated_at'
    ]
    
    fieldsets = (
        ('Informations de l\'application', {
            'fields': ('app_name', 'app_description')
        }),
        ('Logos et icônes', {
            'fields': ('logo', 'favicon'),
            'description': 'Téléchargez les images pour personnaliser l\'apparence de l\'application'
        }),
        ('Informations de l\'entreprise', {
            'fields': (
                'company_name', 
                'company_address', 
                'company_phone', 
                'company_email', 
                'company_website'
            ),
            'classes': ('collapse',)
        }),
        ('Couleurs du thème', {
            'fields': ('primary_color', 'secondary_color'),
            'description': 'Couleurs principales de l\'interface utilisateur'
        }),
    )
    
    readonly_fields = ['created_at', 'updated_at']
    
    def logo_preview(self, obj):
        """Affiche un aperçu du logo dans l'admin"""
        if obj.logo:
            return format_html(
                '<img src="{}" style="max-height: 50px; max-width: 100px;" />',
                obj.logo.url
            )
        return "Aucun logo"
    logo_preview.short_description = "Aperçu du logo"
    
    def favicon_preview(self, obj):
        """Affiche un aperçu du favicon dans l'admin"""
        if obj.favicon:
            return format_html(
                '<img src="{}" style="max-height: 32px; max-width: 32px;" />',
                obj.favicon.url
            )
        return "Aucun favicon"
    favicon_preview.short_description = "Aperçu du favicon"
    
    def has_add_permission(self, request):
        """Empêche la création de nouvelles configurations si une existe déjà"""
        return not ApplicationConfig.objects.exists()
    
    def has_delete_permission(self, request, obj=None):
        """Empêche la suppression de la configuration"""
        return False
    
    class Media:
        css = {
            'all': ('admin/css/custom_admin.css',)
        }
        js = ('admin/js/color_picker.js',)
