import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useProjectLifecycle } from '@/hooks/use-project-lifecycle';
import { Separator } from '@/components/ui/separator';

interface CreateUserModalProps {
  children: React.ReactNode;
  projectId: string;
  userId: number;
  firstName: string;
  lastName: string;
  role: string;
}

export const DeleteMemberProject = ({children, projectId, userId, firstName, lastName, role}: CreateUserModalProps) => {
  const [open, setOpen] = useState(false);

  const { removeTeamMember } = useProjectLifecycle(projectId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Supprimer le membre du projet</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          Êtes-vous sûr de vouloir supprimer {firstName} {lastName} <span className="font-bold">{role}</span> de ce projet ?
        </DialogDescription>
        <Separator />
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
          <Button variant="destructive" onClick={() => {removeTeamMember(userId); setOpen(false)}}>Supprimer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
