
import { Search, Filter, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CalendarHeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterType: string;
  onFilterChange: (value: string) => void;
}

export const CalendarHeader = ({ searchTerm, onSearchChange, filterType, onFilterChange }: CalendarHeaderProps) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Planning & Calendrier</h2>
        <p className="text-gray-600">Gestion des échéances et événements projet</p>
      </div>
      
      <div className="flex gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher un événement..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 w-64"
          />
        </div>
        
        <Select value={filterType} onValueChange={onFilterChange}>
          <SelectTrigger className="w-40">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les événements</SelectItem>
            <SelectItem value="milestone">Jalons</SelectItem>
            <SelectItem value="deadline">Échéances</SelectItem>
            <SelectItem value="meeting">Réunions</SelectItem>
            <SelectItem value="task">Tâches</SelectItem>
          </SelectContent>
        </Select>
        
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nouvel événement
        </Button>
      </div>
    </div>
  );
};
