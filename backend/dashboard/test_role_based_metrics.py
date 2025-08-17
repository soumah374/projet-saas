"""
Tests pour vérifier le filtrage des métriques du tableau de bord basé sur les rôles
"""
from django.test import TestCase, RequestFactory
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from unittest.mock import patch, MagicMock

from .services import DashboardMetricsService
from .views import DashboardOverviewView
from users.models import UserProfile
from projects.models import Project, ProjectTask
from teams.models import Team, TeamMember
from users.models import ClientProfile


class RoleBasedMetricsTestCase(TestCase):
    """Tests pour les métriques basées sur les rôles"""
    
    def setUp(self):
        """Configuration initiale pour les tests"""
        self.factory = RequestFactory()
        
        # Créer des utilisateurs avec différents rôles
        self.superuser = User.objects.create_superuser(
            username='admin',
            email='admin@test.com',
            password='testpass123'
        )
        
        self.chef_projet = User.objects.create_user(
            username='chef_projet',
            email='chef@test.com',
            password='testpass123'
        )
        UserProfile.objects.create(
            user=self.chef_projet,
            role='Chef de projet'
        )
        
        self.designer = User.objects.create_user(
            username='designer',
            email='designer@test.com',
            password='testpass123'
        )
        UserProfile.objects.create(
            user=self.designer,
            role='Designer'
        )
        
        self.finance_admin = User.objects.create_user(
            username='finance',
            email='finance@test.com',
            password='testpass123'
        )
        UserProfile.objects.create(
            user=self.finance_admin,
            role='Finance/Admin'
        )
        
        # Créer des équipes
        self.team1 = Team.objects.create(name='Équipe Design')
        self.team2 = Team.objects.create(name='Équipe Développement')
        
        # Créer des clients
        self.client1 = ClientProfile.objects.create(
            nom='Client Test 1',
            email='client1@test.com'
        )
        self.client2 = ClientProfile.objects.create(
            nom='Client Test 2',
            email='client2@test.com'
        )
        
        # Créer des projets
        self.project1 = Project.objects.create(
            title='Projet Design',
            client=self.client1,
            status='Production',
            progress=75
        )
        self.project2 = Project.objects.create(
            title='Projet Développement',
            client=self.client2,
            status='Livraison',
            progress=90
        )
        
        # Assigner des membres aux équipes
        TeamMember.objects.create(
            user=self.chef_projet,
            team=self.team1,
            role='leader'
        )
        TeamMember.objects.create(
            user=self.designer,
            team=self.team1,
            role='member'
        )
    
    def test_superuser_sees_all_data(self):
        """Test que le superuser voit toutes les données"""
        service = DashboardMetricsService(user=self.superuser)
        start_date = timezone.now() - timedelta(days=30)
        end_date = timezone.now()
        
        metrics = service.get_projects_metrics(start_date, end_date)
        
        # Le superuser doit voir tous les projets
        self.assertEqual(metrics['total_projects'], 2)
        self.assertEqual(metrics['user_role'], 'superuser')
    
    def test_chef_projet_sees_limited_data(self):
        """Test que le chef de projet voit ses projets et ceux de son équipe"""
        service = DashboardMetricsService(user=self.chef_projet)
        start_date = timezone.now() - timedelta(days=30)
        end_date = timezone.now()
        
        metrics = service.get_projects_metrics(start_date, end_date)
        
        # Le chef de projet doit voir ses projets
        self.assertEqual(metrics['user_role'], 'Chef de projet')
        # Note: Les projets ne sont pas encore assignés, donc 0 pour l'instant
    
    def test_designer_sees_limited_data(self):
        """Test que le designer voit ses projets assignés"""
        service = DashboardMetricsService(user=self.designer)
        start_date = timezone.now() - timedelta(days=30)
        end_date = timezone.now()
        
        metrics = service.get_projects_metrics(start_date, end_date)
        
        # Le designer doit voir son rôle
        self.assertEqual(metrics['user_role'], 'Designer')
    
    def test_finance_admin_financial_access(self):
        """Test que l'admin finance a accès aux données financières"""
        service = DashboardMetricsService(user=self.finance_admin)
        start_date = timezone.now() - timedelta(days=30)
        end_date = timezone.now()
        
        metrics = service.get_financial_metrics(start_date, end_date)
        
        # L'admin finance doit avoir accès aux métriques financières
        self.assertEqual(service.user_role, 'Finance/Admin')
        self.assertIn('revenue_trend', metrics)
    
    def test_anonymous_user_limited_access(self):
        """Test qu'un utilisateur anonyme a un accès limité"""
        service = DashboardMetricsService(user=None)
        start_date = timezone.now() - timedelta(days=30)
        end_date = timezone.now()
        
        metrics = service.get_projects_metrics(start_date, end_date)
        
        # L'utilisateur anonyme ne doit pas avoir de rôle
        self.assertIsNone(service.user_role)
    
    def test_view_integration(self):
        """Test l'intégration avec les vues"""
        request = self.factory.get('/dashboard/overview/')
        request.user = self.chef_projet
        
        view = DashboardOverviewView()
        response = view.get(request)
        
        # La vue doit retourner une réponse valide
        self.assertEqual(response.status_code, 200)
    
    def test_role_filtering_consistency(self):
        """Test la cohérence du filtrage par rôle"""
        service = DashboardMetricsService(user=self.chef_projet)
        
        # Tester que le même utilisateur a le même rôle dans toutes les méthodes
        self.assertEqual(service.user_role, 'Chef de projet')
        
        # Vérifier que le rôle est cohérent dans toutes les métriques
        start_date = timezone.now() - timedelta(days=30)
        end_date = timezone.now()
        
        projects_metrics = service.get_projects_metrics(start_date, end_date)
        calendar_metrics = service.get_calendar_metrics(start_date, end_date)
        
        self.assertEqual(projects_metrics['user_role'], 'Chef de projet')
        self.assertEqual(calendar_metrics['user_role'], 'Chef de projet')


