"""
Tests pour vérifier que l'optimisation de la sélection des widgets fonctionne correctement.
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from unittest.mock import patch, MagicMock

from .services import DashboardMetricsService
from .models import DashboardWidgetConfig

User = get_user_model()


class DashboardWidgetOptimizationTestCase(TestCase):
    """Tests pour l'optimisation de la sélection des widgets"""
    
    def setUp(self):
        """Configuration initiale pour les tests"""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@test.com',
            password='testpass123'
        )
        
        # Configuration de widgets pour l'utilisateur
        self.config = DashboardWidgetConfig.objects.create(
            user=self.user,
            widgets=['projects.status_distribution', 'financial.revenue_trend'],
            is_active=True
        )
        
        # Période de test
        self.end_date = timezone.now()
        self.start_date = self.end_date - timezone.timedelta(days=30)
    
    def test_has_section_widgets_method(self):
        """Test de la méthode _has_section_widgets"""
        service = DashboardMetricsService(user=self.user)
        
        # Test avec des widgets sélectionnés
        selected = {'projects.status_distribution', 'financial.revenue_trend'}
        
        # Vérifier que la section projects est détectée
        self.assertTrue(service._has_section_widgets('projects', selected))
        
        # Vérifier que la section financial est détectée
        self.assertTrue(service._has_section_widgets('financial', selected))
        
        # Vérifier qu'une section inexistante n'est pas détectée
        self.assertFalse(service._has_section_widgets('nonexistent', selected))
        
        # Test sans sélection (tout autorisé)
        self.assertTrue(service._has_section_widgets('projects', None))
        self.assertTrue(service._has_section_widgets('financial', None))
    
    def test_want_method_optimization(self):
        """Test de la méthode _want pour l'optimisation"""
        service = DashboardMetricsService(user=self.user)
        
        selected = {'projects.status_distribution', 'financial.revenue_trend'}
        
        # Test de widgets spécifiques
        self.assertTrue(service._want('projects', 'status_distribution', selected))
        self.assertFalse(service._want('projects', 'recent_projects', selected))
        
        # Test de sections entières
        self.assertTrue(service._want('projects', None, selected))
        self.assertTrue(service._want('financial', None, selected))
        self.assertFalse(service._want('calendar', None, selected))
        
        # Test sans sélection (tout autorisé)
        self.assertTrue(service._want('projects', 'status_distribution', None))
        self.assertTrue(service._want('calendar', 'upcoming_events', None))
    
    @patch('dashboard.services.Project.objects.filter')
    def test_projects_metrics_early_exit(self, mock_filter):
        """Test que get_projects_metrics sort tôt si aucun widget n'est demandé"""
        service = DashboardMetricsService(user=self.user)
        
        # Appeler avec des widgets qui n'incluent pas de projets
        result = service.get_projects_metrics(
            self.start_date, 
            self.end_date, 
            ['financial.revenue_trend', 'calendar.upcoming_events']
        )
        
        # Vérifier que le résultat est vide
        self.assertEqual(result, {})
        
        # Vérifier que Project.objects.filter n'a pas été appelé
        mock_filter.assert_not_called()
    
    @patch('dashboard.services.Facture.objects.filter')
    def test_financial_metrics_early_exit(self, mock_filter):
        """Test que get_financial_metrics sort tôt si aucun widget n'est demandé"""
        service = DashboardMetricsService(user=self.user)
        
        # Appeler avec des widgets qui n'incluent pas de métriques financières
        result = service.get_financial_metrics(
            self.start_date, 
            self.end_date, 
            ['projects.status_distribution', 'calendar.upcoming_events']
        )
        
        # Vérifier que le résultat est vide
        self.assertEqual(result, {})
        
        # Vérifier que Facture.objects.filter n'a pas été appelé
        mock_filter.assert_not_called()
    
    @patch('dashboard.services.Team.objects.all')
    def test_performance_metrics_early_exit(self, mock_team_all):
        """Test que get_performance_metrics sort tôt si aucun widget n'est demandé"""
        service = DashboardMetricsService(user=self.user)
        
        # Appeler avec des widgets qui n'incluent pas de métriques de performance
        result = service.get_performance_metrics(
            self.start_date, 
            self.end_date, 
            ['projects.status_distribution', 'financial.revenue_trend']
        )
        
        # Vérifier que le résultat est vide
        self.assertEqual(result, {})
        
        # Vérifier que Team.objects.all n'a pas été appelé
        mock_team_all.assert_not_called()
    
    @patch('dashboard.services.Project.objects.filter')
    def test_calendar_metrics_early_exit(self, mock_filter):
        """Test que get_calendar_metrics sort tôt si aucun widget n'est demandé"""
        service = DashboardMetricsService(user=self.user)
        
        # Appeler avec des widgets qui n'incluent pas de métriques du calendrier
        result = service.get_calendar_metrics(
            self.start_date, 
            self.end_date, 
            ['projects.status_distribution', 'financial.revenue_trend']
        )
        
        # Vérifier que le résultat est vide
        self.assertEqual(result, {})
        
        # Vérifier que Project.objects.filter n'a pas été appelé pour le calendrier
        mock_filter.assert_not_called()
    
    def test_selected_set_optimization(self):
        """Test de l'optimisation de _selected_set"""
        service = DashboardMetricsService(user=self.user)
        
        # Test avec des widgets passés en paramètre
        selected = service._selected_set(['widget1', 'widget2'])
        self.assertEqual(selected, {'widget1', 'widget2'})
        
        # Test avec des widgets stockés dans l'instance
        service.selected_widgets = ['widget3', 'widget4']
        selected = service._selected_set()
        self.assertEqual(selected, {'widget3', 'widget4'})
        
        # Test sans widgets
        service.selected_widgets = None
        selected = service._selected_set()
        self.assertIsNone(selected)
        
        # Test avec une liste vide
        selected = service._selected_set([])
        self.assertEqual(selected, set())
    
    def test_widget_selection_performance(self):
        """Test de performance de la sélection des widgets"""
        service = DashboardMetricsService(user=self.user)
        
        # Créer un grand nombre de widgets pour tester la performance
        large_widget_set = {f'widget_{i}' for i in range(1000)}
        large_widget_set.add('projects.status_distribution')
        
        # Mesurer le temps d'exécution
        import time
        start_time = time.time()
        
        # Appeler _has_section_widgets plusieurs fois
        for _ in range(100):
            result = service._has_section_widgets('projects', large_widget_set)
        
        end_time = time.time()
        execution_time = end_time - start_time
        
        # Vérifier que le résultat est correct
        self.assertTrue(result)
        
        # Vérifier que l'exécution est rapide (moins de 1 seconde pour 100 appels)
        self.assertLess(execution_time, 1.0)
        
        print(f"Temps d'exécution pour 100 appels: {execution_time:.4f} secondes")
    
    def test_mixed_widget_selection(self):
        """Test avec une sélection mixte de widgets"""
        service = DashboardMetricsService(user=self.user)
        
        # Sélection mixte de widgets
        mixed_widgets = [
            'projects.status_distribution',
            'financial.revenue_trend',
            'performance.team_productivity',
            'calendar.upcoming_deadlines'
        ]
        
        # Vérifier que toutes les sections sont détectées
        self.assertTrue(service._has_section_widgets('projects', mixed_widgets))
        self.assertTrue(service._has_section_widgets('financial', mixed_widgets))
        self.assertTrue(service._has_section_widgets('performance', mixed_widgets))
        self.assertTrue(service._has_section_widgets('calendar', mixed_widgets))
        
        # Vérifier que des sections inexistantes ne sont pas détectées
        self.assertFalse(service._has_section_widgets('nonexistent', mixed_widgets))
        self.assertFalse(service._has_section_widgets('invalid', mixed_widgets))
    
    def test_empty_widget_selection(self):
        """Test avec une sélection vide de widgets"""
        service = DashboardMetricsService(user=self.user)
        
        # Sélection vide
        empty_widgets = []
        
        # Vérifier que toutes les sections sont autorisées avec une sélection vide
        self.assertTrue(service._has_section_widgets('projects', empty_widgets))
        self.assertTrue(service._has_section_widgets('financial', empty_widgets))
        self.assertTrue(service._has_section_widgets('performance', empty_widgets))
        self.assertTrue(service._has_section_widgets('calendar', empty_widgets))
        
        # Vérifier que _want retourne True pour tous les widgets
        self.assertTrue(service._want('projects', 'status_distribution', empty_widgets))
        self.assertTrue(service._want('financial', 'revenue_trend', empty_widgets)) 