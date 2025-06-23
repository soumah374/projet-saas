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

export interface Project {
  id: string;
  title: string;
  description?: string;
  objectives?: string;
  type: string;
  category?: string;
  status: string;
  priority: string;
  start_date?: string;
  deadline: string;
  created_at: string;
  updated_at?: string;
  progress: number;
  budget?: string;
  client: string;
  created_by: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  team_members?: Array<{
    id: number;
    user: {
      id: number;
      username: string;
      first_name: string;
      last_name: string;
      email: string;
    };
    role: string;
    joined_at: string;
    is_active: boolean;
  }>;
  budget_details?: {
    id: number;
    production: number;
    personnel: number;
    marketing: number;
    other: number;
    total: number;
  };
  tasks?: Array<{
    id: number;
    title: string;
    description: string;
    status: string;
    assigned_to?: {
      id: number;
      username: string;
      first_name: string;
      last_name: string;
      email: string;
    };
    due_date: string;
    created_at: string;
    updated_at: string;
  }>;
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
  budget: string;
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

export interface UpdateProjectData extends Partial<CreateProjectData> {}

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
    return apiCall<Project>(`/projects/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
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
}; 