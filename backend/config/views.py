from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.db import connection
from django.core.cache import cache
from django.conf import settings
import os
from datetime import datetime
from .health_utils import get_system_info


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """
    Endpoint de health check pour vérifier l'état du serveur
    """
    health_status = {
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0',
        'environment': settings.DEBUG and 'development' or 'production',
        'checks': {}
    }
    
    # Vérifier la base de données
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        health_status['checks']['database'] = {
            'status': 'healthy',
            'message': 'Database connection successful'
        }
    except Exception as e:
        health_status['checks']['database'] = {
            'status': 'unhealthy',
            'message': f'Database connection failed: {str(e)}'
        }
        health_status['status'] = 'unhealthy'
    
    # Vérifier le cache
    try:
        cache.set('health_check', 'ok', 10)
        cache_result = cache.get('health_check')
        if cache_result == 'ok':
            health_status['checks']['cache'] = {
                'status': 'healthy',
                'message': 'Cache is working'
            }
        else:
            health_status['checks']['cache'] = {
                'status': 'unhealthy',
                'message': 'Cache is not working properly'
            }
            health_status['status'] = 'unhealthy'
    except Exception as e:
        health_status['checks']['cache'] = {
            'status': 'unhealthy',
            'message': f'Cache check failed: {str(e)}'
        }
        health_status['status'] = 'unhealthy'
    
    # Informations système
    health_status['system'] = get_system_info()
    
    # Déterminer le code de statut HTTP
    http_status = status.HTTP_200_OK if health_status['status'] == 'healthy' else status.HTTP_503_SERVICE_UNAVAILABLE
    
    return Response(health_status, status=http_status)


@api_view(['GET'])
@permission_classes([AllowAny])
def api_root(request):
    """
    Endpoint racine de l'API
    """
    return Response({
        'message': 'SAKOM API v1.0.0',
        'endpoints': {
            'health': '/api/v1/health/',
            'auth': '/api/v1/login/',
            'projects': '/api/v1/projects/',
            'users': '/api/v1/users/',
            'teams': '/api/v1/teams/',
            'documents': '/api/v1/documents/',
        },
        'documentation': '/api/docs/',
        'schema': '/api/schema/',
    }) 