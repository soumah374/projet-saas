# 🧪 Guide de Test - Phase 1

## Prérequis

### Backend
```bash
cd backend
python manage.py runserver
```

### Frontend
```bash
cd frontend
npm run dev
```

L'application devrait être accessible sur `http://localhost:5173`

---

## 1. ✅ Test du Bug Fix (Import d'activités)

### Étapes de test

1. Aller dans l'admin Django : `http://localhost:8000/admin`
2. Section **Catalog** → **Activities**
3. Essayer d'importer des activités via l'endpoint API

**Résultat attendu :** ✅ Import réussi sans erreur

---

## 2. 📊 Test de la Vue Kanban

### Étapes de test

1. **Accéder à un projet**
   - Aller sur `http://localhost:5173/projects`
   - Cliquer sur un projet existant
   - Aller dans l'onglet **Planification**

2. **Basculer en vue Kanban**
   - Cliquer sur le bouton avec l'icône "grille" (à droite des filtres)
   - Observer la vue Kanban avec 4 colonnes

3. **Tester le drag & drop**
   - Glisser une tâche de "À faire" vers "En cours"
   - Vérifier que la tâche se déplace visuellement
   - ⚠️ Note : Le backend n'est pas encore configuré pour sauvegarder le changement

4. **Vérifier les actions sur les tâches**
   - Hover sur une carte de tâche
   - Vérifier la présence des boutons :
     - 👥 Assigner
     - ▶️ Démarrer
     - ✏️ Éditer
     - 👁️ Voir

### Résultat attendu
- ✅ Affichage de 4 colonnes distinctes
- ✅ Compteur de tâches par colonne
- ✅ Cartes compactes avec infos clés
- ✅ Boutons d'action fonctionnels

### Captures d'écran

**Vue Liste (avant):**
```
┌──────────────────────────────────────────────┐
│ [Liste] [Kanban]                             │
├──────────────────────────────────────────────┤
│ ▢ Tâche 1 - À faire                         │
│ ▢ Tâche 2 - En cours                        │
│ ▢ Tâche 3 - Terminé                         │
└──────────────────────────────────────────────┘
```

**Vue Kanban (nouveau):**
```
┌───────────┬───────────┬───────────┬───────────┐
│ À faire(2)│En cours(1)│En pause(0)│Terminé(1) │
├───────────┼───────────┼───────────┼───────────┤
│ [Tâche 1] │ [Tâche 2] │           │ [Tâche 3] │
│ [Tâche 4] │           │           │           │
└───────────┴───────────┴───────────┴───────────┘
```

---

## 3. ⚡ Test des Skeleton Loaders

### Étapes de test

1. **Tester sur la page projets**
   - Aller sur `http://localhost:5173/projects`
   - Ouvrir les DevTools (F12) → Network
   - Throttling: "Slow 3G" (pour ralentir le chargement)
   - Rafraîchir la page (Ctrl+R)

2. **Observer les skeletons**
   - Statistiques : 4 cartes avec animation de skeleton
   - Liste/Grille : Skeleton de projets qui pulse

3. **Tester sur la page détails**
   - Cliquer sur un projet
   - Observer le skeleton de la page complète

### Résultat attendu

**Avant :**
```
⏳ Loading... (spinner au centre)
```

**Après :**
```
╔════════════════════╗
║ ▓▓▓▓▓░░░░░░       ║ ← Animation pulsante
║ ▓▓░░░░░░          ║
║ ▓▓▓▓▓▓▓░░░░░░░    ║
╚════════════════════╝
```

- ✅ Skeletons apparaissent immédiatement
- ✅ Animation de "pulse" visible
- ✅ Layout préservé (pas de "saut" de contenu)
- ✅ Transition fluide skeleton → contenu réel

---

## 4. 📱 Test Responsive Mobile

### Étapes de test

1. **Ouvrir les DevTools**
   - F12 → Mode responsive (Ctrl+Shift+M)

2. **Tester différentes tailles**

   **Mobile (375px):**
   - Vue automatiquement en grille
   - Boutons Liste/Kanban masqués
   - Filtres en colonne verticale
   - Search bar pleine largeur

   **Tablette (768px):**
   - Vue grille ou liste au choix
   - Boutons Liste/Kanban visibles
   - Filtres en 2 lignes

   **Desktop (1024px+):**
   - Toutes les options disponibles
   - Layout horizontal optimal

3. **Tester les modals**
   - Sur mobile : devrait être un Drawer (bottom sheet)
   - Sur desktop : Dialog classique

### Résultat attendu

