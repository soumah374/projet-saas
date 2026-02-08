from django.shortcuts import render
from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.response import Response
from .models import Service, Category, Activity, IntervenantProfile, TauxHoraire, UniteStandard, FraisCategory, LigneFrais
from .serializers import (
    ServiceSerializer, 
    ServiceDetailSerializer,
    CategorySerializer, 
    ActivitySerializer, 
    IntervenantProfileSerializer, 
    TauxHoraireSerializer,
    UniteStandardSerializer,
    FraisCategorySerializer,
    LigneFraisSerializer
)
from rest_framework.decorators import action
from rest_framework import status
import json

# Create your views here.

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all().order_by('name')
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]

class UniteStandardViewSet(viewsets.ModelViewSet):
    queryset = UniteStandard.objects.all().order_by('intitule')
    serializer_class = UniteStandardSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['is_active']
    search_fields = ['intitule', 'code', 'description']

class IntervenantProfileViewSet(viewsets.ModelViewSet):
    queryset = IntervenantProfile.objects.all().order_by('name')
    serializer_class = IntervenantProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

class ActivityViewSet(viewsets.ModelViewSet):
    queryset = Activity.objects.all().order_by('-created_at')
    serializer_class = ActivitySerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['service', 'profiles_intervenant', 'is_active']
    search_fields = ['name', 'service__name', 'profiles_intervenant__name']
    
    @action(detail=False, methods=['post'], url_path='bulk-import')
    def bulk_import(self, request):
        """
        Import multiple activities at once.
        Expected payload:
        {
            "activities": [
                {
                    "name": "Activity Name",
                    "duree_standard": 2.5,
                    "service_id": 1,
                    "is_active": true
                },
                ...
            ]
        }
        """
        activities_data = request.data.get('activities', [])
        
        if not activities_data:
            return Response(
                {'error': 'Aucune activité fournie pour l\'import'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        imported_activities = []
        errors = []
        
        for index, activity_data in enumerate(activities_data):
            try:
                # Validation des champs requis
                if not activity_data.get('name'):
                    errors.append({
                        'index': index,
                        'error': 'Le nom de l\'activité est requis'
                    })
                    continue
                
                # if not activity_data.get('duree_standard'):
                #     errors.append({
                #         'index': index,
                #         'name': activity_data.get('name', 'Nom inconnu'),
                #         'error': 'La durée standard est requise'
                #     })
                #     continue
                
                if not activity_data.get('service_id'):
                    errors.append({
                        'index': index,
                        'name': activity_data.get('name', 'Nom inconnu'),
                        'error': 'Le service est requis'
                    })
                    continue
                
                # Vérifier si l'activité existe déjà
                if Activity.objects.filter(name=activity_data['name']).exists():
                    errors.append({
                        'index': index,
                        'name': activity_data['name'],
                        'error': 'Une activité avec ce nom existe déjà'
                    })
                    continue
                
                # Validation du service
                try:
                    service = Service.objects.get(id=activity_data['service_id'])
                except Service.DoesNotExist:
                    errors.append({
                        'index': index,
                        'name': activity_data['name'],
                        'error': f'Service avec l\'ID {activity_data["service_id"]} introuvable'
                    })
                    continue
                
                # Créer l'activité
                activity = Activity.objects.create(
                    name=activity_data['name'],
                    duree_standard=activity_data.get('duree_standard', 1),
                    service=service,
                    is_active=activity_data.get('is_active', True)
                )
                
                imported_activities.append({
                    'id': activity.id,
                    'name': activity.name,
                    'duree_standard': float(activity.duree_standard),
                    'service': activity.service.name
                })
                
            except Exception as e:
                errors.append({
                    'index': index,
                    'name': activity_data.get('name', 'Nom inconnu'),
                    'error': str(e)
                })
        
        return Response({
            'success_count': len(imported_activities),
            'error_count': len(errors),
            'imported_activities': imported_activities,
            'errors': errors
        }, status=status.HTTP_200_OK)

class TauxHoraireViewSet(viewsets.ModelViewSet):
    queryset = TauxHoraire.objects.all().order_by('-created_at')
    serializer_class = TauxHoraireSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['niveau_intervenant', 'activity', 'profile_intervenant', 'is_active']
    search_fields = ['activity__name', 'profile_intervenant__name']

class ServiceViewSet(viewsets.ModelViewSet):
    queryset = Service.objects.all().order_by('-created_at')
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['category', 'is_active']
    search_fields = ['name', 'description', 'category__name']
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ServiceDetailSerializer
        return ServiceSerializer
    
    @action(detail=False, methods=['get'],url_path=r'category/(?P<category_id>\d+)/services')
    def get_services_by_category(self, request, category_id=None):
        services = Service.objects.filter(category=category_id)
        serializer = ServiceSerializer(services, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'], url_path='bulk-import-prestations')
    def bulk_import_prestation(self, request):
        """
        Import multiple prestations at once.
        Expected payload:
        {
            "services": [
                {
                    "name": "Prestation Name",
                    "description": "Prestation Description",
                    "category_id": 1,
                    "is_active": true
                },
                ...
            ]
        }
        """
        services_data = request.data.get('services', [])
        if not services_data:
            return Response(
                {'error': 'Aucune prestation fournie pour l\'import'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        imported_services = []
        errors = []
        
        for index, service_data in enumerate(services_data):
            try:
                # Validation des champs requis
                if not service_data.get('name') or not service_data.get('description'):
                    errors.append({
                        'index': index,
                        'error': 'Le nom et la description sont requis'
                    })
                    continue
                
                # Vérifier si la prestation existe déjà
                if Service.objects.filter(name=service_data['name']).exists():
                    errors.append({
                        'index': index,
                        'name': service_data['name'],
                        'error': 'Une prestation avec ce nom existe déjà'
                    })
                    continue
                
                # Validation de la catégorie si fournie
                category = None
                if service_data.get('category_id'):
                    try:
                        category = Category.objects.get(id=service_data['category_id'])
                    except Category.DoesNotExist:
                        errors.append({
                            'index': index,
                            'name': service_data['name'],
                            'error': f'Catégorie avec l\'ID {service_data["category_id"]} introuvable'
                        })
                        continue
                
                # Créer la prestation
                service = Service.objects.create(
                    name=service_data['name'],
                    description=service_data['description'],
                    category=category,
                    is_active=service_data.get('is_active', True)
                )
                
                imported_services.append({
                    'id': service.id,
                    'name': service.name,
                    'description': service.description
                })
                
            except Exception as e:
                errors.append({
                    'index': index,
                    'name': service_data.get('name', 'Nom inconnu'),
                    'error': str(e)
                })
        
        return Response({
            'success_count': len(imported_services),
            'error_count': len(errors),
            'imported_services': imported_services,
            'errors': errors
        }, status=status.HTTP_200_OK)


class FraisCategoryViewSet(viewsets.ModelViewSet):
    queryset = FraisCategory.objects.all().order_by('name')
    serializer_class = FraisCategorySerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['is_active']
    search_fields = ['name', 'description']

class LigneFraisViewSet(viewsets.ModelViewSet):
    queryset = LigneFrais.objects.all().order_by('-created_at')
    serializer_class = LigneFraisSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['type_frais', 'category', 'is_active']
    search_fields = ['description', 'category__name']