from django.core.management.base import BaseCommand
from django.utils import timezone
from django.core.cache import cache

from dashboard.signals import DashboardSignalManager
from dashboard.models import DashboardMetrics


class Command(BaseCommand):
    help = 'Met à jour manuellement les métriques du tableau de bord'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force la mise à jour même si elle n\'est pas nécessaire'
        )
        parser.add_argument(
            '--clear-cache',
            action='store_true',
            help='Vide le cache avant la mise à jour'
        )
        parser.add_argument(
            '--period',
            type=int,
            default=30,
            help='Période en jours pour le calcul des métriques (défaut: 30)'
        )
    
    def handle(self, *args, **options):
        self.stdout.write(
            self.style.SUCCESS('=== MISE À JOUR DES MÉTRIQUES DU TABLEAU DE BORD ===')
        )
        
        try:
            # Vérifie si une mise à jour est nécessaire
            if not options['force']:
                last_update = cache.get('dashboard_last_metrics_update')
                if last_update:
                    time_since_update = (timezone.now() - last_update).total_seconds()
                    if time_since_update < 3600:  # Moins d'une heure
                        self.stdout.write(
                            self.style.WARNING(
                                f'⚠ Mise à jour non nécessaire. '
                                f'Dernière mise à jour: {time_since_update/60:.1f} minutes'
                            )
                        )
                        return
            
            # Vide le cache si demandé
            if options['clear_cache']:
                self.stdout.write('🗑️  Vidage du cache...')
                DashboardSignalManager.invalidate_cache()
                self.stdout.write(
                    self.style.SUCCESS('✓ Cache vidé')
                )
            
            # Affiche les informations de la période
            period_days = options['period']
            self.stdout.write(
                f'📊 Calcul des métriques pour les {period_days} derniers jours...'
            )
            
            # Compte les métriques existantes
            existing_metrics = DashboardMetrics.objects.count()
            self.stdout.write(f'📈 Métriques existantes: {existing_metrics}')
            
            # Lance la mise à jour
            start_time = timezone.now()
            DashboardSignalManager.update_metrics()
            end_time = timezone.now()
            
            # Affiche les résultats
            new_metrics = DashboardMetrics.objects.count()
            created_metrics = new_metrics - existing_metrics
            
            execution_time = (end_time - start_time).total_seconds()
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'✓ Mise à jour terminée en {execution_time:.2f} secondes'
                )
            )
            
            self.stdout.write(
                f'📊 Métriques créées: {created_metrics}'
            )
            self.stdout.write(
                f'📊 Total des métriques: {new_metrics}'
            )
            
            # Affiche un résumé des métriques par type
            metrics_by_type = {}
            for metric in DashboardMetrics.objects.all():
                metric_type = metric.metric_type
                if metric_type not in metrics_by_type:
                    metrics_by_type[metric_type] = 0
                metrics_by_type[metric_type] += 1
            
            if metrics_by_type:
                self.stdout.write('\n📋 Répartition par type:')
                for metric_type, count in metrics_by_type.items():
                    self.stdout.write(f'  - {metric_type}: {count} métriques')
            
            # Met à jour le timestamp de dernière mise à jour
            cache.set('dashboard_last_metrics_update', timezone.now(), 3600)
            
            self.stdout.write(
                self.style.SUCCESS('✅ Mise à jour des métriques terminée avec succès!')
            )
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'✗ Erreur lors de la mise à jour: {str(e)}')
            )
            raise 