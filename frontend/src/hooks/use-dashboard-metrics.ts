import { useState, useEffect } from 'react';
import { dashboardAPI } from '@/lib/api';

export interface DashboardMetrics {
  projects?: {
    total_projects: number;
    status_distribution?: Record<string, number>;
    active_projects: number;
    recent_projects?: Array<{
      id: number;
      name: string;
      status: string;
      progress: number;
      created_at: string;
      activite_percent: number;
      delai_percent: number;
    }>;
    overdue_projects?: Array<{
      id: number;
      name: string;
      deadline: string;
      days_overdue: number;
    }>;
    team_performance?: Array<{
      team_name: string;
      project_count: number;
      avg_progress: number;
    }>;
    monthly_projects?: Array<{
      month: string;
      count: number;
    }>;
    progress_retards?: {
      projects_overdue_count: number;
      unbilled_amount_total: number;
    };
    project_performance?: Array<{
      type: 'top' | 'flop';
      projects: {
        title: string;
        progress: number;
        status: string;
        budget: number;
      };
    }>;
    user_role?: string;
    widgets_used?: string[];
  };
  financial?: {
    facture_non_emises?: number;
    revenue_trend?: Array<{
      period: string;
      recettes: number;
      type: 'daily' | 'monthly';
    }>;
    billing_status?: Record<string, number>;
    devis_conversion?: {
      total: number;
      converted: number;
      rate: number;
    };
    cash_flow?: {
      recettes: number;
      expenses: number;
      net: number;
    };
    montant_impaye?: number;
    taux_recouvrement?: {
      periode: number;
      cumule: number;
    };
    period_metrics?: {
      period_days: number;
      avg_daily_recettes: number;
      projected_monthly_recettes: number;
      recettes_growth_percent: number;
      previous_period_income: number;
    };
    total_paid_amount?: number;
    total_en_retard_amount?: number;
    total_impayees_amount?: number;
    total_factures_amount?: number;
    widgets_used?: string[];
  };
  performance?: {
    team_productivity?: Array<{
      team_name: string;
      total_tasks: number;
      completed_tasks: number;
      completion_rate: number;
    }>;
    user_performance?: Array<{
      username: string;
      total_tasks: number;
      completed_tasks: number;
      completion_rate: number;
    }>;
    task_completion_rate?: {
      total: number;
      completed: number;
      rate: number;
    };
    pending_tasks?: number;
    overdue_tasks?: number;
    overdue_activities?: {
      count: number;
      rate_percent: number;
    };
    widgets_used?: string[];
  };
  calendar?: {
    upcoming_deadlines?: Array<{
      id: number;
      title: string;
      deadline: string;
      project: string;
      days_until_deadline: number;
    }>;
    event_distribution?: {
      tasks: number;
      projects: number;
      contrats: number;
    };
    resource_utilization?: {
      active_users: number;
      total_contracts: number;
      utilization_rate: number;
    };
    widgets_used?: string[];
  };
  last_updated?: string;
  user_role?: string;
  widgets_config?: {
    total_available: number;
    total_authorized: number;
    widgets_used: string[];
  };
}

export const useDashboardMetrics = (periodDays: number = 30, widgets?: string[]) => {
  const [data, setData] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await dashboardAPI.getOverview({ period_days: periodDays, widgets });
      setData(response.data);
    } catch (err: any) {
      console.error('Erreur lors de la récupération des métriques du tableau de bord:', err);
      setError(err?.message || 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [periodDays, JSON.stringify(widgets || [])]);

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