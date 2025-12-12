import uuid
from django.db import models
from django.utils import timezone
from django.core.validators import MinValueValidator
from users.models import ClientProfile
from devis.models import Devis
from catalog.models import Service, Activity, IntervenantProfile, UniteStandard
from .constant import DEFAULT_TEMPLATE_HTML, DEFAULT_TEMPLATE_AVENANT_HTML


class Contrat(models.Model):
    """Modèle pour les contrats basés sur des devis acceptés"""
    
    STATUT_CHOICES = [
        ('brouillon', 'Brouillon'),
        ('actif', 'Actif'),
        ('termine', 'Terminé'),
        ('annule', 'Annulé'),
        ('suspendu', 'Suspendu'),
        ('archive', 'Archivé'),
        ('envoye', 'Envoyé'),
        ('signe', 'Signé'),
        ('cloture', 'Cloturé'),
    ]
    
    # Numéro généré automatiquement
    numero = models.CharField(max_length=50, unique=True, editable=False)
    
    # Relation avec les devis acceptés
    devis = models.ManyToManyField(Devis, related_name='contrats', blank=True, verbose_name="Devis associés", null=True)
    
    # Devis principal (pour compatibilité)
    devis_principal = models.ForeignKey(Devis, on_delete=models.SET_NULL, null=True, blank=True, related_name='contrat_principal', verbose_name="Devis principal")
    
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
    
    #fichier contrat signe
    fichier_signe = models.FileField(upload_to='contrats/signes/', blank=True, null=True)
    
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
            
        super().save(*args, **kwargs)
        
        # Si c'est un nouveau contrat et qu'il n'y a pas de contenu personnalisé
        if not self.pk and not self.contenu_personnalise:
            # Utiliser le template par défaut et remplacer les variables
            contenu_template = DEFAULT_TEMPLATE_HTML
            variables = self.get_variables_contrat()
            self.contenu_personnalise = self.remplacer_variables(contenu_template, variables)
                        
        super().save(*args, **kwargs)
        
        # Créer les échéances si la configuration est fournie ET que le contrat n'est pas terminé
        if (self.echeances_contrat and isinstance(self.echeances_contrat, list) 
            and self.statut not in ['termine', 'annule','actif','suspendu','archive','envoye','signe','cloture']):
            self.creer_echeances_depuis_configuration()
    
    def initialiser_montants_depuis_devis(self):
        """Initialise les montants du contrat à partir des devis"""
        if self.devis.exists():
            # Calculer les montants totaux de tous les devis
            total_ht = sum(devis.montant_ht for devis in self.devis.all())
            total_tva = sum(devis.montant_tva for devis in self.devis.all())
            total_frais_agence = sum(devis.montant_frais_agence for devis in self.devis.all())
            total_ttc = sum(devis.montant_ttc for devis in self.devis.all())
            
            self.montant_ht = total_ht
            self.montant_tva = total_tva
            self.montant_frais_agence = total_frais_agence
            self.montant_ttc = total_ttc
            
            # Utiliser les paramètres du premier devis pour la configuration
            premier_devis = self.devis.first()
            if premier_devis:
                self.taux_tva = premier_devis.taux_tva
                self.appliquer_tva = premier_devis.appliquer_tva
                self.taux_frais_agence = premier_devis.taux_frais_agence
                self.appliquer_frais_agence = premier_devis.appliquer_frais_agence
        elif self.devis_principal:
            # Fallback pour compatibilité avec l'ancien système
            self.montant_ht = self.devis_principal.montant_ht
            self.montant_tva = self.devis_principal.montant_tva
            self.montant_frais_agence = self.devis_principal.montant_frais_agence
            self.montant_ttc = self.devis_principal.montant_ttc
            self.taux_tva = self.devis_principal.taux_tva
            self.appliquer_tva = self.devis_principal.appliquer_tva
            self.taux_frais_agence = self.devis_principal.taux_frais_agence
            self.appliquer_frais_agence = self.devis_principal.appliquer_frais_agence
    
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
            'NUMERO_DEVIS': self.devis_principal.numero if self.devis else '',
            'DATE_DEVIS': format_date(self.devis_principal.date_creation) if self.devis and self.devis_principal.date_creation else '',
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
                        duree = f"{annees} ans"
                else:
                    duree = "À définir"
            else:
                duree = "À définir"
            
            variables.update({
                'DUREE_ESTIMEE': duree,
                'DESCRIPTION_PRESTATION': 'Prestation de services',
            })
        
        # Variables des échéances de paiement
        if self.echeances_contrat and isinstance(self.echeances_contrat, list):
            echeances_html = []
            for i, echeance in enumerate(self.echeances_contrat, 1):
                pourcentage = echeance.get('pourcentage', 0)
                montant_echeance = (self.montant_ttc * pourcentage) / 100
                date_echeance = format_date(echeance.get('date_echeance', ''))
                type_echeance = echeance.get('type', 'tranche')
                commentaire = echeance.get('commentaire', '')
                
                echeance_html = f"""
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">{i}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">{type_echeance.title()}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">{pourcentage}%</td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">{montant_echeance:,.0f} GNF</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">{date_echeance}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">{commentaire}</td>
                </tr>
                """
                echeances_html.append(echeance_html)
            
            variables.update({
                'ECHEANCIER_PAIEMENT': ''.join(echeances_html),
                'NOMBRE_ECHEANCES': len(self.echeances_contrat),
                'MONTANT_ACOMPTE': self.get_montant_acompte(),
                'MONTANT_SOLDE': self.get_montant_solde(),
                'MODALITES_PAIEMENT': self.get_modalites_paiement(),
            })
        else:
            # Échéancier par défaut si aucune échéance n'est définie
            variables.update({
                'ECHEANCIER_PAIEMENT': '',
                'NOMBRE_ECHEANCES': '0',
                'MONTANT_ACOMPTE': '0',
                'MONTANT_SOLDE': '0',
                'MODALITES_PAIEMENT': 'Paiement à 100% à la signature du contrat',
            })
        
        return variables
    
    def get_montant_acompte(self):
        """Calcule le montant total des acomptes"""
        if not self.echeances_contrat or not isinstance(self.echeances_contrat, list):
            return 0
        
        montant_acompte = 0
        for echeance in self.echeances_contrat:
            if echeance.get('type') == 'acompte':
                pourcentage = echeance.get('pourcentage', 0)
                montant_acompte += (self.montant_ttc * pourcentage) / 100
        
        return f"{montant_acompte:,.0f}"
    
    def get_montant_solde(self):
        """Calcule le montant total des soldes"""
        if not self.echeances_contrat or not isinstance(self.echeances_contrat, list):
            return 0
        
        montant_solde = 0
        for echeance in self.echeances_contrat:
            if echeance.get('type') == 'solde':
                pourcentage = echeance.get('pourcentage', 0)
                montant_solde += (self.montant_ttc * pourcentage) / 100
        
        return f"{montant_solde:,.0f}"
    
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
                articles_content.append(f"{ligne.description}")
            else:
                articles_content.append(f"{ligne.type_ligne}: {ligne.quantite} {ligne.unite.intitule}")
        
        return "\n".join(articles_content) if articles_content else "Prestations définies dans le devis"

    def get_modalites_paiement(self):
        """Retourne les modalités de paiement du contrat"""
        if self.echeances_contrat and isinstance(self.echeances_contrat, list):
            modalites = []
            
            for echeance in self.echeances_contrat:
                type_echeance = echeance.get('type', 'tranche')
                pourcentage = echeance.get('pourcentage', 0)
                date_echeance = echeance.get('date_echeance', '')
                commentaire = echeance.get('commentaire', '')
                
                # Formater la date en français si elle existe
                date_formatee = ''
                if date_echeance:
                    try:
                        from datetime import datetime
                        date_obj = datetime.strptime(str(date_echeance), '%Y-%m-%d')
                        date_formatee = date_obj.strftime('%d/%m/%Y')
                    except:
                        date_formatee = str(date_echeance)
                
                if type_echeance == 'acompte':
                    modalite = f"Acompte de {pourcentage}% à la signature du contrat"
                elif type_echeance == 'tranche':
                    modalite = f"Tranche de {pourcentage}%"
                    if date_formatee:
                        modalite += f" le {date_formatee}"
                elif type_echeance == 'solde':
                    modalite = f"Solde de {pourcentage}%"
                    if date_formatee:
                        modalite += f" le {date_formatee}"
                elif type_echeance == 'retention':
                    modalite = f"Retenue de garantie de {pourcentage}%"
                    if date_formatee:
                        modalite += f" le {date_formatee}"
                
                if commentaire:
                    modalite += f" ({commentaire})"
                
                modalites.append(f"<li>{modalite}</li>")
            
            if modalites:
                return f"<ul>{''.join(modalites)}</ul>"
            else:
                return "<ul><li>Paiement à 100% à la signature du contrat</li></ul>"
        else:
            return "<ul><li>Paiement à 100% à la signature du contrat</li></ul>"


