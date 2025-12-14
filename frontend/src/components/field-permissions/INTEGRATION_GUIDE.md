# Guide d'Intégration - Permissions par Champ

## 🎯 Composants créés

### Hooks
- ✅ `/src/hooks/use-field-permissions.ts` - Tous les hooks React Query

### Composants
- ✅ `/src/components/field-permissions/ProtectedField.tsx` - Composants de protection
- ✅ `/src/components/field-permissions/FieldPermissionsManager.tsx` - Gestion des permissions
- ✅ `/src/components/field-permissions/UserFieldPermissionsAssigner.tsx` - Assignation utilisateur
- ✅ `/src/pages/FieldPermissionsAdminPage.tsx` - Page d'administration complète

## 📝 Étapes d'intégration

### 1. Vérifier les composants UI nécessaires

Assurez-vous d'avoir ces composants shadcn/ui :

```bash
npx shadcn-ui@latest add checkbox
npx shadcn-ui@latest add scroll-area
npx shadcn-ui@latest add separator
npx shadcn-ui@latest add tabs
```

Si vous n'utilisez pas shadcn/ui, créez des versions simples de ces composants.

### 2. Ajouter la route dans votre routeur

**React Router v6 :**

```tsx
// Dans votre fichier de routes (ex: App.tsx ou routes.tsx)
import FieldPermissionsAdminPage from '@/pages/FieldPermissionsAdminPage';

// Ajouter la route
<Route path="/admin/field-permissions" element={<FieldPermissionsAdminPage />} />
```

**NextJS (App Router) :**

```tsx
// app/admin/field-permissions/page.tsx
import FieldPermissionsAdminPage from '@/pages/FieldPermissionsAdminPage';

export default function Page() {
  return <FieldPermissionsAdminPage />;
}
```

### 3. Ajouter un lien dans votre menu admin

```tsx
import { Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

<Link
  to="/admin/field-permissions"
  className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded"
>
  <Shield size={20} />
  Permissions par Champ
</Link>
```

### 4. Composants UI manquants (si besoin)

Si vous n'avez pas `ScrollArea` ou `Separator`, voici des versions simples :

**ScrollArea.tsx :**
```tsx
import React from 'react';

export const ScrollArea: React.FC<{
  className?: string;
  children: React.ReactNode;
}> = ({ className, children }) => {
  return (
    <div className={`overflow-auto ${className}`}>
      {children}
    </div>
  );
};
```

**Separator.tsx :**
```tsx
import React from 'react';

export const Separator: React.FC<{ className?: string }> = ({ className }) => {
  return <hr className={`border-gray-200 ${className}`} />;
};
```

### 5. Protéger la route (optionnel)

```tsx
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { usePermissions } from '@/hooks/use-permissions';

function AdminRoutes() {
  const { hasPermission } = usePermissions();

  return (
    <Route
      path="/admin/field-permissions"
      element={
        hasPermission('users.can_manage_field_permissions') ? (
          <FieldPermissionsAdminPage />
        ) : (
          <Navigate to="/403" />
        )
      }
    />
  );
}
```

## 🚀 Utilisation dans vos formulaires

### Exemple 1 : Formulaire de Contrat

```tsx
import { ProtectedField } from '@/components/field-permissions/ProtectedField';

function ContratForm({ contrat }) {
  return (
    <form>
      {/* Champs toujours visibles */}
      <div>
        <label>Numéro</label>
        <Input value={contrat.numero} readOnly />
      </div>

      {/* Champs protégés */}
      <ProtectedField
        modelName="contrat"
        appLabel="contrats"
        fieldName="montant_ttc"
        objectId={contrat.id}
        mode="disable"
      >
        <div>
          <label>Montant TTC</label>
          <Input name="montant_ttc" type="number" />
        </div>
      </ProtectedField>

      <ProtectedField
        modelName="contrat"
        appLabel="contrats"
        fieldName="conditions"
        objectId={contrat.id}
        mode="show-locked"
      >
        <div>
          <label>Conditions</label>
          <textarea name="conditions" rows={4} />
        </div>
      </ProtectedField>
    </form>
  );
}
```

### Exemple 2 : Section financière protégée

