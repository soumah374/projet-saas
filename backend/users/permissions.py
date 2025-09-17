from rest_framework import permissions
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from django.db.models import Q


class HasRolePermission(permissions.BasePermission):
    """
    Permission basée sur les rôles utilisateur
    """
    
    def __init__(self, required_role=None, required_permission=None):
        self.required_role = required_role
        self.required_permission = required_permission
        super().__init__()
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Super utilisateurs ont tous les droits
        if request.user.is_superuser:
            return True
        
        # Vérifier le rôle requis
        if self.required_role:
            if not hasattr(request.user, 'profile') or request.user.profile.role != self.required_role:
                return False
        
        # Vérifier la permission spécifique
        if self.required_permission:
            return request.user.has_perm(self.required_permission)
        
        return True


class IsProjectManager(permissions.BasePermission):
    """
    Permission pour les chefs de projet
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Super utilisateurs et staff ont tous les droits
        if request.user.is_superuser or request.user.is_staff:
            return True
        
        # Vérifier si l'utilisateur est chef de projet
        if hasattr(request.user, 'profile') and request.user.profile.role == 'Chef de projet':
            return True
        
        return False
    
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Super utilisateurs et staff ont tous les droits
        if request.user.is_superuser or request.user.is_staff:
            return True
        
        # Vérifier si l'utilisateur est chef de projet du projet
        if hasattr(obj, 'project_members'):
            return obj.project_members.filter(
                user=request.user,
                role='Chef de projet'
            ).exists()
        
        return False


class IsFinanceAdmin(permissions.BasePermission):
    """
    Permission pour les administrateurs financiers
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Super utilisateurs ont tous les droits
        if request.user.is_superuser:
            return True
        
        # Vérifier si l'utilisateur est Finance/Admin ou Managing Director
        if hasattr(request.user, 'profile'):
            return request.user.profile.role in ['Finance/Admin', 'Managing Director']
        
        return False


