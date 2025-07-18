import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useTimesheets } from '@/hooks/use-timesheets';
import { TimeSheetModal } from './TimeSheetModal';
import { Plus, Search, Filter, Check, Clock, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { TimeSheet } from '@/lib/api';

interface TimeSheetListProps {
  projectId: string;
}

export const TimeSheetList = ({ projectId }: TimeSheetListProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'validated' | 'pending'>('all');
  const [selectedTimeSheet, setSelectedTimeSheet] = useState<TimeSheet | null>(null);
  const [viewMode, setViewMode] = useState<'create' | 'edit' | 'view'>('create');

  const { data: timesheetsData, isLoading } = useTimesheets(projectId);
  const timeSheets = timesheetsData?.results || [];

  const filteredTimeSheets = timeSheets.filter(timeSheet => {
    const matchesSearch = timeSheet.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'validated' && timeSheet.validated_by) ||
      (filterStatus === 'pending' && !timeSheet.validated_by);
    return matchesSearch && matchesStatus;
  });

  const handleView = (timeSheet: TimeSheet) => {
    setSelectedTimeSheet(timeSheet);
    setViewMode('view');
  };

  const handleEdit = (timeSheet: TimeSheet) => {
    setSelectedTimeSheet(timeSheet);
    setViewMode('edit');
  };

  const handleClose = () => {
    setSelectedTimeSheet(null);
    setViewMode('create');
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Feuilles de temps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Feuilles de temps</CardTitle>
          <TimeSheetModal
            projectId={projectId}
            mode="create"
            onClose={handleClose}
          >
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle feuille de temps
            </Button>
          </TimeSheetModal>
        </div>

        <div className="flex gap-4 mt-4">
          <div className="flex-1">
            <Label>Rechercher</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher une description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <Label>Statut</Label>
            <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="validated">Validés</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Tâche</TableHead>
                <TableHead>Heures</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTimeSheets.map((timeSheet) => (
                <TableRow key={timeSheet.id}>
                  <TableCell>
                    {format(new Date(timeSheet.date), 'dd/MM/yyyy', { locale: fr })}
                  </TableCell>
                  <TableCell>{timeSheet.task_details?.title || 'N/A'}</TableCell>
                  <TableCell>{timeSheet.hours}h</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {timeSheet.description}
                  </TableCell>
                  <TableCell>
                    {timeSheet.validated_by ? (
                      <Badge className="bg-green-100 text-green-800">
                        <Check className="h-3 w-3 mr-1" />
                        Validé
                      </Badge>
                    ) : (
                      <Badge className="bg-yellow-100 text-yellow-800">
                        <Clock className="h-3 w-3 mr-1" />
                        En attente
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <TimeSheetModal
                        projectId={projectId}
                        timeSheet={timeSheet}
                        mode="view"
                      >
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-2" />
                          Voir
                        </Button>
                      </TimeSheetModal>
                      {!timeSheet.validated_by && (
                        <TimeSheetModal
                          projectId={projectId}
                          timeSheet={timeSheet}
                          mode="edit"
                        >
                        <Button size="sm">
                          Modifier
                        </Button>
                      </TimeSheetModal>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredTimeSheets.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    Aucune feuille de temps trouvée
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}; 