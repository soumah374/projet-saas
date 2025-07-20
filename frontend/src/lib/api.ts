import axios from 'axios';
import { config } from './config';
import type { 
    PaginatedResponse, 
    ProjectType, 
    ProjectStatus, 
    ProjectPriority,
    TeamMember,
    ProjectPhase
} from './types';

export const api = axios.create({
    baseURL: config.api.baseUrl,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const handleLogout = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  window.location.href = '/login';
};

// Intercepteur pour ajouter le token d'authentification
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur pour gérer les réponses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error);
    if (error.response?.status === 401) {
      handleLogout();
    }
    return Promise.reject(error);
  }
);

// Types
export interface Project {
    id: string;
    title: string;
    description: string;
    objectives: string;
    type: ProjectType;
    status: ProjectStatus;
    priority: ProjectPriority;
    start_date: string | null;
    deadline: string;
    progress: number;
    budget: number | null;
    client: string;
    departments: string[];
    contract: string;
    created_by: number;
    created_at: string;
    updated_at: string;
}

export interface ProjectTask {
    id: number;
    project: string;
    phase: number | null;
    title: string;
    description: string;
    status: 'À faire' | 'En cours' | 'Terminé' | 'En pause';
    assigned_to: number | null;
    start_date: string | null;
    due_date: string | null;
    estimated_hours: number | null;
    actual_hours: number;
    created_at: string;
    updated_at: string;
    executed_at: string | null;
    is_template: boolean;
    template_category: string;
}

