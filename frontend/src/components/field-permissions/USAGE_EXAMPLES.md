# Guide d'utilisation des Permissions par Champ

## Vue d'ensemble

Le système de permissions par champ permet de contrôler finement qui peut voir et modifier chaque champ de vos modèles Django. Les permissions peuvent être accordées au niveau:

- **Utilisateur** : Permission pour un utilisateur spécifique
- **Groupe** : Permission pour tous les utilisateurs d'un groupe
- **Modèle** : Permission pour tous les objets d'un modèle
- **Objet** : Permission pour un objet spécifique

## Exemples d'utilisation Frontend

### 1. Protéger un champ simple

```tsx
import { ProtectedField } from "@/components/field-permissions/ProtectedField";
import { Input } from "@/components/ui/input";

function ContratForm({ contratId }) {
  return (
    <form>
      {/* Champ visible uniquement si l'utilisateur a la permission de lecture */}
      <ProtectedField
        modelName="contrat"
        appLabel="contrats"
        fieldName="montant_ttc"
        mode="hide"
        fallback={<div className="text-gray-400 italic">Non autorisé</div>}
      >
        <div>
          <label>Montant TTC</label>
          <Input name="montant_ttc" />
        </div>
      </ProtectedField>

      {/* Champ visible uniquement si l'utilisateur a la permission de lecture */}
      <ProtectedField
        modelName="contrat"
        appLabel="contrats"
        fieldName="montant_ttc"
        objectId={contratId}
        mode="hide"
        fallback={<div className="text-gray-400 italic">Non autorisé</div>}
      >
        <div>
          <label>Montant TTC</label>
          <Input name="montant_ttc" />
        </div>
      </ProtectedField>

      {/* Champ toujours visible mais désactivé si pas de permission write */}
      <ProtectedField
        modelName="contrat"
        appLabel="contrats"
        fieldName="date_debut"
        objectId={contratId}
        mode="disable"
      >
        <div>
          <label>Date de début</label>
          <Input type="date" name="date_debut" />
        </div>
      </ProtectedField>

      {/* Champ avec indicateur de cadenas si lecture seule */}
      <ProtectedField
        modelName="contrat"
        appLabel="contrats"
        fieldName="conditions"
        objectId={contratId}
        mode="show-locked"
      >
        <div>
          <label>Conditions</label>
          <textarea name="conditions" />
        </div>
      </ProtectedField>
    </form>
  );
}
```

### 2. Protéger une section entière

```tsx
import { ProtectedSection } from "@/components/field-permissions/ProtectedField";

function ContratDetail({ contratId }) {
  return (
    <div>
      {/* Section visible si l'utilisateur peut lire au moins un champ financier */}
      <ProtectedSection
        modelName="contrat"
        appLabel="contrats"
        fields={["montant_ht", "montant_tva", "montant_ttc"]}
        objectId={contratId}
        requireAllFields={false}
      >
        <Card>
          <CardHeader>
            <CardTitle>Informations Financières</CardTitle>
          </CardHeader>
          <CardContent>
            <div>Montant HT: {contrat.montant_ht}</div>
            <div>Montant TVA: {contrat.montant_tva}</div>
            <div>Montant TTC: {contrat.montant_ttc}</div>
          </CardContent>
        </Card>
      </ProtectedSection>
    </div>
  );
}
```

### 3. Utiliser le hook pour vérifier manuellement

```tsx
import { useFieldAccess } from "@/hooks/use-field-permissions";

function CustomComponent({ contratId }) {
  const { canRead, canWrite, isLoading } = useFieldAccess(
    "contrat",
    "contrats",
    "montant_ttc",
    contratId
  );

  if (isLoading) return <div>Chargement...</div>;

  return (
    <div>
      {canRead && <div>Montant TTC: {contrat.montant_ttc}</div>}
      {canWrite && <Button>Modifier le montant</Button>}
    </div>
  );
}
```

### 4. Vérifier plusieurs champs à la fois

```tsx
import { useMultipleFieldAccess } from "@/hooks/use-field-permissions";

function MultiFieldComponent({ contratId }) {
  const { fieldsAccess, isLoading } = useMultipleFieldAccess(
    "contrat",
    "contrats",
    ["montant_ht", "montant_tva", "montant_ttc", "date_debut", "date_fin"],
    contratId
  );

  if (isLoading) return <div>Chargement...</div>;

  return (
    <div>
      {fieldsAccess.montant_ht.canRead && <div>HT: {contrat.montant_ht}</div>}
      {fieldsAccess.montant_tva.canRead && (
        <div>TVA: {contrat.montant_tva}</div>
      )}
      {fieldsAccess.montant_ttc.canRead && (
        <div>TTC: {contrat.montant_ttc}</div>
      )}

      {fieldsAccess.date_debut.canWrite && (
        <Input type="date" name="date_debut" />
      )}
    </div>
  );
}
```

### 5. Afficher un indicateur de permission

```tsx
import { FieldPermissionIndicator } from "@/components/field-permissions/ProtectedField";
import { useFieldAccess } from "@/hooks/use-field-permissions";

function FieldWithIndicator({ contratId }) {
  const { canRead, canWrite } = useFieldAccess(
    "contrat",
    "contrats",
    "montant_ttc",
    contratId
  );

  return (
    <div className="flex items-center gap-2">
      <label>Montant TTC</label>
      <FieldPermissionIndicator canRead={canRead} canWrite={canWrite} />
      <Input name="montant_ttc" disabled={!canWrite} />
    </div>
  );
}
```

