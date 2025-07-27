# Intégration API SAKOM

Ce document décrit l'intégration complète du schéma OpenAPI SAKOM dans le frontend React.

## 📋 Schéma OpenAPI

Le schéma API est basé sur le fichier `SAKOM API.yaml` qui définit toutes les endpoints et types de données de l'API SAKOM.

### Endpoints disponibles

#### 🔐 Authentification

- `POST /api/v1/login/` - Connexion classique avec username/password
- `POST /api/v1/otp/request/` - Demander un code OTP
- `POST /api/v1/otp/verify/` - Vérifier le code OTP
- `POST /api/v1/otp/resend/` - Renvoyer un code OTP
- `POST /api/v1/token/refresh/` - Rafraîchir le token JWT

#### 👥 Utilisateurs

- `GET /api/v1/users/` - Liste des utilisateurs
- `GET /api/v1/users/{id}/` - Détails d'un utilisateur
- `POST /api/v1/users/` - Créer un utilisateur
- `PUT /api/v1/users/{id}/` - Mettre à jour un utilisateur
- `DELETE /api/v1/users/{id}/` - Supprimer un utilisateur
- `GET /api/v1/users/me/` - Informations de l'utilisateur connecté
- `PATCH /api/v1/users/update_me/` - Mettre à jour ses informations
- `POST /api/v1/users/change_password/` - Changer le mot de passe
- `GET /api/v1/users/statistics/` - Statistiques des utilisateurs

#### 📊 Projets

- `GET /api/v1/projects/` - Liste des projets
- `GET /api/v1/projects/{id}/` - Détails d'un projet
- `POST /api/v1/projects/` - Créer un projet
- `PATCH /api/v1/projects/{id}/` - Mettre à jour un projet
- `DELETE /api/v1/projects/{id}/` - Supprimer un projet
- `GET /api/v1/projects/statistics/` - Statistiques des projets
- `GET /api/v1/projects/my_projects/` - Mes projets
- `GET /api/v1/projects/team_projects/` - Projets de l'équipe
- `GET /api/v1/projects/upcoming_deadlines/` - Échéances proches
- `POST /api/v1/projects/{id}/update_progress/` - Mettre à jour la progression
- `POST /api/v1/projects/{id}/add_member/` - Ajouter un membre
- `DELETE /api/v1/projects/{id}/remove_member/` - Retirer un membre

#### 👥 Membres de projet

- `GET /api/v1/projects/{project_pk}/members/` - Liste des membres
- `POST /api/v1/projects/{project_pk}/members/` - Ajouter un membre
- `GET /api/v1/projects/{project_pk}/members/{id}/` - Détails d'un membre
- `PUT /api/v1/projects/{project_pk}/members/{id}/` - Mettre à jour un membre
- `DELETE /api/v1/projects/{project_pk}/members/{id}/` - Supprimer un membre

#### ✅ Activités de projet

- `GET /api/v1/projects/{project_pk}/tasks/` - Liste des activités
- `POST /api/v1/projects/{project_pk}/tasks/` - Créer une activité
- `GET /api/v1/projects/{project_pk}/tasks/{id}/` - Détails d'une activité
- `PUT /api/v1/projects/{project_pk}/tasks/{id}/` - Mettre à jour une activité
- `DELETE /api/v1/projects/{project_pk}/tasks/{id}/` - Supprimer une activité
- `POST /api/v1/projects/{project_pk}/tasks/{id}/update_status/` - Mettre à jour le statut

#### 🏢 Équipes

- `GET /api/v1/teams/` - Liste des équipes
- `GET /api/v1/teams/{id}/` - Détails d'une équipe
- `POST /api/v1/teams/` - Créer une équipe
- `PUT /api/v1/teams/{id}/` - Mettre à jour une équipe
- `DELETE /api/v1/teams/{id}/` - Supprimer une équipe
- `POST /api/v1/teams/{id}/add_member/` - Ajouter un membre

#### 👥 Membres d'équipe

- `GET /api/v1/teams/members/` - Liste des membres d'équipe
- `POST /api/v1/teams/members/` - Créer un membre d'équipe
- `GET /api/v1/teams/members/{id}/` - Détails d'un membre
- `PUT /api/v1/teams/members/{id}/` - Mettre à jour un membre
- `DELETE /api/v1/teams/members/{id}/` - Supprimer un membre

#### 📄 Documents

- `GET /api/v1/documents/` - Liste des documents
- `GET /api/v1/documents/{id}/` - Détails d'un document
- `POST /api/v1/documents/` - Créer un document
- `PUT /api/v1/documents/{id}/` - Mettre à jour un document
- `DELETE /api/v1/documents/{id}/` - Supprimer un document
- `POST /api/v1/documents/{id}/make_public/` - Rendre public
- `POST /api/v1/documents/{id}/make_private/` - Rendre privé

## 🏗️ Architecture Frontend

### Types TypeScript

Tous les types sont définis dans `src/lib/types.ts` et correspondent exactement au schéma OpenAPI :

