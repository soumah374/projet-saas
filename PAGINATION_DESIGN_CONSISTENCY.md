# Cohérence du Design de Pagination

## Vue d'ensemble

La pagination a été standardisée dans toutes les pages de l'application pour offrir une expérience utilisateur cohérente et professionnelle. Le design suit un pattern uniforme basé sur `DevisPage.tsx`.

## Pages avec pagination cohérente

### ✅ **Pages implémentées**

1. **`DevisPage.tsx`** - Page de référence
2. **`LignesFraisPage.tsx`** - Lignes de frais
3. **`ClientsPage.tsx`** - Clients (récemment mise à jour)

### 🔄 **Pages à implémenter**

- `ProjectsPage.tsx` - Projets
- `TeamsPage.tsx` - Équipes
- `UsersPage.tsx` - Utilisateurs
- `ServicesPage.tsx` - Services
- Autres pages avec listes paginées

## Design standardisé

### **Structure HTML**

```tsx
{
  /* Enhanced Pagination */
}
{
  totalPages > 1 && (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
      {/* Informations de pagination */}
      <div className="flex items-center gap-4 text-sm text-gray-600">
        <span>
          Page {currentPage} sur {totalPages}
        </span>
        <span className="hidden sm:inline">•</span>
        <span className="hidden sm:inline">{totalItems} [entité] au total</span>
      </div>

      {/* Contrôles de pagination */}
      <div className="flex items-center gap-2">{/* Navigation complète */}</div>
    </div>
  );
}
```

### **Composants de navigation**

#### **1. Informations de pagination**

- **Desktop** : "Page X sur Y • Z [entité] au total"
- **Mobile** : "Page X sur Y"
- **Responsive** : Adaptation automatique selon la taille d'écran

#### **2. Boutons de navigation rapide**

- **Première page** : `<ChevronsLeft />` + "Première" (desktop)
- **Précédent** : `<ChevronLeft />` + "Précédent" (desktop)
- **Suivant** : "Suivant" + `<ChevronRight />` (desktop)
- **Dernière page** : "Dernière" + `<ChevronsRight />` (desktop)

#### **3. Numéros de page**

- **Desktop** : Boutons carrés (8x8) avec numéros
- **Mobile** : Sélecteur dropdown avec labels
- **Maximum** : 5 numéros visibles simultanément

## Fonctions standardisées

### **Fonctions de base**

```typescript
// Reset to first page when filters change
const resetToFirstPage = () => setCurrentPage(1);

// Safe page navigation function
const setPageSafely = (page: number) => {
  const safePage = Math.max(1, page);
  if (totalPages > 0) {
    const maxPage = Math.max(1, totalPages);
    setCurrentPage(Math.min(safePage, maxPage));
  } else {
    setCurrentPage(safePage);
  }
};

// Get page numbers to display
const getPageNumbers = () => {
  const pages = [];
  const maxVisiblePages = 5;

  if (totalPages <= maxVisiblePages) {
    // Show all pages if total is small
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    // Show pages around current page
    let start = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let end = Math.min(totalPages, start + maxVisiblePages - 1);

    // Adjust start if we're near the end
    if (end === totalPages) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
  }

  return pages;
};
```

### **Gestion d'erreurs**

```typescript
// Handle pagination errors
React.useEffect(() => {
  if (error && currentPage > 1) {
    // If there's an error and we're not on the first page, go back to page 1
    setCurrentPage(1);
  }
}, [error, currentPage]);

// Validate current page
React.useEffect(() => {
  if (totalPages > 0 && currentPage > totalPages) {
    setCurrentPage(totalPages);
  }
}, [totalPages, currentPage]);
```

### **Calculs standardisés**

```typescript
// Use the default PAGE_SIZE from Django settings (20)
const defaultPageSize = 20;
const totalPages = clientsData
  ? Math.ceil(clientsData.count / defaultPageSize)
  : 1;
const hasNext = !!clientsData?.next;
const hasPrev = !!clientsData?.previous;
const totalItems = clientsData?.count || 0;
const startItem = (currentPage - 1) * defaultPageSize + 1;
const endItem = Math.min(currentPage * defaultPageSize, totalItems);
```

