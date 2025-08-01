from django.core.management.base import BaseCommand
from django.db import transaction
from faker import Faker
from users.models import ClientProfile, ClientCategory
import random

class Command(BaseCommand):
    help = 'Génère des clients fictifs pour les tests'

    def add_arguments(self, parser):
        parser.add_argument(
            '--count',
            type=int,
            default=50,
            help='Nombre de clients à générer (défaut: 50)'
        )
        parser.add_argument(
            '--locale',
            type=str,
            default='fr_FR',
            help='Locale pour la génération (défaut: fr_FR)'
        )
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Supprimer tous les clients existants avant de générer'
        )

    def handle(self, *args, **options):
        count = options['count']
        locale = options['locale']
        clear = options['clear']

        # Initialiser Faker avec la locale française
        fake = Faker(locale)
        Faker.seed(42)  # Pour la reproductibilité

        # Villes guinéennes communes
        villes_guineennes = [
            'Conakry', 'Kankan', 'Kindia', 'Boké', 'Labé', 'Kissidougou', 'Faranah',
            'Nzérékoré', 'Mamou', 'Siguiri', 'Kouroussa', 'Dabola', 'Kérouané',
            'Mandiana', 'Télimélé', 'Pita', 'Dalaba', 'Coyah', 'Forécariah',
            'Dubréka', 'Boffa', 'Fria', 'Gaoual', 'Lélouma', 'Tougué', 'Koundara'
        ]

        # Pays
        pays = ['Guinée', 'Sénégal', 'Mali', 'Côte d\'Ivoire', 'Burkina Faso', 'Niger', 'Togo', 'Bénin', 'Ghana', 'Nigeria']

        # Types d'entreprises pour les personnes morales
        types_entreprises = [
            'SARL', 'SAS', 'SA', 'EURL', 'SASU', 'SNC', 'SCI', 'Association', 
            'Fondation', 'Coopérative', 'Mutuelle'
        ]

        # Secteurs d'activité
        secteurs = [
            'Technologie', 'Finance', 'Santé', 'Éducation', 'Commerce', 'Industrie',
            'Services', 'Construction', 'Transport', 'Tourisme', 'Agriculture',
            'Énergie', 'Télécommunications', 'Médias', 'Consulting'
        ]

        # Préfixes pour les entreprises
        prefixes_entreprises = [
            'Groupe', 'Société', 'Entreprise', 'Compagnie', 'Organisation',
            'Institut', 'Centre', 'Laboratoire', 'Studio', 'Agence'
        ]

        # Noms d'entreprises
        noms_entreprises = [
            'Innovation', 'Excellence', 'Progrès', 'Avenir', 'Dynamique',
            'Performance', 'Qualité', 'Expertise', 'Solutions', 'Partners',
            'Technologies', 'Services', 'Consulting', 'Management', 'Development'
        ]

        with transaction.atomic():
            if clear:
                self.stdout.write('Suppression de tous les clients existants...')
                ClientProfile.objects.all().delete()
                self.stdout.write(self.style.SUCCESS('Clients supprimés avec succès'))

            # Récupérer les catégories existantes
            categories = list(ClientCategory.objects.all())
            
            self.stdout.write(f'Génération de {count} clients fictifs...')

            clients_crees = 0
            for i in range(count):
                # Décider du type de client (70% personnes physiques, 30% personnes morales)
                type_client = 'personne_physique' if random.random() < 0.7 else 'personne_morale'
                
                if type_client == 'personne_physique':
                    # Générer une personne physique
                    client = ClientProfile(
                        nom=fake.last_name(),
                        prenom=fake.first_name(),
                        email=fake.unique.email(),
                        telephone=fake.phone_number(),
                        type_client=type_client,
                        statut_commercial=random.choice(['prospect', 'actif', 'inactif', 'bloque']),
                        category=random.choice(categories) if categories else None,
                        adresse=fake.street_address(),
                        ville=random.choice(villes_guineennes),
                        code_postal=fake.postcode(),
                        pays=random.choice(pays),
                        is_active=random.choice([True, True, True, False])  # 75% actifs
                    )
                else:
                    # Générer une personne morale
                    secteur = random.choice(secteurs)
                    prefix = random.choice(prefixes_entreprises)
                    nom_entreprise = random.choice(noms_entreprises)
                    raison_sociale = f"{prefix} {nom_entreprise} {secteur}"
                    
                    client = ClientProfile(
                        nom="",  # Vide pour personne morale
                        prenom="",  # Vide pour personne morale
                        email=fake.unique.email(),
                        telephone=fake.phone_number(),
                        type_client=type_client,
                        statut_commercial=random.choice(['prospect', 'actif', 'inactif', 'bloque']),
                        raison_sociale=raison_sociale,
                        rccm_nif=f"RCCM{fake.unique.random_number(digits=8)}",
                        contact=f"{fake.first_name()} {fake.last_name()}",
                        adresse=fake.street_address(),
                        ville=random.choice(villes_guineennes),
                        code_postal=fake.postcode(),
                        pays=random.choice(pays),
                        is_active=random.choice([True, True, True, False])  # 75% actifs
                    )

                # Générer une adresse complète
                client.adresse_complete = f"{client.adresse}\n{client.code_postal} {client.ville}\n{client.pays}"

                try:
                    client.full_clean()  # Validation du modèle
                    client.save()
                    clients_crees += 1
                    
                    if (i + 1) % 10 == 0:
                        self.stdout.write(f'  {i + 1}/{count} clients créés...')
                        
                except Exception as e:
                    self.stdout.write(
                        self.style.ERROR(f'Erreur lors de la création du client {i + 1}: {e}')
                    )

            self.stdout.write(
                self.style.SUCCESS(
                    f'✅ {clients_crees} clients fictifs générés avec succès !'
                )
            )

            # Afficher des statistiques
            total_clients = ClientProfile.objects.count()
            personnes_physiques = ClientProfile.objects.filter(type_client='personne_physique').count()
            personnes_morales = ClientProfile.objects.filter(type_client='personne_morale').count()
            clients_actifs = ClientProfile.objects.filter(is_active=True).count()
            
            self.stdout.write('\n📊 Statistiques des clients :')
            self.stdout.write(f'  • Total : {total_clients}')
            self.stdout.write(f'  • Personnes physiques : {personnes_physiques}')
            self.stdout.write(f'  • Personnes morales : {personnes_morales}')
            self.stdout.write(f'  • Clients actifs : {clients_actifs}')
            
            # Statistiques par statut commercial
            self.stdout.write('\n📈 Répartition par statut commercial :')
            for statut in ['prospect', 'actif', 'inactif', 'bloque']:
                count_statut = ClientProfile.objects.filter(statut_commercial=statut).count()
                self.stdout.write(f'  • {statut.capitalize()} : {count_statut}')
            
            # Statistiques par ville
            self.stdout.write('\n🏙️  Top 5 des villes :')
            from django.db.models import Count
            top_villes = ClientProfile.objects.values('ville').annotate(
                count=Count('id')
            ).order_by('-count')[:5]
            
            for ville_data in top_villes:
                if ville_data['ville']:
                    self.stdout.write(f'  • {ville_data["ville"]} : {ville_data["count"]} clients') 