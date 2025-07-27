from django.contrib import admin
from .models import Contrat, LigneContrat, LigneContratIntervenant


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
    list_display = ['numero', 'client', 'devis', 'date_debut', 'date_fin', 'statut', 'montant_ttc']
    list_filter = ['statut', 'date_debut', 'date_fin']
    search_fields = ['numero', 'client__nom', 'client__prenom', 'devis__numero']
    readonly_fields = ['numero', 'date_creation', 'montant_ht', 'montant_tva', 'montant_ttc']
    inlines = [LigneContratInline]
    
    fieldsets = (
        ('Informations générales', {
            'fields': ('numero', 'devis', 'client', 'statut')
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
    search_fields = ['ligne_contrat__contrat__numero', 'profile_intervenant__intitule']
    readonly_fields = ['montant_intervenant']
