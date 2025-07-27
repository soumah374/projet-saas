import uuid
from django.db import models
from django.utils import timezone
from django.core.validators import MinValueValidator
from users.models import ClientProfile
from devis.models import Devis
from catalog.models import Service, Activity, IntervenantProfile, UniteStandard
from .constant import DEFAULT_TEMPLATE_HTML


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
    
    # Template et contenu personnalisé
    contenu_personnalise = models.TextField(blank=True, verbose_name="Contenu personnalisé du contrat")
    variables_personnalisees = models.JSONField(default=dict, verbose_name="Variables personnalisées")
    
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
        
        # Si c'est un nouveau contrat et qu'il n'y a pas de contenu personnalisé
        if not self.pk and not self.contenu_personnalise:
            # Utiliser le template par défaut et remplacer les variables
            contenu_template = DEFAULT_TEMPLATE_HTML
            variables = self.get_variables_contrat()
            self.contenu_personnalise = self.remplacer_variables(contenu_template, variables)
                        
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
    
    def get_contenu_final(self):
        """Retourne le contenu final du contrat avec les variables remplacées"""
        if self.contenu_personnalise:
            # Utiliser le contenu personnalisé
            contenu = self.contenu_personnalise
        else:
            # Utiliser le template par défaut
            contenu = DEFAULT_TEMPLATE_HTML
        # Remplacer les variables
        variables = self.get_variables_contrat()
        contenu = self.remplacer_variables(contenu, variables)
        
        return contenu
    
    def remplacer_variables(self, contenu, variables):
        """Remplace les variables dans le contenu du contrat"""
        for variable, valeur in variables.items():
            # Remplacer les variables au format [VARIABLE]
            contenu = contenu.replace(f'[{variable}]', str(valeur))
            # Remplacer aussi les variables au format {{variable}} pour compatibilité
            contenu = contenu.replace(f'{{{{{variable}}}}}', str(valeur))
        return contenu
    
    def get_variables_contrat(self):
        """Retourne les variables spécifiques au contrat pour remplacer dans le template"""
        from decimal import Decimal
        
        # Variables de base du contrat
        variables = {
            'NUMERO_DEVIS': self.devis.numero if self.devis else '',
            'DATE_DEVIS': self.devis.date_creation.strftime('%d/%m/%Y') if self.devis else '',
            'NUMERO_CONTRAT': self.numero,
            'DATE_DEBUT_PRESTATION': self.date_debut.strftime('%d/%m/%Y') if self.date_debut else '',
            'DATE_FIN_PRESTATION': self.date_fin.strftime('%d/%m/%Y') if self.date_fin else '',
            'MONTANT_HT': f"{self.montant_ht:,.0f}",
            'MONTANT_TVA': f"{self.montant_tva:,.0f}",
            'MONTANT_TTC': f"{self.montant_ttc:,.0f}",
            'TAUX_TVA': f"{self.taux_tva}",
            'DATE_SIGNATURE': self.date_creation.strftime('%d/%m/%Y'),
            'VILLE_SIGNATURE': 'Conakry',
            'CONDITIONS_SPECIFIQUES': self.conditions,
            'NOTES_ADDITIONNELLES': self.notes,
            'DELAI_RESILIATION': '30',
        }
        
        # Variables du prestataire (SAKOM)
        variables.update({
            'RAISON_SOCIALE_PRESTATAIRE': 'SAKOM SARL',
            'FORME_JURIDIQUE': 'SARL',
            'MONTANT_CAPITAL': '100,000,000',
            'VILLE_RCS': 'Conakry',
            'SIRET': 'GN12345678901234',
            'ADRESSE_PRESTATAIRE': '123 Avenue de la République, Conakry, Guinée',
            'NOM_REPRESENTANT': 'Directeur Général',
            'FONCTION_REPRESENTANT': 'Directeur Général',
        })
        
        # Variables du client
        if self.client:
            variables.update({
                'NOM_CLIENT': self.client.nom_complet,
                'TYPE_CLIENT': 'Société' if self.client.raison_sociale else 'Particulier',
                'ADRESSE_CLIENT': self.client.adresse_complete or '',
                'NUMERO_IDENTIFICATION': self.client.rccm_nif or '',
                'NOM_REPRESENTANT_CLIENT': self.client.nom_complet,
                'FONCTION_REPRESENTANT_CLIENT': 'Représentant',
            })
        
        # Variables du devis
        if self.devis:
            # Calculer la durée estimée
            if self.date_debut and self.date_fin:
                from datetime import date
                delta = self.date_fin - self.date_debut
                jours = delta.days
                if jours <= 30:
                    duree = f"{jours} jours"
                elif jours <= 365:
                    mois = jours // 30
                    duree = f"{mois} mois"
                else:
                    annees = jours // 365
                    duree = f"{annees} an(s)"
            else:
                duree = "À définir"
            
            # Description des prestations basée sur les lignes
            descriptions = []
            for ligne in self.lignes.all():
                if ligne.description:
                    descriptions.append(f"• {ligne.description}")
                else:
                    descriptions.append(f"• {ligne.type_ligne} ({ligne.quantite} {ligne.unite.intitule})")
            
            variables.update({
                'DUREE_ESTIMEE': duree,
                'DESCRIPTION_PRESTATION': '\n'.join(descriptions) if descriptions else "Prestations définies dans le devis",
                'MODALITES_PAIEMENT': '30% à la commande, 70% à la livraison',
            })
        
        return variables
    
    def generer_pdf(self):
        """Génère le PDF du contrat côté backend"""
        # Utiliser ReportLab par défaut pour éviter les problèmes de dépendances GTK
        return self._generer_pdf_fallback()

    def _generer_pdf_fallback(self):
        """Génère le PDF du contrat en utilisant ReportLab comme fallback."""
        from reportlab.lib.pagesizes import A4
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.enums import TA_JUSTIFY
        from reportlab.lib.units import cm
        import io
        
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4,
                                rightMargin=2*cm, leftMargin=2*cm,
                                topMargin=2*cm, bottomMargin=2*cm)
        styles = getSampleStyleSheet()
        
        Story = []
        
        # Récupérer les variables
        variables = self.get_variables_contrat()
        
        # Styles pour le contenu
        styles.add(ParagraphStyle(name='Justify', alignment=TA_JUSTIFY, fontName='Helvetica', fontSize=10, leading=14))
        styles.add(ParagraphStyle(name='CustomHeading3', fontName='Helvetica-Bold', fontSize=14, leading=18, spaceAfter=6))
        styles.add(ParagraphStyle(name='CustomHeading4', fontName='Helvetica-Bold', fontSize=12, leading=16, spaceAfter=4))
        
        # Contenu du contrat (simplifié pour ReportLab)
        # Note: ReportLab ne gère pas le HTML complexe directement comme WeasyPrint.
        # Il faut reconstruire le contenu textuel.
        
        Story.append(Paragraph("<b>CONTRAT DE PRESTATION DE SERVICES</b>", styles['CustomHeading3']))
        Story.append(Spacer(1, 0.5*cm))
        
        Story.append(Paragraph("<b>Entre les soussignés :</b>", styles['CustomHeading4']))
        Story.append(Paragraph(f"<b>{variables.get('RAISON_SOCIALE_PRESTATAIRE', 'SAKOM SARL')}</b>,<br/>"
                               f"Société {variables.get('FORME_JURIDIQUE', 'SARL')} au capital de {variables.get('MONTANT_CAPITAL', '100,000,000')} GNF,<br/>"
                               f"immatriculée au RCS de {variables.get('VILLE_RCS', 'Conakry')} sous le numéro {variables.get('SIRET', 'N/A')},<br/>"
                               f"dont le siège social est situé à {variables.get('ADRESSE_PRESTATAIRE', 'N/A')},<br/>"
                               f"représentée par {variables.get('NOM_REPRESENTANT', 'N/A')}, en sa qualité de {variables.get('FONCTION_REPRESENTANT', 'N/A')},<br/>"
                               "ci-après dénommée \"le Prestataire\",", styles['Justify']))
        Story.append(Spacer(1, 0.5*cm))
        
        Story.append(Paragraph("<b>Et :</b>", styles['Justify']))
        Story.append(Spacer(1, 0.5*cm))
        
        Story.append(Paragraph(f"<b>{variables.get('NOM_CLIENT', 'Client')}</b>,<br/>"
                               f"{variables.get('TYPE_CLIENT', 'N/A')} domicilié(e) à {variables.get('ADRESSE_CLIENT', 'N/A')},<br/>"
                               f"immatriculé(e) sous le numéro {variables.get('NUMERO_IDENTIFICATION', 'N/A')},<br/>"
                               f"représenté(e) par {variables.get('NOM_REPRESENTANT_CLIENT', 'N/A')}, en sa qualité de {variables.get('FONCTION_REPRESENTANT_CLIENT', 'N/A')},<br/>"
                               "ci-après dénommé \"le Client\",", styles['Justify']))
        Story.append(Spacer(1, 0.5*cm))
        
        Story.append(Paragraph("<b>Il a été convenu ce qui suit :</b>", styles['Justify']))
        Story.append(Spacer(1, 0.5*cm))
        
        Story.append(Paragraph("<b>Article 1 – Objet du contrat</b>", styles['CustomHeading4']))
        Story.append(Paragraph(f"Le présent contrat a pour objet la réalisation des prestations définies dans le devis n° {variables.get('NUMERO_DEVIS', 'N/A')} daté du {variables.get('DATE_DEVIS', 'N/A')}, annexé au présent contrat et accepté par le Client.", styles['Justify']))
        Story.append(Spacer(1, 0.5*cm))
        
        Story.append(Paragraph("<b>Article 2 – Durée</b>", styles['CustomHeading4']))
        Story.append(Paragraph(f"Le présent contrat prend effet à compter de sa date de signature pour une durée estimée de {variables.get('DUREE_ESTIMEE', 'À définir')} à compter du début des travaux fixé au {variables.get('DATE_DEBUT_PRESTATION', 'N/A')}.", styles['Justify']))
        Story.append(Spacer(1, 0.5*cm))
        
        Story.append(Paragraph("<b>Article 3 – Description des prestations</b>", styles['CustomHeading4']))
        Story.append(Paragraph(f"Le Prestataire s'engage à réaliser les prestations suivantes :<br/><b>{variables.get('DESCRIPTION_PRESTATION', 'Prestations définies dans le devis')}</b><br/>Conformément au devis annexé.", styles['Justify']))
        Story.append(Spacer(1, 0.5*cm))
        
        Story.append(Paragraph("<b>Article 4 – Modalités d'exécution</b>", styles['CustomHeading4']))
        Story.append(Paragraph("Le Prestataire exécutera les prestations selon les règles de l'art et s'engage à respecter les délais convenus. Le Client s'engage à fournir toutes les informations et moyens nécessaires à la bonne exécution de la mission.", styles['Justify']))
        Story.append(Spacer(1, 0.5*cm))
        
        Story.append(Paragraph("<b>Article 5 – Prix et modalités de paiement</b>", styles['CustomHeading4']))
        Story.append(Paragraph(f"Le montant total de la prestation est fixé à <b>{variables.get('MONTANT_TTC', '0')} GNF TTC</b>, selon le devis accepté.<br/>Modalités de paiement :", styles['Justify']))
        Story.append(Paragraph(f"• {variables.get('MODALITES_PAIEMENT', '30% à la commande, 70% à la livraison')}", styles['Justify']))
        Story.append(Paragraph("• Paiement par virement bancaire aux coordonnées indiquées sur la facture.", styles['Justify']))
        Story.append(Spacer(1, 0.5*cm))
        
        Story.append(Paragraph("<b>Article 6 – Confidentialité</b>", styles['CustomHeading4']))
        Story.append(Paragraph("Les parties s'engagent à garder confidentielles toutes les informations échangées dans le cadre du présent contrat.", styles['Justify']))
        Story.append(Spacer(1, 0.5*cm))
        
        Story.append(Paragraph("<b>Article 7 – Propriété intellectuelle</b>", styles['CustomHeading4']))
        Story.append(Paragraph("Sauf stipulation contraire dans le devis, les livrables réalisés restent la propriété du Prestataire jusqu'au paiement intégral. Une fois le paiement effectué, le Client devient propriétaire des livrables, à l'exception des éléments tiers sous licence.", styles['Justify']))
        Story.append(Spacer(1, 0.5*cm))
        
        Story.append(Paragraph("<b>Article 8 – Résiliation</b>", styles['CustomHeading4']))
        Story.append(Paragraph(f"En cas de manquement grave de l'une des parties à ses obligations contractuelles, le contrat pourra être résilié de plein droit après mise en demeure restée sans effet pendant {variables.get('DELAI_RESILIATION', '30')} jours.", styles['Justify']))
        Story.append(Spacer(1, 0.5*cm))
        
        Story.append(Paragraph("<b>Article 9 – Litiges</b>", styles['CustomHeading4']))
        Story.append(Paragraph("En cas de litige, les parties s'efforceront de trouver une solution amiable. À défaut, le litige sera porté devant le tribunal compétent du ressort du siège social du Prestataire.", styles['Justify']))
        Story.append(Spacer(1, 0.5*cm))
        
        Story.append(Paragraph(f"Fait à {variables.get('VILLE_SIGNATURE', 'Conakry')}, le {variables.get('DATE_SIGNATURE', 'N/A')},<br/>En deux exemplaires originaux.", styles['Justify']))
        Story.append(Spacer(1, 1.5*cm))
        
        # Signatures (simplifié pour ReportLab)
        Story.append(Paragraph("<b>Le Prestataire</b>", styles['CustomHeading4']))
        Story.append(Spacer(1, 1*cm))
        Story.append(Paragraph("(signature)", styles['Justify']))
        Story.append(Spacer(1, 1*cm))
        Story.append(Paragraph("<b>Le Client</b>", styles['CustomHeading4']))
        Story.append(Spacer(1, 1*cm))
        Story.append(Paragraph("(signature)", styles['Justify']))
        
        doc.build(Story)
        buffer.seek(0)
        return buffer.getvalue()


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
            return self.activity.name if self.activity else 'Prestation'
        else:
            return self.ligne_frais.name if self.ligne_frais else 'Frais'


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
        return f"{self.profile_intervenant.name} - {self.ligne_contrat.contrat.numero}"
    
    def save(self, *args, **kwargs):
        # Calculer le montant pour cet intervenant
        self.montant_intervenant = self.temps_intervenant * self.taux_horaire
        super().save(*args, **kwargs)
    
    def recalculer_prix_ligne(self):
        """Recalculer le prix de la ligne de contrat"""
        total_intervenants = sum(interv.montant_intervenant for interv in self.ligne_contrat.intervenants.all())
        self.ligne_contrat.prix_unitaire_ht = total_intervenants
        self.ligne_contrat.save()
