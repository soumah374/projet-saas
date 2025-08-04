import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Plus, 
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Users
} from "lucide-react";

interface Event {
  id: number;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  location?: string;
  attendees: string[];
  type: 'meeting' | 'deadline' | 'milestone';
  color: string;
}

export function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [isCreateEventDialogOpen, setIsCreateEventDialogOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    location: '',
    type: 'meeting' as const,
    attendees: ''
  });

  useEffect(() => {
    // Simuler le chargement des événements
    const mockEvents: Event[] = [
      {
        id: 1,
        title: "Réunion équipe projet",
        description: "Réunion hebdomadaire pour faire le point sur l'avancement",
        start_date: "2024-02-12T10:00:00",
        end_date: "2024-02-12T11:00:00",
        location: "Salle de réunion A",
        attendees: ["Marie Dupont", "Jean Martin", "Sophie Bernard"],
        type: "meeting",
        color: "bg-blue-600"
      },
      {
        id: 2,
        title: "Deadline - Refonte site web",
        description: "Date limite pour la première version",
        start_date: "2024-02-15T17:00:00",
        end_date: "2024-02-15T17:00:00",
        attendees: ["Marie Dupont", "Emma Leroy"],
        type: "deadline",
        color: "bg-red-500"
      },
      {
        id: 3,
        title: "Milestone - API v2",
        description: "Livraison de la version 2 de l'API",
        start_date: "2024-02-20T14:00:00",
        end_date: "2024-02-20T14:00:00",
        attendees: ["Pierre Durand", "Jean Martin"],
        type: "milestone",
        color: "bg-green-500"
      },
      {
        id: 4,
        title: "Formation React",
        description: "Session de formation sur React pour l'équipe",
        start_date: "2024-02-14T09:00:00",
        end_date: "2024-02-14T12:00:00",
        location: "Salle de formation",
        attendees: ["Toute l'équipe"],
        type: "meeting",
        color: "bg-purple-500"
      }
    ];

    setEvents(mockEvents);
  }, []);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Ajouter les jours du mois précédent
    for (let i = 0; i < startingDayOfWeek; i++) {
      const prevDate = new Date(year, month, -startingDayOfWeek + i + 1);
      days.push({ date: prevDate, isCurrentMonth: false });
    }

    // Ajouter les jours du mois actuel
    for (let i = 1; i <= daysInMonth; i++) {
      const currentDate = new Date(year, month, i);
      days.push({ date: currentDate, isCurrentMonth: true });
    }

    // Compléter avec les jours du mois suivant
    const remainingDays = 42 - days.length; // 6 semaines * 7 jours
    for (let i = 1; i <= remainingDays; i++) {
      const nextDate = new Date(year, month + 1, i);
      days.push({ date: nextDate, isCurrentMonth: false });
    }

    return days;
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.start_date);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const eventTypes = [
    { id: 'deadline', name: 'Échéance', color: "bg-red-500" },
    { id: 'milestone', name: 'Jalon', color: "bg-blue-600" },
    { id: 'meeting', name: 'Réunion', color: "bg-gray-500" }
  ];

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'deadline': return 'bg-red-100 text-red-800';
      case 'milestone': return 'bg-blue-100 text-blue-600';
      case 'meeting': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEventColor = (type: 'meeting' | 'deadline' | 'milestone') => {
    switch (type) {
      case 'deadline': return 'bg-red-500';
      case 'milestone': return 'bg-blue-600';
      case 'meeting': return 'bg-gray-500';
    }
  };

  const handleCreateEvent = () => {
    const event: Event = {
      id: events.length + 1,
      title: newEvent.title,
      description: newEvent.description,
      start_date: newEvent.start_date,
      end_date: newEvent.end_date,
      location: newEvent.location,
      attendees: newEvent.attendees.split(',').map(a => a.trim()).filter(a => a),
      type: newEvent.type,
      color: getEventColor(newEvent.type)
    };

    setEvents([...events, event]);
    setNewEvent({
      title: '',
      description: '',
      start_date: '',
      end_date: '',
      location: '',
      type: 'meeting',
      attendees: ''
    });
    setIsCreateEventDialogOpen(false);
  };

  const days = getDaysInMonth(currentDate);
  const monthNames = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ];

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Calendrier</h1>
          <p className="text-gray-600">
            Gérez vos événements et rendez-vous
          </p>
        </div>
        <Dialog open={isCreateEventDialogOpen} onOpenChange={setIsCreateEventDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nouvel événement
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Créer un nouvel événement</DialogTitle>
              <DialogDescription>
                Ajoutez un nouvel événement à votre calendrier
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Titre</Label>
                <Input
                  id="title"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                  placeholder="Titre de l'événement"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                  placeholder="Description de l'événement"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="start_date">Date de début</Label>
                  <Input
                    id="start_date"
                    type="datetime-local"
                    value={newEvent.start_date}
                    onChange={(e) => setNewEvent({...newEvent, start_date: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="end_date">Date de fin</Label>
                  <Input
                    id="end_date"
                    type="datetime-local"
                    value={newEvent.end_date}
                    onChange={(e) => setNewEvent({...newEvent, end_date: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="location">Lieu (optionnel)</Label>
                <Input
                  id="location"
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
                  placeholder="Lieu de l'événement"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="type">Type d'événement</Label>
                <Select value={newEvent.type} onValueChange={(value: any) => setNewEvent({...newEvent, type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="meeting">Réunion</SelectItem>
                    <SelectItem value="deadline">Deadline</SelectItem>
                    <SelectItem value="milestone">Milestone</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="attendees">Participants (séparés par des virgules)</Label>
                <Input
                  id="attendees"
                  value={newEvent.attendees}
                  onChange={(e) => setNewEvent({...newEvent, attendees: e.target.value})}
                  placeholder="Marie Dupont, Jean Martin"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateEventDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleCreateEvent}>
                Créer l'événement
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Navigation du calendrier */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <h2 className="text-xl font-semibold">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <Button
              variant="outline"
              onClick={() => setCurrentDate(new Date())}
            >
              Aujourd'hui
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* En-têtes des jours */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map((day) => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}
          </div>

          {/* Grille du calendrier */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              const dayEvents = getEventsForDate(day.date);
              const isToday = day.date.toDateString() === new Date().toDateString();
              
              return (
                <div
                  key={index}
                  className={`min-h-[120px] p-2 border rounded-lg ${
                    day.isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                  } ${isToday ? 'ring-2 ring-blue-600' : ''}`}
                >
                  <div className={`text-sm font-medium mb-1 ${
                    day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                  } ${isToday ? 'text-blue-600' : ''}`}>
                    {day.date.getDate()}
                  </div>
                  
                  <div className="space-y-1">
                    {dayEvents.slice(0, 2).map((event) => (
                      <div
                        key={event.id}
                        className={`text-xs p-1 rounded truncate cursor-pointer ${event.color} text-white`}
                        title={event.title}
                      >
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-xs text-gray-500">
                        +{dayEvents.length - 2} autres
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Événements à venir */}
      <Card>
        <CardHeader>
          <CardTitle>Événements à venir</CardTitle>
          <CardDescription>
            Prochains événements dans les 7 jours
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {events
              .filter(event => {
                const eventDate = new Date(event.start_date);
                const today = new Date();
                const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
                return eventDate >= today && eventDate <= nextWeek;
              })
              .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
              .slice(0, 5)
              .map((event) => (
                <div key={event.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <div className={`w-3 h-3 rounded-full mt-2 ${event.color}`}></div>
                  <div className="flex-1">
                    <h4 className="font-medium">{event.title}</h4>
                    <p className="text-sm text-gray-600">{event.description}</p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>
                          {new Date(event.start_date).toLocaleDateString()} à{' '}
                          {new Date(event.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {event.location && (
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3" />
                          <span>{event.location}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-1">
                        <Users className="w-3 h-3" />
                        <span>{event.attendees.length} participants</span>
                      </div>
                    </div>
                  </div>
                  <Badge className={getEventTypeColor(event.type)}>
                    {event.type === 'meeting' ? 'Réunion' :
                     event.type === 'deadline' ? 'Deadline' :
                     event.type === 'milestone' ? 'Milestone' : 'Autre'}
                  </Badge>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 