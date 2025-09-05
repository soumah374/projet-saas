from django.db.models import Count, Q, Avg, Sum, F
from django.utils import timezone
from django.db.models.functions import TruncMonth, Coalesce
from datetime import timedelta
import logging
from django.db.models import Value, DecimalField, FloatField

from projects.models import Project, ProjectTask
from users.models import User, ClientProfile
from teams.models import Team
from contrats.models import Contrat, EcheancierContrat
from devis.models import Devis
from billings.models import Facture
from .permission_widget import AVAILABLE_WIDGETS
from .models import DashboardWidgetConfig
logger = logging.getLogger(__name__)


class DashboardMetricsService:
    """Service pour calculer les métriques du tableau de bord avec gestion des permissions par DashboardWidgetConfig"""

    def __init__(self, user=None):
        self.now = timezone.now()
        self.user = user
        self.user_role = self._get_user_role()
        self.selected_widgets = None
        self._widget_config = None
    
    @classmethod
    def list_available_widgets(cls):
        """Retourne le catalogue des widgets disponibles."""
        logger.info(f"AVAILABLE_WIDGETS imported successfully, count: {len(AVAILABLE_WIDGETS)}")
        logger.info(f"First few keys: {list(AVAILABLE_WIDGETS.keys())[:3]}")
        return AVAILABLE_WIDGETS
    
    def _load_widget_config(self):
        """Charge la configuration des widgets pour l'utilisateur actuel"""
        if self._widget_config is not None:
            return self._widget_config
        
        if not self.user or not self.user.is_authenticated:
            self._widget_config = None
            return None
        
        try:
            # Chercher d'abord une configuration spécifique à l'utilisateur
            config = DashboardWidgetConfig.objects.filter(
                user=self.user, 
                is_active=True
            ).first()
            
            # Si pas de config utilisateur, chercher par rôle
            if not config and self.user_role:
                config = DashboardWidgetConfig.objects.filter(
                    role=self.user_role,
                    user__isnull=True,
                    is_active=True
                ).first()
            
            self._widget_config = config
            return config
            
        except Exception as e:
            logger.error(f"Erreur lors du chargement de la configuration des widgets: {str(e)}")
            self._widget_config = None
            return None
    
    def get_authorized_widgets(self):
        """Récupère la liste des widgets autorisés pour l'utilisateur actuel"""
        config = self._load_widget_config()
        # Filtrer uniquement les widgets qui existent dans AVAILABLE_WIDGETS
        authorized_widgets = []
        for widget_key in config.widgets:
            if widget_key in AVAILABLE_WIDGETS:
                authorized_widgets.append(widget_key)
            else:
                logger.warning(f"Widget non reconnu dans la configuration: {widget_key}")
        
        logger.info(f"Widgets autorisés pour {self.user.username}: {len(authorized_widgets)}/{len(AVAILABLE_WIDGETS)}")
        return authorized_widgets
    
    # === Helpers de sélection côté service ===
    def _selected_set(self, selected_widgets=None):
        """Convertit la liste des widgets sélectionnés en set pour une recherche optimisée"""
        if selected_widgets is not None:
            return set(selected_widgets) if selected_widgets else None
        
        if self.selected_widgets is None:
            # Charger automatiquement les widgets autorisés si pas encore fait
            self.selected_widgets = self.get_authorized_widgets()
        
        return set(self.selected_widgets) if self.selected_widgets else None

    def _want(self, section: str, key: str | None, selected: set | None) -> bool:
        """
        Vérifie si un widget spécifique doit être calculé.
        
        Args:
            section: Section du widget (ex: 'projects', 'financial')
            key: Clé spécifique du widget (ex: 'status_distribution', 'revenue_trend')
            selected: Set des widgets autorisés
            
        Returns:
            bool: True si le widget doit être calculé, False sinon
        """
        # Pas de sélection => tout calculer (comportement par défaut pour la rétrocompatibilité)
        if not selected:
            return True
        
        if key is None:
            # Vérifier si toute la section est demandée
            return any(k.startswith(f"{section}.") for k in selected)
        
        # Vérifier si le widget spécifique est demandé
        return f"{section}.{key}" in selected
    
    def _has_section_widgets(self, section: str, selected: set | None) -> bool:
        """
        Vérifie rapidement si des widgets d'une section sont demandés.
        
        Args:
            section: Section à vérifier (ex: 'projects', 'financial')
            selected: Set des widgets autorisés
            
        Returns:
            bool: True si au moins un widget de la section est demandé
        """
        if not selected:
            return True  # Pas de sélection = tout autorisé
        
        return any(k.startswith(f"{section}.") for k in selected)
    
    def _validate_date_range(self, start_date, end_date, max_days=365*2):
        """Valide et normalise un intervalle de dates"""
        if not start_date or not end_date:
            return None, None
        
        # S'assurer que start_date <= end_date
        if start_date > end_date:
            start_date, end_date = end_date, start_date
        
        # Limiter la période maximale
        period_days = (end_date - start_date).days
        if period_days > max_days:
            end_date = start_date + timedelta(days=max_days)
            logger.warning(f"Période limitée à {max_days} jours pour éviter les calculs trop lourds")
        
        return start_date, end_date
    
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
    
    def get_projects_metrics(self, start_date, end_date, selected_widgets=None):
        """Calcule les métriques des projets (personnalisable par widgets)"""
        try:
            selected = self._selected_set(selected_widgets)
            result = {}
            
            # Vérifier d'abord si des métriques de projets sont demandées
            if selected and not self._has_section_widgets('projects', selected):
                # Aucun widget de projets demandé
                logger.debug(f"Aucun widget de projets demandé pour {self.user.username if self.user else 'anonyme'}")
                return result

            # Projets dans la période (nécessaire pour plusieurs sous-métriques)
            need_projects_qs = any([
                self._want('projects', 'status_distribution', selected),
                self._want('projects', 'recent_projects', selected),
                self._want('projects', 'monthly_projects', selected),
                self._want('projects', 'project_performance', selected),
            ])
            
            projects_in_period = None
            if need_projects_qs:
                projects_in_period = Project.objects.filter(
                    created_at__gte=start_date,
                    created_at__lte=end_date
                )
                projects_in_period = self._filter_by_role(projects_in_period, 'projects')
                logger.debug(f"Calcul des métriques projets pour {projects_in_period.count()} projets")
            
            # Distribution par statut
            if self._want('projects', 'status_distribution', selected) and projects_in_period is not None:
                status_distribution = dict(
                    projects_in_period.values('status').annotate(
                        count=Count('id')
                    ).values_list('status', 'count')
                )
                result['status_distribution'] = status_distribution
            
            # Projets récents
            if self._want('projects', 'recent_projects', selected) and projects_in_period is not None:
                recent_projects_qs = projects_in_period.order_by('-created_at')[:10].values(
                    'id', 'title', 'status', 'progress', 'created_at', 'start_date', 'deadline'
                )
                recent_projects = []
                for p in recent_projects_qs:
                    activite_percent = int(p['progress'] or 0)
                    delai_percent = 0
                    if p.get('start_date') and p.get('deadline'):
                        total_days = (p['deadline'] - p['start_date']).days
                        if total_days and total_days > 0:
                            days_elapsed = (self.now.date() - p['start_date']).days
                            delai_percent = int(min(max((days_elapsed / total_days) * 100, 0), 100))
                    recent_projects.append({
                        'id': p['id'],
                        'name': p['title'],
                        'status': p['status'],
                        'progress': p['progress'],
                        'created_at': p['created_at'],
                        'activite_percent': activite_percent,
                        'delai_percent': delai_percent,
                    })
                result['recent_projects'] = list(recent_projects)
            
            # Projets en retard et progress_retards
            if self._want('projects', 'overdue_projects', selected) or self._want('projects', 'progress_retards', selected):
                overdue_base = Project.objects.filter(
                    deadline__lt=self.now,
                    status__in=['Production', 'Livraison','Terminé']
                )
                overdue_base = self._filter_by_role(overdue_base, 'projects')
                
                if self._want('projects', 'overdue_projects', selected):
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
                    result['overdue_projects'] = list(overdue_projects)
                
                if self._want('projects', 'progress_retards', selected):
                    result['progress_retards'] = {
                        'projects_overdue_count': overdue_base.count(),
                        'unbilled_amount_total': float(0)
                    }
            
            # Performance des équipes
            if self._want('projects', 'team_performance', selected):
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
                result['team_performance'] = list(team_performance)

            # Projets par mois
            if self._want('projects', 'monthly_projects', selected) and projects_in_period is not None:
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
                result['monthly_projects'] = monthly_projects
            
            # Top/Flop projets
            if self._want('projects', 'project_performance', selected) and projects_in_period is not None:
                project_performance = []
                top_projects = projects_in_period.order_by('-progress')[:5].values('title', 'progress')
                flop_projects = projects_in_period.order_by('progress')[:5].values('title', 'progress')
                project_performance.append({
                    'type': 'top',
                    'projects': list(top_projects)
                })
                project_performance.append({
                    'type': 'flop',
                    'projects': list(flop_projects)
                })
                result['project_performance'] = project_performance
            
            result['user_role'] = self.user_role
            result['widgets_used'] = [k for k in selected or [] if k.startswith('projects.')] if selected else []
            return result
            
        except Exception as e:
            logger.error(f"Erreur lors du calcul des métriques projets: {str(e)}")
            return {'error': str(e)}
    
    def get_financial_metrics(self, start_date, end_date, selected_widgets=None):
        """Calcule les métriques financières (personnalisable par widgets)"""
        try:
            selected = self._selected_set(selected_widgets)
            result = {}

            # Vérifier d'abord si des métriques financières sont demandées
            if selected and not self._has_section_widgets('financial', selected):
                # Aucun widget financier demandé
                logger.debug(f"Aucun widget financier demandé pour {self.user.username if self.user else 'anonyme'}")
                return result

            # Validation et normalisation des dates
            start_date, end_date = self._validate_date_range(start_date, end_date, max_days=365*2)
            if not start_date or not end_date:
                logger.warning("Dates de début ou de fin manquantes pour les métriques financières")
                return {}
            
            # Tendance (journalière/mensuelle)
            if self._want('financial', 'revenue_trend', selected):
                revenue_trend = []
                from dateutil.relativedelta import relativedelta
                months_diff = (end_date.year - start_date.year) * 12 + end_date.month - start_date.month
                if months_diff < 1:
                    period_days = (end_date - start_date).days
                    if period_days <= 0:
                        period_days = 1
                    if period_days > 30:
                        period_days = 30
                        end_date = start_date + timedelta(days=30)
                    for i in range(period_days):
                        day_date = start_date + timedelta(days=i)
                        day_end = day_date + timedelta(days=1)
                        factures_base = Facture.objects.filter(
                            date_emission__gte=day_date,
                            date_emission__lt=day_end,
                            statut='payee'
                        )
                        factures_base = self._filter_by_role(factures_base, 'billings')
                        daily_revenue = factures_base.aggregate(
                            total=Coalesce(
                                Sum('montant_ht'),
                                Value(0, output_field=DecimalField(max_digits=12, decimal_places=2))
                            )
                        )['total'] or 0
                        revenue_trend.append({
                            'period': day_date.strftime('%Y-%m-%d'),
                            'recettes': float(daily_revenue),
                            'type': 'daily'
                        })
                else:
                    current_date = start_date.replace(day=1)
                    end_month = end_date.replace(day=1)
                    if months_diff > 24:
                        logger.warning(f"Intervalle trop large ({months_diff} mois), limité à 24 mois")
                        end_month = start_date + relativedelta(months=24)
                    while current_date <= end_month:
                        month_end = current_date + relativedelta(months=1) - timedelta(days=1)
                        factures_base = Facture.objects.filter(
                            date_emission__gte=current_date,
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
                            'period': current_date.strftime('%Y-%m'),
                            'recettes': float(monthly_revenue),
                            'type': 'monthly'
                        })
                        current_date += relativedelta(months=1)
                result['revenue_trend'] = revenue_trend

            # Statut de facturation
            if self._want('financial', 'billing_status', selected):
                factures_status = Facture.objects.filter(
                    date_emission__gte=start_date,
                    date_emission__lte=end_date
                )
                factures_status = self._filter_by_role(factures_status, 'billings')
                billing_status = dict(
                    factures_status.values('statut').annotate(
                        count=Count('id')
                    ).values_list('statut', 'count')
                )
                result['billing_status'] = billing_status
            
            # Conversion des devis
            if self._want('financial', 'devis_conversion', selected):
                devis_base = Devis.objects.filter(
                    date_creation__gte=start_date,
                    date_creation__lte=end_date
                )
                devis_base = self._filter_by_role(devis_base, 'devis')
                total_devis = devis_base.count()
                converted_devis = devis_base.filter(statut='accepte').count()
                conversion_rate = (converted_devis / total_devis * 100) if total_devis > 0 else 0
                result['devis_conversion'] = {
                    'total': total_devis,
                    'converted': converted_devis,
                    'rate': round(conversion_rate, 1)
                }
            
            # Flux de trésorerie
            income = None
            if self._want('financial', 'cash_flow', selected) or self._want('financial', 'period_metrics', selected):
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
                
                if self._want('financial', 'cash_flow', selected):
                    expenses = 0
                    net = income - expenses
                    result['cash_flow'] = {'recettes': float(income), 'expenses': float(expenses), 'net': float(net)}

            # Montant impayé
            if self._want('financial', 'montant_impaye', selected):
                factures_impayees = Facture.objects.filter(
                    statut__in=['emise', 'envoyee', 'en_retard'],
                    date_echeance__lt=self.now
                )
                factures_impayees = self._filter_by_role(factures_impayees, 'billings')
                montant_impaye = factures_impayees.aggregate(
                    total=Coalesce(
                        Sum('montant_restant'),
                        Value(0, output_field=DecimalField(max_digits=12, decimal_places=2))
                    )
                )['total'] or 0
                result['montant_impaye'] = float(montant_impaye)

            # Taux de recouvrement et métriques de période
            if self._want('financial', 'taux_recouvrement', selected) or self._want('financial', 'period_metrics', selected):
                factures_periode = Facture.objects.filter(
                    date_emission__gte=start_date,
                    date_emission__lte=end_date
                )
                factures_periode = self._filter_by_role(factures_periode, 'billings')
                total_factures_periode = factures_periode.aggregate(
                    total=Coalesce(
                        Sum('montant_ttc'),
                        Value(0, output_field=DecimalField(max_digits=12, decimal_places=2))
                    )
                )['total'] or 0
                recettes_periode = factures_periode.filter(statut='payee').aggregate(
                    total=Coalesce(
                        Sum('montant_ttc'),
                        Value(0, output_field=DecimalField(max_digits=12, decimal_places=2))
                    )
                )['total'] or 0
                taux_recouvrement_periode = (recettes_periode / total_factures_periode * 100) if total_factures_periode > 0 else 0
                
                if self._want('financial', 'taux_recouvrement', selected):
                    factures_cumulees = Facture.objects.filter(
                        date_emission__lte=end_date
                    )
                    factures_cumulees = self._filter_by_role(factures_cumulees, 'billings')
                    total_factures_cumule = factures_cumulees.aggregate(
                        total=Coalesce(
                            Sum('montant_ttc'),
                            Value(0, output_field=DecimalField(max_digits=12, decimal_places=2))
                        )
                    )['total'] or 0
                    recettes_cumulees = factures_cumulees.filter(statut='payee').aggregate(
                        total=Coalesce(
                            Sum('montant_ttc'),
                            Value(0, output_field=DecimalField(max_digits=12, decimal_places=2))
                        )
                    )['total'] or 0
                    taux_recouvrement_cumule = (recettes_cumulees / total_factures_cumule * 100) if total_factures_cumule > 0 else 0
                    result['taux_recouvrement'] = {
                        'periode': round(taux_recouvrement_periode, 2),
                        'cumule': round(taux_recouvrement_cumule, 2)
                    }
                
                # Métriques de période
                if self._want('financial', 'period_metrics', selected):
                    period_days = (end_date - start_date).days
                    avg_daily_revenue = float(income or 0) / period_days if period_days > 0 else 0
                    previous_start = start_date - timedelta(days=period_days)
                    previous_end = start_date - timedelta(days=1)
                    previous_factures = Facture.objects.filter(
                        date_emission__gte=previous_start,
                        date_emission__lte=previous_end,
                        statut='payee'
                    )
                    previous_factures = self._filter_by_role(previous_factures, 'billings')
                    previous_income = previous_factures.aggregate(
                        total=Coalesce(
                            Sum('montant_ht'),
                            Value(0, output_field=DecimalField(max_digits=12, decimal_places=2))
                        )
                    )['total'] or 0
                    revenue_growth = 0
                    if previous_income > 0:
                        revenue_growth = ((income or 0 - previous_income) / previous_income) * 100
                    result['period_metrics'] = {
                        'period_days': period_days,
                        'avg_daily_recettes': round(avg_daily_revenue, 2),
                        'projected_monthly_recettes': round(avg_daily_revenue * 30, 2),
                        'recettes_growth_percent': round(revenue_growth, 1),
                        'previous_period_income': float(previous_income)
                    }

            # Totaux additionnels
            if self._want('financial', 'total_paid_amount', selected):
                factures_payees = Facture.objects.filter(
                    date_emission__gte=start_date,
                    date_emission__lte=end_date,
                    statut='payee'
                )
                factures_payees = self._filter_by_role(factures_payees, 'billings')
                total_paid_amount = factures_payees.aggregate(
                    total=Coalesce(Sum('montant_ttc'), Value(0, output_field=DecimalField(max_digits=12, decimal_places=2)))
                )['total'] or 0
                result['total_paid_amount'] = float(total_paid_amount)

            if self._want('financial', 'total_en_retard_amount', selected):
                factures_en_retard = Facture.objects.filter(
                    date_emission__gte=start_date,
                    date_emission__lte=end_date,
                    statut='en_retard'
                )
                factures_en_retard = self._filter_by_role(factures_en_retard, 'billings')
                total_en_retard_amount = factures_en_retard.aggregate(
                    total=Coalesce(Sum('montant_ttc'), Value(0, output_field=DecimalField(max_digits=12, decimal_places=2)))
                )['total'] or 0
                result['total_en_retard_amount'] = float(total_en_retard_amount)

            if self._want('financial', 'total_impayees_amount', selected):
                factures_impayees = Facture.objects.filter(
                    date_emission__gte=start_date,
                    date_emission__lte=end_date,
                    statut='emise'
                )
                factures_impayees = self._filter_by_role(factures_impayees, 'billings')
                total_impayees_amount = factures_impayees.aggregate(
                    total=Coalesce(Sum('montant_ttc'), Value(0, output_field=DecimalField(max_digits=12, decimal_places=2)))
                )['total'] or 0
                result['total_impayees_amount'] = float(total_impayees_amount)

            if self._want('financial', 'total_factures_amount', selected):
                factures_total = Facture.objects.filter(
                    date_emission__gte=start_date,
                    date_emission__lte=end_date
                )
                factures_total = self._filter_by_role(factures_total, 'billings')
                total_factures_amount = factures_total.aggregate(
                    total=Coalesce(Sum('montant_ttc'), Value(0, output_field=DecimalField(max_digits=12, decimal_places=2)))
                )['total'] or 0
                result['total_factures_amount'] = float(total_factures_amount)

            result['widgets_used'] = [k for k in selected or [] if k.startswith('financial.')] if selected else []
            return result
            
        except Exception as e:
            logger.error(f"Erreur lors du calcul des métriques financières: {str(e)}")
            return {'error': str(e)}
    
    def get_performance_metrics(self, start_date, end_date, selected_widgets=None):
        """Calcule les métriques de performance (personnalisable par widgets)"""
        try:
            selected = self._selected_set(selected_widgets)
            result = {}

            # Vérifier d'abord si des métriques de performance sont demandées
            if selected and not self._has_section_widgets('performance', selected):
                # Aucun widget de performance demandé
                logger.debug(f"Aucun widget de performance demandé pour {self.user.username if self.user else 'anonyme'}")
                return result

            # Performance des équipes
            if self._want('performance', 'team_productivity', selected):
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
                result['team_productivity'] = list(team_productivity)
            
            # Performance des utilisateurs
            if self._want('performance', 'user_performance', selected):
                user_base = User.objects.all()
                if self.user_role in ['Chef de projet', 'Designer', 'Développeur', 'Rédacteur']:
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
                result['user_performance'] = list(user_performance)
            
            # Taux de completion global et tâches
            if any([
                self._want('performance', 'task_completion_rate', selected),
                self._want('performance', 'overdue_activities', selected),
                self._want('performance', 'pending_tasks', selected),
                self._want('performance', 'overdue_tasks', selected)
            ]):
                tasks_base = ProjectTask.objects.filter(
                    created_at__gte=start_date,
                    created_at__lte=end_date
                )
                if self.user_role in ['Chef de projet', 'Designer', 'Développeur', 'Rédacteur']:
                    project_ids = Project.objects.filter(
                        project_members__user=self.user
                    ).values_list('id', flat=True)
                    tasks_base = tasks_base.filter(project_id__in=project_ids)
                
                total_tasks = tasks_base.count()
                completed_tasks = tasks_base.filter(status='Terminé').count()
                
                if self._want('performance', 'task_completion_rate', selected):
                    global_completion_rate = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
                    result['task_completion_rate'] = {
                        'total': total_tasks,
                        'completed': completed_tasks,
                        'rate': round(global_completion_rate, 1)
                    }
                
                if self._want('performance', 'pending_tasks', selected):
                    result['pending_tasks'] = tasks_base.filter(status__in=['À faire', 'En cours']).count()
                
                if self._want('performance', 'overdue_tasks', selected) or self._want('performance', 'overdue_activities', selected):
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
                    
                    if self._want('performance', 'overdue_tasks', selected):
                        result['overdue_tasks'] = overdue_tasks_count
                    
                    if self._want('performance', 'overdue_activities', selected):
                        result['overdue_activities'] = {
                            'count': overdue_tasks_count,
                            'rate_percent': round((overdue_tasks_count / total_tasks * 100), 1) if total_tasks > 0 else 0
                        }
            
            result['widgets_used'] = [k for k in selected or [] if k.startswith('performance.')] if selected else []
            return result
            
        except Exception as e:
            logger.error(f"Erreur lors du calcul des métriques de performance: {str(e)}")
            return {'error': str(e)}
    
    def get_calendar_metrics(self, start_date, end_date, selected_widgets=None):
        """Calcule les métriques du calendrier (personnalisable par widgets)"""
        try:
            selected = self._selected_set(selected_widgets)
            result = {}

            # Vérifier d'abord si des métriques du calendrier sont demandées
            if selected and not self._has_section_widgets('calendar', selected):
                # Aucun widget de calendrier demandé
                logger.debug(f"Aucun widget de calendrier demandé pour {self.user.username if self.user else 'anonyme'}")
                return result

            # Échéances à venir
            if self._want('calendar', 'upcoming_deadlines', selected):
                upcoming_deadlines = []
                
                # Échéances de projets
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
                
                # Échéances de tâches
                task_deadlines_base = ProjectTask.objects.filter(
                    due_date__gte=self.now,
                    due_date__lte=self.now + timedelta(days=30),
                    status__in=['En cours', 'À faire']
                )
                if self.user_role in ['Chef de projet', 'Designer', 'Développeur', 'Rédacteur']:
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
                
                upcoming_deadlines.sort(key=lambda x: x['days_until_deadline'])
                result['upcoming_deadlines'] = upcoming_deadlines[:15]
            
            # Distribution des événements
            if self._want('calendar', 'event_distribution', selected):
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
                result['event_distribution'] = event_distribution
            
            # Utilisation des ressources
            if self._want('calendar', 'resource_utilization', selected):
                users_base = User.objects.all()
                if self.user_role in ['Chef de projet', 'Designer', 'Développeur', 'Rédacteur']:
                    users_base = users_base.filter(
                        Q(id=self.user.id) |
                        Q(team_members__team__team_members__user=self.user)
                    ).distinct()
                
                total_users = users_base.count()
                active_users = users_base.filter(
                    last_login__gte=self.now - timedelta(days=7)
                ).count()
                
                contracts_base = Contrat.objects.all()
                contracts_base = self._filter_by_role(contracts_base, 'contrats')
                total_contracts = contracts_base.count()
                
                utilization_rate = (active_users / total_users * 100) if total_users > 0 else 0
                result['resource_utilization'] = {
                    'active_users': active_users,
                    'total_contracts': total_contracts,
                    'utilization_rate': round(utilization_rate, 1)
                }
            
            result['user_role'] = self.user_role
            result['widgets_used'] = [k for k in selected or [] if k.startswith('calendar.')] if selected else []
            return result
            
        except Exception as e:
            logger.error(f"Erreur lors du calcul des métriques du calendrier: {str(e)}")
            return {'error': str(e)}
    
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
    
    def get_overview_metrics(self, start_date, end_date, selected_widgets=None):
        """Récupère toutes les métriques pour l'aperçu (filtrées si widgets fournis)"""
        try:
            # Si aucun widget n'est spécifié, utiliser ceux autorisés pour l'utilisateur
            if selected_widgets is None:
                selected_widgets = self.get_authorized_widgets()
            
            overview_data = {
                'projects': self.get_projects_metrics(start_date, end_date, selected_widgets),
                'financial': self.get_financial_metrics(start_date, end_date, selected_widgets),
                'performance': self.get_performance_metrics(start_date, end_date, selected_widgets),
                'calendar': self.get_calendar_metrics(start_date, end_date, selected_widgets),
                'last_updated': timezone.now().isoformat(),
                'user_role': self.user_role,
                'widgets_config': {
                    'total_available': len(AVAILABLE_WIDGETS),
                    'total_authorized': len(selected_widgets) if selected_widgets else len(AVAILABLE_WIDGETS),
                    'widgets_used': selected_widgets if selected_widgets else list(AVAILABLE_WIDGETS.keys())
                }
            }
            
            return overview_data
            
        except Exception as e:
            logger.error(f"Erreur lors de la récupération de l'aperçu des métriques: {str(e)}")
            return {'error': str(e)} 