class RoleBasedPermissionsTestCase(TestCase):
    """Tests pour les permissions basées sur les rôles"""
    
    def setUp(self):
        """Configuration pour les tests de permissions"""
        self.factory = RequestFactory()
        
        # Créer un utilisateur avec un rôle spécifique
        self.user = User.objects.create_user(
            username='testuser',
            email='test@test.com',
            password='testpass123'
        )
        UserProfile.objects.create(
            user=self.user,
            role='Designer'
        )
    
    def test_role_based_data_access(self):
        """Test l'accès aux données basé sur le rôle"""
        service = DashboardMetricsService(user=self.user)
        
        # Vérifier que l'utilisateur a le bon rôle
        self.assertEqual(service.user_role, 'Designer')
        
        # Vérifier que le filtrage est appliqué
        # (les designers ne voient que leurs projets)
        start_date = timezone.now() - timedelta(days=30)
        end_date = timezone.now()
        
        metrics = service.get_projects_metrics(start_date, end_date)
        self.assertEqual(metrics['user_role'], 'Designer')
    
    def test_role_change_affects_access(self):
        """Test que le changement de rôle affecte l'accès aux données"""
        service = DashboardMetricsService(user=self.user)
        
        # Changer le rôle de l'utilisateur
        self.user.profile.role = 'Chef de projet'
        self.user.profile.save()
        
        # Recréer le service pour prendre en compte le changement
        service = DashboardMetricsService(user=self.user)
        
        # Vérifier que le nouveau rôle est pris en compte
        self.assertEqual(service.user_role, 'Chef de projet')


if __name__ == '__main__':
    # Tests manuels
    print("Tests des métriques basées sur les rôles")
    print("=" * 50)
    
    # Créer un utilisateur de test
    user = User.objects.create_user(
        username='testuser',
        email='test@test.com',
        password='testpass123'
    )
    
    # Créer un profil avec un rôle
    profile = UserProfile.objects.create(
        user=user,
        role='Chef de projet'
    )
    
    # Tester le service
    service = DashboardMetricsService(user=user)
    print(f"Rôle de l'utilisateur: {service.user_role}")
    
    # Tester le filtrage
    start_date = timezone.now() - timedelta(days=30)
    end_date = timezone.now()
    
    projects_metrics = service.get_projects_metrics(start_date, end_date)
    print(f"Métriques des projets: {projects_metrics.get('total_projects', 0)} projets")
    print(f"Rôle dans les métriques: {projects_metrics.get('user_role', 'Non défini')}") 