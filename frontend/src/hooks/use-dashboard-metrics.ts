import { useState, useEffect } from 'react';
import { dashboardAPI } from '@/lib/api';

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
    progress_retards?: {
      projects_overdue_count: number;
      unbilled_amount_total: number;
    };
    project_performance?: any;
  };
  financial?: any;
  performance?: any;
  calendar?: any;
  last_updated?: string;
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