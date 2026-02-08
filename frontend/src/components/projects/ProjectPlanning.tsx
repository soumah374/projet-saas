import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Users, Search, LayoutGrid, List, Loader2, UserPlus } from 'lucide-react';
import { useProjectLifecycle } from '@/hooks/use-project-lifecycle';
import { useProjectTasks, useUpdateProjectTask } from '@/hooks/use-projects';
import { useProject } from '@/hooks/use-projects';
import { toast } from 'sonner';
import { ProjectKanbanView } from './ProjectKanbanView';
import { QuickTaskCreate } from './QuickTaskCreate';
import { TaskDetailModal } from './TaskDetailModal';
import { Label } from '@/components/ui/label';
import { StandardTasksManager } from './StandardTasksManager';
import { PlanningTeamPanel } from './PlanningTeamPanel';
import { PlanningTaskList } from './PlanningTaskList';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import type { ProjectTask } from '@/lib/types';

interface ProjectPlanningProps {
  projectId: string;
}

export function ProjectPlanning({ projectId }: ProjectPlanningProps) {
  const [activeTab, setActiveTab] = useState('templates');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [taskViewMode, setTaskViewMode] = useState<'list' | 'kanban'>('kanban');

  // États pour l'assignation des tâches
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false);
  const [selectedTaskForAssignment, setSelectedTaskForAssignment] = useState<any>(null);
  const [selectedMemberForAssignment, setSelectedMemberForAssignment] = useState<string | undefined>(undefined);
  const [selectedTaskForDetails, setSelectedTaskForDetails] = useState<any>(null);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);

  const debouncedSearch = useDebouncedValue(searchTerm, 300);

  const {
    teamMembers,
    loading
  } = useProjectLifecycle(projectId);

  const { data: tasks } = useProjectTasks(projectId);
  const { data: projectDetails } = useProject(projectId);
  const updateTaskMutation = useUpdateProjectTask();

  const filteredTasks = tasks?.results?.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      task.description.toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Fonctions pour l'assignation des tâches
  const handleOpenAssignmentDialog = (task: ProjectTask) => {
    setSelectedTaskForAssignment(task);
    setSelectedMemberForAssignment(task.assigned_to?.toString() || undefined);
    setShowAssignmentDialog(true);
  };

  const handleAssignTask = async () => {
    if (!selectedTaskForAssignment || !selectedMemberForAssignment) {
      toast.error('Veuillez sélectionner une tâche et un membre');
      return;
    }

    try {
      await updateTaskMutation.mutateAsync({
        projectId,
        taskId: selectedTaskForAssignment.id,
        data: { assigned_to: parseInt(selectedMemberForAssignment) }
      });

      const member = teamMembers?.find(m => m.user === parseInt(selectedMemberForAssignment));
      const memberName = member ? member.user_name : 'Membre inconnu';

      toast.success(`Activité "${selectedTaskForAssignment.title}" assignée à ${memberName}`);
      setShowAssignmentDialog(false);
      setSelectedTaskForAssignment(null);
      setSelectedMemberForAssignment(undefined);
    } catch {
      // Error handled by hook
    }
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Planification du projet</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="templates">Activités standards</TabsTrigger>
              <TabsTrigger value="tasks">Activités</TabsTrigger>
              <TabsTrigger value="team">Équipe</TabsTrigger>
            </TabsList>

            <TabsContent value="tasks" className="space-y-4">
              <div className="text-sm text-muted-foreground mb-4">
                <span className="font-medium">i</span> Toutes les activités sont créées à partir des services du catalogue dans l'onglet "Activités standards"
              </div>

              {/* Création rapide de tâche */}
              <QuickTaskCreate projectId={projectId} />

              <div className="flex justify-between items-center mb-4">
                <div className="flex-1 flex gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Rechercher une activité..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="À faire">À faire</SelectItem>
                      <SelectItem value="En cours">En cours</SelectItem>
                      <SelectItem value="En pause">En pause</SelectItem>
                      <SelectItem value="Terminé">Terminé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Toggle vue Liste/Kanban */}
                <div className="flex gap-2 ml-4">
                  <Button
                    variant={taskViewMode === 'kanban' ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => setTaskViewMode('kanban')}
                    title="Vue Kanban"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={taskViewMode === 'list' ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => setTaskViewMode('list')}
                    title="Vue liste"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Vue Kanban ou Liste */}
              {taskViewMode === 'kanban' ? (
                <ProjectKanbanView
                  tasks={filteredTasks || []}
                  projectId={projectId}
                  onOpenAssignmentDialog={handleOpenAssignmentDialog}
                />
              ) : (
                <PlanningTaskList
                  tasks={filteredTasks || []}
                  projectId={projectId}
                  onOpenAssignmentDialog={handleOpenAssignmentDialog}
                />
              )}
            </TabsContent>

            <TabsContent value="team" className="space-y-4">
              <PlanningTeamPanel projectId={projectId} />
            </TabsContent>

            <TabsContent value="templates" className="space-y-4">
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">
                  {projectDetails?.contract ? 'Création d\'activités basées sur le contrat' : 'Création d\'activités standards'}
                </h3>
                <p className="text-sm text-blue-700">
                  {projectDetails?.contract
                    ? 'Les activités sont créées automatiquement à partir des services définis dans le contrat du projet.'
                    : 'Sélectionnez une catégorie du catalogue pour créer automatiquement toutes les activités standards associées au projet. Ces activités seront basées sur les services disponibles dans le catalogue.'
                  }
                </p>
              </div>
              <StandardTasksManager
                projectId={projectId}
                contractId={projectDetails?.contract || null}
                onTasksCreated={() => {}}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Dialogue d'assignation des tâches */}
      <Dialog open={showAssignmentDialog} onOpenChange={setShowAssignmentDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assigner une activité</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedTaskForAssignment && (
              <div>
                <Label>Activité sélectionnée</Label>
                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium">{selectedTaskForAssignment.title}</p>
                  <p className="text-sm text-gray-600">{selectedTaskForAssignment.description}</p>
                  {selectedTaskForAssignment.assigned_to_name && (
                    <p className="text-sm text-blue-600 mt-1">
                      Actuellement assignée à: {selectedTaskForAssignment.assigned_to_name}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div>
              <Label>Membre du projet</Label>
              <Select
                value={selectedMemberForAssignment}
                onValueChange={setSelectedMemberForAssignment}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Sélectionner un membre" />
                </SelectTrigger>
                <SelectContent>
                  {loading ? (
                    <SelectItem value="loading" disabled>
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Chargement des membres...
                      </div>
                    </SelectItem>
                  ) : teamMembers && teamMembers.length > 0 ? (
                    teamMembers.map((member: any) => (
                      <SelectItem key={member.id} value={member.user.toString()}>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span>{member.user_name}</span>
                          <Badge variant="outline" className="text-xs">
                            {member.role} {member.user_details.full_name}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-members" disabled>
                      Aucun membre disponible
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowAssignmentDialog(false)}
              >
                Annuler
              </Button>
              <Button
                onClick={handleAssignTask}
                disabled={!selectedMemberForAssignment}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Assigner la tâche
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Task Detail Modal with Comments */}
      <TaskDetailModal
        task={selectedTaskForDetails}
        projectId={projectId}
        open={isTaskDetailOpen}
        onOpenChange={setIsTaskDetailOpen}
      />
    </>
  );
}
