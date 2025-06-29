import { config } from './config';

// API configuration
const API_BASE_URL = config.api.baseUrl;

// Types for API responses
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  is_active: boolean;
  date_joined: string;
  last_login?: string;
  profile?: {
    role?: string;
    phone?: string;
    avatar?: string;
    bio?: string;
    department?: string;
    position?: string;
    hire_date?: string;
  };
}

export interface ProjectMember {
  id: number;
  user: User;
  user_id: number;
  role: string;
  joined_at: string;
  is_active: boolean;
}

export interface ProjectBudget {
  id: number;
  production: number;
  personnel: number;
  marketing: number;
  other: number;
  total: number;
}

export interface ProjectTask {
  id: number;
  title: string;
  description: string;
  status: string;
  assigned_to?: User;
  assigned_to_id?: number;
  due_date: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  objectives?: string;
  type: string;
  category?: string;
  status: string;
  priority: string;
  start_date?: string;
  deadline: string;
  created_at: string;
  updated_at: string;
  progress: number;
  budget?: string;
  client: string;
  created_by: User;
  team_members?: ProjectMember[];
  budget_details?: ProjectBudget;
  tasks?: ProjectTask[];
  tags?: string[];
  days_remaining?: number;
  is_overdue: boolean;
  team_count?: number;
}

export interface ProjectStatistics {
  total_projects: number;
  active_projects: number;
  completed_projects: number;
  average_progress: number;
  overdue_projects: number;
  projects_by_type: Array<{ type: string; count: number }>;
  projects_by_status: Array<{ status: string; count: number }>;
}

export interface CreateProjectData {
  title: string;
  description: string;
  objectives?: string;
  type: string;
  category?: string;
  status: string;
  priority: string;
  start_date?: string;
  deadline: string;
  budget?: string;
  client: string;
  tags?: string[];
  budget_details?: {
    production: number;
    personnel: number;
    marketing: number;
    other: number;
  };
  team_members?: Array<{
    user_id: number;
    role: string;
  }>;
}

export interface UpdateProjectData {
  title: string;
  description: string;
  objectives?: string;
  type: string;
  category?: string;
  status: string;
  priority: string;
  start_date?: string;
  deadline: string;
  budget: string;
  client: string;
  tags?: string[];
  budget_details: {
    production: number;
    personnel: number;
    marketing: number;
    other: number;
  };
  team_members: {
    user_id: number;
    role: string;
  }[];
}

export interface TeamMember {
  id: number;
  user: User;
  role: string;
  joined_at: string;
  is_active: boolean;
}

export interface Team {
  id: number;
  name: string;
  description: string;
  created_by: User;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  member_count: number;
  team_members?: TeamMember[];
}

export interface CreateTaskData {
  title: string;
  description: string;
  status: string;
  assigned_to_id?: number;
  due_date: string;
}

export interface UpdateTaskData extends CreateTaskData {
  id: number;
}

// Helper function for API calls
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, defaultOptions);
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Handle paginated responses
    if (data && typeof data === 'object' && 'results' in data && Array.isArray(data.results)) {
      return data.results as T;
    }
    
    return data;
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}

// Project API functions
export const projectApi = {
  // Get all projects
  getProjects: async (params?: {
    search?: string;
    status?: string;
    type?: string;
    priority?: string;
    ordering?: string;
  }): Promise<Project[]> => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.append('search', params.search);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.type) searchParams.append('type', params.type);
    if (params?.priority) searchParams.append('priority', params.priority);
    if (params?.ordering) searchParams.append('ordering', params.ordering);
    
    const queryString = searchParams.toString();
    const endpoint = `/projects/${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiCall<PaginatedResponse<Project> | Project[]>(endpoint);
    
    // If it's a paginated response, return the results
    if (response && typeof response === 'object' && 'results' in response) {
      return (response as PaginatedResponse<Project>).results;
    }
    
    // If it's already an array, return it directly
    if (Array.isArray(response)) {
      return response;
    }
    
    // Fallback to empty array
    return [];
  },

  // Get a single project
  getProject: async (id: string): Promise<Project> => {
    return apiCall<Project>(`/projects/${id}/`);
  },

  // Create a new project
  createProject: async (data: CreateProjectData): Promise<Project> => {
    return apiCall<Project>('/projects/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Update a project
  updateProject: async (id: string, data: UpdateProjectData): Promise<Project> => {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE_URL}/projects/${id}/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Erreur lors de la mise à jour du projet');
    }

    return response.json();
  },

  // Delete a project
  deleteProject: async (id: string): Promise<void> => {
    return apiCall<void>(`/projects/${id}/`, {
      method: 'DELETE',
    });
  },

  // Get project statistics
  getStatistics: async (): Promise<ProjectStatistics> => {
    return apiCall<ProjectStatistics>('/projects/statistics/');
  },

  // Get upcoming deadlines
  getUpcomingDeadlines: async (): Promise<Project[]> => {
    const response = await apiCall<PaginatedResponse<Project> | Project[]>('/projects/upcoming_deadlines/');
    
    if (response && typeof response === 'object' && 'results' in response) {
      return (response as PaginatedResponse<Project>).results;
    }
    
    if (Array.isArray(response)) {
      return response;
    }
    
    return [];
  },

  // Get my projects
  getMyProjects: async (): Promise<Project[]> => {
    const response = await apiCall<PaginatedResponse<Project> | Project[]>('/projects/my_projects/');
    
    if (response && typeof response === 'object' && 'results' in response) {
      return (response as PaginatedResponse<Project>).results;
    }
    
    if (Array.isArray(response)) {
      return response;
    }
    
    return [];
  },

  // Get team projects
  getTeamProjects: async (): Promise<Project[]> => {
    const response = await apiCall<PaginatedResponse<Project> | Project[]>('/projects/team_projects/');
    
    if (response && typeof response === 'object' && 'results' in response) {
      return (response as PaginatedResponse<Project>).results;
    }
    
    if (Array.isArray(response)) {
      return response;
    }
    
    return [];
  },

  // Update project progress
  updateProgress: async (id: string, progress: number): Promise<{ progress: number }> => {
    return apiCall<{ progress: number }>(`/projects/${id}/update_progress/`, {
      method: 'POST',
      body: JSON.stringify({ progress }),
    });
  },

  // Add member to project
  addMember: async (id: string, user_id: number, role: string): Promise<any> => {
    return apiCall<any>(`/projects/${id}/add_member/`, {
      method: 'POST',
      body: JSON.stringify({ user_id, role }),
    });
  },

  // Remove member from project
  removeMember: async (id: string, user_id: number): Promise<void> => {
    return apiCall<void>(`/projects/${id}/remove_member/`, {
      method: 'DELETE',
      body: JSON.stringify({ user_id }),
    });
  },

  // Task management
  createTask: async (projectId: string, data: CreateTaskData): Promise<ProjectTask> => {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/tasks/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Erreur lors de la création de la tâche');
    }

    return response.json();
  },

  updateTask: async (projectId: string, taskId: number, data: UpdateTaskData): Promise<ProjectTask> => {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/tasks/${taskId}/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Erreur lors de la mise à jour de la tâche');
    }

    return response.json();
  },

  deleteTask: async (projectId: string, taskId: number): Promise<void> => {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/tasks/${taskId}/`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Erreur lors de la suppression de la tâche');
    }
  },
};

