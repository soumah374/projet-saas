from django.core.management.base import BaseCommand
from django.core.management import call_command
from users.models import ClientCategory


class Command(BaseCommand):
    help = 'Seed client categories with predefined data'

    def handle(self, *args, **options):
        self.stdout.write('Loading client categories...')
        
        # Check if categories already exist
        if ClientCategory.objects.exists():
            self.stdout.write(
                self.style.WARNING('Client categories already exist. Skipping...')
            )
            return
        
        # Load fixture
        try:
            call_command('loaddata', 'initial_client_categories.json', verbosity=0)
            self.stdout.write(
                self.style.SUCCESS('Successfully loaded client categories')
            )
            
            # Display loaded categories
            categories = ClientCategory.objects.all()
            self.stdout.write('\nLoaded categories:')
            for category in categories:
                self.stdout.write(f'  - {category.name}')
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error loading client categories: {e}')
            ) 