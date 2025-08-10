from django.core.management.base import BaseCommand
from django.utils import timezone
from django.core.cache import cache
import time
import threading

from dashboard.signals import DashboardSignalManager
from dashboard.models import DashboardMetrics, DashboardCache


class Command(BaseCommand):
    help = 'Surveille les signaux du tableau de bord en temps réel'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--duration',
            type=int,
            default=300,
            help='Durée de surveillance en secondes (défaut: 300 = 5 minutes)'
        )
        parser.add_argument(
            '--interval',
            type=int,
            default=10,
            help='Intervalle de vérification en secondes (défaut: 10)'
        )
        parser.add_argument(
            '--verbose',
            action='store_true',
            help='Affiche des informations détaillées'
        )
    
    def handle(self, *args, **options):
        duration = options['duration']
        interval = options['interval']
        verbose = options['verbose']
        
        self.stdout.write(
            self.style.SUCCESS(
                f'=== SURVEILLANCE DES SIGNAUX DU TABLEAU DE BORD ===\n'
                f'Durée: {duration} secondes\n'
                f'Intervalle: {interval} secondes\n'
                f'Mode verbose: {"Activé" if verbose else "Désactivé"}'
            )
        )
        
        # Initialise les compteurs
        start_time = timezone.now()
        initial_metrics_count = DashboardMetrics.objects.count()
        initial_cache_count = DashboardCache.objects.count()
        
        self.stdout.write(f'\n📊 État initial:')
        self.stdout.write(f'  - Métriques: {initial_metrics_count}')
        self.stdout.write(f'  - Caches: {initial_cache_count}')
        
        # Variables de surveillance
        last_metrics_count = initial_metrics_count
        last_cache_count = initial_cache_count
        signal_events = []
        
        try:
            # Boucle de surveillance
            elapsed_time = 0
            while elapsed_time < duration:
                time.sleep(interval)
                elapsed_time += interval
                
                current_time = timezone.now()
                current_metrics_count = DashboardMetrics.objects.count()
                current_cache_count = DashboardCache.objects.count()
                
                # Détecte les changements
                metrics_changed = current_metrics_count != last_metrics_count
                cache_changed = current_cache_count != last_cache_count
                
                if metrics_changed or cache_changed or verbose:
                    # Affiche le statut actuel
                    self.stdout.write(
                        f'\n⏰ [{current_time.strftime("%H:%M:%S")}] '
                        f'({elapsed_time}/{duration}s)'
                    )
                    
                    if metrics_changed:
                        metrics_diff = current_metrics_count - last_metrics_count
                        change_symbol = "📈" if metrics_diff > 0 else "📉"
                        self.stdout.write(
                            f'{change_symbol} Métriques: {last_metrics_count} → {current_metrics_count} '
                            f'({metrics_diff:+d})'
                        )
                        
                        # Enregistre l'événement
                        event = {
                            'timestamp': current_time,
                            'type': 'metrics_change',
                            'old_count': last_metrics_count,
                            'new_count': current_metrics_count,
                            'difference': metrics_diff
                        }
                        signal_events.append(event)
                        
                        last_metrics_count = current_metrics_count
                    
                    if cache_changed:
                        cache_diff = current_cache_count - last_cache_count
                        change_symbol = "🗄️" if cache_diff > 0 else "🗑️"
                        self.stdout.write(
                            f'{change_symbol} Cache: {last_cache_count} → {current_cache_count} '
                            f'({cache_diff:+d})'
                        )
                        
                        # Enregistre l'événement
                        event = {
                            'timestamp': current_time,
                            'type': 'cache_change',
                            'old_count': last_cache_count,
                            'new_count': current_cache_count,
                            'difference': cache_diff
                        }
                        signal_events.append(event)
                        
                        last_cache_count = current_cache_count
                    
                    if verbose:
                        # Affiche des informations détaillées
                        recent_metrics = DashboardMetrics.objects.order_by('-calculated_at')[:3]
                        if recent_metrics:
                            self.stdout.write('  📋 Métriques récentes:')
                            for metric in recent_metrics:
                                age = (current_time - metric.calculated_at).total_seconds()
                                self.stdout.write(
                                    f'    - {metric.metric_type}.{metric.metric_name} '
                                    f'(il y a {age:.0f}s)'
                                )
                        
                        # Vérifie l'état du cache
                        cache_status = cache.get('dashboard_last_metrics_update')
                        if cache_status:
                            cache_age = (current_time - cache_status).total_seconds()
                            self.stdout.write(f'  🕐 Cache: mis à jour il y a {cache_age:.0f}s')
                        else:
                            self.stdout.write('  🕐 Cache: pas de timestamp')
                
                # Affiche une barre de progression
                progress = (elapsed_time / duration) * 100
                progress_bar = '█' * int(progress / 5) + '░' * (20 - int(progress / 5))
                self.stdout.write(f'\r[{progress_bar}] {progress:.1f}%', ending='')
                
            self.stdout.write('\n\n')  # Nouvelle ligne après la barre de progression
            
            # Résumé final
            final_metrics_count = DashboardMetrics.objects.count()
            final_cache_count = DashboardCache.objects.count()
            
            self.stdout.write(
                self.style.SUCCESS('=== RÉSUMÉ DE LA SURVEILLANCE ===')
            )
            
            self.stdout.write(f'📊 Métriques: {initial_metrics_count} → {final_metrics_count}')
            self.stdout.write(f'🗄️  Cache: {initial_cache_count} → {final_cache_count}')
            self.stdout.write(f'📝 Événements détectés: {len(signal_events)}')
            
            if signal_events:
                self.stdout.write('\n📋 Détail des événements:')
                for event in signal_events:
                    time_str = event['timestamp'].strftime('%H:%M:%S')
                    if event['type'] == 'metrics_change':
                        self.stdout.write(
                            f'  [{time_str}] 📊 Métriques: {event["difference"]:+d}'
                        )
                    elif event['type'] == 'cache_change':
                        self.stdout.write(
                            f'  [{time_str}] 🗄️  Cache: {event["difference"]:+d}'
                        )
            
            # Test des signaux
            self.stdout.write('\n🧪 Test des signaux...')
            try:
                DashboardSignalManager.invalidate_cache()
                self.stdout.write('  ✓ Invalidation du cache réussie')
                
                DashboardSignalManager.update_metrics()
                self.stdout.write('  ✓ Mise à jour des métriques réussie')
                
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'  ✗ Erreur lors du test: {str(e)}')
                )
            
            self.stdout.write(
                self.style.SUCCESS('\n✅ Surveillance terminée avec succès!')
            )
            
        except KeyboardInterrupt:
            self.stdout.write('\n\n⚠️  Surveillance interrompue par l\'utilisateur')
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'\n✗ Erreur lors de la surveillance: {str(e)}')
            )
            raise 