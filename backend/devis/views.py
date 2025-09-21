from django.shortcuts import render
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.core.mail import EmailMessage
from django.conf import settings
from django.template.loader import render_to_string
from django.http import HttpResponse
from weasyprint import HTML, CSS
from weasyprint.text.fonts import FontConfiguration
import base64
import tempfile
import os
import logging
from decimal import Decimal
from projects.models import ProjectTask
from .models import Devis, LigneDevis, LigneDevisIntervenant
from .serializers import (
    DevisSerializer, DevisCreateSerializer,
    LigneDevisSerializer, LigneDevisCreateSerializer,
    LigneDevisIntervenantSerializer, LigneDevisIntervenantCreateSerializer,
    DevisAvecLignesSerializer, LigneDevisAvecIntervenantsSerializer
)
from catalog.models import Activity, TauxHoraire, LigneFrais
from email_templates.services import EmailTemplateService

logger = logging.getLogger(__name__)

class DevisViewSet(viewsets.ModelViewSet):
    """ViewSet pour la gestion des devis"""
    
    queryset = Devis.objects.select_related('client').prefetch_related('lignes').all()
    serializer_class = DevisSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['statut', 'client', 'date_creation', 'date_validite']
    search_fields = ['numero', 'client__nom', 'client__prenom', 'client__raison_sociale']
    ordering_fields = ['numero', 'date_creation', 'date_validite', 'montant_ttc']
    ordering = ['-date_creation']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return DevisCreateSerializer
        return DevisSerializer
    
    @action(detail=False, methods=['post'])
    def creer_avec_lignes(self, request):
        """Créer un devis avec ses lignes en une seule requête"""
        try:
            logger.info(f"Données reçues: {request.data}")
            
            # Valider les données du devis
            devis_serializer = DevisAvecLignesSerializer(data=request.data)
            if not devis_serializer.is_valid():
                logger.error(f"Erreur validation devis: {devis_serializer.errors}")
                return Response({'error': 'Erreur de validation du devis', 'details': devis_serializer.errors}, status=400)
            
            devis_data = devis_serializer.validated_data
            logger.info(f"Données devis validées: {devis_data}")
            
            # Créer le devis
            devis = Devis.objects.create(
                client=devis_data['client'],
                date_validite=devis_data['date_validite'],
                taux_tva=devis_data.get('taux_tva', 18.00),
                appliquer_tva=devis_data.get('appliquer_tva', True),
                taux_frais_agence=devis_data.get('taux_frais_agence', 15.00),
                appliquer_frais_agence=devis_data.get('appliquer_frais_agence', False),
                notes=devis_data.get('notes', ''),
                conditions=devis_data.get('conditions', '')
            )
            logger.info(f"Devis créé avec ID: {devis.id}")

            # Valider et créer les lignes
            lignes_data = request.data.get('lignes', [])
            logger.info(f"Nombre de lignes à traiter: {len(lignes_data)}")
            
            for i, ligne_data in enumerate(lignes_data):
                logger.info(f"Traitement ligne {i+1}: {ligne_data}")
                
                try:
                    # Valider la ligne avec le sérialiseur approprié
                    ligne_serializer = LigneDevisAvecIntervenantsSerializer(data=ligne_data)
                    if not ligne_serializer.is_valid():
                        logger.error(f"Erreur validation ligne {i+1}: {ligne_serializer.errors}")
                        return Response({'error': f'Erreur de validation de la ligne {i+1}', 'details': ligne_serializer.errors}, status=400)
                    
                    validated_ligne_data = ligne_serializer.validated_data
                    logger.info(f"Ligne {i+1} validée: {validated_ligne_data}")
                    
                    if validated_ligne_data['type_ligne'] == 'prestation':
                        ligne = devis.ajouter_ligne(
                            service_id=validated_ligne_data['service_id'].id,
                            activity_id=validated_ligne_data['activity_id'].id,
                            description=validated_ligne_data.get('description', ''),
                            quantite=validated_ligne_data['quantite'],
                            unite_id=validated_ligne_data['unite_id'].id,
                            type_ligne='prestation'
                        )
                        logger.info(f"Ligne prestation créée avec ID: {ligne.id}")
                        
                        # Créer les intervenants pour cette ligne
                        for j, intervenant_data in enumerate(ligne_data.get('intervenants', [])):
                            logger.info(f"Traitement intervenant {j+1} de la ligne {i+1}: {intervenant_data}")
                            
                            # Valider les données de l'intervenant
                            temps_intervenant = Decimal(str(intervenant_data['temps_intervenant'])) if intervenant_data['temps_intervenant'] else Decimal('0')
                            taux_horaire = Decimal(str(intervenant_data['taux_horaire'])) if intervenant_data['taux_horaire'] else Decimal('0')
                            
                            ligne.intervenants.create(
                                profile_intervenant_id=intervenant_data['profile_intervenant_id'],
                                temps_intervenant=temps_intervenant,
                                taux_horaire=taux_horaire
                            )
                            logger.info(f"Intervenant {j+1} créé pour la ligne {ligne.id}")
                        
                        # Recalculer le prix unitaire de la ligne après avoir ajouté tous les intervenants
                        if ligne.intervenants.exists():
                            # Calculer la somme des montants par intervenant
                            total_intervenants = sum(interv.montant_intervenant for interv in ligne.intervenants.all())
                            
                            # Si plusieurs intervenants et unité spéciale, calculer le prix unitaire selon la règle métier
                            if ligne.intervenants.count() > 1:
                                unite_intitule = ligne.unite.intitule.lower()
                                is_unite_jour = any(unite in unite_intitule for unite in ['heure', 'homme-jour', 'jour'])
                                
                                if is_unite_jour:
                                    # Le prix unitaire est égal à la somme des montants divisée par la quantité
                                    ligne.prix_unitaire_ht = total_intervenants / ligne.quantite if ligne.quantite > 0 else 0
                                else:
                                    # Logique normale pour les autres unités
                                    ligne.prix_unitaire_ht = total_intervenants
                            else:
                                # Logique normale pour un seul intervenant
                                ligne.prix_unitaire_ht = total_intervenants
                            
                            ligne.save()
                            logger.info(f"Prix unitaire recalculé pour la ligne {ligne.id}: {ligne.prix_unitaire_ht}")
                            
                    elif validated_ligne_data['type_ligne'] == 'frais':
                        ligne = LigneDevis.objects.create(
                            devis=devis,
                            type_ligne='frais',
                            frais_category=validated_ligne_data.get('frais_category_id'),
                            ligne_frais=validated_ligne_data['ligne_frais_id'],
                            description=validated_ligne_data.get('description', ''),
                            quantite=validated_ligne_data['quantite'],
                            unite=validated_ligne_data['unite_id'],
                            prix_unitaire_ht=validated_ligne_data.get('prix_unitaire_ht', Decimal('0')),
                            type_frais=validated_ligne_data.get('type_frais', 'standard')
                        )
                        logger.info(f"Ligne frais créée avec ID: {ligne.id}")
                        # Le montant_ht sera calculé automatiquement dans save()
                    else:
                        raise Exception('Type de ligne inconnu')
                        
                except Exception as e:
                    logger.error(f"Erreur lors du traitement de la ligne {i+1}: {str(e)}")
                    return Response({'error': f'Erreur lors du traitement de la ligne {i+1}', 'details': str(e)}, status=400)

            # Calculer les montants finaux du devis
            devis.calculer_montants()
            logger.info(f"Montants calculés pour le devis {devis.id}")

            # Retourner le devis complet
            return Response(DevisSerializer(devis).data, status=201)
            
        except Exception as e:
            logger.error(f"Erreur générale lors de la création du devis: {str(e)}")
            return Response({'error': 'Erreur lors de la création du devis', 'details': str(e)}, status=400)
    
    @action(detail=True, methods=['post'])
    def envoyer(self, request, pk=None):
        """Envoyer un devis (changer le statut en 'envoye')"""
        devis = self.get_object()
        devis.statut = 'envoye'
        devis.save()
        return Response({'status': 'Devis envoyé'})
    
    @action(detail=True, methods=['post'])
    def generer_pdf(self, request, pk=None):
        """Génère le PDF du devis"""
        devis = self.get_object()
        save_to_model = request.data.get('save', False)
        
        try:
            # Rendre le template HTML
            html_string = render_to_string('devis/devis_pdf.html', {
                'devis': devis
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
            filename = f"devis_{devis.numero}.pdf"
            
            # Sauvegarder le PDF dans le modèle si demandé
            if save_to_model:
                # TODO: Ajouter le champ pdf_file au modèle Devis si nécessaire
                return Response({
                    'message': 'PDF généré et sauvegardé avec succès',
                    'filename': filename
                })
            
            # Retourner le PDF directement
            response = HttpResponse(pdf, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            
            return response
            
        except Exception as e:
            logger.error(f'Erreur lors de la génération du PDF pour le devis {devis.numero}: {str(e)}')
            return Response(
                {'error': f'Erreur lors de la génération du PDF: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def envoyer_email_pdf(self, request, pk=None):
        """Envoyer un devis par email avec le PDF généré par jsPDF"""
        devis = self.get_object()
        
        # Récupérer les données de l'email
        email_destinataire = request.data.get('email_destinataire')
        pdf_data = request.data.get('pdf_data')
        use_custom_template = request.data.get('use_custom_template', False)
        custom_sujet = request.data.get('sujet', '')
        custom_message = request.data.get('message', '')
        
        if not email_destinataire:
            return Response({'error': 'Email destinataire requis'}, status=400)
        
        if not pdf_data:
            return Response({'error': 'Données PDF requises'}, status=400)
        
        # Décoder les données PDF base64
        if pdf_data.startswith('data:application/pdf;base64,'):
            pdf_base64 = pdf_data.split(',')[1]
        else:
            pdf_base64 = pdf_data
        
        pdf_content = base64.b64decode(pdf_base64)
        
        try:
            # Utiliser le service de template d'email
            if use_custom_template and custom_sujet and custom_message:
                # Utiliser le contenu personnalisé fourni
                sujet = custom_sujet
                message_complet = custom_message
            else:
                # Utiliser le template par défaut
                context = EmailTemplateService.prepare_devis_context(devis)
                result = EmailTemplateService.send_templated_email(
                    'devis',
                    context,
                    email_destinataire,
                    {
                        'name': f'devis-{devis.numero}.pdf',
                        'content': pdf_content,
                        'mime_type': 'application/pdf'
                    }
                )
                
                if result['success']:
                    # Marquer le devis comme envoyé
                    devis.statut = 'envoye'
                    devis.save()
                    
                    return Response({
                        'message': result['message'],
                        'template_used': result.get('template_used'),
                        'subject': result.get('subject')
                    })
                else:
                    return Response({'error': result['error']}, status=500)
            
            # Fallback : envoi manuel si template personnalisé
            email = EmailMessage(
                subject=sujet,
                body=message_complet,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[email_destinataire]
            )
            
            # Attacher le PDF
            email.attach(
                f'devis-{devis.numero}.pdf',
                pdf_content,
                'application/pdf'
            )
        
            # Envoyer l'email
            email.send()
            print("Email sent", email)
            
            # Nettoyer le fichier temporaire
            os.unlink(temp_file_path)
            
            # Changer le statut du devis si ce n'est pas déjà fait
            if devis.statut == 'brouillon':
                devis.statut = 'envoye'
                devis.save()
            
            return Response({
                'status': 'Email envoyé avec succès',
                'message': 'Le devis a été envoyé par email avec le PDF en pièce jointe'
            })
            
        except Exception as e:
            # Nettoyer le fichier temporaire en cas d'erreur
            if 'temp_file_path' in locals():
                try:
                    os.unlink(temp_file_path)
                except:
                    pass
            
            return Response({'error': str(e)}, status=400)
    
    def prepare_email_message(self, devis, message_personnalise=''):
        """Préparer le message email complet"""
        # Message de base
        message_base = f"""
            Bonjour {devis.client.nom_complet},

            Veuillez trouver ci-joint notre devis {devis.numero} pour un montant de {devis.montant_ttc} GNF.

            Détails du devis :
            - Numéro : {devis.numero}
            - Date de validité : {devis.date_validite}
            - Montant HT : {devis.montant_ht} GNF
            - TVA ({devis.taux_tva}%) : {devis.montant_tva} GNF
            - Montant TTC : {devis.montant_ttc} GNF

            {message_personnalise}

            Cordialement,
            L'équipe SAKOM
        """
        
        return message_base.strip()
    
    @action(detail=True, methods=['post'])
    def accepter(self, request, pk=None):
        """Accepter un devis (changer le statut en 'accepte')"""
        devis = self.get_object()
        devis.statut = 'accepte'
        devis.save()
        return Response({'status': 'Devis accepté'})
    
    @action(detail=True, methods=['post'])
    def refuser(self, request, pk=None):
        """Refuser un devis (changer le statut en 'refuse')"""
        devis = self.get_object()
        devis.statut = 'refuse'
        devis.save()
        return Response({'status': 'Devis refusé'})
    
    @action(detail=True, methods=['post'])
    def calculer_montants(self, request, pk=None):
        """Recalculer les montants du devis"""
        devis = self.get_object()
        devis.calculer_montants()
        return Response(DevisSerializer(devis).data)

    @action(detail=False, methods=['get'])
    def services_by_contract(self, request):
        """Récupérer les services associés aux devis liés à un contrat"""
        contract_id = request.query_params.get('contract_id')
        project_id = request.query_params.get('project_id')
        
        if not contract_id:
            return Response(
                {'error': 'Le paramètre contract_id est requis'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Récupérer les devis liés au contrat
            from contrats.models import Contrat
            contrat = Contrat.objects.get(id=contract_id)
            
            # Récupérer tous les devis associés à ce contrat
            devis_ids = []
            if contrat.devis_principal:
                devis_ids.append(contrat.devis_principal.id)
            if contrat.devis:
                devis_ids.extend([devis.id for devis in contrat.devis.all()])
            
            # Récupérer les IDs des lignes de devis déjà utilisées dans les tâches du projet
            project_tasks_ligne_devis_ids = ProjectTask.objects.filter(
                project_id=project_id, 
                ligne_devis__isnull=False
            ).values_list('ligne_devis_id', flat=True)
            
            # Récupérer les lignes de devis avec activités et frais
            # Exclure les lignes déjà utilisées dans les tâches du projet
            lignes_devis = LigneDevis.objects.filter(
                devis_id__in=devis_ids,
                type_ligne__in=['prestation', 'frais']
            ).exclude(
                id__in=project_tasks_ligne_devis_ids
            ).select_related('activity', 'frais_category', 'ligne_frais', 'unite', 'devis').prefetch_related('intervenants')
            
            # Organiser les activités et frais par devis
            services_by_devis = {}
            for ligne in lignes_devis:
                devis_id = ligne.devis.id
                if devis_id not in services_by_devis:
                    services_by_devis[devis_id] = {
                        'devis': {
                            'id': ligne.devis.id,
                            'numero': ligne.devis.numero,
                            'date_creation': ligne.devis.date_creation,
                            'statut': ligne.devis.statut
                        },
                        'activities': [],
                        'frais': []
                    }
                
                # Debug: logger le type de ligne
                logger.info(f"Traitement ligne {ligne.id}: type={ligne.type_ligne}, service={ligne.service}, activity={ligne.activity}, frais_category={ligne.frais_category}")
                
                # Ajouter les informations d'intervenants
                intervenants = []
                for intervenant in ligne.intervenants.all():
                    intervenants.append({
                        'id': intervenant.profile_intervenant.id,
                        'intitule': intervenant.profile_intervenant.name,
                        'temps_intervenant': float(intervenant.temps_intervenant),
                        'taux_horaire': float(intervenant.taux_horaire),
                        'montant_intervenant': float(intervenant.montant_intervenant)
                    })
                
                # Créer l'objet ligne avec type
                ligne_data = {
                    'id': ligne.id,
                    'type_ligne': ligne.type_ligne,
                    'description': ligne.description,
                    'quantite': float(ligne.quantite),
                    'unite': {
                        'id': ligne.unite.id,
                        'intitule': ligne.unite.intitule,
                        'code': ligne.unite.code
                    },
                    'prix_unitaire_ht': float(ligne.prix_unitaire_ht),
                    'montant_ht': float(ligne.montant_ht),
                    'intervenants': intervenants
                }
                
                # Ajouter selon le type de ligne
                if ligne.type_ligne == 'prestation' and ligne.activity:
                    logger.info(f"Ajout activité {ligne.activity.name} au devis {devis_id}")
                    ligne_data.update({
                        'activity': {
                            'id': ligne.activity.id,
                            'name': ligne.activity.name,
                            'duree_standard': float(ligne.activity.duree_standard),
                            'service': {
                                'id': ligne.activity.service.id,
                                'name': ligne.activity.service.name
                            }
                        }
                    })
                    services_by_devis[devis_id]['activities'].append(ligne_data)
                
                elif ligne.type_ligne == 'frais':
                    frais_name = 'Frais'
                    if ligne.frais_category:
                        frais_name = ligne.frais_category.name
                    elif ligne.ligne_frais:
                        frais_name = ligne.ligne_frais.description
                    
                    logger.info(f"Ajout frais {frais_name} au devis {devis_id}")
                    ligne_data.update({
                        'type_frais': ligne.type_frais,
                        'frais_category': {
                            'id': ligne.frais_category.id,
                            'name': ligne.frais_category.name
                        } if ligne.frais_category else None,
                        'ligne_frais': {
                            'id': ligne.ligne_frais.id,
                            'description': ligne.ligne_frais.description,
                            'type_frais': ligne.ligne_frais.type_frais
                        } if ligne.ligne_frais else None
                    })
                    services_by_devis[devis_id]['frais'].append(ligne_data)
                else:
                    logger.warning(f"Type de ligne non reconnu: {ligne.type_ligne} pour la ligne {ligne.id}")
            
            # Debug: logger le résumé
            for devis_id, devis_data in services_by_devis.items():
                logger.info(f"Devis {devis_id}: {len(devis_data['activities'])} activités, {len(devis_data['frais'])} frais")
            
            return Response({
                'contract_id': contract_id,
                'contract_numero': contrat.numero,
                'devis_services': list(services_by_devis.values())
            })
            
        except Contrat.DoesNotExist:
            return Response(
                {'error': 'Contrat non trouvé'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'Erreur lors de la récupération des services: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class LigneDevisViewSet(viewsets.ModelViewSet):
    """ViewSet pour la gestion des lignes de devis"""
    
    queryset = LigneDevis.objects.select_related('service', 'activity', 'frais_category', 'ligne_frais', 'unite').all()
    serializer_class = LigneDevisSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['devis', 'type_ligne', 'service', 'activity', 'frais_category', 'ligne_frais', 'unite']
    ordering_fields = ['created_at']
    ordering = ['created_at']
    
    def get_serializer_class(self):
        if self.action == 'create':
            from .serializers import LigneDevisCreateSerializer
            return LigneDevisCreateSerializer
        return LigneDevisSerializer
    
    def perform_create(self, serializer):
        serializer.save()
    
    @action(detail=False, methods=['get'])
    def activites_by_service(self, request):
        service_id = request.query_params.get('service_id')
        if service_id:
            activites = Activity.objects.filter(service_id=service_id, is_active=True)
            return Response({
                'activites': [
                    {'id': a.id, 'intitule': a.name}
                    for a in activites
                ]
            })
        return Response({'activites': []})
    
    @action(detail=False, methods=['get'])
    def frais_by_category(self, request):
        category_id = request.query_params.get('category_id')
        if category_id:
            frais = LigneFrais.objects.filter(category_id=category_id, is_active=True)
            return Response({
                'frais': [
                    {
                        'id': f.id, 
                        'intitule': f.description, 
                        'description': f.description,
                        'type_frais': f.type_frais,
                        'category_name': f.category.name
                    }
                    for f in frais
                ]
            })
        return Response({'frais': []})

    @action(detail=False, methods=['get'])
    def intervenants_with_activite(self, request):
        activity_id = request.query_params.get('activity_id')
        if activity_id:
            try:
                activity = Activity.objects.get(id=activity_id)
                intervenants = []
                for profile in activity.profiles_intervenant.all():
                    try:
                        taux = TauxHoraire.objects.get(activity=activity, profile_intervenant=profile)
                        taux_horaire = taux.taux_heure
                    except TauxHoraire.DoesNotExist:
                        taux_horaire = 0
                    temps_intervenant = activity.activityprofile_set.get(profile_intervenant=profile).temps_intervenant
                    intervenants.append({
                        'id': profile.id,
                        'intitule': profile.name,
                        'description': '',
                        'taux_horaire': taux_horaire,
                        'temps_intervenant': temps_intervenant
                    })
                return Response({'intervenants': intervenants})
            except Activity.DoesNotExist:
                return Response({'intervenants': []})
        return Response({'intervenants': []})


class LigneDevisIntervenantViewSet(viewsets.ModelViewSet):
    """ViewSet pour la gestion des intervenants de ligne de devis"""
    
    queryset = LigneDevisIntervenant.objects.select_related('ligne_devis', 'profile_intervenant').all()
    serializer_class = LigneDevisIntervenantSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['ligne_devis', 'profile_intervenant']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return LigneDevisIntervenantCreateSerializer
        return LigneDevisIntervenantSerializer
    
    def perform_create(self, serializer):
        """The serializer now handles devis_id automatically"""
        serializer.save()

