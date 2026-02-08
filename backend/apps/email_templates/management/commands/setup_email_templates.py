from django.core.management.base import BaseCommand
from django.core.management import call_command


class Command(BaseCommand):
    help = 'Setup des templates d\'emails par défaut'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Chargement des variables de templates...'))
        call_command('loaddata', 'email_template_variables.json')
        
        self.stdout.write(self.style.SUCCESS('Chargement des templates par défaut...'))
        call_command('loaddata', 'default_email_templates.json')
        
        self.stdout.write(self.style.SUCCESS('Templates d\'emails configurés avec succès!'))
