# Pagination des Taux Horaires - TauxHorairesPage

## Vue d'ensemble

La pagination de `TauxHorairesPage.tsx` a été améliorée pour être cohérente avec le design des autres pages de l'application, offrant une meilleure expérience utilisateur et une navigation plus intuitive.

## Améliorations apportées

### **1. Design cohérent**

- **Interface harmonisée** : Même design que `DevisPage.tsx`, `ClientsPage.tsx`, et `ServiceDetailsPage.tsx`
- **Navigation complète** : Boutons Première/Dernière page
- **Numéros de page** : Navigation directe avec boutons carrés
- **Responsive** : Adaptation mobile/desktop

### **2. Informations détaillées**

- **Compteur total** : Affichage du nombre total de taux horaires
- **Page courante** : Indication claire de la position
- **Séparateur visuel** : Point de séparation entre les informations

### **3. Navigation améliorée**

- **Boutons de navigation rapide** : Première/Dernière page
- **Navigation séquentielle** : Précédent/Suivant avec labels
- **Numéros de page** : Maximum 5 pages visibles
- **Sélecteur mobile** : Dropdown pour navigation mobile

## Implémentation technique

### **1. États ajoutés**

```typescript
const [totalItems, setTotalItems] = useState(0);
```

### **2. Fonctions de pagination améliorées**

```typescript
const setPageSafely = (page: number) => {
  const safePage = Math.max(1, page);
  if (totalPages > 0) {
    const maxPage = Math.max(1, totalPages);
    setCurrentPage(Math.min(safePage, maxPage));
  } else {
    setCurrentPage(safePage);
  }
};

const getPageNumbers = () => {
  const pages = [];
  const maxVisiblePages = 5;

  if (totalPages <= maxVisiblePages) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    let start = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let end = Math.min(totalPages, start + maxVisiblePages - 1);

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

### **3. Mise à jour de fetchTauxHoraires**

```typescript
const fetchTauxHoraires = async (page = 1) => {
  setLoading(true);
  try {
    const params: any = { page, page_size: pageSize };
    // ... filtres existants ...
    const res = await api.get("/catalog/taux-horaires/", { params });
    const data: PaginatedResponse = res.data;
    setTauxHoraires(data.results);
    setTotalPages(Math.ceil(data.count / pageSize));
    setHasNext(!!data.next);
    setHasPrev(!!data.previous);
    setTotalItems(data.count); // Nouveau : nombre total d'éléments
  } catch (err) {
    toast.error("Erreur lors du chargement des taux horaires");
  } finally {
    setLoading(false);
  }
};
```

## Interface utilisateur

### **1. Informations de pagination**

```tsx
<div className="flex items-center gap-4 text-sm text-gray-600">
  <span>
    Page {currentPage} sur {totalPages}
  </span>
  <span className="hidden sm:inline">•</span>
  <span className="hidden sm:inline">{totalItems} taux horaires au total</span>
</div>
```

### **2. Contrôles de navigation**

```tsx
<div className="flex items-center gap-2">
  {/* Boutons de navigation rapide */}
  <Button
    variant="outline"
    size="sm"
    onClick={() => setPageSafely(1)}
    disabled={currentPage === 1}
    className="hidden sm:flex"
  >
    <ChevronsLeft size={16} />
    <span className="ml-1 hidden lg:inline">Première</span>
  </Button>

  {/* Navigation séquentielle */}
  <Button
    variant="outline"
    size="sm"
    onClick={() => setPageSafely(currentPage - 1)}
    disabled={!hasPrev || currentPage === 1}
  >
    <ChevronLeft size={16} />
    <span className="ml-1 hidden lg:inline">Précédent</span>
  </Button>

  {/* Numéros de page */}
  <div className="flex items-center gap-1">
    {getPageNumbers().map((pageNum) => (
      <Button
        key={pageNum}
        variant={currentPage === pageNum ? "default" : "outline"}
        size="sm"
        onClick={() => setPageSafely(pageNum)}
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
    onClick={() => setPageSafely(currentPage + 1)}
    disabled={!hasNext || currentPage === totalPages}
  >
    <span className="mr-1 hidden lg:inline">Suivant</span>
    <ChevronRight size={16} />
  </Button>

  {/* Boutons de navigation rapide */}
  <Button
    variant="outline"
    size="sm"
    onClick={() => setPageSafely(totalPages)}
    disabled={currentPage === totalPages}
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
    value={currentPage}
    onChange={(e) => setPageSafely(parseInt(e.target.value))}
    className="border rounded px-2 py-1 text-sm"
  >
    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
      <option key={pageNum} value={pageNum}>
        {pageNum}
      </option>
    ))}
  </select>
  <span className="text-sm text-gray-600">sur {totalPages}</span>
