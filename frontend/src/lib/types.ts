// Types basés sur le schéma OpenAPI SAKOM

// Enums
export type ProjectType = 'Événementiel' | 'Communication' | 'Audiovisuel' | 'Production' | 'Digital' | 'Conseil';
export type ProjectCategory = 'Corporate' | 'Marketing' | 'Institutionnel' | 'Commercial' | 'Interne';
export type ProjectStatus = 'Planification' | 'En cours' | 'Production' | 'En pause' | 'Terminé';
export type ProjectPriority = 'Basse' | 'Normale' | 'Haute' | 'Urgente';
export type ProjectMemberRole = 'Chef de projet' | 'Designer' | 'Développeur' | 'Rédacteur' | 'Consultant' | 'Assistant';
export type ProjectTaskStatus = 'À faire' | 'En cours' | 'Terminé' | 'En pause';
export type TeamMemberRole = 'leader' | 'member' | 'consultant';
export type UserProfileRole = 'Chef de projet' | 'Designer' | 'Développeur' | 'Rédacteur' | 'Consultant' | 'Assistant' | 'Managing Director' | 'Finance/Admin';
export type DocumentType = 'pdf' | 'doc' | 'docx' | 'xls' | 'xlsx' | 'ppt' | 'pptx' | 'txt' | 'jpg' | 'jpeg' | 'png' | 'gif' | 'mp4' | 'avi' | 'mp3' | 'zip' | 'other';
export type DocumentCategory = 'contract' | 'proposal' | 'report' | 'presentation' | 'design' | 'video' | 'audio' | 'photo' | 'other';

// Base types
export interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
}

export interface UserProfile {
  role?: UserProfileRole;
  phone?: string;
  avatar?: string;
  bio?: string;
  department?: string;
  position?: string;
  hire_date?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserList extends User {
  profile: UserProfile;
  full_name: string;
  project_count: string;
  is_active: boolean;
}

export interface UserCreate {
  username: string;
  first_name?: string;
  last_name?: string;
  email: string;
  profile?: UserProfile;
}

export interface UserUpdate {
  first_name?: string;
  last_name?: string;
  email?: string;
  profile?: UserProfile;
}

// Project types
export interface ProjectBudget {
  id: number;
  production: string;
  personnel: string;
  marketing: string;
  other: string;
  total: string;
}

export interface ProjectMember {
  id: number;
  user: User;
  role: ProjectMemberRole;
  joined_at: string;
  is_active: boolean;
}

export interface ProjectTask {
  id: number;
  title: string;
  description: string;
  status: string;
  assigned_to?: User;
  start_date?: string;
  due_date: string;
  created_at: string;
  updated_at: string;
}

export interface TaskWithDeadline extends ProjectTask {
  days_remaining: number;
}

export interface ProjectEvent {
  id: number;
  title: string;
  description: string;
  type: 'Réunion' | 'Présentation' | 'Atelier' | 'Livraison' | 'Autre';
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  participants: User[];
  created_by: User;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  objectives?: string;
  type: ProjectType;
  category?: ProjectCategory;
  status: ProjectStatus;
  priority: ProjectPriority;
  start_date?: string;
  deadline: string;
  created_at: string;
  updated_at: string;
  progress: number;
  budget?: string;
  client: string;
  created_by: User;
  team_members: ProjectMember[];
  budget_details: ProjectBudget;
  tasks: ProjectTask[];
  tags: any;
  days_remaining: string;
  is_overdue: string;
  events: ProjectEvent[];
}

export interface ProjectList {
  id: string;
  title: string;
  type: ProjectType;
  status: ProjectStatus;
  priority: ProjectPriority;
  progress: number;
  deadline: string;
  client: string;
  created_by: User;
  team_count: string;
  days_remaining: string;
  is_overdue: string;
  created_at: string;
}

export interface ProjectCreate {
  title: string;
  description: string;
  objectives?: string;
  type: ProjectType;
  category?: ProjectCategory;
  status: ProjectStatus;
  priority: ProjectPriority;
  start_date?: string;
  deadline: string;
  budget?: string;
  client: string;
  tags?: any;
  budget_details?: ProjectBudget;
}

export interface ProjectUpdate {
  title: string;
  description: string;
  objectives?: string;
  type: ProjectType;
  category?: ProjectCategory;
  status: ProjectStatus;
  priority: ProjectPriority;
  start_date?: string;
  deadline: string;
  budget?: string;
  client: string;
  tags?: any;
  budget_details?: ProjectBudget;
}

// Team types
export interface Team {
  id: number;
  name: string;
  description?: string;
  created_by: number;
  created_by_name: string;
  created_at: string;
  updated_at: string;
  member_count: number;
}

export interface TeamMember {
  id: number;
  team: number;
  team_name: string;
  user: number;
  user_name: string;
  role: TeamMemberRole;
  joined_at: string;
  is_active: boolean;
}

// Document types
export interface Document {
  id: number;
  title: string;
  description?: string;
  file: string;
  document_type: DocumentType;
  file_size: number;
  uploaded_by: number;
  uploaded_by_name: string;
  created_at: string;
  updated_at: string;
  is_public: boolean;
  category: DocumentCategory;
  tags: any;
  project?: string;
}

// API Response types
export interface PaginatedResponse<T> {
  count: number;
  next?: string;
  previous?: string;
  results: T[];
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

export interface UserStatistics {
  total_users: number;
  active_users: number;
  staff_users: number;
  new_users_this_month: number;
  users_by_role: Array<{ role: string; count: number }>;
  users_by_department: Array<{ department: string; count: number }>;
}

// Auth types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
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
  };
}

export interface OTPRequest {
  email: string;
}

export interface OTPVerification {
  email: string;
  otp_code: string;
}

// Form types
export interface CreateProjectForm {
  title: string;
  description: string;
  objectives?: string;
  type: ProjectType;
  category?: ProjectCategory;
  status: ProjectStatus;
  priority: ProjectPriority;
  start_date?: string;
  deadline: string;
  budget?: string;
  client: string;
  tags?: string[];
  budget_details?: {
    production: string;
    personnel: string;
    marketing: string;
    other: string;
  };
  team_members?: Array<{
    user_id: number;
    role: ProjectMemberRole;
  }>;
}

export interface CreateTaskForm {
  title: string;
  description?: string;
  status: ProjectTaskStatus;
  assigned_to_id?: number;
  start_date?: string;
  due_date?: string;
}

export interface CreateTeamMemberForm {
  user_id: number;
  role: ProjectMemberRole;
  is_active?: boolean;
} 