from django.db.models.signals import post_save, post_delete, m2m_changed
from django.dispatch import receiver
from django.utils import timezone
from django.core.cache import cache
from django.db import transaction
import logging

from projects.models import Project, ProjectTask
from users.models import User
from teams.models import Team
from contrats.models import Contrat
from devis.models import Devis
from billings.models import Facture
from .models import DashboardMetrics, DashboardCache
from .services import DashboardMetricsService

logger = logging.getLogger(__name__)


class DashboardSignalManager:
    """Gestionnaire centralisé des signaux du tableau de bord"""
    
    @staticmethod
    def invalidate_cache():
        """Invalide le cache du tableau de bord"""
        try:
            # Supprime tous les caches expirés
            DashboardCache.objects.filter(
                expires_at__lt=timezone.now()
            ).delete()
            
            # Invalide le cache Django
            cache_keys = [
                'dashboard_overview_metrics',
                'dashboard_projects_metrics',
                'dashboard_financial_metrics',
                'dashboard_performance_metrics',
                'dashboard_calendar_metrics',
                'dashboard_realtime_updates'
            ]
            
            for key in cache_keys:
                cache.delete(key)
                
            logger.info("Cache du tableau de bord invalidé avec succès")
            
        except Exception as e:
            logger.error(f"Erreur lors de l'invalidation du cache: {str(e)}")
    
    @staticmethod
    def update_metrics():
        """Met à jour les métriques du tableau de bord"""
        try:
            service = DashboardMetricsService()
            now = timezone.now()
            
            # Période pour les métriques (30 derniers jours)
            end_date = now
            start_date = now - timezone.timedelta(days=30)
            
            # Calcul des métriques
            overview_metrics = service.get_overview_metrics(start_date, end_date)
            
            # Sauvegarde des métriques
            with transaction.atomic():
                # Supprime les anciennes métriques
                DashboardMetrics.objects.filter(
                    calculated_at__lt=now - timezone.timedelta(hours=1)
                ).delete()
                
                # Crée de nouvelles métriques
                for metric_type, metrics in overview_metrics.items():
                    for metric_name, metric_value in metrics.items():
                        if isinstance(metric_value, dict) or isinstance(metric_value, list):
                            DashboardMetrics.objects.create(
                                metric_type=metric_type,
                                metric_name=metric_name,
                                metric_value=metric_value,
                                period_start=start_date,
                                period_end=end_date
                            )
            
            logger.info("Métriques du tableau de bord mises à jour avec succès")
            
        except Exception as e:
            logger.error(f"Erreur lors de la mise à jour des métriques: {str(e)}")


# Signaux pour les projets
@receiver(post_save, sender=Project)
def project_saved(sender, instance, created, **kwargs):
    """Signal déclenché lors de la sauvegarde d'un projet"""
    try:
        if created:
            logger.info(f"Nouveau projet créé: {instance.title}")
        else:
            logger.info(f"Projet mis à jour: {instance.title}")
        
        # Invalide le cache et met à jour les métriques
        DashboardSignalManager.invalidate_cache()
        DashboardSignalManager.update_metrics()
        
    except Exception as e:
        logger.error(f"Erreur dans le signal project_saved: {str(e)}")


@receiver(post_delete, sender=Project)
def project_deleted(sender, instance, **kwargs):
    """Signal déclenché lors de la suppression d'un projet"""
    try:
        logger.info(f"Projet supprimé: {instance.title}")
        
        # Invalide le cache et met à jour les métriques
        DashboardSignalManager.invalidate_cache()
        DashboardSignalManager.update_metrics()
        
    except Exception as e:
        logger.error(f"Erreur dans le signal project_deleted: {str(e)}")


# Signaux pour les tâches de projet
@receiver(post_save, sender=ProjectTask)
def project_task_saved(sender, instance, created, **kwargs):
    """Signal déclenché lors de la sauvegarde d'une tâche"""
    try:
        if created:
            logger.info(f"Nouvelle tâche créée: {instance.title}")
        else:
            logger.info(f"Tâche mise à jour: {instance.title}")
        
        # Invalide le cache et met à jour les métriques
        DashboardSignalManager.invalidate_cache()
        DashboardSignalManager.update_metrics()
        
    except Exception as e:
        logger.error(f"Erreur dans le signal project_task_saved: {str(e)}")


@receiver(post_delete, sender=ProjectTask)
def project_task_deleted(sender, instance, **kwargs):
    """Signal déclenché lors de la suppression d'une tâche"""
    try:
        logger.info(f"Tâche supprimée: {instance.title}")
        
        # Invalide le cache et met à jour les métriques
        DashboardSignalManager.invalidate_cache()
        DashboardSignalManager.update_metrics()
        
    except Exception as e:
        logger.error(f"Erreur dans le signal project_task_deleted: {str(e)}")


