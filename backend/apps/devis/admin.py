from django.contrib import admin
from .models import Devis, LigneDevis, LigneDevisIntervenant


class LigneDevisIntervenantInline(admin.TabularInline):
    """Inline pour les intervenants d'une ligne de devis"""
    model = LigneDevisIntervenant
    extra = 1
    fields = ['profile_intervenant', 'temps_intervenant', 'taux_horaire', 'montant_intervenant']
    readonly_fields = ['montant_intervenant']


class LigneDevisInline(admin.TabularInline):
    """Inline pour les lignes de devis"""
    model = LigneDevis
    extra = 1
    fields = ['service', 'activity', 'description', 'quantite', 'unite', 'prix_unitaire_ht', 'montant_ht']
    readonly_fields = ['prix_unitaire_ht', 'montant_ht']
    inlines = [LigneDevisIntervenantInline]


@admin.register(Devis)
class DevisAdmin(admin.ModelAdmin):
    """Admin pour les devis"""
    list_display = ['numero', 'client', 'date_creation', 'date_validite', 'statut', 'montant_ttc']
    list_filter = ['statut', 'date_creation', 'date_validite', 'appliquer_tva']
    search_fields = ['numero', 'client__nom', 'client__prenom', 'client__raison_sociale']
    readonly_fields = ['numero', 'date_creation', 'montant_ht', 'montant_tva', 'montant_ttc']
    inlines = [LigneDevisInline]
    
    fieldsets = (
        ('Informations générales', {
            'fields': ('numero', 'client', 'date_creation', 'date_validite', 'statut')
        }),
        ('Configuration TVA', {
            'fields': ('taux_tva', 'appliquer_tva'),
            'classes': ('collapse',)
        }),
        ('Montants', {
            'fields': ('montant_ht', 'montant_tva', 'montant_ttc'),
            'classes': ('collapse',)
        }),
        ('Notes et conditions', {
            'fields': ('notes', 'conditions'),
            'classes': ('collapse',)
        }),
    )
    
    def save_formset(self, request, form, formset, change):
        """Sauvegarder les formsets et recalculer les montants"""
        instances = formset.save(commit=False)
        for instance in instances:
            instance.save()
        formset.save_m2m()
        
        # Recalculer les montants du devis
        if form.instance.pk:
            form.instance.calculer_montants()


@admin.register(LigneDevis)
class LigneDevisAdmin(admin.ModelAdmin):
    """Admin pour les lignes de devis"""
    list_display = ['id', 'devis', 'service', 'activity', 'quantite', 'unite', 'prix_unitaire_ht', 'montant_ht']
    list_filter = ['service', 'activity', 'unite', 'devis__statut']
    search_fields = ['devis__numero', 'activity__name', 'description']
    readonly_fields = ['prix_unitaire_ht', 'montant_ht']
    inlines = [LigneDevisIntervenantInline]
    
    fieldsets = (
        ('Informations de base', {
            'fields': ('devis', 'service', 'activity', 'description')
        }),
        ('Quantité et unité', {
            'fields': ('quantite', 'unite')
        }),
        ('Montants', {
            'fields': ('prix_unitaire_ht', 'montant_ht'),
            'classes': ('collapse',)
        }),
    )


@admin.register(LigneDevisIntervenant)
class LigneDevisIntervenantAdmin(admin.ModelAdmin):
    """Admin pour les intervenants de ligne de devis"""
    list_display = ['ligne_devis', 'profile_intervenant', 'temps_intervenant', 'taux_horaire', 'montant_intervenant']
    list_filter = ['profile_intervenant', 'ligne_devis__service', 'ligne_devis__activity']
    search_fields = ['profile_intervenant__name', 'ligne_devis__devis__numero']
    readonly_fields = ['montant_intervenant']
    
    fieldsets = (
        ('Informations de base', {
            'fields': ('ligne_devis', 'profile_intervenant')
        }),
        ('Temps et taux', {
            'fields': ('temps_intervenant', 'taux_horaire')
        }),
        ('Montant', {
            'fields': ('montant_intervenant',),
            'classes': ('collapse',)
        }),
    )