**Mobile (< 768px):**
```
┌─────────────────┐
│ 🔍 Search...    │
├─────────────────┤
│ Statut: [▼]     │
│ Type: [▼]       │
│ Priorité: [▼]   │
├─────────────────┤
│ [Projet 1]      │
│ [Projet 2]      │
│ [Projet 3]      │
└─────────────────┘
```

**Desktop (≥ 768px):**
```
┌────────────────────────────────────┐
│ 🔍 [Search...] [Statut▼] [Type▼]  │
│ [Priorité▼] [□Liste] [⊞Kanban]    │
├────────┬────────┬────────┐         │
│Projet 1│Projet 2│Projet 3│         │
└────────┴────────┴────────┘         │
```

- ✅ Adaptation automatique du layout
- ✅ Tous les filtres accessibles
- ✅ Pas de scroll horizontal
- ✅ Boutons tactiles assez grands (>44px)

---

## 5. ⚡ Test Création Rapide de Tâche

### Étapes de test

1. **Accéder à un projet**
   - Aller dans Planification → Activités

2. **Cliquer sur le bouton**
   - "+ Ajouter une tâche rapidement"

3. **Observer l'interface**
   - Input inline apparaît avec focus automatique
   - Fond bleu clair avec bordure bleue
   - Boutons ✓ (valider) et ✗ (annuler)
   - Hint avec raccourcis clavier

4. **Tester la création**

   **Test 1 : Création réussie**
   - Taper "Ma nouvelle tâche"
   - Appuyer sur `Enter`
   - Vérifier le toast de succès
   - Vérifier que la tâche apparaît dans la liste

   **Test 2 : Validation vide**
   - Cliquer sur le bouton sans saisir de texte
   - Vérifier le toast d'erreur
   - Input reste ouvert

   **Test 3 : Annulation**
   - Taper du texte
   - Appuyer sur `Esc`
   - Vérifier que l'input se ferme
   - Texte perdu

   **Test 4 : Bouton Annuler**
   - Taper du texte
   - Cliquer sur ✗
   - Vérifier fermeture

### Résultat attendu

**État initial :**
```
┌──────────────────────────────────┐
│ [+] Ajouter une tâche rapidement │
└──────────────────────────────────┘
```

**État création :**
```
┌────────────────────────────────────┐
│ [Titre de la tâche...] [✓] [✗]    │
│ Appuyez sur Enter ou Esc           │
└────────────────────────────────────┘
```

**Après création :**
```
✅ Tâche créée avec succès

┌──────────────────────────────────┐
│ [+] Ajouter une tâche rapidement │
└──────────────────────────────────┘
↓
Nouvelle tâche apparaît dans la liste
```

- ✅ Auto-focus sur input
- ✅ Enter = création
- ✅ Esc = annulation
- ✅ Toast de confirmation
- ✅ Refresh automatique de la liste
- ✅ Input se ferme après création

---

## ⚠️ Problèmes Connus & Limitations

### Vue Kanban
- ❌ Drag & drop ne sauvegarde pas encore (backend à implémenter)
- ⚠️ Nécessite implémentation endpoint PATCH pour update status

### Création Rapide
- ✅ **CORRIGÉ** : Erreur 400 "project field required"
- ✅ Champ `project` maintenant en `read_only`

### Responsive
- ⚠️ Sur très petit écran (< 320px), certains textes peuvent être tronqués
- 💡 Solution : Ajouter text-truncate sur les labels

---

## 📊 Checklist de Test

### Fonctionnalités
- [ ] Bug fix import activités
- [ ] Vue Kanban affichage
- [ ] Vue Kanban actions
- [ ] Skeleton projets
- [ ] Skeleton détails
- [ ] Responsive mobile
- [ ] Responsive tablette
- [ ] Responsive desktop
- [ ] Création rapide (Enter)
- [ ] Création rapide (Esc)
- [ ] Création rapide (validation)

### Navigateurs
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari

### Appareils
- [ ] Desktop (> 1024px)
- [ ] Tablette (768px)
- [ ] Mobile (375px)

---

## 🐛 Signaler un Bug

Si vous trouvez un bug lors des tests :

1. Ouvrir une issue GitHub
2. Inclure :
   - Navigateur et version
   - Taille d'écran
   - Étapes de reproduction
   - Capture d'écran
   - Message d'erreur console (F12)

---

## ✅ Tests Réussis = Prêt pour Phase 2 !

Si tous les tests passent, nous pouvons passer à la **Phase 2 : Visualisation** avec :
- Gantt chart interactif
- Graphiques de progression
- Dashboard amélioré
- Calendrier timesheets

---

**Dernière mise à jour :** 2025-01-28
**Version testée :** Phase 1 - Quick Wins
**Status :** ✅ Prêt pour test
