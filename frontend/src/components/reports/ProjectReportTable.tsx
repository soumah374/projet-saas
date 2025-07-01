import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  ArrowUpDown, 
  Search, 
  Eye, 
  Download,
  MoreHorizontal,
  Calendar,
  Users,
  DollarSign
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ProjectReportData } from '@/hooks/use-reports';

interface ProjectReportTableProps {
  projects: ProjectReportData[];
  isLoading?: boolean;
  onViewProject?: (projectId: number) => void;
  onExportData?: () => void;
}

type SortField = 'title' | 'status' | 'priority' | 'progress' | 'deadline' | 'budget';
type SortDirection = 'asc' | 'desc';

export const ProjectReportTable = ({ 
  projects, 
  isLoading, 
  onViewProject,
  onExportData 
}: ProjectReportTableProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('title');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'terminé':
        return 'bg-green-100 text-green-800';
      case 'en cours':
        return 'bg-blue-100 text-blue-800';
      case 'en pause':
        return 'bg-yellow-100 text-yellow-800';
      case 'planification':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgente':
        return 'bg-red-100 text-red-800';
      case 'haute':
        return 'bg-orange-100 text-orange-800';
      case 'normale':
        return 'bg-blue-100 text-blue-800';
      case 'basse':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: string) => {
    const numAmount = parseFloat(amount);
    return new Intl.NumberFormat('fr-GN', {
      style: 'currency',
      currency: 'GNF',
      minimumFractionDigits: 0,
    }).format(numAmount);
  };

  const isOverdue = (deadline: string) => {
    return new Date(deadline) < new Date();
  };

  const getTasksCompletionRate = (project: ProjectReportData) => {
    if (project.tasks_total === 0) return 0;
    return Math.round((project.tasks_completed / project.tasks_total) * 100);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedAndFilteredProjects = projects
    .filter(project => 
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.manager.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.manager.last_name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'title':
          aValue = a.title;
          bValue = b.title;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'priority':
          aValue = a.priority;
          bValue = b.priority;
          break;
        case 'progress':
          aValue = a.progress;
          bValue = b.progress;
          break;
        case 'deadline':
          aValue = new Date(a.deadline);
          bValue = new Date(b.deadline);
          break;
        case 'budget':
          aValue = parseFloat(a.budget);
          bValue = parseFloat(b.budget);
          break;
        default:
          return 0;
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Détails des projets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Détails des projets ({projects.length})</CardTitle>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un projet..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-64"
              />
            </div>
            {onExportData && (
              <Button variant="outline" onClick={onExportData}>
                <Download className="w-4 h-4 mr-2" />
                Exporter
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    onClick={() => handleSort('title')}
                    className="h-auto p-0 font-medium"
                  >
                    Projet
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Chef de projet</TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    onClick={() => handleSort('status')}
                    className="h-auto p-0 font-medium"
                  >
                    Statut
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    onClick={() => handleSort('priority')}
                    className="h-auto p-0 font-medium"
                  >
                    Priorité
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    onClick={() => handleSort('progress')}
                    className="h-auto p-0 font-medium"
                  >
                    Progression
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Tâches</TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    onClick={() => handleSort('deadline')}
                    className="h-auto p-0 font-medium"
                  >
                    Échéance
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    onClick={() => handleSort('budget')}
                    className="h-auto p-0 font-medium"
                  >
                    Budget
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Équipe</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedAndFilteredProjects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{project.title}</div>
                      <div className="text-sm text-muted-foreground">
                        ID: {project.id}
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {project.manager.first_name} {project.manager.last_name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {project.manager.email}
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <Badge className={getStatusColor(project.status)}>
                      {project.status}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <Badge className={getPriorityColor(project.priority)}>
                      {project.priority}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{project.progress}%</span>
                      </div>
                      <Progress value={project.progress} className="h-2" />
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm">
                        {project.tasks_completed}/{project.tasks_total}
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Complétion: {getTasksCompletionRate(project)}%</span>
                      </div>
                      {project.tasks_overdue > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {project.tasks_overdue} en retard
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center text-sm">
                        <Calendar className="w-3 h-3 mr-1" />
                        {format(new Date(project.deadline), 'dd/MM/yyyy', { locale: fr })}
                      </div>
                      {isOverdue(project.deadline) && (
                        <Badge variant="destructive" className="text-xs">
                          En retard
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center text-sm">
                      <DollarSign className="w-3 h-3 mr-1" />
                      {formatCurrency(project.budget)}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center text-sm">
                      <Users className="w-3 h-3 mr-1" />
                      {project.team_members_count} membres
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {onViewProject && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewProject(project.id)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {sortedAndFilteredProjects.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm 
                ? `Aucun projet trouvé pour "${searchTerm}"`
                : 'Aucun projet disponible'
              }
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}; 