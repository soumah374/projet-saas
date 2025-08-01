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
    { value: 'all', label: 'Tous les statuts' },
    { value: 'planning', label: 'Planification' },
    { value: 'in_progress', label: 'En cours' },
    { value: 'production', label: 'Production' },
    { value: 'paused', label: 'En pause' },
    { value: 'completed', label: 'Terminé' }
  ];

  const projectTypes = [
    { value: 'all', label: 'Tous les types' },
    { value: 'event', label: 'Événementiel' },
    { value: 'communication', label: 'Communication' },
    { value: 'audiovisual', label: 'Audiovisuel' },
    { value: 'production', label: 'Production' },
    { value: 'digital', label: 'Digital' },
    { value: 'consulting', label: 'Conseil' }
  ];

  const handleDateChange = (field: 'startDate' | 'endDate', date: Date | undefined) => {
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
                  {filters.startDate 
                    ? format(new Date(filters.startDate), 'PPP', { locale: fr })
                    : 'Sélectionner une date'
                  }
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" style={{ zIndex: 9999 }}>
                <Calendar
                  mode="single"
                  selected={filters.startDate ? new Date(filters.startDate) : undefined}
                  onSelect={(date) => {
                    handleDateChange('startDate', date);
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
                  {filters.endDate 
                    ? format(new Date(filters.endDate), 'PPP', { locale: fr })
                    : 'Sélectionner une date'
                  }
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" style={{ zIndex: 9999 }}>
                <Calendar
                  mode="single"
                  selected={filters.endDate ? new Date(filters.endDate) : undefined}
                  onSelect={(date) => {
                    handleDateChange('endDate', date);
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
              value={filters.status || 'all'} 
              onValueChange={(value) => onFiltersChange({ ...filters, status: value === 'all' ? undefined : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                {projectStatuses.map(status => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Type de projet */}
          <div className="space-y-2">
            <Label>Type de projet</Label>
            <Select 
              value={filters.type || 'all'} 
              onValueChange={(value) => onFiltersChange({ ...filters, type: value === 'all' ? undefined : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tous les types" />
              </SelectTrigger>
              <SelectContent>
                {projectTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
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
              value={filters.team || ''}
              onChange={(e) => onFiltersChange({ 
                ...filters, 
                team: e.target.value ? e.target.value : undefined 
              })}
            />
          </div>
        </div>

        {/* Filtres actifs */}
        {getActiveFiltersCount() > 0 && (
          <div className="mt-4 pt-4 border-t">
            <Label className="text-sm font-medium">Filtres actifs:</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {filters.startDate && (
                <Badge variant="outline" className="flex items-center gap-1">
                  Début: {format(new Date(filters.startDate), 'dd/MM/yyyy')}
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => removeFilter('startDate')}
                  />
                </Badge>
              )}
              {filters.endDate && (
                <Badge variant="outline" className="flex items-center gap-1">
                  Fin: {format(new Date(filters.endDate), 'dd/MM/yyyy')}
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => removeFilter('endDate')}
                  />
                </Badge>
              )}
              {filters.status && (
                <Badge variant="outline" className="flex items-center gap-1">
                  Statut: {projectStatuses.find(s => s.value === filters.status)?.label}
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => removeFilter('status')}
                  />
                </Badge>
              )}
              {filters.type && (
                <Badge variant="outline" className="flex items-center gap-1">
                  Type: {projectTypes.find(t => t.value === filters.type)?.label}
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => removeFilter('type')}
                  />
                </Badge>
              )}
              {filters.team && (
                <Badge variant="outline" className="flex items-center gap-1">
                  Membre: {filters.team}
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => removeFilter('team')}
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