```typescript
// Enums
export type ProjectType =
  | "Événementiel"
  | "Communication"
  | "Audiovisuel"
  | "Production"
  | "Digital"
  | "Conseil";
export type ProjectStatus =
  | "Planification"
  | "En cours"
  | "Production"
  | "En pause"
  | "Terminé";
export type ProjectPriority = "Basse" | "Normale" | "Haute" | "Urgente";

// Interfaces
export interface Project {
  id: string;
  title: string;
  description: string;
  type: ProjectType;
  status: ProjectStatus;
  priority: ProjectPriority;
  // ... autres propriétés
}
```

### Fonctions API

Les fonctions API sont organisées par domaine dans `src/lib/api.ts` :

```typescript
// Authentification
export const authAPI = {
  login: async (credentials: LoginRequest): Promise<LoginResponse>,
  requestOTP: async (data: OTPRequest): Promise<{ message: string; email: string }>,
  verifyOTP: async (data: OTPVerification): Promise<LoginResponse>,
  // ...
};

// Projets
export const projectsAPI = {
  getProjects: async (params?: ProjectFilters): Promise<PaginatedResponse<ProjectList>>,
  getProject: async (id: string): Promise<Project>,
  createProject: async (data: CreateProjectForm): Promise<Project>,
  // ...
};
```

### Hooks React Query

Les hooks sont organisés par domaine et utilisent React Query pour la gestion du cache :

```typescript
// src/hooks/use-projects.ts
export const useProjects = (params?: ProjectFilters) => {
  return useQuery({
    queryKey: ["projects", params],
    queryFn: () => projectsAPI.getProjects(params),
  });
};

export const useCreateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProjectForm) => projectsAPI.createProject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
};
```

## 🔧 Configuration

### Configuration API

```typescript
// src/lib/config.ts
export const config = {
  api: {
    baseUrl: import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1",
    timeout: 10000,
  },
  // ...
};
```

### Variables d'environnement

```env
# .env
VITE_API_URL=http://localhost:8000/api/v1
```

## 📝 Utilisation

### Exemple d'utilisation dans un composant

```typescript
import { useProjects, useCreateProject } from "@/hooks/use-projects";
import { useUsers } from "@/hooks/use-users";

function ProjectManagement() {
  const { data: projects, isLoading } = useProjects({
    status: "En cours",
    ordering: "-created_at",
  });

  const { data: users } = useUsers();
  const createProject = useCreateProject();

  const handleCreateProject = (data: CreateProjectForm) => {
    createProject.mutate(data, {
      onSuccess: () => {
        toast.success("Projet créé avec succès");
      },
      onError: (error) => {
        toast.error("Erreur lors de la création du projet");
      },
    });
  };

  if (isLoading) return <div>Chargement...</div>;

  return (
    <div>
      {projects?.results.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
```

## 🔒 Authentification

L'API supporte deux méthodes d'authentification :

### 1. Authentification classique (username/password)

```typescript
const { login } = authAPI;
const response = await login({ username: "user", password: "pass" });
// Stocker le token dans localStorage
localStorage.setItem("access_token", response.access);
```

### 2. Authentification OTP

```typescript
const { requestOTP, verifyOTP } = authAPI;

// Demander un code OTP
await requestOTP({ email: "user@example.com" });

// Vérifier le code OTP
const response = await verifyOTP({
  email: "user@example.com",
  otp_code: "123456",
});
```

## 📊 Gestion des erreurs

Toutes les fonctions API gèrent automatiquement les erreurs HTTP et retournent des erreurs typées :

```typescript
try {
  const project = await projectsAPI.getProject("PROJ-2024-001");
} catch (error) {
  if (error instanceof Error) {
    console.error("Erreur API:", error.message);
    toast.error(error.message);
  }
}
```

## 🔄 Cache et invalidation

React Query gère automatiquement le cache et l'invalidation :

```typescript
const createProject = useCreateProject();

// Après création, le cache des projets est automatiquement invalidé
createProject.mutate(projectData);
```

## 📱 Responsive et UX

- Tous les composants sont responsives
- Gestion des états de chargement
- Messages d'erreur utilisateur-friendly
- Optimistic updates pour une meilleure UX
- Pagination automatique pour les listes

## 🧪 Tests

Les hooks peuvent être testés avec React Testing Library :

```typescript
import { renderHook, waitFor } from "@testing-library/react";
import { useProjects } from "@/hooks/use-projects";

test("useProjects returns projects data", async () => {
  const { result } = renderHook(() => useProjects());

  await waitFor(() => {
    expect(result.current.data).toBeDefined();
  });
});
```

## 🚀 Déploiement

1. Configurer les variables d'environnement
2. Build de l'application : `npm run build`
3. Déployer les fichiers statiques
4. Configurer le reverse proxy pour l'API

## 📚 Ressources

- [Documentation OpenAPI SAKOM](./SAKOM%20API.yaml)
- [React Query Documentation](https://tanstack.com/query/latest)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Vite Documentation](https://vitejs.dev/guide/)
