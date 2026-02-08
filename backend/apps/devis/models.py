import uuid
from django.db import models
from django.utils import timezone
from django.core.validators import MinValueValidator
from decimal import Decimal
from apps.users.models import ClientProfile
from apps.catalog.models import Service, Activity, IntervenantProfile, UniteStandard


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
    taux_tva = models.DecimalField(max_digits=5, decimal_places=2, default=18.00, validators=[MinValueValidator(Decimal('0'))])
    appliquer_tva = models.BooleanField(default=True, verbose_name="Appliquer la TVA")
    
    # Configuration Frais d'Agence
    taux_frais_agence = models.DecimalField(max_digits=5, decimal_places=2, default=15.00, validators=[MinValueValidator(Decimal('0'))])
    appliquer_frais_agence = models.BooleanField(default=False, verbose_name="Appliquer les frais d'agence")
    
    # Informations commerciales
    montant_ht = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    montant_tva = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    montant_frais_agence = models.DecimalField(max_digits=12, decimal_places=2, default=0)
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
    
    def generer_pdf(self, save_to_model=False):
        """Génère le PDF du devis"""
        from django.template.loader import render_to_string
        from weasyprint import HTML, CSS
        from weasyprint.text.fonts import FontConfiguration
        import tempfile
        import os
        
        try:
            # Rendre le template HTML
            html_string = render_to_string('devis/devis_pdf.html', {
                'devis': self
            })
            
            # Configuration des polices
            font_config = FontConfiguration()
            
            # Créer le PDF avec WeasyPrint
            html_doc = HTML(string=html_string)
            css = CSS(string='''
                @page { size: A4; margin: 1.5cm; }
                body { font-family: Arial, sans-serif; }
                .page-break { page-break-before: always; }
            ''', font_config=font_config)
            
            # Générer le PDF
            pdf = html_doc.write_pdf(stylesheets=[css], font_config=font_config)
            
            # Créer le nom de fichier
            filename = f"devis_{self.numero}.pdf"
            
            if save_to_model:
                # TODO: Implémenter la sauvegarde dans le modèle si nécessaire
                # self.pdf_file.save(filename, ContentFile(pdf), save=True)
                pass
            
            return pdf, filename
            
        except Exception as e:
            raise Exception(f'Erreur lors de la génération du PDF: {str(e)}')
    
    def calculer_montants(self):
        """Calculer les montants HT, TVA, Frais d'Agence et TTC"""
        from decimal import Decimal
        
        total_ht = sum(ligne.montant_ht for ligne in self.lignes.exclude(statut='retiree'))
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
        
        # Calculer les frais d'agence selon la configuration
        if self.appliquer_frais_agence:
            # S'assurer que taux_frais_agence est bien un Decimal
            taux_frais = self.taux_frais_agence / 100
            if isinstance(taux_frais, float):
                taux_frais = Decimal(str(taux_frais))
            self.montant_frais_agence = self.montant_ht * taux_frais
        else:
            self.montant_frais_agence = Decimal('0')
        
        self.montant_ttc = self.montant_ht + self.montant_tva + self.montant_frais_agence
        self.save()
    
    @property  
    def recalcul_after_line_change(self):
        from decimal import Decimal
        montant_old = {}
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
        
        # Calculer les frais d'agence selon la configuration
        if self.appliquer_frais_agence:
            # S'assurer que taux_frais_agence est bien un Decimal
            taux_frais = self.taux_frais_agence / 100
            if isinstance(taux_frais, float):
                taux_frais = Decimal(str(taux_frais))
            self.montant_frais_agence = self.montant_ht * taux_frais
        else:
            self.montant_frais_agence = Decimal('0')
        
        self.montant_ttc = self.montant_ht + self.montant_tva + self.montant_frais_agence
        
        montant_old = {
            'montant_ht': self.montant_ht,
            'montant_tva': self.montant_tva,
            'montant_frais_agence': self.montant_frais_agence,
            'montant_ttc': self.montant_ttc
        }
        return montant_old

    
    def ajouter_ligne(self, service_id, activity_id, description, quantite, unite_id, type_ligne, prix_unitaire_ht=0, montant_ht=0):
        """Ajouter une ligne au devis"""
        from catalog.models import Service, Activity, UniteStandard

        service = Service.objects.get(id=service_id)
        activity = Activity.objects.get(id=activity_id)
        unite = UniteStandard.objects.get(id=unite_id)

        # Créer la ligne avec le prix unitaire et montant fournis
        ligne = self.lignes.create(
            service=service,
            activity=activity,
            description=description,
            quantite=quantite,
            unite=unite,
            prix_unitaire_ht=prix_unitaire_ht,
            type_ligne=type_ligne,
            montant_ht=montant_ht
        )

        return ligne


