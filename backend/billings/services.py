from datetime import date, timedelta
from django.db import transaction
from django.utils import timezone
from .models import Facture, LigneFacture, ConfigurationFacturation
from contrats.models import EcheancierContrat
from django.db.models import Sum
from email_templates.services import EmailTemplateService


class FacturationService:
    """Service pour la facturation automatique basée sur les échéanciers"""
    
    @staticmethod
    def generer_factures_automatiques():
        """Génère automatiquement les factures pour les échéances à venir"""
        config = ConfigurationFacturation.get_config()
        
        if not config.facturation_automatique:
            return {
                'success': False,
                'message': 'Facturation automatique désactivée'
            }
        
        # Date limite pour la génération (délai configuré avant échéance)
        date_limite = date.today() + timedelta(days=config.delai_avant_echeance)
        
        # Récupérer les échéances éligibles
        echeances_eligibles = EcheancierContrat.objects.filter(
            date_echeance__lte=date_limite,
            statut='en_attente',
            factures__isnull=True  # Pas de facture existante
        ).select_related('contrat', 'contrat__client')
        
        factures_crees = []
        
        with transaction.atomic():
            for echeance in echeances_eligibles:
                try:
                    facture = FacturationService._creer_facture_pour_echeance(echeance, config)
                    factures_crees.append(facture)
                except Exception as e:
                    print(f"Erreur lors de la création de la facture pour l'échéance {echeance.id}: {e}")
                    continue
        
        return {
            'success': True,
            'message': f'{len(factures_crees)} factures créées automatiquement',
            'factures_crees': factures_crees
        }
    
    @staticmethod
    def _creer_facture_pour_echeance(echeance, config):
        """Crée une facture pour une échéance spécifique"""
        # Créer la facture
        facture_data = {
            'contrat': echeance.contrat,
            'echeance': echeance,
            'client': echeance.contrat.client,
            'date_echeance': echeance.date_echeance,
            'montant_ht': echeance.montant_ht,
            'montant_tva': echeance.montant_tva,
            'montant_ttc': echeance.montant_ttc,
            'mode_paiement': 'virement',
            'conditions_paiement': config.conditions_paiement_defaut,
        }
        
        # Ajouter les informations bancaires par défaut
        if config.iban_defaut:
            facture_data['iban'] = config.iban_defaut
        if config.bic_defaut:
            facture_data['bic'] = config.bic_defaut
        if config.compte_bancaire_defaut:
            facture_data['compte_bancaire'] = config.compte_bancaire_defaut
        
        facture = Facture.objects.create(**facture_data)
        
        # Créer une ligne de facture
        LigneFacture.objects.create(
            facture=facture,
            type_ligne='prestation',
            description=f"Échéance {echeance.numero_echeance} - {echeance.get_type_echeance_display()}",
            quantite=1,
            prix_unitaire_ht=echeance.montant_ht,
            montant_ht=echeance.montant_ht
        )
        
        return facture
    
    @staticmethod
    def generer_factures_contrat(contrat_id):
        """Génère toutes les factures pour un contrat spécifique"""
        from contrats.models import Contrat
        
        try:
            contrat = Contrat.objects.get(id=contrat_id)
        except Contrat.DoesNotExist:
            return {
                'success': False,
                'message': 'Contrat non trouvé'
            }
        
        # Récupérer les échéances sans facture
        echeances_sans_facture = contrat.echeances.filter(
            factures__isnull=True
        ).select_related('contrat', 'contrat__client')
        
        config = ConfigurationFacturation.get_config()
        factures_crees = []
        
        with transaction.atomic():
            for echeance in echeances_sans_facture:
                try:
                    facture = FacturationService._creer_facture_pour_echeance(echeance, config)
                    factures_crees.append(facture)
                except Exception as e:
                    print(f"Erreur lors de la création de la facture pour l'échéance {echeance.id}: {e}")
                    continue
        
        return {
            'success': True,
            'message': f'{len(factures_crees)} factures créées pour le contrat {contrat.numero}',
            'factures_crees': factures_crees
        }
    
    @staticmethod
    def envoyer_relances_automatiques():
        """Envoie les relances automatiques pour les factures en retard"""
        config = ConfigurationFacturation.get_config()
        
        if not config.relance_automatique:
            return {
                'success': False,
                'message': 'Relances automatiques désactivées'
            }
        
        # Récupérer les factures en retard
        factures_en_retard = Facture.objects.filter(
            statut='en_retard',
            date_echeance__lt=date.today()
        ).select_related('client', 'contrat')
        
        relances_envoyees = []
        
        for facture in factures_en_retard:
            try:
                # Calculer le nombre de jours de retard
                jours_retard = (date.today() - facture.date_echeance).days
                
                # Récupérer l'email du client
                destinataire = None
                if hasattr(facture.client, 'user') and hasattr(facture.client.user, 'email'):
                    destinataire = facture.client.user.email
                elif hasattr(facture.client, 'email'):
                    destinataire = facture.client.email
                
                if destinataire:
                    # Envoyer la relance avec le template
                    context = EmailTemplateService.prepare_relance_context(facture, jours_retard)
                    result = EmailTemplateService.send_templated_email(
                        'relance',
                        context,
                        destinataire
                    )
                    
                    if result['success']:
                        # Marquer la facture comme relancée
                        facture.statut = 'relancee'
                        facture.save()
                        relances_envoyees.append(facture)
                    else:
                        print(f"Erreur lors de l'envoi de la relance pour la facture {facture.numero}: {result['error']}")
                else:
                    print(f"Pas d'email trouvé pour le client de la facture {facture.numero}")
                    
            except Exception as e:
                print(f"Erreur lors de l'envoi de la relance pour la facture {facture.numero}: {e}")
                continue
        
        return {
            'success': True,
            'message': f'{len(relances_envoyees)} relances envoyées',
            'relances_envoyees': relances_envoyees
        }
    
    @staticmethod
    def get_statistiques_facturation():
        """Retourne les statistiques de facturation"""
        today = date.today()
        
        # Statistiques générales
        total_factures = Facture.objects.count()
        factures_emises = Facture.objects.filter(statut='emise').count()
        factures_payees = Facture.objects.filter(statut='payee').count()
        factures_en_retard = Facture.objects.filter(statut='en_retard').count()
        
        # Montants
        montant_total_facture = Facture.objects.aggregate(
            total=Sum('montant_ttc')
        )['total'] or 0
        
        montant_total_paye = Facture.objects.aggregate(
            total=Sum('montant_paye')
        )['total'] or 0
        
        montant_en_retard = Facture.objects.filter(statut='en_retard').aggregate(
            total=Sum('montant_restant')
        )['total'] or 0
        
        # Factures du mois
        debut_mois = today.replace(day=1)
        factures_mois = Facture.objects.filter(date_emission__gte=debut_mois).count()
        montant_mois = Facture.objects.filter(date_emission__gte=debut_mois).aggregate(
            total=Sum('montant_ttc')
        )['total'] or 0
        
        # Échéances à venir
        date_limite = today + timedelta(days=30)
        echeances_a_venir = EcheancierContrat.objects.filter(
            date_echeance__lte=date_limite,
            statut='en_attente',
            factures__isnull=True
        ).count()
        
        return {
            'total_factures': total_factures,
            'factures_emises': factures_emises,
            'factures_payees': factures_payees,
            'factures_en_retard': factures_en_retard,
            'montant_total_facture': montant_total_facture,
            'montant_total_paye': montant_total_paye,
            'montant_en_retard': montant_en_retard,
            'factures_mois': factures_mois,
            'montant_mois': montant_mois,
            'echeances_a_venir': echeances_a_venir,
        }
    
    @staticmethod
    def get_factures_en_retard():
        """Retourne les factures en retard"""
        return Facture.objects.filter(
            statut='en_retard',
            date_echeance__lt=date.today()
        ).select_related('client', 'contrat', 'echeance')
    
    @staticmethod
    def get_factures_a_venir():
        """Retourne les factures à venir (échéance dans les 30 jours)"""
        date_limite = date.today() + timedelta(days=30)
        return Facture.objects.filter(
            date_echeance__lte=date_limite,
            statut__in=['emise', 'envoyee']
        ).select_related('client', 'contrat', 'echeance')
    
    @staticmethod
    def enregistrer_paiement_facture(facture_id, montant, date_paiement=None, mode_paiement='virement', reference_paiement=''):
        """Enregistre un paiement pour une facture"""
        from .models import PaiementFacture
        
        try:
            facture = Facture.objects.get(id=facture_id)
        except Facture.DoesNotExist:
            return {
                'success': False,
                'message': 'Facture non trouvée'
            }
        
        if date_paiement is None:
            date_paiement = date.today()
        
        # Vérifier que le montant ne dépasse pas le montant restant
        if montant > facture.montant_restant:
            return {
                'success': False,
                'message': f'Le montant ({montant}) dépasse le montant restant ({facture.montant_restant})'
            }
        
        with transaction.atomic():
            # Créer l'enregistrement de paiement
            paiement = PaiementFacture.objects.create(
                facture=facture,
                montant=montant,
                date_paiement=date_paiement,
                mode_paiement=mode_paiement,
                reference_paiement=reference_paiement
            )
            
            # Mettre à jour la facture
            facture.enregistrer_paiement(montant, date_paiement)
            
            # Mettre à jour l'échéance si elle existe
            if facture.echeance:
                facture.echeance.marquer_comme_paye(date_paiement)
        
        return {
            'success': True,
            'message': f'Paiement de {montant} enregistré pour la facture {facture.numero}',
            'paiement': paiement
        } 