from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404
from .models import ApplicationConfig
from .serializers import ApplicationConfigSerializer, ApplicationConfigPublicSerializer


class ApplicationConfigDetailView(generics.RetrieveUpdateAPIView):
    """
    Vue pour récupérer et mettre à jour la configuration de l'application.
    Seuls les administrateurs peuvent modifier la configuration.
    """
    serializer_class = ApplicationConfigSerializer
    parser_classes = [MultiPartParser, FormParser]
    queryset = ApplicationConfig.objects.all()
    
    def get_permissions(self):
        """
        Permissions: lecture pour tous les utilisateurs authentifiés,
        écriture pour les super utilisateurs uniquement
        """
        if self.request.method in ['PUT', 'PATCH']:
            permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def get_object(self):
        """Récupère ou crée la configuration de l'application"""
        return ApplicationConfig.get_config()
    
    def perform_update(self, serializer):
        """Sauvegarde la configuration mise à jour"""
        serializer.save()


@api_view(['GET'])
@permission_classes([])  # Accessible sans authentification
def application_config_public(request):
    """
    Endpoint public pour récupérer les informations de base de l'application.
    Accessible sans authentification pour permettre l'affichage du nom et logo
    sur la page de connexion.
    """
    config = ApplicationConfig.get_config()
    serializer = ApplicationConfigPublicSerializer(config, context={'request': request})
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated, permissions.IsAdminUser])
def upload_logo(request):
    """
    Endpoint pour télécharger uniquement le logo de l'application
    """
    config = ApplicationConfig.get_config()
    
    if 'logo' not in request.FILES:
        return Response(
            {'error': 'Aucun fichier logo fourni'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    config.logo = request.FILES['logo']
    config.save()
    
    serializer = ApplicationConfigSerializer(config, context={'request': request})
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated, permissions.IsAdminUser])
def upload_favicon(request):
    """
    Endpoint pour télécharger uniquement le favicon de l'application
    """
    config = ApplicationConfig.get_config()
    
    if 'favicon' not in request.FILES:
        return Response(
            {'error': 'Aucun fichier favicon fourni'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    config.favicon = request.FILES['favicon']
    config.save()
    
    serializer = ApplicationConfigSerializer(config, context={'request': request})
    return Response(serializer.data)


@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated, permissions.IsAdminUser])
def delete_logo(request):
    """
    Endpoint pour supprimer le logo de l'application
    """
    config = ApplicationConfig.get_config()
    
    if config.logo:
        config.logo.delete()
        config.logo = None
        config.save()
    
    serializer = ApplicationConfigSerializer(config, context={'request': request})
    return Response(serializer.data)


@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated, permissions.IsAdminUser])
def delete_favicon(request):
    """
    Endpoint pour supprimer le favicon de l'application
    """
    config = ApplicationConfig.get_config()
    
    if config.favicon:
        config.favicon.delete()
        config.favicon = None
        config.save()
    
    serializer = ApplicationConfigSerializer(config, context={'request': request})
    return Response(serializer.data)