</div>
```

## Fonctionnalités

### **1. Affichage conditionnel**

- **Avec pagination** : Affichée quand il y a plus d'une page
- **Sans pagination** : Masquée quand il n'y a qu'une page
- **Avec filtres** : Pagination des résultats filtrés

### **2. Navigation intelligente**

- **Première page** : Boutons désactivés quand on est à la page 1
- **Dernière page** : Boutons désactivés quand on est à la dernière page
- **Pages intermédiaires** : Navigation complète disponible

### **3. Numéros de page**

- **Maximum 5 pages visibles** : Évite l'encombrement
- **Pages autour de la page courante** : Navigation contextuelle
- **Ajustement automatique** : Gestion des cas limites

### **4. Intégration avec les filtres**

- **Recherche** : Pagination des résultats de recherche
- **Filtres de statut** : Pagination des taux actifs/inactifs
- **Filtres de niveau** : Pagination par niveau intervenant
- **Filtres d'activité** : Pagination par activité
- **Filtres de profil** : Pagination par profil intervenant

## Responsive Design

### **Desktop (lg+)**

- **Navigation complète** : Tous les boutons avec labels
- **Numéros visibles** : Boutons carrés avec numéros
- **Informations détaillées** : Page + total de taux horaires

### **Tablet (sm-lg)**

- **Navigation partielle** : Labels masqués sur certains boutons
- **Numéros visibles** : Boutons carrés avec numéros
- **Informations partielles** : Page + total de taux horaires

### **Mobile (< sm)**

- **Navigation basique** : Précédent/Suivant uniquement
- **Sélecteur** : Dropdown pour choisir la page
- **Informations minimales** : Page courante uniquement

## Avantages

### **1. Cohérence**

- **Design uniforme** : Même interface que les autres pages
- **Navigation familière** : Utilisateurs habitués au pattern
- **Expérience fluide** : Transition naturelle entre les pages

### **2. Performance**

- **Chargement optimisé** : Seulement 10 taux horaires par page
- **Rendu efficace** : Moins d'éléments DOM
- **Navigation rapide** : Pas de rechargement complet

### **3. Accessibilité**

- **Navigation clavier** : Tous les boutons accessibles
- **Labels descriptifs** : Textes explicites sur les boutons
- **États visuels** : Boutons désactivés clairement indiqués

### **4. Flexibilité**

- **Filtres multiples** : Pagination avec tous les filtres
- **Recherche intégrée** : Pagination des résultats de recherche
- **Reset automatique** : Retour à la page 1 lors d'un nouveau filtre

## Cas d'usage

### **1. Navigation dans de grandes listes**

- **Problème** : Liste de taux horaires trop longue
- **Solution** : Pagination par 10 éléments

### **2. Recherche et filtrage**

- **Problème** : Résultats de recherche dispersés
- **Solution** : Pagination des résultats filtrés

### **3. Navigation mobile**

- **Problème** : Interface encombrée sur mobile
- **Solution** : Sélecteur dropdown pour la navigation

### **4. Gestion des filtres multiples**

- **Problème** : Combinaison de filtres complexe
- **Solution** : Pagination intelligente avec tous les filtres

## Évolutions possibles

### **1. Taille de page configurable**

- **Sélecteur** : Choisir 5, 10, 20, 50 taux horaires par page
- **Préférence utilisateur** : Sauvegarder le choix

### **2. Tri des taux horaires**

- **Tri par taux** : Plus élevé au plus bas
- **Tri par activité** : Ordre alphabétique des activités
- **Tri par profil** : Ordre alphabétique des profils

### **3. Export paginé**

- **Export de la page courante** : Seulement les taux visibles
- **Export filtré** : Seulement les résultats de recherche

### **4. Vue en grille**

- **Alternance** : Possibilité de basculer entre tableau et grille
- **Cartes** : Affichage en cartes pour une vue différente

## Tests de validation

### **Cas de test 1 : Pagination basique**

```typescript
// 25 taux horaires, 10 par page
// Résultat attendu: 3 pages (10, 10, 5)
```

### **Cas de test 2 : Recherche avec pagination**

```typescript
// 25 taux horaires, recherche "senior" → 8 résultats
// Résultat attendu: 1 page avec 8 taux horaires
```

### **Cas de test 3 : Filtres multiples**

```typescript
// 25 taux horaires, filtre actif + niveau senior → 5 résultats
// Résultat attendu: 1 page avec 5 taux horaires
```

### **Cas de test 4 : Navigation**

```typescript
// Page 1 → Suivant → Page 2
// Page 2 → Précédent → Page 1
// Page 1 → Dernière → Page 3
```

### **Cas de test 5 : Reset automatique**

```typescript
// Page 3 → Nouveau filtre → Page 1 automatiquement
```

Cette implémentation améliore significativement l'expérience utilisateur pour la gestion des taux horaires !
