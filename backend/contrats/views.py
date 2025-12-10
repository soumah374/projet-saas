from django.shortcuts import render
import django.template.loader
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from django.utils import timezone
from django.db import transaction
from datetime import date, timedelta, datetime
from django.core.mail import EmailMessage
from django.conf import settings


from .models import Contrat, LigneContrat, LigneContratIntervenant, EcheancierContrat, Avenant, ContratHistoriqueMontant
from .serializers import (
    ContratSerializer, ContratCreateSerializer, ContratDetailSerializer,
    LigneContratSerializer, LigneContratIntervenantSerializer,
    EcheancierContratSerializer, EcheancierContratCreateSerializer,
    AvenantSerializer, AvenantCreateSerializer, AvenantDetailSerializer,
    ContratHistoriqueMontantSerializer
)
from devis.models import Devis

from django.template.loader import render_to_string
from weasyprint import HTML, CSS
from weasyprint.text.fonts import FontConfiguration
from django.http import HttpResponse
from email_templates.services import EmailTemplateService


class ContratViewSet(viewsets.ModelViewSet):
    """ViewSet pour les contrats"""
    queryset = Contrat.objects.all()
    serializer_class = ContratSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['statut', 'client', 'devis']
    search_fields = ['numero', 'client__nom_complet']
    ordering_fields = ['date_creation', 'date_debut', 'date_fin', 'montant_ttc']
    ordering = ['-date_creation']

    def get_serializer_class(self):
        if self.action == 'create':
            return ContratCreateSerializer
        elif self.action in ['retrieve', 'update', 'partial_update']:
            return ContratDetailSerializer
        return ContratSerializer

    @action(detail=True, methods=['get'])
    def download_pdf(self, request, pk=None): 
        """Télécharger le contrat en PDF"""
        contrat = self.get_object()
        
        try:            
            html_string = render_to_string('contrats/print_contrat.html', {
                'contrat': contrat
            })
            font_config = FontConfiguration()
            html_doc = HTML(string=html_string)
            pdf = html_doc.write_pdf(font_config=font_config)
            response = HttpResponse(pdf, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="contrat_{contrat.numero}.pdf"'
            response['Content-Length'] = len(pdf)
            return response
            
        except Exception as e:
            return Response(
                {'error': f'Erreur lors de la génération du PDF: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def update_content(self, request, pk=None):
        """Mettre à jour le contenu personnalisé du contrat"""
        contrat = self.get_object()
        contenu_personnalise = request.data.get('contenu_personnalise', '')
        
        print('contenu_personnalise', contenu_personnalise)
        
        contrat.contenu_personnalise = contenu_personnalise
        contrat.save()
        
        return Response({'message': 'Contenu mis à jour avec succès'})

    @action(detail=False, methods=['post'])
    def create_from_devis(self, request):
        """Créer un contrat à partir d'un ou plusieurs devis"""
        devis_ids = request.data.get('devis_ids', [])
        devis_principal_id = request.data.get('devis_principal_id')
        date_debut_str = request.data.get('date_debut')
        date_fin_str = request.data.get('date_fin')
        conditions = request.data.get('conditions', '')
        notes = request.data.get('notes', '')
        echeances_contrat = request.data.get('echeances', [])
    
        
        if not devis_ids or not date_debut_str or not date_fin_str:
            return Response(
                {'error': 'devis_ids, date_debut et date_fin sont obligatoires'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            with transaction.atomic():
                # Convertir les chaînes de dates en objets date
                try:
                    date_debut = datetime.strptime(date_debut_str, '%Y-%m-%d').date()
                    date_fin = datetime.strptime(date_fin_str, '%Y-%m-%d').date()
                except ValueError:
                    return Response(
                        {'error': 'Format de date invalide. Utilisez le format YYYY-MM-DD'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Vérifier que la date de fin est après la date de début
                if date_fin <= date_debut:
                    return Response(
                        {'error': 'La date de fin doit être après la date de début'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Récupérer les devis
                devis_list = Devis.objects.filter(id__in=devis_ids, statut='accepte')
                if len(devis_list) != len(devis_ids):
                    return Response(
                        {'error': 'Certains devis n\'existent pas ou ne sont pas acceptés'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Vérifier que tous les devis ont le même client
                clients = set(devis.client for devis in devis_list)
                if len(clients) > 1:
                    return Response(
                        {'error': 'Tous les devis doivent avoir le même client'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Vérifier qu'aucun devis n'a déjà un contrat
                for devis in devis_list:
                    if devis.contrats.exists():
                        return Response(
                            {'error': f'Le devis {devis.numero} a déjà un contrat associé'},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                
                # Utiliser le premier devis comme référence pour le client
                premier_devis = devis_list.first()
                
                # Créer le contrat sans accéder aux devis
                contrat = Contrat(
                    client=premier_devis.client,
                    date_debut=date_debut,
                    date_fin=date_fin,
                    conditions=conditions,
                    notes=notes,
                    echeances_contrat=echeances_contrat,
                    statut='brouillon'
                )
                
                # Sauvegarder d'abord le contrat pour obtenir un ID
                contrat.save()
                
                # Maintenant que le contrat a un ID, on peut ajouter les devis
                contrat.devis.set(devis_list)
                
                # Définir le devis principal
                if devis_principal_id and devis_principal_id in devis_ids:
                    contrat.devis_principal_id = devis_principal_id
                else:
                    contrat.devis_principal_id = devis_ids[0]
                
                # Initialiser les montants depuis les devis
                contrat.initialiser_montants_depuis_devis()
                contrat.save()
                
                for devis in devis_list:
                    for ligne_devis in devis.lignes.all():
                        ligne_contrat = LigneContrat.objects.create(
                            contrat=contrat,
                            type_ligne=ligne_devis.type_ligne,
                            type_frais=ligne_devis.type_frais,
                            service=ligne_devis.service,
                            activity=ligne_devis.activity,
                            frais_category=ligne_devis.frais_category,
                            ligne_frais=ligne_devis.ligne_frais,
                            description=ligne_devis.description,
                            quantite=ligne_devis.quantite,
                            unite=ligne_devis.unite,
                            prix_unitaire_ht=ligne_devis.prix_unitaire_ht,
                            montant_ht=ligne_devis.montant_ht
                        )
                        
                        # Copier les intervenants si c'est une prestation
                        if ligne_devis.type_ligne == 'prestation':
                            for intervenant_devis in ligne_devis.intervenants.all():
                                LigneContratIntervenant.objects.create(
                                    ligne_contrat=ligne_contrat,
                                    profile_intervenant=intervenant_devis.profile_intervenant,
                                    temps_intervenant=intervenant_devis.temps_intervenant,
                                    taux_horaire=intervenant_devis.taux_horaire,
                                    montant_intervenant=intervenant_devis.montant_intervenant
                                )
                
                # Calculer les montants du contrat APRÈS avoir créé toutes les lignes
                contrat.calculer_montants()
                
                return Response(
                    ContratDetailSerializer(contrat).data,
                    status=status.HTTP_201_CREATED
                )
                
        except Devis.DoesNotExist:
            return Response(
                {'error': 'Devis non trouvé ou non accepté'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'Erreur lors de la création du contrat: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def echeances_alertes(self, request):
        """Récupérer les échéances nécessitant des alertes"""
        today = date.today()
        trois_jours = today + timedelta(days=3)
        
        echeances = EcheancierContrat.objects.filter(
            date_echeance__lte=trois_jours,
            date_echeance__gte=today,
            statut='en_attente',
            alerte_envoyee=False
        ).select_related('contrat', 'contrat__client')
        
        serializer = EcheancierContratSerializer(echeances, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def echeances_retard(self, request):
        """Récupérer les échéances en retard"""
        today = date.today()
        
        echeances = EcheancierContrat.objects.filter(
            date_echeance__lt=today,
            statut='en_attente'
        ).select_related('contrat', 'contrat__client')
        serializer = EcheancierContratSerializer(echeances, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def devis_disponibles(self, request):
        """Récupérer les devis disponibles pour créer un contrat"""
        try:
            # Récupérer tous les devis acceptés (un devis peut être utilisé dans plusieurs contrats)
            devis_disponibles = Devis.objects.filter(
                statut='accepte'
            ).select_related('client').order_by('-date_creation')
            
            # Sérialiser les devis avec les informations nécessaires
            devis_data = []
            for devis in devis_disponibles:
                devis_data.append({
                    'id': devis.id,
                    'numero': devis.numero,
                    'client': {
                        'id': devis.client.id,
                        'nom_complet': devis.client.nom_complet,
                        'email': devis.client.email,
                    },
                    'date_creation': devis.date_creation,
                    'montant_ttc': float(devis.montant_ttc),
                    'statut': devis.statut,
                    'statut_display': devis.get_statut_display(),
                })
            
            return Response(devis_data)
            
        except Exception as e:
            import traceback
            print(f"Erreur dans devis_disponibles: {str(e)}")
            print(traceback.format_exc())
            return Response(
                {'error': f'Erreur lors de la récupération des devis: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def activer(self, request, pk=None):
        """Activer un contrat (changer le statut de brouillon à actif)"""
        contrat = self.get_object()
        
        if contrat.statut not in ['brouillon', 'suspendu']:
            return Response(
                {'error': 'Seuls les contrats en brouillon ou suspendus peuvent être activés'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        contrat.statut = 'envoye'
        contrat.save()
        
        return Response({
            'message': 'Contrat activé avec succès',
            'statut': contrat.statut
        })

    @action(detail=True, methods=['post'])
    def cloturer(self, request, pk=None):
        """Clôturer un contrat (changer le statut à terminé)"""
        contrat = self.get_object()
        
        if contrat.statut not in ['actif', 'suspendu', 'signe', 'envoye']:
            return Response(
                {'error': 'Seuls les contrats actifs, suspendus, signés, envoyés ou brouillons peuvent être clôturés'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        contrat.statut = 'cloture'
        contrat.save()
        
        return Response({
            'message': 'Contrat clôturé avec succès',
            'statut': contrat.statut
        })

    @action(detail=True, methods=['post'])
    def archiver(self, request, pk=None):
        """Archiver un contrat (changer le statut à archivé)"""
        contrat = self.get_object()
        
        if contrat.statut == 'termine':
            contrat.statut = 'archive'
            contrat.save()
        else:
            return Response(
                {'error': 'Seuls les contrats terminés peuvent être archivés'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return Response({
            'message': 'Contrat archivé avec succès',
            'statut': contrat.statut
        })
    
    @action(detail=True, methods=['post'])
    def envoyer(self, request, pk=None):
        """
        Envoyer un contrat (changer le statut à envoyé et envoyer le PDF par email)
        """
        contrat = self.get_object()
        contrat.statut = 'envoye'
        contrat.save()

        # Générer le PDF du contrat
        try:
            html_string = render_to_string('contrats/print_contrat.html', {
                'contrat': contrat
            })
            font_config = FontConfiguration()
            html_doc = HTML(string=html_string)
            pdf = html_doc.write_pdf(font_config=font_config)
        except Exception as e:
            return Response(
                {'error': f'Erreur lors de la génération du PDF: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # Préparer l'email
        destinataire = None
        # On tente de récupérer l'email du client lié au contrat
        if hasattr(contrat.client, 'user') and hasattr(contrat.client.user, 'email'):
            destinataire = contrat.client.user.email
        elif hasattr(contrat.client, 'email'):
            destinataire = contrat.client.email

        if not destinataire:
            return Response(
                {'error': "Impossible de trouver l'email du client pour l'envoi du contrat."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Utiliser le service de template d'email
        context = EmailTemplateService.prepare_contrat_context(contrat)
        result = EmailTemplateService.send_templated_email(
            'contrat',
            context,
            destinataire,
            {
                'name': f'contrat_{contrat.numero}.pdf',
                'content': pdf,
                'mime_type': 'application/pdf'
            }
        )
        
        if not result['success']:
            return Response(
                {'error': result['error']},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        return Response({
            'message': 'Contrat envoyé avec succès (PDF envoyé par email)',
            'statut': contrat.statut
        })

    @action(
        detail=True,
        methods=['post'],
        parser_classes=[MultiPartParser, FormParser],
        url_path='signer'
    )
    def signer(self, request, pk=None):
        """
        Permet de marquer le contrat comme signé et d'uploader le contrat signé (PDF ou image).
        Le fichier doit être envoyé dans le champ 'fichier_signe' du formulaire multipart.
        """
        contrat = self.get_object()

        # Vérifier la présence du fichier signé
        fichier_signe = request.FILES.get('fichier_signe')
        if not fichier_signe:
            return Response(
                {'error': "Veuillez fournir le fichier du contrat signé (champ 'fichier_signe')."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Enregistrer le fichier signé dans le champ du modèle Contrat
        contrat.fichier_signe = fichier_signe
        contrat.statut = 'signe'
        contrat.save()

        return Response({
            'message': 'Contrat signé et fichier uploadé avec succès',
            'statut': contrat.statut
        })


    @action(detail=True, methods=['post'])
    def annuler(self, request, pk=None):
        """Annuler un contrat (changer le statut à annulé)"""
        contrat = self.get_object()
        
        if contrat.statut in ['termine', 'annule']:
            return Response(
                {'error': 'Les contrats terminés ou annulés ne peuvent pas être annulés'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        contrat.statut = 'annule'
        contrat.save()
        
        return Response({
            'message': 'Contrat annulé avec succès',
            'statut': contrat.statut
        })

    @action(detail=True, methods=['post'])
    def suspendre(self, request, pk=None):
        """Suspendre un contrat (changer le statut à suspendu)"""
        contrat = self.get_object()
        
        if contrat.statut not in ['actif', 'signe']:
            return Response(
                {'error': 'Seuls les contrats actifs ou signés peuvent être suspendus'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        contrat.statut = 'suspendu'
        contrat.save()
        
        return Response({
            'message': 'Contrat suspendu avec succès',
            'statut': contrat.statut
        })

    @action(detail=True, methods=['post'])
    def calculer_montants(self, request, pk=None):
        """Recalculer les montants du contrat"""
        contrat = self.get_object()
        
        try:
            contrat.calculer_montants()
            contrat.save()
            
            return Response({
                'message': 'Montants recalculés avec succès',
                'montant_ht': float(contrat.montant_ht),
                'montant_tva': float(contrat.montant_tva),
                'montant_ttc': float(contrat.montant_ttc)
            })
        except Exception as e:
            return Response(
                {'error': f'Erreur lors du calcul des montants: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def historique_montants(self, request, pk=None):
        """Récupérer l'historique des modifications de montants du contrat"""
        try:
            contrat = self.get_object()
            historique = ContratHistoriqueMontant.objects.filter(contrat=contrat).order_by('-date_modification')
            serializer = ContratHistoriqueMontantSerializer(historique, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': f'Erreur lors de la récupération de l\'historique: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def add_devis(self, request, pk=None):
        """Ajouter des devis à un contrat existant"""
        try:
            with transaction.atomic():
                contrat = self.get_object()
                devis_ids = request.data.get('devis_ids', [])
                devis_principal_id = request.data.get('devis_principal_id')
                echeances_data = request.data.get('echeances', [])

                if not devis_ids:
                    return Response(
                        {'error': 'devis_ids est obligatoire'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # Sauvegarder les montants avant modification pour l'historique
                montant_ht_avant = contrat.montant_ht
                montant_tva_avant = contrat.montant_tva
                montant_ttc_avant = contrat.montant_ttc

                # Récupérer les devis
                devis_list = Devis.objects.filter(id__in=devis_ids, statut='accepte')
                if len(devis_list) != len(devis_ids):
                    return Response(
                        {'error': 'Certains devis n\'existent pas ou ne sont pas acceptés'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # Vérifier que tous les devis ont le même client que le contrat
                for devis in devis_list:
                    if devis.client != contrat.client:
                        return Response(
                            {'error': f'Le devis {devis.numero} a un client différent du contrat'},
                            status=status.HTTP_400_BAD_REQUEST
                        )

                # Vérifier qu'aucun devis n'est déjà associé à un autre contrat
                for devis in devis_list:
                    if hasattr(devis, 'contrats') and devis.contrats.exists() and not devis.contrats.filter(id=contrat.id).exists():
                        return Response(
                            {'error': f'Le devis {devis.numero} est déjà associé à un autre contrat'},
                            status=status.HTTP_400_BAD_REQUEST
                        )

                # Ajouter les devis au contrat
                if hasattr(contrat, 'devis'):
                    contrat.devis.add(*devis_list)
                else:
                    # Fallback pour l'ancien système
                    if devis_principal_id:
                        contrat.devis_principal_id = devis_principal_id
                        contrat.save()

                # Définir le devis principal si spécifié
                if devis_principal_id and devis_principal_id in devis_ids:
                    contrat.devis_principal_id = devis_principal_id
                    contrat.save()

                # Copier les lignes des nouveaux devis dans le contrat
                for devis in devis_list:
                    for ligne_devis in devis.lignes.all():
                        # Vérifier si cette ligne n'existe pas déjà
                        ligne_contrat = LigneContrat.objects.create(
                            contrat=contrat,
                            type_ligne=ligne_devis.type_ligne,
                            type_frais=ligne_devis.type_frais,
                            service=ligne_devis.service,
                            activity=ligne_devis.activity,
                            frais_category=ligne_devis.frais_category,
                            ligne_frais=ligne_devis.ligne_frais,
                            description=ligne_devis.description,
                            quantite=ligne_devis.quantite,
                            unite=ligne_devis.unite,
                            prix_unitaire_ht=ligne_devis.prix_unitaire_ht,
                            montant_ht=ligne_devis.montant_ht
                        )

                        # Copier les intervenants si c'est une prestation
                        if ligne_devis.type_ligne == 'prestation':
                            for intervenant_devis in ligne_devis.intervenants.all():
                                LigneContratIntervenant.objects.create(
                                    ligne_contrat=ligne_contrat,
                                    profile_intervenant=intervenant_devis.profile_intervenant,
                                    temps_intervenant=intervenant_devis.temps_intervenant,
                                    taux_horaire=intervenant_devis.taux_horaire,
                                    montant_intervenant=intervenant_devis.montant_intervenant
                                )

                # Recalculer les montants du contrat
                if hasattr(contrat, 'calculer_montants'):
                    contrat.calculer_montants()

                # Recharger le contrat pour obtenir les nouveaux montants
                contrat.refresh_from_db()

                # Créer l'entrée d'historique
                devis_numeros = ", ".join([d.numero for d in devis_list])
                ContratHistoriqueMontant.objects.create(
                    contrat=contrat,
                    type_modification='ajout_devis',
                    montant_ht_avant=montant_ht_avant,
                    montant_tva_avant=montant_tva_avant,
                    montant_ttc_avant=montant_ttc_avant,
                    montant_ht_apres=contrat.montant_ht,
                    montant_tva_apres=contrat.montant_tva,
                    montant_ttc_apres=contrat.montant_ttc,
                    description=f"Ajout des devis: {devis_numeros}",
                    metadata={
                        'devis_ids': devis_ids,
                        'devis_numeros': [d.numero for d in devis_list]
                    }
                )

                # Créer les échéances si fournies
                if echeances_data and isinstance(echeances_data, list):
                    # Gérer les anciennes échéances de manière intelligente
                    anciennes_echeances = contrat.echeances.all()

                    # Déterminer la version de l'échéancier
                    version_actuelle = 1
                    for echeance in anciennes_echeances:
                        echeance_version = echeance.metadata.get('version', 1) if echeance.metadata else 1
                        if echeance_version >= version_actuelle:
                            version_actuelle = echeance_version + 1

                    # Traiter les anciennes échéances
                    for echeance in anciennes_echeances:
                        # Vérifier si l'échéance a des factures associées
                        from billings.models import Facture
                        has_factures = Facture.objects.filter(echeance=echeance).exists()

                        if echeance.statut == 'paye' or has_factures:
                            # Garder les échéances payées ou avec factures, mais les marquer comme archives
                            if not echeance.metadata:
                                echeance.metadata = {}
                            echeance.metadata['archive'] = True
                            echeance.metadata['archive_raison'] = 'Extension du contrat - Échéance conservée car payée ou facturée'
                            echeance.metadata['archive_date'] = timezone.now().isoformat()
                            echeance.commentaire = f"{echeance.commentaire}\n[ARCHIVÉ - Extension du contrat le {timezone.now().strftime('%d/%m/%Y')}]".strip()
                            echeance.save()
                        else:
                            # Annuler les échéances non payées et sans factures
                            echeance.statut = 'annule'
                            if not echeance.metadata:
                                echeance.metadata = {}
                            echeance.metadata['annulation_raison'] = 'Extension du contrat - Nouvelle échéance créée'
                            echeance.metadata['annulation_date'] = timezone.now().isoformat()
                            echeance.commentaire = f"{echeance.commentaire}\n[ANNULÉ - Extension du contrat le {timezone.now().strftime('%d/%m/%Y')}]".strip()
                            echeance.save()

                    # Créer les nouvelles échéances basées sur le nouveau montant total
                    for echeance_config in echeances_data:
                        try:
                            # Calculer les montants
                            pourcentage = float(echeance_config.get('pourcentage', 0))
                            montant_ht = (contrat.montant_ht * pourcentage) / 100
                            montant_tva = (contrat.montant_tva * pourcentage) / 100
                            montant_ttc = (contrat.montant_ttc * pourcentage) / 100

                            # Créer l'échéance avec métadonnées indiquant l'extension
                            EcheancierContrat.objects.create(
                                contrat=contrat,
                                type_echeance=echeance_config.get('type', 'tranche'),
                                numero_echeance=echeance_config.get('numero', 1),
                                montant_ht=montant_ht,
                                montant_tva=montant_tva,
                                montant_ttc=montant_ttc,
                                pourcentage=pourcentage,
                                date_echeance=echeance_config.get('date_echeance'),
                                commentaire=echeance_config.get('commentaire', ''),
                                metadata={
                                    'version': version_actuelle,
                                    'type': 'extension',
                                    'raison': 'Extension du contrat suite à l\'ajout de nouveaux devis',
                                    'date_creation': timezone.now().isoformat(),
                                    'devis_ajoutes': [d.numero for d in devis_list],
                                    'montant_anterieur': float(montant_ttc_avant),
                                    'montant_nouveau': float(contrat.montant_ttc)
                                }
                            )
                        except Exception as e:
                            print(f"Erreur lors de la création de l'échéance: {e}")
                            continue

                return Response(
                    ContratDetailSerializer(contrat).data,
                    status=status.HTTP_200_OK
                )

        except Exception as e:
            import traceback
            print(f"Erreur dans add_devis: {str(e)}")
            print(traceback.format_exc())
            return Response(
                {'error': f'Erreur lors de l\'ajout des devis: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class LigneContratViewSet(viewsets.ModelViewSet):
    """ViewSet pour les lignes de contrat"""
    queryset = LigneContrat.objects.all()
    serializer_class = LigneContratSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['contrat', 'type_ligne']


class LigneContratIntervenantViewSet(viewsets.ModelViewSet):
    """ViewSet pour les intervenants des lignes de contrat"""
    queryset = LigneContratIntervenant.objects.all()
    serializer_class = LigneContratIntervenantSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['ligne_contrat']


class EcheancierContratViewSet(viewsets.ModelViewSet):
    """ViewSet pour les échéances de contrat"""
    queryset = EcheancierContrat.objects.all()
    serializer_class = EcheancierContratSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['contrat']
    ordering_fields = ['date_echeance', 'numero_echeance']
    ordering = ['numero_echeance']

    def get_serializer_class(self):
        if self.action == 'create':
            return EcheancierContratCreateSerializer
        return EcheancierContratSerializer

    @action(detail=True, methods=['post'])
    def marquer_paye(self, request, pk=None, contrat_pk=None):
        """Marquer une échéance comme payée"""
        echeance = self.get_object()
        date_paiement = request.data.get('date_paiement')
        
        echeance.marquer_comme_paye(date_paiement)
        
        return Response({'message': 'Échéance marquée comme payée'})

    @action(detail=True, methods=['post'])
    def envoyer_alerte(self, request, pk=None, contrat_pk=None):
        """Envoyer une alerte pour une échéance"""
        echeance = self.get_object()
        
        if echeance.doit_alerter:
            echeance.envoyer_alerte()
            return Response({'message': 'Alerte envoyée avec succès'})
        else:
            return Response(
                {'error': 'Cette échéance ne nécessite pas d\'alerte'},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['post'])
    def generer_echeancier_standard(self, request, contrat_pk=None):
        """Générer un échéancier standard pour un contrat"""
        contrat_id = request.data.get('contrat') or contrat_pk
        type_echeancier = request.data.get('type', 'standard')  # standard, acompte_solde, etc.
        echeances_contrat = request.data.get('echeances', [])
        
        try:
            contrat = Contrat.objects.get(id=contrat_id)
            
            # Supprimer les échéances existantes
            contrat.echeances.all().delete()
            echeances = []
            if type_echeancier == 'standard':
                # Échéancier standard : 30% à la commande, 70% à la livraison
                for echeance in echeances_contrat:
                    echeances.append(echeance)
            elif type_echeancier == 'tranches':
                # Échéancier en tranches : 25% à la commande, 25% à mi-parcours, 50% à la livraison
                from datetime import timedelta
                # mi_parcours = contrat.date_debut + (contrat.date_fin - contrat.date_debut) / 2
                for i in range(len(echeances_contrat)):
                    echeances.append(echeances_contrat[i])
                    if i == 1:
                        echeances[i]['date_echeance'] = contrat.date_debut + (contrat.date_fin - contrat.date_debut) / 2
            # Créer les échéances
            for echeance_data in echeances:
                # Calculer les montants basés sur le pourcentage
                pourcentage = echeance_data.get('pourcentage', 0)
                montant_ttc = (contrat.montant_ttc * pourcentage) / 100
                montant_ht = (contrat.montant_ht * pourcentage) / 100
                montant_tva = (contrat.montant_tva * pourcentage) / 100
                
                EcheancierContrat.objects.create(
                    contrat=contrat,
                    montant_ht=montant_ht,
                    montant_tva=montant_tva,
                    montant_ttc=montant_ttc,
                    **echeance_data
                )
            
            return Response({'message': f'Échéancier {type_echeancier} généré avec succès'})
            
        except Contrat.DoesNotExist:
            return Response(
                {'error': 'Contrat introuvable'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'Erreur lors de la génération: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def alertes_quotidiennes(self, request):
        """Récupérer les alertes quotidiennes pour les échéances"""
        today = date.today()
        
        # Échéances à échéance dans 3 jours
        echeances_3_jours = EcheancierContrat.objects.filter(
            date_echeance=today + timedelta(days=3),
            statut='en_attente',
            alerte_envoyee=False
        ).select_related('contrat', 'contrat__client')
        
        # Échéances en retard
        echeances_retard = EcheancierContrat.objects.filter(
            date_echeance__lt=today,
            statut='en_attente'
        ).select_related('contrat', 'contrat__client')
        
        return Response({
            'echeances_3_jours': EcheancierContratSerializer(echeances_3_jours, many=True).data,
            'echeances_retard': EcheancierContratSerializer(echeances_retard, many=True).data,
            'total_alertes': echeances_3_jours.count() + echeances_retard.count()
        })


class AvenantViewSet(viewsets.ModelViewSet):
    """ViewSet pour les avenants de contrats"""
    queryset = Avenant.objects.all()
    serializer_class = AvenantSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['contrat', 'statut', 'type_modification']
    search_fields = ['numero', 'intitule_avenant', 'objet_avenant']
    ordering_fields = ['date_creation', 'date_signature', 'numero']
    ordering = ['-date_creation']

    def get_serializer_class(self):
        
        if self.action == 'create':
            return AvenantCreateSerializer
        elif self.action in ['retrieve', 'update', 'partial_update']:
            return AvenantDetailSerializer
        return AvenantSerializer

    @action(detail=False,methods=['post'], url_path='store')
    def store(self, request):
        serializer = AvenantCreateSerializer(data=request.data)
        if serializer.is_valid():
            contrat = serializer.save()
            return Response(AvenantCreateSerializer(contrat).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'])
    def download_pdf(self, request, pk=None, contrat_pk=None):
        """Télécharger le PDF d'un avenant"""
        avenant = self.get_object()
        try:
            html_string = render_to_string('contrats/print_avenant.html', {
                'avenant': avenant
            })
            font_config = FontConfiguration()
            html_doc = HTML(string=html_string)
            pdf = html_doc.write_pdf(font_config=font_config)
            response = HttpResponse(pdf, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="avenant_{avenant.numero}.pdf"'
            return response
            
        except Exception as e:
            return Response(
                {'error': f'Erreur lors de la génération du PDF: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
    @action(detail=True, methods=['post'])
    def update_content(self, request, pk=None, contrat_pk=None):
        """Mettre à jour le contenu personnalisé d'un avenant"""
        avenant = self.get_object()
        contenu_personnalise = request.data.get('contenu_personnalise')
        
        if not contenu_personnalise:
            return Response(
                {'error': 'Contenu personnalisé requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        avenant.contenu_personnalise = contenu_personnalise
        avenant.save()
        
        return Response({
            'message': 'Contenu mis à jour avec succès'
        })

    @action(detail=True, methods=['post'])
    def envoyer(self, request, pk=None, contrat_pk=None):
        """
        Envoyer un avenant (changer le statut à envoyé et envoyer le PDF par email)
        """
        avenant = self.get_object()
        avenant.statut = 'envoye'
        avenant.save()

        # Générer le PDF du contrat
        try:
            html_string = render_to_string('contrats/print_avenant.html', {
                'avenant': avenant
            })
            font_config = FontConfiguration()
            html_doc = HTML(string=html_string)
            pdf = html_doc.write_pdf(font_config=font_config)
        except Exception as e:
            return Response(
                {'error': f'Erreur lors de la génération du PDF: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # Préparer l'email
        destinataire = None
        # On tente de récupérer l'email du client lié au contrat
        if hasattr(avenant.contrat.client, 'user') and hasattr(avenant.contrat.client.user, 'email'):
            destinataire = avenant.contrat.client.user.email
        elif hasattr(avenant.contrat.client, 'email'):
            destinataire = avenant.contrat.client.email

        if not destinataire:
            return Response(
                {'error': "Impossible de trouver l'email du client pour l'envoi du contrat."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Utiliser le service de template d'email
        context = EmailTemplateService.prepare_avenant_context(avenant)
        result = EmailTemplateService.send_templated_email(
            'avenant',
            context,
            destinataire,
            {
                'name': f'avenant_{avenant.numero}.pdf',
                'content': pdf,
                'mime_type': 'application/pdf'
            }
        )
        
        if not result['success']:
            return Response(
                {'error': result['error']},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        return Response({
            'message': 'Avenant envoyé avec succès (PDF envoyé par email)',
            'statut': avenant.statut
        })


    @action(
        detail=True,
        methods=['post'],
        parser_classes=[MultiPartParser, FormParser],
        url_path='signer'
    )
    def signer(self, request, pk=None, contrat_pk=None):
        """Signer un avenant en uploadant le fichier signé"""
        avenant = self.get_object()
        
        if avenant.statut != 'envoye':
            return Response(
                {'error': 'Seuls les avenants envoyés peuvent être signés'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        fichier_signe = request.FILES.get('fichier_signe')
        if not fichier_signe:
            return Response(
                {'error': 'Fichier signé requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Sauvegarder le fichier
            avenant.fichier_signe = fichier_signe
            avenant.statut = 'signe'
            avenant.date_signature = timezone.now().date()
            avenant.save()
            
            return Response({
                'message': 'Avenant signé avec succès',
                'statut': avenant.statut,
                'date_signature': avenant.date_signature
            })
            
        except Exception as e:
            return Response(
                {'error': f'Erreur lors de la signature: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def annuler(self, request, pk=None, contrat_pk=None):
        """Annuler un avenant"""
        avenant = self.get_object()
        
        if avenant.statut in ['signe', 'annule']:
            return Response(
                {'error': 'Les avenants signés ou annulés ne peuvent pas être annulés'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        avenant.statut = 'annule'
        avenant.save()
        
        return Response({
            'message': 'Avenant annulé avec succès',
            'statut': avenant.statut
        })

    @action(detail=False, methods=['get'])
    def by_contrat(self, request):
        """Récupérer tous les avenants d'un contrat spécifique"""
        contrat_id = request.query_params.get('contrat_id')
        if not contrat_id:
            return Response(
                {'error': 'Le paramètre contrat_id est requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            avenants = Avenant.objects.filter(contrat_id=contrat_id).order_by('-date_creation')
            serializer = AvenantSerializer(avenants, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': f'Erreur lors de la récupération des avenants: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )