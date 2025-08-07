#!/usr/bin/env python
"""
Script de test pour le système de permissions SAKOM
"""

import os
import sys
import django

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User, Group, Permission
from django.contrib.contenttypes.models import ContentType
from users.models import UserProfile
from users.management import (
    initialize_permissions, 
    get_user_permissions_summary,
    check_user_permission,
    get_role_permissions
)
from users.permissions import RoleBasedPermission, IsProjectManager, IsFinanceAdmin


def test_permission_system():
    """Tester le système de permissions"""
    
    print("=== Test du système de permissions SAKOM ===\n")
    
    # 1. Initialiser les permissions
    print("1. Initialisation des permissions...")
    try:
        initialize_permissions()
        print("✓ Permissions initialisées avec succès")
    except Exception as e:
        print(f"✗ Erreur lors de l'initialisation: {e}")
        return
    
    # 2. Vérifier les groupes créés
    print("\n2. Vérification des groupes...")
    groups = Group.objects.all()
    for group in groups:
        perm_count = group.permissions.count()
        user_count = group.user_set.count()
        print(f"  Groupe '{group.name}': {perm_count} permissions, {user_count} utilisateurs")
    
    # 3. Vérifier les utilisateurs et leurs permissions
    print("\n3. Vérification des utilisateurs...")
    users = User.objects.filter(is_active=True)
    for user in users:
        if hasattr(user, 'profile') and user.profile.role:
            summary = get_user_permissions_summary(user)
            print(f"\n  Utilisateur: {summary['user_name']}")
            print(f"  Rôle: {summary['user_role']}")
            print(f"  Groupes: {', '.join(summary['groups'])}")
            print(f"  Permissions: {len(summary['permissions'])} permissions")
            
            # Vérifier les permissions par module
            for module, has_perm in summary['module_permissions'].items():
                status = "✓" if has_perm else "✗"
                print(f"    {module}: {status}")
    
    # 4. Tester les permissions spécifiques
    print("\n4. Test des permissions spécifiques...")
    
    # Trouver un utilisateur avec un rôle spécifique
    managing_director = User.objects.filter(profile__role='Managing Director').first()
    if managing_director:
        print(f"\n  Test avec {managing_director.get_full_name()} (Managing Director):")
        
        # Tester les permissions de base
        permissions_to_test = [
            'auth.view_user',
            'projects.view_project',
            'projects.add_project',
            'teams.view_team',
            'users.view_clientprofile',
            'billings.view_billing',
        ]
        
        for perm in permissions_to_test:
            has_perm = check_user_permission(managing_director, perm)
            status = "✓" if has_perm else "✗"
            print(f"    {perm}: {status}")
    
    # 5. Tester les permissions par rôle
    print("\n5. Test des permissions par rôle...")
    roles = ['Managing Director', 'Finance/Admin', 'Chef de projet', 'Designer']
    
    for role in roles:
        permissions = get_role_permissions(role)
        print(f"\n  Rôle '{role}': {len(permissions)} permissions")
        if permissions:
            print(f"    Exemples: {', '.join(permissions[:5])}")
    
    # 6. Tester les classes de permissions DRF
    print("\n6. Test des classes de permissions DRF...")
    
    # Simuler une requête
    class MockRequest:
        def __init__(self, user):
            self.user = user
    
    class MockView:
        pass
    
    # Tester RoleBasedPermission
    if managing_director:
        request = MockRequest(managing_director)
        view = MockView()
        
        # Test pour les projets
        perm = RoleBasedPermission('projects', 'view')
        has_perm = perm.has_permission(request, view)
        print(f"  RoleBasedPermission('projects', 'view') pour Managing Director: {'✓' if has_perm else '✗'}")
        
        # Test pour la facturation
        perm = RoleBasedPermission('billings', 'view')
        has_perm = perm.has_permission(request, view)
        print(f"  RoleBasedPermission('billings', 'view') pour Managing Director: {'✓' if has_perm else '✗'}")
    
    print("\n=== Test terminé ===")


def test_specific_user(username):
    """Tester les permissions d'un utilisateur spécifique"""
    
    try:
        user = User.objects.get(username=username)
        summary = get_user_permissions_summary(user)
        
        print(f"\n=== Permissions pour {summary['user_name']} ===")
        print(f"Rôle: {summary['user_role']}")
        print(f"Groupes: {', '.join(summary['groups'])}")
        print(f"Staff: {summary['is_staff']}")
        print(f"Superuser: {summary['is_superuser']}")
        
        print("\nPermissions par module:")
        for module, has_perm in summary['module_permissions'].items():
            status = "✓" if has_perm else "✗"
            print(f"  {module}: {status}")
        
        print(f"\nTotal des permissions: {len(summary['permissions'])}")
        
    except User.DoesNotExist:
        print(f"Utilisateur '{username}' non trouvé")


if __name__ == '__main__':
    if len(sys.argv) > 1:
        # Test d'un utilisateur spécifique
        username = sys.argv[1]
        test_specific_user(username)
    else:
        # Test complet du système
        test_permission_system() 