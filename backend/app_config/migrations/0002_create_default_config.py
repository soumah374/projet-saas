# Migration pour créer une configuration par défaut

from django.db import migrations


def create_default_config(apps, schema_editor):
    """Créer une configuration par défaut"""
    ApplicationConfig = apps.get_model('app_config', 'ApplicationConfig')
    
    # Créer la configuration par défaut si elle n'existe pas
    if not ApplicationConfig.objects.exists():
        ApplicationConfig.objects.create(
            id=1,
            app_name='project_saas',
            app_description='Système de gestion de projets',
            company_name='project_saas',
            primary_color='#3B82F6',
            secondary_color='#6B7280',
        )


def reverse_default_config(apps, schema_editor):
    """Supprimer la configuration par défaut"""
    ApplicationConfig = apps.get_model('app_config', 'ApplicationConfig')
    ApplicationConfig.objects.filter(id=1).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('app_config', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(create_default_config, reverse_default_config),
    ]
