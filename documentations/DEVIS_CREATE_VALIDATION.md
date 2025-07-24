# Validation des Champs Obligatoires - DevisCreatePage

## Vue d'ensemble

La validation des champs obligatoires dans `DevisCreatePage.tsx` a été améliorée pour fournir un feedback visuel immédiat aux utilisateurs, marquant les champs en rouge lorsqu'ils ne respectent pas les conditions lors de la soumission.

## Améliorations apportées

### **1. Validation visuelle**

- **Marquage en rouge** : Champs obligatoires non remplis affichés en rouge
- **Messages d'erreur** : Textes explicatifs sous chaque champ en erreur
- **Feedback immédiat** : Validation lors de la soumission et de l'ajout de lignes

### **2. Validation complète**

- **Formulaire principal** : Client, date de validité, lignes
- **Lignes de devis** : Type, service, activité, unité, intervenants
- **Lignes de frais** : Catégorie, ligne de frais, prix unitaire, unité
- **Intervenants** : Profil, temps, taux horaire

### **3. Gestion d'erreurs robuste**

- **Validation en temps réel** : Vérification lors de la soumission
- **Nettoyage automatique** : Effacement des erreurs lors de la correction
- **Messages contextuels** : Erreurs spécifiques à chaque type de champ

## Implémentation technique

### **1. États de validation**

```typescript
// États pour la validation
const [errors, setErrors] = useState<{
  client_id?: string;
  date_validite?: string;
  lignes?: string;
}>({});

const [ligneErrors, setLigneErrors] = useState<{
  type_ligne?: string;
  service_id?: string;
  activity_id?: string;
  frais_category_id?: string;
  ligne_frais_id?: string;
  unite_id?: string;
  prix_unitaire?: string;
  intervenants?: string;
}>({});
```

### **2. Fonctions de validation**

```typescript
const validateForm = () => {
  const newErrors: typeof errors = {};

  if (!form.client_id) {
    newErrors.client_id = "Le client est obligatoire";
  }

  if (!form.date_validite) {
    newErrors.date_validite = "La date de validité est obligatoire";
  }

  if (lignes.length === 0) {
    newErrors.lignes = "Au moins une ligne est obligatoire";
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

const validateCurrentLigne = () => {
  const newLigneErrors: typeof ligneErrors = {};

  if (!currentLigne.type_ligne) {
    newLigneErrors.type_ligne = "Le type de ligne est obligatoire";
  }

  if (currentLigne.type_ligne === "prestation") {
    if (!currentLigne.service_id) {
      newLigneErrors.service_id = "Le service est obligatoire";
    }
    if (!currentLigne.activity_id) {
      newLigneErrors.activity_id = "L'activité est obligatoire";
    }
    if (!currentLigne.unite_id) {
      newLigneErrors.unite_id = "L'unité est obligatoire";
    }
    if (currentLigne.intervenants.length === 0) {
      newLigneErrors.intervenants = "Au moins un intervenant est obligatoire";
    }
  }

  if (currentLigne.type_ligne === "frais") {
    if (!currentLigne.frais_category_id) {
      newLigneErrors.frais_category_id =
        "La catégorie de frais est obligatoire";
    }
    if (!currentLigne.ligne_frais_id) {
      newLigneErrors.ligne_frais_id = "La ligne de frais est obligatoire";
    }
    if (!currentLigne.unite_id) {
      newLigneErrors.unite_id = "L'unité est obligatoire";
    }
    if (!currentLigne.prix_unitaire) {
      newLigneErrors.prix_unitaire = "Le prix unitaire est obligatoire";
    }
  }

  setLigneErrors(newLigneErrors);
  return Object.keys(newLigneErrors).length === 0;
};

const clearErrors = () => {
  setErrors({});
  setLigneErrors({});
};
```

### **3. Intégration dans les fonctions**

```typescript
const handleSave = async () => {
  clearErrors();

  if (!validateForm()) {
    toast.error("Veuillez corriger les erreurs avant de continuer");
    return;
  }

  // ... reste de la logique de sauvegarde
};

const addLigne = () => {
  clearErrors();

  if (!validateCurrentLigne()) {
    toast.error("Veuillez corriger les erreurs avant d'ajouter la ligne");
    return;
  }

  // ... reste de la logique d'ajout de ligne
};
```

## Interface utilisateur

### **1. Champs du formulaire principal**

```tsx
<div>
  <Label
    className={`text-sm font-medium ${errors.client_id ? "text-red-600" : ""}`}
  >
    Client *
  </Label>
  <ClientAutocomplete
    value={form.client_id}
    onValueChange={(value) => setForm({ ...form, client_id: value })}
    placeholder="Rechercher un client..."
    className={errors.client_id ? "border-red-500 focus:border-red-500" : ""}
  />
  {errors.client_id && (
    <p className="text-sm text-red-600 mt-1">{errors.client_id}</p>
  )}
</div>
```

### **2. Champs de ligne de devis**

```tsx
<div className="md:col-span-1">
  <Label
    className={`text-sm font-medium ${
      ligneErrors.service_id ? "text-red-600" : ""
    }`}
  >
    Service *
  </Label>
  <Select
    value={currentLigne.service_id}
    onValueChange={(value) => handleLigneChange("service_id", value)}
  >
    <SelectTrigger
      className={
        ligneErrors.service_id ? "border-red-500 focus:border-red-500" : ""
      }
    >
      <SelectValue placeholder="Sélectionner un service" />
    </SelectTrigger>
    <SelectContent>
      {services.map((service) => (
        <SelectItem key={service.id} value={service.id.toString()}>
          {service.name}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
  {ligneErrors.service_id && (
    <p className="text-sm text-red-600 mt-1">{ligneErrors.service_id}</p>
  )}
</div>
```

