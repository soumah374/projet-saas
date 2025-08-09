#!/usr/bin/env python
import os
import sys
import django

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.contenttypes.models import ContentType
from django.contrib.auth.models import Permission
from django.apps import apps

def check_users_app():
    """Vérifier les modèles disponibles dans l'app users"""
    print("=== Modèles dans l'app 'users' ===")
    
    try:
        users_app = apps.get_app_config('users')
        models = users_app.get_models()
        
        print(f"App: {users_app.label}")
        print(f"Nombre de modèles: {len(models)}")
        
        for model in models:
            model_name = model.__name__
            model_meta_name = model._meta.model_name
            print(f"  - Classe: {model_name}")
            print(f"    Meta name: {model_meta_name}")
            print(f"    Verbose name: {model._meta.verbose_name}")
            
            # Vérifier le ContentType correspondant
            try:
                ct = ContentType.objects.get_for_model(model)
                print(f"    ContentType: {ct} (app: {ct.app_label}, model: {ct.model})")
            except Exception as e:
                print(f"    ❌ Erreur ContentType: {e}")
            print()
            
    except Exception as e:
        print(f"❌ Erreur lors de l'accès à l'app users: {e}")

def check_userprofile_contenttype():
    """Vérifier si le ContentType userprofile existe"""
    print("=== Vérification ContentType 'userprofile' ===")
    
    try:
        ct = ContentType.objects.get(app_label='users', model='userprofile')
        print(f"✅ ContentType trouvé: {ct}")
        print(f"   ID: {ct.id}")
        print(f"   App: {ct.app_label}")
        print(f"   Model: {ct.model}")
    except ContentType.DoesNotExist:
        print("❌ ContentType 'users.userprofile' non trouvé")
        
        # Lister les ContentTypes disponibles dans users
        print("\nContentTypes disponibles dans l'app 'users':")
        users_cts = ContentType.objects.filter(app_label='users')
        for ct in users_cts:
            print(f"  - {ct.model} ({ct})")

def test_permission_creation():
    """Tester la création d'une permission avec userprofile"""
    print("\n=== Test création permission avec userprofile ===")
    
    try:
        # Essayer de récupérer le ContentType
        content_type = ContentType.objects.get(app_label='users', model='userprofile')
        print(f"✅ ContentType récupéré: {content_type}")
        
        # Tester la création d'une permission (sans la sauvegarder)
        permission_data = {
            'name': 'Can test users',
            'codename': 'test_users',
            'content_type': content_type
        }
        
        # Vérifier si la permission existe déjà
        existing = Permission.objects.filter(codename='test_users').first()
        if existing:
            print(f"⚠️  Permission 'test_users' existe déjà: {existing}")
        else:
            print("✅ Permission 'test_users' peut être créée")
            print(f"   Données: {permission_data}")
            
    except ContentType.DoesNotExist:
        print("❌ Impossible de créer une permission avec userprofile - ContentType non trouvé")
    except Exception as e:
        print(f"❌ Erreur lors du test: {e}")

if __name__ == '__main__':
    check_users_app()
    check_userprofile_contenttype()
    test_permission_creation() 