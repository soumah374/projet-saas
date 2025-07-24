# Fakers pour les Clients - Documentation

## Vue d'ensemble

Des commandes Django ont été créées pour générer des données de test réalistes pour les clients, facilitant le développement et les tests de l'application.

## Commandes disponibles

### 1. **Génération de catégories de clients**

```bash
python manage.py generate_fake_client_categories
```

### 2. **Génération de clients fictifs**

```bash
python manage.py generate_fake_clients --count 100
```

## Détails des commandes

### **generate_fake_client_categories**

#### **Fonctionnalités**

- Génère 15 catégories de clients prédéfinies
- Évite les doublons (utilisation de `get_or_create`)
- Catégories réalistes couvrant différents types de clients

#### **Catégories générées**

1. **Particuliers** - Clients particuliers, consommateurs finaux
2. **Professionnels** - Professions libérales, artisans, commerçants
3. **PME** - Petites et moyennes entreprises (1-250 employés)
4. **Grandes entreprises** - Entreprises de plus de 250 employés
5. **Institutions publiques** - Administrations, collectivités, services publics
6. **Associations** - Organisations à but non lucratif
7. **Startups** - Jeunes entreprises innovantes en phase de développement
8. **Freelances** - Travailleurs indépendants, consultants
9. **Étudiants** - Étudiants et jeunes diplômés
10. **Retraités** - Personnes retraitées
11. **Investisseurs** - Investisseurs privés et institutionnels
12. **Distributeurs** - Revendeurs et distributeurs
13. **Partenaires** - Partenaires commerciaux et stratégiques
14. **Fournisseurs** - Fournisseurs de biens et services
15. **Clients VIP** - Clients premium avec un service personnalisé

#### **Options**

- `--clear` : Supprime toutes les catégories existantes avant de générer

#### **Exemple d'utilisation**

```bash
# Générer les catégories (sans supprimer les existantes)
python manage.py generate_fake_client_categories

# Supprimer et régénérer toutes les catégories
python manage.py generate_fake_client_categories --clear
```

### **generate_fake_clients**

#### **Fonctionnalités**

- Génère des clients fictifs avec des données réalistes
- Mélange de personnes physiques (70%) et morales (30%)
- Données géographiques françaises
- Validation automatique des modèles

#### **Données générées**

##### **Personnes physiques**

- **Nom et prénom** : Noms français réalistes
- **Email** : Emails uniques et valides
- **Téléphone** : Numéros de téléphone français
- **Type** : `personne_physique`
- **Statut commercial** : Prospect, Actif, Inactif, Bloqué (aléatoire)
- **Catégorie** : Sélection aléatoire parmi les catégories existantes
- **Adresse** : Adresses françaises réalistes
- **Ville** : Sélection parmi 25 villes françaises communes
- **Code postal** : Codes postaux français valides
- **Pays** : France, Belgique, Suisse, Canada, Luxembourg, Monaco

##### **Personnes morales**

- **Raison sociale** : Noms d'entreprises réalistes avec secteurs
- **RCCM/NIF** : Numéros d'identification uniques
- **Contact** : Nom et prénom du contact principal
- **Type** : `personne_morale`
- **Autres champs** : Identiques aux personnes physiques

#### **Options**

- `--count` : Nombre de clients à générer (défaut: 50)
- `--locale` : Locale pour la génération (défaut: fr_FR)
- `--clear` : Supprime tous les clients existants avant de générer

#### **Exemples d'utilisation**

```bash
# Générer 50 clients (défaut)
python manage.py generate_fake_clients

# Générer 100 clients
python manage.py generate_fake_clients --count 100

# Générer 200 clients avec locale anglaise
python manage.py generate_fake_clients --count 200 --locale en_US

# Supprimer tous les clients et en générer 75 nouveaux
python manage.py generate_fake_clients --count 75 --clear
```

## Données géographiques

### **Villes guinéennes utilisées**

- Conakry, Kankan, Kindia, Boké, Labé, Kissidougou, Faranah
- Nzérékoré, Mamou, Siguiri, Kouroussa, Dabola, Kérouané
- Mandiana, Télimélé, Pita, Dalaba, Coyah, Forécariah
- Dubréka, Boffa, Fria, Gaoual, Lélouma, Tougué, Koundara

