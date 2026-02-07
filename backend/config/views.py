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
from contrats.models import Contrat
from django.shortcuts import render
from django.http import HttpResponse
from django.template.loader import render_to_string
from weasyprint import HTML, CSS
from weasyprint.text.fonts import FontConfiguration
# from django.shortcuts import render
from devis.models import Devis, LigneDevis


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
        'message': 'project_saas API v1.0.0',
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


def print_contrat(request, pk):
    """
    Endpoint pour l'impression d'un contrat en PDF
    """
    try:
        contrat = Contrat.objects.get(id=pk)
        
        from reportlab.pdfgen import canvas
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.units import cm
        from io import BytesIO
        from django.http import HttpResponse
        
        # Créer le PDF avec ReportLab
        buffer = BytesIO()
        p = canvas.Canvas(buffer, pagesize=A4)
        width, height = A4
        
        # Titre
        p.setFont("Helvetica-Bold", 16)
        p.drawString(2*cm, height-3*cm, f"CONTRAT - {contrat.numero}")
        
        # Informations du contrat
        p.setFont("Helvetica", 12)
        y_position = height-5*cm
        
        p.drawString(2*cm, y_position, f"Client: {contrat.client.nom_complet}")
        y_position -= 1*cm
        
        p.drawString(2*cm, y_position, f"Date de début: {contrat.date_debut.strftime('%d/%m/%Y')}")
        y_position -= 1*cm
        
        p.drawString(2*cm, y_position, f"Date de fin: {contrat.date_fin.strftime('%d/%m/%Y')}")
        y_position -= 1*cm
        
        p.drawString(2*cm, y_position, f"Montant TTC: {contrat.montant_ttc:.2f} €")
        y_position -= 1*cm
        
        p.drawString(2*cm, y_position, f"Statut: {contrat.get_statut_display()}")
        y_position -= 2*cm
        
        # Contenu personnalisé
        if contrat.contenu_personnalise:
            p.setFont("Helvetica-Bold", 12)
            p.drawString(2*cm, y_position, "Contenu personnalisé:")
            y_position -= 1*cm
            
            p.setFont("Helvetica", 10)
            # Diviser le texte en lignes
            text_lines = contrat.contenu_personnalise.split('\n')
            for line in text_lines:
                if y_position < 2*cm:  # Nouvelle page si nécessaire
                    p.showPage()
                    p.setFont("Helvetica", 10)
                    y_position = height-3*cm
                
                p.drawString(2*cm, y_position, line[:80])  # Limiter la largeur
                y_position -= 0.5*cm
        
        p.save()
        pdf = buffer.getvalue()
        buffer.close()
        
        # Créer la réponse HTTP
        response = HttpResponse(pdf, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="contrat_{contrat.numero}.pdf"'
        
        return response
        
    except Contrat.DoesNotExist:
        return HttpResponse('Contrat introuvable', status=404)
    except Exception as e:
        return HttpResponse(f'Erreur lors de la génération du PDF: {str(e)}', status=500)
 