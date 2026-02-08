from django.contrib import admin
from .models import (
    Contrat, LigneContrat, LigneContratIntervenant,
    EcheancierContrat, LigneEcheancierContrat,
    Avenant, ContratHistoriqueMontant
)


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


@admin.register(ContratHistoriqueMontant)
class ContratHistoriqueMontantAdmin(admin.ModelAdmin):
    list_display = ['contrat', 'date_modification', 'type_modification', 'montant_ttc_avant', 'montant_ttc_apres', 'variation_ttc', 'variation_pourcentage']
    list_filter = ['type_modification', 'date_modification']
    search_fields = ['contrat__numero', 'description']
    readonly_fields = ['date_modification', 'variation_ht', 'variation_ttc', 'variation_pourcentage']
    ordering = ['-date_modification']

    fieldsets = (
        ('Informations générales', {
            'fields': ('contrat', 'date_modification', 'type_modification', 'description')
        }),
        ('Montants avant modification', {
            'fields': ('montant_ht_avant', 'montant_tva_avant', 'montant_ttc_avant')
        }),
        ('Montants après modification', {
            'fields': ('montant_ht_apres', 'montant_tva_apres', 'montant_ttc_apres')
        }),
        ('Variations', {
            'fields': ('variation_ht', 'variation_ttc', 'variation_pourcentage'),
            'classes': ('collapse',)
        }),
        ('Métadonnées', {
            'fields': ('metadata',),
            'classes': ('collapse',)
        }),
    )

    def variation_ttc(self, obj):
        """Affiche la variation TTC formatée"""
        variation = obj.variation_ttc
        sign = '+' if variation > 0 else ''
        return f"{sign}{variation:,.2f} FCFA"
    variation_ttc.short_description = "Variation TTC"

    def variation_pourcentage(self, obj):
        """Affiche la variation en pourcentage"""
        variation = obj.variation_pourcentage
        sign = '+' if variation > 0 else ''
        return f"{sign}{variation:.2f}%"
    variation_pourcentage.short_description = "Variation %"


# ===== NOUVEAUX ADMINS POUR LA NOUVELLE ARCHITECTURE =====

class LigneEcheancierContratInline(admin.TabularInline):
    model = LigneEcheancierContrat
    extra = 0
    readonly_fields = ['jours_restants', 'est_en_retard']
    fields = ['numero_echeance', 'type_echeance', 'montant_ttc', 'pourcentage', 'date_echeance', 'statut', 'commentaire']


@admin.register(EcheancierContrat)
class EcheancierContratAdmin(admin.ModelAdmin):
    list_display = ['contrat', 'type_echeancier', 'get_montant_total', 'get_nombre_lignes', 'date_creation']
    list_filter = ['type_echeancier', 'date_creation']
    search_fields = ['contrat__numero', 'description']
    readonly_fields = ['date_creation']
    inlines = [LigneEcheancierContratInline]
    ordering = ['contrat', '-date_creation']

    fieldsets = (
        ('Informations générales', {
            'fields': ('contrat', 'type_echeancier', 'date_creation')
        }),
        ('Description', {
            'fields': ('description',)
        }),
        ('Métadonnées', {
            'fields': ('metadata',),
            'classes': ('collapse',)
        }),
    )

    def get_nombre_lignes(self, obj):
        """Retourne le nombre de lignes d'échéances"""
        return obj.nombre_lignes
    get_nombre_lignes.short_description = "Nb lignes"

    def get_montant_total(self, obj):
        """Retourne le montant total formaté"""
        return f"{obj.montant_total:,.2f} FCFA"
    get_montant_total.short_description = "Montant total"


@admin.register(LigneEcheancierContrat)
class LigneEcheancierContratAdmin(admin.ModelAdmin):
    list_display = ['echeancier', 'numero_echeance', 'type_echeance', 'montant_ttc', 'date_echeance', 'statut', 'jours_restants']
    list_filter = ['type_echeance', 'statut', 'date_echeance']
    search_fields = ['echeancier__contrat__numero', 'commentaire']
    readonly_fields = ['created_at', 'updated_at', 'jours_restants', 'est_en_retard', 'doit_alerter']
    ordering = ['echeancier', 'numero_echeance']

    fieldsets = (
        ('Échéancier parent', {
            'fields': ('echeancier',)
        }),
        ('Informations de l\'échéance', {
            'fields': ('numero_echeance', 'type_echeance', 'pourcentage')
        }),
        ('Montants', {
            'fields': ('montant_ht', 'montant_tva', 'montant_ttc')
        }),
        ('Dates et statut', {
            'fields': ('date_echeance', 'date_paiement', 'statut', 'jours_restants', 'est_en_retard', 'doit_alerter')
        }),
        ('Suivi', {
            'fields': ('commentaire', 'alerte_envoyee')
        }),
        ('Métadonnées', {
            'fields': ('metadata', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def jours_restants(self, obj):
        """Affiche les jours restants"""
        jours = obj.jours_restants
        if jours < 0:
            return f"{abs(jours)} jours de retard"
        elif jours == 0:
            return "Aujourd'hui"
        else:
            return f"{jours} jours"
    jours_restants.short_description = "Échéance"
