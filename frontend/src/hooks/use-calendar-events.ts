import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { fetchEvents, createEvent, updateEvent, deleteEvent, fetchUpcomingEvents } from '@/lib/api';

export interface CalendarEvent {
  id: number;
  title: string;
  description: string;
  type: 'Réunion' | 'Présentation' | 'Atelier' | 'Livraison' | 'Autre';
  date: string;
  start_time: string;
  end_time: string;
  location?: string;
  participants: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
  }[];
  created_by: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  created_at: string;
  updated_at: string;
}

export interface CreateCalendarEventInput {
  title: string;
  description: string;
  type: 'Réunion' | 'Présentation' | 'Atelier' | 'Livraison' | 'Autre';
  date: string;
  start_time: string;
  end_time: string;
  location?: string;
  participant_ids: number[];
}

export const useCalendarEvents = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchEvents();
      setEvents(response.data);
    } catch (err) {
      setError('Erreur lors du chargement des événements');
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les événements',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addEvent = async (eventData: CreateCalendarEventInput) => {
    try {
      setLoading(true);
      setError(null);
      const newEvent = await createEvent(eventData);
      setEvents(prev => [...prev, newEvent.data]);
      toast({
        title: 'Succès',
        description: 'Événement créé avec succès',
      });
      return newEvent;
    } catch (err) {
      setError('Erreur lors de la création de l\'événement');
      toast({
        title: 'Erreur',
        description: 'Impossible de créer l\'événement',
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const editEvent = async (eventId: number, eventData: Partial<CreateCalendarEventInput>) => {
    try {
      setLoading(true);
      setError(null);
      const updatedEvent = await updateEvent(eventId, eventData);
      setEvents(prev => prev.map(event => 
        event.id === eventId ? updatedEvent.data : event
      ));
      toast({
        title: 'Succès',
        description: 'Événement mis à jour avec succès',
      });
      return updatedEvent;
    } catch (err) {
      setError('Erreur lors de la mise à jour de l\'événement');
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour l\'événement',
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const removeEvent = async (eventId: number) => {
    try {
      setLoading(true);
      setError(null);
      await deleteEvent(eventId);
      setEvents(prev => prev.filter(event => event.id !== eventId));
      toast({
        title: 'Succès',
        description: 'Événement supprimé avec succès',
      });
    } catch (err) {
      setError('Erreur lors de la suppression de l\'événement');
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer l\'événement',
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loadUpcomingEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchUpcomingEvents();
      return response.data;
    } catch (err) {
      setError('Erreur lors du chargement des événements à venir');
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les événements à venir',
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  return {
    events,
    loading,
    error,
    loadEvents,
    addEvent,
    editEvent,
    removeEvent,
    loadUpcomingEvents,
  };
}; 