class EcheancierContrat(models.Model):
    """Modèle pour l'échéancier de contrat - Un contrat peut avoir plusieurs échéanciers"""

    TYPE_CHOICES = [
        ('initial', 'Échéancier initial'),
        ('extension', 'Extension de contrat'),
        ('avenant', 'Suite à avenant'),
        ('modification', 'Modification'),
    ]

    contrat = models.ForeignKey(Contrat, on_delete=models.CASCADE, related_name='echeanciers')
    type_echeancier = models.CharField(max_length=20, choices=TYPE_CHOICES, default='initial')
    date_creation = models.DateTimeField(auto_now_add=True)

    # Métadonnées minimales
    description = models.TextField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = 'contrats_echeancier'  # Nouveau nom de table pour éviter conflit avec l'ancien
        verbose_name = 'Échéancier de contrat'
        verbose_name_plural = 'Échéanciers de contrat'
        ordering = ['contrat', '-date_creation']

    def __str__(self):
        return f"Échéancier {self.get_type_echeancier_display()} - {self.contrat.numero} - {self.date_creation.strftime('%d/%m/%Y')}"

    @property
    def montant_total(self):
        """Calcule le montant total à partir des lignes"""
        return sum(ligne.montant_ttc for ligne in self.lignes.all())

    @property
    def nombre_lignes(self):
        """Retourne le nombre de lignes"""
        return self.lignes.count()

