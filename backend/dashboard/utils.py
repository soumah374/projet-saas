def permission_widget(user):
    """
    Détermine les widgets autorisés pour un utilisateur donné en fonction de DashboardWidgetConfig.
    
    Args:
        user: Instance de User
        
    Returns:
        list: Liste des clés de widgets autorisés pour cet utilisateur basée sur DashboardWidgetConfig
    """
    from .models import DashboardWidgetConfig
    from .services import DashboardMetricsService
    
    if not user or not user.is_authenticated:
        return []
    
    try:
        # Utiliser le service pour récupérer les widgets autorisés
        metrics_service = DashboardMetricsService(user=user)
        return metrics_service.get_authorized_widgets()
        
    except Exception as e:
        # En cas d'erreur, retourner une liste vide (sécurité par défaut)
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Erreur lors de la récupération des widgets autorisés: {str(e)}")
        return []


def get_user_widget_config(user):
    """
    Récupère la configuration des widgets pour un utilisateur donné.
    
    Args:
        user: Instance de User
        
    Returns:
        dict: Configuration des widgets avec informations détaillées
    """
    from .services import DashboardMetricsService
    
    if not user or not user.is_authenticated:
        return {}
    
    try:
        metrics_service = DashboardMetricsService(user=user)
        authorized_widgets = metrics_service.get_authorized_widgets()
        config = metrics_service._load_widget_config()
        
        config_data = {
            'authorized_widgets': authorized_widgets,
            'user_role': metrics_service.user_role,
            'total_available': len(DashboardMetricsService.list_available_widgets()),
            'total_authorized': len(authorized_widgets)
        }
        
        if config:
            config_data.update({
                'config_id': config.id,
                'is_active': config.is_active,
                'updated_at': config.updated_at.isoformat(),
                'is_user_specific': config.user is not None,
                'role': config.role
            })
        
        return config_data
        
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Erreur lors de la récupération de la configuration des widgets: {str(e)}")
        return {}


def validate_widget_permissions(user, requested_widgets):
    """
    Valide si un utilisateur a accès aux widgets demandés.
    
    Args:
        user: Instance de User
        requested_widgets: Liste des widgets demandés
        
    Returns:
        dict: Résultat de la validation avec widgets autorisés et refusés
    """
    if not user or not user.is_authenticated:
        return {
            'authorized': [],
            'unauthorized': requested_widgets,
            'total_requested': len(requested_widgets),
            'total_authorized': 0
        }
    
    try:
        metrics_service = DashboardMetricsService(user=user)
        authorized_widgets = set(metrics_service.get_authorized_widgets())
        requested_set = set(requested_widgets or [])
        
        authorized = list(authorized_widgets.intersection(requested_set))
        unauthorized = list(requested_set - authorized_widgets)
        
        return {
            'authorized': authorized,
            'unauthorized': unauthorized,
            'total_requested': len(requested_widgets),
            'total_authorized': len(authorized),
            'user_role': metrics_service.user_role
        }
        
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Erreur lors de la validation des permissions des widgets: {str(e)}")
        return {
            'authorized': [],
            'unauthorized': requested_widgets,
            'total_requested': len(requested_widgets),
            'total_authorized': 0,
            'error': str(e)
        }