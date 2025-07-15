from django.apps import AppConfig


class DepartmentsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'departments'
    verbose_name = 'Gestion des départements'

    def ready(self):
        try:
            import departments.signals
        except ImportError:
            pass
