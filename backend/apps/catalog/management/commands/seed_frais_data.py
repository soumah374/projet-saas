from django.core.management.base import BaseCommand
from django.core.management import call_command
from catalog.models import FraisCategory, LigneFrais


class Command(BaseCommand):
    help = 'Seed frais categories and lignes with predefined data'

    def handle(self, *args, **options):
        self.stdout.write('Loading frais categories and lignes...')
        
        # Check if categories already exist
        if FraisCategory.objects.exists():
            self.stdout.write(
                self.style.WARNING('Frais categories already exist. Skipping...')
            )
            return
        
        # Load fixtures
        try:
            # Charger les catégories de frais
            call_command('loaddata', 'initial_frais_categories.json', verbosity=0)
            self.stdout.write(
                self.style.SUCCESS('✅ Catégories de frais chargées avec succès')
            )
            
            # Charger les lignes de frais
            call_command('loaddata', 'initial_lignes_frais.json', verbosity=0)
            self.stdout.write(
                self.style.SUCCESS('✅ Lignes de frais chargées avec succès')
            )
            
            # Display loaded data
            categories = FraisCategory.objects.all()
            self.stdout.write('\n📋 Catégories chargées:')
            for category in categories:
                self.stdout.write(f'  - {category.name}')
            
            lignes = LigneFrais.objects.all()
            self.stdout.write(f'\n📝 Lignes de frais chargées: {lignes.count()}')
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Erreur lors du chargement des données: {e}')
            ) 