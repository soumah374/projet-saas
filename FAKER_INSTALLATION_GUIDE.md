# Guide d'Installation et d'Utilisation des Fakers

## Prérequis

### **1. Installation de Faker**

```bash
# Dans l'environnement virtuel du backend
cd backend
pip install Faker
```

### **2. Vérification de l'installation**

```bash
# Vérifier que Faker est installé
pip list | grep Faker
```

## Structure des fichiers

### **Fichiers créés**

```
backend/users/management/
├── commands/
│   ├── generate_fake_client_categories.py
│   ├── generate_fake_clients.py
│   └── example_faker_usage.py
```

### **Documentation**

```
├── CLIENTS_FAKER_DOCUMENTATION.md
├── FAKER_INSTALLATION_GUIDE.md
└── example_faker_usage.py
```

## Utilisation rapide

### **1. Génération des catégories**

```bash
cd backend
python manage.py generate_fake_client_categories
```

### **2. Génération des clients**

```bash
# Générer 50 clients (défaut)
python manage.py generate_fake_clients

# Générer 100 clients
python manage.py generate_fake_clients --count 100

# Générer 200 clients et supprimer les existants
python manage.py generate_fake_clients --count 200 --clear
```

### **3. Génération complète**

```bash
# Générer catégories + 100 clients
python manage.py generate_fake_client_categories
python manage.py generate_fake_clients --count 100
```

## Cas d'usage

### **🚀 Développement**

```bash
# Données de base pour le développement
python manage.py generate_fake_client_categories
python manage.py generate_fake_clients --count 50
```

### **🧪 Tests**

```bash
# Données minimales pour les tests
python manage.py generate_fake_client_categories --clear
python manage.py generate_fake_clients --count 20 --clear
```

### **🎭 Démonstration**

```bash
# Données riches pour les démos
python manage.py generate_fake_client_categories
python manage.py generate_fake_clients --count 500
```

### **🔄 Reset complet**

```bash
# Supprimer et régénérer toutes les données
python manage.py generate_fake_client_categories --clear
python manage.py generate_fake_clients --count 100 --clear
```

## Options disponibles

### **generate_fake_client_categories**

| Option    | Description                                | Défaut |
| --------- | ------------------------------------------ | ------ |
| `--clear` | Supprimer toutes les catégories existantes | False  |

### **generate_fake_clients**

| Option     | Description                          | Défaut |
| ---------- | ------------------------------------ | ------ |
| `--count`  | Nombre de clients à générer          | 50     |
| `--locale` | Locale pour la génération            | fr_FR  |
| `--clear`  | Supprimer tous les clients existants | False  |

## Exemples d'utilisation

### **Exemple 1 : Données de développement**

```bash
# Générer des données de base pour le développement
python manage.py generate_fake_client_categories
python manage.py generate_fake_clients --count 75
```

### **Exemple 2 : Tests automatisés**

```bash
# Dans un script de test
python manage.py generate_fake_client_categories --clear
python manage.py generate_fake_clients --count 10 --clear
```

### **Exemple 3 : Données de démonstration**

```bash
# Générer beaucoup de données pour une démo
python manage.py generate_fake_client_categories
python manage.py generate_fake_clients --count 300
```

### **Exemple 4 : Locale différente**

```bash
# Générer des clients avec des données anglaises
python manage.py generate_fake_clients --count 50 --locale en_US
```

## Intégration dans les scripts

### **Script de setup automatique**

```bash
#!/bin/bash
# setup_dev_data.sh

echo "🚀 Configuration des données de développement..."

# Générer les catégories
echo "📋 Génération des catégories..."
python manage.py generate_fake_client_categories

# Générer les clients
echo "👥 Génération des clients..."
python manage.py generate_fake_clients --count 100

echo "✅ Données de développement configurées !"
```

### **Script de reset**

```bash
#!/bin/bash
# reset_data.sh

echo "🔄 Reset des données..."

# Supprimer et régénérer
python manage.py generate_fake_client_categories --clear
python manage.py generate_fake_clients --count 50 --clear

echo "✅ Données resetées !"
```

## Utilisation dans les tests

### **Test avec fakers**

```python
from django.test import TestCase
from django.core.management import call_command

class ClientTestCase(TestCase):
    def setUp(self):
        # Générer les données de test
        call_command('generate_fake_client_categories')
        call_command('generate_fake_clients', count=10)

    def test_client_list(self):
        # Tests avec les données générées
        clients = ClientProfile.objects.all()
        self.assertTrue(clients.count() > 0)
```

### **Test avec données spécifiques**

```python
from faker import Faker

class SpecificClientTest(TestCase):
    def setUp(self):
        self.fake = Faker('fr_FR')

    def test_create_client(self):
        client = ClientProfile.objects.create(
            nom=self.fake.last_name(),
            prenom=self.fake.first_name(),
            email=self.fake.unique.email(),
            type_client='personne_physique'
        )
        self.assertIsNotNone(client.id)
```

## Dépannage

### **Erreur : Module Faker not found**

```bash
# Solution : Installer Faker
pip install Faker
```

### **Erreur : Command not found**

```bash
# Vérifier que les fichiers sont dans le bon répertoire
ls backend/users/management/commands/
```

### **Erreur : Validation error**

```bash
# Les données générées respectent les contraintes du modèle
# Si erreur, vérifier les migrations
python manage.py makemigrations
python manage.py migrate
```

### **Erreur : Email already exists**

```bash
# Utiliser l'option --clear pour supprimer les données existantes
python manage.py generate_fake_clients --clear
```

## Personnalisation

### **Modifier les proportions**

Éditer `generate_fake_clients.py` :

```python
# Changer la proportion personnes physiques/morales
type_client = 'personne_physique' if random.random() < 0.8 else 'personne_morale'
```

### **Ajouter de nouvelles villes**

```python
villes_francaises = [
    # ... villes existantes ...
    'Nouvelle Ville'
]
```

### **Modifier les catégories**

Éditer `generate_fake_client_categories.py` :

```python
categories_data = [
    # ... catégories existantes ...
    {
        'name': 'Nouvelle catégorie',
        'description': 'Description'
    }
]
```

## Bonnes pratiques

### **1. Environnements**

- **Développement** : 50-100 clients
- **Tests** : 10-20 clients
- **Démonstration** : 200-500 clients

### **2. Sécurité**

- Ne jamais utiliser en production
- Toujours utiliser `--clear` pour les tests
- Vérifier les données générées

### **3. Performance**

- Utiliser `bulk_create` pour de gros volumes
- Éviter de générer trop de données inutilement
- Nettoyer régulièrement les données de test

### **4. Maintenance**

- Mettre à jour les fakers régulièrement
- Adapter aux évolutions du modèle
- Documenter les changements

## Support

### **Documentation complète**

- `CLIENTS_FAKER_DOCUMENTATION.md` : Documentation détaillée
- `example_faker_usage.py` : Exemples d'utilisation

### **Commandes d'aide**

```bash
# Aide sur les commandes
python manage.py generate_fake_client_categories --help
python manage.py generate_fake_clients --help
```

### **Logs et debug**

```bash
# Activer les logs détaillés
python manage.py generate_fake_clients --count 10 --verbosity 2
```

Ce guide vous permet de démarrer rapidement avec les fakers pour les clients !