class LigneDevis(models.Model):
    """Modèle polymorphique pour les lignes de devis (prestations et frais)"""
    TYPE_CHOICES = [
        ('prestation', 'Prestation'),
        ('frais', 'Frais'),
    ]
    
    STATUT_CHOICES = [
        ('active', 'Active'),
        ('retiree', 'Retirée'),
    ]
    
    TYPE_CHOICES_FRAIS = [
        ('standard', 'Standard'),
        ('forfait', 'Forfait'),
        ('offert', 'Offert'),
    ]
    devis = models.ForeignKey(Devis, on_delete=models.CASCADE, related_name='lignes')
    type_ligne = models.CharField(max_length=200, choices=TYPE_CHOICES)
    type_frais = models.CharField(max_length=200, choices=TYPE_CHOICES_FRAIS, blank=True, null=True)
    # Relations pour prestations
    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name='lignes_devis_services', blank=True, null=True)
    activity = models.ForeignKey(Activity, on_delete=models.CASCADE, related_name='lignes_devis_activities', blank=True, null=True)
    # Relations pour frais
    frais_category = models.ForeignKey('catalog.FraisCategory', on_delete=models.CASCADE, related_name='lignes_devis', blank=True, null=True)
    ligne_frais = models.ForeignKey('catalog.LigneFrais', on_delete=models.CASCADE, related_name='lignes_devis', blank=True, null=True)
    # Informations de la ligne
    description = models.TextField(blank=True, default='')
    quantite = models.DecimalField(max_digits=10, decimal_places=2, default=1, validators=[MinValueValidator(Decimal('0'))])
    unite = models.ForeignKey(UniteStandard, on_delete=models.CASCADE, related_name='lignes_devis')
    prix_unitaire_ht = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    montant_ht = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    # Gestion du retrait de ligne
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='active')
    commentaire_retrait = models.TextField(blank=True, default='', help_text='Raison du retrait de la ligne')
    date_retrait = models.DateTimeField(blank=True, null=True, help_text='Date à laquelle la ligne a été retirée')
    class Meta:
        verbose_name = 'Ligne de devis'
        verbose_name_plural = 'Lignes de devis'
        ordering = ['created_at']
        # permissions = [
        #     ('view_lignedevis', 'Peut voir les lignes de devis'),
        #     ('add_lignedevis', 'Peut ajouter des lignes de devis'),
        #     ('change_lignedevis', 'Peut modifier les lignes de devis'),
        #     ('delete_lignedevis', 'Peut supprimer les lignes de devis'),
        # ]
    def __str__(self):
        if self.type_ligne == 'prestation' and self.activity:
            return f"Prestation {self.id} - {self.activity.name}"
        elif self.type_ligne == 'frais' and self.ligne_frais:
            return f"Frais {self.id} - {self.ligne_frais.description}"
        return f"Ligne {self.id}"
    def save(self, *args, **kwargs):
        # Validation selon le type
        if self.type_ligne == 'prestation':
            if not self.service or not self.activity:
                raise ValueError("Service et Activity requis pour prestation")
            self.frais_category = None
            self.ligne_frais = None
        elif self.type_ligne == 'frais':
            if not self.ligne_frais:
                raise ValueError("LigneFrais requis pour frais")
            self.service = None
            self.activity = None
        self.montant_ht = self.quantite * self.prix_unitaire_ht
        super().save(*args, **kwargs)
        self.devis.calculer_montants()
    @property
    def intitule(self):
        if self.type_ligne == 'prestation' and self.activity:
            return self.activity.name
        elif self.type_ligne == 'frais' and self.ligne_frais:
            return self.ligne_frais.description
        return self.description

    def get_type_ligne_display(self):
        if self.type_ligne == 'prestation':
            return 'Prestation'
        elif self.type_ligne == 'frais':
            return 'Frais'
        return 'Autre'
    
    def mark_like_remove(self, commentaire=''):
        """Marquer la ligne comme retirée"""
        self.statut = 'retiree'
        self.commentaire_retrait = commentaire
        self.date_retrait = timezone.now()
        self.devis.calculer_montants()
        self.save()

class LigneDevisIntervenant(models.Model):
    """Modèle pour les intervenants d'une ligne de devis avec temps personnalisé"""
    
    ligne_devis = models.ForeignKey(LigneDevis, on_delete=models.CASCADE, related_name='intervenants')
    profile_intervenant = models.ForeignKey(IntervenantProfile, on_delete=models.CASCADE, related_name='lignes_devis')
    
    # Temps personnalisé pour ce devis
    temps_intervenant = models.DecimalField(max_digits=8, decimal_places=2, validators=[MinValueValidator(Decimal('0'))])

    # Taux horaire pour ce devis
    taux_horaire = models.DecimalField(max_digits=8, decimal_places=2, validators=[MinValueValidator(Decimal('0'))])
    
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
        
class DevisEmail(models.Model):
    """Modèle pour tracker les envois d'emails de devis avec versionnement"""
    
    devis = models.ForeignKey('Devis', on_delete=models.CASCADE, related_name='emails_envoyes')
    version = models.PositiveIntegerField(default=1)
    email_destinataire = models.EmailField()
    sujet = models.CharField(max_length=255)
    message = models.TextField()
    date_envoi = models.DateTimeField(auto_now_add=True)
    statut_envoi = models.CharField(
        max_length=20,
        choices=[
            ('envoye', 'Envoyé'),
            ('erreur', 'Erreur'),
            ('en_cours', 'En cours'),
        ],
        default='en_cours'
    )
    erreur_message = models.TextField(blank=True, null=True)
    
    class Meta:
        verbose_name = 'Email de devis'
        verbose_name_plural = 'Emails de devis'
        ordering = ['-date_envoi']
        unique_together = ['devis', 'version']
    
    def __str__(self):
        return f"Email v{self.version} - Devis {self.devis.numero} - {self.email_destinataire}"
    
    def save(self, *args, **kwargs):
        if not self.version:
            # Déterminer la prochaine version pour ce devis
            derniere_version = DevisEmail.objects.filter(devis=self.devis).aggregate(
                max_version=models.Max('version')
            )['max_version']
            self.version = (derniere_version or 0) + 1
        super().save(*args, **kwargs)