class LigneEcheancierContrat(models.Model):
    """Modèle pour les lignes individuelles d'un échéancier de contrat"""

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

    # Relation avec l'échéancier parent
    echeancier = models.ForeignKey(EcheancierContrat, on_delete=models.CASCADE, related_name='lignes')

    # Informations de l'échéance
    numero_echeance = models.PositiveIntegerField(help_text="Numéro de l'échéance (1, 2, 3, etc.)")
    type_echeance = models.CharField(max_length=20, choices=TYPE_ECHEANCE_CHOICES, default='tranche')

    # Montants
    montant_ht = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    montant_tva = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    montant_ttc = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    pourcentage = models.DecimalField(max_digits=5, decimal_places=2, validators=[MinValueValidator(0)],
                                     default=0, help_text="Pourcentage du montant total du contrat")

    # Dates
    date_echeance = models.DateField()
    date_paiement = models.DateField(null=True, blank=True)

    # Statut et suivi
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='en_attente')
    commentaire = models.TextField(blank=True)

    # Alertes
    alerte_envoyee = models.BooleanField(default=False, help_text="Alerte envoyée 3 jours avant l'échéance")

    # Métadonnées
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Ligne d\'échéancier de contrat'
        verbose_name_plural = 'Lignes d\'échéancier de contrat'
        ordering = ['echeancier', 'numero_echeance']
        unique_together = ['echeancier', 'numero_echeance']

    def __str__(self):
        return f"Échéance {self.numero_echeance} - Échéancier v{self.echeancier.version} - {self.echeancier.contrat.numero}"

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
        self.alerte_envoyee = True
        self.save()

    @property
    def factures(self):
        """Retourne les factures liées à cette échéance"""
        from billings.models import Facture
        # Note: Il faudra adapter le modèle Facture pour pointer vers LigneEcheancierContrat
        return Facture.objects.filter(ligne_echeance=self)

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


