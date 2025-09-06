"""
Commande Django pour configurer les permissions des widgets du tableau de bord par rôle.
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from dashboard.models import DashboardWidgetConfig
from dashboard.services import DashboardMetricsService

User = get_user_model()


class Command(BaseCommand):
    help = 'Configure les permissions des widgets du tableau de bord par rôle'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Affiche ce qui serait fait sans effectuer les changements',
        )
        parser.add_argument(
            '--role',
            type=str,
            help='Rôle spécifique à configurer (optionnel)',
        )
        parser.add_argument(
            '--user',
            type=str,
            help='Nom d\'utilisateur spécifique à configurer (optionnel)',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        specific_role = options['role']
        specific_user = options['user']
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING('Mode DRY-RUN - Aucun changement ne sera effectué')
            )
        
        self.stdout.write('=' * 60)
        self.stdout.write('Configuration des permissions des widgets du tableau de bord')
        self.stdout.write('=' * 60)
        
        # Configuration par défaut des widgets par rôle
        role_configs = {
            'Managing Director': {
                'description': 'Accès complet à tous les widgets',
                'widgets': list(DashboardMetricsService.list_available_widgets().keys())
            },
            'Finance/Admin': {
                'description': 'Accès aux métriques financières et projets',
                'widgets': [
                    'projects.status_distribution',
                    'projects.recent_projects',
                    'projects.overdue_projects',
                    'financial.revenue_trend',
                    'financial.billing_status',
                    'financial.devis_conversion',
                    'financial.cash_flow',
                    'financial.montant_impaye',
                    'financial.taux_recouvrement',
                    'financial.period_metrics',
                    'performance.team_productivity',
                    'performance.task_completion_rate',
                    'calendar.upcoming_deadlines',
                    'calendar.event_distribution'
                ]
            },
            'Chef de projet': {
                'description': 'Accès aux métriques de projets et équipes',
                'widgets': [
                    'projects.status_distribution',
                    'projects.recent_projects',
                    'projects.overdue_projects',
                    'projects.team_performance',
                    'projects.monthly_projects',
                    'projects.progress_retards',
                    'projects.project_performance',
                    'performance.team_productivity',
                    'performance.user_performance',
                    'performance.task_completion_rate',
                    'performance.overdue_activities',
                    'performance.pending_tasks',
                    'performance.overdue_tasks',
                    'calendar.upcoming_deadlines',
                    'calendar.event_distribution',
                    'calendar.resource_utilization'
                ]
            },
            'Designer': {
                'description': 'Accès limité aux métriques de projets et performance',
                'widgets': [
                    'projects.status_distribution',
                    'projects.recent_projects',
                    'performance.user_performance',
                    'performance.task_completion_rate',
                    'performance.pending_tasks',
                    'performance.overdue_tasks',
                    'calendar.upcoming_deadlines'
                ]
            },
            'Développeur': {
                'description': 'Accès limité aux métriques de projets et performance',
                'widgets': [
                    'projects.status_distribution',
                    'projects.recent_projects',
                    'performance.user_performance',
                    'performance.task_completion_rate',
                    'performance.pending_tasks',
                    'performance.overdue_tasks',
                    'calendar.upcoming_deadlines'
                ]
            },
            'Rédacteur': {
                'description': 'Accès limité aux métriques de projets et performance',
                'widgets': [
                    'projects.status_distribution',
                    'projects.recent_projects',
                    'performance.user_performance',
                    'performance.task_completion_rate',
                    'performance.pending_tasks',
                    'performance.overdue_tasks',
                    'calendar.upcoming_deadlines'
                ]
            },
            'Consultant': {
                'description': 'Accès aux métriques de clients et devis',
                'widgets': [
                    'financial.devis_conversion',
                    'financial.billing_status',
                    'projects.status_distribution',
                    'projects.recent_projects',
                    'calendar.event_distribution'
                ]
            }
        }
        
        # Filtrer par rôle spécifique si demandé
        if specific_role:
            if specific_role in role_configs:
                role_configs = {specific_role: role_configs[specific_role]}
            else:
                self.stdout.write(
                    self.style.ERROR(f'Rôle "{specific_role}" non reconnu')
                )
                return
        
        # Configuration par utilisateur spécifique si demandé
        if specific_user:
            try:
                user = User.objects.get(username=specific_user)
                self.stdout.write(f'\nConfiguration pour l\'utilisateur: {user.username}')
                self.stdout.write('=' * 40)
                
                # Utiliser la configuration par défaut du rôle de l'utilisateur
                user_role = getattr(getattr(user, 'profile', None), 'role', None)
                if user_role and user_role in role_configs:
                    config = role_configs[user_role]
                    self.stdout.write(f'Rôle détecté: {user_role}')
                    self.stdout.write(f'Description: {config["description"]}')
                    self.stdout.write(f'Widgets: {len(config["widgets"])} widgets')
                    
                    if not dry_run:
                        # Créer ou mettre à jour la configuration
                        obj, created = DashboardWidgetConfig.objects.get_or_create(
                            user=user,
                            defaults={
                                'role': user_role,
                                'widgets': config['widgets'],
                                'is_active': True
                            }
                        )
                        
                        if created:
                            self.stdout.write(
                                self.style.SUCCESS(f'✓ Configuration créée pour {user.username}')
                            )
                        else:
                            obj.widgets = config['widgets']
                            obj.is_active = True
                            obj.save()
                            self.stdout.write(
                                self.style.WARNING(f'✓ Configuration mise à jour pour {user.username}')
                            )
                    else:
                        existing = DashboardWidgetConfig.objects.filter(user=user).first()
                        if existing:
                            self.stdout.write(
                                self.style.WARNING(f'⚠ Configuration existante trouvée pour {user.username}')
                            )
                        else:
                            self.stdout.write(
                                self.style.SUCCESS(f'✓ Nouvelle configuration à créer pour {user.username}')
                            )
                else:
                    self.stdout.write(
                        self.style.WARNING(f'Rôle non détecté pour {user.username}, utilisation de la configuration par défaut')
                    )
                    
                    if not dry_run:
                        # Configuration par défaut (tous les widgets)
                        obj, created = DashboardWidgetConfig.objects.get_or_create(
                            user=user,
                            defaults={
                                'role': 'default',
                                'widgets': list(DashboardMetricsService.list_available_widgets().keys()),
                                'is_active': True
                            }
                        )
                        
                        if created:
                            self.stdout.write(
                                self.style.SUCCESS(f'✓ Configuration par défaut créée pour {user.username}')
                            )
                        else:
                            self.stdout.write(
                                self.style.WARNING(f'✓ Configuration existante pour {user.username}')
                            )
                
            except User.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f'Utilisateur "{specific_user}" non trouvé')
                )
                return
        
        # Configuration par rôle (si pas d'utilisateur spécifique)
        if not specific_user:
            for role, config in role_configs.items():
                self.stdout.write(f'\nRôle: {role}')
                self.stdout.write(f'Description: {config["description"]}')
                self.stdout.write(f'Widgets: {len(config["widgets"])} widgets')
                
                if not dry_run:
                    # Créer ou mettre à jour la configuration
                    obj, created = DashboardWidgetConfig.objects.get_or_create(
                        role=role,
                        user__isnull=True,  # Configuration globale par rôle
                        defaults={
                            'widgets': config['widgets'],
                            'is_active': True
                        }
                    )
                    
                    if created:
                        self.stdout.write(
                            self.style.SUCCESS(f'✓ Configuration créée pour {role}')
                        )
                    else:
                        # Mettre à jour si elle existe déjà
                        obj.widgets = config['widgets']
                        obj.is_active = True
                        obj.save()
                        self.stdout.write(
                            self.style.WARNING(f'✓ Configuration mise à jour pour {role}')
                        )
                else:
                    # Mode dry-run
                    existing = DashboardWidgetConfig.objects.filter(
                        role=role,
                        user__isnull=True
                    ).first()
                    
                    if existing:
                        self.stdout.write(
                            self.style.WARNING(f'⚠ Configuration existante trouvée pour {role}')
                        )
                    else:
                        self.stdout.write(
                            self.style.SUCCESS(f'✓ Nouvelle configuration à créer pour {role}')
                        )
        
        if not dry_run:
            self.stdout.write(
                self.style.SUCCESS('\n✓ Configuration terminée avec succès!')
            )
        else:
            self.stdout.write(
                self.style.WARNING('\n⚠ Mode DRY-RUN - Aucun changement effectué')
            )
        
        # Afficher un résumé
        total_configs = DashboardWidgetConfig.objects.count()
        active_configs = DashboardWidgetConfig.objects.filter(is_active=True).count()
        
        self.stdout.write(f'\nRésumé:')
        self.stdout.write(f'- Total des configurations: {total_configs}')
        self.stdout.write(f'- Configurations actives: {active_configs}')
        self.stdout.write(f'- Widgets disponibles: {len(DashboardMetricsService.list_available_widgets())}') 