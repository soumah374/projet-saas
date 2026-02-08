from django.core.management.base import BaseCommand
from django.core.management import call_command


class Command(BaseCommand):
    help = 'Charge les fixtures des projets avec les clients dans le bon ordre'

    def handle(self, *args, **options):
        self.stdout.write("Chargement des fixtures des projets...")
        
        try:
            # 1. Charger les clients d'abord
            self.stdout.write("1. Chargement des clients...")
            call_command('loaddata', 'initial_clients', verbosity=0)
            self.stdout.write(
                self.style.SUCCESS("✓ Clients chargés avec succès")
            )
            
            # 2. Charger les contrats
            self.stdout.write("2. Chargement des contrats...")
            call_command('loaddata', 'initial_contrats', verbosity=0)
            self.stdout.write(
                self.style.SUCCESS("✓ Contrats chargés avec succès")
            )
            
            # 3. Charger les projets
            self.stdout.write("3. Chargement des projets...")
            call_command('loaddata', 'initial_projects', verbosity=0)
            self.stdout.write(
                self.style.SUCCESS("✓ Projets chargés avec succès")
            )
            
            # 4. Charger les templates de tâches
            self.stdout.write("4. Chargement des templates de tâches...")
            call_command('loaddata', 'task_templates', verbosity=0)
            self.stdout.write(
                self.style.SUCCESS("✓ Templates de tâches chargés avec succès")
            )
            
            self.stdout.write(
                self.style.SUCCESS("Toutes les fixtures ont été chargées avec succès!")
            )
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f"Erreur lors du chargement des fixtures: {e}")
            ) 