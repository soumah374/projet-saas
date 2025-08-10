import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Users, Calendar as CalendarIcon, Plus, X, Search, Edit, Play, View, Clock, Package, UserPlus, Loader2 } from 'lucide-react';
import { useProjectLifecycle } from '@/hooks/use-project-lifecycle';
import { useUsers } from '@/hooks/use-users';
import { useProjectTasks, useUpdateProjectTask } from '@/hooks/use-projects';
import { useProject } from '@/hooks/use-projects';
import { toast } from 'sonner';

import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import { TaskModal } from '../TaskModal';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { DeleteMemberProject } from '../DeleteMemberProject';
import { StartTaskProjectModal } from '../StartTaskProjectModal';
import { StandardTasksManager } from './StandardTasksManager';

interface ProjectPlanningProps {
  projectId: string;
}

const teamMemberSchema = z.object({
  project: z.string().min(1, 'Sélectionnez un projet'),
  user: z.string().min(1, 'Sélectionnez un utilisateur'),
  role: z.string().min(1, 'Sélectionnez un rôle'),
  allocation_percentage: z.number().min(0, { message: "L'allocation doit être supérieure ou égale à 0%" })
});

const roleOptions = [
  'Chef de projet',
  'Designer',
  'Développeur',
  'Rédacteur',
  'Consultant',
  'Assistant'
];

