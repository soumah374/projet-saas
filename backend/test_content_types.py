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

def list_content_types():
    """Lister tous les ContentTypes disponibles"""
    print("=== ContentTypes disponibles ===")
    content_types = ContentType.objects.all().order_by('app_label', 'model')
    
    for ct in content_types:
        print(f"App: {ct.app_label}, Model: {ct.model}, ID: {ct.id}")
    
    print(f"\nTotal: {content_types.count()} ContentTypes")

def list_permissions_by_app():
    """Lister les permissions par app"""
    print("\n=== Permissions par app ===")
    
    apps = ContentType.objects.values_list('app_label', flat=True).distinct().order_by('app_label')
    
    for app in apps:
        print(f"\n--- App: {app} ---")
        permissions = Permission.objects.filter(content_type__app_label=app).order_by('codename')
        
        for perm in permissions:
            print(f"  {perm.codename} - {perm.name}")

def check_installed_apps():
    """Vérifier les apps installées et leurs modèles"""
    print("\n=== Apps installées et leurs modèles ===")
    
    target_apps = ['users', 'projects', 'teams', 'departments', 'devis', 'contrats', 'billings', 'catalog', 'documents', 'notifications']
    
    for app_name in target_apps:
        try:
            app_config = apps.get_app_config(app_name)
            print(f"\n--- App: {app_name} ---")
            print(f"  Label: {app_config.label}")
            print(f"  Path: {app_config.path}")
            
            models = app_config.get_models()
            print(f"  Modèles ({len(models)}):")
            for model in models:
                print(f"    - {model.__name__.lower()} ({model._meta.verbose_name})")
                
        except Exception as e:
            print(f"❌ App {app_name}: {e}")

def test_permission_creation():
    """Tester la création de permissions personnalisées"""
    print("\n=== Test de création de permissions ===")
    
    # Mapping exact basé sur vos apps réelles
    app_model_mappings = {
        'users': ('users', 'user'),
        'projects': ('projects', 'project'),
        'teams': ('teams', 'team'),
        'departments': ('departments', 'department'),
        'clients': ('users', 'clientprofile'),
        'devis': ('devis', 'devis'),
        'contrats': ('contrats', 'contrat'),
        'billings': ('billings', 'billing'),
        'catalog': ('catalog', 'catalog'),
        'documents': ('documents', 'document'),
        'notifications': ('notifications', 'notification'),
    }
    
    modules_to_test = list(app_model_mappings.keys())
    perm_types = ['view', 'add', 'change', 'delete']
    
    for module in modules_to_test:
        print(f"\n--- Module: {module} ---")
        
        # Utiliser le mapping défini
        app_label, model_name = app_model_mappings.get(module, ('users', 'user'))
        content_type = None
        
        try:
            content_type = ContentType.objects.get(app_label=app_label, model=model_name)
            print(f"✅ ContentType trouvé: {content_type} (app: {app_label}, model: {model_name})")
        except ContentType.DoesNotExist:
            # Fallback vers users.user
            try:
                content_type = ContentType.objects.get(app_label='users', model='user')
                print(f"⚠️  ContentType non trouvé pour {app_label}.{model_name}, utilisation du fallback: {content_type}")
            except ContentType.DoesNotExist:
                print(f"❌ Aucun ContentType trouvé pour {module}")
                continue
        
        # Tester la création de permissions
        for perm_type in perm_types:
            codename = f"{perm_type}_{module}"
            
            try:
                # Vérifier si la permission existe déjà
                existing_perm = Permission.objects.get(codename=codename)
                print(f"  Permission existante: {existing_perm.codename}")
            except Permission.DoesNotExist:
                print(f"  Permission {codename} n'existe pas - peut être créée")

if __name__ == '__main__':
    list_content_types()
    check_installed_apps()
    list_permissions_by_app()
    test_permission_creation() 