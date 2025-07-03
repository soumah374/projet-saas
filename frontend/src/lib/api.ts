import { config } from './config';
import type {
  User,
  UserList,
  UserCreate,
  UserUpdate,
  Project,
  ProjectList,
  ProjectMember,
  ProjectTask,
  Team,
  TeamMember,
  Document,
  PaginatedResponse,
  ProjectStatistics,
  UserStatistics,
  LoginRequest,
  LoginResponse,
  OTPRequest,
  OTPVerification,
  CreateProjectForm,
  CreateTaskForm,
  CreateTeamMemberForm,
} from './types';

// Configuration de base pour les requêtes API
const API_BASE = config.api.baseUrl;

// Fonction utilitaire pour les requêtes API
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  
  // Récupérer le token d'authentification
  const token = localStorage.getItem('access_token');
  
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Ne pas définir Content-Type pour les requêtes FormData
  if (options.body instanceof FormData) {
    delete defaultHeaders['Content-Type'];
  }

  // Ajouter le header d'autorisation si un token existe
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
    console.log('Adding Authorization header with token:', token.substring(0, 20) + '...');
  } else {
    console.log('No access token found in localStorage');
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  if (!response.ok) {
    // Handle authentication errors
    if (response.status === 401 || response.status === 403) {
      console.log('Authentication error:', response.status, response.statusText);
      
      // Only clear tokens and redirect if we have a token (user was logged in)
      const token = localStorage.getItem('access_token');
      if (token) {
        console.log('User was authenticated, clearing tokens and redirecting');
        // Clear invalid tokens
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        // Redirect to login
        window.location.href = '/login';
      }
    }
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  // Gérer les réponses vides (comme pour DELETE)
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

// ===== AUTHENTIFICATION =====

export const authAPI = {
  // Connexion classique avec username/password
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    return apiRequest<LoginResponse>('/login/', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  // Demander un code OTP
  requestOTP: async (data: OTPRequest): Promise<{ message: string; email: string }> => {
    return apiRequest<{ message: string; email: string }>('/otp/request/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Vérifier le code OTP
  verifyOTP: async (data: OTPVerification): Promise<LoginResponse> => {
    return apiRequest<LoginResponse>('/otp/verify/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Renvoyer un code OTP
  resendOTP: async (data: OTPRequest): Promise<{ message: string; email: string }> => {
    return apiRequest<{ message: string; email: string }>('/otp/resend/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Rafraîchir le token
  refreshToken: async (refresh: string): Promise<{ access: string }> => {
    return apiRequest<{ access: string }>('/token/refresh/', {
      method: 'POST',
      body: JSON.stringify({ refresh }),
    });
  },
};

// ===== UTILISATEURS =====

export const usersAPI = {
  // Liste des utilisateurs
  getUsers: async (params?: {
    search?: string;
    ordering?: string;
    page?: number;
    is_active?: boolean;
    profile__role?: string;
    profile__department?: string;
  }): Promise<PaginatedResponse<UserList>> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    const queryString = searchParams.toString();
    const endpoint = queryString ? `/users/?${queryString}` : '/users/';
    
    return apiRequest<PaginatedResponse<UserList>>(endpoint);
  },

  // Détails d'un utilisateur
  getUser: async (id: number): Promise<User> => {
    return apiRequest<User>(`/users/${id}/`);
  },

  // Créer un utilisateur
  createUser: async (userData: UserCreate): Promise<User> => {
    return apiRequest<User>('/users/', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  // Mettre à jour un utilisateur
  updateUser: async (id: number, userData: UserUpdate): Promise<User> => {
    return apiRequest<User>(`/users/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  // Supprimer un utilisateur
  deleteUser: async (id: number): Promise<void> => {
    return apiRequest<void>(`/users/${id}/`, {
      method: 'DELETE',
    });
  },

  // Informations de l'utilisateur connecté
  getMe: async (): Promise<User> => {
    return apiRequest<User>('/users/me/');
  },

  // Mettre à jour les informations de l'utilisateur connecté
  updateMe: async (userData: UserUpdate): Promise<User> => {
    return apiRequest<User>('/users/update_me/', {
      method: 'PATCH',
      body: JSON.stringify(userData),
    });
  },

  // Changer le mot de passe
  changePassword: async (data: {
    old_password: string;
    new_password: string;
    new_password_confirm: string;
  }): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>('/users/change_password/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Statistiques des utilisateurs
  getStatistics: async (): Promise<UserStatistics> => {
    return apiRequest<UserStatistics>('/users/statistics/');
  },
};

// ===== PROJETS =====

export const projectsAPI = {
  // Liste des projets
  getProjects: async (params?: {
    search?: string;
    ordering?: string;
    page?: number;
    status?: string;
    type?: string;
    priority?: string;
    category?: string;
  }): Promise<PaginatedResponse<ProjectList>> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    const queryString = searchParams.toString();
    const endpoint = queryString ? `/projects/?${queryString}` : '/projects/';
    
    return apiRequest<PaginatedResponse<ProjectList>>(endpoint);
  },

  // Détails d'un projet
  getProject: async (id: string): Promise<Project> => {
    return apiRequest<Project>(`/projects/${id}/`);
  },

  // Créer un projet
  createProject: async (projectData: CreateProjectForm): Promise<Project> => {
    return apiRequest<Project>('/projects/', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
  },

  // Mettre à jour un projet
  updateProject: async (id: string, projectData: Partial<CreateProjectForm>): Promise<Project> => {
    return apiRequest<Project>(`/projects/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(projectData),
    });
  },

  // Supprimer un projet
  deleteProject: async (id: string): Promise<void> => {
    return apiRequest<void>(`/projects/${id}/`, {
      method: 'DELETE',
    });
  },

  // Statistiques des projets
  getStatistics: async (): Promise<ProjectStatistics> => {
    return apiRequest<ProjectStatistics>('/projects/statistics/');
  },

  // Projets de l'utilisateur connecté
  getMyProjects: async (): Promise<ProjectList[]> => {
    return apiRequest<ProjectList[]>('/projects/my_projects/');
  },

  // Projets où l'utilisateur est membre de l'équipe
  getTeamProjects: async (): Promise<ProjectList[]> => {
    return apiRequest<ProjectList[]>('/projects/team_projects/');
  },

  // Projets avec échéances proches
  getUpcomingDeadlines: async (): Promise<ProjectList[]> => {
    return apiRequest<ProjectList[]>('/projects/upcoming_deadlines/');
  },

  // Mettre à jour la progression d'un projet
  updateProgress: async (id: string, progress: number): Promise<{ progress: number }> => {
    return apiRequest<{ progress: number }>(`/projects/${id}/update_progress/`, {
      method: 'POST',
      body: JSON.stringify({ progress }),
    });
  },

  // Ajouter un membre à un projet
  addMember: async (projectId: string, memberData: CreateTeamMemberForm): Promise<ProjectMember> => {
    return apiRequest<ProjectMember>(`/projects/${projectId}/add_member/`, {
      method: 'POST',
      body: JSON.stringify(memberData),
    });
  },

  // Retirer un membre d'un projet
  removeMember: async (projectId: string, userId: number): Promise<void> => {
    return apiRequest<void>(`/projects/${projectId}/remove_member/`, {
      method: 'DELETE',
      body: JSON.stringify({ user_id: userId }),
    });
  },
};

// ===== MEMBRES DE PROJET =====

export const projectMembersAPI = {
  // Liste des membres d'un projet
  getProjectMembers: async (projectId: string): Promise<PaginatedResponse<ProjectMember>> => {
    return apiRequest<PaginatedResponse<ProjectMember>>(`/projects/${projectId}/members/`);
  },

  // Ajouter un membre à un projet
  addProjectMember: async (projectId: string, memberData: CreateTeamMemberForm): Promise<ProjectMember> => {
    return apiRequest<ProjectMember>(`/projects/${projectId}/members/`, {
      method: 'POST',
      body: JSON.stringify(memberData),
    });
  },

  // Mettre à jour un membre de projet
  updateProjectMember: async (
    projectId: string,
    memberId: number,
    memberData: Partial<CreateTeamMemberForm>
  ): Promise<ProjectMember> => {
    return apiRequest<ProjectMember>(`/projects/${projectId}/members/${memberId}/`, {
      method: 'PATCH',
      body: JSON.stringify(memberData),
    });
  },

  // Supprimer un membre de projet
  deleteProjectMember: async (projectId: string, memberId: number): Promise<void> => {
    return apiRequest<void>(`/projects/${projectId}/members/${memberId}/`, {
      method: 'DELETE',
    });
  },
};

// ===== TÂCHES DE PROJET =====

export const projectTasksAPI = {
  // Liste des tâches d'un projet
  getProjectTasks: async (projectId: string, params?: {
    status?: string;
    assigned_to?: number;
    ordering?: string;
    page?: number;
  }): Promise<PaginatedResponse<ProjectTask>> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    const queryString = searchParams.toString();
    const endpoint = queryString 
      ? `/projects/${projectId}/tasks/?${queryString}` 
      : `/projects/${projectId}/tasks/`;
    
    return apiRequest<PaginatedResponse<ProjectTask>>(endpoint);
  },

  // Créer une tâche
  createProjectTask: async (projectId: string, taskData: CreateTaskForm): Promise<ProjectTask> => {
    return apiRequest<ProjectTask>(`/projects/${projectId}/tasks/`, {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
  },

  // Mettre à jour une tâche
  updateProjectTask: async (
    projectId: string,
    taskId: number,
    taskData: Partial<CreateTaskForm>
  ): Promise<ProjectTask> => {
    return apiRequest<ProjectTask>(`/projects/${projectId}/tasks/${taskId}/`, {
      method: 'PATCH',
      body: JSON.stringify(taskData),
    });
  },

  // Supprimer une tâche
  deleteProjectTask: async (projectId: string, taskId: number): Promise<void> => {
    return apiRequest<void>(`/projects/${projectId}/tasks/${taskId}/`, {
      method: 'DELETE',
    });
  },

  // Mettre à jour le statut d'une tâche
  updateTaskStatus: async (projectId: string, taskId: number, status: string): Promise<{ status: string }> => {
    return apiRequest<{ status: string }>(`/projects/${projectId}/tasks/${taskId}/update_status/`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    });
  },
};

// ===== ÉQUIPES =====

export const teamsAPI = {
  // Liste des équipes
  getTeams: async (params?: {
    search?: string;
    ordering?: string;
    page?: number;
    is_active?: boolean;
    created_by?: number;
  }): Promise<PaginatedResponse<Team>> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    const queryString = searchParams.toString();
    const endpoint = queryString ? `/teams/?${queryString}` : '/teams/';
    
    return apiRequest<PaginatedResponse<Team>>(endpoint);
  },

  // Détails d'une équipe
  getTeam: async (id: number): Promise<Team> => {
    return apiRequest<Team>(`/teams/${id}/`);
  },

  // Créer une équipe
  createTeam: async (teamData: { name: string; description?: string }): Promise<Team> => {
    return apiRequest<Team>('/teams/', {
      method: 'POST',
      body: JSON.stringify(teamData),
    });
  },

  // Mettre à jour une équipe
  updateTeam: async (id: number, teamData: { name?: string; description?: string }): Promise<Team> => {
    return apiRequest<Team>(`/teams/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(teamData),
    });
  },

  // Supprimer une équipe
  deleteTeam: async (id: number): Promise<void> => {
    return apiRequest<void>(`/teams/${id}/`, {
      method: 'DELETE',
    });
  },

  // Ajouter un membre à une équipe
  addTeamMember: async (teamId: number, memberData: {
    user: number;
    role: string;
    is_active?: boolean;
  }): Promise<TeamMember> => {
    return apiRequest<TeamMember>(`/teams/${teamId}/add_member/`, {
      method: 'POST',
      body: JSON.stringify(memberData),
    });
  },
};

// ===== MEMBRES D'ÉQUIPE =====

export const teamMembersAPI = {
  // Liste des membres d'équipe
  getTeamMembers: async (params?: {
    team?: number;
    role?: string;
    is_active?: boolean;
    ordering?: string;
    page?: number;
  }): Promise<PaginatedResponse<TeamMember>> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    const queryString = searchParams.toString();
    const endpoint = queryString ? `/teams/members/?${queryString}` : '/teams/members/';
    
    return apiRequest<PaginatedResponse<TeamMember>>(endpoint);
  },

  // Détails d'un membre d'équipe
  getTeamMember: async (id: number): Promise<TeamMember> => {
    return apiRequest<TeamMember>(`/teams/members/${id}/`);
  },

  // Créer un membre d'équipe
  createTeamMember: async (memberData: {
    team: number;
    user: number;
    role: string;
    is_active?: boolean;
  }): Promise<TeamMember> => {
    return apiRequest<TeamMember>('/teams/members/', {
      method: 'POST',
      body: JSON.stringify(memberData),
    });
  },

  // Mettre à jour un membre d'équipe
  updateTeamMember: async (
    id: number,
    memberData: Partial<{
      team: number;
      user: number;
      role: string;
      is_active: boolean;
    }>
  ): Promise<TeamMember> => {
    return apiRequest<TeamMember>(`/teams/members/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(memberData),
    });
  },

  // Supprimer un membre d'équipe
  deleteTeamMember: async (id: number): Promise<void> => {
    return apiRequest<void>(`/teams/members/${id}/`, {
      method: 'DELETE',
    });
  },
};

// ===== DOCUMENTS =====

export const documentsAPI = {
  // Liste des documents
  getDocuments: async (projectId?: string): Promise<PaginatedResponse<Document>> => {
    const endpoint = projectId ? `/documents/?project=${projectId}` : '/documents/';
    return apiRequest<PaginatedResponse<Document>>(endpoint);
  },

  // Créer un document
  createDocument: async (formData: FormData): Promise<Document> => {
    return apiRequest<Document>('/documents/', {
      method: 'POST',
      body: formData,
    });
  },

  // Mettre à jour un document
  updateDocument: async (id: number, formData: FormData): Promise<Document> => {
    return apiRequest<Document>(`/documents/${id}/`, {
      method: 'PATCH',
      body: formData,
    });
  },

  // Supprimer un document
  deleteDocument: async (id: number): Promise<void> => {
    return apiRequest<void>(`/documents/${id}/`, {
      method: 'DELETE',
    });
  },
}; 