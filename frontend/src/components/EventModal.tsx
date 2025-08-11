import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useUsers } from '@/hooks/use-users';
import { useCreateProjectEvent, useUpdateProjectEvent, useDeleteProjectEvent } from '@/hooks/use-projects';
import { Label } from './ui/label';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { CalendarIcon, Check, ChevronsUpDown, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { Badge } from './ui/badge';
import { ProjectEvent, User } from '@/lib/types';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const EVENT_TYPE_OPTIONS = [
  { label: 'Réunion', value: 'meeting' },
  { label: 'Échéance', value: 'deadline' },
  { label: 'Jalon', value: 'milestone' },
  { label: 'Revue', value: 'review' },
  { label: 'Autre', value: 'other' },
] as const;

interface EventModalProps {
  projectId: string;
  event?: ProjectEvent;
  isOpen: boolean;
  onClose: () => void;
}

interface EventFormData {
  title: string;
  description: string;
  type: 'meeting' | 'deadline' | 'milestone' | 'review' | 'other';
  date: Date;
  start_time: string;
  end_time: string;
  location: string;
  participant_ids: string[];
  project?: string;
}

interface UsersResponse {
  results: User[];
}

export const EventModal = ({ projectId, event, isOpen, onClose }: EventModalProps) => {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState<EventFormData>(event ? {
    ...event as any,
    date: new Date((event as any).start_date || (event as any).date),
    start_time: event && (event as any).start_date ? format(new Date((event as any).start_date), 'HH:mm') : (event as any).start_time,
    end_time: event && (event as any).end_date ? format(new Date((event as any).end_date), 'HH:mm') : (event as any).end_time,
    type: (event as any).event_type || 'meeting',
    participant_ids: (event as any).participants?.map((p: any) => p.id?.toString?.() ?? p?.toString?.()) || []
  } : {
    title: '',
    description: '',
    type: 'meeting',
    date: new Date(),
    start_time: '09:00',
    end_time: '10:00',
    location: '',
    participant_ids: [],
    project: projectId
  });

  const { data: usersData, isLoading: usersLoading } = useUsers({ page: 1, page_size: 1000, ordering: 'first_name' });

  useEffect(() => {
    if (usersData) {
      setIsLoading(false);
    }
  }, [usersData]);
  
  const createEvent = useCreateProjectEvent();
  const updateEvent = useUpdateProjectEvent();
  const deleteEvent = useDeleteProjectEvent();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const eventDateStr = format(formData.date, 'yyyy-MM-dd');
      const startDateTime = `${eventDateStr}T${formData.start_time}:00`;
      const endDateTime = `${eventDateStr}T${formData.end_time}:00`;

      const payload: any = {
        project: projectId,
        title: formData.title,
        description: formData.description,
        event_type: formData.type,
        start_date: startDateTime,
        end_date: endDateTime,
        location: formData.location,
        participants: (formData.participant_ids || []).map((id) => Number(id)),
      };

      if (event) {
        await updateEvent.mutateAsync({
          projectId,
          eventId: (event as any).id,
          data: payload
        });
      } else {
        await createEvent.mutateAsync({
          projectId,
          data: payload
        });
      }
      onClose();
      setFormData({
        title: '',
        description: '',
        type: 'meeting',
        date: new Date(),
        start_time: '09:00',
        end_time: '10:00',
        location: '',
        participant_ids: []
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'événement:', error);
      toast.error("Erreur lors de la sauvegarde de l'événement");
    }
  };

  const toggleParticipant = (userId: string) => {
    const currentParticipants = formData.participant_ids || [];
    const newParticipants = currentParticipants.includes(userId)
      ? currentParticipants.filter(id => id !== userId)
      : [...currentParticipants, userId];
    setFormData(prev => ({ ...prev, participant_ids: newParticipants }));
  };

  const handleDelete = async () => {
    if (!event) return;
    
    try {
      await deleteEvent.mutateAsync({
        projectId,
        eventId: (event as any).id
      });
      toast.success("Événement supprimé avec succès");
      onClose();
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'événement:', error);
      toast.error("Erreur lors de la suppression de l'événement");
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px] max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{event ? 'Modifier l\'événement' : 'Nouvel événement'}</span>
              {event && (
                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                  className="text-destructive hover:text-destructive/90"
                  onClick={() => setIsDeleteDialogOpen(true)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">Titre</label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Titre de l'événement"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">Description</label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Description de l'événement"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="type" className="text-sm font-medium">Type</label>
              <Select
                value={formData.type}
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                      type="button"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.date ? format(formData.date, 'PPP', { locale: fr }) : 'Sélectionner une date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent 
                    className="w-auto p-0"
                    style={{ zIndex: 9999, pointerEvents: 'auto' }}
                  >
                    <Calendar
                      mode="single"
                      selected={formData.date}
                      onSelect={(date) => {
                        setFormData(prev => ({ ...prev, date: date || new Date() }));
                        setIsDatePickerOpen(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <label htmlFor="location" className="text-sm font-medium">Lieu</label>
                <Input
                  id="location"
                  placeholder="Lieu de l'événement"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="start_time" className="text-sm font-medium">Heure de début</label>
                <Input
                  id="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="end_time" className="text-sm font-medium">Heure de fin</label>
                <Input
                  id="end_time"
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="participants" className="text-sm font-medium">Participants</label>
              <Popover open={isParticipantsOpen} onOpenChange={setIsParticipantsOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isParticipantsOpen}
                    className="w-full justify-between h-auto min-h-10 py-3"
                    type="button"
                  >
                    <div className="flex gap-1 flex-wrap">
                      {(!formData.participant_ids || formData.participant_ids.length === 0) ? (
                        <span className="text-muted-foreground">Sélectionner les participants</span>
                      ) : (
                        formData.participant_ids.map(id => {
                          const user = usersData?.data?.results?.find((u: User) => u.id.toString() === id);
                          return user ? (
                            <Badge variant="secondary" key={id} title={user.email}>
                              {user.first_name} {user.last_name} ({user.email})
                            </Badge>
                          ) : null;
                        })
                      )}
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-full p-0"
                  style={{ zIndex: 9999, pointerEvents: 'auto' }}
                >
                <Command>
                  <CommandInput placeholder="Rechercher un participant..." />
                  <CommandList>
                  <CommandEmpty>Aucun participant trouvé.</CommandEmpty>
                  <CommandGroup>
                    {usersLoading ? (
                      <CommandItem disabled>Chargement...</CommandItem>
                    ) : (
                      usersData?.data?.results?.map((user: User) => (
                        <CommandItem
                          key={user.id}
                          value={user.id.toString()}
                          onSelect={() => {
                            toggleParticipant(user.id.toString());
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.participant_ids.includes(user.id.toString()) ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col">
                            <span>{user.first_name} {user.last_name}</span>
                            <span className="text-xs text-muted-foreground">{user.email}</span>
                          </div>
                        </CommandItem>
                      ))
                    )}
                  </CommandGroup>
                  </CommandList>
                </Command>
                <div className="border-t p-2 flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setFormData(prev => ({ ...prev, participant_ids: [] }))}
                  >
                    Effacer
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setIsParticipantsOpen(false)}
                  >
                    Terminer
                  </Button>
                </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" type="button" onClick={onClose}>
                Annuler
              </Button>
              <Button type="submit" disabled={createEvent.isPending || updateEvent.isPending}>
                {event ? 'Modifier' : 'Créer'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Cela supprimera définitivement l'événement
              et toutes les données associées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}; 