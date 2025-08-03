// Types basés sur le schéma OpenAPI SAKOM

// Enums
export type ProjectStatus = 
  | 'Prospection'
  | 'Devis'
  | 'Production'
  | 'Livraison'
  | 'Terminé';

export type ProjectType = 
  | 'Externe'
  | 'Interne';

export type ProjectPriority = 
  | 'Basse'
  | 'Normale'
  | 'Haute'
  | 'Urgente';

export type ProjectCategory = 
  | 'Corporate' 
  | 'Marketing' 
  | 'Institutionnel' 
  | 'Commercial' 
  | 'Interne';

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
  user_details: User;
  total_hours: string;
  role: ProjectMemberRole;
  joined_at: string;
  is_active: boolean;
  allocation_percentage: number;
  project: string;
  user: number;
}



export interface ProjectTask {
  id: number;
  completion_percentage: string;
  assigned_to_name: string;
  title: string;
  description: string;
  status: ProjectTaskStatus;
  start_date: string | null;
  due_date: string | null;
  estimated_hours: number | null;
  actual_hours: string;
  created_at: string;
  updated_at: string;
  executed_at: string | null;
  is_template: boolean;
  template_category?: string;
  project: string;
  assigned_to: number | null;
  is_standard_task: boolean | false;
  ligne_devis?: number | null;
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
  status: ProjectStatus;
  priority: ProjectPriority;
  start_date: string | null;
  deadline: string;
  progress: number;
  budget: string | null;
  client: number | null;
  client_details?: ClientProfile;
  departments: string[];
  contract: number | null;
  contract_details?: Contrat;
  created_by: number;
  created_at: string;
  updated_at: string;
  team_members: ProjectMember[];
  tasks: ProjectTask[];
  created_by_name: string;
  total_hours: string;
  total_estimated_hours: string;
  tags?: string[];
}

