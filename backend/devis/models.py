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
    
    # Configuration TVA
    taux_tva = models.DecimalField(max_digits=5, decimal_places=2, default=18.00, validators=[MinValueValidator(0)])
    appliquer_tva = models.BooleanField(default=True, verbose_name="Appliquer la TVA")
    
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
        # Trouver le plus grand numéro existant pour cette année
        last_devis = Devis.objects.filter(
            numero__startswith=f"DEV{year}"
        ).order_by('-numero').first()
        
        if last_devis:
            # Extraire le numéro et incrémenter
            last_number = int(last_devis.numero[-4:])
            new_number = last_number + 1
        else:
            new_number = 1
            
        return f"DEV{year}{new_number:04d}"
    
    def calculer_montants(self):
        """Calculer les montants HT, TVA et TTC"""
        from decimal import Decimal
        
        total_ht = sum(ligne.montant_ht for ligne in self.lignes.all())
        self.montant_ht = total_ht
        
        # Calculer la TVA selon la configuration
        if self.appliquer_tva:
            # S'assurer que taux_tva est bien un Decimal
            taux = self.taux_tva / 100
            if isinstance(taux, float):
                taux = Decimal(str(taux))
            self.montant_tva = self.montant_ht * taux
        else:
            self.montant_tva = Decimal('0')
        
        self.montant_ttc = self.montant_ht + self.montant_tva
        self.save()
    
    def ajouter_ligne(self, service_id, activity_id, description, quantite, unite_id):
        """Ajouter une ligne au devis"""
        from catalog.models import Service, Activity, UniteStandard
        
        service = Service.objects.get(id=service_id)
        activity = Activity.objects.get(id=activity_id)
        unite = UniteStandard.objects.get(id=unite_id)
        
        # Créer la ligne avec un prix unitaire initial de 0
        ligne = self.lignes.create(
            service=service,
            activity=activity,
            description=description,
            quantite=quantite,
            unite=unite,
            prix_unitaire_ht=0  # Sera recalculé quand les intervenants seront ajoutés
        )
        
        return ligne


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
