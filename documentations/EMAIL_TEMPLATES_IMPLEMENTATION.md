# Implémentation des Templates d'Emails Personnalisables

## Vue d'ensemble

Ce document décrit l'implémentation complète du système de templates d'emails personnalisables permettant aux administrateurs de modifier le contenu des emails envoyés aux clients pour les devis, factures, contrats, avenants et relances.

## Architecture

### Backend (Django)

#### 1. Application `email_templates`

- **Modèles** :
  - `EmailTemplate` : Stocke les templates d'emails avec support des variables
  - `EmailTemplateVariable` : Définit les variables disponibles par type d'email

#### 2. Service `EmailTemplateService`

- Gestion de l'envoi d'emails avec templates
- Méthodes de préparation de contexte pour chaque type de document
- Rendu automatique des variables dans les templates

#### 3. API REST

- CRUD complet pour les templates
- Endpoints de prévisualisation
- Groupement par type d'email
- Gestion des templates par défaut

### Frontend (React/TypeScript)

#### 1. Interface d'administration

- Page de gestion des templates (`EmailTemplatesPage`)
- Formulaire de création/édition (`EmailTemplateFormModal`)
- Prévisualisation en temps réel (`EmailTemplatePreviewModal`)
- Intégration dans le menu Administration

#### 2. Types et services

- Types TypeScript pour la validation
- Service API pour les appels backend
- Gestion des erreurs et notifications

## Fonctionnalités Implémentées

### ✅ Templates par Type d'Email

- **Devis** : Variables client, montants, dates
- **Contrat** : Informations contractuelles, durées
- **Avenant** : Références au contrat principal
- **Facture** : Montants, échéances
- **Relance** : Retards, montants dus
- **Rappel** : Informations générales

### ✅ Gestion Administrative

- Création/édition/suppression de templates
- Définition de templates par défaut
- Activation/désactivation de templates
- Prévisualisation avec données de test

### ✅ Variables Dynamiques

- Système de variables `{{nom_variable}}`
- Variables spécifiques par type d'email
- Documentation intégrée des variables disponibles
- Insertion assistée dans l'éditeur

### ✅ Intégration Automatique

- Modification des vues existantes pour utiliser les templates
- Fallback vers templates par défaut
- Conservation de la compatibilité avec l'existant

## Structure des Fichiers

### Backend

```
backend/email_templates/
├── __init__.py
├── admin.py              # Interface d'administration Django
├── apps.py              # Configuration de l'app
├── models.py            # Modèles EmailTemplate et EmailTemplateVariable
├── serializers.py       # Sérializers DRF
├── views.py            # ViewSets API
├── urls.py             # Configuration des URLs
├── services.py         # Service d'envoi d'emails
├── tests.py            # Tests unitaires
├── README.md           # Documentation
├── fixtures/
│   ├── email_template_variables.json    # Variables par défaut
│   └── default_email_templates.json     # Templates par défaut
├── migrations/
│   ├── __init__.py
│   └── 0001_initial.py                  # Migration initiale
└── management/
    └── commands/
        └── setup_email_templates.py     # Commande d'installation
```

### Frontend

```
frontend/src/
├── types/email-template.ts              # Types TypeScript
├── services/emailTemplateService.ts     # Service API
├── pages/EmailTemplatesPage.tsx         # Page principale
└── components/email-templates/
    ├── EmailTemplateFormModal.tsx       # Formulaire de création/édition
    └── EmailTemplatePreviewModal.tsx    # Prévisualisation
```

## Variables Disponibles par Type

### Devis

- `{{numero}}`, `{{client_nom}}`, `{{client_prenom}}`
- `{{client_raison_sociale}}`, `{{montant_ht}}`, `{{montant_ttc}}`
- `{{date_creation}}`, `{{date_validite}}`

### Contrat

- `{{numero}}`, `{{client_nom}}`, `{{client_prenom}}`
- `{{client_raison_sociale}}`, `{{montant_total}}`
- `{{date_debut}}`, `{{date_fin}}`

### Avenant

- `{{numero}}`, `{{contrat_numero}}`
- `{{client_nom}}`, `{{client_prenom}}`, `{{client_raison_sociale}}`

### Facture

- `{{numero}}`, `{{client_nom}}`, `{{client_prenom}}`
- `{{montant_ht}}`, `{{montant_ttc}}`
- `{{date_facture}}`, `{{date_echeance}}`

### Relance

- `{{numero_facture}}`, `{{client_nom}}`
- `{{montant_du}}`, `{{jours_retard}}`, `{{date_echeance}}`

### Rappel

- `{{client_nom}}`, `{{objet}}`, `{{date_rappel}}`

## Installation et Configuration

### 1. Backend

```bash
# L'app est déjà ajoutée dans INSTALLED_APPS
cd backend
python manage.py migrate
python manage.py setup_email_templates
```

### 2. Frontend

```bash
# Les composants sont déjà intégrés dans l'interface
# Route ajoutée : /email-templates
# Menu : Administration > Templates Email
```

## Utilisation

### Interface Web

1. Se connecter en tant qu'administrateur
2. Naviguer vers **Administration > Templates Email**
3. Créer/modifier les templates selon les besoins
4. Utiliser la prévisualisation pour tester
5. Définir un template par défaut pour chaque type

### API

```bash
# Lister les templates
GET /api/v1/email-templates/templates/

# Créer un template
POST /api/v1/email-templates/templates/

# Prévisualiser
POST /api/v1/email-templates/templates/{id}/preview/
```

### Programmation

```python
from email_templates.services import EmailTemplateService

context = EmailTemplateService.prepare_devis_context(devis)
result = EmailTemplateService.send_templated_email(
    'devis', context, 'client@example.com', attachment_data
)
```

## Intégrations Réalisées

### ✅ Devis (`devis/views.py`)

- Méthode `envoyer_email_pdf` modifiée
- Utilisation automatique des templates
- Support des templates personnalisés

### ✅ Contrats (`contrats/views.py`)

- Méthode `envoyer` modifiée
- Templates pour contrats et avenants
- Génération PDF + envoi email

### ✅ Relances (`billings/services.py`)

- Service `envoyer_relances_automatiques` modifié
- Calcul automatique des jours de retard
- Envoi bulk avec templates

## Tests

### Backend

```bash
cd backend
python manage.py test email_templates
```

### Frontend

- Tests d'intégration via l'interface web
- Validation des formulaires
- Prévisualisation en temps réel

## Sécurité et Permissions

- **Accès restreint** : Seuls les administrateurs peuvent gérer les templates
- **Validation** : Contraintes sur les templates par défaut
- **Échappement** : Variables sécurisées dans le rendu
- **Permissions** : Intégration avec le système de rôles existant

## Évolutions Possibles

1. **Éditeur WYSIWYG** : Interface d'édition plus riche
2. **Templates HTML** : Support du HTML en plus du texte brut
3. **Traductions** : Templates multilingues
4. **Historique** : Versioning des templates
5. **Tests A/B** : Comparaison de performances des templates
6. **Statistiques** : Taux d'ouverture et de réponse
7. **Planification** : Envois programmés avec templates

## Maintenance

- **Sauvegarde** : Inclure les templates dans les sauvegardes DB
- **Mise à jour** : Versionning des fixtures par défaut
- **Monitoring** : Logs des envois d'emails
- **Performance** : Cache des templates fréquemment utilisés

## Support

Pour toute question ou problème :

1. Consulter les logs Django pour les erreurs backend
2. Vérifier la console navigateur pour les erreurs frontend
3. Tester les endpoints API directement
4. Utiliser les commandes de management pour réinitialiser les templates
