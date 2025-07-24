# Page de Détails des Catégories - CategoryDetailsPage

## Vue d'ensemble

La page `CategoryDetailsPage.tsx` affiche les détails d'une catégorie spécifique ainsi que tous les services associés à cette catégorie. Elle offre une vue complète et organisée des informations de la catégorie.

## Fonctionnalités

### **1. Informations de la catégorie**

- **Nom de la catégorie** : Affichage du nom
- **Date de création** : Quand la catégorie a été créée
- **Date de modification** : Dernière mise à jour
- **Bouton de modification** : Édition directe du nom

### **2. Services associés**

- **Liste paginée** : Affichage des services par page (10 par page)
- **Recherche** : Filtrage des services par nom
- **Navigation** : Liens vers les détails de chaque service
- **Statut** : Indication si le service est actif ou inactif

### **3. Statistiques**

- **Nombre total de services** : Compteur des services associés
- **Services actifs** : Nombre de services actifs
- **Date de création** : Rappel de la date de création

### **4. Actions rapides**

- **Voir tous les services** : Lien vers la page des services
- **Retour aux catégories** : Navigation vers la liste des catégories

## Structure de la page

### **Header**

```tsx
<div className="flex items-center justify-between">
  <div className="flex items-center gap-4">
    <Link to="/categories">
      <Button variant="ghost" size="sm">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Retour
      </Button>
    </Link>
    <div>
      <h1 className="text-2xl font-bold text-gray-900">{category.name}</h1>
      <p className="text-gray-500">Détails de la catégorie</p>
    </div>
  </div>
  <div className="flex items-center gap-2">
    <Button size="sm" variant="outline" onClick={handleOpenEditDialog}>
      <Edit className="h-4 w-4 mr-2" />
      Modifier
    </Button>
  </div>
</div>
```

### **Layout en grille**

```tsx
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  {/* Informations principales - 2/3 de la largeur */}
  <div className="lg:col-span-2 space-y-6">
    {/* Détails de la catégorie */}
    {/* Services associés */}
  </div>

  {/* Sidebar - 1/3 de la largeur */}
  <div className="space-y-6">
    {/* Statistiques */}
    {/* Actions rapides */}
  </div>
</div>
```

## Implémentation technique

### **1. États de la page**

```typescript
const [category, setCategory] = useState<Category | null>(null);
const [services, setServices] = useState<Service[]>([]);
const [loading, setLoading] = useState(true);
const [servicesLoading, setServicesLoading] = useState(false);
const [dialogOpen, setDialogOpen] = useState(false);
const [editForm, setEditForm] = useState({ name: "" });
const [saving, setSaving] = useState(false);
```

### **2. États de pagination**

```typescript
const [currentPage, setCurrentPage] = useState(1);
const [totalPages, setTotalPages] = useState(1);
const [hasNext, setHasNext] = useState(false);
const [hasPrev, setHasPrev] = useState(false);
const [totalItems, setTotalItems] = useState(0);
const pageSize = 10;
```

### **3. État de recherche**

```typescript
const [serviceSearchTerm, setServiceSearchTerm] = useState("");
```

### **4. Fonctions de pagination**

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

### **5. Chargement des données**

```typescript
const fetchCategoryDetails = async () => {
  if (!categoryId) return;

  setLoading(true);
  try {
    const res = await api.get(`/catalog/categories/${categoryId}/`);
    setCategory(res.data);
  } catch (err) {
    toast.error("Erreur lors du chargement de la catégorie");
  } finally {
    setLoading(false);
  }
};

const fetchServices = async (page = 1) => {
  if (!categoryId) return;

  setServicesLoading(true);
  try {
    const params: any = {
      page,
      page_size: pageSize,
      category: categoryId,
    };
    if (serviceSearchTerm) params.search = serviceSearchTerm;

    const res = await api.get("/catalog/services/", { params });
    const data: PaginatedResponse = res.data;
    setServices(data.results);
    setTotalPages(Math.ceil(data.count / pageSize));
    setHasNext(!!data.next);
    setHasPrev(!!data.previous);
    setTotalItems(data.count);
  } catch (err) {
    toast.error("Erreur lors du chargement des services");
  } finally {
    setServicesLoading(false);
  }
};
```

### **6. Édition de la catégorie**

```typescript
const handleSaveEdit = async () => {
  if (!category || !editForm.name.trim()) {
    toast.error("Le nom de la catégorie est requis");
    return;
  }

  setSaving(true);
  try {
    await api.put(`/catalog/categories/${category.id}/`, {
      name: editForm.name.trim(),
    });
    toast.success("Catégorie modifiée");
    setDialogOpen(false);
    fetchCategoryDetails();
  } catch (err: any) {
    if (err.response?.data?.name) {
      toast.error("Une catégorie avec ce nom existe déjà");
    } else {
      toast.error("Erreur lors de la modification");
    }
  } finally {
    setSaving(false);
  }
};
```

## Interface utilisateur

### **1. Informations de la catégorie**

