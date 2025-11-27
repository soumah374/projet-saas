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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  AlertCircle,
  CheckCircle,
  Search,
  Filter,
  TrendingUp,
  Target,
  Sparkles,
  BarChart3,
  Download,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useWidgetsCatalog,
  isWidgetAvailableForUser,
  getDefaultWidgetsForRole,
  validateWidgetDependencies,
} from '@/hooks/use-widgets-catalog';

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

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  basic: <BarChart3 className="h-4 w-4" />,
  advanced: <Sparkles className="h-4 w-4" />,
  chart: <TrendingUp className="h-4 w-4" />,
  table: <Filter className="h-4 w-4" />,
  kpi: <Zap className="h-4 w-4" />,
  analysis: <Target className="h-4 w-4" />,
};

const DashboardManagerPage: React.FC = () => {
  const { user } = useAuth();
  const [mode, setMode] = useState<'role' | 'user'>('role');
  const [selectedRole, setSelectedRole] = useState<string>('Managing Director');
  const [userId, setUserId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);

  const params = mode === 'user' && userId ? { user_id: Number(userId) } : { role: selectedRole };
  const { selected, setSelected, save, reload, loading } = useDashboardConfig(params);

  const { data: usersData, isLoading: usersLoading } = useUsers({ is_active: true, ordering: 'first_name', page_size: 1000 });
  const users = useMemo(() => usersData?.data?.results || [], [usersData]);

  // Charger le catalogue depuis l'API (source unique de vérité)
  const { data: catalogData, isLoading: catalogLoading } = useWidgetsCatalog();
  const widgetsCatalog = catalogData?.widgets || {};
  const widgetGroups = catalogData?.groups || {};
  const rolePresets = catalogData?.rolePresets || {};

  // Filtrer les widgets selon les critères
  const filteredWidgets = useMemo(() => {
    let widgets = Object.values(widgetsCatalog);

    // Filtre de recherche
    if (searchQuery) {
      widgets = widgets.filter(w =>
        w.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.key.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filtre par catégorie
    if (filterCategory !== 'all') {
      widgets = widgets.filter(w => w.category === filterCategory);
    }

    // Filtre par type
    if (filterType !== 'all') {
      widgets = widgets.filter(w => w.type === filterType);
    }

    // Filtre disponibilité
    if (showOnlyAvailable) {
      widgets = widgets.filter(w =>
        isWidgetAvailableForUser(w.key, widgetsCatalog, mode === 'role' ? selectedRole : user?.role || '', user?.is_staff || false)
      );
    }

    return widgets;
  }, [widgetsCatalog, searchQuery, filterCategory, filterType, showOnlyAvailable, mode, selectedRole, user]);

  // Grouper les widgets filtrés
  const groupedWidgets = useMemo(() => {
    const groups: Record<string, typeof filteredWidgets> = {};

    filteredWidgets.forEach(widget => {
      if (!groups[widget.type]) {
        groups[widget.type] = [];
      }
      groups[widget.type].push(widget);
    });

    return groups;
  }, [filteredWidgets]);

  // Statistiques de sélection
  const stats = useMemo(() => {
    const totalWidgets = Object.keys(widgetsCatalog).length;
    const selectedCount = selected?.length || 0;
    const byCategory = selected?.reduce((acc: Record<string, number>, key: string) => {
      const widget = widgetsCatalog[key];
      if (widget) {
        acc[widget.category] = (acc[widget.category] || 0) + 1;
      }
      return acc;
    }, {});

    return {
      total: totalWidgets,
      selected: selectedCount,
      percentage: totalWidgets > 0 ? (selectedCount / totalWidgets) * 100 : 0,
      byCategory,
    };
  }, [widgetsCatalog, selected]);

  // Vérifier les dépendances
  const dependencyStatus = useMemo(() => {
    return validateWidgetDependencies(selected || [], widgetsCatalog);
  }, [selected, widgetsCatalog]);

  const handleSelectAll = () => {
    const allKeys = filteredWidgets.map(w => w.key);
    setSelected(Array.from(new Set([...(selected || []), ...allKeys])));
  };

  const handleDeselectAll = () => {
    const filteredKeys = filteredWidgets.map(w => w.key);
    setSelected((selected || []).filter(k => !filteredKeys.includes(k)));
  };

  const handleToggleWidget = (widgetKey: string) => {
    if (selected?.includes(widgetKey)) {
      setSelected((selected || []).filter(k => k !== widgetKey));
    } else {
      setSelected(Array.from(new Set([...(selected || []), widgetKey])));
    }
  };

  const handleApplyPreset = () => {
    const preset = getDefaultWidgetsForRole(rolePresets, mode === 'role' ? selectedRole : user?.role || '');
    setSelected(preset);
  };

  const handleExportConfig = () => {
    const config = {
      mode,
      target: mode === 'role' ? selectedRole : userId,
      widgets: selected,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-config-${config.target}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!user?.is_staff) {
    return (
      <div className="max-w-3xl mx-auto mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Accès refusé</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Vous devez être administrateur pour gérer le tableau de bord.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (catalogLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Chargement du catalogue des widgets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* En-tête */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion du Tableau de Bord</h1>
          <p className="text-gray-600 mt-2">
            Configurez les widgets visibles par rôle ou par utilisateur
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportConfig}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Button variant="outline" size="sm" onClick={reload}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Recharger
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Widgets</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Sélectionnés</p>
                <p className="text-2xl font-bold">{stats.selected}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pourcentage</p>
                <p className="text-2xl font-bold">{stats.percentage.toFixed(0)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={cn(
                'p-3 rounded-lg',
                dependencyStatus.valid ? 'bg-green-100' : 'bg-red-100'
              )}>
                {dependencyStatus.valid ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : (
                  <AlertCircle className="h-6 w-6 text-red-600" />
                )}
              </div>
              <div>
                <p className="text-sm text-gray-600">Dépendances</p>
                <p className="text-2xl font-bold">
                  {dependencyStatus.valid ? 'OK' : dependencyStatus.missing.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertes de dépendances */}
      {!dependencyStatus.valid && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-orange-900 mb-2">
                  Dépendances manquantes
                </h4>
                <p className="text-sm text-orange-700 mb-3">
                  Certains widgets sélectionnés nécessitent d'autres widgets pour fonctionner correctement :
                </p>
                <div className="flex flex-wrap gap-2">
                  {dependencyStatus.missing.map(key => (
                    <Badge key={key} variant="outline" className="bg-white">
                      {widgetsCatalog[key]?.label || key}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="configure" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="configure">Configuration</TabsTrigger>
          <TabsTrigger value="presets">Présets par Rôle</TabsTrigger>
          <TabsTrigger value="preview">Aperçu</TabsTrigger>
        </TabsList>

        {/* Configuration */}
        <TabsContent value="configure" className="space-y-6 mt-6">
          {/* Sélection de cible */}
          <Card>
            <CardHeader>
              <CardTitle>Cible de Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-4">
                <Select value={mode} onValueChange={(v: 'role' | 'user') => setMode(v)}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Par utilisateur</SelectItem>
                    <SelectItem value="role">Par rôle</SelectItem>
                  </SelectContent>
                </Select>

                {mode === 'role' ? (
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger className="w-64">
                      <SelectValue placeholder="Rôle" />
                    </SelectTrigger>
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

                <Button variant="outline" onClick={handleApplyPreset}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Appliquer Preset
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Filtres et recherche */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Widgets Disponibles</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {filteredWidgets.length} / {Object.keys(widgetsCatalog).length}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Barre de recherche et filtres */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Rechercher un widget..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes catégories</SelectItem>
                    <SelectItem value="basic">Basique</SelectItem>
                    <SelectItem value="advanced">Avancé</SelectItem>
                    <SelectItem value="chart">Graphique</SelectItem>
                    <SelectItem value="table">Tableau</SelectItem>
                    <SelectItem value="kpi">KPI</SelectItem>
                    <SelectItem value="analysis">Analyse</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous types</SelectItem>
                    <SelectItem value="projects">Projets</SelectItem>
                    <SelectItem value="financial">Financier</SelectItem>
                    <SelectItem value="performance">Performance</SelectItem>
                    <SelectItem value="calendar">Calendrier</SelectItem>
                    <SelectItem value="analytics">Analytics</SelectItem>
                    <SelectItem value="alerts">Alertes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Options supplémentaires */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={showOnlyAvailable}
                    onCheckedChange={(checked) => setShowOnlyAvailable(checked as boolean)}
                  />
                  <span className="text-sm font-medium">Afficher uniquement les widgets disponibles</span>
                </label>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleSelectAll}>
                    Tout sélectionner
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDeselectAll}>
                    Tout désélectionner
                  </Button>
                </div>
              </div>

              {/* Liste des widgets groupés */}
              <div className="space-y-6">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-gray-600">Chargement...</p>
                  </div>
                ) : Object.keys(groupedWidgets).length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Aucun widget ne correspond aux critères de recherche
                  </div>
                ) : (
                  Object.entries(groupedWidgets).map(([groupKey, widgets]) => {
                    const groupInfo = Object.values(widgetGroups).find(g =>
                      g.widgets.some(w => widgets.some(widget => widget.key === w))
                    );

                    return (
                      <div key={groupKey} className="border rounded-lg overflow-hidden">
                        <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium capitalize text-gray-900">
                              {groupInfo?.label || groupKey}
                            </span>
                            <Badge variant="secondary">{widgets.length}</Badge>
                          </div>
                          <Badge variant="outline">
                            {widgets.filter(w => selected?.includes(w.key)).length} sélectionnés
                          </Badge>
                        </div>
                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                          {widgets.map((widget) => {
                            const isSelected = selected?.includes(widget.key);
                            const isAvailable = isWidgetAvailableForUser(
                              widget.key,
                              widgetsCatalog,
                              mode === 'role' ? selectedRole : user?.role || '',
                              user?.is_staff || false
                            );

                            return (
                              <label
                                key={widget.key}
                                className={cn(
                                  'flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-all',
                                  isSelected && 'bg-blue-50 border-blue-300',
                                  !isAvailable && 'opacity-50 cursor-not-allowed'
                                )}
                              >
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() => handleToggleWidget(widget.key)}
                                  disabled={!isAvailable}
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    {CATEGORY_ICONS[widget.category]}
                                    <span className="font-medium text-sm text-gray-900">
                                      {widget.label}
                                    </span>
                                    {widget.defaultEnabled && (
                                      <Badge variant="outline" className="text-xs">
                                        Par défaut
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-600 line-clamp-2">
                                    {widget.description}
                                  </p>
                                  {widget.dependsOn && widget.dependsOn.length > 0 && (
                                    <div className="mt-2 flex items-center gap-1 text-xs text-orange-600">
                                      <AlertCircle className="h-3 w-3" />
                                      <span>Dépend de {widget.dependsOn.length} widget(s)</span>
                                    </div>
                                  )}
                                </div>
                                <Badge variant="secondary" className="text-xs">
                                  {widget.category}
                                </Badge>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Présets par rôle */}
        <TabsContent value="presets" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Présets de Configuration par Rôle</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(rolePresets).map(([role, widgets]) => (
                  <div key={role} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">{role}</h4>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{widgets.length} widgets</Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setMode('role');
                            setSelectedRole(role);
                            setSelected(widgets);
                          }}
                        >
                          Appliquer
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {widgets.slice(0, 10).map(key => (
                        <Badge key={key} variant="outline" className="text-xs">
                          {widgetsCatalog[key]?.label || key}
                        </Badge>
                      ))}
                      {widgets.length > 10 && (
                        <Badge variant="secondary" className="text-xs">
                          +{widgets.length - 10} autres
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aperçu */}
        <TabsContent value="preview" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Aperçu de la Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Résumé */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">
                    Configuration pour: {mode === 'role' ? selectedRole : `Utilisateur #${userId}`}
                  </h4>
                  <p className="text-sm text-blue-700">
                    {stats.selected} widgets sélectionnés sur {stats.total} disponibles ({stats.percentage.toFixed(0)}%)
                  </p>
                </div>

                {/* Widgets par type */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Widgets par Type</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(widgetGroups).map(([groupKey, group]) => {
                      const selectedInGroup = group.widgets.filter(w => selected?.includes(w));
                      if (selectedInGroup.length === 0) return null;

                      return (
                        <div key={groupKey} className="p-4 border rounded-lg">
                          <div className="flex items-center gap-2 mb-3">
                            <h5 className="font-medium text-gray-900">{group.label}</h5>
                            <Badge variant="secondary">{selectedInGroup.length}</Badge>
                          </div>
                          <div className="space-y-2">
                            {selectedInGroup.map(widgetKey => (
                              <div key={widgetKey} className="flex items-center gap-2 text-sm">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <span className="text-gray-700">
                                  {widgetsCatalog[widgetKey]?.label || widgetKey}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <div className="flex justify-end gap-2 sticky bottom-4 bg-white p-4 rounded-lg shadow-lg border">
        <Button variant="outline" onClick={reload}>
          Annuler
        </Button>
        <Button
          onClick={async () => {
            await save();
            await reload();
          }}
          disabled={!dependencyStatus.valid}
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Enregistrer ({stats.selected} widgets)
        </Button>
      </div>
    </div>
  );
};

export default DashboardManagerPage;
