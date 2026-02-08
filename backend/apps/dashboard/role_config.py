"""
Configuration des filtres par rôle pour le tableau de bord
"""
from typing import Dict, List, Any, Optional
from django.db.models import Q


class RoleFilterConfig:
    """
    Configuration centralisée pour les filtres basés sur les rôles
    """
    
    # Configuration des permissions par rôle
    ROLE_PERMISSIONS = {
        'superuser': {
            'description': 'Accès complet à toutes les données',
            'filters': {
                'projects': 'all',
                'teams': 'all',
                'clients': 'all',
                'devis': 'all',
                'contrats': 'all',
                'billings': 'all',
                'catalog': 'all',
                'documents': 'all',
                'reports': 'all'
            }
        },
        'Managing Director': {
            'description': 'Vue globale de toutes les activités',
            'filters': {
                'projects': 'all',
                'teams': 'all',
                'clients': 'all',
                'devis': 'all',
                'contrats': 'all',
                'billings': 'all',
                'catalog': 'all',
                'documents': 'all',
                'reports': 'all'
            }
        },
        'Finance/Admin': {
            'description': 'Focus sur les performances financières',
            'filters': {
                'projects': 'view_only',
                'teams': 'view_only',
                'departments': 'view_only',
                'clients': 'view_edit',
                'devis': 'all',
                'contrats': 'all',
                'billings': 'all',
                'catalog': 'view_only',
                'documents': 'view_only',
                'reports': 'view_only'
            }
        },
        'Chef de projet': {
            'description': 'Gestion de projet et équipe',
            'filters': {
                'projects': 'own_and_team',
                'teams': 'own_team',
                'departments': 'view_only',
                'clients': 'project_clients',
                'devis': 'view_edit',
                'contrats': 'view_edit',
                'billings': 'view_only',
                'catalog': 'view_only',
                'documents': 'view_edit',
                'reports': 'view_only'
            }
        },
        'Designer': {
            'description': 'Focus sur la créativité et la qualité',
            'filters': {
                'projects': 'assigned',
                'teams': 'own_team',
                'departments': 'view_only',
                'clients': 'view_only',
                'devis': 'view_only',
                'contrats': 'view_only',
                'billings': 'view_only',
                'catalog': 'view_only',
                'documents': 'view_edit',
                'reports': 'view_only'
            }
        },
        'Développeur': {
            'description': 'Focus sur le développement technique',
            'filters': {
                'projects': 'assigned',
                'teams': 'own_team',
                'departments': 'view_only',
                'clients': 'view_only',
                'devis': 'view_only',
                'contrats': 'view_only',
                'billings': 'view_only',
                'catalog': 'view_only',
                'documents': 'view_edit',
                'reports': 'view_only'
            }
        },
        'Rédacteur': {
            'description': 'Focus sur le contenu et la rédaction',
            'filters': {
                'projects': 'assigned',
                'teams': 'own_team',
                'departments': 'view_only',
                'clients': 'view_only',
                'devis': 'view_only',
                'contrats': 'view_only',
                'billings': 'view_only',
                'catalog': 'view_only',
                'documents': 'view_edit',
                'reports': 'view_only'
            }
        },
        'Consultant': {
            'description': 'Focus sur la relation client',
            'filters': {
                'projects': 'assigned',
                'teams': 'view_only',
                'departments': 'view_only',
                'clients': 'all',
                'devis': 'all',
                'contrats': 'all',
                'billings': 'view_only',
                'catalog': 'view_only',
                'documents': 'view_edit',
                'reports': 'view_only'
            }
        }
    }
    
    # Configuration des filtres spécifiques
    FILTER_IMPLEMENTATIONS = {
        'all': lambda user, queryset: queryset,
        'view_only': lambda user, queryset: queryset,
        'view_edit': lambda user, queryset: queryset,
        'own_and_team': lambda user, queryset: queryset.filter(
            Q(project_members__user=user, project_members__role='Chef de projet') |
            Q(team__team_members__user=user)
        ).distinct(),
        'own_team': lambda user, queryset: queryset.filter(team_members__user=user),
        'project_clients': lambda user, queryset: queryset.filter(
            id__in=user.projects.values_list('client_id', flat=True)
        ),
        'assigned': lambda user, queryset: queryset.filter(project_members__user=user)
    }
    
    @classmethod
    def get_role_permissions(cls, role: str) -> Optional[Dict[str, Any]]:
        """Récupère les permissions pour un rôle donné"""
        return cls.ROLE_PERMISSIONS.get(role)
    
    @classmethod
    def get_filter_for_model(cls, role: str, model_name: str) -> str:
        """Récupère le type de filtre pour un modèle et un rôle"""
        role_config = cls.get_role_permissions(role)
        if role_config and 'filters' in role_config:
            return role_config['filters'].get(model_name, 'view_only')
        return 'view_only'
    
    @classmethod
    def apply_filter(cls, user, queryset, model_name: str, role: str) -> Any:
        """Applique le filtre approprié selon le rôle et le modèle"""
        filter_type = cls.get_filter_for_model(role, model_name)
        filter_func = cls.FILTER_IMPLEMENTATIONS.get(filter_type)
        
        if filter_func:
            return filter_func(user, queryset)
        
        # Fallback par défaut
        return queryset
    
    @classmethod
    def get_role_description(cls, role: str) -> str:
        """Récupère la description d'un rôle"""
        role_config = cls.get_role_permissions(role)
        return role_config.get('description', 'Rôle non défini') if role_config else 'Rôle non défini'
    
    @classmethod
    def list_supported_roles(cls) -> List[str]:
        """Liste tous les rôles supportés"""
        return list(cls.ROLE_PERMISSIONS.keys())
    
    @classmethod
    def get_model_permissions(cls, role: str) -> Dict[str, str]:
        """Récupère toutes les permissions pour un modèle donné"""
        role_config = cls.get_role_permissions(role)
        if role_config and 'filters' in role_config:
            return role_config['filters']
        return {}


