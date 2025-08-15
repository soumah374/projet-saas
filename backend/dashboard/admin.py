from django.contrib import admin
from .models import DashboardMetrics, DashboardCache


@admin.register(DashboardMetrics)
class DashboardMetricsAdmin(admin.ModelAdmin):
    """Administration des métriques du tableau de bord"""
    list_display = [
        'metric_type', 'metric_name', 'calculated_at', 
        'period_start', 'period_end', 'updated_at'
    ]
    list_filter = ['metric_type', 'calculated_at']
    search_fields = ['metric_name']
    readonly_fields = ['calculated_at', 'updated_at']
    
    fieldsets = (
        ('Informations de base', {
            'fields': ('metric_type', 'metric_name')
        }),
        ('Valeurs et période', {
            'fields': ('metric_value', 'period_start', 'period_end')
        }),
        ('Horodatage', {
            'fields': ('calculated_at', 'updated_at')
        }),
    )
    
    def has_add_permission(self, request):
        """Les métriques sont créées automatiquement par les services"""
        return False


@admin.register(DashboardCache)
class DashboardCacheAdmin(admin.ModelAdmin):
    """Administration du cache du tableau de bord"""
    list_display = [
        'cache_key', 'expires_at', 'created_at', 'is_expired'
    ]
    list_filter = ['expires_at', 'created_at']
    search_fields = ['cache_key']
    readonly_fields = ['created_at']
    
    fieldsets = (
        ('Informations de base', {
            'fields': ('cache_key', 'cache_data')
        }),
        ('Expiration', {
            'fields': ('expires_at',)
        }),
        ('Horodatage', {
            'fields': ('created_at',)
        }),
    )
    
    def is_expired(self, obj):
        """Affiche si le cache est expiré"""
        return obj.is_expired()
    is_expired.boolean = True
    is_expired.short_description = 'Expiré'
    
    def has_add_permission(self, request):
        """Le cache est géré automatiquement par les signaux"""
        return False 