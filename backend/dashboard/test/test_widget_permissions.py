"""
Tests pour vérifier que les permissions des widgets du tableau de bord fonctionnent correctement.
"""
from django.test import TestCase, RequestFactory
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status

from .models import DashboardWidgetConfig
from .views import DashboardOverviewView, DashboardWidgetPermissionMixin
from .services import DashboardMetricsService
from .utils import permission_widget, get_user_widget_config, validate_widget_permissions

User = get_user_model()


class DashboardWidgetPermissionsTestCase(TestCase):
    """Tests pour les permissions des widgets du tableau de bord"""
    
    def setUp(self):
        """Configuration initiale pour les tests"""
        self.factory = RequestFactory()
        self.client = APIClient()
        
        # Créer des utilisateurs de test avec différents rôles
        self.superuser = User.objects.create_superuser(
            username='admin',
            email='admin@test.com',
            password='testpass123'
        )
        
        self.regular_user = User.objects.create_user(
            username='user',
            email='user@test.com',
            password='testpass123'
        )
        
        # Créer des configurations de widgets de test
        self.config_finance = DashboardWidgetConfig.objects.create(
            role='Finance/Admin',
            widgets=['financial.revenue_trend', 'financial.billing_status'],
            is_active=True
        )
        
        self.config_projects = DashboardWidgetConfig.objects.create(
            role='Chef de projet',
            widgets=['projects.status_distribution', 'projects.recent_projects'],
            is_active=True
        )
        
        self.config_user = DashboardWidgetConfig.objects.create(
            user=self.regular_user,
            widgets=['projects.status_distribution'],
            is_active=True
        )
    
    def test_get_authorized_widgets_by_role(self):
        """Test de récupération des widgets autorisés par rôle"""
        # Créer un utilisateur avec le rôle Finance/Admin
        finance_user = User.objects.create_user(
            username='finance_user',
            email='finance@test.com',
            password='testpass123'
        )
        
        # Simuler un profil avec rôle
        from users.models import UserProfile
        profile = UserProfile.objects.create(
            user=finance_user,
            role='Finance/Admin'
        )
        
        # Tester le service
        service = DashboardMetricsService(user=finance_user)
        authorized_widgets = service.get_authorized_widgets()
        
        self.assertIn('financial.revenue_trend', authorized_widgets)
        self.assertIn('financial.billing_status', authorized_widgets)
        self.assertEqual(len(authorized_widgets), 2)
    
    def test_get_authorized_widgets_by_user(self):
        """Test de récupération des widgets autorisés par utilisateur spécifique"""
        service = DashboardMetricsService(user=self.regular_user)
        authorized_widgets = service.get_authorized_widgets()
        
        self.assertIn('projects.status_distribution', authorized_widgets)
        self.assertEqual(len(authorized_widgets), 1)
    
    def test_widget_filtering_in_metrics(self):
        """Test du filtrage des widgets dans le calcul des métriques"""
        service = DashboardMetricsService(user=self.regular_user)
        
        # Définir une période de test
        end_date = timezone.now()
        start_date = end_date - timezone.timedelta(days=30)
        
        # Récupérer les métriques de projets avec filtrage
        projects_metrics = service.get_projects_metrics(start_date, end_date)
        
        # Vérifier que seuls les widgets autorisés sont calculés
        self.assertIn('status_distribution', projects_metrics)
        self.assertNotIn('recent_projects', projects_metrics)
        self.assertIn('widgets_used', projects_metrics)
    
    def test_utils_functions(self):
        """Test des fonctions utilitaires"""
        # Test permission_widget
        widgets = permission_widget(self.regular_user)
        self.assertIn('projects.status_distribution', widgets)
        
        # Test get_user_widget_config
        config = get_user_widget_config(self.regular_user)
        self.assertIn('authorized_widgets', config)
        self.assertIn('user_role', config)
        self.assertIn('total_authorized', config)
        
        # Test validate_widget_permissions
        validation = validate_widget_permissions(
            self.regular_user, 
            ['projects.status_distribution', 'financial.revenue_trend']
        )
        self.assertIn('projects.status_distribution', validation['authorized'])
        self.assertIn('financial.revenue_trend', validation['unauthorized'])
    
    def test_service_initialization(self):
        """Test de l'initialisation du service"""
        service = DashboardMetricsService(user=self.regular_user)
        
        # Vérifier que la configuration est chargée
        config = service._load_widget_config()
        self.assertIsNotNone(config)
        self.assertEqual(config.user, self.regular_user)
        
        # Vérifier que les widgets sont chargés automatiquement
        self.assertIsNotNone(service.selected_widgets)
    
    def test_widget_selection_helpers(self):
        """Test des helpers de sélection de widgets"""
        service = DashboardMetricsService(user=self.regular_user)
        
        # Test _has_section_widgets
        selected = set(['projects.status_distribution'])
        self.assertTrue(service._has_section_widgets('projects', selected))
        self.assertFalse(service._has_section_widgets('financial', selected))
        
        # Test _want
        self.assertTrue(service._want('projects', 'status_distribution', selected))
        self.assertFalse(service._want('projects', 'recent_projects', selected))
        self.assertTrue(service._want('projects', None, selected))  # Section entière
    
    def test_error_handling(self):
        """Test de la gestion des erreurs"""
        # Test avec un utilisateur sans configuration
        user_no_config = User.objects.create_user(
            username='no_config_user',
            email='noconfig@test.com',
            password='testpass123'
        )
        
        service = DashboardMetricsService(user=user_no_config)
        authorized_widgets = service.get_authorized_widgets()
        
        # Devrait retourner tous les widgets disponibles (rétrocompatibilité)
        self.assertGreater(len(authorized_widgets), 0)
        
        # Test avec un utilisateur None
        service_no_user = DashboardMetricsService(user=None)
        authorized_widgets = service_no_user.get_authorized_widgets()
        self.assertEqual(len(authorized_widgets), 0) 