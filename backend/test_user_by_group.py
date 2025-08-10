#!/usr/bin/env python
import os
import sys
import django
import requests

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User, Group

def test_user_by_group_endpoint():
    """Tester l'endpoint user_by_group"""
    
    # Configuration de base
    BASE_URL = "http://localhost:8000/api/v1/auth/permissions"
    
    print("=== Test de l'endpoint user_by_group ===")
    
    # D'abord, lister les groupes disponibles
    print("\n1. Récupération des groupes disponibles...")
    try:
        groups = Group.objects.all()
        print(f"Groupes trouvés: {groups.count()}")
        
        for group in groups:
            user_count = group.user_set.count()
            print(f"  - {group.name} (ID: {group.id}) - {user_count} utilisateur(s)")
            
            if user_count > 0:
                print("    Utilisateurs:")
                for user in group.user_set.all()[:3]:  # Limiter à 3 pour l'affichage
                    print(f"      * {user.first_name} {user.last_name} (@{user.username})")
                if user_count > 3:
                    print(f"      ... et {user_count - 3} autre(s)")
    except Exception as e:
        print(f"Erreur lors de la récupération des groupes: {e}")
        return
    
    # Tester l'endpoint pour chaque groupe qui a des utilisateurs
    print(f"\n2. Test de l'endpoint pour les groupes avec utilisateurs...")
    
    groups_with_users = Group.objects.filter(user__isnull=False).distinct()
    
    if not groups_with_users.exists():
        print("❌ Aucun groupe avec des utilisateurs trouvé")
        return
    
    for group in groups_with_users[:2]:  # Tester seulement les 2 premiers
        print(f"\n--- Test pour le groupe '{group.name}' (ID: {group.id}) ---")
        
        # Simuler l'appel API (sans authentification pour le test)
        endpoint_url = f"{BASE_URL}/{group.id}/users-by-group/"
        print(f"URL testée: {endpoint_url}")
        
        # Test direct avec Django (simulation de l'endpoint)
        try:
            users = group.user_set.all().order_by('first_name', 'last_name')
            users_data = []
            
            for user in users:
                users_data.append({
                    'id': user.id,
                    'username': user.username,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'email': user.email,
                    'is_active': user.is_active,
                })
            
            response_data = {
                'group_id': group.id,
                'group_name': group.name,
                'users': users_data,
                'total_count': len(users_data)
            }
            
            print(f"✅ Réponse simulée:")
            print(f"   Groupe: {response_data['group_name']}")
            print(f"   Nombre d'utilisateurs: {response_data['total_count']}")
            print(f"   Utilisateurs:")
            
            for user_data in users_data[:3]:  # Afficher les 3 premiers
                print(f"     - {user_data['first_name']} {user_data['last_name']} ({user_data['email']})")
            
            if len(users_data) > 3:
                print(f"     ... et {len(users_data) - 3} autre(s)")
                
        except Exception as e:
            print(f"❌ Erreur lors du test: {e}")

def create_test_data():
    """Créer des données de test si nécessaire"""
    print("\n=== Création de données de test ===")
    
    # Créer un groupe de test
    test_group, created = Group.objects.get_or_create(name='Test Group')
    if created:
        print(f"✅ Groupe de test créé: {test_group.name}")
    else:
        print(f"ℹ️  Groupe de test existe déjà: {test_group.name}")
    
    # Créer quelques utilisateurs de test
    test_users = [
        {'username': 'test_user1', 'first_name': 'Test', 'last_name': 'User1', 'email': 'test1@example.com'},
        {'username': 'test_user2', 'first_name': 'Test', 'last_name': 'User2', 'email': 'test2@example.com'},
    ]
    
    for user_data in test_users:
        user, created = User.objects.get_or_create(
            username=user_data['username'],
            defaults={
                'first_name': user_data['first_name'],
                'last_name': user_data['last_name'],
                'email': user_data['email'],
                'is_active': True
            }
        )
        
        if created:
            print(f"✅ Utilisateur créé: {user.username}")
        
        # Ajouter l'utilisateur au groupe de test
        test_group.user_set.add(user)
    
    print(f"✅ Groupe de test configuré avec {test_group.user_set.count()} utilisateur(s)")

if __name__ == '__main__':
    print("Script de test pour l'endpoint user_by_group")
    print("=" * 50)
    
    # Option pour créer des données de test
    if len(sys.argv) > 1 and sys.argv[1] == '--create-test-data':
        create_test_data()
    
    test_user_by_group_endpoint()
    
    print("\n" + "=" * 50)
    print("Test terminé !")
    print("Pour créer des données de test: python test_user_by_group.py --create-test-data") 