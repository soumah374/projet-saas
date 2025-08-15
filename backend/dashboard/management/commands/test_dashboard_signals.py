from django.core.management.base import BaseCommand
from django.utils import timezone
from django.core.cache import cache
from django.db import transaction

from dashboard.signals import DashboardSignalManager
from dashboard.models import DashboardMetrics, DashboardCache
from projects.models import Project, ProjectTask
from users.models import User
from teams.models import Team
from contrats.models import Contrat
from devis.models import Devis
from billings.models import Facture


class Command(BaseCommand):
    help = 'Teste les signaux du tableau de bord et la gestion des métriques'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--test-signals',
            action='store_true',
            help='Teste la réactivité des signaux'
        )
        parser.add_argument(
            '--test-cache',
            action='store_true',
            help='Teste la gestion du cache'
        )
        parser.add_argument(
            '--test-metrics',
            action='store_true',
            help='Teste le calcul des métriques'
        )
        parser.add_argument(
            '--full-test',
            action='store_true',
            help='Exécute tous les tests'
        )
    
    def handle(self, *args, **options):
        if options['full_test'] or not any([
            options['test_signals'],
            options['test_cache'],
            options['test_metrics']
        ]):
            self.test_all()
        else:
            if options['test_signals']:
                self.test_signals()
            if options['test_cache']:
                self.test_cache()
            if options['test_metrics']:
                self.test_metrics()
    
    def test_all(self):
        """Exécute tous les tests"""
        self.stdout.write(
            self.style.SUCCESS('=== TEST COMPLET DES SIGNAUX DU TABLEAU DE BORD ===')
        )
        
        self.test_signals()
        self.test_cache()
        self.test_metrics()
        
        self.stdout.write(
            self.style.SUCCESS('=== TOUS LES TESTS TERMINÉS ===')
        )
    
    def test_signals(self):
        """Teste la réactivité des signaux"""
        self.stdout.write(
            self.style.WARNING('--- Test des signaux ---')
        )
        
        try:
            # Test de création d'un projet
            with transaction.atomic():
                test_project = Project.objects.create(
                    nom="Projet Test Signaux",
                    description="Projet de test pour les signaux",
                    date_debut=timezone.now(),
                    date_fin=timezone.now() + timezone.timedelta(days=30),
                    statut="En cours"
                )
                
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Projet créé: {test_project.nom}')
                )
                
                # Vérifie que les métriques ont été mises à jour
                metrics_count = DashboardMetrics.objects.filter(
                    metric_type='projects'
                ).count()
                
                if metrics_count > 0:
                    self.stdout.write(
                        self.style.SUCCESS(f'✓ Métriques mises à jour: {metrics_count} métriques')
                    )
                else:
                    self.stdout.write(
                        self.style.WARNING('⚠ Aucune métrique trouvée après création du projet')
                    )
                
                # Supprime le projet de test
                test_project.delete()
                self.stdout.write(
                    self.style.SUCCESS('✓ Projet de test supprimé')
                )
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'✗ Erreur lors du test des signaux: {str(e)}')
            )
    
    def test_cache(self):
        """Teste la gestion du cache"""
        self.stdout.write(
            self.style.WARNING('--- Test de la gestion du cache ---')
        )
        
        try:
            # Test d'invalidation du cache
            DashboardSignalManager.invalidate_cache()
            
            # Vérifie que le cache a été invalidé
            cache_keys = [
                'dashboard_overview_metrics',
                'dashboard_projects_metrics',
                'dashboard_financial_metrics'
            ]
            
            invalidated_count = 0
            for key in cache_keys:
                if not cache.get(key):
                    invalidated_count += 1
            
            if invalidated_count == len(cache_keys):
                self.stdout.write(
                    self.style.SUCCESS('✓ Cache invalidé avec succès')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'⚠ Cache partiellement invalidé: {invalidated_count}/{len(cache_keys)}')
                )
            
            # Test de création d'un cache
            test_cache = DashboardCache.objects.create(
                cache_key='test_cache_key',
                cache_data={'test': 'data'},
                expires_at=timezone.now() + timezone.timedelta(hours=1)
            )
            
            self.stdout.write(
                self.style.SUCCESS(f'✓ Cache de test créé: {test_cache.cache_key}')
            )
            
            # Test de suppression des caches expirés
            expired_cache = DashboardCache.objects.create(
                cache_key='expired_cache',
                cache_data={'expired': 'data'},
                expires_at=timezone.now() - timezone.timedelta(hours=1)
            )
            
            DashboardSignalManager.invalidate_cache()
            
            # Vérifie que le cache expiré a été supprimé
            if not DashboardCache.objects.filter(id=expired_cache.id).exists():
                self.stdout.write(
                    self.style.SUCCESS('✓ Cache expiré supprimé automatiquement')
                )
            else:
                self.stdout.write(
                    self.style.WARNING('⚠ Cache expiré non supprimé')
                )
            
            # Nettoie les caches de test
            DashboardCache.objects.filter(
                cache_key__in=['test_cache_key', 'expired_cache']
            ).delete()
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'✗ Erreur lors du test du cache: {str(e)}')
            )
    
    def test_metrics(self):
        """Teste le calcul des métriques"""
        self.stdout.write(
            self.style.WARNING('--- Test du calcul des métriques ---')
        )
        
        try:
            # Test de mise à jour des métriques
            DashboardSignalManager.update_metrics()
            
            # Vérifie que les métriques ont été créées
            metrics_count = DashboardMetrics.objects.count()
            
            if metrics_count > 0:
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Métriques calculées: {metrics_count} métriques')
                )
                
                # Affiche quelques métriques
                recent_metrics = DashboardMetrics.objects.order_by('-calculated_at')[:5]
                
                self.stdout.write('  Métriques récentes:')
                for metric in recent_metrics:
                    self.stdout.write(
                        f'    - {metric.metric_type}.{metric.metric_name}: '
                        f'{len(str(metric.metric_value))} caractères'
                    )
            else:
                self.stdout.write(
                    self.style.WARNING('⚠ Aucune métrique calculée')
                )
            
            # Test de performance
            import time
            start_time = time.time()
            
            DashboardSignalManager.update_metrics()
            
            execution_time = time.time() - start_time
            
            self.stdout.write(
                self.style.SUCCESS(f'✓ Temps d\'exécution: {execution_time:.2f} secondes')
            )
            
            if execution_time < 5.0:
                self.stdout.write(
                    self.style.SUCCESS('✓ Performance acceptable (< 5 secondes)')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'⚠ Performance lente: {execution_time:.2f} secondes')
                )
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'✗ Erreur lors du test des métriques: {str(e)}')
            )
    
    def cleanup_test_data(self):
        """Nettoie les données de test"""
        try:
            # Supprime les métriques de test
            DashboardMetrics.objects.filter(
                calculated_at__gte=timezone.now() - timezone.timedelta(minutes=5)
            ).delete()
            
            # Supprime les caches de test
            DashboardCache.objects.filter(
                cache_key__startswith='test_'
            ).delete()
            
            self.stdout.write(
                self.style.SUCCESS('✓ Données de test nettoyées')
            )
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'✗ Erreur lors du nettoyage: {str(e)}')
            ) 