class IsManagingDirector(permissions.BasePermission):
    """
    Permission pour le directeur général
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Super utilisateurs ont tous les droits
        if request.user.is_superuser:
            return True
        
        # Vérifier si l'utilisateur est Managing Director
        if hasattr(request.user, 'profile'):
            return request.user.profile.role == 'Managing Director'
        
        return False


class IsProjectMember(permissions.BasePermission):
    """
    Permission pour les membres de projet
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Super utilisateurs et staff ont tous les droits
        if request.user.is_superuser or request.user.is_staff:
            return True
        
        return True
    
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Super utilisateurs et staff ont tous les droits
        if request.user.is_superuser or request.user.is_staff:
            return True
        
        # Vérifier si l'utilisateur est membre du projet
        if hasattr(obj, 'project_members'):
            return obj.project_members.filter(user=request.user).exists()
        
        # Vérifier si l'utilisateur est créateur du projet
        if hasattr(obj, 'created_by'):
            return obj.created_by == request.user
        
        return False


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Permission pour permettre la modification uniquement au propriétaire
    """
    
    def has_object_permission(self, request, view, obj):
        # Lecture autorisée pour tous les utilisateurs authentifiés
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Super utilisateurs et staff ont tous les droits
        if request.user.is_superuser or request.user.is_staff:
            return True
        
        # Écriture uniquement pour le propriétaire
        if hasattr(obj, 'created_by'):
            return obj.created_by == request.user
        
        return False


class HasModulePermission(permissions.BasePermission):
    """
    Permission basée sur les modules de l'application
    """
    
    MODULE_PERMISSIONS = {
        'users': {
            'view': 'auth.view_user',
            'create': 'auth.add_user',
            'edit': 'auth.change_user',
            'delete': 'auth.delete_user',
        },
        'projects': {
            'view': 'projects.view_project',
            'create': 'projects.add_project',
            'edit': 'projects.change_project',
            'delete': 'projects.delete_project',
        },
        'teams': {
            'view': 'teams.view_team',
            'create': 'teams.add_team',
            'edit': 'teams.change_team',
            'delete': 'teams.delete_team',
        },
        'clients': {
            'view': 'users.view_clientprofile',
            'create': 'users.add_clientprofile',
            'edit': 'users.change_clientprofile',
            'delete': 'users.delete_clientprofile',
        },
        'devis': {
            'view': 'devis.view_devis',
            'create': 'devis.add_devis',
            'edit': 'devis.change_devis',
            'delete': 'devis.delete_devis',
        },
        'contrats': {
            'view': 'contrats.view_contrat',
            'create': 'contrats.add_contrat',
            'edit': 'contrats.change_contrat',
            'delete': 'contrats.delete_contrat',
        },
        'billings': {
            'view': 'billings.view_billing',
            'create': 'billings.add_billing',
            'edit': 'billings.change_billing',
            'delete': 'billings.delete_billing',
        },
        'catalog': {
            'view': 'catalog.view_service',
            'create': 'catalog.add_service',
            'edit': 'catalog.change_service',
            'delete': 'catalog.delete_service',
        },
        'documents': {
            'view': 'documents.view_document',
            'create': 'documents.add_document',
            'edit': 'documents.change_document',
            'delete': 'documents.delete_document',
        },
        'reports': {
            'view': 'projects.view_project',  # Utilise les projets pour les rapports
            'create': None,
            'edit': None,
            'delete': None,
        },
    }
    
    def __init__(self, module_name, permission_type='view'):
        self.module_name = module_name
        self.permission_type = permission_type
        super().__init__()
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Super utilisateurs ont tous les droits
        if request.user.is_superuser:
            return True
        
        # Staff ont accès limité selon leur rôle
        if request.user.is_staff:
            return True
        
        # Vérifier les permissions de module
        if self.module_name in self.MODULE_PERMISSIONS:
            module_perms = self.MODULE_PERMISSIONS[self.module_name]
            if self.permission_type in module_perms:
                permission = module_perms[self.permission_type]
                if permission:
                    return request.user.has_perm(permission)
        
        return False


class RoleBasedPermission(permissions.BasePermission):
    """
    Permission basée sur les rôles avec mapping des permissions
    """
    
    ROLE_PERMISSIONS = {
        'Managing Director': {
            'users': ['view', 'create', 'edit', 'delete'],
            'projects': ['view', 'create', 'edit', 'delete'],
            'teams': ['view', 'create', 'edit', 'delete'],
            'departments': ['view', 'create', 'edit', 'delete'],
            'clients': ['view', 'create', 'edit', 'delete'],
            'devis': ['view', 'create', 'edit', 'delete'],
            'contrats': ['view', 'create', 'edit', 'delete'],
            # 'billings': ['view', 'create', 'edit', 'delete'],
            'catalog': ['view', 'create', 'edit', 'delete'],
            'documents': ['view', 'create', 'edit', 'delete'],
            'reports': ['view'],
        },
        'Finance/Admin': {
            'users': ['view'],
            'projects': ['view'],
            'teams': ['view'],
            'departments': ['view'],
            'clients': ['view', 'create', 'edit'],
            'devis': ['view', 'create', 'edit'],
            'contrats': ['view', 'create', 'edit'],
            # 'billings': ['view', 'create', 'edit', 'delete'],
            'catalog': ['view'],
            'documents': ['view'],
            'reports': ['view'],
        },
        'Chef de projet': {
            'users': ['view'],
            'projects': ['view', 'create', 'edit'],
            'teams': ['view', 'create', 'edit'],
            'departments': ['view'],
            'clients': ['view', 'create', 'edit'],
            'devis': ['view', 'create', 'edit'],
            'contrats': ['view', 'create', 'edit'],
            # 'billings': ['view'],
            'catalog': ['view'],
            'documents': ['view', 'create', 'edit'],
            'reports': ['view'],
        },
        'Designer': {
            'users': ['view'],
            'projects': ['view'],
            'teams': ['view'],
            'departments': ['view'],
            'clients': ['view'],
            'devis': ['view'],
            'contrats': ['view'],
            # 'billings': ['view'],
            'catalog': ['view'],
            'documents': ['view', 'create', 'edit'],
            'reports': ['view'],
        },
        'Développeur': {
            'users': ['view'],
            'projects': ['view'],
            'teams': ['view'],
            'departments': ['view'],
            'clients': ['view'],
            'devis': ['view'],
            'contrats': ['view'],
            # 'billings': ['view'],
            'catalog': ['view'],
            'documents': ['view', 'create', 'edit'],
            'reports': ['view'],
        },
        'Rédacteur': {
            'users': ['view'],
            'projects': ['view'],
            'teams': ['view'],
            'departments': ['view'],
            'clients': ['view'],
            'devis': ['view'],
            'contrats': ['view'],
            # 'billings': ['view'],
            'catalog': ['view'],
            'documents': ['view', 'create', 'edit'],
            'reports': ['view'],
        },
        'Consultant': {
            'users': ['view'],
            'projects': ['view'],
            'teams': ['view'],
            'departments': ['view'],
            'clients': ['view', 'create', 'edit'],
            'devis': ['view', 'create', 'edit'],
            'contrats': ['view', 'create', 'edit'],
            # 'billings': ['view'],
            'catalog': ['view'],
            'documents': ['view', 'create', 'edit'],
            'reports': ['view'],
        },
        'Assistant': {
            'users': ['view'],
            'projects': ['view'],
            'teams': ['view'],
            'departments': ['view'],
            'clients': ['view', 'create', 'edit'],
            'devis': ['view'],
            'contrats': ['view'],
            # 'billings': ['view'],
            'catalog': ['view'],
            'documents': ['view'],
            'reports': ['view'],
        },
    }
    
    def __init__(self, module_name, permission_type='view'):
        self.module_name = module_name
        self.permission_type = permission_type
        super().__init__()
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Super utilisateurs ont tous les droits
        if request.user.is_superuser:
            return True
        
        # Vérifier les permissions selon le rôle
        if hasattr(request.user, 'profile') and request.user.profile.role:
            role = request.user.profile.role
            if role in self.ROLE_PERMISSIONS:
                role_perms = self.ROLE_PERMISSIONS[role]
                if self.module_name in role_perms:
                    return self.permission_type in role_perms[self.module_name]
        
        return False 