export interface TimeSheet {
    id: number;
    project: number;
    task: number;
    task_details?: {
        id: number;
        title: string;
        status: string;
    };
    user: number;
    user_name?: string;
    date: string;
    hours: number;
    description: string;
    validated_by: number | null;
    validator_name?: string;
    validated_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface ProjectMember {
    id: number;
    project: string;
    user: number;
    role: string;
    joined_at: string;
    is_active: boolean;
    allocation_percentage: number;
}

// API Client
export const projectApi = {
    // Projets
    getProjects: () => api.get<PaginatedResponse<Project>>('/projects/'),
    getProject: (id: string) => api.get<Project>(`/projects/${id}/`),
    createProject: (data: Partial<Project>) => api.post<Project>('/projects/', data),
    updateProject: (id: string, data: Partial<Project>) => api.patch<Project>(`/projects/${id}/`, data),
    deleteProject: (id: string) => api.delete(`/projects/${id}/`),
    
    // Phases
    getProjectPhases: (projectId: string) => api.get<PaginatedResponse<ProjectPhase>>(`/projects/${projectId}/phases/`),
    getProjectPhase: (projectId: string, phaseId: number) => 
        api.get<ProjectPhase>(`/projects/${projectId}/phases/${phaseId}/`),
    createProjectPhase: (projectId: string, data: Partial<ProjectPhase>) => 
        api.post<ProjectPhase>(`/projects/${projectId}/phases/`, data),
    updateProjectPhase: (projectId: string, phaseId: number, data: Partial<ProjectPhase>) => 
        api.patch<ProjectPhase>(`/projects/${projectId}/phases/${phaseId}/`, data),
    deleteProjectPhase: (projectId: string, phaseId: number) => 
        api.delete(`/projects/${projectId}/phases/${phaseId}/`),
    reorderPhase: (projectId: string, phaseId: number, order: number) =>
        api.post(`/projects/${projectId}/phases/${phaseId}/reorder/`, { order }),
    
    // Tâches
    getProjectTasks: (projectId: string) => api.get<PaginatedResponse<ProjectTask>>(`/projects/${projectId}/tasks/`),
    getProjectTask: (projectId: string, taskId: number) => 
        api.get<ProjectTask>(`/projects/${projectId}/tasks/${taskId}/`),
    createProjectTask: (projectId: string, data: Partial<ProjectTask>) => 
        api.post<ProjectTask>(`/projects/${projectId}/tasks/`, data),
    updateProjectTask: (projectId: string, taskId: number, data: Partial<ProjectTask>) => 
        api.patch<ProjectTask>(`/projects/${projectId}/tasks/${taskId}/`, data),
    deleteProjectTask: (projectId: string, taskId: number) => 
        api.delete(`/projects/${projectId}/tasks/${taskId}/`),

    updateTaskStatus: (projectId: string, taskId: number, status: ProjectTask['status']) =>
        api.patch(`/projects/${projectId}/tasks/${taskId}/`, { status }),

    assignTask: (projectId: string, taskId: number, userId: number) =>
        api.post(`/projects/${projectId}/tasks/${taskId}/assign/`, { user_id: userId }),
    getTaskTemplates: (projectId: string) => 
        api.get<PaginatedResponse<ProjectTask>>(`/projects/${projectId}/tasks/templates/`),
    createTaskFromTemplate: (projectId: string, templateId: number, data: {
        phase_id?: number;
        start_date?: string;
        due_date?: string;
    }) => api.post<ProjectTask>(
        `/projects/${projectId}/tasks/${templateId}/create_from_template/`,
        data
    ),
    
    // Feuilles de temps
    getProjectTimeSheets: (projectId: string) => 
        api.get<PaginatedResponse<TimeSheet>>(`/projects/${projectId}/timesheets/`),
    getProjectTimeSheet: (projectId: string, timeSheetId: number) => 
        api.get<TimeSheet>(`/projects/${projectId}/timesheets/${timeSheetId}/`),
    createProjectTimeSheet: (projectId: string, data: Partial<TimeSheet>) => 
        api.post<TimeSheet>(`/projects/${projectId}/timesheets/`, data),
    updateProjectTimeSheet: (projectId: string, timeSheetId: number, data: Partial<TimeSheet>) => 
        api.patch<TimeSheet>(`/projects/${projectId}/timesheets/${timeSheetId}/`, data),
    deleteProjectTimeSheet: (projectId: string, timeSheetId: number) => 
        api.delete(`/projects/${projectId}/timesheets/${timeSheetId}/`),
    validateTimeSheet: (projectId: string, timeSheetId: number) =>
        api.post<TimeSheet>(`/projects/${projectId}/timesheets/${timeSheetId}/validate/`),
    getTimeSheetSummary: (projectId: string) =>
        api.get(`/projects/${projectId}/timesheets/summary/`),
    

    // Suivi et alertes
    getProjectTimeline: (projectId: string) => api.get(`/projects/${projectId}/timeline/`),
    getProjectWorkload: (projectId: string) => api.get(`/projects/${projectId}/workload/`),
    getProjectAlerts: (projectId: string) => api.get(`/projects/${projectId}/alerts/`),
    updateProjectStatus: (projectId: string, status: Project['status']) =>
        api.post(`/projects/${projectId}/update_phase/`, { status }),
};

export const projectsAPI = {
    getProjects: (params?: {
        search?: string;
        ordering?: string;
        page?: number;
        status?: string;
        type?: string;
        priority?: string;
        category?: string;
    }) => api.get<PaginatedResponse<Project>>('/projects/', { params }),
    getProject: (id: string) => api.get<Project>(`/projects/${id}/`),
    createProject: (data: Partial<Project>) => api.post<Project>('/projects/', data),
    updateProject: (id: string, data: Partial<Project>) => api.patch<Project>(`/projects/${id}/`, data),
    deleteProject: (id: string) => api.delete(`/projects/${id}/`),
    getMyProjects: () => api.get('/projects/my-projects/'),
    getTeamProjects: () => api.get('/projects/team-projects/'),
    getUpcomingDeadlines: () => api.get('/projects/upcoming-deadlines/'),
    updateProgress: (id: string, progress: number) => api.post(`/projects/${id}/update-progress/`, { progress }),
    getProjectEvents: (projectId: string) => api.get(`/projects/${projectId}/events/`),
    createProjectEvent: (projectId: string, data: any) => api.post(`/projects/${projectId}/events/`, data),
    updateProjectEvent: (projectId: string, eventId: number, data: any) => 
        api.patch(`/projects/${projectId}/events/${eventId}/`, data),
    deleteProjectEvent: (projectId: string, eventId: number) => 
        api.delete(`/projects/${projectId}/events/${eventId}/`),
};

export const projectMembersAPI = {
    getProjectMembers: (projectId: string) => 
        api.get(`/projects/${projectId}/members/`),
    addProjectMember: (projectId: string, data: any) => 
        api.post(`/projects/${projectId}/members/`, data),
    updateProjectMember: (projectId: string, memberId: number, data: any) => 
        api.patch(`/projects/${projectId}/members/${memberId}/`, data)
};

export const projectTasksAPI = {
    getProjectTasks: (projectId: string) => 
        api.get<PaginatedResponse<ProjectTask>>(`/projects/${projectId}/tasks/`),
    createTask: (projectId: string, data: any) => 
        api.post<ProjectTask>(`/projects/${projectId}/tasks/`, data),
    updateTask: (projectId: string, taskId: number, data: any) => 
        api.patch<ProjectTask>(`/projects/${projectId}/tasks/${taskId}/`, data),
    deleteTask: (projectId: string, taskId: number) => 
        api.delete(`/projects/${projectId}/tasks/${taskId}/`),
    applyTaskTemplate: (projectId: string, category: string) =>
        api.post<void>(`/projects/${projectId}/tasks/create_from_template/`, { category })
};

export const notificationsAPI = {
    getNotifications: (params?: {
        type?: string;
        is_read?: boolean;
        page?: number;
        page_size?: number;
    }) => api.get<PaginatedResponse<Notification>>('/notifications/', { params }),
    
    getUnreadCount: () => api.get<{ unread_count: number }>('/notifications/unread_count/'),
    
    markRead: (notificationId: number) => 
        api.post(`/notifications/${notificationId}/mark_read/`),
    
    markAllRead: () => api.post('/notifications/mark_all_read/'),
};

export const authAPI = {
    login: async ({ username, password }: { username: string; password: string }) => {
        try {
            const response = await api.post<{
                access: string;
                refresh: string;
                user: {
                    id: number;
                    username: string;
                    first_name: string;
                    last_name: string;
                    email: string;
                    role: string;
                    is_staff: boolean;
                }
            }>('/auth/login/', { username, password });
            return response.data;
        } catch (error: any) {
            if (error.response) {
                throw new Error(error.response.data.detail || "Erreur d'authentification");
            }
            throw new Error("Erreur de connexion au serveur");
        }
    },
    
    refreshToken: (refresh: string) => 
        api.post<{ access: string }>('/auth/token/refresh/', { refresh }),
    
    verifyToken: (token: string) => 
        api.post('/auth/token/verify/', { token }),
    
    logout: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
    },

