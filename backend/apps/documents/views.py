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
    filterset_fields = ['document_type', 'is_public', 'category']
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'updated_at', 'title']
    ordering = ['-created_at']
    
    def perform_create(self, serializer):
        """Créer un document avec l'utilisateur connecté"""
        serializer.save(uploaded_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def make_public(self, request, pk=None):
        """Rendre un document public"""
        document = self.get_object()
        document.is_public = True
        document.save()
        return Response({'message': 'Document rendu public avec succès'})
    
    @action(detail=True, methods=['post'])
    def make_private(self, request, pk=None):
        """Rendre un document privé"""
        document = self.get_object()
        document.is_public = False
        document.save()
        return Response({'message': 'Document rendu privé'}) 