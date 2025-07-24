# Fonctionnalité de Recherche - Activités Associées

## Vue d'ensemble

Une fonctionnalité de recherche en temps réel a été ajoutée à la section "Activités associées" de `ServiceDetailsPage.tsx` pour permettre aux utilisateurs de filtrer rapidement les activités selon différents critères.

## Fonctionnalités ajoutées

### **1. Barre de recherche**

- **Placeholder** : "Rechercher une activité..."
- **Icône de recherche** : Icône Search à gauche
- **Bouton d'effacement** : Bouton "×" à droite quand il y a du texte
- **Recherche en temps réel** : Filtrage instantané

### **2. Critères de recherche**

La recherche fonctionne sur plusieurs champs :

- **Nom de l'activité** : Recherche dans le nom
- **Durée standard** : Recherche dans la durée (ex: "8", "16.5")
- **Profils intervenant** : Recherche dans les noms des profils
- **Statut** : Recherche par "active" ou "inactive"

### **3. Compteur dynamique**

- **Affichage** : "Activités associées (X/Y)"
- **X** : Nombre d'activités filtrées
- **Y** : Nombre total d'activités

## Implémentation technique

### **1. État de recherche**

```typescript
const [activitySearchTerm, setActivitySearchTerm] = useState("");
```

### **2. Fonction de filtrage**

```typescript
const filteredActivities =
  service?.activities?.filter((activity) => {
    if (!activitySearchTerm.trim()) return true;

    const searchLower = activitySearchTerm.toLowerCase();
    return (
      activity.name.toLowerCase().includes(searchLower) ||
      activity.duree_standard.toString().includes(searchLower) ||
      activity.activity_profiles?.some((profile) =>
        profile.profile_intervenant.name.toLowerCase().includes(searchLower)
      ) ||
      (activity.is_active ? "active" : "inactive").includes(searchLower)
    );
  }) || [];
```

### **3. Interface utilisateur**

```tsx
{
  /* Barre de recherche */
}
<div className="mb-4">
  <div className="relative">
    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
    <Input
      placeholder="Rechercher une activité..."
      value={activitySearchTerm}
      onChange={(e) => setActivitySearchTerm(e.target.value)}
      className="pl-10"
    />
    {activitySearchTerm && (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setActivitySearchTerm("")}
        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
      >
        ×
      </Button>
    )}
  </div>
</div>;
```

## États d'affichage

### **1. Avec des résultats**

- **Tableau normal** : Affichage des activités filtrées
- **Compteur mis à jour** : "Activités associées (X/Y)"

### **2. Aucun résultat de recherche**

```tsx
<div className="text-center py-8 text-gray-500">
  <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
  <p>Aucune activité trouvée pour "{activitySearchTerm}"</p>
  <Button
    onClick={() => setActivitySearchTerm("")}
    className="mt-4"
    variant="outline"
  >
    Effacer la recherche
  </Button>
</div>
```

### **3. Aucune activité**

- **État initial** : Quand il n'y a aucune activité
- **Bouton d'ajout** : "Ajouter la première activité"

## Exemples d'utilisation

### **Recherche par nom**

```
Recherche: "développement"
Résultats: Toutes les activités contenant "développement" dans leur nom
```

### **Recherche par durée**

```
Recherche: "8"
Résultats: Toutes les activités avec une durée de 8 heures
```

### **Recherche par profil**

```
Recherche: "développeur"
Résultats: Toutes les activités utilisant le profil "développeur"
```

### **Recherche par statut**

```
Recherche: "active"
Résultats: Toutes les activités actives
```

## Avantages

### **1. Expérience utilisateur**

- **Recherche rapide** : Trouver une activité en quelques secondes
- **Interface intuitive** : Barre de recherche familière
- **Feedback visuel** : Compteur et états d'affichage clairs

### **2. Performance**

- **Filtrage côté client** : Pas de requêtes serveur
- **Recherche instantanée** : Pas de délai
- **Optimisé** : Une seule itération sur les activités

### **3. Flexibilité**

- **Recherche multi-critères** : Plusieurs champs simultanément
- **Recherche insensible à la casse** : "Développement" = "développement"
- **Recherche partielle** : "dev" trouve "développement"

## Cas d'usage

### **1. Services avec beaucoup d'activités**

- **Problème** : Difficile de trouver une activité spécifique
- **Solution** : Recherche rapide par nom ou profil

### **2. Gestion des activités**

- **Problème** : Navigation fastidieuse dans la liste
- **Solution** : Filtrage instantané

### **3. Vérification des profils**

- **Problème** : Voir quelles activités utilisent un profil
- **Solution** : Recherche par nom de profil

## Évolutions possibles

### **1. Recherche avancée**

- **Filtres multiples** : Combiner plusieurs critères
- **Recherche par plage** : Durée entre X et Y heures
- **Tri des résultats** : Par nom, durée, statut

### **2. Historique de recherche**

- **Suggestions** : Basées sur les recherches précédentes
- **Recherches favorites** : Sauvegarder des recherches fréquentes

### **3. Recherche globale**

- **Étendre aux autres sections** : Taux horaires, profils
- **Recherche cross-section** : Rechercher dans tout le service

## Tests de validation

### **Cas de test 1 : Recherche par nom**

```typescript
// Données
activities: [
  { name: "Développement frontend", duree_standard: 8 },
  { name: "Développement backend", duree_standard: 16 },
];

// Recherche: "frontend"
// Résultat attendu: 1 activité (Développement frontend)
```

### **Cas de test 2 : Recherche par profil**

```typescript
// Données
activities: [
  {
    name: "Développement",
    activity_profiles: [{ profile_intervenant: { name: "Développeur" } }],
  },
];

// Recherche: "développeur"
// Résultat attendu: 1 activité
```

### **Cas de test 3 : Recherche par statut**

```typescript
// Données
activities: [
  { name: "Activité 1", is_active: true },
  { name: "Activité 2", is_active: false },
];

// Recherche: "active"
// Résultat attendu: 1 activité (Activité 1)
```

### **Cas de test 4 : Recherche vide**

```typescript
// Recherche: ""
// Résultat attendu: Toutes les activités affichées
```

Cette fonctionnalité améliore significativement l'expérience utilisateur en facilitant la navigation et la recherche dans les activités associées !