    changePassword: (data: { old_password: string; new_password: string; new_password_confirm: string }) =>
        api.post('/auth/change-password/', data),
};

export const teamsAPI = {
    getTeams: (params?: {
        search?: string;
        ordering?: string;
        page?: number;
        is_active?: boolean;
        created_by?: number;
    }) => api.get('/teams/', { params }),
    getTeam: (id: number) => api.get(`/teams/${id}/`),
    createTeam: (data: { name: string; description?: string }) => api.post('/teams/', data),
    updateTeam: (id: number, data: { name?: string; description?: string }) => 
        api.patch(`/teams/${id}/`, data),
    deleteTeam: (id: number) => api.delete(`/teams/${id}/`),
    addTeamMember: (teamId: number, data: { user: number; role: string; is_active?: boolean }) => 
        api.post(`/teams/${teamId}/members/`, data),
};

export const teamMembersAPI = {
    getTeamMembers: (params?: {
        team?: number;
        role?: string;
        is_active?: boolean;
        ordering?: string;
        page?: number;
    }) => api.get('/team-members/', { params }),
    getTeamMember: (id: number) => api.get(`/team-members/${id}/`),
    createTeamMember: (data: { team: number; user: number; role: string; is_active?: boolean }) => 
        api.post('/team-members/', data),
    updateTeamMember: (id: number, data: Partial<{ team: number; user: number; role: string; is_active: boolean }>) => 
        api.patch(`/team-members/${id}/`, data),
    deleteTeamMember: (id: number) => api.delete(`/team-members/${id}/`),
};

export const usersAPI = {
    getUsers: (params?: {
        search?: string;
        role?: string;
        is_active?: boolean;
        ordering?: string;
        page?: number;
    }) => api.get('/auth/users/', { params }),
    getCurrentUser: () => api.get('/auth/users/me/'),
    getUser: (id: number) => api.get(`/auth/users/${id}/`),
    createUser: (data: any) => api.post('/auth/users/', data),
    updateUser: (id: number, data: any) => api.patch(`/auth/users/${id}/`, data),
    deleteUser: (id: number) => api.delete(`/auth/users/${id}/`),
    getUserProfile: (id: number) => api.get(`/auth/users/${id}/profile/`),
    updateUserProfile: (id: number, data: any) => api.patch(`/auth/users/${id}/profile/`, data),
    getStatistics: () => api.get('/auth/users/statistics/'),
};

export const clientsAPI = {
    getClients: (params?: {
        search?: string;
        is_active?: boolean;
        ville?: string;
        pays?: string;
        ordering?: string;
        page?: number;
        page_size?: number;
    }) => api.get('/auth/clients/', { params }),
    getClient: (id: number) => api.get(`/auth/clients/${id}/`),
    createClient: (data: {
        first_name: string;
        last_name: string;
        email: string;
        client_profile: {
            telephone: string;
            adresse: string;
            ville: string;
            code_postal: string;
            pays: string;
            is_active: boolean;
        };
    }) => api.post('/auth/clients-create/', data),
    updateClient: (id: number, data: {
        telephone?: string;
        adresse?: string;
        ville?: string;
        code_postal?: string;
        pays?: string;
        is_active?: boolean;
    }) => api.patch(`/auth/clients/${id}/`, data),
    updateClientUser: (id: number, data: {
        first_name?: string;
        last_name?: string;
        email?: string;
    }) => api.patch(`/auth/users/${id}/`, data),
    deleteClient: (id: number) => api.delete(`/auth/clients/${id}/`),
    toggleClientStatus: (id: number, isActive: boolean) => api.patch(`/auth/clients/${id}/`, { is_active: isActive }),
};

