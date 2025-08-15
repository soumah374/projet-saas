from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.views import View
from django.db.models import Count, Q, Avg, Sum
from django.utils import timezone
from datetime import timedelta
import json

from .services import DashboardMetricsService
from projects.models import Project, ProjectTask
from users.models import User
from teams.models import Team
from contrats.models import Contrat
from devis.models import Devis
from billings.models import Facture


@method_decorator(csrf_exempt, name='dispatch')
class DashboardOverviewView(View):
    """Vue pour récupérer les métriques globales du tableau de bord"""
    
    def get(self, request):
        try:
            # Récupérer la période depuis les paramètres
            period_days = int(request.GET.get('period_days', 30))
            
            # Calculer les dates de début et fin
            end_date = timezone.now()
            start_date = end_date - timedelta(days=period_days)
            
            # Initialiser le service
            metrics_service = DashboardMetricsService()
            
            # Récupérer toutes les métriques
            overview_data = {
                'projects': metrics_service.get_projects_metrics(start_date, end_date),
                'financial': metrics_service.get_financial_metrics(start_date, end_date),
                'performance': metrics_service.get_performance_metrics(start_date, end_date),
                'calendar': metrics_service.get_calendar_metrics(start_date, end_date),
                'last_updated': timezone.now().isoformat()
            }
            
            return JsonResponse(overview_data, safe=False)
            
        except Exception as e:
            return JsonResponse({
                'error': str(e),
                'message': 'Erreur lors de la récupération des métriques du tableau de bord'
            }, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class DashboardProjectsView(View):
    """Vue pour récupérer les métriques spécifiques aux projets"""
    
    def get(self, request):
        try:
            period_days = int(request.GET.get('period_days', 30))
            end_date = timezone.now()
            start_date = end_date - timedelta(days=period_days)
            
            metrics_service = DashboardMetricsService()
            projects_data = metrics_service.get_projects_metrics(start_date, end_date)
            
            return JsonResponse(projects_data, safe=False)
            
        except Exception as e:
            return JsonResponse({
                'error': str(e),
                'message': 'Erreur lors de la récupération des métriques des projets'
            }, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class DashboardFinancialView(View):
    """Vue pour récupérer les métriques financières"""
    
    def get(self, request):
        try:
            period_days = int(request.GET.get('period_days', 30))
            end_date = timezone.now()
            start_date = end_date - timedelta(days=period_days)
            
            metrics_service = DashboardMetricsService()
            financial_data = metrics_service.get_financial_metrics(start_date, end_date)
            
            return JsonResponse(financial_data, safe=False)
            
        except Exception as e:
            return JsonResponse({
                'error': str(e),
                'message': 'Erreur lors de la récupération des métriques financières'
            }, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class DashboardPerformanceView(View):
    """Vue pour récupérer les métriques de performance"""
    
    def get(self, request):
        try:
            period_days = int(request.GET.get('period_days', 30))
            end_date = timezone.now()
            start_date = end_date - timedelta(days=period_days)
            
            metrics_service = DashboardMetricsService()
            performance_data = metrics_service.get_performance_metrics(start_date, end_date)
            
            return JsonResponse(performance_data, safe=False)
            
        except Exception as e:
            return JsonResponse({
                'error': str(e),
                'message': 'Erreur lors de la récupération des métriques de performance'
            }, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class DashboardCalendarView(View):
    """Vue pour récupérer les métriques du calendrier"""
    
    def get(self, request):
        try:
            period_days = int(request.GET.get('period_days', 30))
            end_date = timezone.now()
            start_date = end_date - timedelta(days=period_days)
            
            metrics_service = DashboardMetricsService()
            calendar_data = metrics_service.get_calendar_metrics(start_date, end_date)
            
            return JsonResponse(calendar_data, safe=False)
            
        except Exception as e:
            return JsonResponse({
                'error': str(e),
                'message': 'Erreur lors de la récupération des métriques du calendrier'
            }, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class DashboardRefreshView(View):
    """Vue pour forcer le rafraîchissement des métriques"""
    
    def post(self, request):
        try:
            # Forcer le recalcul des métriques
            metrics_service = DashboardMetricsService()
            
            # Optionnel : recalculer et stocker les métriques
            # metrics_service.refresh_all_metrics()
            
            return JsonResponse({
                'message': 'Métriques rafraîchies avec succès',
                'timestamp': timezone.now().isoformat()
            })
            
        except Exception as e:
            return JsonResponse({
                'error': str(e),
                'message': 'Erreur lors du rafraîchissement des métriques'
            }, status=500) 