from django.db import migrations
from django.utils import timezone

def create_default_phases(apps, schema_editor):
    Project = apps.get_model('projects', 'Project')
    ProjectPhase = apps.get_model('projects', 'ProjectPhase')
    
    # Create phases for existing projects
    for project in Project.objects.all():
        # Define standard phases with appropriate durations based on project deadline
        if project.start_date and project.deadline:
            total_days = (project.deadline - project.start_date).days
            prospection_days = total_days * 0.2  # 20% du temps
            devis_days = total_days * 0.1       # 10% du temps
            production_days = total_days * 0.6   # 60% du temps
            livraison_days = total_days * 0.1    # 10% du temps
            
            phases = [
                {
                    'name': 'Prospection',
                    'description': 'Phase de prospection et analyse des besoins',
                    'start_date': project.start_date,
                    'end_date': project.start_date + timezone.timedelta(days=int(prospection_days)),
                    'order': 1
                },
                {
                    'name': 'Devis',
                    'description': 'Préparation et négociation du devis',
                    'start_date': project.start_date + timezone.timedelta(days=int(prospection_days)),
                    'end_date': project.start_date + timezone.timedelta(days=int(prospection_days + devis_days)),
                    'order': 2
                },
                {
                    'name': 'Production',
                    'description': 'Phase de production et réalisation',
                    'start_date': project.start_date + timezone.timedelta(days=int(prospection_days + devis_days)),
                    'end_date': project.start_date + timezone.timedelta(days=int(prospection_days + devis_days + production_days)),
                    'order': 3
                },
                {
                    'name': 'Livraison',
                    'description': 'Phase de livraison et finalisation',
                    'start_date': project.start_date + timezone.timedelta(days=int(prospection_days + devis_days + production_days)),
                    'end_date': project.deadline,
                    'order': 4
                }
            ]
            
            # Create phases
            for phase_data in phases:
                ProjectPhase.objects.create(
                    project=project,
                    **phase_data
                )

def remove_default_phases(apps, schema_editor):
    ProjectPhase = apps.get_model('projects', 'ProjectPhase')
    ProjectPhase.objects.all().delete()

class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0008_remove_project_departments_and_more'),
    ]

    operations = [
        migrations.RunPython(create_default_phases, remove_default_phases),
    ] 