```tsx
import { ProtectedSection } from '@/components/field-permissions/ProtectedField';

function ContratFinancial({ contrat }) {
  return (
    <ProtectedSection
      modelName="contrat"
      appLabel="contrats"
      fields={['montant_ht', 'montant_tva', 'montant_ttc', 'taux_tva']}
      objectId={contrat.id}
      requireAllFields={false} // Au moins un champ visible
      fallback={
        <div className="text-gray-500">
          Vous n'avez pas accès aux informations financières
        </div>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>Détails Financiers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div>Montant HT: {contrat.montant_ht} €</div>
            <div>TVA ({contrat.taux_tva}%): {contrat.montant_tva} €</div>
            <div className="font-bold">
              Montant TTC: {contrat.montant_ttc} €
            </div>
          </div>
        </CardContent>
      </Card>
    </ProtectedSection>
  );
}
```

### Exemple 3 : Vérification manuelle

```tsx
import { useFieldAccess } from '@/hooks/use-field-permissions';

function ContratActions({ contrat }) {
  const { canRead, canWrite } = useFieldAccess(
    'contrat',
    'contrats',
    'montant_ttc',
    contrat.id
  );

  return (
    <div className="flex gap-2">
      {canRead && (
        <Button variant="outline">
          <Eye size={16} className="mr-2" />
          Voir les détails
        </Button>
      )}

      {canWrite && (
        <Button>
          <Edit size={16} className="mr-2" />
          Modifier
        </Button>
      )}

      {!canRead && (
        <div className="text-gray-500 text-sm">
          Vous n'avez pas accès à ce champ
        </div>
      )}
    </div>
  );
}
```

## 🎓 Scénarios d'utilisation

### Scénario 1 : Comptables uniquement

**Objectif :** Seuls les comptables peuvent voir les montants

**Solution :**
1. Créer un groupe "Comptables"
2. Dans l'interface admin, aller dans "Assigner des Permissions"
3. Sélectionner le groupe "Comptables"
4. Choisir le modèle "Contrat"
5. Cocher "Lecture" pour : `montant_ht`, `montant_tva`, `montant_ttc`
6. Assigner

**Résultat :** Les non-comptables ne verront pas ces champs dans les formulaires

### Scénario 2 : Lecture seule après signature

**Objectif :** Empêcher la modification des dates après signature du contrat

**Solution Backend :**
```python
from users.models import FieldPermission
from django.contrib.contenttypes.models import ContentType

# Signal après signature
@receiver(post_save, sender=Contrat)
def lock_dates_on_signature(sender, instance, **kwargs):
    if instance.statut == 'signe':
        ct = ContentType.objects.get_for_model(Contrat)
        # Supprimer les permissions write sur les dates
        FieldPermission.objects.filter(
            content_type=ct,
            field_name__in=['date_debut', 'date_fin'],
            object_id=instance.id,
            permission='write'
        ).delete()
```

**Résultat :** Les champs date deviennent en lecture seule après signature

### Scénario 3 : Permissions temporaires

**Objectif :** Donner accès temporaire à un utilisateur pour éditer

**Solution :**
1. Dans l'interface, assigner la permission write au champ
2. Spécifier l'ID de l'objet
3. Programmer une tâche pour supprimer après X heures

```python
from celery import shared_task

@shared_task
def revoke_temporary_permission(permission_id):
    FieldPermission.objects.filter(id=permission_id).delete()
```

## 🔧 Dépannage

### Les permissions ne s'appliquent pas

1. **Vérifier que l'utilisateur n'est pas superuser**
   - Les superusers ont toujours tous les accès

2. **Vérifier les query keys React Query**
   ```tsx
   // Forcer le rechargement
   queryClient.invalidateQueries({ queryKey: ['model-field-permissions'] });
   ```

3. **Vérifier le cache**
   - Ouvrir les DevTools React Query
   - Vérifier les données dans le cache

### Les champs ne se cachent pas

1. **Vérifier le mode du ProtectedField**
   ```tsx
   mode="hide" // Cache complètement
   mode="disable" // Désactive seulement
   mode="show-locked" // Affiche avec cadenas
   ```

2. **Vérifier que requireWrite est correct**
   ```tsx
   requireWrite={false} // Pour vérifier read
   requireWrite={true}  // Pour vérifier write
   ```

### Erreurs API

1. **403 Forbidden**
   - L'utilisateur n'a pas la permission Django de créer des FieldPermission
   - Vérifier les permissions Django sur le modèle FieldPermission

2. **400 Bad Request**
   - Vérifier que user OU group est spécifié (pas les deux)
   - Vérifier que content_type existe

## 📚 Documentation complète

Pour plus d'exemples, voir :
- `/src/components/field-permissions/USAGE_EXAMPLES.md`
