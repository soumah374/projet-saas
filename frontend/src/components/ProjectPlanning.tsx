import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AlertCircle, Users, Calendar as CalendarIcon, Plus, X } from 'lucide-react';
import { useProjectLifecycle } from '@/hooks/use-project-lifecycle';
import { useUsers } from '@/hooks/use-users';
import { ProjectPhases } from './ProjectPhases';

interface ProjectPlanningProps {
  projectId: string;
}

const teamMemberSchema = z.object({
  user: z.string().min(1, 'Sélectionnez un utilisateur'),
  role: z.string().min(1, 'Sélectionnez un rôle'),
  allocation_percentage: z.number().min(1).max(100)
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
  
  const { 
    phases,
    teamMembers,
    addTeamMember,
    removeTeamMember,
    updateTeamMember,
    applyTaskTemplate,
    loading 
  } = useProjectLifecycle(projectId);
  
  const { data: users } = useUsers();
  
  const form = useForm({
    resolver: zodResolver(teamMemberSchema),
    defaultValues: {
      user: '',
      role: '',
      allocation_percentage: 100
    }
  });
  
  const handleAddTeamMember = async (data: any) => {
    try {
      await addTeamMember(data);
      setIsTeamDialogOpen(false);
      form.reset();
    } catch (error) {
      console.error('Error adding team member:', error);
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
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Planification du projet</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="phases">Phases</TabsTrigger>
            <TabsTrigger value="team">Équipe</TabsTrigger>
            <TabsTrigger value="templates">Tâches standards</TabsTrigger>
          </TabsList>
          
          <TabsContent value="phases" className="space-y-4">
            <ProjectPhases projectId={projectId} />
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
                  <form onSubmit={form.handleSubmit(handleAddTeamMember)} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Membre</Label>
                      <Select
                        onValueChange={(value) => form.setValue('user', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un membre" />
                        </SelectTrigger>
                        <SelectContent>
                          {users?.data?.results?.map((user: any) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.first_name} {user.last_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Rôle</Label>
                      <Select
                        onValueChange={(value) => form.setValue('role', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un rôle" />
                        </SelectTrigger>
                        <SelectContent>
                          {roleOptions.map((role) => (
                            <SelectItem key={role} value={role}>
                              {role}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Allocation (%)</Label>
                      <Input
                        type="number"
                        min="1"
                        max="100"
                        {...form.register('allocation_percentage', { valueAsNumber: true })}
                      />
                    </div>
                    
                    <Button type="submit" className="w-full">
                      Ajouter
                    </Button>
                  </form>
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
                            {member.user.first_name} {member.user.last_name}
                          </p>
                          <p className="text-sm text-gray-500">{member.role}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Badge variant="secondary">
                          {member.allocation_percentage}% alloué
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeTeamMember(member.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="templates" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Catégorie de tâches</Label>
                <Select
                  value={selectedTemplateCategory}
                  onValueChange={setSelectedTemplateCategory}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Événementiel">Événementiel</SelectItem>
                    <SelectItem value="Communication">Communication</SelectItem>
                    <SelectItem value="Production">Production</SelectItem>
                    <SelectItem value="Digital">Digital</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Les tâches standards seront créées selon le modèle sélectionné.
                  Vous pourrez ensuite les personnaliser selon vos besoins.
                </AlertDescription>
              </Alert>
              
              <Button
                onClick={handleApplyTemplate}
                disabled={!selectedTemplateCategory}
                className="w-full"
              >
                Appliquer le modèle
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 