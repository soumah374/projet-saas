from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters

from .models import Document
from .serializers import DocumentSerializer


class DocumentViewSet(viewsets.ModelViewSet):
    """ViewSet pour la gestion des documents"""
    
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['type', 'is_shared']
    search_fields = ['name', 'description']
    ordering_fields = ['created_at', 'updated_at', 'name']
    ordering = ['-created_at']
    
    def perform_create(self, serializer):
        """Créer un document avec l'utilisateur connecté"""
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def share(self, request, pk=None):
        """Partager un document"""
        document = self.get_object()
        document.is_shared = True
        document.save()
        return Response({'message': 'Document partagé avec succès'})
    
    @action(detail=True, methods=['post'])
    def unshare(self, request, pk=None):
        """Ne plus partager un document"""
        document = self.get_object()
        document.is_shared = False
        document.save()
        return Response({'message': 'Document non partagé'}) 