from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import Facture, PaiementFacture, LigneFacture, ConfigurationFacturation


@admin.register(Facture)
class FactureAdmin(admin.ModelAdmin):
    list_display = [
        'numero', 'client', 'contrat', 'date_emission', 'date_echeance',
        'montant_ttc', 'montant_paye', 'montant_restant', 'statut',
        'jours_restants', 'pourcentage_paye'
    ]
    list_filter = [
        'statut', 'mode_paiement', 'date_emission', 'date_echeance',
        'contrat__client', 'contrat'
    ]
    search_fields = ['numero', 'client__nom_complet', 'contrat__numero']
    readonly_fields = [
        'numero', 'montant_restant', 'jours_restants', 'est_en_retard',
        'pourcentage_paye', 'created_at', 'updated_at'
    ]
    fieldsets = (
        ('Informations générales', {
            'fields': ('numero', 'contrat', 'echeance', 'client', 'statut')
        }),
        ('Dates', {
            'fields': ('date_emission', 'date_echeance', 'date_paiement')
        }),
        ('Montants', {
            'fields': (
                'montant_ht', 'montant_tva', 'montant_frais_agence',
                'montant_ttc', 'montant_paye', 'montant_restant'
            )
        }),
        ('Configuration', {
            'fields': (
                'taux_tva', 'appliquer_tva', 'taux_frais_agence',
                'appliquer_frais_agence'
            )
        }),
        ('Paiement', {
            'fields': (
                'mode_paiement', 'iban', 'bic', 'compte_bancaire'
            )
        }),
        ('Informations', {
            'fields': ('notes', 'conditions_paiement', 'fichier_pdf')
        }),
        ('Métadonnées', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def jours_restants(self, obj):
        return obj.jours_restants
    jours_restants.short_description = 'Jours restants'
    
    def pourcentage_paye(self, obj):
        return f"{obj.pourcentage_paye:.1f}%"
    pourcentage_paye.short_description = '% Payé'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('client', 'contrat', 'echeance')
    
    actions = ['marquer_comme_payee', 'marquer_comme_envoyee']
    
    def marquer_comme_payee(self, request, queryset):
        from datetime import date
        updated = queryset.update(statut='payee', date_paiement=date.today())
        self.message_user(request, f'{updated} factures marquées comme payées.')
    marquer_comme_payee.short_description = "Marquer comme payées"
    
    def marquer_comme_envoyee(self, request, queryset):
        updated = queryset.update(statut='envoyee')
        self.message_user(request, f'{updated} factures marquées comme envoyées.')
    marquer_comme_envoyee.short_description = "Marquer comme envoyées"


@admin.register(PaiementFacture)
class PaiementFactureAdmin(admin.ModelAdmin):
    list_display = [
        'facture', 'montant', 'date_paiement', 'mode_paiement',
        'reference_paiement'
    ]
    list_filter = ['mode_paiement', 'date_paiement', 'facture__contrat']
    search_fields = [
        'facture__numero', 'facture__client__nom_complet',
        'reference_paiement'
    ]
    readonly_fields = ['created_at']
    
    fieldsets = (
        ('Informations du paiement', {
            'fields': ('facture', 'montant', 'date_paiement', 'mode_paiement')
        }),
        ('Références', {
            'fields': ('reference_paiement', 'notes')
        }),
        ('Métadonnées', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )


@admin.register(LigneFacture)
class LigneFactureAdmin(admin.ModelAdmin):
    list_display = [
        'facture', 'type_ligne', 'description', 'quantite',
        'prix_unitaire_ht', 'montant_ht'
    ]
    list_filter = ['type_ligne', 'facture__contrat']
    search_fields = ['description', 'facture__numero']
    readonly_fields = ['montant_ht', 'created_at']
    
    fieldsets = (
        ('Informations de la ligne', {
            'fields': ('facture', 'type_ligne', 'description')
        }),
        ('Montants', {
            'fields': ('quantite', 'prix_unitaire_ht', 'montant_ht')
        }),
        ('Métadonnées', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )


@admin.register(ConfigurationFacturation)
class ConfigurationFacturationAdmin(admin.ModelAdmin):
    list_display = [
        'facturation_automatique', 'delai_avant_echeance',
        'relance_automatique', 'prefixe_facture'
    ]
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Paramètres généraux', {
            'fields': (
                'facturation_automatique', 'delai_avant_echeance',
                'relance_automatique'
            )
        }),
        ('Numérotation', {
            'fields': ('prefixe_facture', 'format_numero')
        }),
        ('Paiement', {
            'fields': ('conditions_paiement_defaut',)
        }),
        ('Informations bancaires', {
            'fields': ('iban_defaut', 'bic_defaut', 'compte_bancaire_defaut')
        }),
        ('Métadonnées', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def has_add_permission(self, request):
        # Ne permettre qu'une seule configuration
        return not ConfigurationFacturation.objects.exists()
    
    def has_delete_permission(self, request, obj=None):
        # Empêcher la suppression de la configuration
        return False
