from django.core.management.base import BaseCommand
from projects.models import Project


class Command(BaseCommand):
    help = 'Met à jour la progression de tous les projets basée sur l\'exécution des tâches'

    def add_arguments(self, parser):
        parser.add_argument(
            '--project-id',
            type=str,
            help='ID spécifique du projet à mettre à jour'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Afficher les changements sans les sauvegarder'
        )

    def handle(self, *args, **options):
        project_id = options.get('project_id')
        dry_run = options.get('dry_run')

        if project_id:
            try:
                project = Project.objects.get(id=project_id)
                self.update_project_progress(project, dry_run)
            except Project.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f'Projet avec l\'ID {project_id} non trouvé')
                )
        else:
            projects = Project.objects.all()
            self.stdout.write(f'Mise à jour de la progression pour {projects.count()} projets...')
            
            for project in projects:
                self.update_project_progress(project, dry_run)

        self.stdout.write(
            self.style.SUCCESS('Mise à jour de la progression terminée')
        )

    def update_project_progress(self, project, dry_run=False):
        """Met à jour la progression d'un projet spécifique"""
        old_progress = project.progress
        
        # Récupérer les détails de la progression
        progress_details = project.update_overall_progress()
        
        if dry_run:
            self.stdout.write(
                f'Projet {project.id} ({project.title}): '
                f'{old_progress}% → {progress_details["progress"]}% '
                f'(Tâches: {progress_details["completed_tasks"]}/{progress_details["total_tasks"]}, '
                f'Heures: {progress_details["total_actual_hours"]}/{progress_details["total_estimated_hours"]}, '
                f'Jours: {progress_details["days_elapsed"]}/{progress_details["total_days"]} '
                f'[{progress_details["days_remaining"]} restants])'
            )
        else:
            self.stdout.write(
                f'Projet {project.id} ({project.title}): '
                f'{old_progress}% → {progress_details["progress"]}% '
                f'(Jours: {progress_details["days_elapsed"]}/{progress_details["total_days"]})'
            ) 