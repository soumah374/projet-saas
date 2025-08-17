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
    
    @action(detail=False, methods=['get'],url_path='category/(?P<category_id>\d+)/services')
    def get_services_by_category(self, request, category_id=None):
        services = Service.objects.filter(category=category_id)
        serializer = ServiceSerializer(services, many=True)
        return Response(serializer.data)


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