class CustomRoleFilter:
    """
    Classe pour créer des filtres personnalisés
    """
    
    def __init__(self, user, role: str):
        self.user = user
        self.role = role
        self.config = RoleFilterConfig()
    
    def filter_projects(self, queryset):
        """Filtre les projets selon le rôle"""
        return self.config.apply_filter(self.user, queryset, 'projects', self.role)
    
    def filter_teams(self, queryset):
        """Filtre les équipes selon le rôle"""
        return self.config.apply_filter(self.user, queryset, 'teams', self.role)
    
    def filter_clients(self, queryset):
        """Filtre les clients selon le rôle"""
        return self.config.apply_filter(self.user, queryset, 'clients', self.role)
    
    def filter_financial_data(self, queryset, model_name: str):
        """Filtre les données financières selon le rôle"""
        return self.config.apply_filter(self.user, queryset, model_name, self.role)
    
    def get_user_permissions_summary(self) -> Dict[str, Any]:
        """Récupère un résumé des permissions de l'utilisateur"""
        permissions = self.config.get_model_permissions(self.role)
        
        summary = {
            'role': self.role,
            'description': self.config.get_role_description(self.role),
            'permissions': permissions,
            'access_level': self._calculate_access_level(permissions)
        }
        
        return summary
    
    def _calculate_access_level(self, permissions: Dict[str, str]) -> str:
        """Calcule le niveau d'accès global de l'utilisateur"""
        if not permissions:
            return 'none'
        
        access_levels = {
            'all': 3,
            'view_edit': 2,
            'view_only': 1,
            'none': 0
        }
        
        total_level = sum(access_levels.get(perm, 0) for perm in permissions.values())
        avg_level = total_level / len(permissions)
        
        if avg_level >= 2.5:
            return 'high'
        elif avg_level >= 1.5:
            return 'medium'
        elif avg_level >= 0.5:
            return 'low'
        else:
            return 'none'


# Exemples d'utilisation
def example_usage():
    """Exemple d'utilisation de la configuration des rôles"""
    print("=== Configuration des rôles ===\n")
    
    # Lister tous les rôles supportés
    roles = RoleFilterConfig.list_supported_roles()
    print(f"Rôles supportés: {', '.join(roles)}\n")
    
    # Afficher les permissions pour chaque rôle
    for role in roles[:3]:  # Limiter à 3 pour l'exemple
        permissions = RoleFilterConfig.get_model_permissions(role)
        description = RoleFilterConfig.get_role_description(role)
        
        print(f"--- {role} ---")
        print(f"Description: {description}")
        print("Permissions:")
        for model, permission in permissions.items():
            print(f"  - {model}: {permission}")
        print()
    
    # Exemple de filtrage personnalisé
    print("=== Exemple de filtrage personnalisé ===\n")
    
    # Simuler un utilisateur
    from django.contrib.auth.models import User
    user = User(username='test_user')
    
    # Créer un filtre personnalisé
    custom_filter = CustomRoleFilter(user, 'Chef de projet')
    
    # Obtenir le résumé des permissions
    summary = custom_filter.get_user_permissions_summary()
    print(f"Utilisateur: {user.username}")
    print(f"Rôle: {summary['role']}")
    print(f"Description: {summary['description']}")
    print(f"Niveau d'accès: {summary['access_level']}")
    print("Permissions détaillées:")
    for model, permission in summary['permissions'].items():
        print(f"  - {model}: {permission}")


if __name__ == '__main__':
    example_usage() 