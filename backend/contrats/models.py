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
    
    # Configuration Frais d'Agence (héritée du devis)
    taux_frais_agence = models.DecimalField(max_digits=5, decimal_places=2, default=15.00, validators=[MinValueValidator(0)])
    appliquer_frais_agence = models.BooleanField(default=False, verbose_name="Appliquer les frais d'agence")
    
    # Informations commerciales
    montant_ht = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    montant_tva = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    montant_frais_agence = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    montant_ttc = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Conditions et clauses
    conditions = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    
    # Configuration des échéances de paiement
    echeances_contrat = models.JSONField(default=list, verbose_name="Configuration des échéances de paiement")
    
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
        
        # Si c'est un nouveau contrat, initialiser les montants depuis le devis
        if not self.pk and self.devis:
            self.initialiser_montants_depuis_devis()
        
        # Si c'est un nouveau contrat et qu'il n'y a pas de contenu personnalisé
        if not self.pk and not self.contenu_personnalise:
            # Utiliser le template par défaut et remplacer les variables
            contenu_template = DEFAULT_TEMPLATE_HTML
            variables = self.get_variables_contrat()
            self.contenu_personnalise = self.remplacer_variables(contenu_template, variables)
                        
        super().save(*args, **kwargs)
        
        # Créer les échéances si la configuration est fournie ET que le contrat n'est pas terminé
        if (self.echeances_contrat and isinstance(self.echeances_contrat, list) 
            and self.statut not in ['termine', 'annule']):
            self.creer_echeances_depuis_configuration()
    
    def initialiser_montants_depuis_devis(self):
        """Initialise les montants du contrat à partir du devis"""
        if self.devis:
            self.montant_ht = self.devis.montant_ht
            self.montant_tva = self.devis.montant_tva
            self.montant_frais_agence = self.devis.montant_frais_agence
            self.montant_ttc = self.devis.montant_ttc
            self.taux_tva = self.devis.taux_tva
            self.appliquer_tva = self.devis.appliquer_tva
            self.taux_frais_agence = self.devis.taux_frais_agence
            self.appliquer_frais_agence = self.devis.appliquer_frais_agence
    
    def creer_echeances_depuis_configuration(self):
        """Crée les échéances à partir de la configuration JSON"""
        if not self.echeances_contrat or not isinstance(self.echeances_contrat, list):
            return
        
        # Supprimer les échéances existantes
        self.echeances.all().delete()
        
        # Créer les nouvelles échéances
        for echeance_config in self.echeances_contrat:
            try:
                # Calculer les montants
                pourcentage = float(echeance_config.get('pourcentage', 0))
                montant_ht = (self.montant_ht * pourcentage) / 100
                montant_tva = (self.montant_tva * pourcentage) / 100
                montant_ttc = (self.montant_ttc * pourcentage) / 100
                
                # Créer l'échéance
                EcheancierContrat.objects.create(
                    contrat=self,
                    type_echeance=echeance_config.get('type', 'tranche'),
                    numero_echeance=echeance_config.get('numero', 1),
                    montant_ht=montant_ht,
                    montant_tva=montant_tva,
                    montant_ttc=montant_ttc,
                    pourcentage=pourcentage,
                    date_echeance=echeance_config.get('date_echeance'),
                    commentaire=echeance_config.get('commentaire', '')
                )
            except Exception as e:
                print(f"Erreur lors de la création de l'échéance: {e}")
                continue
    
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
        """Calculer les montants HT, TVA, Frais d'Agence et TTC"""
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
        
        # Calculer les frais d'agence selon la configuration
        if self.appliquer_frais_agence:
            taux_frais = self.taux_frais_agence / 100
            if isinstance(taux_frais, float):
                taux_frais = Decimal(str(taux_frais))
            self.montant_frais_agence = self.montant_ht * taux_frais
        else:
            self.montant_frais_agence = Decimal('0')
        
        self.montant_ttc = self.montant_ht + self.montant_tva + self.montant_frais_agence
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
        from datetime import date, datetime
        
        # Fonction helper pour formater les dates
        def format_date(date_obj):
            if isinstance(date_obj, str):
                try:
                    # Essayer de parser la chaîne en date
                    if 'T' in date_obj:  # Format ISO avec timezone
                        date_obj = datetime.fromisoformat(date_obj.replace('Z', '+00:00'))
                    else:  # Format YYYY-MM-DD
                        date_obj = datetime.strptime(date_obj, '%Y-%m-%d')
                except ValueError:
                    return date_obj  # Retourner la chaîne si pas possible de parser
            if hasattr(date_obj, 'strftime'):
                return date_obj.strftime('%d/%m/%Y')
            return str(date_obj)
        
        # Variables de base du contrat
        variables = {
            'NUMERO_DEVIS': self.devis.numero if self.devis else '',
            'DATE_DEVIS': format_date(self.devis.date_creation) if self.devis and self.devis.date_creation else '',
            'NUMERO_CONTRAT': self.numero,
            'DATE_DEBUT_PRESTATION': format_date(self.date_debut) if self.date_debut else '',
            'DATE_FIN_PRESTATION': format_date(self.date_fin) if self.date_fin else '',
            'MONTANT_HT': f"{self.montant_ht:,.0f}",
            'MONTANT_TVA': f"{self.montant_tva:,.0f}",
            'MONTANT_FRAIS_AGENCE': f"{self.montant_frais_agence:,.0f}",
            'MONTANT_TTC': f"{self.montant_ttc:,.0f}",
            'TAUX_TVA': f"{self.taux_tva}",
            'TAUX_FRAIS_AGENCE': f"{self.taux_frais_agence}",
            'DATE_SIGNATURE': format_date(self.date_creation) if self.date_creation else '',
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
            # Déterminer le type de client
            if self.client.type_client == 'personne_morale':
                type_client = 'Société'
                numero_identification = self.client.rccm_nif or ''
            else:
                type_client = 'Particulier'
                numero_identification = ''
            
            variables.update({
                'NOM_CLIENT': self.client.nom_complet,
                'TYPE_CLIENT': type_client,
                'ADRESSE_CLIENT': self.client.adresse_complete or '',
                'NUMERO_IDENTIFICATION': numero_identification,
                'NOM_REPRESENTANT_CLIENT': self.client.nom_complet,
                'FONCTION_REPRESENTANT_CLIENT': 'Représentant',
            })
        
        # Variables du devis
        if self.devis:
            # Calculer la durée estimée
            if self.date_debut and self.date_fin:
                # Convertir les dates en objets date si nécessaire
                date_debut = self.date_debut
                date_fin = self.date_fin
                
                if isinstance(date_debut, str):
                    try:
                        date_debut = datetime.strptime(date_debut, '%Y-%m-%d').date()
                    except ValueError:
                        date_debut = None
                
                if isinstance(date_fin, str):
                    try:
                        date_fin = datetime.strptime(date_fin, '%Y-%m-%d').date()
                    except ValueError:
                        date_fin = None
                
                if date_debut and date_fin:
                    delta = date_fin - date_debut
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
            else:
                duree = "À définir"
            
            # Description des prestations basée sur les lignes (seulement si le contrat a une clé primaire)
            descriptions = []
            if self.pk:  # Seulement si le contrat est déjà sauvegardé
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
        from reportlab.platypus import SimpleDocTemplate, Spacer
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.enums import TA_JUSTIFY
        from reportlab.lib.units import cm
        import io
        import re
        
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
        
        # Utiliser le contenu personnalisé du contrat
        contenu_html = self.contenu_personnalise
        if not contenu_html:
            # Fallback si pas de contenu personnalisé
            contenu_html = self.get_contenu_final()
        
        # Remplacer les variables dans le contenu
        contenu_html = self.remplacer_variables(contenu_html, variables)
        
        # Convertir le HTML en contenu ReportLab
        # Diviser le contenu en paragraphes basés sur les balises HTML
        paragraphs = self._convert_html_to_reportlab(contenu_html, styles)
        
        # Ajouter tous les paragraphes à l'histoire
        for paragraph in paragraphs:
            Story.append(paragraph)
            Story.append(Spacer(1, 0.2*cm))
        
        doc.build(Story)
        buffer.seek(0)
        return buffer.getvalue()
    
    def _convert_html_to_reportlab(self, html_content, styles):
        """Convertit le contenu HTML en paragraphes ReportLab"""
        from reportlab.platypus import Paragraph
        
        paragraphs = []
        
        # Nettoyer le HTML et le diviser en sections
        # Supprimer les balises HTML complexes et garder le texte
        import re
        
        # Remplacer les balises HTML par du texte formaté pour ReportLab
        content = html_content
        
        # Convertir les balises de titre
        content = re.sub(r'<h[1-6][^>]*>(.*?)</h[1-6]>', r'<b>\1</b>', content, flags=re.IGNORECASE | re.DOTALL)
        
        # Convertir les balises de paragraphe
        content = re.sub(r'<p[^>]*>(.*?)</p>', r'\1', content, flags=re.IGNORECASE | re.DOTALL)
        
        # Convertir les balises de division
        content = re.sub(r'<div[^>]*>(.*?)</div>', r'\1', content, flags=re.IGNORECASE | re.DOTALL)
        
        # Convertir les sauts de ligne
        content = re.sub(r'<br[^>]*>', r'<br/>', content, flags=re.IGNORECASE)
        
        # Diviser le contenu en lignes
        lines = content.split('\n')
        
        for line in lines:
            line = line.strip()
            if line:
                # Déterminer le style selon le contenu
                if line.startswith('<b>') and line.endswith('</b>'):
                    # Titre principal
                    paragraphs.append(Paragraph(line, styles['CustomHeading3']))
                elif '<b>' in line and '</b>' in line:
                    # Sous-titre
                    paragraphs.append(Paragraph(line, styles['CustomHeading4']))
                else:
                    # Texte normal
                    paragraphs.append(Paragraph(line, styles['Justify']))
        
        return paragraphs

    def update_contenu_from_articles(self):
        """Met à jour le contenu du contrat basé sur les articles modifiés"""
        if not self.contenu_personnalise:
            # Si pas de contenu personnalisé, utiliser le template par défaut
            contenu_template = DEFAULT_TEMPLATE_HTML
            variables = self.get_variables_contrat()
            self.contenu_personnalise = self.remplacer_variables(contenu_template, variables)
        else:
            # Si contenu personnalisé existe, mettre à jour seulement les variables
            variables = self.get_variables_contrat()
            self.contenu_personnalise = self.remplacer_variables(self.contenu_personnalise, variables)
        
        self.save(update_fields=['contenu_personnalise'])
    
    def get_articles_content(self):
        """Récupère le contenu des articles du contrat pour inclusion dans le PDF"""
        articles_content = []
        
        for ligne in self.lignes.all():
            if ligne.description:
                articles_content.append(f"• {ligne.description}")
            else:
                articles_content.append(f"• {ligne.type_ligne}: {ligne.quantite} {ligne.unite.intitule}")
        
        return "\n".join(articles_content) if articles_content else "Prestations définies dans le devis"


class EcheancierContrat(models.Model):
    """Modèle pour les échéances de paiement des contrats"""
    
    TYPE_ECHEANCE_CHOICES = [
        ('acompte', 'Acompte'),
        ('tranche', 'Tranche de paiement'),
        ('solde', 'Solde'),
        ('retention', 'Retenue de garantie'),
    ]
    
    STATUT_CHOICES = [
        ('en_attente', 'En attente'),
        ('paye', 'Payé'),
        ('en_retard', 'En retard'),
        ('annule', 'Annulé'),
    ]
    
    contrat = models.ForeignKey(Contrat, on_delete=models.CASCADE, related_name='echeances')
    type_echeance = models.CharField(max_length=20, choices=TYPE_ECHEANCE_CHOICES)
    numero_echeance = models.PositiveIntegerField(help_text="Numéro de l'échéance (1, 2, 3, etc.)")
    
    # Informations de paiement
    montant_ht = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    montant_tva = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    montant_ttc = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    pourcentage = models.DecimalField(max_digits=5, decimal_places=2, validators=[MinValueValidator(0)], help_text="Pourcentage du montant total")
    
    # Dates
    date_echeance = models.DateField()
    date_paiement = models.DateField(null=True, blank=True)
    
    # Statut et suivi
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='en_attente')
    commentaire = models.TextField(blank=True)
    
    # Alertes
    alerte_envoyee = models.BooleanField(default=False, help_text="Alerte envoyée 3 jours avant l'échéance")
    
    # Métadonnées
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Échéance de contrat'
        verbose_name_plural = 'Échéances de contrat'
        ordering = ['contrat', 'numero_echeance']
        unique_together = ['contrat', 'numero_echeance']
    
    def __str__(self):
        return f"Échéance {self.numero_echeance} - {self.contrat.numero} - {self.get_type_echeance_display()}"
    
    def save(self, *args, **kwargs):
        # Calculer automatiquement les montants si pas définis
        if not self.montant_ttc and self.contrat:
            self.montant_ttc = (self.contrat.montant_ttc * self.pourcentage) / 100
            self.montant_ht = (self.contrat.montant_ht * self.pourcentage) / 100
            self.montant_tva = (self.contrat.montant_tva * self.pourcentage) / 100
        
        super().save(*args, **kwargs)
    
    @property
    def jours_restants(self):
        """Calcule le nombre de jours restants avant l'échéance"""
        from datetime import date
        today = date.today()
        return (self.date_echeance - today).days
    
    @property
    def est_en_retard(self):
        """Vérifie si l'échéance est en retard"""
        return self.jours_restants < 0 and self.statut == 'en_attente'
    
    @property
    def doit_alerter(self):
        """Vérifie si une alerte doit être envoyée (3 jours avant)"""
        return self.jours_restants <= 3 and self.jours_restants >= 0 and not self.alerte_envoyee and self.statut == 'en_attente'
    
    def marquer_comme_paye(self, date_paiement=None):
        """Marque l'échéance comme payée"""
        from datetime import date
        self.statut = 'paye'
        self.date_paiement = date_paiement or date.today()
        self.save()
    
    def envoyer_alerte(self):
        """Envoie une alerte pour cette échéance"""
        # Cette méthode sera implémentée avec le système de notifications
        self.alerte_envoyee = True
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
        
        # Sauvegarder la ligne
        super().save(*args, **kwargs)
        
        # Mettre à jour les montants du contrat
        if self.contrat:
            self.contrat.calculer_montants()
            self.contrat.update_contenu_from_articles()
    
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
