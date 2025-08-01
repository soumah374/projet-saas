"""
Exemples d'utilisation des fakers pour les clients

Ce fichier contient des exemples de code pour utiliser les fakers
dans différents contextes (tests, scripts, etc.)
"""

from django.core.management import call_command
from django.test import TestCase
from users.models import ClientProfile, ClientCategory
from faker import Faker
import random

class FakerExamples:
    """
    Classe contenant des exemples d'utilisation des fakers
    """
    
    @staticmethod
    def generate_categories():
        """Générer les catégories de clients"""
        call_command('generate_fake_client_categories')
        print("✅ Catégories générées avec succès")
    
    @staticmethod
    def generate_clients(count=50):
        """Générer des clients"""
        call_command('generate_fake_clients', count=count)
        print(f"✅ {count} clients générés avec succès")
    
    @staticmethod
    def generate_test_data():
        """Générer des données de test complètes"""
        # Générer les catégories
        FakerExamples.generate_categories()
        
        # Générer les clients
        FakerExamples.generate_clients(100)
        
        # Afficher les statistiques
        FakerExamples.show_statistics()
    
    @staticmethod
    def show_statistics():
        """Afficher les statistiques des clients"""
        total = ClientProfile.objects.count()
        physiques = ClientProfile.objects.filter(type_client='personne_physique').count()
        morales = ClientProfile.objects.filter(type_client='personne_morale').count()
        actifs = ClientProfile.objects.filter(is_active=True).count()
        
        print(f"\n📊 Statistiques :")
        print(f"  • Total clients : {total}")
        print(f"  • Personnes physiques : {physiques}")
        print(f"  • Personnes morales : {morales}")
        print(f"  • Clients actifs : {actifs}")
    
    @staticmethod
    def create_specific_client():
        """Créer un client spécifique pour les tests"""
        fake = Faker('fr_FR')
        
        # Créer une personne physique
        client_physique = ClientProfile.objects.create(
            nom=fake.last_name(),
            prenom=fake.first_name(),
            email=fake.unique.email(),
            telephone=fake.phone_number(),
            type_client='personne_physique',
            statut_commercial='actif',
            adresse=fake.street_address(),
            ville='Paris',
            code_postal='75001',
            pays='Guinée',
            is_active=True
        )
        
        # Créer une personne morale
        client_morale = ClientProfile.objects.create(
            email=fake.unique.email(),
            telephone=fake.phone_number(),
            type_client='personne_morale',
            statut_commercial='prospect',
            raison_sociale="Entreprise Test SARL",
            rccm_nif=f"RCCM{fake.unique.random_number(digits=8)}",
            contact=f"{fake.first_name()} {fake.last_name()}",
            adresse=fake.street_address(),
            ville='Lyon',
            code_postal='69001',
            pays='Guinée',
            is_active=True
        )
        
        print(f"✅ Client physique créé : {client_physique.nom_complet}")
        print(f"✅ Client moral créé : {client_morale.nom_complet}")
        
        return client_physique, client_morale

# Exemples d'utilisation dans les tests
class ClientFakerTestCase(TestCase):
    """Exemple de classe de test utilisant les fakers"""
    
    def setUp(self):
        """Configuration initiale avec fakers"""
        # Générer les catégories
        call_command('generate_fake_client_categories')
        
        # Générer quelques clients de test
        call_command('generate_fake_clients', count=10)
    
    def test_client_creation(self):
        """Test de création de clients"""
        # Vérifier que les clients ont été créés
        self.assertTrue(ClientProfile.objects.count() > 0)
        
        # Vérifier qu'il y a des personnes physiques et morales
        physiques = ClientProfile.objects.filter(type_client='personne_physique')
        morales = ClientProfile.objects.filter(type_client='personne_morale')
        
        self.assertTrue(physiques.count() > 0)
        self.assertTrue(morales.count() > 0)
    
    def test_client_validation(self):
        """Test de validation des clients"""
        # Créer un client avec des données invalides
        with self.assertRaises(Exception):
            ClientProfile.objects.create(
                email="",  # Email vide (invalide)
                type_client='personne_physique'
            )
    
    def test_client_categories(self):
        """Test des catégories de clients"""
        # Vérifier que les catégories ont été créées
        self.assertTrue(ClientCategory.objects.count() > 0)
        
        # Vérifier qu'il y a des clients avec des catégories
        clients_with_categories = ClientProfile.objects.filter(
            type_client='personne_physique',
            category__isnull=False
        )
        self.assertTrue(clients_with_categories.count() > 0)

# Exemples d'utilisation dans des scripts
def example_script_usage():
    """Exemple d'utilisation dans un script"""
    
    print("🚀 Démarrage de la génération de données de test...")
    
    # 1. Générer les catégories
    print("\n1. Génération des catégories...")
    FakerExamples.generate_categories()
    
    # 2. Générer les clients
    print("\n2. Génération des clients...")
    FakerExamples.generate_clients(50)
    
    # 3. Afficher les statistiques
    print("\n3. Statistiques finales...")
    FakerExamples.show_statistics()
    
    # 4. Créer des clients spécifiques
    print("\n4. Création de clients spécifiques...")
    FakerExamples.create_specific_client()
    
    print("\n✅ Génération terminée avec succès !")

