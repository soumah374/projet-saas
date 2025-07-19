from django.shortcuts import render
from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.response import Response
from .models import Service, IntervenantProfile, Category
from .serializers import ServiceSerializer, IntervenantProfileSerializer, CategorySerializer
from rest_framework.decorators import action

# Create your views here.

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all().order_by('name')
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    

class IntervenantProfileViewSet(viewsets.ModelViewSet):
    queryset = IntervenantProfile.objects.all().order_by('name')
    serializer_class = IntervenantProfileSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

class ServiceViewSet(viewsets.ModelViewSet):
    queryset = Service.objects.all().order_by('-created_at')
    serializer_class = ServiceSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['category', 'is_active', 'profile_intervenant']
    search_fields = ['name', 'description', 'category__name']
    
    @action(detail=False, methods=['get'],url_path='category/(?P<category_id>\d+)/services')
    def get_services_by_category(self, request, category_id=None):
        services = Service.objects.filter(category=category_id)
        serializer = ServiceSerializer(services, many=True)
        return Response(serializer.data)
