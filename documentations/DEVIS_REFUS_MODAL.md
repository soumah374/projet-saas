# Modal de Refus - DevisDetailPage

## Vue d'ensemble

Un modal de confirmation a été ajouté pour l'action de refus de devis dans `DevisDetailPage.tsx`, complétant ainsi le workflow complet de gestion des devis.

## Fonctionnalité ajoutée

### **Modal de confirmation de refus**

- **Déclenchement** : Clic sur le bouton "Refuser" (statut envoyé)
- **Contenu** :
  - Informations complètes du devis (numéro, client, dates, statut, montants)
  - Message d'avertissement sur l'irréversibilité de l'action
  - Boutons "Annuler" et "Refuser"
- **États** : Gestion des états de chargement avec spinner

## Modifications techniques

### 1. **Interface mise à jour**

```typescript
interface DevisDetailModalsProps {
  // Modal d'envoi
  envoyerDialogOpen: boolean;
  setEnvoyerDialogOpen: (open: boolean) => void;
  onEnvoyer: () => void;
  isEnvoyerPending: boolean;

  // Modal d'acceptation
  accepterDialogOpen: boolean;
  setAccepterDialogOpen: (open: boolean) => void;
  onAccepter: () => void;
  isAccepterPending: boolean;

  // Modal de refus (NOUVEAU)
  refuserDialogOpen: boolean;
  setRefuserDialogOpen: (open: boolean) => void;
  onRefuser: () => void;
  isRefuserPending: boolean;

  // Données du devis
  devis: Devis | null;
}
```

### 2. **État ajouté dans DevisDetailPage.tsx**

```typescript
const [refuserDialogOpen, setRefuserDialogOpen] = useState(false);
```

### 3. **Fonctions modifiées**

```typescript
// Avant : Action directe
const handleRefuser = async () => {
  try {
    await refuserDevisMutation.mutateAsync(devisId);
  } catch (err) {
    // Error handled by hook
  }
};

// Après : Ouverture du modal
const handleRefuser = async () => {
  setRefuserDialogOpen(true);
};

// Nouvelle fonction de confirmation
const handleConfirmRefuser = async () => {
  try {
    await refuserDevisMutation.mutateAsync(devisId);
    setRefuserDialogOpen(false);
  } catch (err) {
    // Error handled by hook
  }
};
```

### 4. **Modal ajouté dans DevisDetailModals.tsx**

```tsx
{
  /* Dialog de confirmation de refus de devis */
}
<Dialog open={refuserDialogOpen} onOpenChange={setRefuserDialogOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Refus du devis</DialogTitle>
    </DialogHeader>
    <div className="space-y-4">
      <p className="text-gray-600">
        Êtes-vous sûr de vouloir refuser ce devis ?
      </p>
      {devis && <DevisInfoCard devis={devis} />}
      <p className="text-sm text-red-600">
        Une fois refusé, le devis ne pourra plus être modifié et sera marqué
        comme refusé.
      </p>
    </div>
    <DialogFooter>
      <Button
        variant="outline"
        onClick={() => setRefuserDialogOpen(false)}
        disabled={isRefuserPending}
      >
        Annuler
      </Button>
      <Button
        variant="destructive"
        onClick={onRefuser}
        disabled={isRefuserPending}
      >
        {isRefuserPending ? (
          <>
            <Loader2 className="animate-spin mr-2" size={16} />
            Refus...
          </>
        ) : (
          "Refuser"
        )}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>;
```

### 5. **Utilisation mise à jour**

```tsx
<DevisDetailModals
  // Modal d'envoi
  envoyerDialogOpen={envoyerDialogOpen}
  setEnvoyerDialogOpen={setEnvoyerDialogOpen}
  onEnvoyer={handleConfirmEnvoyer}
  isEnvoyerPending={envoyerDevisMutation.isPending}
  // Modal d'acceptation
  accepterDialogOpen={accepterDialogOpen}
  setAccepterDialogOpen={setAccepterDialogOpen}
  onAccepter={handleConfirmAccepter}
  isAccepterPending={accepterDevisMutation.isPending}
  // Modal de refus (NOUVEAU)
  refuserDialogOpen={refuserDialogOpen}
  setRefuserDialogOpen={setRefuserDialogOpen}
  onRefuser={handleConfirmRefuser}
  isRefuserPending={refuserDevisMutation.isPending}
  // Données du devis
  devis={devis}
/>
```

