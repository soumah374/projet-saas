import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X, Filter, Search, Calendar, Users, Building2, FolderKanban } from 'lucide-react';
import { Label } from '@/components/ui/label';

export interface DashboardFilters {
  searchQuery?: string;
  teamIds?: number[];
  departmentIds?: number[];
  projectIds?: number[];
  clientIds?: number[];
  status?: string[];
  priority?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
}

interface AdvancedFiltersProps {
  filters: DashboardFilters;
  onFiltersChange: (filters: DashboardFilters) => void;
  teams?: Array<{ id: number; name: string }>;
  departments?: Array<{ id: number; name: string }>;
  projects?: Array<{ id: number; name: string }>;
  clients?: Array<{ id: number; name: string }>;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const statusOptions = [
  { value: 'Prospection', label: 'Prospection' },
  { value: 'Production', label: 'Production' },
  { value: 'Livraison', label: 'Livraison' },
  { value: 'Terminé', label: 'Terminé' },
  { value: 'En pause', label: 'En pause' },
  { value: 'Annulé', label: 'Annulé' },
];

const priorityOptions = [
  { value: 'Low', label: 'Faible' },
  { value: 'Normal', label: 'Normal' },
  { value: 'High', label: 'Haute' },
  { value: 'Urgent', label: 'Urgent' },
];

export const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  filters,
  onFiltersChange,
  teams = [],
  departments = [],
  projects = [],
  clients = [],
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const [localFilters, setLocalFilters] = useState<DashboardFilters>(filters);

  const updateFilter = (key: keyof DashboardFilters, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    const emptyFilters: DashboardFilters = {};
    setLocalFilters(emptyFilters);
    onFiltersChange(emptyFilters);
  };

  const activeFilterCount = Object.entries(localFilters).filter(([key, value]) => {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object' && value !== null) return Object.values(value).some(v => v);
    return value !== undefined && value !== '';
  }).length;

  if (isCollapsed) {
    return (
      <Card className="border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary" />
              <span className="font-medium">Filtres avancés</span>
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeFilterCount} actif{activeFilterCount > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={onToggleCollapse}>
              Afficher
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres Avancés
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFilterCount} actif{activeFilterCount > 1 ? 's' : ''}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-2" />
                Effacer tout
              </Button>
            )}
            {onToggleCollapse && (
              <Button variant="outline" size="sm" onClick={onToggleCollapse}>
                Réduire
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Recherche globale */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Recherche globale
          </Label>
          <Input
            placeholder="Rechercher par nom, description..."
            value={localFilters.searchQuery || ''}
            onChange={(e) => updateFilter('searchQuery', e.target.value)}
          />
        </div>

        {/* Filtres en grille */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Équipes */}
          {teams.length > 0 && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Équipes
              </Label>
              <Select
                value={localFilters.teamIds?.[0]?.toString() || ''}
                onValueChange={(value) =>
                  updateFilter('teamIds', value ? [parseInt(value)] : [])
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les équipes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Toutes</SelectItem>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id.toString()}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Départements */}
          {departments.length > 0 && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Départements
              </Label>
              <Select
                value={localFilters.departmentIds?.[0]?.toString() || ''}
                onValueChange={(value) =>
                  updateFilter('departmentIds', value ? [parseInt(value)] : [])
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous les départements" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tous</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id.toString()}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Projets */}
          {projects.length > 0 && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <FolderKanban className="h-4 w-4" />
                Projets
              </Label>
              <Select
                value={localFilters.projectIds?.[0]?.toString() || ''}
                onValueChange={(value) =>
                  updateFilter('projectIds', value ? [parseInt(value)] : [])
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous les projets" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tous</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Statut */}
          <div className="space-y-2">
            <Label>Statut</Label>
            <Select
              value={localFilters.status?.[0] || ''}
              onValueChange={(value) =>
                updateFilter('status', value ? [value] : [])
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tous</SelectItem>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Priorité */}
          <div className="space-y-2">
            <Label>Priorité</Label>
            <Select
              value={localFilters.priority?.[0] || ''}
              onValueChange={(value) =>
                updateFilter('priority', value ? [value] : [])
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Toutes les priorités" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Toutes</SelectItem>
                {priorityOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Période personnalisée */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Période personnalisée
          </Label>
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="date"
              value={localFilters.dateRange?.start || ''}
              onChange={(e) =>
                updateFilter('dateRange', {
                  ...localFilters.dateRange,
                  start: e.target.value,
                })
              }
              placeholder="Date de début"
            />
            <Input
              type="date"
              value={localFilters.dateRange?.end || ''}
              onChange={(e) =>
                updateFilter('dateRange', {
                  ...localFilters.dateRange,
                  end: e.target.value,
                })
              }
              placeholder="Date de fin"
            />
          </div>
        </div>

        {/* Badges des filtres actifs */}
        {activeFilterCount > 0 && (
          <div className="pt-2 border-t">
            <div className="flex flex-wrap gap-2">
              {localFilters.searchQuery && (
                <Badge variant="secondary" className="gap-1">
                  Recherche: {localFilters.searchQuery}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={() => updateFilter('searchQuery', '')}
                  />
                </Badge>
              )}
              {localFilters.status && localFilters.status.length > 0 && (
                <Badge variant="secondary" className="gap-1">
                  Statut: {localFilters.status.join(', ')}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={() => updateFilter('status', [])}
                  />
                </Badge>
              )}
              {localFilters.priority && localFilters.priority.length > 0 && (
                <Badge variant="secondary" className="gap-1">
                  Priorité: {localFilters.priority.join(', ')}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={() => updateFilter('priority', [])}
                  />
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
