# 📋 Phase 3 - Collaboration - Documentation Complète

## 🎯 Vue d'ensemble

Phase 3 implémente un système de collaboration complet avec :
1. **Système de commentaires** sur les tâches avec mentions
2. **Notifications en temps réel** pour suivre l'activité
3. **Timer pour feuilles de temps** pour enregistrer le temps automatiquement
4. **Système de mentions et tags** pour impliquer les membres de l'équipe

---

## 📦 Composants Créés

### Backend (Django)

#### Modèles (`backend/projects/models.py`)

##### 1. `TaskComment`
```python
class TaskComment(models.Model):
    task = ForeignKey(ProjectTask)
    author = ForeignKey(User)
    content = TextField()
    created_at = DateTimeField()
    updated_at = DateTimeField()
    parent = ForeignKey('self', null=True)  # Pour les réponses
    mentions = ManyToManyField(User)
    attachments = JSONField()  # URLs des pièces jointes
```

**Fonctionnalités:**
- Commentaires sur les tâches
- Réponses en fil de discussion
- Mentions d'utilisateurs (@username)
- Pièces jointes (URLs)
- Notifications automatiques

##### 2. `ProjectNotification`
```python
class ProjectNotification(models.Model):
    NOTIFICATION_TYPES = [
        ('task_assigned', 'Tâche assignée'),
        ('task_completed', 'Tâche terminée'),
        ('task_status_changed', 'Statut modifié'),
        ('deadline_approaching', 'Échéance proche'),
        ('comment_added', 'Commentaire ajouté'),
        ('mention', 'Mention'),
        ('budget_exceeded', 'Budget dépassé'),
        ('timesheet_validated', 'Feuille validée'),
        ('timesheet_rejected', 'Feuille rejetée'),
    ]

    recipient = ForeignKey(User)
    notification_type = CharField()
    title = CharField()
    message = TextField()
    is_read = BooleanField()
    related_project = ForeignKey(Project, null=True)
    related_task = ForeignKey(ProjectTask, null=True)
    related_comment = ForeignKey(TaskComment, null=True)
```

**Fonctionnalités:**
- 9 types de notifications différents
- Relations avec projet, tâche, commentaire
- Statut lu/non lu
- Création automatique lors d'événements

##### 3. `TimesheetTimer`
```python
class TimesheetTimer(models.Model):
    user = ForeignKey(User)
    project = ForeignKey(Project)
    task = ForeignKey(ProjectTask)
    start_time = DateTimeField()
    end_time = DateTimeField(null=True)
    description = TextField()
    is_running = BooleanField()
```

**Fonctionnalités:**
- Un seul timer actif par utilisateur
- Calcul automatique des heures
- Création automatique de TimeSheet à l'arrêt
- Validation : pas de timers multiples simultanés

#### Serializers (`backend/projects/serializers.py`)

- `TaskCommentSerializer` - Gère les commentaires avec auteur et mentions
- `ProjectNotificationSerializer` - Format les notifications avec titres liés
- `TimesheetTimerSerializer` - Calcule le temps écoulé en temps réel

#### ViewSets (`backend/projects/views.py`)

##### `TaskCommentViewSet`
```python
# Routes:
GET    /api/v1/projects/{id}/tasks/{id}/comments/        # Liste
POST   /api/v1/projects/{id}/tasks/{id}/comments/        # Créer
PATCH  /api/v1/projects/{id}/tasks/{id}/comments/{id}/  # Modifier
DELETE /api/v1/projects/{id}/tasks/{id}/comments/{id}/  # Supprimer
```

##### `ProjectNotificationViewSet`
```python
# Routes:
GET  /api/v1/projects/notifications/                    # Liste
GET  /api/v1/projects/notifications/unread_count/      # Compte non lues
POST /api/v1/projects/notifications/{id}/mark_as_read/ # Marquer lue
POST /api/v1/projects/notifications/mark_all_as_read/  # Tout marquer
```

##### `TimesheetTimerViewSet`
```python
# Routes:
GET  /api/v1/projects/timers/        # Liste des timers
POST /api/v1/projects/timers/        # Démarrer un timer
GET  /api/v1/projects/timers/active/ # Timer actif
POST /api/v1/projects/timers/{id}/stop/ # Arrêter le timer
```

#### URLs (`backend/projects/urls.py`)

Routes imbriquées pour commentaires:
```python
/api/v1/projects/{project_id}/tasks/{task_id}/comments/
```

Routes globales:
```python
/api/v1/projects/notifications/
/api/v1/projects/timers/
```

#### Migration

Fichier: `backend/projects/migrations/0003_taskcomment_projectnotification_timesheettimer.py`

Crée les 3 nouvelles tables avec toutes les relations.

---

### Frontend (React/TypeScript)

#### Composants

##### 1. `TaskComments.tsx`
**Localisation:** `frontend/src/components/projects/TaskComments.tsx`

**Fonctionnalités:**
- Affichage en fil de discussion
- Réponses aux commentaires
- Mentions d'utilisateurs (@username)
- Avatar avec initiales
- Temps relatif (il y a X minutes)
- Raccourci Ctrl+Enter pour envoyer
- Badge pour les mentions
- Support des pièces jointes (UI prête)

