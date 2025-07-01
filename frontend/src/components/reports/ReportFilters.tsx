import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Filter, CalendarIcon, X, Search } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ReportFilters as FilterType } from '@/hooks/use-reports';

interface ReportFiltersProps {
  filters: FilterType;
  onFiltersChange: (filters: FilterType) => void;
  onApplyFilters: () => void;
  onResetFilters: () => void;
}

export const ReportFilters = ({ 
  filters, 
  onFiltersChange, 
  onApplyFilters, 
  onResetFilters 
}: ReportFiltersProps) => {
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);

  const projectStatuses = [
    'Planification',
    'En cours', 
    'Production',
    'En pause',
    'Terminé'
  ];

  const projectPriorities = [
    'Basse',
    'Normale', 
    'Haute',
    'Urgente'
  ];

  const projectTypes = [
    'Événementiel',
    'Communication',
    'Audiovisuel',
    'Production',
    'Digital',
    'Conseil'
  ];

  const handleDateChange = (field: 'date_from' | 'date_to', date: Date | undefined) => {
    onFiltersChange({
      ...filters,
      [field]: date ? format(date, 'yyyy-MM-dd') : undefined
    });
  };

  const removeFilter = (key: keyof FilterType) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    onFiltersChange(newFilters);
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => value !== undefined && value !== '').length;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4" />
            <CardTitle className="text-lg">Filtres de rapport</CardTitle>
            {getActiveFiltersCount() > 0 && (
              <Badge variant="secondary">
                {getActiveFiltersCount()} filtre(s) actif(s)
              </Badge>
            )}
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={onResetFilters}>
              <X className="w-4 h-4 mr-1" />
              Réinitialiser
            </Button>
            <Button size="sm" onClick={onApplyFilters}>
              <Search className="w-4 h-4 mr-1" />
              Appliquer
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Période */}
          <div className="space-y-2">
            <Label>Date de début</Label>
            <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.date_from 
                    ? format(new Date(filters.date_from), 'PPP', { locale: fr })
                    : 'Sélectionner une date'
                  }
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" style={{ zIndex: 9999 }}>
                <Calendar
                  mode="single"
                  selected={filters.date_from ? new Date(filters.date_from) : undefined}
                  onSelect={(date) => {
                    handleDateChange('date_from', date);
                    setStartDateOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Date de fin</Label>
            <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.date_to 
                    ? format(new Date(filters.date_to), 'PPP', { locale: fr })
                    : 'Sélectionner une date'
                  }
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" style={{ zIndex: 9999 }}>
                <Calendar
                  mode="single"
                  selected={filters.date_to ? new Date(filters.date_to) : undefined}
                  onSelect={(date) => {
                    handleDateChange('date_to', date);
                    setEndDateOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Statut */}
          <div className="space-y-2">
            <Label>Statut du projet</Label>
            <Select 
              value={filters.status || ''} 
              onValueChange={(value) => onFiltersChange({ ...filters, status: value || undefined })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tous les statuts</SelectItem>
                {projectStatuses.map(status => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Priorité */}
          <div className="space-y-2">
            <Label>Priorité</Label>
            <Select 
              value={filters.priority || ''} 
              onValueChange={(value) => onFiltersChange({ ...filters, priority: value || undefined })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Toutes les priorités" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Toutes les priorités</SelectItem>
                {projectPriorities.map(priority => (
                  <SelectItem key={priority} value={priority}>{priority}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Type de projet */}
          <div className="space-y-2">
            <Label>Type de projet</Label>
            <Select 
              value={filters.project_type || ''} 
              onValueChange={(value) => onFiltersChange({ ...filters, project_type: value || undefined })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tous les types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tous les types</SelectItem>
                {projectTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Membre d'équipe */}
          <div className="space-y-2">
            <Label>ID Membre d'équipe</Label>
            <Input
              type="number"
              placeholder="ID du membre"
              value={filters.team_member || ''}
              onChange={(e) => onFiltersChange({ 
                ...filters, 
                team_member: e.target.value ? parseInt(e.target.value) : undefined 
              })}
            />
          </div>
        </div>

        {/* Filtres actifs */}
        {getActiveFiltersCount() > 0 && (
          <div className="mt-4 pt-4 border-t">
            <Label className="text-sm font-medium">Filtres actifs:</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {filters.date_from && (
                <Badge variant="outline" className="flex items-center gap-1">
                  Début: {format(new Date(filters.date_from), 'dd/MM/yyyy')}
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => removeFilter('date_from')}
                  />
                </Badge>
              )}
              {filters.date_to && (
                <Badge variant="outline" className="flex items-center gap-1">
                  Fin: {format(new Date(filters.date_to), 'dd/MM/yyyy')}
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => removeFilter('date_to')}
                  />
                </Badge>
              )}
              {filters.status && (
                <Badge variant="outline" className="flex items-center gap-1">
                  Statut: {filters.status}
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => removeFilter('status')}
                  />
                </Badge>
              )}
              {filters.priority && (
                <Badge variant="outline" className="flex items-center gap-1">
                  Priorité: {filters.priority}
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => removeFilter('priority')}
                  />
                </Badge>
              )}
              {filters.project_type && (
                <Badge variant="outline" className="flex items-center gap-1">
                  Type: {filters.project_type}
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => removeFilter('project_type')}
                  />
                </Badge>
              )}
              {filters.team_member && (
                <Badge variant="outline" className="flex items-center gap-1">
                  Membre: {filters.team_member}
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => removeFilter('team_member')}
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