import uuid
from django.db import models
from django.utils import timezone
from django.core.validators import MinValueValidator
from users.models import ClientProfile
from devis.models import Devis
from catalog.models import Service, Activity, IntervenantProfile, UniteStandard


class Contrat(models.Model):
    """Modèle pour les contrats basés sur des devis acceptés"""
    
    STATUT_CHOICES = [
        ('brouillon', 'Brouillon'),
        ('actif', 'Actif'),
        ('termine', 'Terminé'),
        ('annule', 'Annulé'),
        ('suspendu', 'Suspendu'),
    ]
    
    # Numéro généré automatiquement
    numero = models.CharField(max_length=50, unique=True, editable=False)
    
    # Relation avec le devis accepté
    devis = models.OneToOneField(Devis, on_delete=models.CASCADE, related_name='contrat')
    
    # Relations
    client = models.ForeignKey(ClientProfile, on_delete=models.CASCADE, related_name='contrats')
    
    # Informations du contrat
    date_creation = models.DateTimeField(auto_now_add=True)
    date_debut = models.DateField()
    date_fin = models.DateField()
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='brouillon')
    
    # Configuration TVA (héritée du devis)
    taux_tva = models.DecimalField(max_digits=5, decimal_places=2, default=18.00, validators=[MinValueValidator(0)])
    appliquer_tva = models.BooleanField(default=True, verbose_name="Appliquer la TVA")
    
    # Informations commerciales
    montant_ht = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    montant_tva = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    montant_ttc = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Conditions et clauses
    conditions = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    
    # Métadonnées
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Contrat'
        verbose_name_plural = 'Contrats'
        ordering = ['-date_creation']
    
    def __str__(self):
        return f"Contrat {self.numero} - {self.client.nom_complet}"
    
    def save(self, *args, **kwargs):
        if not self.numero:
            # Générer un numéro unique
            self.numero = self.generate_numero()
        super().save(*args, **kwargs)
    
    def generate_numero(self):
        """Générer un numéro de contrat unique"""
        year = timezone.now().year
        # Trouver le plus grand numéro existant pour cette année
        last_contrat = Contrat.objects.filter(
            numero__startswith=f"CON{year}"
        ).order_by('-numero').first()
        
        if last_contrat:
            # Extraire le numéro et incrémenter
            last_number = int(last_contrat.numero[-4:])
            new_number = last_number + 1
        else:
            new_number = 1
            
        return f"CON{year}{new_number:04d}"
    
    def calculer_montants(self):
        """Calculer les montants HT, TVA et TTC"""
        from decimal import Decimal
        
        total_ht = sum(ligne.montant_ht for ligne in self.lignes.all())
        self.montant_ht = total_ht
        
        # Calculer la TVA selon la configuration
        if self.appliquer_tva:
            taux = self.taux_tva / 100
            if isinstance(taux, float):
                taux = Decimal(str(taux))
            self.montant_tva = self.montant_ht * taux
        else:
            self.montant_tva = Decimal('0')
        
        self.montant_ttc = self.montant_ht + self.montant_tva
        self.save()


class LigneContrat(models.Model):
    """Modèle pour les lignes de contrat (basées sur les lignes de devis)"""
    
    TYPE_CHOICES = [
        ('prestation', 'Prestation'),
        ('frais', 'Frais'),
    ]
    
    TYPE_CHOICES_FRAIS = [
        ('standard', 'Standard'),
        ('forfait', 'Forfait'),
        ('offert', 'Offert'),
    ]
    
    contrat = models.ForeignKey(Contrat, on_delete=models.CASCADE, related_name='lignes')
    type_ligne = models.CharField(max_length=200, choices=TYPE_CHOICES)
    type_frais = models.CharField(max_length=200, choices=TYPE_CHOICES_FRAIS, blank=True, null=True)
    
    # Relations pour prestations
    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name='lignes_contrat', blank=True, null=True)
    activity = models.ForeignKey(Activity, on_delete=models.CASCADE, related_name='lignes_contrat', blank=True, null=True)
    
    # Relations pour frais
    frais_category = models.ForeignKey('catalog.FraisCategory', on_delete=models.CASCADE, related_name='lignes_contrat', blank=True, null=True)
    ligne_frais = models.ForeignKey('catalog.LigneFrais', on_delete=models.CASCADE, related_name='lignes_contrat', blank=True, null=True)
    
    # Informations de la ligne
    description = models.TextField(blank=True, default='')
    quantite = models.DecimalField(max_digits=10, decimal_places=2, default=1, validators=[MinValueValidator(0)])
    unite = models.ForeignKey(UniteStandard, on_delete=models.CASCADE, related_name='lignes_contrat')
    prix_unitaire_ht = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    montant_ht = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Métadonnées
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Ligne de contrat'
        verbose_name_plural = 'Lignes de contrat'
        ordering = ['created_at']
    
    def __str__(self):
        return f"Ligne {self.id} - {self.contrat.numero}"
    
    def save(self, *args, **kwargs):
        # Validation selon le type
        if self.type_ligne == 'prestation':
            if not self.service or not self.activity:
                raise ValueError('Service et activité requis pour une prestation')
        elif self.type_ligne == 'frais':
            if not self.frais_category or not self.ligne_frais:
                raise ValueError('Catégorie et ligne de frais requis pour les frais')
        
        # Calculer le montant HT
        self.montant_ht = self.quantite * self.prix_unitaire_ht
        
        super().save(*args, **kwargs)
    
    @property
    def intitule(self):
        """Retourner l'intitulé de la ligne"""
        if self.type_ligne == 'prestation':
            return self.activity.intitule if self.activity else 'Prestation'
        else:
            return self.ligne_frais.description if self.ligne_frais else 'Frais'


