"""
Exemples d'utilisation du système de métriques basées sur les rôles
"""
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from .services import DashboardMetricsService


def example_role_based_dashboard():
    """
    Exemple complet d'utilisation du tableau de bord basé sur les rôles
    """
    print("=== Exemple d'utilisation du tableau de bord basé sur les rôles ===\n")
    
    # Simuler différents utilisateurs avec différents rôles
    users_data = [
        {
            'username': 'admin',
            'role': 'superuser',
            'description': 'Administrateur système'
        },
        {
            'username': 'directeur',
            'role': 'Managing Director',
            'description': 'Directeur général'
        },
        {
            'username': 'finance',
            'role': 'Finance/Admin',
            'description': 'Administrateur financier'
        },
        {
            'username': 'chef_projet',
            'role': 'Chef de projet',
            'description': 'Chef de projet'
        },
        {
            'username': 'designer',
            'role': 'Designer',
            'description': 'Designer'
        },
        {
            'username': 'consultant',
            'role': 'Consultant',
            'description': 'Consultant'
        }
    ]
    
    # Période pour les métriques
    end_date = timezone.now()
    start_date = end_date - timedelta(days=30)
    
    for user_info in users_data:
        print(f"--- Utilisateur: {user_info['username']} ({user_info['role']}) ---")
        print(f"Description: {user_info['description']}")
        
        # Simuler un utilisateur (en production, ce serait un vrai utilisateur)
        user = User(username=user_info['username'])
        
        # Créer le service avec l'utilisateur
        service = DashboardMetricsService(user=user)
        
        # Afficher le rôle détecté
        print(f"Rôle détecté: {service.user_role}")
        
        # Récupérer les métriques des projets
        try:
            projects_metrics = service.get_projects_metrics(start_date, end_date)
            print(f"  - Projets: {projects_metrics.get('total_projects', 0)}")
            print(f"  - Projets actifs: {projects_metrics.get('active_projects', 0)}")
        except Exception as e:
            print(f"  - Erreur projets: {str(e)}")
        
        # Récupérer les métriques financières
        try:
            financial_metrics = service.get_financial_metrics(start_date, end_date)
            print(f"  - Tendance des revenus: {len(financial_metrics.get('revenue_trend', []))} mois")
            print(f"  - Taux de conversion devis: {financial_metrics.get('devis_conversion', {}).get('rate', 0)}%")
        except Exception as e:
            print(f"  - Erreur finances: {str(e)}")
        
        # Récupérer les métriques de performance
        try:
            performance_metrics = service.get_performance_metrics(start_date, end_date)
            print(f"  - Tâches totales: {performance_metrics.get('task_completion_rate', {}).get('total', 0)}")
            print(f"  - Taux de completion: {performance_metrics.get('task_completion_rate', {}).get('rate', 0)}%")
        except Exception as e:
            print(f"  - Erreur performance: {str(e)}")
        
        # Récupérer les métriques du calendrier
        try:
            calendar_metrics = service.get_calendar_metrics(start_date, end_date)
            print(f"  - Échéances à venir: {len(calendar_metrics.get('upcoming_deadlines', []))}")
            print(f"  - Utilisateurs actifs: {calendar_metrics.get('resource_utilization', {}).get('active_users', 0)}")
        except Exception as e:
            print(f"  - Erreur calendrier: {str(e)}")
        
        print()


def example_custom_filtering():
    """
    Exemple de filtrage personnalisé basé sur les rôles
    """
    print("=== Exemple de filtrage personnalisé ===\n")
    
    # Simuler un chef de projet
    user = User(username='chef_projet')
    service = DashboardMetricsService(user=user)
    
    print(f"Utilisateur: {user.username}")
    print(f"Rôle: {service.user_role}")
    
    # Exemple de filtrage personnalisé
    from projects.models import Project
    
    # Récupérer tous les projets
    all_projects = Project.objects.all()
    print(f"Tous les projets: {all_projects.count()}")
    
    # Appliquer le filtre par rôle
    filtered_projects = service._filter_by_role(all_projects, 'projects')
    print(f"Projets filtrés par rôle: {filtered_projects.count()}")
    
    # Afficher les projets filtrés
    for project in filtered_projects[:5]:  # Limiter à 5 pour l'exemple
        print(f"  - {project.title} (Statut: {project.status})")
    
    print()


