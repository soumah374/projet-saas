import uuid
from django.db import models
from django.utils import timezone
from django.core.validators import MinValueValidator
from users.models import ClientProfile
from catalog.models import Service, Activity, IntervenantProfile, UniteStandard


class Devis(models.Model):
    """Modèle pour les devis"""
    
    STATUT_CHOICES = [
        ('brouillon', 'Brouillon'),
        ('envoye', 'Envoyé'),
        ('accepte', 'Accepté'),
        ('refuse', 'Refusé'),
        ('expire', 'Expiré'),
    ]
    
    # Numéro généré automatiquement
    numero = models.CharField(max_length=50, unique=True, editable=False)
    
    # Relations
    client = models.ForeignKey(ClientProfile, on_delete=models.CASCADE, related_name='devis')
    
    # Informations du devis
    date_creation = models.DateTimeField(auto_now_add=True)
    date_validite = models.DateField()
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='brouillon')
    
    # Informations commerciales
    montant_ht = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    montant_tva = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    montant_ttc = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Notes et conditions
    notes = models.TextField(blank=True)
    conditions = models.TextField(blank=True)
    
    # Métadonnées
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Devis'
        verbose_name_plural = 'Devis'
        ordering = ['-date_creation']
    
    def __str__(self):
        return f"Devis {self.numero} - {self.client.nom_complet}"
    
    def save(self, *args, **kwargs):
        if not self.numero:
            # Générer un numéro unique
            self.numero = self.generate_numero()
        super().save(*args, **kwargs)
    
    def generate_numero(self):
        """Générer un numéro de devis unique"""
        year = timezone.now().year
        # Compter les devis de cette année
        count = Devis.objects.filter(
            numero__startswith=f"DEV{year}"
        ).count() + 1
        return f"DEV{year}{count:04d}"
    
    def calculer_montants(self):
        """Calculer les montants HT, TVA et TTC"""
        total_ht = sum(ligne.montant_ht for ligne in self.lignes.all())
        self.montant_ht = total_ht
        # TVA à 20% (à adapter selon vos besoins)
        self.montant_tva = total_ht * 0.20
        self.montant_ttc = total_ht + self.montant_tva
        self.save()


class LigneDevis(models.Model):
    """Modèle pour les lignes de devis"""
    
    devis = models.ForeignKey(Devis, on_delete=models.CASCADE, related_name='lignes')
    
    # Relations avec le catalogue
    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name='lignes_devis')
    activity = models.ForeignKey(Activity, on_delete=models.CASCADE, related_name='lignes_devis')
    
    # Informations de la ligne
    description = models.TextField()
    quantite = models.DecimalField(max_digits=10, decimal_places=2, default=1, validators=[MinValueValidator(0)])
    unite = models.ForeignKey(UniteStandard, on_delete=models.CASCADE, related_name='lignes_devis')
    
    # Montants
    prix_unitaire_ht = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    montant_ht = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Métadonnées
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Ligne de devis'
        verbose_name_plural = 'Lignes de devis'
        ordering = ['created_at']
    
    def __str__(self):
        return f"Ligne {self.id} - {self.activity.intitule}"
    
    def save(self, *args, **kwargs):
        # Calculer le montant HT
        self.montant_ht = self.quantite * self.prix_unitaire_ht
        super().save(*args, **kwargs)
        # Recalculer les montants du devis
        self.devis.calculer_montants()


class LigneDevisIntervenant(models.Model):
    """Modèle pour les intervenants d'une ligne de devis avec temps personnalisé"""
    
    ligne_devis = models.ForeignKey(LigneDevis, on_delete=models.CASCADE, related_name='intervenants')
    profile_intervenant = models.ForeignKey(IntervenantProfile, on_delete=models.CASCADE, related_name='lignes_devis')
    
    # Temps personnalisé pour ce devis
    temps_intervenant = models.DecimalField(max_digits=8, decimal_places=2, validators=[MinValueValidator(0)])
    
    # Taux horaire pour ce devis
    taux_horaire = models.DecimalField(max_digits=8, decimal_places=2, validators=[MinValueValidator(0)])
    
    # Montant pour cet intervenant
    montant_intervenant = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Métadonnées
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Intervenant ligne devis'
        verbose_name_plural = 'Intervenants lignes devis'
        unique_together = ['ligne_devis', 'profile_intervenant']
    
    def __str__(self):
        return f"{self.profile_intervenant.intitule} - {self.temps_intervenant}h"
    
    def save(self, *args, **kwargs):
        # Calculer le montant pour cet intervenant
        self.montant_intervenant = self.temps_intervenant * self.taux_horaire
        super().save(*args, **kwargs)
        # Recalculer le prix unitaire de la ligne
        self.recalculer_prix_ligne()
    
    def recalculer_prix_ligne(self):
        """Recalculer le prix unitaire de la ligne basé sur les intervenants"""
        total_intervenants = sum(interv.montant_intervenant for interv in self.ligne_devis.intervenants.all())
        self.ligne_devis.prix_unitaire_ht = total_intervenants
        self.ligne_devis.save()