class LigneContratIntervenant(models.Model):
    """Modèle pour les intervenants d'une ligne de contrat"""
    
    ligne_contrat = models.ForeignKey(LigneContrat, on_delete=models.CASCADE, related_name='intervenants')
    profile_intervenant = models.ForeignKey(IntervenantProfile, on_delete=models.CASCADE, related_name='lignes_contrat')
    
    # Temps personnalisé pour ce contrat
    temps_intervenant = models.DecimalField(max_digits=8, decimal_places=2, validators=[MinValueValidator(0)])
    
    # Taux horaire pour ce contrat
    taux_horaire = models.DecimalField(max_digits=8, decimal_places=2, validators=[MinValueValidator(0)])
    
    # Montant pour cet intervenant
    montant_intervenant = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Métadonnées
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Intervenant ligne contrat'
        verbose_name_plural = 'Intervenants lignes contrat'
        unique_together = ['ligne_contrat', 'profile_intervenant']
    
    def __str__(self):
        return f"{self.profile_intervenant.intitule} - {self.ligne_contrat.contrat.numero}"
    
    def save(self, *args, **kwargs):
        # Calculer le montant pour cet intervenant
        self.montant_intervenant = self.temps_intervenant * self.taux_horaire
        super().save(*args, **kwargs)
    
    def recalculer_prix_ligne(self):
        """Recalculer le prix de la ligne de contrat"""
        total_intervenants = sum(interv.montant_intervenant for interv in self.ligne_contrat.intervenants.all())
        self.ligne_contrat.prix_unitaire_ht = total_intervenants
        self.ligne_contrat.save()


class TemplateContrat(models.Model):
    """Modèle pour les templates de contrat"""
    
    TYPE_CHOICES = [
        ('prestation', 'Prestation de services'),
        ('maintenance', 'Maintenance'),
        ('formation', 'Formation'),
        ('conseil', 'Conseil'),
        ('personnalise', 'Personnalisé'),
    ]
    
    nom = models.CharField(max_length=200, verbose_name="Nom du template")
    type_template = models.CharField(max_length=20, choices=TYPE_CHOICES, default='prestation')
    description = models.TextField(blank=True, verbose_name="Description")
    
    # Contenu du template
    contenu = models.TextField(verbose_name="Contenu du template")
    
    # Variables par défaut (JSON)
    variables_defaut = models.JSONField(default=dict, verbose_name="Variables par défaut")
    
    # Configuration
    est_actif = models.BooleanField(default=True, verbose_name="Template actif")
    est_public = models.BooleanField(default=True, verbose_name="Template public")
    
    # Métadonnées
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey('auth.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='templates_contrat_crees')
    
    class Meta:
        verbose_name = 'Template de contrat'
        verbose_name_plural = 'Templates de contrat'
        ordering = ['nom']
    
    def __str__(self):
        return f"{self.nom} ({self.get_type_template_display()})"
    
    def get_variables_disponibles(self):
        """Retourne la liste des variables disponibles dans le template"""
        import re
        variables = re.findall(r'\[([A-Z_]+)\]', self.contenu)
        return list(set(variables))
    
    def remplacer_variables(self, variables_dict):
        """Remplace les variables dans le contenu du template"""
        contenu = self.contenu
        for variable, valeur in variables_dict.items():
            contenu = contenu.replace(f'[{variable}]', str(valeur))
        return contenu