# Signaux pour les contrats
@receiver(post_save, sender=Contrat)
def contrat_saved(sender, instance, created, **kwargs):
    """Signal déclenché lors de la sauvegarde d'un contrat"""
    try:
        if created:
            logger.info(f"Nouveau contrat créé: {instance.reference}")
        else:
            logger.info(f"Contrat mis à jour: {instance.reference}")
        
        # Invalide le cache et met à jour les métriques
        DashboardSignalManager.invalidate_cache()
        DashboardSignalManager.update_metrics()
        
    except Exception as e:
        logger.error(f"Erreur dans le signal contrat_saved: {str(e)}")


@receiver(post_delete, sender=Contrat)
def contrat_deleted(sender, instance, **kwargs):
    """Signal déclenché lors de la suppression d'un contrat"""
    try:
        logger.info(f"Contrat supprimé: {instance.reference}")
        
        # Invalide le cache et met à jour les métriques
        DashboardSignalManager.invalidate_cache()
        DashboardSignalManager.update_metrics()
        
    except Exception as e:
        logger.error(f"Erreur dans le signal contrat_deleted: {str(e)}")


# Signaux pour les devis
@receiver(post_save, sender=Devis)
def devis_saved(sender, instance, created, **kwargs):
    """Signal déclenché lors de la sauvegarde d'un devis"""
    try:
        if created:
            logger.info(f"Nouveau devis créé: {instance.reference}")
        else:
            logger.info(f"Devis mis à jour: {instance.reference}")
        
        # Invalide le cache et met à jour les métriques
        DashboardSignalManager.invalidate_cache()
        DashboardSignalManager.update_metrics()
        
    except Exception as e:
        logger.error(f"Erreur dans le signal devis_saved: {str(e)}")


@receiver(post_delete, sender=Devis)
def devis_deleted(sender, instance, **kwargs):
    """Signal déclenché lors de la suppression d'un devis"""
    try:
        logger.info(f"Devis supprimé: {instance.reference}")
        
        # Invalide le cache et met à jour les métriques
        DashboardSignalManager.invalidate_cache()
        DashboardSignalManager.update_metrics()
        
    except Exception as e:
        logger.error(f"Erreur dans le signal devis_deleted: {str(e)}")


# Signaux pour les factures
@receiver(post_save, sender=Facture)
def facture_saved(sender, instance, created, **kwargs):
    """Signal déclenché lors de la sauvegarde d'une facture"""
    try:
        if created:
            logger.info(f"Nouvelle facture créée: {instance.reference}")
        else:
            logger.info(f"Facture mise à jour: {instance.reference}")
        
        # Invalide le cache et met à jour les métriques
        DashboardSignalManager.invalidate_cache()
        DashboardSignalManager.update_metrics()
        
    except Exception as e:
        logger.error(f"Erreur dans le signal facture_saved: {str(e)}")


@receiver(post_delete, sender=Facture)
def facture_deleted(sender, instance, **kwargs):
    """Signal déclenché lors de la suppression d'une facture"""
    try:
        logger.info(f"Facture supprimée: {instance.reference}")
        
        # Invalide le cache et met à jour les métriques
        DashboardSignalManager.invalidate_cache()
        DashboardSignalManager.update_metrics()
        
    except Exception as e:
        logger.error(f"Erreur dans le signal facture_deleted: {str(e)}")


# Signaux pour les utilisateurs
@receiver(post_save, sender=User)
def user_saved(sender, instance, created, **kwargs):
    """Signal déclenché lors de la sauvegarde d'un utilisateur"""
    try:
        if created:
            logger.info(f"Nouvel utilisateur créé: {instance.username}")
        else:
            logger.info(f"Utilisateur mis à jour: {instance.username}")
        
        # Invalide le cache et met à jour les métriques
        DashboardSignalManager.invalidate_cache()
        DashboardSignalManager.update_metrics()
        
    except Exception as e:
        logger.error(f"Erreur dans le signal user_saved: {str(e)}")


@receiver(post_delete, sender=User)
def user_deleted(sender, instance, **kwargs):
    """Signal déclenché lors de la suppression d'un utilisateur"""
    try:
        logger.info(f"Utilisateur supprimé: {instance.username}")
        
        # Invalide le cache et met à jour les métriques
        DashboardSignalManager.invalidate_cache()
        DashboardSignalManager.update_metrics()
        
    except Exception as e:
        logger.error(f"Erreur dans le signal user_deleted: {str(e)}")