def example_role_specific_metrics():
    """
    Exemple de métriques spécifiques à un rôle
    """
    print("=== Exemple de métriques spécifiques au rôle ===\n")
    
    # Simuler un administrateur financier
    user = User(username='finance_admin')
    service = DashboardMetricsService(user=user)
    
    print(f"Utilisateur: {user.username}")
    print(f"Rôle: {service.user_role}")
    
    # Métriques spécifiques aux finances
    if service.user_role == 'Finance/Admin':
        print("Accès complet aux données financières:")
        print("  - Toutes les factures")
        print("  - Tous les devis")
        print("  - Tous les contrats")
        print("  - Rapports financiers complets")
    else:
        print("Accès limité aux données financières")
    
    print()


def example_team_based_filtering():
    """
    Exemple de filtrage basé sur l'équipe
    """
    print("=== Exemple de filtrage basé sur l'équipe ===\n")
    
    # Simuler un membre d'équipe
    user = User(username='team_member')
    service = DashboardMetricsService(user=user)
    
    print(f"Utilisateur: {user.username}")
    print(f"Rôle: {service.user_role}")
    
    # Exemple pour un designer
    if service.user_role == 'Designer':
        print("Accès aux données de l'équipe:")
        print("  - Projets assignés")
        print("  - Membres de l'équipe")
        print("  - Documents des projets")
        print("  - Tâches assignées")
    
    print()


def example_performance_monitoring():
    """
    Exemple de monitoring des performances par rôle
    """
    print("=== Exemple de monitoring des performances ===\n")
    
    roles = ['Chef de projet', 'Designer', 'Finance/Admin', 'Consultant']
    
    for role in roles:
        print(f"--- Monitoring pour le rôle: {role} ---")
        
        # Simuler un utilisateur avec ce rôle
        user = User(username=f'user_{role.lower().replace(" ", "_")}')
        service = DashboardMetricsService(user=user)
        
        # Vérifier les permissions
        permissions = {
            'projects': service._filter_by_role(Project.objects.all(), 'projects').count(),
            'teams': service._filter_by_role(Team.objects.all(), 'teams').count(),
            'clients': service._filter_by_role(ClientProfile.objects.all(), 'clients').count(),
        }
        
        print(f"  - Projets accessibles: {permissions['projects']}")
        print(f"  - Équipes accessibles: {permissions['teams']}")
        print(f"  - Clients accessibles: {permissions['clients']}")
        
        # Recommandations basées sur le rôle
        if role == 'Chef de projet':
            print("  - Recommandation: Focus sur la gestion d'équipe et la planification")
        elif role == 'Finance/Admin':
            print("  - Recommandation: Focus sur les métriques financières et la rentabilité")
        elif role == 'Designer':
            print("  - Recommandation: Focus sur la productivité et la qualité des livrables")
        elif role == 'Consultant':
            print("  - Recommandation: Focus sur la relation client et la conversion")
        
        print()


if __name__ == '__main__':
    # Exécuter tous les exemples
    example_role_based_dashboard()
    example_custom_filtering()
    example_role_specific_metrics()
    example_team_based_filtering()
    example_performance_monitoring()
    
    print("=== Fin des exemples ===")
    print("\nPour utiliser ces exemples dans votre code:")
    print("1. Importez DashboardMetricsService")
    print("2. Créez une instance avec l'utilisateur connecté")
    print("3. Appelez les méthodes de métriques")
    print("4. Le filtrage par rôle est automatique") 