# Système de Facturation - Implémentation

## Vue d'ensemble

Le système de facturation a été implémenté pour automatiser la génération de factures basées sur les échéanciers de contrat. Il permet de :

- Générer automatiquement des factures à partir des échéances de contrat
- Suivre les paiements et les relances
- Configurer la facturation automatique
- Gérer les statistiques de facturation

## Architecture

### Modèles principaux

#### 1. Facture

```python
class Facture(models.Model):
    # Relations
    contrat = models.ForeignKey(Contrat, ...)
    echeance = models.ForeignKey(EcheancierContrat, ...)
    client = models.ForeignKey(ClientProfile, ...)

    # Informations de base
    numero = models.CharField(...)  # Généré automatiquement
    date_emission = models.DateField(auto_now_add=True)
    date_echeance = models.DateField()
    date_paiement = models.DateField(null=True, blank=True)

    # Statut et montants
    statut = models.CharField(choices=STATUT_CHOICES, default='brouillon')
    montant_ht = models.DecimalField(...)
    montant_tva = models.DecimalField(...)
    montant_ttc = models.DecimalField(...)
    montant_paye = models.DecimalField(default=0)
    montant_restant = models.DecimalField(default=0)

    # Configuration héritée du contrat
    taux_tva = models.DecimalField(...)
    appliquer_tva = models.BooleanField(...)
    taux_frais_agence = models.DecimalField(...)
    appliquer_frais_agence = models.BooleanField(...)
```

#### 2. PaiementFacture

```python
class PaiementFacture(models.Model):
    facture = models.ForeignKey(Facture, ...)
    montant = models.DecimalField(...)
    date_paiement = models.DateField()
    mode_paiement = models.CharField(choices=MODE_PAIEMENT_CHOICES)
    reference_paiement = models.CharField(max_length=100, blank=True)
```

#### 3. LigneFacture

```python
class LigneFacture(models.Model):
    facture = models.ForeignKey(Facture, ...)
    type_ligne = models.CharField(choices=TYPE_CHOICES)
    description = models.TextField()
    quantite = models.DecimalField(...)
    prix_unitaire_ht = models.DecimalField(...)
    montant_ht = models.DecimalField(...)
```

#### 4. ConfigurationFacturation

```python
class ConfigurationFacturation(models.Model):
    facturation_automatique = models.BooleanField(default=True)
    delai_avant_echeance = models.PositiveIntegerField(default=7)
    relance_automatique = models.BooleanField(default=True)
    prefixe_facture = models.CharField(default="FAC")
    conditions_paiement_defaut = models.TextField(...)
    iban_defaut = models.CharField(...)
    bic_defaut = models.CharField(...)
    compte_bancaire_defaut = models.CharField(...)
```

### API Endpoints

#### Factures

- `GET /api/v1/billings/factures/` - Liste des factures
- `POST /api/v1/billings/factures/` - Créer une facture
- `GET /api/v1/billings/factures/{id}/` - Détails d'une facture
- `PUT /api/v1/billings/factures/{id}/` - Modifier une facture
- `DELETE /api/v1/billings/factures/{id}/` - Supprimer une facture
- `POST /api/v1/billings/factures/{id}/enregistrer_paiement/` - Enregistrer un paiement
- `POST /api/v1/billings/factures/{id}/generer_pdf/` - Générer le PDF
- `GET /api/v1/billings/factures/statistiques/` - Statistiques
- `GET /api/v1/billings/factures/factures_en_retard/` - Factures en retard
- `GET /api/v1/billings/factures/factures_a_venir/` - Factures à venir

#### Paiements

- `GET /api/v1/billings/paiements/` - Liste des paiements
- `POST /api/v1/billings/paiements/` - Créer un paiement

#### Échéances

- `GET /api/v1/billings/echeances/` - Liste des échéances avec facturation
- `POST /api/v1/billings/echeances/{id}/generer_facture/` - Générer facture pour échéance

#### Contrats

- `GET /api/v1/billings/contrats/` - Liste des contrats avec facturation
- `POST /api/v1/billings/contrats/{id}/generer_factures_echeances/` - Générer toutes les factures
- `GET /api/v1/billings/contrats/{id}/resume_facturation/` - Résumé facturation

#### Configuration

- `GET /api/v1/billings/configuration/` - Configuration actuelle
- `PUT /api/v1/billings/configuration/{id}/` - Modifier la configuration

## Services

### FacturationService

Le service principal gère toute la logique métier de facturation :