class Avenant(models.Model):
    """Modèle pour les avenants de contrats"""
    
    STATUT_CHOICES = [
        ('brouillon', 'Brouillon'),
        ('envoye', 'Envoyé'),
        ('signe', 'Signé'),
        ('annule', 'Annulé'),
    ]
    
    # Numéro généré automatiquement
    numero = models.CharField(max_length=50, unique=True, editable=False)
    
    # Relation avec le contrat principal
    contrat = models.ForeignKey(Contrat, on_delete=models.CASCADE, related_name='avenants')
    
    # Informations de l'avenant
    date_creation = models.DateTimeField(auto_now_add=True)
    date_signature = models.DateField(null=True, blank=True)
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='brouillon')
    
    # Contenu de l'avenant
    intitule_avenant = models.CharField(max_length=200, verbose_name="Intitulé de l'avenant")
    objet_avenant = models.TextField(verbose_name="Objet de l'avenant")
    type_modification = models.CharField(
        max_length=50, 
        choices=[
            ('modifier', 'Modifier'),
            ('completer', 'Compléter'),
            ('preciser', 'Préciser'),
            ('prolonger', 'Prolonger'),
            ('reduire', 'Réduire'),
            ('annuler', 'Annuler'),
        ],
        default='modifier'
    )
    
    # Modifications spécifiques
    modifications = models.JSONField(
        default=list,
        verbose_name="Liste des modifications",
        help_text="Liste des clauses modifiées avec ancienne et nouvelle version"
    )
    
    # Contenu personnalisé
    contenu_personnalise = models.TextField(blank=True, verbose_name="Contenu personnalisé de l'avenant")
    variables_personnalisees = models.JSONField(default=dict, verbose_name="Variables personnalisées")
    
    # Fichier signé
    fichier_signe = models.FileField(upload_to='avenants/signes/', blank=True, null=True)
    
    # Métadonnées
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Avenant'
        verbose_name_plural = 'Avenants'
        ordering = ['-date_creation']
    
    def __str__(self):
        return f"Avenant {self.numero} - {self.contrat.numero}"
    
    def save(self, *args, **kwargs):
        if not self.numero:
            # Générer un numéro unique
            self.numero = self.generate_numero()
        
        # Si c'est un nouvel avenant et qu'il n'y a pas de contenu personnalisé
        if not self.pk and not self.contenu_personnalise:
            # Utiliser le template par défaut et remplacer les variables
            contenu_template = DEFAULT_TEMPLATE_AVENANT_HTML
            variables = self.get_variables_avenant()
            self.contenu_personnalise = self.remplacer_variables(contenu_template, variables)
        
        super().save(*args, **kwargs)
    
    def generate_numero(self):
        """Générer un numéro d'avenant unique"""
        year = timezone.now().year
        # Trouver le plus grand numéro existant pour cette année
        last_avenant = Avenant.objects.filter(
            numero__startswith=f"AV{year}"
        ).order_by('-numero').first()
        
        if last_avenant:
            # Extraire le numéro et incrémenter
            last_number = int(last_avenant.numero[-4:])
            new_number = last_number + 1
        else:
            new_number = 1
            
        return f"AV{year}{new_number:04d}"
    
    def get_variables_avenant(self):
        """Récupérer les variables pour l'avenant"""
        def format_date(date_obj):
            if date_obj:
                return date_obj.strftime('%d/%m/%Y')
            return str(date_obj)
        
        # Variables de base de l'avenant
        variables = {
            'NUMERO_AVENANT': self.numero,
            'INTITULE_CONTRAT': self.intitule_avenant,
            'DATE_CONTRAT_INITIAL': format_date(self.contrat.date_creation),
            'OBJET_CONTRAT': self.objet_avenant,
            'TYPE_MODIFICATION': self.get_type_modification_display(),
            'DATE_SIGNATURE': format_date(self.date_signature),
            'VILLE_SIGNATURE': 'Conakry',
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
        if self.contrat.client:
            client = self.contrat.client
            variables.update({
                'NOM_CLIENT': client.nom_complet,
                'TYPE_CLIENT': client.get_type_client_display() if hasattr(client, 'get_type_client_display') else 'Société',
                'ADRESSE_CLIENT': client.adresse_complete or client.adresse or 'Non renseignée',
                'NUMERO_IDENTIFICATION': client.rccm_nif or 'Non renseigné',
                'NOM_REPRESENTANT_CLIENT': client.contact or 'Non renseigné',
                'FONCTION_REPRESENTANT_CLIENT': 'Représentant légal',
            })
        
        # Variables des modifications
        if self.modifications:
            for i, modification in enumerate(self.modifications):
                variables[f'CLAUSE_MODIFIEE_{i+1}'] = modification.get('clause', '')
                variables[f'ANCIENNE_VERSION_{i+1}'] = modification.get('ancienne_version', '')
                variables[f'NOUVELLE_VERSION_{i+1}'] = modification.get('nouvelle_version', '')
        
        return variables
    
    def remplacer_variables(self, contenu, variables):
        """Remplacer les variables dans le contenu"""
        for key, value in variables.items():
            contenu = contenu.replace(f'[{key}]', str(value))
        return contenu
    
    def get_contenu_final(self):
        """Retourne le contenu final de l'avenant avec les variables remplacées"""
        if self.contenu_personnalise:
            variables = self.get_variables_avenant()
            return self.remplacer_variables(self.contenu_personnalise, variables)
        return self.contenu_personnalise


class ContratHistoriqueMontant(models.Model):
    """Modèle pour l'historique des modifications de montants du contrat"""

    TYPE_MODIFICATION_CHOICES = [
        ('ajout_devis', 'Ajout de devis'),
        ('suppression_devis', 'Suppression de devis'),
        ('modification_ligne', 'Modification de ligne'),
        ('avenant', 'Avenant'),
        ('recalcul', 'Recalcul'),
    ]

    # Relation avec le contrat
    contrat = models.ForeignKey(Contrat, on_delete=models.CASCADE, related_name='historique_montants')

    # Date de la modification
    date_modification = models.DateTimeField(auto_now_add=True)

    # Type de modification
    type_modification = models.CharField(max_length=50, choices=TYPE_MODIFICATION_CHOICES)

    # Montants avant modification
    montant_ht_avant = models.DecimalField(max_digits=12, decimal_places=2, verbose_name="Montant HT avant")
    montant_tva_avant = models.DecimalField(max_digits=12, decimal_places=2, verbose_name="Montant TVA avant")
    montant_ttc_avant = models.DecimalField(max_digits=12, decimal_places=2, verbose_name="Montant TTC avant")

    # Montants après modification
    montant_ht_apres = models.DecimalField(max_digits=12, decimal_places=2, verbose_name="Montant HT après")
    montant_tva_apres = models.DecimalField(max_digits=12, decimal_places=2, verbose_name="Montant TVA après")
    montant_ttc_apres = models.DecimalField(max_digits=12, decimal_places=2, verbose_name="Montant TTC après")

    # Détails de la modification
    description = models.TextField(blank=True, verbose_name="Description de la modification")
    metadata = models.JSONField(default=dict, verbose_name="Métadonnées supplémentaires")

    # Utilisateur ayant effectué la modification (optionnel)
    # user = models.ForeignKey('auth.User', on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        verbose_name = 'Historique de montant de contrat'
        verbose_name_plural = 'Historiques de montants de contrats'
        ordering = ['-date_modification']

    def __str__(self):
        return f"Historique {self.contrat.numero} - {self.get_type_modification_display()} - {self.date_modification.strftime('%d/%m/%Y %H:%M')}"

    @property
    def variation_ht(self):
        """Calcule la variation du montant HT"""
        return self.montant_ht_apres - self.montant_ht_avant

    @property
    def variation_ttc(self):
        """Calcule la variation du montant TTC"""
        return self.montant_ttc_apres - self.montant_ttc_avant

    @property
    def variation_pourcentage(self):
        """Calcule la variation en pourcentage"""
        if self.montant_ttc_avant > 0:
            return ((self.montant_ttc_apres - self.montant_ttc_avant) / self.montant_ttc_avant) * 100
        return 0