### **Pays d'Afrique de l'Ouest**

- Guinée, Sénégal, Mali, Côte d'Ivoire, Burkina Faso
- Niger, Togo, Bénin, Ghana, Nigeria

### **Secteurs d'activité**

- Technologie, Finance, Santé, Éducation, Commerce, Industrie
- Services, Construction, Transport, Tourisme, Agriculture
- Énergie, Télécommunications, Médias, Consulting

## Statistiques générées

### **Répartition par type**

- **70%** : Personnes physiques
- **30%** : Personnes morales

### **Répartition par statut**

- **Prospect** : ~25%
- **Actif** : ~40%
- **Inactif** : ~25%
- **Bloqué** : ~10%

### **Répartition géographique**

- **Guinée** : ~40%
- **Autres pays d'Afrique de l'Ouest** : ~60%

### **Taux d'activation**

- **75%** : Clients actifs
- **25%** : Clients inactifs

## Validation et sécurité

### **Validation automatique**

- Utilisation de `full_clean()` pour valider chaque client
- Gestion des erreurs avec messages détaillés
- Transaction atomique pour garantir l'intégrité

### **Unicité des données**

- Emails uniques grâce à `fake.unique.email()`
- RCCM/NIF uniques pour les personnes morales
- Évite les conflits de contraintes

### **Reproductibilité**

- Seed fixe (42) pour la reproductibilité des tests
- Données cohérentes entre les exécutions

## Utilisation en développement

### **Environnement de développement**

```bash
# Générer des données de base
python manage.py generate_fake_client_categories
python manage.py generate_fake_clients --count 100

# Pour les tests
python manage.py generate_fake_clients --count 20 --clear
```

### **Environnement de test**

```bash
# Données minimales pour les tests
python manage.py generate_fake_client_categories --clear
python manage.py generate_fake_clients --count 10 --clear
```

### **Environnement de démonstration**

```bash
# Données riches pour les démos
python manage.py generate_fake_client_categories
python manage.py generate_fake_clients --count 500
```

## Personnalisation

### **Ajouter de nouvelles catégories**

Modifier le fichier `generate_fake_client_categories.py` :

```python
categories_data = [
    # ... catégories existantes ...
    {
        'name': 'Nouvelle catégorie',
        'description': 'Description de la nouvelle catégorie'
    }
]
```

### **Modifier les proportions**

Dans `generate_fake_clients.py` :

```python
# Changer la proportion personnes physiques/morales
type_client = 'personne_physique' if random.random() < 0.8 else 'personne_morale'  # 80%/20%

# Changer les proportions de statuts
statut_commercial = random.choice(['prospect', 'actif', 'actif', 'inactif'])  # Plus d'actifs
```

### **Ajouter de nouvelles villes**

```python
villes_francaises = [
    # ... villes existantes ...
    'Nouvelle Ville'
]
```

## Intégration avec les tests

### **Fixtures pour les tests**

```python
# Dans un test
from django.core.management import call_command

def setUp(self):
    call_command('generate_fake_client_categories', clear=True)
    call_command('generate_fake_clients', count=10, clear=True)
```

### **Données de test spécifiques**

```python
# Créer des clients spécifiques pour les tests
client = ClientProfile.objects.create(
    nom="Test",
    prenom="Client",
    email="test@example.com",
    type_client="personne_physique",
    statut_commercial="actif"
)
```

## Maintenance

### **Nettoyage des données**

```bash
# Supprimer toutes les données de test
python manage.py shell
>>> from users.models import ClientProfile, ClientCategory
>>> ClientProfile.objects.all().delete()
>>> ClientCategory.objects.all().delete()
```

### **Mise à jour des fakers**

- Vérifier la compatibilité avec les nouvelles versions de Faker
- Adapter les données selon les évolutions du modèle
- Maintenir la cohérence avec les contraintes métier

Cette documentation fournit toutes les informations nécessaires pour utiliser efficacement les fakers de clients dans le développement et les tests !
