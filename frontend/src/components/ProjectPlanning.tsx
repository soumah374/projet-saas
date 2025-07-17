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
import { Users, Calendar as CalendarIcon, Plus, X, Search, Edit, Play, View } from 'lucide-react';
import { useProjectLifecycle } from '@/hooks/use-project-lifecycle';
import { useUsers } from '@/hooks/use-users';
import { useProjectTasks } from '@/hooks/use-projects';
import { ProjectPhases } from './ProjectPhases';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { TaskModal } from './TaskModal';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { DeleteMemberProject } from './deleteMemberProject';
import { Service } from '@/lib/types';
import { StartTaskProjectModal } from './StartTaskProjectModal';

interface ProjectPlanningProps {
  projectId: string;
}

const teamMemberSchema = z.object({
  project: z.string().min(1, 'Sélectionnez un projet'),
  user: z.string().min(1, 'Sélectionnez un utilisateur'),
  role: z.string().min(1, 'Sélectionnez un rôle'),
  allocation_percentage: z.number().min(1, { message: "L'allocation doit être supérieure à 0%" }).max(100, { message: "L'allocation ne peut pas dépasser 100%" })
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
  const [activeTab, setActiveTab] = useState('phases');
  const [isTeamDialogOpen, setIsTeamDialogOpen] = useState(false);
  const [selectedTemplateCategory, setSelectedTemplateCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const { 
    phases,
    teamMembers,
    addTeamMember,
    applyTaskTemplate,
    loading,
    checkUserAllocation,
    services
  } = useProjectLifecycle(projectId);

  const { data: users } = useUsers();
  const { data: tasks } = useProjectTasks(projectId);
  
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
        form.setError('allocation_percentage', {
          type: 'manual',
          message: error.response.data.error
        });
      } else {
        console.error('Error adding team member:', error);
        form.setError('allocation_percentage', {
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
  const [currentAllocation, setCurrentAllocation] = useState<number | null>(null);

  const handleUserChange = async (userId: string) => {
    form.setValue('user', userId);
    setSelectedUser(userId);
    try {
      const allocation = await checkUserAllocation(userId);
      setCurrentAllocation(allocation);
      form.setValue('allocation_percentage', allocation);
      if (allocation > 0) {
        form.setError('allocation_percentage', {
          type: 'info',
          message: `Allocation actuelle: ${allocation}%`
        });
      }
    } catch (error) {
      console.error('Error checking user allocation:', error);
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Planification du projet</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="phases">Phases</TabsTrigger>
            <TabsTrigger value="team">Équipe</TabsTrigger>
            <TabsTrigger value="tasks">Tâches</TabsTrigger>
            <TabsTrigger value="templates">Tâches standards</TabsTrigger>
          </TabsList>
          
          <TabsContent value="phases" className="space-y-4">
            <ProjectPhases projectId={projectId} />
          </TabsContent>

          <TabsContent value="tasks" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <div className="flex-1 flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Rechercher une tâche..."
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
              <TaskModal projectId={projectId} mode="create" phases={phases}>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle tâche
                </Button>
              </TaskModal>
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
                      is_active: true
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
                            </div>
                          </div>
                          <div className="flex gap-1">

                            {task.status !== 'Terminé' && ( 
                              <StartTaskProjectModal task={task} projectId={projectId}>
                                <Button variant="ghost" size="icon">
                                  <Play className="h-4 w-4" />
                                </Button>
                              </StartTaskProjectModal>
                            )}

                            {task.status !== 'Terminé' && (
                              <TaskModal projectId={projectId} task={extendedTask} mode="edit" phases={phases}>
                                <Button variant="ghost" size="icon">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TaskModal>
                            )}
                            
                            <TaskModal projectId={projectId} task={extendedTask} mode="view" phases={phases}>
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
                            {currentAllocation !== null && (
                              <p className="text-sm text-gray-500">
                                Allocation actuelle: {currentAllocation}%
                              </p>
                            )}
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
                        rules={{ validate: (value) => Number(value) >= 0 && Number(value) <= 100 }}
                        name="allocation_percentage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Allocation (%)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                placeholder="100"
                                {...field}
                                min={0}
                                max={100}
                                value={field.value}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (value === '' || (Number(value) >= 0 && Number(value) <= 100)) {
                                    field.onChange(Number(value));
                                  }
                                }}
                              />
                            </FormControl>
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
                          <p className="text-sm text-gray-500">{member.role}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Badge variant="secondary">
                          {member.allocation_percentage}% alloué
                        </Badge>
                        
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
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Tâches standards</h3>
                <Select value={selectedTemplateCategory} onValueChange={setSelectedTemplateCategory}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service: Service) => (
                      <SelectItem key={service.id} value={service.name}>
                        {service.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                onClick={handleApplyTemplate}
                disabled={!selectedTemplateCategory}
                className="w-full"
              >
                Appliquer le template
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 