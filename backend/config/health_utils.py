"""
Utilitaires pour les métriques système du health check
"""
import platform
from typing import Dict, Any, Optional

def get_system_info() -> Dict[str, Any]:
    """
    Récupère les informations système de base
    """
    try:
        info = {
            'platform': platform.system(),
            'python_version': platform.python_version(),
            'architecture': platform.architecture()[0],
            'machine': platform.machine(),
            'processor': platform.processor(),
        }
        
        # Essayer d'ajouter des métriques détaillées si psutil est disponible
        detailed_metrics = get_detailed_system_metrics()
        if detailed_metrics:
            info.update(detailed_metrics)
        else:
            info['note'] = 'Detailed system metrics require psutil package'
            
        return info
    except Exception as e:
        return {
            'error': f'System info unavailable: {str(e)}'
        }

def get_detailed_system_metrics() -> Optional[Dict[str, Any]]:
    """
    Récupère des métriques système détaillées si psutil est disponible
    """
    try:
        import psutil
        
        return {
            'cpu_percent': psutil.cpu_percent(interval=1),
            'memory_percent': psutil.virtual_memory().percent,
            'memory_available': psutil.virtual_memory().available,
            'memory_total': psutil.virtual_memory().total,
            'disk_percent': psutil.disk_usage('/').percent,
            'disk_free': psutil.disk_usage('/').free,
            'disk_total': psutil.disk_usage('/').total,
            'load_average': psutil.getloadavg() if hasattr(psutil, 'getloadavg') else None,
        }
    except ImportError:
        # psutil n'est pas installé
        return None
    except Exception as e:
        # psutil est installé mais il y a une erreur
        return {
            'error': f'Detailed metrics error: {str(e)}'
        } 