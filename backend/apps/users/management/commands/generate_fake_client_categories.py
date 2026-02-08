from django.core.management.base import BaseCommand
from django.db import transaction
from users.models import ClientCategory

class Command(BaseCommand):
    help = 'Génère des catégories de clients fictives pour les tests'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Supprimer toutes les catégories existantes avant de générer'
        )

    def handle(self, *args, **options):
        clear = options['clear']

        # Catégories de clients prédéfinies
        categories_data = [
            {
                'name': 'Particuliers',
                'description': 'Clients particuliers, consommateurs finaux'
            },
            {
                'name': 'Professionnels',
                'description': 'Professions libérales, artisans, commerçants'
            },
            {
                'name': 'PME',
                'description': 'Petites et moyennes entreprises (1-250 employés)'
            },
            {
                'name': 'Grandes entreprises',
                'description': 'Entreprises de plus de 250 employés'
            },
            {
                'name': 'Institutions publiques',
                'description': 'Administrations, collectivités, services publics'
            },
            {
                'name': 'Associations',
                'description': 'Organisations à but non lucratif'
            },
            {
                'name': 'Startups',
                'description': 'Jeunes entreprises innovantes en phase de développement'
            },
            {
                'name': 'Freelances',
                'description': 'Travailleurs indépendants, consultants'
            },
            {
                'name': 'Étudiants',
                'description': 'Étudiants et jeunes diplômés'
            },
            {
                'name': 'Retraités',
                'description': 'Personnes retraitées'
            },
            {
                'name': 'Investisseurs',
                'description': 'Investisseurs privés et institutionnels'
            },
            {
                'name': 'Distributeurs',
                'description': 'Revendeurs et distributeurs'
            },
            {
                'name': 'Partenaires',
                'description': 'Partenaires commerciaux et stratégiques'
            },
            {
                'name': 'Fournisseurs',
                'description': 'Fournisseurs de biens et services'
            },
            {
                'name': 'Clients VIP',
                'description': 'Clients premium avec un service personnalisé'
            }
        ]

        with transaction.atomic():
            if clear:
                self.stdout.write('Suppression de toutes les catégories existantes...')
                ClientCategory.objects.all().delete()
                self.stdout.write(self.style.SUCCESS('Catégories supprimées avec succès'))

            self.stdout.write('Génération des catégories de clients...')

            categories_crees = 0
            for category_data in categories_data:
                category, created = ClientCategory.objects.get_or_create(
                    name=category_data['name'],
                    defaults={'description': category_data['description']}
                )
                
                if created:
                    categories_crees += 1
                    self.stdout.write(f'  ✅ Créée : {category.name}')

            self.stdout.write(
                self.style.SUCCESS(
                    f'✅ {categories_crees} nouvelles catégories créées !'
                )
            )

            # Afficher toutes les catégories
            total_categories = ClientCategory.objects.count()
            self.stdout.write(f'\n📊 Total des catégories : {total_categories}')
            
            self.stdout.write('\n📋 Liste des catégories disponibles :')
            for category in ClientCategory.objects.all().order_by('name'):
                self.stdout.write(f'  • {category.name} : {category.description}') 