
export interface Event {
  id: string;
  title: string;
  type: 'milestone' | 'deadline' | 'meeting' | 'task';
  date: Date;
  time?: string;
  project: string;
  status: 'upcoming' | 'in-progress' | 'completed' | 'overdue';
  participants?: string[];
  duration?: number;
}

export interface EventStats {
  total: number;
  thisWeek: number;
  thisMonth: number;
  overdue: number;
  meetings: number;
  deadlines: number;
  milestones: number;
  tasks: number;
}