```tsx
<Card>
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <Building2 className="h-5 w-5" />
      Informations générales
    </CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="text-sm font-medium text-gray-500">Nom</label>
        <p className="text-gray-900">{category.name}</p>
      </div>
    </div>
    <Separator />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
      <div>
        <label className="text-sm font-medium text-gray-500">Créé le</label>
        <p className="text-gray-900">{formatDate(category.created_at)}</p>
      </div>
      <div>
        <label className="text-sm font-medium text-gray-500">Modifié le</label>
        <p className="text-gray-900">{formatDate(category.updated_at)}</p>
      </div>
    </div>
  </CardContent>
</Card>
```

### **2. Services associés**

```tsx
<Card>
  <CardHeader className="flex flex-row items-center justify-between">
    <CardTitle className="flex items-center gap-2">
      <FileText className="h-5 w-5" />
      Services associés ({totalItems})
    </CardTitle>
    <Link to="/services">
      <Button size="sm" className="gap-2">
        <Plus size={16} />
        Voir tous les services
      </Button>
    </Link>
  </CardHeader>
  <CardContent>
    {/* Barre de recherche */}
    {/* Table des services */}
    {/* Pagination */}
  </CardContent>
</Card>
```

### **3. Statistiques**

```tsx
<Card>
  <CardHeader>
    <CardTitle className="text-lg">Statistiques</CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5 text-blue-500" />
        <span className="text-sm text-gray-600">Services</span>
      </div>
      <span className="font-semibold">{totalItems}</span>
    </div>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Activity className="h-5 w-5 text-green-500" />
        <span className="text-sm text-gray-600">Services actifs</span>
      </div>
      <span className="font-semibold">
        {services.filter((s) => s.is_active).length}
      </span>
    </div>
  </CardContent>
</Card>
```

## Navigation

### **1. Routes**

```typescript
// Dans App.tsx
<Route
  path="/categories-services/:categoryId"
  element={
    <ProtectedRoute>
      <CategoryDetailsPage />
    </ProtectedRoute>
  }
/>
```

### **2. Liens vers la page**

```typescript
// Dans CategoriesPage.tsx
<Link
  to={`/categories-services/${category.id}`}
  className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
>
  {category.name}
</Link>
```

### **3. Navigation de retour**

```typescript
<Link to="/categories">
  <Button variant="ghost" size="sm">
    <ArrowLeft className="h-4 w-4 mr-2" />
    Retour
  </Button>
</Link>
```

## Gestion des erreurs

### **1. Catégorie non trouvée**

```typescript
if (!category) {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="text-center py-10">
        <p className="text-gray-500">Catégorie non trouvée</p>
        <Link to="/categories">
          <Button className="mt-4">Retour aux catégories</Button>
        </Link>
      </div>
    </div>
  );
}
```

### **2. Erreur de chargement**

```typescript
if (loading) {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-center py-10">
        <Loader2 className="animate-spin" size={32} />
      </div>
    </div>
  );
}
```

### **3. Erreur de modification**

```typescript
catch (err: any) {
  if (err.response?.data?.name) {
    toast.error('Une catégorie avec ce nom existe déjà');
  } else {
    toast.error('Erreur lors de la modification');
  }
}
```

## Responsive Design

### **Desktop (lg+)**

- **Layout en grille** : 2/3 pour le contenu principal, 1/3 pour la sidebar
- **Navigation complète** : Tous les boutons avec labels
- **Table complète** : Toutes les colonnes visibles

### **Tablet (md-lg)**

- **Layout adaptatif** : Grille responsive
- **Navigation partielle** : Boutons avec icônes
- **Table adaptée** : Colonnes importantes visibles

### **Mobile (< md)**

- **Layout vertical** : Contenu empilé
- **Navigation simplifiée** : Boutons essentiels
- **Table scrollable** : Défilement horizontal

## Avantages

### **1. Vue centralisée**

- **Informations complètes** : Tous les détails de la catégorie
- **Services associés** : Liste paginée et recherchable
- **Statistiques** : Vue d'ensemble rapide

### **2. Navigation intuitive**

- **Liens directs** : Vers les détails des services
- **Retour facile** : Bouton de retour vers les catégories
- **Actions rapides** : Modification directe

### **3. Performance optimisée**

- **Pagination** : Chargement par page
- **Recherche** : Filtrage côté serveur
- **États de chargement** : Feedback utilisateur

### **4. Cohérence design**

- **Même pattern** : Que les autres pages de détails
- **Composants réutilisés** : Cards, Tables, Pagination
- **Styles uniformes** : Couleurs et espacements

## Cas d'usage

### **1. Consultation d'une catégorie**

- **Problème** : Voir les détails et services d'une catégorie
- **Solution** : Page dédiée avec toutes les informations

### **2. Navigation vers les services**

- **Problème** : Accéder rapidement aux services d'une catégorie
- **Solution** : Liens directs vers les détails des services

### **3. Modification de catégorie**

- **Problème** : Modifier le nom d'une catégorie
- **Solution** : Modal d'édition intégrée

### **4. Recherche dans les services**

- **Problème** : Trouver un service spécifique dans la catégorie
- **Solution** : Barre de recherche avec pagination

Cette implémentation offre une vue complète et organisée des catégories avec leurs services associés !