# Signaux pour les équipes
@receiver(post_save, sender=Team)
def team_saved(sender, instance, created, **kwargs):
    """Signal déclenché lors de la sauvegarde d'une équipe"""
    try:
        if created:
            logger.info(f"Nouvelle équipe créée: {instance.nom}")
        else:
            logger.info(f"Équipe mise à jour: {instance.nom}")
        
        # Invalide le cache et met à jour les métriques
        DashboardSignalManager.invalidate_cache()
        DashboardSignalManager.update_metrics()
        
    except Exception as e:
        logger.error(f"Erreur dans le signal team_saved: {str(e)}")


@receiver(post_delete, sender=Team)
def team_deleted(sender, instance, **kwargs):
    """Signal déclenché lors de la suppression d'une équipe"""
    try:
        logger.info(f"Équipe supprimée: {instance.nom}")
        
        # Invalide le cache et met à jour les métriques
        DashboardSignalManager.invalidate_cache()
        DashboardSignalManager.update_metrics()
        
    except Exception as e:
        logger.error(f"Erreur dans le signal team_deleted: {str(e)}")


# Signaux pour les relations many-to-many
@receiver(m2m_changed, sender=Team.members.through)
def team_members_changed(sender, instance, action, pk_set, **kwargs):
    """Signal déclenché lors de la modification des membres d'une équipe"""
    try:
        if action in ['post_add', 'post_remove', 'post_clear']:
            logger.info(f"Membres de l'équipe {instance.nom} modifiés")
            
            # Invalide le cache et met à jour les métriques
            DashboardSignalManager.invalidate_cache()
            DashboardSignalManager.update_metrics()
            
    except Exception as e:
        logger.error(f"Erreur dans le signal team_members_changed: {str(e)}")


@receiver(m2m_changed, sender=Project.team_members.through)
def project_members_changed(sender, instance, action, pk_set, **kwargs):
    """Signal déclenché lors de la modification des membres d'un projet"""
    try:
        if action in ['post_add', 'post_remove', 'post_clear']:
            logger.info(f"Membres du projet {instance.title} modifiés")
            
            # Invalide le cache et met à jour les métriques
            DashboardSignalManager.invalidate_cache()
            DashboardSignalManager.update_metrics()
            
    except Exception as e:
        logger.error(f"Erreur dans le signal project_members_changed: {str(e)}")


# Signal pour la mise à jour périodique des métriques
def schedule_metrics_update():
    """Fonction pour programmer la mise à jour périodique des métriques"""
    try:
        from django.core.management import call_command
        from django.utils import timezone
        
        # Vérifie si une mise à jour est nécessaire (toutes les heures)
        last_update = cache.get('dashboard_last_metrics_update')
        if not last_update or (timezone.now() - last_update).total_seconds() > 3600:
            
            # Met à jour les métriques
            DashboardSignalManager.update_metrics()
            
            # Met à jour le timestamp
            cache.set('dashboard_last_metrics_update', timezone.now(), 3600)
            
            logger.info("Mise à jour périodique des métriques effectuée")
            
    except Exception as e:
        logger.error(f"Erreur lors de la mise à jour périodique: {str(e)}")


# Configuration des signaux pour le développement
def setup_dashboard_signals():
    """Configure tous les signaux du tableau de bord"""
    try:
        logger.info("Configuration des signaux du tableau de bord...")
        
        # Vérifie que tous les signaux sont bien connectés
        signal_count = 0
        
        # Compte les signaux connectés
        from django.db.models.signals import post_save, post_delete, m2m_changed
        
        # Vérifie les signaux post_save
        for sender in [Project, ProjectTask, Contrat, Devis, Facture, User, Team]:
            if post_save.has_listeners(sender):
                signal_count += 1
        
        # Vérifie les signaux post_delete
        for sender in [Project, ProjectTask, Contrat, Devis, Facture, User, Team]:
            if post_delete.has_listeners(sender):
                signal_count += 1
        
        # Vérifie les signaux m2m_changed
        if m2m_changed.has_listeners(Team.members.through):
            signal_count += 1
        if m2m_changed.has_listeners(Project.team_members.through):
            signal_count += 1
        
        logger.info(f"Signaux du tableau de bord configurés avec succès. {signal_count} signaux actifs.")
        
    except Exception as e:
        logger.error(f"Erreur lors de la configuration des signaux: {str(e)}")


# Appel automatique de la configuration lors de l'import
setup_dashboard_signals() 