### **3. Affichage des erreurs de lignes**

```tsx
{
  /* Affichage de l'erreur pour les lignes */
}
{
  errors.lignes && (
    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
      <p className="text-sm text-red-600">{errors.lignes}</p>
    </div>
  );
}
```

### **4. Validation des intervenants**

```tsx
<div className="flex items-center justify-between">
  <Label
    className={`text-sm font-medium ${
      ligneErrors.intervenants ? "text-red-600" : ""
    }`}
  >
    Intervenants *
  </Label>
  <Button size="sm" onClick={addIntervenant}>
    <Plus size={16} className="mr-2" />
    Ajouter intervenant
  </Button>
</div>;
{
  ligneErrors.intervenants && (
    <p className="text-sm text-red-600">{ligneErrors.intervenants}</p>
  );
}
```

## Règles de validation

### **1. Formulaire principal**

- **Client** : Doit être sélectionné
- **Date de validité** : Doit être renseignée
- **Lignes** : Au moins une ligne doit être ajoutée

### **2. Lignes de prestation**

- **Type de ligne** : Doit être sélectionné
- **Service** : Doit être sélectionné
- **Activité** : Doit être sélectionnée
- **Unité** : Doit être sélectionnée
- **Intervenants** : Au moins un intervenant doit être ajouté

### **3. Lignes de frais**

- **Type de ligne** : Doit être sélectionné
- **Catégorie de frais** : Doit être sélectionnée
- **Ligne de frais** : Doit être sélectionnée
- **Prix unitaire** : Doit être renseigné
- **Unité** : Doit être sélectionnée

### **4. Intervenants**

- **Profil** : Doit être sélectionné
- **Temps** : Doit être renseigné
- **Taux horaire** : Doit être renseigné

## Styles CSS

### **1. Champs en erreur**

```css
/* Label en rouge */
.text-red-600

/* Bordure rouge */
.border-red-500
.focus:border-red-500

/* Message d'erreur */
.text-sm text-red-600 mt-1
```

### **2. Zone d'erreur**

```css
/* Conteneur d'erreur */
.bg-red-50 border border-red-200 rounded-lg
.p-3

/* Message d'erreur */
.text-sm text-red-600;
```

## Fonctionnalités

### **1. Validation en temps réel**

- **Soumission** : Validation complète lors de la sauvegarde
- **Ajout de ligne** : Validation lors de l'ajout d'une ligne
- **Nettoyage** : Effacement automatique des erreurs

### **2. Feedback utilisateur**

- **Messages explicites** : Erreurs claires et spécifiques
- **Marquage visuel** : Champs en rouge pour attirer l'attention
- **Toast notifications** : Messages d'erreur généraux

### **3. Gestion d'erreurs**

- **Validation complète** : Tous les champs obligatoires vérifiés
- **Erreurs contextuelles** : Messages adaptés au type de champ
- **Prévention** : Blocage de la soumission si erreurs présentes

## Cas d'usage

### **1. Soumission sans client**

```typescript
// Résultat : Champ client marqué en rouge avec message
// "Le client est obligatoire"
```

### **2. Ajout de ligne sans service**

```typescript
// Résultat : Champ service marqué en rouge avec message
// "Le service est obligatoire"
```

### **3. Ligne de frais sans prix**

```typescript
// Résultat : Champ prix unitaire marqué en rouge avec message
// "Le prix unitaire est obligatoire"
```

### **4. Prestation sans intervenant**

```typescript
// Résultat : Section intervenants marquée en rouge avec message
// "Au moins un intervenant est obligatoire"
```

## Avantages

### **1. Expérience utilisateur**

- **Feedback immédiat** : Erreurs visibles dès la soumission
- **Guidage clair** : Messages explicites pour chaque erreur
- **Prévention d'erreurs** : Blocage de la soumission si données invalides

### **2. Qualité des données**

- **Validation complète** : Tous les champs obligatoires vérifiés
- **Cohérence** : Données structurées et complètes
- **Fiabilité** : Réduction des erreurs de saisie

### **3. Maintenance**

- **Code modulaire** : Fonctions de validation séparées
- **Réutilisabilité** : Logique de validation centralisée
- **Extensibilité** : Facile d'ajouter de nouvelles règles

## Évolutions possibles

### **1. Validation en temps réel**

- **Validation à la saisie** : Vérification pendant la frappe
- **Auto-complétion** : Suggestions basées sur la validation
- **Prévisualisation** : Aperçu des erreurs avant soumission

### **2. Validation avancée**

- **Règles métier** : Validation spécifique au domaine
- **Validation croisée** : Vérification entre champs liés
- **Validation conditionnelle** : Règles selon le contexte

### **3. Interface améliorée**

- **Indicateurs visuels** : Progression de la validation
- **Aide contextuelle** : Conseils pour corriger les erreurs
- **Mode guidé** : Assistant de création de devis

Cette implémentation améliore significativement l'expérience utilisateur en fournissant un feedback visuel clair et immédiat pour la validation des champs obligatoires !
