from django.db import models
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.db.models import Q

User = get_user_model()

class DashboardMetrics(models.Model):
    """Modèle pour stocker les métriques calculées du tableau de bord"""
    
    METRIC_TYPES = [
        ('overview', 'Vue d\'ensemble'),
        ('projects', 'Projets'),
        ('financial', 'Financier'),
        ('performance', 'Performance'),
        ('calendar', 'Calendrier'),
    ]
    
    metric_type = models.CharField(max_length=20, choices=METRIC_TYPES)
    metric_name = models.CharField(max_length=100)
    metric_value = models.JSONField()  # Stockage flexible des valeurs
    period_start = models.DateTimeField()
    period_end = models.DateTimeField()
    calculated_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['metric_type', 'metric_name', 'period_start', 'period_end']
        indexes = [
            models.Index(fields=['metric_type', 'period_start']),
            models.Index(fields=['calculated_at']),
        ]
    
    def __str__(self):
        return f"{self.metric_type} - {self.metric_name} ({self.period_start.date()})"

class DashboardCache(models.Model):
    """Modèle pour la mise en cache des métriques du tableau de bord"""
    
    cache_key = models.CharField(max_length=255, unique=True)
    cache_data = models.JSONField()
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['cache_key']),
            models.Index(fields=['expires_at']),
        ]
    
    def __str__(self):
        return f"{self.cache_key} (expire: {self.expires_at})"
    
    def is_expired(self):
        return timezone.now() > self.expires_at

class DashboardWidgetConfig(models.Model):
    """Configuration des widgets du tableau de bord par rôle (et éventuellement par utilisateur)."""
    
    role = models.CharField(max_length=100, db_index=True)
    # Liste des clés de widgets sélectionnés (ex: ["projects", "financial.revenue_trend"]) 
    widgets = models.JSONField(default=list)
    is_active = models.BooleanField(default=True)
    # Optionnel: permettre un override par utilisateur (null si config de rôle globale)
    user = models.ForeignKey(User, null=True, blank=True, on_delete=models.CASCADE, related_name='dashboard_widget_configs')
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['role']),
            models.Index(fields=['user']),
        ]
        unique_together = (
            ('role', 'user'),
        )
        constraints = [
            # Une seule configuration globale par rôle (quand user est NULL)
            models.UniqueConstraint(fields=['role'], condition=Q(user__isnull=True), name='uniq_dashboard_role_global'),
            # Une seule configuration par utilisateur (override)
            models.UniqueConstraint(fields=['user'], condition=Q(user__isnull=False), name='uniq_dashboard_user_override'),
        ]
        verbose_name = 'Configuration des widgets du tableau de bord'
        verbose_name_plural = 'Configurations des widgets du tableau de bord'
    
    def __str__(self):
        target = self.user.username if self.user_id else self.role
        return f"DashboardWidgetConfig({target})" 