## Classes CSS standardisées

### **Conteneur principal**

```css
.flex.flex-col.sm: flex-row.items-center.justify-between.gap-4.mt-6;
```

### **Informations de pagination**

```css
.flex.items-center.gap-4.text-sm.text-gray-600
```

### **Contrôles de navigation**

```css
.flex.items-center.gap-2
```

### **Boutons de navigation**

```css
.variant="outline".size="sm";
```

### **Numéros de page**

```css
.w-8.h-8.text-xs.hidden.sm: flex;
```

### **Sélecteur mobile**

```css
.sm: hidden.flex.items-center.gap-2;
```

## Responsive Design

### **Desktop (lg+)**

- **Navigation complète** : Tous les boutons avec labels
- **Informations détaillées** : Page + total d'entités
- **Numéros visibles** : Boutons carrés avec numéros

### **Tablet (sm-lg)**

- **Navigation simplifiée** : Boutons avec icônes + labels courts
- **Informations réduites** : Page + total d'entités
- **Numéros visibles** : Boutons carrés avec numéros

### **Mobile (< sm)**

- **Navigation basique** : Précédent/Suivant uniquement
- **Informations minimales** : Page courante uniquement
- **Sélecteur** : Dropdown pour choisir la page

## Avantages de la cohérence

### **1. Expérience utilisateur**

- **Navigation familière** : Même comportement partout
- **Apprentissage rapide** : Pattern reconnu
- **Efficacité** : Actions automatiques

### **2. Maintenabilité**

- **Code réutilisable** : Pattern applicable partout
- **Modifications centralisées** : Changements cohérents
- **Tests uniformes** : Même logique de test

### **3. Design professionnel**

- **Interface cohérente** : Apparence uniforme
- **Qualité visuelle** : Design soigné
- **Accessibilité** : Navigation claire

## Guide d'implémentation

### **Étapes pour une nouvelle page**

1. **Importer les icônes** : `ChevronLeft`, `ChevronRight`, `ChevronsLeft`, `ChevronsRight`
2. **Ajouter les états** : `currentPage`, `error` dans le hook
3. **Implémenter les fonctions** : `resetToFirstPage`, `setPageSafely`, `getPageNumbers`
4. **Ajouter les calculs** : `totalPages`, `hasNext`, `hasPrev`, `totalItems`
5. **Mettre à jour les filtres** : Utiliser `resetToFirstPage()`
6. **Copier le template HTML** : Structure standardisée
7. **Adapter le texte** : Remplacer "[entité]" par le nom approprié

### **Exemple d'adaptation**

```typescript
// Pour ProjectsPage.tsx
<span className="hidden sm:inline">
  {totalItems} projets au total
</span>

// Pour TeamsPage.tsx
<span className="hidden sm:inline">
  {totalItems} équipes au total
</span>

// Pour UsersPage.tsx
<span className="hidden sm:inline">
  {totalItems} utilisateurs au total
</span>
```

## Tests de cohérence

### **Tests visuels**

1. **Comparaison côte à côte** : Vérifier l'alignement
2. **Responsive testing** : Tester sur tous les écrans
3. **Navigation** : Vérifier le comportement identique

### **Tests fonctionnels**

1. **Filtres** : Vérifier le reset à la page 1
2. **Navigation** : Tester tous les boutons
3. **Limites** : Vérifier les cas extrêmes

### **Tests d'accessibilité**

1. **Clavier** : Navigation au clavier
2. **Lecteurs d'écran** : Labels appropriés
3. **Contraste** : Lisibilité des éléments

## Conclusion

Cette standardisation garantit une expérience utilisateur cohérente et professionnelle dans toute l'application. Le pattern est robuste, maintenable et facilement applicable aux nouvelles pages.
