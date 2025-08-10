from django.db.models import Count, Q, Avg, Sum, F
from django.utils import timezone
from django.db.models.functions import TruncMonth, Coalesce
from datetime import timedelta
import logging

from projects.models import Project, ProjectTask
from users.models import User
from teams.models import Team
from contrats.models import Contrat
from devis.models import Devis
from billings.models import Facture

logger = logging.getLogger(__name__)


class DashboardMetricsService:
    """Service pour calculer les métriques du tableau de bord"""
    
    def __init__(self):
        self.now = timezone.now()
    
    def get_projects_metrics(self, start_date, end_date):
        """Calcule les métriques des projets"""
        try:
            # Projets dans la période
            projects_in_period = Project.objects.filter(
                created_at__gte=start_date,
                created_at__lte=end_date
            )
            
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
            
            # Projets en retard
            overdue_qs = Project.objects.filter(
                deadline__lt=self.now,
                status__in=['Production', 'Livraison']
            ).values('id', 'title', 'deadline')[:10]
            overdue_projects = []
            for p in overdue_qs:
                days_overdue = (self.now.date() - p['deadline']).days
                overdue_projects.append({
                    'id': p['id'],
                    'name': p['title'],
                    'deadline': p['deadline'],
                    'days_overdue': days_overdue,
                })
            
            # Performance des équipes
            team_performance = Team.objects.annotate(
                project_count=Count('projects'),
                avg_progress=Avg('projects__progress')
            ).filter(project_count__gt=0).annotate(
                team_name=F('name')
            ).values(
                'team_name', 'project_count', 'avg_progress'
            )[:5]
            
            return {
                'status_distribution': status_distribution,
                'recent_projects': list(recent_projects),
                'overdue_projects': list(overdue_projects),
                'team_performance': list(team_performance)
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
                
                monthly_revenue = Facture.objects.filter(
                    date_emission__gte=month_start,
                    date_emission__lte=month_end,
                    statut='payee'
                ).aggregate(
                    total=Coalesce(Sum('montant_ht'), 0)
                )['total'] or 0
                
                revenue_trend.append({
                    'month': month_start.strftime('%Y-%m'),
                    'revenue': float(monthly_revenue)
                })
            
            revenue_trend.reverse()
            
            # Statut de facturation
            billing_status = dict(
                Facture.objects.values('statut').annotate(
                    count=Count('id')
                ).values_list('statut', 'count')
            )
            
            # Conversion des devis
            total_devis = Devis.objects.filter(
                date_creation__gte=start_date,
                date_creation__lte=end_date
            ).count()
            
            converted_devis = Devis.objects.filter(
                date_creation__gte=start_date,
                date_creation__lte=end_date,
                statut='accepte'
            ).count()
            
            conversion_rate = (converted_devis / total_devis * 100) if total_devis > 0 else 0
            
            # Flux de trésorerie
            income = Facture.objects.filter(
                date_emission__gte=start_date,
                date_emission__lte=end_date,
                statut='payee'
            ).aggregate(
                total=Coalesce(Sum('montant_ht'), 0)
            )['total'] or 0
            
            expenses = 0  # À implémenter selon votre modèle de dépenses
            net = income - expenses
            
            # Top clients
            raw_top_clients = Contrat.objects.filter(
                date_signature__gte=start_date,
                date_signature__lte=end_date
            ).values('client__nom').annotate(
                revenue=Sum('montant_total')
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
            team_productivity = Team.objects.annotate(
                total_tasks=Count('projects__tasks'),
                completed_tasks=Count('projects__tasks', filter=Q(projects__tasks__status='Terminé'))
            ).filter(total_tasks__gt=0).annotate(
                completion_rate=Coalesce(
                    F('completed_tasks') * 100.0 / F('total_tasks'), 0
                ),
                team_name=F('name')
            ).values('team_name', 'total_tasks', 'completed_tasks', 'completion_rate')[:5]
            
            # Performance des utilisateurs
            user_performance = User.objects.annotate(
                total_tasks=Count('assigned_tasks'),
                completed_tasks=Count('assigned_tasks', filter=Q(assigned_tasks__status='Terminé'))
            ).filter(total_tasks__gt=0).annotate(
                completion_rate=Coalesce(
                    F('completed_tasks') * 100.0 / F('total_tasks'), 0
                )
            ).values('username', 'total_tasks', 'completed_tasks', 'completion_rate')[:10]
            
            # Taux de completion global
            total_tasks = ProjectTask.objects.filter(
                created_at__gte=start_date,
                created_at__lte=end_date
            ).count()
            
            completed_tasks = ProjectTask.objects.filter(
                created_at__gte=start_date,
                created_at__lte=end_date,
                status='Terminé'
            ).count()
            
            global_completion_rate = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
            
            # Métriques d'efficacité
            avg_completion_time = ProjectTask.objects.filter(
                status='Terminé',
                executed_at__gte=start_date,
                executed_at__lte=end_date
            ).aggregate(
                avg_time=Avg(F('executed_at') - F('start_date'))
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
                }
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
            project_deadlines = Project.objects.filter(
                deadline__gte=self.now,
                deadline__lte=self.now + timedelta(days=30)
            ).values('id', 'title', 'deadline')[:10]
            
            for project in project_deadlines:
                days_until = (project['deadline'] - self.now).days
                upcoming_deadlines.append({
                    'id': project['id'],
                    'title': f"Fin du projet: {project['title']}",
                    'deadline': project['deadline'].isoformat(),
                    'project': project['title'],
                    'days_until_deadline': days_until
                })
            
            # Échéances des tâches
            task_deadlines = ProjectTask.objects.filter(
                due_date__gte=self.now,
                due_date__lte=self.now + timedelta(days=30),
                status__in=['En cours', 'À faire']
            ).values('id', 'title', 'due_date', 'project__title')[:10]
            
            for task in task_deadlines:
                days_until = (task['due_date'] - self.now).days
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
            event_distribution = {
                'tasks': ProjectTask.objects.filter(
                    created_at__gte=start_date,
                    created_at__lte=end_date
                ).count(),
                'projects': Project.objects.filter(
                    created_at__gte=start_date,
                    created_at__lte=end_date
                ).count(),
                'contrats': Contrat.objects.filter(
                    date_signature__gte=start_date,
                    date_signature__lte=end_date
                ).count()
            }
            
            # Utilisation des ressources
            total_users = User.objects.count()
            active_users = User.objects.filter(
                last_login__gte=self.now - timedelta(days=7)
            ).count()
            
            utilization_rate = (active_users / total_users * 100) if total_users > 0 else 0
            
            return {
                'upcoming_deadlines': upcoming_deadlines[:15],
                'event_distribution': event_distribution,
                'resource_utilization': {
                    'total_users': total_users,
                    'active_users': active_users,
                    'utilization_rate': round(utilization_rate, 1)
                }
            }
            
        except Exception as e:
            logger.error(f"Erreur lors du calcul des métriques du calendrier: {str(e)}")
            return {}
    
    def get_overview_metrics(self, start_date, end_date):
        """Récupère toutes les métriques pour l'aperçu"""
        return {
            'projects': self.get_projects_metrics(start_date, end_date),
            'financial': self.get_financial_metrics(start_date, end_date),
            'performance': self.get_performance_metrics(start_date, end_date),
            'calendar': self.get_calendar_metrics(start_date, end_date)
        } 