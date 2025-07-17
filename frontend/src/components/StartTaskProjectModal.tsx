import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { useState } from 'react';
import { Label } from './ui/label';
import { Popover } from './ui/popover';
import { PopoverTrigger } from './ui/popover';
import { Button } from './ui/button';
import { CalendarIcon } from 'lucide-react';
import { PopoverContent } from './ui/popover';
import { Calendar } from './ui/calendar';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Separator } from '@radix-ui/react-dropdown-menu';
import { Select, SelectContent, SelectItem } from './ui/select';
import { SelectTrigger } from './ui/select';
import { SelectValue } from './ui/select';

interface StartTaskProjectModalProps {
  children: React.ReactNode;
  taskId: string;
}

export const StartTaskProjectModal = ({children, taskId}: StartTaskProjectModalProps) => {
  const [open, setOpen] = useState(false);
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [formData, setFormData] = useState({
    start_date: undefined,
    status: 'À faire',
  });

  const taskStatuses = ['À faire', 'En cours', 'En pause', 'Terminé'];


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Démarrer la tâche</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            console.log(formData);
          }}
        >
          <div className="space-y-4">
            <p>Etes-vous sûr de vouloir démarrer la tâche ?</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Statut</Label>
            <Select 
              value={formData.status} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {taskStatuses.map(status => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Separator className="my-4" />
          <DialogFooter>
            <div className="flex justify-between w-full mt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
              <Button type="submit">Démarrer la tâche</Button>
            </div>
          </DialogFooter>
        </form>

      </DialogContent>

    </Dialog>
  )
} 