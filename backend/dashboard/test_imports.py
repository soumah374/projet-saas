#!/usr/bin/env python
"""
Test simple pour vérifier que tous les imports fonctionnent
"""

import os
import sys
import django

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

try:
    django.setup()
    print("✅ Django configuré avec succès")
except Exception as e:
    print(f"❌ Erreur de configuration Django: {e}")
    sys.exit(1)

# Test des imports
tests = [
    ("dashboard.models", "DashboardMetrics, DashboardCache"),
    ("dashboard.signals", "DashboardSignalManager"),
    ("dashboard.admin", "DashboardMetricsAdmin, DashboardCacheAdmin"),
    ("dashboard.services", "DashboardMetricsService"),
]

print("\n🧪 Test des imports...")

for module_name, expected_imports in tests:
    try:
        module = __import__(module_name, fromlist=['*'])
        print(f"  ✅ {module_name} importé avec succès")
        
        # Vérifie que les classes attendues existent
        for import_name in expected_imports.split(', '):
            if hasattr(module, import_name):
                print(f"    ✅ {import_name} trouvé")
            else:
                print(f"    ⚠️  {import_name} non trouvé dans {module_name}")
                
    except ImportError as e:
        print(f"  ❌ Erreur d'import de {module_name}: {e}")
    except Exception as e:
        print(f"  ❌ Erreur inattendue avec {module_name}: {e}")

print("\n🎯 Test des modèles...")

try:
    from dashboard.models import DashboardMetrics, DashboardCache
    
    # Test de création d'instances
    metrics = DashboardMetrics()
    cache = DashboardCache()
    
    print("  ✅ Modèles instanciés avec succès")
    
    # Test des méthodes
    if hasattr(cache, 'is_expired'):
        print("  ✅ Méthode is_expired() trouvée")
    else:
        print("  ⚠️  Méthode is_expired() non trouvée")
        
except Exception as e:
    print(f"  ❌ Erreur avec les modèles: {e}")

print("\n🚀 Test des signaux...")

try:
    from dashboard.signals import DashboardSignalManager
    
    # Test des méthodes statiques
    if hasattr(DashboardSignalManager, 'invalidate_cache'):
        print("  ✅ Méthode invalidate_cache() trouvée")
    else:
        print("  ⚠️  Méthode invalidate_cache() non trouvée")
        
    if hasattr(DashboardSignalManager, 'update_metrics'):
        print("  ✅ Méthode update_metrics() trouvée")
    else:
        print("  ⚠️  Méthode update_metrics() non trouvée")
        
except Exception as e:
    print(f"  ❌ Erreur avec les signaux: {e}")

print("\n✅ Test des imports terminé!") 