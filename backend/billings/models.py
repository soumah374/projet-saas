import uuid
from django.db import models
from django.utils import timezone
from django.core.validators import MinValueValidator
from decimal import Decimal
from contrats.models import Contrat, EcheancierContrat
from users.models import ClientProfile


class Facture(models.Model):
    """Modèle pour les factures générées à partir des échéances de contrat"""
    
    STATUT_CHOICES = [
        ('brouillon', 'Brouillon'),
        ('emise', 'Émise'),
        ('envoyee', 'Envoyée'),
        ('payee', 'Payée'),
        ('en_retard', 'En retard'),
        ('annulee', 'Annulée'),
        ('partiellement_payee', 'Partiellement payée'),
    ]
    
    # Numéro généré automatiquement
    numero = models.CharField(max_length=50, unique=True, editable=False)
    
    # Relations
    contrat = models.ForeignKey(Contrat, on_delete=models.CASCADE, related_name='factures')
    echeance = models.ForeignKey(EcheancierContrat, on_delete=models.CASCADE, related_name='factures', null=True, blank=True)
    client = models.ForeignKey(ClientProfile, on_delete=models.CASCADE, related_name='factures')
    
    # Informations de la facture
    date_emission = models.DateField(auto_now_add=True)
    date_echeance = models.DateField()
    date_paiement = models.DateField(null=True, blank=True)
    
    # Statut et suivi
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='brouillon')
    
    # Montants
    montant_ht = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    montant_tva = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    montant_frais_agence = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    montant_ttc = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    montant_paye = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    montant_restant = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Configuration TVA et frais (héritée du contrat)
    taux_tva = models.DecimalField(max_digits=5, decimal_places=2, default=18.00)
    appliquer_tva = models.BooleanField(default=True)
    taux_frais_agence = models.DecimalField(max_digits=5, decimal_places=2, default=15.00)
    appliquer_frais_agence = models.BooleanField(default=False)
    
    # Informations de paiement
    mode_paiement = models.CharField(
        max_length=50,
        choices=[
            ('virement', 'Virement bancaire'),
            ('cheque', 'Chèque'),
            ('especes', 'Espèces'),
            ('carte', 'Carte bancaire'),
            ('mobile_money', 'Mobile Money'),
        ],
        default='virement'
    )
    
    # Informations bancaires
    iban = models.CharField(max_length=50, blank=True)
    bic = models.CharField(max_length=20, blank=True)
    compte_bancaire = models.CharField(max_length=50, blank=True)
    
    # Notes et conditions
    notes = models.TextField(blank=True)
    conditions_paiement = models.TextField(blank=True)
    
    # Fichiers
    fichier_pdf = models.FileField(upload_to='factures/pdf/', blank=True, null=True)
    
    # Métadonnées
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Facture'
        verbose_name_plural = 'Factures'
        ordering = ['-date_emission']
    
    def __str__(self):
        return f"Facture {self.numero} - {self.client.nom_complet}"
    
    def save(self, *args, **kwargs):
        if not self.numero:
            self.numero = self.generate_numero()
        
        # Hériter des configurations du contrat
        if self.contrat:
            self.taux_tva = self.contrat.taux_tva
            self.appliquer_tva = self.contrat.appliquer_tva
            self.taux_frais_agence = self.contrat.taux_frais_agence
            self.appliquer_frais_agence = self.contrat.appliquer_frais_agence
        
        # Calculer le montant restant
        self.montant_restant = self.montant_ttc - self.montant_paye
        
        # Mettre à jour le statut selon le paiement
        self.update_statut()
        
        super().save(*args, **kwargs)
    
    def generate_numero(self):
        """Générer un numéro de facture unique"""
        year = timezone.now().year
        last_facture = Facture.objects.filter(
            numero__startswith=f"FAC{year}"
        ).order_by('-numero').first()
        
        if last_facture:
            last_number = int(last_facture.numero[-4:])
            new_number = last_number + 1
        else:
            new_number = 1
            
        return f"FAC{year}{new_number:04d}"
    
    def update_statut(self):
        """Met à jour le statut de la facture selon le paiement"""
        from datetime import date
        
        if self.statut in ['annulee']:
            return
        
        if self.montant_paye >= self.montant_ttc:
            self.statut = 'payee'
        elif self.montant_paye > 0:
            self.statut = 'partiellement_payee'
        elif self.date_echeance < date.today():
            self.statut = 'en_retard'
        elif self.statut == 'brouillon':
            self.statut = 'emise'
    
    @property
    def jours_restants(self):
        """Calcule le nombre de jours restants avant l'échéance"""
        from datetime import date
        today = date.today()
        return (self.date_echeance - today).days
    
    @property
    def est_en_retard(self):
        """Vérifie si la facture est en retard"""
        return self.jours_restants < 0 and self.statut not in ['payee', 'annulee']
    
    @property
    def pourcentage_paye(self):
        """Calcule le pourcentage payé"""
        if self.montant_ttc == 0:
            return 0
        return (self.montant_paye / self.montant_ttc) * 100
    
    def enregistrer_paiement(self, montant, date_paiement=None):
        """Enregistre un paiement partiel ou total"""
        from datetime import date
        
        if date_paiement is None:
            date_paiement = date.today()
        
        self.montant_paye += montant
        if self.montant_paye >= self.montant_ttc:
            self.date_paiement = date_paiement
        
        self.save()
        
        # Créer un enregistrement de paiement
        PaiementFacture.objects.create(
            facture=self,
            montant=montant,
            date_paiement=date_paiement,
            mode_paiement=self.mode_paiement
        )
    
    def generer_pdf(self, save_to_model=False):
        """Génère le PDF de la facture"""
        from django.template.loader import render_to_string
        from weasyprint import HTML, CSS
        from weasyprint.text.fonts import FontConfiguration
        import tempfile
        import os
        
        try:
            # Rendre le template HTML
            html_string = render_to_string('billings/print_billing.html', {
                'facture': self
            })
            
            # Configuration des polices
            font_config = FontConfiguration()
            
            # Créer le PDF avec WeasyPrint
            html_doc = HTML(string=html_string)
            css = CSS(string='''
                @page { size: A4; margin: 2cm; }
                body { font-family: Arial, sans-serif; }
            ''', font_config=font_config)
            
            # Générer le PDF
            pdf = html_doc.write_pdf(stylesheets=[css], font_config=font_config)
            
            # Créer le nom de fichier
            filename = f"facture_{self.numero}.pdf"
            
            if save_to_model:
                # Créer un fichier temporaire
                with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp_file:
                    tmp_file.write(pdf)
                    tmp_file_path = tmp_file.name
                
                # Sauvegarder dans le modèle
                with open(tmp_file_path, 'rb') as f:
                    self.fichier_pdf.save(filename, f, save=True)
                
                # Nettoyer le fichier temporaire
                os.unlink(tmp_file_path)
                
                return {
                    'success': True,
                    'filename': filename,
                    'download_url': self.fichier_pdf.url if self.fichier_pdf else None
                }
            else:
                return {
                    'success': True,
                    'pdf_content': pdf,
                    'filename': filename
                }
                
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }


