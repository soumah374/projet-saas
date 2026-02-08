from django.contrib import admin
from .models import EmailTemplate, EmailTemplateVariable


@admin.register(EmailTemplate)
class EmailTemplateAdmin(admin.ModelAdmin):
    list_display = ['nom', 'type_email', 'est_actif', 'est_defaut', 'date_modification']
    list_filter = ['type_email', 'est_actif', 'est_defaut']
    search_fields = ['nom', 'sujet']
    ordering = ['type_email', 'nom']
    
    fieldsets = (
        ('Informations générales', {
            'fields': ('nom', 'type_email', 'est_actif', 'est_defaut')
        }),
        ('Contenu du template', {
            'fields': ('sujet', 'contenu'),
            'classes': ('wide',)
        }),
    )
    
    readonly_fields = ('date_creation', 'date_modification')


@admin.register(EmailTemplateVariable)
class EmailTemplateVariableAdmin(admin.ModelAdmin):
    list_display = ['type_email', 'nom_variable', 'description', 'exemple']
    list_filter = ['type_email']
    search_fields = ['nom_variable', 'description']
    ordering = ['type_email', 'nom_variable']
