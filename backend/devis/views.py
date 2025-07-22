from django.shortcuts import render
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import Devis, LigneDevis, LigneDevisIntervenant
from .serializers import (
    DevisSerializer, DevisCreateSerializer,
    LigneDevisSerializer, LigneDevisCreateSerializer,
    LigneDevisIntervenantSerializer, LigneDevisIntervenantCreateSerializer
)
from catalog.models import Activity, IntervenantProfile, TauxHoraire


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
            # Créer le devis
            devis_data = {
                'client_id': request.data.get('client_id'),
                'date_validite': request.data.get('date_validite'),
                'notes': request.data.get('notes', ''),
                'conditions': request.data.get('conditions', '')
            }
            
            devis_serializer = DevisCreateSerializer(data=devis_data)
            devis_serializer.is_valid(raise_exception=True)
            devis = devis_serializer.save()
            
            # Créer les lignes
            lignes_data = request.data.get('lignes', [])
            for ligne_data in lignes_data:
                ligne = devis.ajouter_ligne(
                    service_id=ligne_data['service_id'],
                    activity_id=ligne_data['activity_id'],
                    description=ligne_data.get('description', ''),
                    quantite=ligne_data['quantite'],
                    unite_id=ligne_data['unite_id']
                )
                
                # Créer les intervenants pour cette ligne
                for intervenant_data in ligne_data.get('intervenants', []):
                    ligne.intervenants.create(
                        profile_intervenant_id=intervenant_data['profile_intervenant_id'],
                        temps_intervenant=intervenant_data['temps_intervenant'],
                        taux_horaire=intervenant_data['taux_horaire']
                    )
                
                # Recalculer le prix unitaire de la ligne après avoir ajouté tous les intervenants
                if ligne.intervenants.exists():
                    total_intervenants = sum(interv.montant_intervenant for interv in ligne.intervenants.all())
                    ligne.prix_unitaire_ht = total_intervenants
                    ligne.save()
            
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
    
    queryset = LigneDevis.objects.select_related('service', 'activity', 'unite').prefetch_related('intervenants').all()
    serializer_class = LigneDevisSerializer
    permission_classes = [permissions.IsAdminUser]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['devis', 'service', 'activity', 'unite']
    ordering_fields = ['created_at']
    ordering = ['created_at']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return LigneDevisCreateSerializer
        return LigneDevisSerializer
    
    def perform_create(self, serializer):
        """Automatically set the devis ID from the request data"""
        devis_id = self.request.data.get('devis_id')
        if devis_id:
            devis = Devis.objects.get(id=devis_id)
            serializer.save(devis=devis)
        else:
            serializer.save()
    
    @action(detail=False, methods=['get'])
    def activites_by_service(self, request):
        """Récupérer les activités d'un service"""
        service_id = request.query_params.get('service_id')
        if service_id:
            activites = Activity.objects.filter(service_id=service_id, is_active=True)
            return Response({
                'activites': [
                    {'id': a.id, 'intitule': a.name, 'description': ''}
                    for a in activites
                ]
            })
        return Response({'activites': []})
    
    @action(detail=False, methods=['get'])
    def intervenants_with_activite(self, request):
        """Récupérer les intervenants d'une activité avec leurs taux horaires"""
        activity_id = request.query_params.get('activity_id')
        if activity_id:
            try:
                activity = Activity.objects.get(id=activity_id)
                intervenants = []
                
                for profile in activity.profiles_intervenant.all():
                    # Récupérer le taux horaire pour cette activité et ce profil
                    try:
                        taux = TauxHoraire.objects.get(
                            activity=activity,
                            profile_intervenant=profile
                        )
                        taux_horaire = taux.taux_heure
                    except TauxHoraire.DoesNotExist:
                        taux_horaire = 0
                    
                    temps_intervenant = activity.activityprofile_set.get(
                        profile_intervenant=profile
                    ).temps_intervenant
                    
                    
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