class PaiementFacture(models.Model):
    """Modèle pour enregistrer les paiements des factures"""
    
    facture = models.ForeignKey(Facture, on_delete=models.CASCADE, related_name='paiements')
    
    # Informations du paiement
    montant = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    date_paiement = models.DateField()
    mode_paiement = models.CharField(
        max_length=50,
        choices=[
            ('virement', 'Virement bancaire'),
            ('cheque', 'Chèque'),
            ('especes', 'Espèces'),
            ('carte', 'Carte bancaire'),
            ('mobile_money', 'Mobile Money'),
        ]
    )
    
    # Informations de référence
    reference_paiement = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)
    
    # Métadonnées
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Paiement de facture'
        verbose_name_plural = 'Paiements de factures'
        ordering = ['-date_paiement']
    
    def __str__(self):
        return f"Paiement {self.montant} - {self.facture.numero}"


class LigneFacture(models.Model):
    """Modèle pour les lignes de facture"""
    
    TYPE_CHOICES = [
        ('prestation', 'Prestation'),
        ('frais', 'Frais'),
        ('acompte', 'Acompte'),
        ('solde', 'Solde'),
    ]
    
    facture = models.ForeignKey(Facture, on_delete=models.CASCADE, related_name='lignes')
    type_ligne = models.CharField(max_length=20, choices=TYPE_CHOICES)
    
    # Informations de la ligne
    description = models.TextField()
    quantite = models.DecimalField(max_digits=10, decimal_places=2, default=1)
    prix_unitaire_ht = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    montant_ht = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Métadonnées
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Ligne de facture'
        verbose_name_plural = 'Lignes de facture'
        ordering = ['created_at']
    
    def __str__(self):
        return f"Ligne {self.description[:50]} - {self.facture.numero}"
    
    def save(self, *args, **kwargs):
        # Calculer le montant HT
        self.montant_ht = self.quantite * self.prix_unitaire_ht
        super().save(*args, **kwargs)


class ConfigurationFacturation(models.Model):
    """Modèle pour la configuration de la facturation automatique"""
    
    # Paramètres généraux
    facturation_automatique = models.BooleanField(default=True, verbose_name="Facturation automatique")
    delai_avant_echeance = models.PositiveIntegerField(default=7, verbose_name="Délai avant échéance (jours)")
    relance_automatique = models.BooleanField(default=True, verbose_name="Relances automatiques")
    
    # Paramètres de numérotation
    prefixe_facture = models.CharField(max_length=10, default="FAC", verbose_name="Préfixe facture")
    format_numero = models.CharField(max_length=50, default="FAC{year}{numero:04d}", verbose_name="Format numéro")
    
    # Paramètres de paiement
    conditions_paiement_defaut = models.TextField(
        default="Paiement à 30 jours",
        verbose_name="Conditions de paiement par défaut"
    )
    
    # Paramètres bancaires
    iban_defaut = models.CharField(max_length=50, blank=True, verbose_name="IBAN par défaut")
    bic_defaut = models.CharField(max_length=20, blank=True, verbose_name="BIC par défaut")
    compte_bancaire_defaut = models.CharField(max_length=50, blank=True, verbose_name="Compte bancaire par défaut")
    
    # Métadonnées
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Configuration de facturation'
        verbose_name_plural = 'Configurations de facturation'
    
    def __str__(self):
        return "Configuration de facturation"
    
    @classmethod
    def get_config(cls):
        """Récupère la configuration active ou en crée une par défaut"""
        config = cls.objects.first()
        if not config:
            config = cls.objects.create()
        return config