**Props:**
```typescript
interface TaskCommentsProps {
  taskId: number;
  projectId: string;
}
```

**Utilisation:**
```tsx
<TaskComments taskId={123} projectId="PROJ-2025-001" />
```

##### 2. `NotificationCenter.tsx`
**Localisation:** `frontend/src/components/projects/NotificationCenter.tsx`

**Fonctionnalités:**
- Dropdown avec icône de cloche
- Badge avec compteur non lues
- 9 types de notifications avec icônes
- Couleurs selon le type
- Navigation vers ressource liée
- Marquer comme lu au clic
- Marquer tout comme lu
- Rafraîchissement automatique (30s)
- Temps relatif

**Utilisation:**
```tsx
// Dans la barre de navigation
<NotificationCenter />
```

##### 3. `TimesheetTimer.tsx`
**Localisation:** `frontend/src/components/projects/TimesheetTimer.tsx`

**Fonctionnalités:**
- Chronomètre en temps réel (HH:MM:SS)
- Sélection de tâche
- Description optionnelle
- Un seul timer actif
- Calcul automatique des heures
- Création auto de TimeSheet à l'arrêt
- Guide d'utilisation intégré
- Validation : empêche plusieurs timers

**Props:**
```typescript
interface TimesheetTimerProps {
  projectId: string;
}
```

**Utilisation:**
```tsx
<TimesheetTimer projectId="PROJ-2025-001" />
```

##### 4. `TaskDetailModal.tsx`
**Localisation:** `frontend/src/components/projects/TaskDetailModal.tsx`

**Fonctionnalités:**
- Modal plein écran
- 2 onglets : Détails / Commentaires
- Affichage complet de la tâche
- Intégration du composant TaskComments
- Badge de statut
- Progression visuelle
- Dates formatées en français

**Props:**
```typescript
interface TaskDetailModalProps {
  task: any;
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
```

#### Hooks personnalisés

##### 1. `use-comments.ts`
```typescript
// Requêtes
useTaskComments(projectId, taskId)        // Liste des commentaires
useCreateComment(projectId, taskId)       // Créer un commentaire
useUpdateComment(projectId, taskId, id)   // Modifier
useDeleteComment(projectId, taskId, id)   // Supprimer
```

##### 2. `use-notifications.ts`
```typescript
// Requêtes existantes étendues
useNotifications()                  // Liste avec refresh 30s
useUnreadNotificationsCount()       // Compte avec refresh 10s
useMarkAsRead()                     // Marquer une notification
useMarkAllAsRead()                  // Tout marquer
```

##### 3. `use-timers.ts`
```typescript
// Requêtes
useActiveTimer()                    // Timer actif avec refresh 1s
useTimers(filters?)                 // Liste des timers
useStartTimer()                     // Démarrer
useStopTimer()                      // Arrêter
```

---

## 🚀 Intégration dans l'Application

### 1. Ajouter le NotificationCenter dans la barre de navigation

**Fichier:** `frontend/src/components/Layout.tsx` ou `Header.tsx`

```tsx
import { NotificationCenter } from '@/components/projects/NotificationCenter';

// Dans le header
<div className="flex items-center gap-4">
  <NotificationCenter />
  {/* Autres éléments */}
</div>
```

### 2. Ajouter le Timer dans ProjectDetailsPage

**Fichier:** `frontend/src/pages/ProjectDetailsPage.tsx`

```tsx
import { TimesheetTimer } from '@/components/projects/TimesheetTimer';

// Dans l'onglet "Feuilles de temps"
<TabsContent value="timesheets">
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div className="lg:col-span-2">
      <ProjectTimesheets projectId={projectId} />
    </div>
    <div>
      <TimesheetTimer projectId={projectId} />
    </div>
  </div>
</TabsContent>
```

### 3. Ajouter les commentaires dans ProjectPlanning

**Fichier:** `frontend/src/components/projects/ProjectPlanning.tsx`

```tsx
import { TaskDetailModal } from './TaskDetailModal';

// État
const [selectedTask, setSelectedTask] = useState(null);
const [detailsOpen, setDetailsOpen] = useState(false);

// Au clic sur une tâche
onClick={() => {
  setSelectedTask(task);
  setDetailsOpen(true);
}}

// Modal
<TaskDetailModal
  task={selectedTask}
  projectId={projectId}
  open={detailsOpen}
  onOpenChange={setDetailsOpen}
/>
```

---

## 🧪 Test de la Phase 3

### Backend

1. **Appliquer les migrations:**
```bash
cd backend
python manage.py migrate projects
```

2. **Tester l'API:**
```bash
# Notifications
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:8000/api/v1/projects/notifications/

# Timer actif
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:8000/api/v1/projects/timers/active/

# Commentaires
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:8000/api/v1/projects/PROJ-2025-001/tasks/1/comments/
```

### Frontend

1. **Lancer le dev server:**
```bash
cd frontend
npm run dev
```

