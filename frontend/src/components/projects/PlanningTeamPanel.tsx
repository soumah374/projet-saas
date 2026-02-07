import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, X } from 'lucide-react';
import { useProjectLifecycle } from '@/hooks/use-project-lifecycle';
import { useUsers } from '@/hooks/use-users';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { DeleteMemberProject } from '../DeleteMemberProject';
import { UserAutocomplete } from '@/components/ui/UserAutocomplete';

interface PlanningTeamPanelProps {
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

export function PlanningTeamPanel({ projectId }: PlanningTeamPanelProps) {
  const [isTeamDialogOpen, setIsTeamDialogOpen] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [teamMemberSearchTerm, setTeamMemberSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const {
    teamMembers,
    addTeamMember,
  } = useProjectLifecycle(projectId, teamMemberSearchTerm);

  const { data: users, isLoading: usersLoading } = useUsers({
    search: userSearchTerm || undefined
  });

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
      form.reset({ project: projectId, user: '', role: '', allocation_percentage: 100 });
    } catch (error: any) {
      if (error.response?.data?.error) {
        form.setError('role', {
          type: 'manual',
          message: error.response.data.error
        });
      } else {
        form.setError('role', {
          type: 'manual',
          message: "Une erreur s'est produite lors de l'ajout du membre"
        });
      }
    }
  };

  const handleUserChange = async (userId: string) => {
    form.setValue('user', userId);
    setSelectedUser(userId);
  };

  return (
    <div className="space-y-4">
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
                      <FormControl>
                        <UserAutocomplete
                          value={field.value}
                          onValueChange={handleUserChange}
                          placeholder="Sélectionner un membre"
                          users={users?.data?.results || []}
                          isLoading={usersLoading}
                          showClearButton={true}
                          onSearchChange={setUserSearchTerm}
                        />
                      </FormControl>
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
    </div>
  );
}