```python
class FacturationService:
    @staticmethod
    def generer_factures_automatiques():
        """Génère automatiquement les factures pour les échéances à venir"""

    @staticmethod
    def generer_factures_contrat(contrat_id):
        """Génère toutes les factures pour un contrat spécifique"""

    @staticmethod
    def envoyer_relances_automatiques():
        """Envoie les relances automatiques pour les factures en retard"""

    @staticmethod
    def get_statistiques_facturation():
        """Retourne les statistiques de facturation"""

    @staticmethod
    def enregistrer_paiement_facture(facture_id, montant, ...):
        """Enregistre un paiement pour une facture"""
```

## Commandes de Management

### générer_factures_automatiques

```bash
# Générer toutes les factures automatiques
python manage.py generer_factures_automatiques

# Générer les factures pour un contrat spécifique
python manage.py generer_factures_automatiques --contrat-id 123

# Avec relances automatiques
python manage.py generer_factures_automatiques --relances

# Avec statistiques
python manage.py generer_factures_automatiques --statistiques
```

## Workflow de Facturation

### 1. Configuration initiale

1. Créer une configuration de facturation via l'admin ou l'API
2. Configurer les paramètres automatiques (délai, relances, etc.)
3. Définir les informations bancaires par défaut

### 2. Génération automatique

1. Le système vérifie les échéances à venir (selon le délai configuré)
2. Pour chaque échéance sans facture, une facture est créée automatiquement
3. Les montants sont calculés selon les pourcentages de l'échéance
4. Une ligne de facture est créée pour chaque échéance

### 3. Suivi des paiements

1. Les paiements peuvent être enregistrés via l'API ou l'admin
2. Le système met à jour automatiquement le statut de la facture
3. L'échéance correspondante est marquée comme payée
4. Les statistiques sont recalculées automatiquement

### 4. Relances automatiques

1. Le système identifie les factures en retard
2. Des relances automatiques peuvent être envoyées
3. Le statut des factures est mis à jour

## Intégration avec les Contrats

Le système de facturation est étroitement intégré avec le module des contrats :

- Les factures héritent des configurations TVA et frais d'agence du contrat
- Les échéances de contrat sont liées aux factures
- Les paiements mettent à jour automatiquement les échéances
- Les statistiques incluent les informations des contrats

## Fonctionnalités avancées

### Calculs automatiques

- **Montant restant** : Calculé automatiquement (montant_ttc - montant_paye)
- **Pourcentage payé** : Calculé automatiquement
- **Jours restants** : Calculé par rapport à la date d'échéance
- **Statut automatique** : Mis à jour selon les paiements et dates

### Validation

- Vérification que le montant de paiement ne dépasse pas le montant restant
- Validation des dates d'échéance
- Contrôle des doublons de factures pour une échéance

### Statistiques

- Total des factures émises, payées, en retard
- Montants totaux facturés et payés
- Factures du mois en cours
- Échéances à venir

## Utilisation

### Via l'API

```python
# Créer une facture
POST /api/v1/billings/factures/
{
    "contrat": 1,
    "echeance": 1,
    "date_echeance": "2024-01-15",
    "montant_ht": 1000000,
    "montant_tva": 180000,
    "montant_ttc": 1180000
}

# Enregistrer un paiement
POST /api/v1/billings/factures/1/enregistrer_paiement/
{
    "montant": 1180000,
    "date_paiement": "2024-01-10",
    "mode_paiement": "virement",
    "reference_paiement": "VIR001"
}
```

### Via l'Admin Django

- Interface complète pour gérer les factures
- Actions en lot (marquer comme payée, envoyée)
- Filtres et recherche avancés
- Statistiques en temps réel

### Via les commandes

```bash
# Génération automatique quotidienne
python manage.py generer_factures_automatiques --relances --statistiques
```

## Configuration

### Paramètres de facturation automatique

- `facturation_automatique` : Activer/désactiver la génération automatique
- `delai_avant_echeance` : Nombre de jours avant échéance pour générer la facture
- `relance_automatique` : Activer/désactiver les relances automatiques

### Paramètres de numérotation

- `prefixe_facture` : Préfixe pour les numéros de facture (ex: "FAC")
- `format_numero` : Format du numéro de facture

### Paramètres bancaires

- `iban_defaut` : IBAN par défaut
- `bic_defaut` : BIC par défaut
- `compte_bancaire_defaut` : Compte bancaire par défaut

## Sécurité et Validation

- Validation des montants et dates
- Contrôle des permissions d'accès
- Protection contre les doublons
- Traçabilité des paiements
- Historique des modifications

## Extensions futures

- Génération de PDF automatique
- Envoi d'emails automatiques
- Intégration avec des systèmes bancaires
- Rapports détaillés
- Facturation récurrente
- Gestion des acomptes et soldes
