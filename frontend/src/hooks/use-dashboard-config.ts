import { useEffect, useState } from 'react';
import { dashboardAPI } from '@/lib/api';
import { Toast } from '@radix-ui/react-toast';
import { toast } from './use-toast';

export interface WidgetCatalogItem {
  type: 'projects' | 'financial' | 'performance' | 'calendar';
  label: string;
}

export type WidgetCatalog = Record<string, WidgetCatalogItem>;

export const useDashboardConfig = (params?: { role?: string; user_id?: number }) => {
  const [catalog, setCatalog] = useState<WidgetCatalog>({});
  const [selected, setSelected] = useState<string[]>([]);
  const [userSelected, setUserSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      // console.log('Loading dashboard config with params:', params);
      
      const [catRes, cfgRes, userRes] = await Promise.all([
        dashboardAPI.getWidgetsCatalog(),
        dashboardAPI.getWidgetsConfig(params || {}),
        dashboardAPI.getWidgetsUserConfig(params || {})
      ]);

      setCatalog(catRes.data || {});
      setSelected(cfgRes.data?.widgets || []);
      setUserSelected(userRes.data?.widgets || []);
    } catch (e: any) {
      // console.error('Error loading dashboard config:', e);
      setError(e?.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  const save = async (data?: { role?: string; user_id?: number; widgets?: string[]; is_active?: boolean }) => {
    const payload = {
      role: params?.role ?? data?.role,
      user_id: params?.user_id ?? data?.user_id,
      widgets: data?.widgets ?? selected,
      is_active: data?.is_active ?? true,
    };
    const res = await dashboardAPI.saveWidgetsConfig(payload);
    toast({
      title: 'Configuration enregistrée',
      description: 'Les widgets ont été enregistrés avec succès',
    });
    return res.data;
  };

  useEffect(() => {
    load();
  }, [JSON.stringify(params || {})]);

  return { catalog, selected, setSelected, userSelected, setUserSelected, loading, error, reload: load, save };
}; 