from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.db.models import Count, Q, Avg, Sum
from django.utils import timezone
from datetime import timedelta
import json
import logging

from .services import DashboardMetricsService
from projects.models import Project, ProjectTask
from users.models import User
from teams.models import Team
from contrats.models import Contrat
from devis.models import Devis
from billings.models import Facture

from .models import DashboardWidgetConfig

logger = logging.getLogger(__name__)


class DashboardWidgetPermissionMixin:
    """Mixin pour gérer les permissions des widgets du tableau de bord"""
    
    def _get_authorized_widgets(self, request, user_role):
        """Récupère les widgets autorisés pour l'utilisateur en fonction de ses permissions"""
        try:
            # Utiliser directement le service pour récupérer les widgets autorisés
            metrics_service = DashboardMetricsService(user=request.user)
            return metrics_service.get_authorized_widgets()
            
        except Exception as e:
            # En cas d'erreur, retourner une liste vide (sécurité par défaut)
            logger.error(f"Erreur lors de la récupération des widgets autorisés: {str(e)}")
            return []


class DashboardOverviewView(DashboardWidgetPermissionMixin, APIView):
    """Vue pour récupérer les métriques globales du tableau de bord"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            # Récupérer la période depuis les paramètres
            period_days = int(request.GET.get('period_days', 30))
            
            # Calculer les dates de début et fin
            end_date = timezone.now()
            start_date = end_date - timedelta(days=period_days)
            
            # Initialiser le service avec l'utilisateur connecté
            metrics_service = DashboardMetricsService(user=request.user)
            
            # Utiliser la méthode get_overview_metrics qui gère automatiquement les widgets autorisés
            overview_data = metrics_service.get_overview_metrics(start_date, end_date)
            
            return Response(overview_data)
            
        except Exception as e:
            return Response({
                'error': str(e),
                'message': 'Erreur lors de la récupération des métriques du tableau de bord'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    

class DashboardProjectsView(DashboardWidgetPermissionMixin, APIView):
    """Vue pour récupérer les métriques spécifiques aux projets"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            period_days = int(request.GET.get('period_days', 30))
            end_date = timezone.now()
            start_date = end_date - timedelta(days=period_days)
            
            metrics_service = DashboardMetricsService(user=request.user)
            
            # Récupérer les widgets autorisés pour l'utilisateur
            selected_widgets = self._get_authorized_widgets(request, metrics_service.user_role)
            
            # Récupérer uniquement les métriques de projets autorisées
            projects_data = metrics_service.get_projects_metrics(start_date, end_date, selected_widgets)
            
            return Response(projects_data)
            
        except Exception as e:
            return Response({
                'error': str(e),
                'message': 'Erreur lors de la récupération des métriques des projets'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    

class DashboardFinancialView(DashboardWidgetPermissionMixin, APIView):
    """Vue pour récupérer les métriques financières"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            period_days = int(request.GET.get('period_days', 30))
            end_date = timezone.now()
            start_date = end_date - timedelta(days=period_days)
            
            metrics_service = DashboardMetricsService(user=request.user)
            
            # Récupérer les widgets autorisés pour l'utilisateur
            selected_widgets = self._get_authorized_widgets(request, metrics_service.user_role)
            
            # Récupérer uniquement les métriques financières autorisées
            financial_data = metrics_service.get_financial_metrics(start_date, end_date, selected_widgets)
            
            return Response(financial_data)
            
        except Exception as e:
            return Response({
                'error': str(e),
                'message': 'Erreur lors de la récupération des métriques financières'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    

class DashboardPerformanceView(DashboardWidgetPermissionMixin, APIView):
    """Vue pour récupérer les métriques de performance"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            period_days = int(request.GET.get('period_days', 30))
            end_date = timezone.now()
            start_date = end_date - timedelta(days=period_days)
            
            metrics_service = DashboardMetricsService(user=request.user)
            
            # Récupérer les widgets autorisés pour l'utilisateur
            selected_widgets = self._get_authorized_widgets(request, metrics_service.user_role)
            
            # Récupérer uniquement les métriques de performance autorisées
            performance_data = metrics_service.get_performance_metrics(start_date, end_date, selected_widgets)
            
            return Response(performance_data)
            
        except Exception as e:
            return Response({
                'error': str(e),
                'message': 'Erreur lors de la récupération des métriques de performance'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    

class DashboardCalendarView(DashboardWidgetPermissionMixin, APIView):
    """Vue pour récupérer les métriques du calendrier"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            period_days = int(request.GET.get('period_days', 30))
            end_date = timezone.now()
            start_date = end_date - timedelta(days=period_days)
            
            metrics_service = DashboardMetricsService(user=request.user)
            
            # Récupérer les widgets autorisés pour l'utilisateur
            selected_widgets = self._get_authorized_widgets(request, metrics_service.user_role)
            
            # Récupérer uniquement les métriques du calendrier autorisées
            calendar_data = metrics_service.get_calendar_metrics(start_date, end_date, selected_widgets)
            
            return Response(calendar_data)
            
        except Exception as e:
            return Response({
                'error': str(e),
                'message': 'Erreur lors de la récupération des métriques du calendrier'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DashboardWidgetsCatalogView(DashboardWidgetPermissionMixin, APIView):
    """Vue pour récupérer le catalogue des widgets disponibles"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            # Récupérer le catalogue des widgets disponibles
            available_widgets = DashboardMetricsService.list_available_widgets()
            
            # Debug logging
            logger.info(f"Available widgets count: {len(available_widgets)}")
            logger.info(f"Available widgets keys: {list(available_widgets.keys())[:5]}")
            
            # Récupérer les widgets autorisés pour l'utilisateur
            authorized_widgets = self._get_authorized_widgets(request, None)
            
            # Retourner directement le catalogue des widgets disponibles
            # Le frontend s'attend à recevoir un mapping direct de clés vers objets
            return Response(available_widgets)
            
        except Exception as e:
            logger.error(f"Error in DashboardWidgetsCatalogView: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DashboardRoleConfigView(APIView):
    """Récupère et met à jour la configuration des widgets pour un rôle ou un utilisateur."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            role = request.GET.get('role')
            user_id = request.GET.get('user_id')
            config = None
            if user_id:
                try:
                    user = User.objects.get(pk=user_id)
                    config = DashboardWidgetConfig.objects.filter(user=user).first()
                except User.DoesNotExist:
                    config = None
            elif role:
                config = DashboardWidgetConfig.objects.filter(role=role, user__isnull=True).first()
            else:
                # fallback à l'utilisateur courant
                if request.user and request.user.is_authenticated:
                    config = DashboardWidgetConfig.objects.filter(user=request.user).first()
            if not config:
                return Response({'widgets': [], 'role': role, 'user_id': user_id, 'is_active': True})
            return Response({'widgets': config.widgets, 'role': config.role, 'user_id': config.user_id, 'is_active': config.is_active})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request):
        try:
            # élargir la vérification de permission aux rôles autorisés
            allowed_roles = {'Managing Director', 'Finance/Admin', 'Admin'}
            user_role = getattr(getattr(request.user, 'profile', None), 'role', None)
            if not request.user.is_authenticated or not (
                request.user.is_staff or request.user.is_superuser or (user_role in allowed_roles)
            ):
                return Response({'error': 'Permission refusée'}, status=status.HTTP_403_FORBIDDEN)
            data = json.loads(request.body.decode('utf-8') or '{}')
            role = data.get('role')
            user_id = data.get('user_id')
            widgets = data.get('widgets') or []
            is_active = bool(data.get('is_active', True))
            if user_id:
                user = User.objects.get(pk=user_id)
                # Ne pas utiliser get_or_create sur uniquement "user" pour éviter MultipleObjectsReturned
                config = DashboardWidgetConfig.objects.filter(user=user).order_by('-updated_at', '-id').first()
                if not config:
                    config = DashboardWidgetConfig.objects.create(user=user, role=role or '', widgets=widgets, is_active=is_active)
            else:
                if not role:
                    return Response({'error': 'Le champ role est requis sans user_id'}, status=status.HTTP_400_BAD_REQUEST)
                # Chercher une config de rôle existante, sinon créer
                config = DashboardWidgetConfig.objects.filter(role=role, user__isnull=True).order_by('-updated_at', '-id').first()
                if not config:
                    config = DashboardWidgetConfig.objects.create(role=role, widgets=widgets, is_active=is_active)
            config.widgets = widgets
            config.is_active = is_active
            if role:
                config.role = role
            config.save()
            return Response({'message': 'Configuration enregistrée', 'widgets': config.widgets})
        except User.DoesNotExist:
            return Response({'error': 'Utilisateur non trouvé'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DashboardWidgetsConfigView(APIView):
    """Vue pour récupérer la configuration des widgets de l'utilisateur connecté"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            # Utiliser le service pour récupérer la configuration
            metrics_service = DashboardMetricsService(user=request.user)
            authorized_widgets = metrics_service.get_authorized_widgets()
            
            # Récupérer la configuration actuelle
            config = metrics_service._load_widget_config()
            
            response_data = {
                'authorized_widgets': authorized_widgets,
                'user_role': metrics_service.user_role,
                'total_available': len(DashboardMetricsService.list_available_widgets()),
                'total_authorized': len(authorized_widgets)
            }
            
            if config:
                response_data.update({
                    'config_id': config.id,
                    'is_active': config.is_active,
                    'updated_at': config.updated_at.isoformat(),
                    'is_user_specific': config.user is not None,
                    'widgets': config.widgets
                })
            
            return Response(response_data)
            
        except Exception as e:
            return Response({
                'error': str(e),
                'message': 'Erreur lors de la récupération de la configuration des widgets'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR) 


class DashboardTestView(APIView):
    """Vue de test pour vérifier que le backend fonctionne correctement"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            # Test simple pour vérifier que tout fonctionne
            available_widgets = DashboardMetricsService.list_available_widgets()
            
            return Response({
                'status': 'ok',
                'available_widgets_count': len(available_widgets),
                'sample_widgets': list(available_widgets.keys())[:5],
                'sample_widget_data': dict(list(available_widgets.items())[:3])
            })
            
        except Exception as e:
            logger.error(f"Error in DashboardTestView: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR) 