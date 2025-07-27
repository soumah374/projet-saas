from django.shortcuts import render
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.core.mail import EmailMessage
from django.conf import settings
from django.template.loader import render_to_string
import base64
import tempfile
import os
from decimal import Decimal
from .models import Devis, LigneDevis, LigneDevisIntervenant
from .serializers import (
    DevisSerializer, DevisCreateSerializer,
    LigneDevisSerializer, LigneDevisCreateSerializer,
    LigneDevisIntervenantSerializer, LigneDevisIntervenantCreateSerializer,
    DevisAvecLignesSerializer, LigneDevisAvecIntervenantsSerializer
)
from catalog.models import Activity, TauxHoraire, LigneFrais
from .models import LigneDevis


class DevisViewSet(viewsets.ModelViewSet):
    """ViewSet pour la gestion des devis"""
    
    queryset = Devis.objects.select_related('client').prefetch_related('lignes').all()
    serializer_class = DevisSerializer
    permission_classes = [permissions.IsAdminUser]
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
            # Valider les données du devis
            devis_serializer = DevisAvecLignesSerializer(data=request.data)
            devis_serializer.is_valid(raise_exception=True)
            devis_data = devis_serializer.validated_data
            
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

            # Valider et créer les lignes
            lignes_data = request.data.get('lignes', [])
            for ligne_data in lignes_data:
                # Valider la ligne avec le nouveau sérialiseur
                ligne_serializer = LigneDevisAvecIntervenantsSerializer(data=ligne_data)
                ligne_serializer.is_valid(raise_exception=True)
                validated_ligne_data = ligne_serializer.validated_data
                
                if ligne_data['type_ligne'] == 'prestation':
                    ligne = LigneDevis.objects.create(
                        devis=devis,
                        type_ligne='prestation',
                        service_id=ligne_data['service_id'],
                        activity_id=ligne_data['activity_id'],
                        description=ligne_data.get('description', ''),
                        quantite=ligne_data['quantite'],
                        unite_id=ligne_data['unite_id'],
                        prix_unitaire_ht=ligne_data['prix_unitaire_ht']
                    )
                    
                    # Créer les intervenants
                    for intervenant_data in ligne_data.get('intervenants', []):
                        LigneDevisIntervenant.objects.create(
                            ligne_devis=ligne,
                            profile_intervenant_id=intervenant_data['profile_intervenant_id'],
                            temps_intervenant=temps_intervenant,
                            taux_horaire=taux_horaire
                        )
                    
                elif ligne_data['type_ligne'] == 'frais':
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
                    # Le montant_ht sera calculé automatiquement dans save()
                else:
                    raise Exception('Type de ligne inconnu')

            # Retourner le devis complet
            return Response(DevisSerializer(devis).data, status=201)
        except Exception as e:
            return Response({'error': str(e)}, status=400)
    
    @action(detail=True, methods=['post'])
    def envoyer(self, request, pk=None):
        """Envoyer un devis (changer le statut en 'envoye')"""
        devis = self.get_object()
        devis.statut = 'envoye'
        devis.save()
        return Response({'status': 'Devis envoyé'})
    
    @action(detail=True, methods=['post'])
    def envoyer_email_pdf(self, request, pk=None):
        """Envoyer un devis par email avec le PDF généré par jsPDF"""
        devis = self.get_object()
        
        # Récupérer les données de l'email
        email_destinataire = request.data.get('email_destinataire')
        sujet = request.data.get('sujet', f'Devis {devis.numero} - {devis.client.nom_complet}')
        message = request.data.get('message', '')
        pdf_data = request.data.get('pdf_data')
        
        if not email_destinataire:
            return Response({'error': 'Email destinataire requis'}, status=400)
        
        if not pdf_data:
            return Response({'error': 'Données PDF requises'}, status=400)
        
        # try:
        # Décoder les données PDF base64
        if pdf_data.startswith('data:application/pdf;base64,'):
            pdf_base64 = pdf_data.split(',')[1]
        else:
            pdf_base64 = pdf_data
        
        pdf_content = base64.b64decode(pdf_base64)
        
        # Créer un fichier temporaire pour le PDF
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
            temp_file.write(pdf_content)
            temp_file_path = temp_file.name
        
        # Préparer le message email
        message_complet = self.prepare_email_message(devis, message)
        
        # Créer l'email avec pièce jointe
        email = EmailMessage(
            subject=sujet,
            body=message_complet,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[email_destinataire]
        )
        
        print("Email created", email)
        # Attacher le PDF
        with open(temp_file_path, 'rb') as pdf_file:
            email.attach(
                f'devis-{devis.numero}.pdf',
                pdf_file.read(),
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
            
        # except Exception as e:
        #     # Nettoyer le fichier temporaire en cas d'erreur
        #     if 'temp_file_path' in locals():
        #         try:
        #             os.unlink(temp_file_path)
        #         except:
        #             pass
            
            # return Response({'error': str(e)}, status=400)
    
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


class LigneDevisViewSet(viewsets.ModelViewSet):
    """ViewSet pour la gestion des lignes de devis"""
    
    queryset = LigneDevis.objects.select_related('service', 'activity', 'frais_category', 'ligne_frais', 'unite').all()
    serializer_class = LigneDevisSerializer
    permission_classes = [permissions.IsAdminUser]
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
    permission_classes = [permissions.IsAdminUser]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['ligne_devis', 'profile_intervenant']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return LigneDevisIntervenantCreateSerializer
        return LigneDevisIntervenantSerializer
    
    def perform_create(self, serializer):
        """The serializer now handles devis_id automatically"""
        serializer.save()