def example_bulk_operations():
    """Exemple d'opérations en lot avec les fakers"""
    
    fake = Faker('fr_FR')
    
    # Créer plusieurs clients en lot
    clients_to_create = []
    
    for i in range(20):
        if random.random() < 0.7:  # 70% personnes physiques
            client = ClientProfile(
                nom=fake.last_name(),
                prenom=fake.first_name(),
                email=fake.unique.email(),
                telephone=fake.phone_number(),
                type_client='personne_physique',
                statut_commercial=random.choice(['prospect', 'actif', 'inactif']),
                adresse=fake.street_address(),
                ville=random.choice(['Paris', 'Lyon', 'Marseille']),
                code_postal=fake.postcode(),
                pays='Guinée',
                is_active=True
            )
        else:  # 30% personnes morales
            client = ClientProfile(
                email=fake.unique.email(),
                telephone=fake.phone_number(),
                type_client='personne_morale',
                statut_commercial=random.choice(['prospect', 'actif', 'inactif']),
                raison_sociale=f"Entreprise {fake.company()}",
                rccm_nif=f"RCCM{fake.unique.random_number(digits=8)}",
                contact=f"{fake.first_name()} {fake.last_name()}",
                adresse=fake.street_address(),
                ville=random.choice(['Paris', 'Lyon', 'Marseille']),
                code_postal=fake.postcode(),
                pays='Guinée',
                is_active=True
            )
        
        clients_to_create.append(client)
    
    # Créer tous les clients en une seule opération
    ClientProfile.objects.bulk_create(clients_to_create)
    
    print(f"✅ {len(clients_to_create)} clients créés en lot")

# Exemple d'utilisation dans un management command personnalisé
class CustomFakerCommand:
    """Exemple de commande personnalisée utilisant les fakers"""
    
    @staticmethod
    def generate_demo_data():
        """Générer des données de démonstration"""
        
        print("🎭 Génération de données de démonstration...")
        
        # Générer les catégories
        call_command('generate_fake_client_categories', clear=True)
        
        # Générer beaucoup de clients pour la démo
        call_command('generate_fake_clients', count=200, clear=True)
        
        # Créer quelques clients VIP pour la démo
        fake = Faker('fr_FR')
        
        vip_clients = [
            {
                'nom': 'Diallo',
                'prenom': 'Mamadou',
                'email': 'mamadou.diallo@example.com',
                'type_client': 'personne_physique',
                'statut_commercial': 'actif',
                'ville': 'Conakry',
                'raison_sociale': None
            },
            {
                'nom': '',
                'prenom': '',
                'email': 'contact@miniere-guinee.gn',
                'type_client': 'personne_morale',
                'statut_commercial': 'prospect',
                'ville': 'Kankan',
                'raison_sociale': 'Société Minière Guinéenne SARL'
            }
        ]
        
        for vip_data in vip_clients:
            if vip_data['type_client'] == 'personne_physique':
                ClientProfile.objects.create(
                    nom=vip_data['nom'],
                    prenom=vip_data['prenom'],
                    email=vip_data['email'],
                    telephone=fake.phone_number(),
                    type_client=vip_data['type_client'],
                    statut_commercial=vip_data['statut_commercial'],
                    adresse=fake.street_address(),
                    ville=vip_data['ville'],
                    code_postal=fake.postcode(),
                    pays='Guinée',
                    is_active=True
                )
            else:
                ClientProfile.objects.create(
                    email=vip_data['email'],
                    telephone=fake.phone_number(),
                    type_client=vip_data['type_client'],
                    statut_commercial=vip_data['statut_commercial'],
                    raison_sociale=vip_data['raison_sociale'],
                    rccm_nif=f"RCCM{fake.unique.random_number(digits=8)}",
                    contact=f"{fake.first_name()} {fake.last_name()}",
                    adresse=fake.street_address(),
                    ville=vip_data['ville'],
                    code_postal=fake.postcode(),
                    pays='Guinée',
                    is_active=True
                )
        
        print("✅ Données de démonstration générées avec succès !")

if __name__ == "__main__":
    # Exemple d'exécution directe
    print("🔧 Exemples d'utilisation des fakers pour les clients")
    print("=" * 50)
    
    # Exemple 1 : Génération de base
    print("\n1. Génération de données de base...")
    FakerExamples.generate_test_data()
    
    # Exemple 2 : Opérations en lot
    print("\n2. Opérations en lot...")
    example_bulk_operations()
    
    # Exemple 3 : Données de démonstration
    print("\n3. Données de démonstration...")
    CustomFakerCommand.generate_demo_data() 