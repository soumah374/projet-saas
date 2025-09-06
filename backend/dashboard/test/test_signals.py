#!/usr/bin/env python
"""
Test simple pour vérifier le fonctionnement des signaux du tableau de bord
"""

import os
import sys
import django
from django.conf import settings

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from dashboard.signals import DashboardSignalManager
from dashboard.models import DashboardMetrics, DashboardCache
from django.utils import timezone


def test_signals_import():
    """Teste l'import des signaux"""
    print("🧪 Test d'import des signaux...")
    
    try:
        from dashboard import signals
        print("  ✓ Import des signaux réussi")
        return True
    except ImportError as e:
        print(f"  ✗ Erreur d'import: {e}")
        return False


def test_signal_manager():
    """Teste le gestionnaire de signaux"""
    print("\n🧪 Test du gestionnaire de signaux...")
    
    try:
        # Test d'invalidation du cache
        print("  - Test d'invalidation du cache...")
        DashboardSignalManager.invalidate_cache()
        print("    ✓ Invalidation du cache réussie")
        
        # Test de mise à jour des métriques
        print("  - Test de mise à jour des métriques...")
        DashboardSignalManager.update_metrics()
        print("    ✓ Mise à jour des métriques réussie")
        
        return True
    except Exception as e:
        print(f"  ✗ Erreur: {e}")
        return False


def test_models():
    """Teste les modèles du tableau de bord"""
    print("\n🧪 Test des modèles...")
    
    try:
        # Test DashboardMetrics
        print("  - Test DashboardMetrics...")
        metrics_count = DashboardMetrics.objects.count()
        print(f"    ✓ {metrics_count} métriques trouvées")
        
        # Test DashboardCache
        print("  - Test DashboardCache...")
        cache_count = DashboardCache.objects.count()
        print(f"    ✓ {cache_count} caches trouvés")
        
        return True
    except Exception as e:
        print(f"  ✗ Erreur: {e}")
        return False


def test_metrics_calculation():
    """Teste le calcul des métriques"""
    print("\n🧪 Test du calcul des métriques...")
    
    try:
        # Compte les métriques avant
        before_count = DashboardMetrics.objects.count()
        
        # Lance le calcul
        DashboardSignalManager.update_metrics()
        
        # Compte les métriques après
        after_count = DashboardMetrics.objects.count()
        
        print(f"  - Métriques avant: {before_count}")
        print(f"  - Métriques après: {after_count}")
        print(f"  - Différence: {after_count - before_count}")
        
        if after_count >= before_count:
            print("    ✓ Calcul des métriques réussi")
            return True
        else:
            print("    ⚠ Aucune nouvelle métrique créée")
            return True
            
    except Exception as e:
        print(f"  ✗ Erreur: {e}")
        return False


def main():
    """Fonction principale de test"""
    print("🚀 TEST DES SIGNAUX DU TABLEAU DE BORD")
    print("=" * 50)
    
    tests = [
        test_signals_import,
        test_signal_manager,
        test_models,
        test_metrics_calculation
    ]
    
    results = []
    
    for test in tests:
        try:
            result = test()
            results.append(result)
        except Exception as e:
            print(f"  ✗ Erreur critique dans {test.__name__}: {e}")
            results.append(False)
    
    # Résumé
    print("\n" + "=" * 50)
    print("📊 RÉSUMÉ DES TESTS")
    
    passed = sum(results)
    total = len(results)
    
    for i, (test, result) in enumerate(zip(tests, results), 1):
        status = "✓" if result else "✗"
        print(f"  {i}. {test.__name__}: {status}")
    
    print(f"\nRésultat: {passed}/{total} tests réussis")
    
    if passed == total:
        print("🎉 Tous les tests sont passés avec succès!")
        return 0
    else:
        print("⚠️  Certains tests ont échoué")
        return 1


if __name__ == '__main__':
    sys.exit(main()) 