// User API functions
export const userApi = {
  // Get all users
  getUsers: async (params?: {
    search?: string;
    is_active?: boolean;
    department?: string;
    ordering?: string;
  }): Promise<User[]> => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.append('search', params.search);
    if (params?.is_active !== undefined) searchParams.append('is_active', params.is_active.toString());
    if (params?.department) searchParams.append('department', params.department);
    if (params?.ordering) searchParams.append('ordering', params.ordering);
    
    const queryString = searchParams.toString();
    const endpoint = `/users/${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiCall<PaginatedResponse<User> | User[]>(endpoint);
    
    // If it's a paginated response, return the results
    if (response && typeof response === 'object' && 'results' in response) {
      return (response as PaginatedResponse<User>).results;
    }
    
    // If it's already an array, return it directly
    if (Array.isArray(response)) {
      return response;
    }
    
    // Fallback to empty array
    return [];
  },

  // Get a single user
  getUser: async (id: number): Promise<User> => {
    return apiCall<User>(`/users/${id}/`);
  },

  // Get current user
  getCurrentUser: async (): Promise<User> => {
    return apiCall<User>('/users/me/');
  },

  // Update user profile
  updateProfile: async (data: Partial<User>): Promise<User> => {
    return apiCall<User>('/users/me/', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};

// Team API functions
export const teamApi = {
  // Get all teams
  getTeams: async (params?: {
    search?: string;
    is_active?: boolean;
    ordering?: string;
  }): Promise<Team[]> => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.append('search', params.search);
    if (params?.is_active !== undefined) searchParams.append('is_active', params.is_active.toString());
    if (params?.ordering) searchParams.append('ordering', params.ordering);
    
    const queryString = searchParams.toString();
    const endpoint = `/teams/${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiCall<PaginatedResponse<Team> | Team[]>(endpoint);
    
    // If it's a paginated response, return the results
    if (response && typeof response === 'object' && 'results' in response) {
      return (response as PaginatedResponse<Team>).results;
    }
    
    // If it's already an array, return it directly
    if (Array.isArray(response)) {
      return response;
    }
    
    // Fallback to empty array
    return [];
  },

  // Get a single team
  getTeam: async (id: number): Promise<Team> => {
    return apiCall<Team>(`/teams/${id}/`);
  },

  // Create a new team
  createTeam: async (data: {
    name: string;
    description?: string;
  }): Promise<Team> => {
    return apiCall<Team>('/teams/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Update a team
  updateTeam: async (id: number, data: Partial<Team>): Promise<Team> => {
    return apiCall<Team>(`/teams/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // Delete a team
  deleteTeam: async (id: number): Promise<void> => {
    return apiCall<void>(`/teams/${id}/`, {
      method: 'DELETE',
    });
  },

  // Add member to team
  addMember: async (teamId: number, userId: number, role: string): Promise<TeamMember> => {
    return apiCall<TeamMember>(`/teams/${teamId}/add_member/`, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, role }),
    });
  },

  // Remove member from team
  removeMember: async (teamId: number, userId: number): Promise<void> => {
    return apiCall<void>(`/teams/${teamId}/remove_member/`, {
      method: 'DELETE',
      body: JSON.stringify({ user_id: userId }),
    });
  },
};

export const updateProject = async (projectId: string, data: UpdateProjectData): Promise<Project> => {
  const token = localStorage.getItem('access_token');
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}/`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Erreur lors de la mise à jour du projet');
  }

  return response.json();
}; 