import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useUsers } from '@/hooks/use-users';
import { useCreateProjectEvent, useUpdateProjectEvent } from '@/hooks/use-projects';
import { Label } from './ui/label';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { CalendarIcon, Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from './ui/command';
import { Badge } from './ui/badge';

interface EventModalProps {
  projectId: string;
  event?: any;
  isOpen: boolean;
  onClose: () => void;
}

export const EventModal = ({ projectId, event, isOpen, onClose }: EventModalProps) => {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  
  const { register, handleSubmit, setValue, watch, reset } = useForm({
    defaultValues: event ? {
      ...event,
      date: new Date(event.date),
      start_time: event.start_time,
      end_time: event.end_time,
      participant_ids: event.participants?.map((p: any) => p.id) || []
    } : {
      title: '',
      description: '',
      type: 'Réunion',
      date: new Date(),
      start_time: '09:00',
      end_time: '10:00',
      location: '',
      participant_ids: []
    }
  });

  const selectedDate = watch('date');
  const selectedParticipants = watch('participant_ids') || [];
  const { data: users } = useUsers();
  const createEvent = useCreateProjectEvent();
  const updateEvent = useUpdateProjectEvent();

  const onSubmit = async (data: any) => {
    try {
      if (event) {
        await updateEvent.mutateAsync({
          projectId,
          eventId: event.id,
          eventData: data
        });
      } else {
        await createEvent.mutateAsync({
          projectId,
          eventData: data
        });
      }
      onClose();
      reset();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'événement:', error);
    }
  };

  const toggleParticipant = (userId: string) => {
    const currentParticipants = selectedParticipants;
    const newParticipants = currentParticipants.includes(userId)
      ? currentParticipants.filter(id => id !== userId)
      : [...currentParticipants, userId];
    setValue('participant_ids', newParticipants);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {event ? 'Modifier l\'événement' : 'Nouvel événement'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">Titre</label>
            <Input
              id="title"
              {...register('title', { required: true })}
              placeholder="Titre de l'événement"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">Description</label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Description de l'événement"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="type" className="text-sm font-medium">Type</label>
            <Select
              value={watch('type')}
              onValueChange={(value) => setValue('type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Réunion">Réunion</SelectItem>
                <SelectItem value="Présentation">Présentation</SelectItem>
                <SelectItem value="Atelier">Atelier</SelectItem>
                <SelectItem value="Livraison">Livraison</SelectItem>
                <SelectItem value="Autre">Autre</SelectItem>
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
                    {selectedDate ? format(selectedDate, 'PPP', { locale: fr }) : 'Sélectionner une date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      setValue('date', date);
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
                {...register('location')}
                placeholder="Lieu de l'événement"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="start_time" className="text-sm font-medium">Heure de début</label>
              <Input
                id="start_time"
                type="time"
                {...register('start_time', { required: true })}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="end_time" className="text-sm font-medium">Heure de fin</label>
              <Input
                id="end_time"
                type="time"
                {...register('end_time', { required: true })}
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
                  className="w-full justify-between"
                  type="button"
                >
                  <div className="flex gap-1 flex-wrap">
                    {selectedParticipants.length === 0 ? (
                      <span className="text-muted-foreground">Sélectionner les participants</span>
                    ) : (
                      selectedParticipants.map(id => {
                        const user = users?.results.find((u: any) => u.id.toString() === id);
                        return user ? (
                          <Badge variant="secondary" key={id}>
                            {user.first_name} {user.last_name}
                          </Badge>
                        ) : null;
                      })
                    )}
                  </div>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Rechercher un participant..." />
                  <CommandEmpty>Aucun participant trouvé.</CommandEmpty>
                  <CommandGroup>
                    {users?.results.map((user: any) => (
                      <CommandItem
                        key={user.id}
                        value={user.id.toString()}
                        onSelect={() => toggleParticipant(user.id.toString())}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedParticipants.includes(user.id.toString()) ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {user.first_name} {user.last_name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
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
  );
}; 