## Workflow complet des devis

### **États et actions disponibles**

| Statut        | Actions disponibles                  | Modals de confirmation   |
| ------------- | ------------------------------------ | ------------------------ |
| **Brouillon** | Modifier, Ajouter ligne, **Envoyer** | ✅ Envoi                 |
| **Envoyé**    | **Accepter**, **Refuser**            | ✅ Acceptation, ✅ Refus |
| **Accepté**   | Aucune action                        | -                        |
| **Refusé**    | Aucune action                        | -                        |
| **Expiré**    | Aucune action                        | -                        |

### **Workflow utilisateur**

#### **Refus de devis**

1. Clic sur "Refuser" → Modal s'ouvre
2. Vérification des informations → Confirmation ou annulation
3. Clic sur "Refuser" → Action exécutée avec spinner
4. Modal se ferme automatiquement après succès
5. Statut du devis passe à "refusé"

## Avantages obtenus

### 1. **Sécurité des opérations**

- **Confirmation obligatoire** : Évite les refus accidentels
- **Informations contextuelles** : L'utilisateur voit les détails avant de confirmer
- **Avertissement clair** : Message explicite sur les conséquences

### 2. **Cohérence de l'interface**

- **Pattern uniforme** : Même structure que les autres modals
- **Design cohérent** : Même style et organisation
- **Messages appropriés** : Couleur rouge pour l'action destructive

### 3. **Expérience utilisateur**

- **Feedback visuel** : États de chargement avec spinners
- **Navigation intuitive** : Boutons "Annuler" pour revenir en arrière
- **Bouton destructive** : Variant "destructive" pour l'action de refus

## Caractéristiques du modal de refus

### **Design spécifique**

- **Titre** : "Refus du devis"
- **Message principal** : "Êtes-vous sûr de vouloir refuser ce devis ?"
- **Avertissement** : "Une fois refusé, le devis ne pourra plus être modifié et sera marqué comme refusé."
- **Couleur** : Rouge pour indiquer l'action destructive

### **Boutons d'action**

- **"Annuler"** : Variant "outline", ferme le modal sans action
- **"Refuser"** : Variant "destructive", exécute l'action avec spinner

### **États de chargement**

- **Spinner** : Icône de chargement pendant l'exécution
- **Texte** : "Refus..." pendant le traitement
- **Désactivation** : Boutons désactivés pendant le chargement

## Tests recommandés

### **Tests fonctionnels**

1. **Refus de devis** : Vérifier l'ouverture du modal et l'exécution de l'action
2. **Annulation** : Vérifier la fermeture sans action
3. **États de chargement** : Vérifier les spinners pendant les mutations
4. **Gestion d'erreurs** : Vérifier le comportement en cas d'erreur

### **Tests d'interface**

1. **Responsive** : Vérifier l'affichage sur mobile
2. **Accessibilité** : Vérifier la navigation clavier
3. **Cohérence** : Vérifier l'uniformité avec les autres modals

## Extensions futures

### **Améliorations possibles**

- **Motif de refus** : Champ texte pour saisir la raison du refus
- **Notification** : Envoi d'email automatique au client
- **Historique** : Traçabilité des actions de refus
- **Validation** : Vérifications supplémentaires avant refus

### **Intégrations**

- **Workflow** : Intégration avec un système de workflow
- **Notifications** : Intégration avec un système de notifications
- **Audit** : Intégration avec un système d'audit

## Conclusion

L'ajout du modal de refus complète le workflow de gestion des devis en offrant une confirmation sécurisée pour cette action critique. Cette implémentation maintient la cohérence avec les autres modals tout en utilisant un design approprié pour une action destructive.