## Exemples de création de permissions via l'API

### 1. Permission pour un utilisateur sur un champ spécifique

```typescript
const createPermission = useCreateFieldPermission();

// Donner la permission de lecture à l'utilisateur ID 5 sur le champ montant_ttc
createPermission.mutate({
  user: 5,
  content_type: 12, // ID du ContentType pour "contrats.Contrat"
  field_name: "montant_ttc",
  permission: "read",
});
```

### 2. Permission pour un groupe sur tous les objets d'un modèle

```typescript
// Donner la permission d'écriture au groupe ID 3 sur tous les contrats
createPermission.mutate({
  group: 3,
  content_type: 12,
  field_name: "conditions",
  permission: "write",
  // Pas d'object_id = s'applique à tous les objets
});
```

### 3. Permission sur un objet spécifique

```typescript
// Permission de lecture sur le contrat ID 42 uniquement
createPermission.mutate({
  user: 5,
  content_type: 12,
  field_name: "montant_ttc",
  object_id: 42,
  permission: "read",
});
```

## Exemples Backend (Django)

### 1. Vérifier une permission dans une vue

```python
from users.utils import has_field_permission
from contrats.models import Contrat

def my_view(request, contrat_id):
    contrat = Contrat.objects.get(id=contrat_id)

    # Vérifier si l'utilisateur peut lire montant_ttc
    can_read = has_field_permission(
        request.user,
        Contrat,
        'montant_ttc',
        'read',
        contrat
    )

    if can_read:
        return JsonResponse({'montant': contrat.montant_ttc})
    else:
        return JsonResponse({'error': 'Pas de permission'}, status=403)
```

### 2. Filtrer des données selon les permissions

```python
from users.utils import filter_fields_by_permission

def get_contrat_data(request, contrat_id):
    contrat = Contrat.objects.get(id=contrat_id)

    data = {
        'montant_ht': contrat.montant_ht,
        'montant_tva': contrat.montant_tva,
        'montant_ttc': contrat.montant_ttc,
        'conditions': contrat.conditions,
    }

    # Filtrer selon les permissions read
    filtered_data = filter_fields_by_permission(
        request.user,
        Contrat,
        data,
        contrat,
        'read'
    )

    return JsonResponse(filtered_data)
```

### 3. Récupérer toutes les permissions d'un utilisateur

```python
from users.utils import get_user_field_permissions

permissions = get_user_field_permissions(request.user, Contrat, contrat_instance)
# Retourne: {'montant_ttc': {'read': True, 'write': False}, ...}
```

## Cas d'usage pratiques

### Scénario 1: Cacher les montants financiers aux non-comptables

```python
# Backend: Créer un groupe "Comptables"
comptables_group = Group.objects.create(name='Comptables')

# Donner la permission de lecture des montants au groupe
for field in ['montant_ht', 'montant_tva', 'montant_ttc']:
    FieldPermission.objects.create(
        group=comptables_group,
        content_type=ContentType.objects.get_for_model(Contrat),
        field_name=field,
        permission='read'
    )
```

```tsx
// Frontend: Les champs sont automatiquement cachés pour les non-comptables
<ProtectedField modelName="contrat" appLabel="contrats" fieldName="montant_ttc">
  <Input name="montant_ttc" />
</ProtectedField>
```

### Scénario 2: Empêcher la modification des dates après signature

```python
# Retirer la permission write sur date_debut pour tous après signature
if contrat.statut == 'signe':
    FieldPermission.objects.filter(
        content_type=ContentType.objects.get_for_model(Contrat),
        field_name='date_debut',
        object_id=contrat.id,
        permission='write'
    ).delete()
```

### Scénario 3: Donner un accès temporaire à un utilisateur

```python
# Permission temporaire pour l'utilisateur pendant l'édition
perm = FieldPermission.objects.create(
    user=request.user,
    content_type=ContentType.objects.get_for_model(Contrat),
    field_name='conditions',
    object_id=contrat.id,
    permission='write'
)

# Retirer après 1 heure (utiliser Celery ou autre)
perm.delete()  # À faire dans une tâche planifiée
```

## Interface d'administration

Pour gérer les permissions via l'interface:

```tsx
import { FieldPermissionsManager } from "@/components/field-permissions/FieldPermissionsManager";

function AdminPage() {
  return (
    <div>
      <h1>Administration des Permissions</h1>
      <FieldPermissionsManager />
    </div>
  );
}
```

## Notes importantes

1. **Les superusers ont toujours tous les accès** : Les vérifications de permissions retournent toujours `true` pour les superusers

2. **Write implique Read** : Si un utilisateur a la permission `write`, il a automatiquement la permission `read`

3. **Permissions cumulatives** : Les permissions utilisateur et groupe se cumulent

4. **Permissions d'objet prioritaires** : Les permissions au niveau objet (avec `object_id`) sont prioritaires sur les permissions au niveau modèle

5. **Performance** : Les permissions sont mises en cache côté frontend via React Query