export const documentsAPI = {
    getDocuments: (params?: {
        search?: string;
        type?: string;
        category?: string;
        project?: string;
        is_public?: boolean;
        ordering?: string;
        page?: number;
    }) => api.get('/documents/', { params }),
    getDocument: (id: number) => api.get(`/documents/${id}/`),
    uploadDocument: (data: FormData) => api.post('/documents/', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    updateDocument: (id: number, data: any) => api.patch(`/documents/${id}/`, data),
    deleteDocument: (id: number) => api.delete(`/documents/${id}/`),
};

export const departmentsAPI = {
    getDepartments: (params?: {
        search?: string;
        is_active?: boolean;
        ordering?: string;
        page?: number;
    }) => api.get('/departments/', { params }),
    
    getDepartment: (id: number) => 
        api.get(`/departments/${id}/`),
    
    createDepartment: (data: { 
        name: string;
        description: string;
        is_active?: boolean;
    }) => api.post('/departments/', data),
    
    updateDepartment: (id: number, data: {
        name?: string;
        description?: string;
        is_active?: boolean;
    }) => api.patch(`/departments/${id}/`, data),
    
    deleteDepartment: (id: number) => 
        api.delete(`/departments/${id}/`),
    
    assignManager: (id: number, data: {
        manager_id: number;
        start_date?: string;
        notes?: string;
    }) => api.post(`/departments/${id}/assign_manager/`, data),
    
    toggleActive: (id: number) => 
        api.post(`/departments/${id}/toggle_active/`),
    
    getManagerHistory: (id: number) => 
        api.get(`/departments/${id}/manager_history/`),
};

// Calendar event functions
export const fetchEvents = (params?: {
    start_date?: string;
    end_date?: string;
    project?: string;
}) => api.get('/events/', { params });

export const createEvent = (data: any) => api.post('/events/', data);

export const updateEvent = (id: number, data: any) => api.patch(`/events/${id}/`, data);

export const deleteEvent = (id: number) => api.delete(`/events/${id}/`);

export const fetchUpcomingEvents = () => api.get('/events/upcoming/');

export default api; 

export const projectPhasesAPI = {
    getProjectPhases: (projectId: string) => 
        api.get<PaginatedResponse<ProjectPhase>>(`/projects/${projectId}/phases/`),
    
    createProjectPhase: (projectId: string, data: Omit<ProjectPhase, 'id'>) => 
        api.post<ProjectPhase>(`/projects/${projectId}/phases/`, {
            ...data,
            project: projectId
        }),
    
    updateProjectPhase: (projectId: string, phaseId: number, data: Partial<ProjectPhase>) => 
        api.patch<ProjectPhase>(`/projects/${projectId}/phases/${phaseId}/`, data),
    
    deleteProjectPhase: (projectId: string, phaseId: number) => 
        api.delete(`/projects/${projectId}/phases/${phaseId}/`),
    
    reorderProjectPhase: (projectId: string, phaseId: number, order: number) =>
        api.post<ProjectPhase>(`/projects/${projectId}/phases/${phaseId}/reorder/`, { order }),
};

export const projectTeamAPI = {
    getProjectTeam: (projectId: string) => 
        api.get<TeamMember>(`/projects/${projectId}/team/`),
    addTeamMember: (projectId: string, data: { user: string; role: string; allocation_percentage: number }) => 
        api.post<TeamMember>(`/projects/${projectId}/add_member/`, data),
    updateTeamMember: (projectId: string, memberId: number, data: { role?: string; allocation_percentage?: number }) => 
        api.patch<TeamMember>(`/projects/${projectId}/team/${memberId}/`, data),
    removeTeamMember: (projectId: string, memberId: number) => 
        api.delete(`/projects/${projectId}/team/${memberId}/`),
    getUserAllocation: (userId: string) => 
        api.get<{ total_allocation: number }>(`/projects/team/user/${userId}/allocation/`),
    deleteProjectMember: (projectId: string, id: number) => 
        api.delete(`/projects/${projectId}/team/${id}/delete/`),
}; 

// Services
export const servicesAPI = {
    getServices: () => api.get('/catalog/services/'),
};

// PATCHs
// 