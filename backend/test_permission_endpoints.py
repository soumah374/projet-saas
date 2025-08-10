#!/usr/bin/env python3
"""
Script de test pour les endpoints de permissions
"""

import requests
import json

# Configuration
BASE_URL = "http://localhost:8000/api/v1"
LOGIN_URL = f"{BASE_URL}/auth/login/"

def get_auth_token():
    """Obtenir un token d'authentification"""
    login_data = {
        "email": "admin@example.com",  # Remplacez par un utilisateur admin existant
        "password": "admin123"  # Remplacez par le mot de passe correct
    }
    
    try:
        response = requests.post(LOGIN_URL, json=login_data)
        if response.status_code == 200:
            return response.json()['access']
        else:
            print(f"Erreur de connexion: {response.status_code}")
            print(response.text)
            return None
    except Exception as e:
        print(f"Erreur lors de la connexion: {e}")
        return None

def test_permission_endpoints():
    """Tester les endpoints de permissions"""
    
    # Obtenir le token d'authentification
    token = get_auth_token()
    if not token:
        print("Impossible d'obtenir le token d'authentification")
        return
    
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    print("🔍 Test des endpoints de permissions...")
    
    # Test 1: Obtenir les rôles
    print("\n1. Test GET /auth/users/permissions/roles/")
    try:
        response = requests.get(f"{BASE_URL}/auth/users/permissions/roles/", headers=headers)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Rôles trouvés: {len(data.get('roles', []))}")
            for role in data.get('roles', []):
                print(f"  - {role['name']} ({role['user_count']} utilisateurs)")
        else:
            print(f"Erreur: {response.text}")
    except Exception as e:
        print(f"Erreur: {e}")
    
    # Test 2: Obtenir les permissions
    print("\n2. Test GET /auth/users/permissions/permissions/")
    try:
        response = requests.get(f"{BASE_URL}/auth/users/permissions/permissions/", headers=headers)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Permissions trouvées: {len(data.get('permissions', []))}")
            for perm in data.get('permissions', [])[:5]:  # Afficher les 5 premières
                print(f"  - {perm['full_name']}")
        else:
            print(f"Erreur: {response.text}")
    except Exception as e:
        print(f"Erreur: {e}")
    
    # Test 3: Obtenir les permissions des rôles
    print("\n3. Test GET /auth/users/permissions/role-permissions/")
    try:
        response = requests.get(f"{BASE_URL}/auth/users/permissions/role-permissions/", headers=headers)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Rôles avec permissions: {len(data.get('role_permissions', []))}")
            for role_perm in data.get('role_permissions', []):
                print(f"  - {role_perm['role']}: {len(role_perm['permissions'])} permissions")
        else:
            print(f"Erreur: {response.text}")
    except Exception as e:
        print(f"Erreur: {e}")
    
    # Test 4: Créer un nouveau rôle
    print("\n4. Test POST /auth/users/permissions/create_role/")
    try:
        new_role_data = {"name": "Test Role"}
        response = requests.post(f"{BASE_URL}/auth/users/permissions/create_role/", 
                               json=new_role_data, headers=headers)
        print(f"Status: {response.status_code}")
        if response.status_code == 201:
            data = response.json()
            print(f"Rôle créé: {data['name']}")
        else:
            print(f"Erreur: {response.text}")
    except Exception as e:
        print(f"Erreur: {e}")
    
    # Test 5: Créer une nouvelle permission
    print("\n5. Test POST /auth/users/permissions/create_permission/")
    try:
        new_perm_data = {"name": "users.custom_action"}
        response = requests.post(f"{BASE_URL}/auth/users/permissions/create_permission/", 
                               json=new_perm_data, headers=headers)
        print(f"Status: {response.status_code}")
        if response.status_code == 201:
            data = response.json()
            print(f"Permission créée: {data['codename']}")
        else:
            print(f"Erreur: {response.text}")
    except Exception as e:
        print(f"Erreur: {e}")
    
    print("\n✅ Tests terminés!")

if __name__ == "__main__":
    test_permission_endpoints() 