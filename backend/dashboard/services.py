from django.db.models import Count, Q, Avg, Sum, F
from django.utils import timezone
from django.db.models.functions import TruncMonth, Coalesce
from datetime import timedelta
import logging
from django.db.models import Value, DecimalField, FloatField

from projects.models import Project, ProjectTask
from users.models import User, ClientProfile
from teams.models import Team
from contrats.models import Contrat
from devis.models import Devis
from billings.models import Facture

logger = logging.getLogger(__name__)


class DashboardMetricsService:
    """Service pour calculer les métriques du tableau de bord"""
    
    def __init__(self, user=None):
        self.now = timezone.now()
        self.user = user
        self.user_role = self._get_user_role()
    
    def _get_user_role(self):
        """Récupère le rôle de l'utilisateur"""
        if not self.user or not self.user.is_authenticated:
            return None
        
        if self.user.is_superuser:
            return 'superuser'
        
        if hasattr(self.user, 'profile') and hasattr(self.user.profile, 'role'):
            return self.user.profile.role
        
        return None
    
    def _filter_by_role(self, queryset, model_name):
        """Filtre les données en fonction du rôle de l'utilisateur"""
        if not self.user_role or self.user_role == 'superuser':
            return queryset
        
        # Filtrage basé sur le rôle
        if self.user_role == 'Chef de projet':
            if model_name == 'projects':
                # Les chefs de projet voient leurs projets et ceux de leur équipe
                return queryset.filter(
                    Q(project_members__user=self.user, project_members__role='Chef de projet') |
                    Q(team__team_members__user=self.user)
                ).distinct()
            elif model_name == 'teams':
                # Les chefs de projet voient leurs équipes
                return queryset.filter(team_members__user=self.user)
            elif model_name == 'clients':
                # Les chefs de projet voient les clients de leurs projets
                project_ids = Project.objects.filter(
                    project_members__user=self.user, 
                    project_members__role='Chef de projet'
                ).values_list('client_id', flat=True)
                return queryset.filter(id__in=project_ids)
        
        elif self.user_role == 'Finance/Admin':
            if model_name in ['billings', 'devis', 'contrats']:
                # Les finance/admin ont accès complet aux données financières
                return queryset
            elif model_name == 'projects':
                # Accès limité aux projets (vue uniquement)
                return queryset
        
        elif self.user_role in ['Designer', 'Développeur', 'Rédacteur']:
            if model_name == 'projects':
                # Les membres d'équipe voient leurs projets assignés
                return queryset.filter(project_members__user=self.user)
            elif model_name == 'teams':
                # Les membres voient leurs équipes
                return queryset.filter(team_members__user=self.user)
            elif model_name == 'documents':
                # Accès aux documents de leurs projets
                project_ids = Project.objects.filter(
                    project_members__user=self.user
                ).values_list('id', flat=True)
                return queryset.filter(project_id__in=project_ids)
        
        elif self.user_role == 'Consultant':
            if model_name in ['clients', 'devis', 'contrats']:
                # Les consultants ont accès aux clients et devis
                return queryset
            elif model_name == 'projects':
                # Accès limité aux projets
                return queryset.filter(project_members__user=self.user)
        
        return queryset
    
    def get_projects_metrics(self, start_date, end_date):
        """Calcule les métriques des projets"""
        try:
            # Projets dans la période
            projects_in_period = Project.objects.filter(
                created_at__gte=start_date,
                created_at__lte=end_date
            )
            
            # Appliquer le filtre par rôle
            projects_in_period = self._filter_by_role(projects_in_period, 'projects')
            
            # Distribution par statut
            status_distribution = dict(
                projects_in_period.values('status').annotate(
                    count=Count('id')
                ).values_list('status', 'count')
            )
            
            # Projets récents
            recent_projects_qs = projects_in_period.order_by('-created_at')[:10].values(
                'id', 'title', 'status', 'progress', 'created_at'
            )
            recent_projects = [
                {
                    'id': p['id'],
                    'name': p['title'],
                    'status': p['status'],
                    'progress': p['progress'],
                    'created_at': p['created_at'],
                }
                for p in recent_projects_qs
            ]
            
            # Projets en retard (filtrés par rôle)
            overdue_base = Project.objects.filter(
                deadline__lt=self.now,
                status__in=['Production', 'Livraison','Terminé']
            )
            overdue_base = self._filter_by_role(overdue_base, 'projects')
            overdue_qs = overdue_base.values('id', 'title', 'deadline')[:10]
            
            overdue_projects = []
            for p in overdue_qs:
                days_overdue = (self.now.date() - p['deadline']).days
                overdue_projects.append({
                    'id': p['id'],
                    'name': p['title'],
                    'deadline': p['deadline'],
                    'days_overdue': days_overdue,
                })
            
            # Performance des équipes (filtrée par rôle)
            team_base = Team.objects.all()
            if self.user_role == 'Chef de projet':
                team_base = team_base.filter(team_members__user=self.user)
            elif self.user_role in ['Designer', 'Développeur', 'Rédacteur']:
                team_base = team_base.filter(team_members__user=self.user)
            
            team_performance = team_base.annotate(
                project_count=Count('team_members__user__projects', distinct=True),
                avg_progress=Avg('team_members__user__projects__progress')
            ).filter(project_count__gt=0).annotate(
                team_name=F('name')
            ).values(
                'team_name', 'project_count', 'avg_progress'
            )[:5]

            # Projets par mois (dans la période)
            monthly_projects_qs = projects_in_period.annotate(
                month=TruncMonth('created_at')
            ).values('month').annotate(count=Count('id')).order_by('month')
            monthly_projects = [
                {
                    'month': mp['month'].strftime('%Y-%m') if mp['month'] else '',
                    'count': mp['count']
                }
                for mp in monthly_projects_qs
            ]
            
            return {
                'total_projects': projects_in_period.count(),
                'active_projects': projects_in_period.filter(status__in=['Production', 'Livraison']).count(),
                'status_distribution': status_distribution,
                'recent_projects': list(recent_projects),
                'overdue_projects': list(overdue_projects),
                'team_performance': list(team_performance),
                'monthly_projects': monthly_projects,
                'user_role': self.user_role,
            }
            
        except Exception as e:
            logger.error(f"Erreur lors du calcul des métriques projets: {str(e)}")
            return {}
    
    def get_financial_metrics(self, start_date, end_date):
        """Calcule les métriques financières"""
        try:
            # Tendance des revenus (6 derniers mois)
            revenue_trend = []
            for i in range(6):
                month_start = self.now.replace(day=1) - timedelta(days=30*i)
                month_end = month_start.replace(day=28) + timedelta(days=4)
                month_end = month_end.replace(day=1) - timedelta(days=1)
                
                factures_base = Facture.objects.filter(
                    date_emission__gte=month_start,
                    date_emission__lte=month_end,
                    statut='payee'
                )
                factures_base = self._filter_by_role(factures_base, 'billings')
                
                monthly_revenue = factures_base.aggregate(
                    total=Coalesce(
                        Sum('montant_ht'),
                        Value(0, output_field=DecimalField(max_digits=12, decimal_places=2))
                    )
                )['total'] or 0
                
                revenue_trend.append({
                    'month': month_start.strftime('%Y-%m'),
                    'revenue': float(monthly_revenue)
                })
            
            revenue_trend.reverse()
            
            # Statut de facturation
            factures_status = Facture.objects.all()
            factures_status = self._filter_by_role(factures_status, 'billings')
            billing_status = dict(
                factures_status.values('statut').annotate(
                    count=Count('id')
                ).values_list('statut', 'count')
            )
            
            # Conversion des devis
            devis_base = Devis.objects.filter(
                date_creation__gte=start_date,
                date_creation__lte=end_date
            )
            devis_base = self._filter_by_role(devis_base, 'devis')
            
            total_devis = devis_base.count()
            
            converted_devis = devis_base.filter(statut='accepte').count()
            
            conversion_rate = (converted_devis / total_devis * 100) if total_devis > 0 else 0
            
            # Flux de trésorerie
            factures_income = Facture.objects.filter(
                created_at__gte=start_date,
                created_at__lte=end_date,
                statut='payee'
            )
            factures_income = self._filter_by_role(factures_income, 'billings')
            
            income = factures_income.aggregate(
                total=Coalesce(
                    Sum('montant_ht'),
                    Value(0, output_field=DecimalField(max_digits=12, decimal_places=2))
                )
            )['total'] or 0
            
            expenses = 0  # À implémenter selon votre modèle de dépenses
            net = income - expenses
            
            # Top clients
            raw_top_clients = Contrat.objects.filter(
                date_creation__gte=start_date,
                date_creation__lte=end_date
            ).values('client__nom').annotate(
                revenue=Sum('montant_ttc')
            ).order_by('-revenue')[:5]
            top_clients = [
                {
                    'name': c['client__nom'],
                    'revenue': float(c['revenue'] or 0),
                }
                for c in raw_top_clients
            ]
            
            return {
                'revenue_trend': revenue_trend,
                'billing_status': billing_status,
                'devis_conversion': {
                    'total': total_devis,
                    'converted': converted_devis,
                    'rate': round(conversion_rate, 1)
                },
                'cash_flow': {
                    'income': float(income),
                    'expenses': float(expenses),
                    'net': float(net)
                },
                'top_clients': list(top_clients)
            }
            
        except Exception as e:
            logger.error(f"Erreur lors du calcul des métriques financières: {str(e)}")
            return {}
    
    def get_performance_metrics(self, start_date, end_date):
        """Calcule les métriques de performance"""
        try:
            # Performance des équipes
            team_base = Team.objects.all()
            team_base = self._filter_by_role(team_base, 'teams')
            
            team_productivity = team_base.annotate(
                total_tasks=Count('team_members__user__projects__tasks', distinct=True),
                completed_tasks=Count(
                    'team_members__user__projects__tasks',
                    filter=Q(team_members__user__projects__tasks__status='Terminé'),
                    distinct=True
                )
            ).filter(total_tasks__gt=0).annotate(
                completion_rate=Coalesce(
                    F('completed_tasks') * 100.0 / F('total_tasks'),
                    Value(0.0, output_field=FloatField())
                ),
                team_name=F('name')
            ).values('team_name', 'total_tasks', 'completed_tasks', 'completion_rate')[:5]
            
            # Performance des utilisateurs
            user_base = User.objects.all()
            if self.user_role in ['Chef de projet', 'Designer', 'Développeur', 'Rédacteur']:
                # Les utilisateurs voient leur propre performance et celle de leur équipe
                user_base = user_base.filter(
                    Q(id=self.user.id) |
                    Q(team_members__team__team_members__user=self.user)
                ).distinct()
            
            user_performance = user_base.annotate(
                total_tasks=Count('assigned_tasks'),
                completed_tasks=Count('assigned_tasks', filter=Q(assigned_tasks__status='Terminé'))
            ).filter(total_tasks__gt=0).annotate(
                completion_rate=Coalesce(
                    F('completed_tasks') * 100.0 / F('total_tasks'),
                    Value(0.0, output_field=FloatField())
                )
            ).values('username', 'total_tasks', 'completed_tasks', 'completion_rate')[:10]
            
            # Taux de completion global
            tasks_base = ProjectTask.objects.filter(
                created_at__gte=start_date,
                created_at__lte=end_date
            )
            if self.user_role in ['Chef de projet', 'Designer', 'Développeur', 'Rédacteur']:
                # Filtrer par projets de l'utilisateur
                project_ids = Project.objects.filter(
                    project_members__user=self.user
                ).values_list('id', flat=True)
                tasks_base = tasks_base.filter(project_id__in=project_ids)
            
            total_tasks = tasks_base.count()
            
            completed_tasks = tasks_base.filter(status='Terminé').count()

            pending_tasks_count = tasks_base.filter(status__in=['À faire', 'En cours']).count()

            overdue_tasks_base = ProjectTask.objects.filter(
                due_date__lt=self.now,
                status__in=['À faire', 'En cours']
            )
            if self.user_role in ['Chef de projet', 'Designer', 'Développeur', 'Rédacteur']:
                project_ids = Project.objects.filter(
                    project_members__user=self.user
                ).values_list('id', flat=True)
                overdue_tasks_base = overdue_tasks_base.filter(project_id__in=project_ids)
            
            overdue_tasks_count = overdue_tasks_base.count()

            global_completion_rate = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
            
            # Métriques d'efficacité
            avg_completion_time = ProjectTask.objects.filter(
                status='Terminé',
                created_at__gte=start_date,
                created_at__lte=end_date
            ).aggregate(
                avg_time=Avg(F('executed_at') - F('created_at'))
            )['avg_time']
            
            avg_completion_days = avg_completion_time.days if avg_completion_time else 0
            
            return {
                'team_productivity': list(team_productivity),
                'user_performance': list(user_performance),
                'task_completion_rate': {
                    'total': total_tasks,
                    'completed': completed_tasks,
                    'rate': round(global_completion_rate, 1)
                },
                'efficiency_metrics': {
                    'avg_completion_time_days': avg_completion_days,
                    'total_completed_tasks': completed_tasks
                },
                'pending_tasks': pending_tasks_count,
                'overdue_tasks': overdue_tasks_count,
            }
            
        except Exception as e:
            logger.error(f"Erreur lors du calcul des métriques de performance: {str(e)}")
            return {}
    
    def get_calendar_metrics(self, start_date, end_date):
        """Calcule les métriques du calendrier"""
        try:
            # Échéances à venir
            upcoming_deadlines = []
            
            # Échéances des projets
            project_deadlines_base = Project.objects.filter(
                deadline__gte=self.now,
                deadline__lte=self.now + timedelta(days=30)
            )
            project_deadlines_base = self._filter_by_role(project_deadlines_base, 'projects')
            project_deadlines = project_deadlines_base.values('id', 'title', 'deadline')[:10]
            
            for project in project_deadlines:
                days_until = (project['deadline'] - self.now.date()).days
                upcoming_deadlines.append({
                    'id': project['id'],
                    'title': f"Fin du projet: {project['title']}",
                    'deadline': project['deadline'].isoformat(),
                    'project': project['title'],
                    'days_until_deadline': days_until
                })
            
            # Échéances des tâches
            task_deadlines_base = ProjectTask.objects.filter(
                due_date__gte=self.now,
                due_date__lte=self.now + timedelta(days=30),
                status__in=['En cours', 'À faire']
            )
            if self.user_role in ['Chef de projet', 'Designer', 'Développeur', 'Rédacteur']:
                # Filtrer par projets de l'utilisateur
                project_ids = Project.objects.filter(
                    project_members__user=self.user
                ).values_list('id', flat=True)
                task_deadlines_base = task_deadlines_base.filter(project_id__in=project_ids)
            
            task_deadlines = task_deadlines_base.values('id', 'title', 'due_date', 'project__title')[:10]
            
            for task in task_deadlines:
                days_until = (task['due_date'] - self.now.date()).days
                upcoming_deadlines.append({
                    'id': task['id'],
                    'title': f"Tâche: {task['title']}",
                    'deadline': task['due_date'].isoformat(),
                    'project': task['project__title'],
                    'days_until_deadline': days_until
                })
            
            # Trier par urgence
            upcoming_deadlines.sort(key=lambda x: x['days_until_deadline'])
            
            # Distribution des événements
            tasks_base = ProjectTask.objects.filter(
                created_at__gte=start_date,
                created_at__lte=end_date
            )
            if self.user_role in ['Chef de projet', 'Designer', 'Développeur', 'Rédacteur']:
                project_ids = Project.objects.filter(
                    project_members__user=self.user
                ).values_list('id', flat=True)
                tasks_base = tasks_base.filter(project_id__in=project_ids)
            
            projects_base = Project.objects.filter(
                created_at__gte=start_date,
                created_at__lte=end_date
            )
            projects_base = self._filter_by_role(projects_base, 'projects')
            
            contrats_base = Contrat.objects.filter(
                date_creation__gte=start_date,
                date_creation__lte=end_date
            )
            contrats_base = self._filter_by_role(contrats_base, 'contrats')
            
            event_distribution = {
                'tasks': tasks_base.count(),
                'projects': projects_base.count(),
                'contrats': contrats_base.count()
            }
            
            # Utilisation des ressources et entités
            users_base = User.objects.all()
            if self.user_role in ['Chef de projet', 'Designer', 'Développeur', 'Rédacteur']:
                # Les utilisateurs voient leur équipe
                users_base = users_base.filter(
                    Q(id=self.user.id) |
                    Q(team_members__team__team_members__user=self.user)
                ).distinct()
            
            total_users = users_base.count()
            active_users = users_base.filter(
                last_login__gte=self.now - timedelta(days=7)
            ).count()
            
            clients_base = ClientProfile.objects.all()
            clients_base = self._filter_by_role(clients_base, 'clients')
            total_clients = clients_base.count()
            
            contracts_base = Contrat.objects.all()
            contracts_base = self._filter_by_role(contracts_base, 'contrats')
            total_contracts = contracts_base.count()
            
            utilization_rate = (active_users / total_users * 100) if total_users > 0 else 0
            
            return {
                'upcoming_deadlines': upcoming_deadlines[:15],
                'event_distribution': event_distribution,
                'resource_utilization': {
                    'total_users': total_users,
                    'active_users': active_users,
                    'total_clients': total_clients,
                    'total_contracts': total_contracts,
                    'utilization_rate': round(utilization_rate, 1)
                },
                'user_role': self.user_role
            }
            
        except Exception as e:
            logger.error(f"Erreur lors du calcul des métriques du calendrier: {str(e)}")
            return {}
    
    def refresh_all_metrics(self):
        """Rafraîchit toutes les métriques (méthode utilitaire)"""
        try:
            # Cette méthode peut être utilisée pour forcer le recalcul
            # ou pour mettre en cache les métriques si nécessaire
            logger.info(f"Métriques rafraîchies pour l'utilisateur {self.user.username if self.user else 'anonyme'}")
            return True
        except Exception as e:
            logger.error(f"Erreur lors du rafraîchissement des métriques: {str(e)}")
            return False
    
    def get_overview_metrics(self, start_date, end_date):
        """Récupère toutes les métriques pour l'aperçu"""
        return {
            'projects': self.get_projects_metrics(start_date, end_date),
            'financial': self.get_financial_metrics(start_date, end_date),
            'performance': self.get_performance_metrics(start_date, end_date),
            'calendar': self.get_calendar_metrics(start_date, end_date)
        } 