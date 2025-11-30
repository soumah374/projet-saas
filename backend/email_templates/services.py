from django.core.mail import EmailMessage
from django.conf import settings
from .models import EmailTemplate
import logging

logger = logging.getLogger(__name__)


class EmailTemplateService:
    """Service pour l'envoi d'emails avec templates personnalisables"""
    
    @staticmethod
    def send_templated_email(email_type, context_data, recipient_email, attachment_data=None):
        """
        Envoie un email en utilisant un template personnalisable
        
        Args:
            email_type (str): Type d'email (devis, contrat, facture, etc.)
            context_data (dict): Données pour remplir le template
            recipient_email (str): Email du destinataire
            attachment_data (dict): Données de pièce jointe optionnelle
                - name: nom du fichier
                - content: contenu binaire
                - mime_type: type MIME
        
        Returns:
            dict: Résultat de l'envoi avec success, message, etc.
        """
        try:
            # Récupérer le template pour ce type d'email
            template = EmailTemplate.get_template_for_type(email_type)
            
            if not template:
                return {
                    'success': False,
                    'error': f'Aucun template trouvé pour le type "{email_type}"'
                }
            
            # Rendre le template avec les données
            rendered = template.render_content(context_data)
            
            # Créer l'email
            email = EmailMessage(
                subject=rendered['subject'],
                body=rendered['content'],
                from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', None),
                to=[recipient_email]
            )
            
            # Ajouter la pièce jointe si fournie
            if attachment_data:
                email.attach(
                    attachment_data['name'],
                    attachment_data['content'],
                    attachment_data.get('mime_type', 'application/octet-stream')
                )
            
            # Envoyer l'email
            email.send()
            
            logger.info(f"Email {email_type} envoyé avec succès à {recipient_email}")
            
            return {
                'success': True,
                'message': f'Email envoyé avec succès à {recipient_email}',
                'template_used': template.nom,
                'subject': rendered['subject']
            }
            
        except EmailTemplate.DoesNotExist:
            error_msg = f'Template non trouvé pour le type "{email_type}"'
            logger.error(error_msg)
            return {
                'success': False,
                'error': error_msg
            }
        except Exception as e:
            error_msg = f'Erreur lors de l\'envoi de l\'email: {str(e)}'
            logger.error(error_msg)
            return {
                'success': False,
                'error': error_msg
            }
    
    @staticmethod
    def prepare_devis_context(devis):
        """Prépare le contexte pour un email de devis"""
        return {
            'numero': devis.numero,
            'client_nom': getattr(devis.client, 'nom', ''),
            'client_prenom': getattr(devis.client, 'prenom', ''),
            'client_raison_sociale': getattr(devis.client, 'raison_sociale', ''),
            'montant_ht': str(devis.montant_ht or '0.00'),
            'montant_ttc': str(devis.montant_ttc or '0.00'),
            'date_creation': devis.date_creation.strftime('%d/%m/%Y') if devis.date_creation else '',
            'date_validite': devis.date_validite.strftime('%d/%m/%Y') if devis.date_validite else ''
        }
    
    @staticmethod
    def prepare_contrat_context(contrat):
        """Prépare le contexte pour un email de contrat"""
        return {
            'numero': contrat.numero,
            'client_nom': getattr(contrat.client, 'nom', ''),
            'client_prenom': getattr(contrat.client, 'prenom', ''),
            'client_raison_sociale': getattr(contrat.client, 'raison_sociale', ''),
            'montant_total': str(contrat.montant_ht or '0.00'),
            'date_debut': contrat.date_debut.strftime('%d/%m/%Y') if contrat.date_debut else '',
            'date_fin': contrat.date_fin.strftime('%d/%m/%Y') if contrat.date_fin else ''
        }
    
    @staticmethod
    def prepare_avenant_context(avenant):
        """Prépare le contexte pour un email d'avenant"""
        return {
            'numero': avenant.numero,
            'contrat_numero': avenant.contrat.numero,
            'client_nom': getattr(avenant.contrat.client, 'nom', ''),
            'client_prenom': getattr(avenant.contrat.client, 'prenom', ''),
            'client_raison_sociale': getattr(avenant.contrat.client, 'raison_sociale', '')
        }
    
    @staticmethod
    def prepare_facture_context(facture):
        """Prépare le contexte pour un email de facture"""
        return {
            'numero': facture.numero,
            'client_nom': getattr(facture.client, 'nom', ''),
            'client_prenom': getattr(facture.client, 'prenom', ''),
            'client_raison_sociale': getattr(facture.client, 'raison_sociale', ''),
            'montant_ht': str(getattr(facture, 'montant_ht', '0.00')),
            'montant_ttc': str(getattr(facture, 'montant_ttc', '0.00')),
            'date_facture': facture.date_facture.strftime('%d/%m/%Y') if hasattr(facture, 'date_facture') and facture.date_facture else '',
            'date_echeance': facture.date_echeance.strftime('%d/%m/%Y') if facture.date_echeance else ''
        }
    
    @staticmethod
    def prepare_relance_context(facture, jours_retard=0):
        """Prépare le contexte pour un email de relance"""
        return {
            'numero_facture': facture.numero,
            'client_nom': getattr(facture.client, 'nom', ''),
            'client_prenom': getattr(facture.client, 'prenom', ''),
            'montant_du': str(getattr(facture, 'montant_ttc', '0.00')),
            'jours_retard': str(jours_retard),
            'date_echeance': facture.date_echeance.strftime('%d/%m/%Y') if facture.date_echeance else ''
        }
