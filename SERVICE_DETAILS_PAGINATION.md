# Pagination des Activités Associées - ServiceDetailsPage

## Vue d'ensemble

Une fonctionnalité de pagination a été ajoutée à la section "Activités associées" de `ServiceDetailsPage.tsx` pour améliorer les performances et l'expérience utilisateur lors de l'affichage d'un grand nombre d'activités.

## Fonctionnalités ajoutées

### **1. Pagination automatique**

- **Taille de page** : 10 activités par page
- **Navigation** : Boutons Précédent/Suivant
- **Navigation rapide** : Première/Dernière page
- **Numéros de page** : Navigation directe

### **2. Intégration avec la recherche**

- **Reset automatique** : Retour à la page 1 lors d'une recherche
- **Filtrage paginé** : Les résultats de recherche sont paginés
- **Compteur dynamique** : Affichage du nombre d'activités filtrées

### **3. Interface responsive**

- **Desktop** : Navigation complète avec numéros de page
- **Mobile** : Sélecteur dropdown pour la navigation
- **Adaptatif** : Interface qui s'adapte à la taille d'écran

## Implémentation technique

### **1. États de pagination**

```typescript
const [currentActivityPage, setCurrentActivityPage] = useState(1);
const [activityPageSize] = useState(10); // 10 activités par page
```

### **2. Calculs de pagination**

```typescript
const totalActivityPages = Math.ceil(
  filteredActivities.length / activityPageSize
);
const startActivityIndex = (currentActivityPage - 1) * activityPageSize;
const endActivityIndex = startActivityIndex + activityPageSize;
const paginatedActivities = filteredActivities.slice(
  startActivityIndex,
  endActivityIndex
);
const hasActivityPrev = currentActivityPage > 1;
const hasActivityNext = currentActivityPage < totalActivityPages;
```

### **3. Fonctions de navigation**

```typescript
const resetActivityPage = () => setCurrentActivityPage(1);

const setActivityPageSafely = (page: number) => {
  const safePage = Math.max(1, page);
  if (totalActivityPages > 0) {
    const maxPage = Math.max(1, totalActivityPages);
    setCurrentActivityPage(Math.min(safePage, maxPage));
  } else {
    setCurrentActivityPage(safePage);
  }
};

const getActivityPageNumbers = () => {
  const pages = [];
  const maxVisiblePages = 5;

  if (totalActivityPages <= maxVisiblePages) {
    for (let i = 1; i <= totalActivityPages; i++) {
      pages.push(i);
    }
  } else {
    let start = Math.max(
      1,
      currentActivityPage - Math.floor(maxVisiblePages / 2)
    );
    let end = Math.min(totalActivityPages, start + maxVisiblePages - 1);

    if (end === totalActivityPages) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
  }

  return pages;
};
```

### **4. Reset automatique**

```typescript
useEffect(() => {
  resetActivityPage();
}, [activitySearchTerm]);
```

## Interface utilisateur

### **1. Informations de pagination**

```tsx
<div className="flex items-center gap-4 text-sm text-gray-600">
  <span>
    Page {currentActivityPage} sur {totalActivityPages}
  </span>
  <span className="hidden sm:inline">•</span>
  <span className="hidden sm:inline">
    {filteredActivities.length} activités au total
  </span>
</div>
```

### **2. Contrôles de navigation**

```tsx
<div className="flex items-center gap-2">
  {/* Boutons de navigation rapide */}
  <Button
    variant="outline"
    size="sm"
    onClick={() => setActivityPageSafely(1)}
    disabled={currentActivityPage === 1}
    className="hidden sm:flex"
  >
    <ChevronsLeft size={16} />
    <span className="ml-1 hidden lg:inline">Première</span>
  </Button>

  {/* Navigation séquentielle */}
  <Button
    variant="outline"
    size="sm"
    onClick={() => setActivityPageSafely(currentActivityPage - 1)}
    disabled={!hasActivityPrev || currentActivityPage === 1}
  >
    <ChevronLeft size={16} />
    <span className="ml-1 hidden lg:inline">Précédent</span>
  </Button>

  {/* Numéros de page */}
  <div className="flex items-center gap-1">
    {getActivityPageNumbers().map((pageNum) => (
      <Button
        key={pageNum}
        variant={currentActivityPage === pageNum ? "default" : "outline"}
        size="sm"
        onClick={() => setActivityPageSafely(pageNum)}
        className="w-8 h-8 text-xs hidden sm:flex"
      >
        {pageNum}
      </Button>
    ))}
  </div>

  {/* Navigation séquentielle */}
  <Button
    variant="outline"
    size="sm"
    onClick={() => setActivityPageSafely(currentActivityPage + 1)}
    disabled={!hasActivityNext || currentActivityPage === totalActivityPages}
  >
    <span className="mr-1 hidden lg:inline">Suivant</span>
    <ChevronRight size={16} />
  </Button>

  {/* Boutons de navigation rapide */}
  <Button
    variant="outline"
    size="sm"
    onClick={() => setActivityPageSafely(totalActivityPages)}
    disabled={currentActivityPage === totalActivityPages}
    className="hidden sm:flex"
  >
    <span className="mr-1 hidden lg:inline">Dernière</span>
    <ChevronsRight size={16} />
  </Button>
</div>
```