export function ProjectPlanning({ projectId }: ProjectPlanningProps) {
  const [activeTab, setActiveTab] = useState('templates');
  const [isTeamDialogOpen, setIsTeamDialogOpen] = useState(false);
  const [selectedTemplateCategory, setSelectedTemplateCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // États pour l'assignation des tâches
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false);
  const [selectedTaskForAssignment, setSelectedTaskForAssignment] = useState<any>(null);
  const [selectedMemberForAssignment, setSelectedMemberForAssignment] = useState<string>('');
  
  const { 
    teamMembers,
    addTeamMember,
    applyTaskTemplate,
    loading,
    services
  } = useProjectLifecycle(projectId);

  const { data: users } = useUsers();
  const { data: tasks } = useProjectTasks(projectId);
  const { data: projectDetails } = useProject(projectId);
  const updateTaskMutation = useUpdateProjectTask();
  
  const form = useForm<z.infer<typeof teamMemberSchema>>({
    resolver: zodResolver(teamMemberSchema),
    defaultValues: {
      project: projectId,
      user: '',
      role: '',
      allocation_percentage: 100
    }
  });
  
  const handleAddTeamMember = async (data: z.infer<typeof teamMemberSchema>) => {
    try {
      await addTeamMember(data);
      setIsTeamDialogOpen(false);
      form.reset();
    } catch (error: any) {
      if (error.response?.data?.error) {
        console.log(error.response.data.error)
        form.setError('role', {
          type: 'manual',
          message: error.response.data.error
        });
      } else {
        console.error('Error adding team member:', error);
        form.setError('role', {
          type: 'manual',
          message: "Une erreur s'est produite lors de l'ajout du membre"
        });
      }
    }
  };
  
  const handleApplyTemplate = async () => {
    if (!selectedTemplateCategory) return;
    try {
      await applyTaskTemplate(selectedTemplateCategory);
      setSelectedTemplateCategory('');
    } catch (error) {
      console.error('Error applying template:', error);
    }
  };

  const filteredTasks = tasks?.results?.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const handleUserChange = async (userId: string) => {
    form.setValue('user', userId);
    setSelectedUser(userId);
  };

  // Fonctions pour l'assignation des tâches
  const handleOpenAssignmentDialog = (task: any) => {
    setSelectedTaskForAssignment(task);
    setSelectedMemberForAssignment(task.assigned_to?.toString() || '');
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
        data: {
          assigned_to: parseInt(selectedMemberForAssignment)
        }
      });

      const member = teamMembers?.find(m => m.user === parseInt(selectedMemberForAssignment));
      const memberName = member ? member.user_name : 'Membre inconnu';

      toast.success(`Tâche "${selectedTaskForAssignment.title}" assignée à ${memberName}`);
      setShowAssignmentDialog(false);
      setSelectedTaskForAssignment(null);
      setSelectedMemberForAssignment('');
    } catch (error) {
      toast.error('Erreur lors de l\'assignation de la tâche');
      console.error('Error assigning task:', error);
    }
  };

  const getMemberName = (memberId: number) => {
    const member = teamMembers?.find(m => m.user === memberId);
    return member ? member.user_name : 'Membre inconnu';
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
                <span className="font-medium">ℹ️</span> Toutes les activités sont créées à partir des services du catalogue dans l'onglet "Activités standards"
              </div>
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
                
              </div>

              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {filteredTasks?.map((task) => {
                    const extendedTask = {
                      ...task,
                      assigned_to: task.assigned_to_name ? {
                        id: task.assigned_to as number,
                        first_name: task.assigned_to_name.split(' ')[0],
                        last_name: task.assigned_to_name.split(' ')[1] || '',
                        email: '',
                        username: '',
                        profile: {
                          is_active: true,
                          created_at: '',
                          updated_at: ''
                        },
                        full_name: task.assigned_to_name,
                        project_count: '0',
                        is_active: true,
                        groups: []
                      } : null
                    };
                    
                    return (
                      <Card key={task.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium">{task.title}</h3>
                                <Badge variant={task.status === 'Terminé' ? 'default' : 'secondary'}>
                                  {task.status}
                                </Badge>
                              </div>
                              {task.description && (
                                <p className="text-sm text-gray-500">{task.description}</p>
                              )}
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                {task.assigned_to_name && (
                                  <div className="flex items-center gap-1">
                                    <Users className="h-4 w-4" />
                                    <span>{task.assigned_to_name}</span>
                                  </div>
                                )}

                                {task.due_date && (
                                  <div className="flex items-center gap-1">
                                    <CalendarIcon className="h-4 w-4" />
                                    <span>{format(new Date(task.due_date), 'dd MMM yyyy', { locale: fr })}</span>
                                  </div>
                                )}
                                {task.estimated_hours && (
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    <span>{task.estimated_hours / 8}J</span>
                                  </div>
                                )}

                              </div>

                            </div>
                            <div className="flex gap-1">

                            {task.status !== 'Terminé' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenAssignmentDialog(task)}
                                title="Assigner la tâche"
                              >
                                <UserPlus className="h-4 w-4" />
                              </Button>
                            )}

                              {task.status !== 'Terminé' && ( 
                                <StartTaskProjectModal task={task} projectId={projectId}>
                                  <Button variant="ghost" size="icon">
                                    <Play className="h-4 w-4" />
                                  </Button>
                                </StartTaskProjectModal>
                              )}

                              {task.status !== 'Terminé' && (
                                <TaskModal projectId={projectId} task={extendedTask} mode="edit">
                                  <Button variant="ghost" size="icon">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </TaskModal>
                              )}
                              
                              <TaskModal projectId={projectId} task={extendedTask} mode="view">
                                <Button variant="ghost" size="icon">
                                  <View className="h-4 w-4" />
                                </Button>
                              </TaskModal>
                            
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="team" className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Membres de l'équipe</h3>
                <Dialog open={isTeamDialogOpen} onOpenChange={setIsTeamDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter un membre
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Ajouter un membre à l'équipe</DialogTitle>
                      <p className="text-sm text-muted-foreground">
                        Ajoutez un nouveau membre à l'équipe du projet avec son rôle et son allocation de temps.
                      </p>
                    </DialogHeader>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(handleAddTeamMember)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="user"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Membre</FormLabel>
                              <Select 
                                onValueChange={handleUserChange}
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Sélectionner un membre" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {users?.data?.results?.map((user: any) => (
                                    <SelectItem key={user.id} value={user.id.toString()}>
                                      {user.first_name} {user.last_name} ({user.email})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="role"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Rôle</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Sélectionner un rôle" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {roleOptions.map((role) => (
                                    <SelectItem key={role} value={role}>
                                      {role}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="allocation_percentage"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Allocation</FormLabel>
                              <Input type="number" {...field} />
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button type="submit" className="w-full">
                          Ajouter
                        </Button>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
              
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {teamMembers?.map((member: any) => (
                    <Card key={member.id}>
                      <CardContent className="flex items-center justify-between p-4">
                        <div className="flex items-center space-x-4">
                          <div>
                            <p className="font-medium">
                              {member.user_details.first_name} {member.user_details.last_name}

                            </p>
                            <p className="text-sm text-gray-500">
                              {member.role}
                              <span className="text-xs text-gray-500 block">
                                Allocation: {member.allocation_percentage}%
                              </span>
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <DeleteMemberProject 
                            projectId={projectId} 
                            userId={member.id} 
                            firstName={member.user_details.first_name} 
                            lastName={member.user_details.last_name} 
                            role={member.role}
                          >
                            <Button variant="ghost" size="icon">
                              <X className="h-4 w-4" />
                            </Button>
                          </DeleteMemberProject>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
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
                onTasksCreated={() => {
                  // Rafraîchir les données des activités
                  // window.location.reload();
                }}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Dialogue d'assignation des tâches */}
      <Dialog open={showAssignmentDialog} onOpenChange={setShowAssignmentDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assigner une tâche</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedTaskForAssignment && (
              <div>
                <Label>Tâche sélectionnée</Label>
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
    </>
  );
} 