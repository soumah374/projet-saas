from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from django.contrib.auth import get_user_model
from .models import UserProfile
from projects.models import Project
from billings.models import Facture

User = get_user_model()


def create_role_groups():
    """Créer les groupes de rôles avec leurs permissions"""
    
    # Définir les permissions par rôle
    role_permissions = {
        'Managing Director': {
            'users': ['view', 'add', 'change', 'delete'],
            'projects': ['view', 'add', 'change', 'delete'],
            'teams': ['view', 'add', 'change', 'delete'],
            'departments': ['view', 'add', 'change', 'delete'],
            'clients': ['view', 'add', 'change', 'delete'],
            'devis': ['view', 'add', 'change', 'delete'],
            'contrats': ['view', 'add', 'change', 'delete'],
            'billings': ['view', 'add', 'change', 'delete'],
            'catalog': ['view', 'add', 'change', 'delete'],
            'documents': ['view', 'add', 'change', 'delete'],
            'notifications': ['view', 'add', 'change', 'delete'],
        },
        'Finance/Admin': {
            'users': ['view'],
            'projects': ['view'],
            'teams': ['view'],
            'departments': ['view'],
            'clients': ['view', 'add', 'change'],
            'devis': ['view', 'add', 'change'],
            'contrats': ['view', 'add', 'change'],
            'billings': ['view', 'add', 'change', 'delete'],
            'catalog': ['view'],
            'documents': ['view'],
            'notifications': ['view'],
        },
        'Chef de projet': {
            'users': ['view'],
            'projects': ['view', 'add', 'change'],
            'teams': ['view', 'add', 'change'],
            'departments': ['view'],
            'clients': ['view', 'add', 'change'],
            'devis': ['view', 'add', 'change'],
            'contrats': ['view', 'add', 'change'],
            'billings': ['view'],
            'catalog': ['view'],
            'documents': ['view', 'add', 'change'],
            'notifications': ['view', 'add', 'change'],
        },
        'Designer': {
            'users': ['view'],
            'projects': ['view'],
            'teams': ['view'],
            'departments': ['view'],
            'clients': ['view'],
            'devis': ['view'],
            'contrats': ['view'],
            'billings': ['view'],
            'catalog': ['view'],
            'documents': ['view', 'add', 'change'],
            'notifications': ['view'],
        },
        'Développeur': {
            'users': ['view'],
            'projects': ['view'],
            'teams': ['view'],
            'departments': ['view'],
            'clients': ['view'],
            'devis': ['view'],
            'contrats': ['view'],
            'billings': ['view'],
            'catalog': ['view'],
            'documents': ['view', 'add', 'change'],
            'notifications': ['view'],
        },
        'Rédacteur': {
            'users': ['view'],
            'projects': ['view'],
            'teams': ['view'],
            'departments': ['view'],
            'clients': ['view'],
            'devis': ['view'],
            'contrats': ['view'],
            'billings': ['view'],
            'catalog': ['view'],
            'documents': ['view', 'add', 'change'],
            'notifications': ['view'],
        },
        'Consultant': {
            'users': ['view'],
            'projects': ['view'],
            'teams': ['view'],
            'departments': ['view'],
            'clients': ['view', 'add', 'change'],
            'devis': ['view', 'add', 'change'],
            'contrats': ['view', 'add', 'change'],
            'billings': ['view'],
            'catalog': ['view'],
            'documents': ['view', 'add', 'change'],
            'notifications': ['view'],
        },
        'Assistant': {
            'users': ['view'],
            'projects': ['view'],
            'teams': ['view'],
            'departments': ['view'],
            'clients': ['view', 'add', 'change'],
            'devis': ['view'],
            'contrats': ['view'],
            'billings': ['view'],
            'catalog': ['view'],
            'documents': ['view'],
            'notifications': ['view'],
        },
    }
    
    # Créer les groupes pour chaque rôle
    for role_name, permissions in role_permissions.items():
        group, created = Group.objects.get_or_create(name=role_name)
        
        # Ajouter les permissions au groupe
        for app_name, perm_types in permissions.items():
            for perm_type in perm_types:
                try:
                    # Construire le nom de la permission
                    perm_name = f"{app_name}.{perm_type}_{app_name.rstrip('s')}"
                    
                    # Chercher la permission
                    permission = Permission.objects.filter(
                        codename=f"{perm_type}_{app_name.rstrip('s')}",
                        content_type__app_label=app_name
                    ).first()
                    
                    if permission:
                        group.permissions.add(permission)
                except Exception as e:
                    print(f"Erreur lors de l'ajout de la permission {perm_name}: {e}")
        
        print(f"Groupe '{role_name}' créé avec {group.permissions.count()} permissions")

    # Créer/mettre à jour le groupe Super Admin avec toutes les permissions
    super_admin_group, _ = Group.objects.get_or_create(name='Super Admin')
    super_admin_group.permissions.set(Permission.objects.all())
    print(f"Groupe 'Super Admin' créé/mis à jour avec {super_admin_group.permissions.count()} permissions")


