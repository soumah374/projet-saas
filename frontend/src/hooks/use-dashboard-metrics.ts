import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export interface DashboardMetrics {
  projects?: {
    total_projects: number;
    active_projects: number;
    status_distribution: Record<string, number>;
    progress_distribution: Array<{
      range: string;
      count: number;
    }>;
    recent_projects: Array<{
      id: number;
      name: string;
      status: string;
      progress: number;
      created_at: string;
    }>;
    overdue_projects: Array<{
      id: number;
      name: string;
      deadline: string;
      days_overdue: number;
    }>;
    team_performance: Array<{
      team_name: string;
      project_count: number;
      avg_progress: number;
    }>;
    monthly_projects?: Array<{
      month: string;
      count: number;
    }>;
  };
  financial?: {
    revenue_trend: Array<{
      month: string;
      revenue: number;
    }>;
    billing_status: Record<string, number>;
    devis_conversion: {
      total: number;
      converted: number;
      rate: number;
    };
    cash_flow: {
      income: number;
      expenses: number;
      net: number;
    };
    top_clients: Array<{
      name: string;
      revenue: number;
    }>;
  };
  performance?: {
    team_productivity: Array<{
      team_name: string;
      total_tasks: number;
      completed_tasks: number;
      completion_rate: number;
    }>;
    user_performance: Array<{
      username: string;
      total_tasks: number;
      completed_tasks: number;
      completion_rate: number;
    }>;
    task_completion_rate: {
      total: number;
      completed: number;
      rate: number;
    };
    efficiency_metrics: {
      avg_completion_time_days: number;
      total_completed_tasks: number;
    };
    pending_tasks?: number;
    overdue_tasks?: number;
  };
  calendar?: {
    upcoming_deadlines: Array<{
      id: number;
      title: string;
      deadline: string;
      project: string;
      days_until_deadline: number;
    }>;
    event_distribution: {
      tasks: number;
      projects: number;
      contrats: number;
    };
    resource_utilization: {
      total_users: number;
      active_users: number;
      utilization_rate: number;
      total_clients?: number;
      total_contracts?: number;
    };
  };
  last_updated?: string;
}

export const useDashboardMetrics = (periodDays: number = 30) => {
  const [data, setData] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(`/dashboard/overview/?period_days=${periodDays}`);
      setData(response.data);
    } catch (err) {
      console.error('Erreur lors de la récupération des métriques du tableau de bord:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [periodDays]);

  const refetch = () => {
    fetchData();
  };

  return {
    data,
    loading,
    error,
    refetch
  };
}; 