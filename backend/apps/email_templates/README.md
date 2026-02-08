# Templates Email

Ce module permet aux administrateurs de personnaliser le contenu des emails envoyés aux clients.

## Fonctionnalités

- **Templates personnalisables** : Créez et modifiez les templates pour différents types d'emails
- **Variables dynamiques** : Utilisez des variables comme `{{client_nom}}`, `{{numero}}`, etc.
- **Templates par défaut** : Un template par défaut pour chaque type d'email
- **Prévisualisation** : Prévisualisez vos templates avec des données de test
- **Intégration automatique** : Les templates sont automatiquement utilisés lors de l'envoi d'emails

## Types d'emails supportés

- **Devis** : Envoi de devis aux clients
- **Contrat** : Envoi de contrats
- **Avenant** : Envoi d'avenants aux contrats
- **Facture** : Envoi de factures
- **Relance** : Relances de paiement automatiques
- **Rappel** : Rappels généraux

## Variables disponibles

### Devis
- `{{numero}}` : Numéro du devis
- `{{client_nom}}` : Nom du client
- `{{client_prenom}}` : Prénom du client
- `{{client_raison_sociale}}` : Raison sociale
- `{{montant_ht}}` : Montant HT
- `{{montant_ttc}}` : Montant TTC
- `{{date_creation}}` : Date de création
- `{{date_validite}}` : Date de validité

### Contrat
- `{{numero}}` : Numéro du contrat
- `{{client_nom}}` : Nom du client
- `{{client_prenom}}` : Prénom du client
- `{{client_raison_sociale}}` : Raison sociale
- `{{montant_total}}` : Montant total
- `{{date_debut}}` : Date de début
- `{{date_fin}}` : Date de fin

### Facture
- `{{numero}}` : Numéro de facture
- `{{client_nom}}` : Nom du client
- `{{client_prenom}}` : Prénom du client
- `{{montant_ht}}` : Montant HT
- `{{montant_ttc}}` : Montant TTC
- `{{date_facture}}` : Date de facture
- `{{date_echeance}}` : Date d'échéance

### Relance
- `{{numero_facture}}` : Numéro de facture
- `{{client_nom}}` : Nom du client
- `{{montant_du}}` : Montant dû
- `{{jours_retard}}` : Jours de retard
- `{{date_echeance}}` : Date d'échéance

## Installation

1. L'app est déjà ajoutée dans `INSTALLED_APPS`
2. Exécuter les migrations : `python manage.py migrate`
3. Charger les données par défaut : `python manage.py setup_email_templates`

## Utilisation

### Interface d'administration
Accédez à l'interface via le menu **Administration > Templates Email** dans l'interface web.

### API
- `GET /api/v1/email-templates/templates/` : Liste des templates
- `POST /api/v1/email-templates/templates/` : Créer un template
- `PUT /api/v1/email-templates/templates/{id}/` : Modifier un template
- `DELETE /api/v1/email-templates/templates/{id}/` : Supprimer un template
- `POST /api/v1/email-templates/templates/{id}/preview/` : Prévisualiser un template

### Service d'envoi
```python
from email_templates.services import EmailTemplateService

# Préparer le contexte
context = EmailTemplateService.prepare_devis_context(devis)

# Envoyer l'email
result = EmailTemplateService.send_templated_email(
    'devis',
    context,
    'client@example.com',
    {
        'name': 'devis.pdf',
        'content': pdf_content,
        'mime_type': 'application/pdf'
    }
)
```

## Intégration existante

Les templates sont automatiquement utilisés dans :
- Envoi de devis (`DevisViewSet.envoyer_email_pdf`)
- Envoi de contrats (`ContratViewSet.envoyer`)
- Envoi d'avenants (`AvenantViewSet.envoyer`)
- Relances automatiques (`FacturationService.envoyer_relances_automatiques`)
