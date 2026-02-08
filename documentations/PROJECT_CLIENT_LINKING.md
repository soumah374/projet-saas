# Liaison Projets-Clients

## Vue d'ensemble

Ce document décrit les modifications apportées pour lier les projets aux clients dans le système project_saas.

## Changements Backend

### 1. Modèle Project (backend/projects/models.py)

**Avant:**

```python
client = models.CharField(max_length=200)
```

**Après:**

```python
from users.models import ClientProfile

client = models.ForeignKey(
    ClientProfile,
    on_delete=models.CASCADE,
    related_name='projects',
    null=True,
    blank=True
)
```

### 2. Sérialiseurs (backend/projects/serializers.py)

Ajout d'un nouveau sérialiseur pour les détails du client:

```python
class ClientProfileSerializer(serializers.ModelSerializer):
    """Sérialiseur pour les détails du client"""

    class Meta:
        model = ClientProfile
        fields = [
            'id', 'nom', 'prenom', 'email', 'telephone', 'type_client',
            'statut_commercial', 'raison_sociale', 'rccm_nif', 'contact',
            'adresse_complete', 'adresse', 'ville', 'code_postal', 'pays',
            'nom_complet', 'is_active', 'date_inscription'
        ]
        read_only_fields = ['id', 'nom_complet', 'date_inscription']
```

Mise à jour des sérialiseurs de projet pour inclure les détails du client:

- `ProjectListSerializer`: Ajout de `client_details`
- `ProjectDetailSerializer`: Ajout de `client_details`
- `ProjectSerializer`: Ajout de `client_details`

### 3. Vues (backend/projects/views.py)

Mise à jour des filtres et de la recherche:

```python
filterset_fields = ['status', 'type', 'priority', 'client']
search_fields = ['title', 'description', 'client__nom_complet', 'id']
```

## Changements Frontend

### 1. Types TypeScript (frontend/src/lib/types.ts)

Mise à jour des interfaces pour refléter la nouvelle structure:

**Avant:**

```typescript
client: string;
```

**Après:**

```typescript
client: number | null;
client_details?: ClientProfile;
```

### 2. Hook use-projects (frontend/src/hooks/use-projects.ts)

Mise à jour du filtrage pour gérer les IDs de client:

```typescript
if (filters?.client) params.append("client", filters.client.toString());
```

### 3. Composants

#### CreateProjectModal (frontend/src/components/CreateProjectModal.tsx)

- Nouveau composant pour créer des projets avec sélection de client
- Intégration avec le hook `useClients` pour récupérer la liste des clients
- Validation pour s'assurer qu'un client est sélectionné

#### ClientDetailsCard (frontend/src/components/ClientDetailsCard.tsx)

- Nouveau composant pour afficher les détails d'un client
- Affichage des informations de contact, statut, type de client
- Gestion des personnes physiques et morales

### 4. Pages

#### ProjectsPage (frontend/src/pages/ProjectsPage.tsx)

- Mise à jour pour afficher le nom du client au lieu de l'ID
- Filtrage par nom de client
- Correction des types de projet et statuts

#### ProjectDetailsPage (frontend/src/pages/ProjectDetailsPage.tsx)

- Ajout de l'affichage des détails du client
- Intégration du composant `ClientDetailsCard`

## Migration des Données

### 1. Migration Django (backend/projects/migrations/0002_link_projects_to_clients.py)

```python
migrations.AddField(
    model_name='project',
    name='client',
    field=models.ForeignKey(
        blank=True,
        null=True,
        on_delete=django.db.models.deletion.CASCADE,
        related_name='projects',
        to='users.clientprofile'
    ),
),
```

### 2. Commande de Migration (backend/projects/management/commands/migrate_project_clients.py)

Script pour migrer les projets existants vers la nouvelle relation client.

## Avantages de cette Liaison

1. **Intégrité des données**: Plus de risque d'erreurs de saisie de noms de clients
2. **Relations bidirectionnelles**: Possibilité de voir tous les projets d'un client
3. **Données enrichies**: Accès aux informations complètes du client (contact, adresse, etc.)
4. **Filtrage avancé**: Possibilité de filtrer par client, statut commercial, etc.
5. **Interface utilisateur améliorée**: Sélection de client dans un dropdown au lieu de saisie libre

## Utilisation

### Créer un nouveau projet

1. Ouvrir le modal de création de projet
2. Sélectionner un client dans la liste déroulante
3. Remplir les autres informations du projet
4. Le projet sera automatiquement lié au client sélectionné

### Voir les détails d'un projet

1. Naviguer vers la page de détail du projet
2. Les informations du client s'affichent automatiquement
3. Possibilité de voir tous les projets du même client

### Filtrer les projets

1. Utiliser les filtres par client
2. Rechercher par nom de client
3. Voir les projets d'un client spécifique

## Prochaines Étapes

1. Exécuter les migrations Django
2. Migrer les données existantes
3. Tester la création de nouveaux projets
4. Vérifier l'affichage des détails client
5. Tester les filtres et la recherche