2. **Tester les fonctionnalités:**

**Commentaires:**
- ✅ Ouvrir une tâche
- ✅ Ajouter un commentaire
- ✅ Mentionner un utilisateur avec @
- ✅ Répondre à un commentaire
- ✅ Voir les commentaires en temps réel

**Notifications:**
- ✅ Cliquer sur l'icône de cloche
- ✅ Voir le badge de compteur
- ✅ Cliquer sur une notification
- ✅ Navigation vers la ressource
- ✅ Marquer comme lu
- ✅ Marquer tout comme lu

**Timer:**
- ✅ Sélectionner une tâche
- ✅ Démarrer le timer
- ✅ Voir le chronomètre en temps réel
- ✅ Arrêter le timer
- ✅ Vérifier la création de la feuille de temps
- ✅ Essayer de démarrer un 2ème timer (doit être bloqué)

---

## 📊 Structure de la Base de Données

```sql
-- Nouvelle table: TaskComment
CREATE TABLE projects_taskcomment (
    id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES projects_projecttask(id),
    author_id INTEGER REFERENCES auth_user(id),
    content TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    parent_id INTEGER REFERENCES projects_taskcomment(id),
    attachments JSONB
);

CREATE TABLE projects_taskcomment_mentions (
    id SERIAL PRIMARY KEY,
    taskcomment_id INTEGER REFERENCES projects_taskcomment(id),
    user_id INTEGER REFERENCES auth_user(id)
);

-- Nouvelle table: ProjectNotification
CREATE TABLE projects_projectnotification (
    id SERIAL PRIMARY KEY,
    recipient_id INTEGER REFERENCES auth_user(id),
    notification_type VARCHAR(30),
    title VARCHAR(200),
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP,
    related_project_id VARCHAR(20) REFERENCES projects_project(id),
    related_task_id INTEGER REFERENCES projects_projecttask(id),
    related_comment_id INTEGER REFERENCES projects_taskcomment(id),
    related_timesheet_id INTEGER REFERENCES projects_timesheet(id)
);

-- Nouvelle table: TimesheetTimer
CREATE TABLE projects_timesheettimer (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES auth_user(id),
    project_id VARCHAR(20) REFERENCES projects_project(id),
    task_id INTEGER REFERENCES projects_projecttask(id),
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    description TEXT,
    is_running BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP
);
```

---

## 🔐 Permissions

### Backend
- Tous les endpoints requièrent `IsAuthenticated`
- Les commentaires sont filtrés par tâche
- Les notifications sont filtrées par utilisateur (recipient)
- Les timers sont filtrés par utilisateur

### Frontend
- Authentification via token
- Refresh automatique des données
- Gestion optimiste des mutations

---

## 🐛 Problèmes Connus & Limitations

### Commentaires
- ⚠️ Système de mentions nécessite conversion username → ID
- ⚠️ Pièces jointes UI prête mais upload non implémenté
- ⚠️ Pas de markdown dans les commentaires

### Notifications
- ⚠️ Pas de WebSocket (polling toutes les 30s)
- ⚠️ Notifications créées manuellement (pas de signaux Django)
- ⚠️ Pas de préférences utilisateur

### Timer
- ⚠️ Un seul timer actif (par design)
- ⚠️ Pas de pause/reprise
- ⚠️ Pas d'historique des timers

---

## 🚀 Améliorations Futures

### Court terme
1. Implémenter les signaux Django pour créer automatiquement les notifications
2. Ajouter WebSocket pour notifications en temps réel
3. Implémenter l'upload de pièces jointes
4. Ajouter le support Markdown dans les commentaires

### Moyen terme
1. Préférences de notifications par utilisateur
2. Email pour notifications importantes
3. Pause/reprise du timer
4. Historique et rapports des timers
5. Recherche dans les commentaires

### Long terme
1. Intégration Slack/Teams pour notifications
2. Système de tags personnalisés
3. Templates de commentaires
4. Analyse sentiment des commentaires
5. Suggestions automatiques de mentions

---

## 📝 Checklist d'Implémentation

### Backend ✅
- [x] Modèles créés
- [x] Migrations générées
- [x] Serializers implémentés
- [x] ViewSets créés
- [x] URLs configurées
- [x] Permissions définies

### Frontend ✅
- [x] Hooks personnalisés
- [x] Composant TaskComments
- [x] Composant NotificationCenter
- [x] Composant TimesheetTimer
- [x] Composant TaskDetailModal
- [x] Types TypeScript

### Intégration ⏳
- [ ] NotificationCenter dans Header
- [ ] Timer dans ProjectDetailsPage
- [ ] TaskDetailModal dans ProjectPlanning
- [ ] Tests bout-en-bout

---

## 📚 Références

- **Django REST Framework:** https://www.django-rest-framework.org/
- **React Query:** https://tanstack.com/query/latest
- **shadcn/ui:** https://ui.shadcn.com/
- **date-fns:** https://date-fns.org/

---

**Dernière mise à jour:** 2025-01-28
**Version:** Phase 3 - Collaboration
**Status:** ✅ Prêt pour intégration
