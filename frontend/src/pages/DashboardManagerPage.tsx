import React, { useMemo, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useDashboardConfig } from '@/hooks/use-dashboard-config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useUsers } from '@/hooks/use-users';

const ROLES = [
  'superuser',
  'Managing Director',
  'Finance/Admin',
  'Chef de projet',
  'Designer',
  'Développeur',
  'Rédacteur',
  'Consultant'
];

const DashboardManagerPage: React.FC = () => {
  const { user } = useAuth();
  const [mode, setMode] = useState<'role' | 'user'>('role');
  const [selectedRole, setSelectedRole] = useState<string>(user?.role || 'Managing Director');
  const [userId, setUserId] = useState<string>('');

  const params = mode === 'user' && userId ? { user_id: Number(userId) } : { role: selectedRole };
  const { catalog, selected, setSelected, save, reload, loading } = useDashboardConfig(params);

  const { data: usersData, isLoading: usersLoading } = useUsers({ is_active: true, ordering: 'first_name', page_size: 1000 });
  const users = useMemo(() => usersData?.data?.results || [], [usersData]);

  const groupedCatalog = useMemo(() => {
    const groups: Record<string, Array<{ key: string; label: string }>> = {};
    
    // Debug logging
    if (!catalog || typeof catalog !== 'object') {
      return groups;
    }
    
    // Handle case where catalog might be an array
    if (Array.isArray(catalog)) {
      return groups;
    }
    
    try {
      Object.entries(catalog).forEach(([key, item]: any) => {
        if (item && typeof item === 'object' && item.type) {
          const group = item.type || 'autres';
          if (!groups[group]) groups[group] = [];
          groups[group].push({ key, label: item.label || key });
        } else {
          console.log('Skipping invalid item:', key, item);
        }
      });
    } catch (error) {
      console.error('Error processing catalog:', error);
    }
    
    // If no groups were created, create a fallback structure
    if (Object.keys(groups).length === 0) {
      groups['autres'] = [];
      if (catalog && typeof catalog === 'object') {
        Object.keys(catalog).forEach(key => {
          groups['autres'].push({ key, label: key });
        });
      }
    }
    
    // If still no groups, create a default fallback
    if (Object.keys(groups).length === 0) {
      groups['projects'] = [
        { key: 'projects.status_distribution', label: 'Répartition des statuts des projets' },
        { key: 'projects.recent_projects', label: 'Projets récents' }
      ];
      groups['financial'] = [
        { key: 'financial.revenue_trend', label: 'Tendance des recettes' },
        { key: 'financial.billing_status', label: 'Statut de facturation' }
      ];
    }
    return groups;
  }, [catalog]);

  if (!user?.is_staff) {
    return (
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Accès refusé</CardTitle>
          </CardHeader>
          <CardContent>Vous devez être administrateur pour gérer le tableau de bord.</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-8xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Gestion du Tableau de Bord</h1>
        <p className="text-gray-600">Sélectionnez les widgets visibles par rôle ou par utilisateur.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cible</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <Select value={mode} onValueChange={(v: 'role' | 'user') => setMode(v)}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Mode" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="role">Par rôle</SelectItem>
                <SelectItem value="user">Par utilisateur</SelectItem>
              </SelectContent>
            </Select>
            {mode === 'role' ? (
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="w-64"><SelectValue placeholder="Rôle" /></SelectTrigger>
                <SelectContent>
                  {ROLES.map(r => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="flex items-center gap-2">
                <Select value={userId} onValueChange={setUserId} disabled={usersLoading}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder={usersLoading ? 'Chargement…' : 'Sélectionner un utilisateur'} />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((u: any) => (
                      <SelectItem key={u.id} value={String(u.id)}>
                        {(u.full_name && u.full_name.trim()) || `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Badge variant="secondary">Override utilisateur</Badge>
              </div>
            )}
            <Button variant="outline" onClick={reload} disabled={loading}>Recharger</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Widgets disponibles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading && <div className="text-gray-500">Chargement…</div>}
          {!loading && Object.keys(groupedCatalog).length === 0 && (
            <div className="text-gray-500">Aucun widget disponible</div>
          )}
          {!loading && Object.entries(groupedCatalog).map(([group, items]) => (
            <div key={group} className="border rounded-md">
              <div className="px-4 py-2 bg-gray-50 border-b font-medium capitalize">{group}</div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                {items.map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-3 p-2 border rounded-md">
                    <Checkbox
                      checked={selected.includes(key)}
                      onCheckedChange={(checked) => {
                        if (checked) setSelected(prev => Array.from(new Set([...(prev || []), key])));
                        else setSelected(prev => (prev || []).filter(k => k !== key));
                      }}
                    />
                    <span className="text-sm text-gray-800">{label}</span>
                    <span className="ml-auto text-xs text-gray-500">{key}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={reload}>Annuler</Button>
        <Button onClick={async () => { await save(); await reload(); }}>Enregistrer</Button>
      </div>
    </div>
  );
};

export default DashboardManagerPage; 