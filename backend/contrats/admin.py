from django.contrib import admin
from .models import Contrat, LigneContrat, LigneContratIntervenant, EcheancierContrat, Avenant


class LigneContratIntervenantInline(admin.TabularInline):
    model = LigneContratIntervenant
    extra = 0
    readonly_fields = ['montant_intervenant']


class LigneContratInline(admin.TabularInline):
    model = LigneContrat
    extra = 0
    readonly_fields = ['montant_ht']
    inlines = [LigneContratIntervenantInline]


@admin.register(Contrat)
class ContratAdmin(admin.ModelAdmin):
    list_display = ['numero', 'client', 'get_devis_display', 'devis_principal', 'date_debut', 'date_fin', 'statut', 'montant_ttc']
    list_filter = ['statut', 'date_debut', 'date_fin']
    search_fields = ['numero', 'client__nom', 'client__prenom', 'devis__numero', 'devis_principal__numero']
    readonly_fields = ['numero', 'date_creation', 'montant_ht', 'montant_tva', 'montant_ttc']
    inlines = [LigneContratInline]
    
    def get_devis_display(self, obj):
        """Affiche les devis associés"""
        if obj.devis.exists():
            devis_list = [devis.numero for devis in obj.devis.all()]
            if len(devis_list) == 1:
                return devis_list[0]
            else:
                return f"{len(devis_list)} devis: {', '.join(devis_list[:2])}{'...' if len(devis_list) > 2 else ''}"
        return "—"
    get_devis_display.short_description = "Devis associés"
    
    fieldsets = (
        ('Informations générales', {
            'fields': ('numero', 'devis', 'devis_principal', 'client', 'statut')
        }),
        ('Dates', {
            'fields': ('date_creation', 'date_debut', 'date_fin')
        }),
        ('Configuration TVA', {
            'fields': ('taux_tva', 'appliquer_tva')
        }),
        ('Montants', {
            'fields': ('montant_ht', 'montant_tva', 'montant_ttc'),
            'classes': ('collapse',)
        }),
        ('Contenu', {
            'fields': ('conditions', 'notes')
        }),
    )


@admin.register(LigneContrat)
class LigneContratAdmin(admin.ModelAdmin):
    list_display = ['contrat', 'type_ligne', 'intitule', 'quantite', 'prix_unitaire_ht', 'montant_ht']
    list_filter = ['type_ligne', 'contrat__statut']
    search_fields = ['contrat__numero', 'description']
    readonly_fields = ['montant_ht']
    inlines = [LigneContratIntervenantInline]


@admin.register(LigneContratIntervenant)
class LigneContratIntervenantAdmin(admin.ModelAdmin):
    list_display = ['ligne_contrat', 'profile_intervenant', 'temps_intervenant', 'taux_horaire', 'montant_intervenant']
    list_filter = ['ligne_contrat__type_ligne']
    search_fields = ['ligne_contrat__contrat__numero', 'profile_intervenant__name']
    readonly_fields = ['montant_intervenant']


@admin.register(Avenant)
class AvenantAdmin(admin.ModelAdmin):
    list_display = ['numero', 'contrat', 'intitule_avenant', 'type_modification', 'statut', 'date_creation']
    list_filter = ['statut', 'type_modification', 'date_creation']
    search_fields = ['numero', 'intitule_avenant', 'objet_avenant', 'contrat__numero']
    readonly_fields = ['numero', 'date_creation', 'created_at', 'updated_at']
    ordering = ['-date_creation']
    
    fieldsets = (
        ('Informations générales', {
            'fields': ('numero', 'contrat', 'intitule_avenant', 'objet_avenant', 'type_modification')
        }),
        ('Statut et dates', {
            'fields': ('statut', 'date_creation', 'date_signature')
        }),
        ('Modifications', {
            'fields': ('modifications',)
        }),
        ('Contenu', {
            'fields': ('contenu_personnalise', 'variables_personnalisees')
        }),
        ('Fichier signé', {
            'fields': ('fichier_signe',)
        }),
        ('Métadonnées', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