def assign_users_to_groups():
    """Assigner les utilisateurs aux groupes selon leur rôle"""
    
    users = User.objects.filter(is_active=True)
    
    for user in users:
        if hasattr(user, 'profile') and user.profile.role:
            role = user.profile.role
            
            # Retirer l'utilisateur de tous les groupes de rôles
            role_groups = Group.objects.filter(
                name__in=[
                    'Managing Director', 'Finance/Admin', 'Chef de projet',
                    'Designer', 'Développeur', 'Rédacteur', 'Consultant', 'Assistant', 'Super Admin'
                ]
            )
            user.groups.remove(*role_groups)
            
            # Ajouter l'utilisateur au groupe correspondant à son rôle
            try:
                group = Group.objects.get(name=role)
                user.groups.add(group)
                print(f"Utilisateur {user.get_full_name()} assigné au groupe {role}")
            except Group.DoesNotExist:
                print(f"Groupe {role} non trouvé pour l'utilisateur {user.get_full_name()}")


def create_custom_permissions():
    """Créer des permissions personnalisées pour l'application"""
    
    # Permissions pour les projets
    try:
        project_ct = ContentType.objects.get_for_model(Project)
    except Exception:
        project_ct = ContentType.objects.get(app_label='projects', model='project')
    custom_permissions = [
        ('can_manage_project_members', 'Can manage project members'),
        ('can_view_project_reports', 'Can view project reports'),
        ('can_export_project_data', 'Can export project data'),
        ('can_start_project', 'Can start project'),
        ('can_move_to_livraison', 'Can move to livraison'),
        ('can_complete_project', 'Can complete project'),
    ]
    
    for codename, name in custom_permissions:
        Permission.objects.get_or_create(
            codename=codename,
            name=name,
            content_type=project_ct
        )
    
    # Permissions pour les facturations
    try:
        billing_ct = ContentType.objects.get_for_model(Facture)
    except Exception:
        billing_ct = ContentType.objects.get(app_label='billings', model='facture')
    billing_permissions = [
        ('can_approve_billing', 'Can approve billing'),
        ('can_generate_invoice', 'Can generate invoice'),
        ('can_view_financial_reports', 'Can view financial reports'),
    ]
    
    for codename, name in billing_permissions:
        Permission.objects.get_or_create(
            codename=codename,
            name=name,
            content_type=billing_ct
        )
    
    print("Permissions personnalisées créées")


def initialize_permissions():
    """Initialiser complètement le système de permissions"""
    
    print("Création des groupes de rôles...")
    create_role_groups()
    
    print("Création des permissions personnalisées...")
    create_custom_permissions()
    
    print("Assignation des utilisateurs aux groupes...")
    assign_users_to_groups()
    
    print("Système de permissions initialisé avec succès!")


def get_user_permissions_summary(user):
    """Obtenir un résumé des permissions d'un utilisateur"""
    
    summary = {
        'user_id': user.id,
        'user_name': user.get_full_name(),
        'user_role': user.profile.role if hasattr(user, 'profile') else '',
        'groups': list(user.groups.values_list('name', flat=True)),
        'permissions': list(user.get_all_permissions()),
        'is_staff': user.is_staff,
        'is_superuser': user.is_superuser,
    }
    
    # Ajouter les permissions spécifiques par module
    module_permissions = {
        'users': user.has_perm('auth.view_user'),
        'projects': user.has_perm('projects.view_project'),
        'teams': user.has_perm('teams.view_team'),
        'clients': user.has_perm('users.view_clientprofile'),
        'devis': user.has_perm('devis.view_devis'),
        'contrats': user.has_perm('contrats.view_contrat'),
        'billings': user.has_perm('billings.view_billing'),
        'catalog': user.has_perm('catalog.view_service'),
        'documents': user.has_perm('documents.view_document'),
    }
    
    summary['module_permissions'] = module_permissions
    
    return summary


def check_user_permission(user, permission_name):
    """Vérifier si un utilisateur a une permission spécifique"""
    return user.has_perm(permission_name)


def get_role_permissions(role_name):
    """Obtenir les permissions d'un rôle"""
    try:
        group = Group.objects.get(name=role_name)
        return list(group.permissions.values_list('codename', flat=True))
    except Group.DoesNotExist:
        return []


def assign_permission_to_role(role_name, permission_name):
    """Assigner une permission à un rôle"""
    try:
        group = Group.objects.get(name=role_name)
        permission = Permission.objects.get(codename=permission_name)
        group.permissions.add(permission)
        return True
    except (Group.DoesNotExist, Permission.DoesNotExist):
        return False


def remove_permission_from_role(role_name, permission_name):
    """Retirer une permission d'un rôle"""
    try:
        group = Group.objects.get(name=role_name)
        permission = Permission.objects.get(codename=permission_name)
        group.permissions.remove(permission)
        return True
    except (Group.DoesNotExist, Permission.DoesNotExist):
        return False 