export interface ClientData {
  id: number;
  nom_complet: string;
  email: string;
  telephone: string;
  adresse: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExtendedProject extends Omit<Project, 'created_by' | 'budget' | 'team_members' | 'tasks'> {
  created_by: number | User;
  budget: string | number | null;
  category?: ProjectCategory;
  team_members?: ProjectMember[];
  budget_details?: ProjectBudget | null;
  tasks?: ProjectTask[];
  tags?: string[];
  days_remaining?: string | null;
  is_overdue?: string | null;
  events?: ProjectEvent[];
  team_count?: string;
  client_details: ClientData;
}

export interface ProjectList {
  id: string;
  title: string;
  type: ProjectType;
  status: ProjectStatus;
  priority: ProjectPriority;
  progress: number;
  deadline: string | null;
  client: number | null;
  client_details?: ClientProfile;
  created_by: User | number;
  team_count: string;
  days_remaining: string | null;
  is_overdue: string | null;
  created_at: string | null;
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
  client: number | null;
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
  client: number | null;
  tags?: any;
  budget_details?: ProjectBudget;
}

export interface CreateProjectPayload {
  title: string;
  description: string;
  objectives?: string;
  type: ProjectType;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  start_date?: string;
  deadline: string;
  budget?: string;
  client: number | null;
  departments?: string[];
  contract?: number | null;
  tags?: string[];
}

export interface UpdateProjectPayload extends Partial<CreateProjectPayload> {
  progress?: number;
}

export interface ProjectFilters {
  status?: ProjectStatus;
  type?: ProjectType;
  priority?: ProjectPriority;
  client?: number;
  contract?: number;
  start_date?: string;
  end_date?: string;
  team_member?: number;
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
  id?: string;
  title: string;
  description: string;
  objectives?: string;
  type: ProjectType;
  category?: ProjectCategory;
  priority: ProjectPriority;
  start_date?: string;
  deadline: string;
  budget?: string;
  client: number | null;
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
  dependencies?: string[];
}

export interface CreateTeamMemberForm {
  user_id: number;
  role: ProjectMemberRole;
  is_active?: boolean;
}

export interface Notification {
  id: number;
  type: 'project_member' | 'task_assignment';
  title: string;
  project: Project;
  task?: ProjectTask;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface ProjectMemberUpdate {
  role: string;
  is_active: boolean;
} 

export interface Service {
  id: number;
  name: string;
  description: string;
  category?: {
    id: number;
    name: string;
  } | null;
  profile_intervenant?: {
    id: number;
    name: string;
  } | null;
  price?: number | null;
  duration?: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}



export interface Category {
  id: number;
  name: string;
}

export interface IntervenantProfile {
  id: number;
  name: string;
}

export interface ClientCreateData {
  first_name: string;
  last_name: string;
  email: string;
  telephone: string;
  adresse: string;
  ville: string;
  code_postal: string;
  pays: string;
  is_active: boolean;
}

export interface ClientCategory {
  id: number;
  name: string;
  description: string;
}

export interface FraisCategory {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LigneFrais {
  id: number;
  type_frais: 'rh' | 'technique' | 'sous_traitance' | 'deplacement' | 'administratif' | 'marge' | 'taxes';
  category_id: number;
  category_name?: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
export interface LigneFraisList {
  id: number;
  type_frais: 'rh' | 'technique' | 'sous_traitance' | 'deplacement' | 'administratif' | 'marge' | 'taxes';
  category: {
    id: number;
    name: string;
  };
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FraisCategoryCreateData {
  name: string;
  description: string;
  is_active?: boolean;
}

export interface FraisCategoryUpdateData {
  name?: string;
  description?: string;
  is_active?: boolean;
}

export interface LigneFraisCreateData {
  type_frais: 'rh' | 'technique' | 'sous_traitance' | 'deplacement' | 'administratif' | 'marge' | 'taxes';
  category_id: number;
  description: string;
  is_active?: boolean;
}

export interface LigneFraisUpdateData {
  type_frais?: 'rh' | 'technique' | 'sous_traitance' | 'deplacement' | 'administratif' | 'marge' | 'taxes';
  category_id?: number;
  description?: string;
  is_active?: boolean;
}

// Types pour les devis
export interface Devis {
  id: number;
  numero: string;
  client: ClientProfile;
  montant_ht: number;
  montant_tva: number;
  montant_ttc: number;
  taux_tva: number;
  appliquer_tva: boolean;
  taux_frais_agence: number;
  appliquer_frais_agence: boolean;
  statut: string;
  date_creation: string;
  updated_at: string;
}

// Types pour les clients
export interface ClientProfile {
  id: number;
  nom_complet: string;
  email: string;
  telephone?: string;
  adresse?: string;
  ville?: string;
  code_postal?: string;
  pays?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Types pour les lignes de contrat
export interface LigneContrat {
  id: number;
  contrat: number;
  type_ligne: 'prestation' | 'frais';
  type_frais?: 'standard' | 'forfait' | 'offert';
  service?: {
    id: number;
    name: string;
  };
  activity?: {
    id: number;
    intitule: string;
  };
  frais_category?: {
    id: number;
    name: string;
  };
  ligne_frais?: {
    id: number;
    description: string;
  };
  description: string;
  quantite: number;
  unite: {
    id: number;
    intitule: string;
    code: string;
  };
  prix_unitaire_ht: number;
  montant_ht: number;
  created_at: string;
  updated_at: string;
}

// Types pour les échéanciers de contrat
export interface EcheancierContrat {
  id: number;
  contrat: number;
  type_echeance: string;
  numero_echeance: number;
  montant_ht: number;
  montant_tva: number;
  montant_ttc: number;
  pourcentage: number;
  date_echeance: string;
  date_paiement?: string;
  statut: string;
  commentaire: string;
  alerte_envoyee: boolean;
  jours_restants: number;
  est_en_retard: boolean;
  doit_alerter: boolean;
  created_at: string;
  updated_at: string;
}

// Échéance types
export interface Echeance {
  id: number;
  contrat: number;
  type_echeance: string;
  numero_echeance: number;
  montant_ht: number;
  montant_tva: number;
  montant_ttc: number;
  pourcentage: number;
  date_echeance: string;
  date_paiement?: string;
  statut: string;
  commentaire: string;
  alerte_envoyee: boolean;
  jours_restants: number;
  est_en_retard: boolean;
  doit_alerter: boolean;
  created_at: string;
  updated_at: string;
  contrat_details?: {
    numero: string;
    client: {
      nom_complet: string;
    };
  };
}

export interface AlertesQuotidiennes {
  echeances_3_jours: Echeance[];
  echeances_retard: Echeance[];
  total_alertes: number;
}

export interface Contrat {
  id: number;
  numero: string;
  devis: Devis[]; // Changé de Devis à Devis[]
  devis_principal?: Devis;
  client: ClientProfile;
  date_creation: string;
  date_debut: string;
  date_fin: string;
  statut: 'brouillon' | 'actif' | 'termine' | 'annule' | 'suspendu' | 'archive' | 'envoye' | 'signe' | 'cloture';
  statut_display: string;
  taux_tva: number;
  appliquer_tva: boolean;
  taux_frais_agence: number;
  appliquer_frais_agence: boolean;
  montant_ht: number;
  montant_tva: number;
  montant_frais_agence: number;
  montant_ttc: number;
  conditions: string;
  notes: string;
  contenu_personnalise: string;
  variables_personnalisees: Record<string, any>;
  echeances_contrat: any[];
  lignes: LigneContrat[];
  echeances: EcheancierContrat[];
  fichier_signe?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateContratData {
  client_id: number;
  devis_ids: number[]; // Changé de devis_id à devis_ids
  devis_principal_id?: number;
  date_debut: string;
  date_fin: string;
  conditions?: string;
  notes?: string;
  echeances?: any[];
}