### **3. Sélecteur mobile**

```tsx
<div className="sm:hidden flex items-center gap-2">
  <span className="text-sm text-gray-600">Page</span>
  <select
    value={currentActivityPage}
    onChange={(e) => setActivityPageSafely(parseInt(e.target.value))}
    className="border rounded px-2 py-1 text-sm"
  >
    {Array.from({ length: totalActivityPages }, (_, i) => i + 1).map(
      (pageNum) => (
        <option key={pageNum} value={pageNum}>
          {pageNum}
        </option>
      )
    )}
  </select>
  <span className="text-sm text-gray-600">sur {totalActivityPages}</span>
</div>
```

## Comportement

### **1. Affichage conditionnel**

- **Avec pagination** : Affichée quand il y a plus d'une page
- **Sans pagination** : Masquée quand il n'y a qu'une page
- **Avec recherche** : Pagination des résultats filtrés

### **2. Navigation intelligente**

- **Première page** : Boutons désactivés quand on est à la page 1
- **Dernière page** : Boutons désactivés quand on est à la dernière page
- **Pages intermédiaires** : Navigation complète disponible

### **3. Numéros de page**

- **Maximum 5 pages visibles** : Évite l'encombrement
- **Pages autour de la page courante** : Navigation contextuelle
- **Ajustement automatique** : Gestion des cas limites

## Avantages

### **1. Performance**

- **Chargement rapide** : Seulement 10 activités affichées à la fois
- **Rendu optimisé** : Moins d'éléments DOM
- **Navigation fluide** : Pas de rechargement

### **2. Expérience utilisateur**

- **Navigation intuitive** : Interface familière
- **Feedback visuel** : Informations de pagination claires
- **Responsive** : Adaptation mobile/desktop

### **3. Intégration**

- **Avec la recherche** : Pagination des résultats filtrés
- **Reset automatique** : Retour à la page 1 lors d'une recherche
- **Cohérence** : Même design que les autres pages

## Cas d'usage

### **1. Services avec beaucoup d'activités**

- **Problème** : Liste trop longue, navigation difficile
- **Solution** : Pagination par 10 activités

### **2. Recherche dans de grandes listes**

- **Problème** : Résultats de recherche dispersés
- **Solution** : Pagination des résultats filtrés

### **3. Navigation mobile**

- **Problème** : Interface encombrée sur mobile
- **Solution** : Sélecteur dropdown pour la navigation

## Évolutions possibles

### **1. Taille de page configurable**

- **Sélecteur** : Choisir 5, 10, 20, 50 activités par page
- **Préférence utilisateur** : Sauvegarder le choix

### **2. Tri des activités**

- **Tri par nom** : Ordre alphabétique
- **Tri par durée** : Plus court au plus long
- **Tri par statut** : Actives en premier

### **3. Export paginé**

- **Export de la page courante** : Seulement les activités visibles
- **Export filtré** : Seulement les résultats de recherche

## Tests de validation

### **Cas de test 1 : Pagination basique**

```typescript
// 25 activités, 10 par page
// Résultat attendu: 3 pages (10, 10, 5)
```

### **Cas de test 2 : Recherche avec pagination**

```typescript
// 25 activités, recherche "dev" → 8 résultats
// Résultat attendu: 1 page avec 8 activités
```

### **Cas de test 3 : Navigation**

```typescript
// Page 1 → Suivant → Page 2
// Page 2 → Précédent → Page 1
// Page 1 → Dernière → Page 3
```

### **Cas de test 4 : Reset automatique**

```typescript
// Page 3 → Recherche "test" → Page 1 automatiquement
```

Cette implémentation améliore significativement les performances et l'expérience utilisateur pour les services avec de nombreuses activités !
