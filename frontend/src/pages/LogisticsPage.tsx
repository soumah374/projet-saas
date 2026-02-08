import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DateInput } from '@/components/ui/DateInput';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Plus, RefreshCcw } from 'lucide-react';

interface Fleet {
  id: number;
  name: string;
  description?: string;
  manager?: number | null;
  manager_name?: string | null;
  is_active: boolean;
}

interface Vehicle {
  id: number;
  plate_number: string;
  brand?: string;
  model?: string;
  status: string;
  fuel_type: string;
  fleet?: number | null;
  fleet_name?: string | null;
  odometer_km?: number;
}

interface Driver {
  id: number;
  first_name: string;
  last_name: string;
  phone?: string;
  email?: string;
  status: string;
  full_name?: string;
}

interface Trip {
  id: number;
  reference: string;
  title: string;
  status: string;
  vehicle?: number | null;
  vehicle_label?: string | null;
  driver?: number | null;
  driver_name?: string | null;
  planned_start?: string | null;
  planned_end?: string | null;
}

interface TripStop {
  id: number;
  trip: number;
  sequence: number;
  address: string;
  planned_arrival?: string | null;
}

interface TrackingPoint {
  id: number;
  vehicle: number;
  vehicle_label?: string;
  trip?: number | null;
  trip_reference?: string | null;
  recorded_at: string;
  latitude: string;
  longitude: string;
  status: string;
}

interface MaintenanceRecord {
  id: number;
  vehicle: number;
  vehicle_label?: string;
  maintenance_type: string;
  performed_at: string;
}

interface FuelLog {
  id: number;
  vehicle: number;
  vehicle_label?: string;
  driver?: number | null;
  driver_name?: string | null;
  filled_at: string;
  liters: string;
}

interface Incident {
  id: number;
  vehicle: number;
  vehicle_label?: string;
  driver?: number | null;
  driver_name?: string | null;
  severity: string;
  description?: string;
  reported_at: string;
  resolved: boolean;
}

interface UserOption {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
}

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return value;
  return dt.toLocaleString();
};

const parseDateInput = (value?: string | null) => {
  if (!value) return undefined;
  const dt = new Date(value);
  return Number.isNaN(dt.getTime()) ? undefined : dt;
};

const formatDateInput = (value?: Date) => {
  if (!value) return '';
  return value.toISOString().split('T')[0];
};

export default function LogisticsPage() {
  const [activeTab, setActiveTab] = useState('flottes');
  const [loading, setLoading] = useState(false);

  const [fleets, setFleets] = useState<Fleet[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [tripStops, setTripStops] = useState<TripStop[]>([]);
  const [trackingPoints, setTrackingPoints] = useState<TrackingPoint[]>([]);
  const [maintenances, setMaintenances] = useState<MaintenanceRecord[]>([]);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);

  const [fleetForm, setFleetForm] = useState<Partial<Fleet>>({ name: '', description: '', is_active: true });
  const [vehicleForm, setVehicleForm] = useState<Partial<Vehicle>>({ plate_number: '', status: 'actif', fuel_type: 'diesel' });
  const [driverForm, setDriverForm] = useState<Partial<Driver>>({ first_name: '', last_name: '', status: 'actif' });
  const [tripForm, setTripForm] = useState<Partial<Trip>>({ title: '', status: 'planifie' });
  const [tripStopForm, setTripStopForm] = useState<Partial<TripStop>>({ sequence: 1, address: '' });
  const [trackingForm, setTrackingForm] = useState<Partial<TrackingPoint>>({ status: 'inconnu' });
  const [maintenanceForm, setMaintenanceForm] = useState<Partial<MaintenanceRecord>>({ maintenance_type: 'preventif' });
  const [fuelForm, setFuelForm] = useState<Partial<FuelLog>>({});
  const [incidentForm, setIncidentForm] = useState<Partial<Incident>>({ severity: 'faible', resolved: false });

  const fetchCoreData = useCallback(async () => {
    setLoading(true);
    try {
      const [fleetsRes, vehiclesRes, driversRes, tripsRes, usersRes] = await Promise.all([
        api.get('/logistics/fleets/'),
        api.get('/logistics/vehicles/'),
        api.get('/logistics/drivers/'),
        api.get('/logistics/trips/'),
        api.get('/auth/users/'),
      ]);
      setFleets(fleetsRes.data.results || fleetsRes.data);
      setVehicles(vehiclesRes.data.results || vehiclesRes.data);
      setDrivers(driversRes.data.results || driversRes.data);
      setTrips(tripsRes.data.results || tripsRes.data);
      setUsers(usersRes.data.results || usersRes.data);
    } catch (error) {
      toast.error('Erreur lors du chargement des données logistiques');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTrackingData = useCallback(async () => {
    try {
      const [stopsRes, trackingRes, maintenanceRes, fuelRes, incidentsRes] = await Promise.all([
        api.get('/logistics/trip-stops/'),
        api.get('/logistics/tracking-points/'),
        api.get('/logistics/maintenances/'),
        api.get('/logistics/fuel-logs/'),
        api.get('/logistics/incidents/'),
      ]);
      setTripStops(stopsRes.data.results || stopsRes.data);
      setTrackingPoints(trackingRes.data.results || trackingRes.data);
      setMaintenances(maintenanceRes.data.results || maintenanceRes.data);
      setFuelLogs(fuelRes.data.results || fuelRes.data);
      setIncidents(incidentsRes.data.results || incidentsRes.data);
    } catch (error) {
      toast.error('Erreur lors du chargement des données de suivi');
    }
  }, []);

  useEffect(() => {
    fetchCoreData();
  }, [fetchCoreData]);

  useEffect(() => {
    if (activeTab === 'suivi' || activeTab === 'planification') {
      fetchTrackingData();
    }
  }, [activeTab, fetchTrackingData]);

  const handleCreate = async (endpoint: string, payload: any, onSuccess: () => void) => {
    try {
      await api.post(endpoint, payload);
      toast.success('Création réussie');
      onSuccess();
      fetchCoreData();
      if (activeTab === 'suivi' || activeTab === 'planification') {
        fetchTrackingData();
      }
    } catch (error) {
      toast.error('Erreur lors de la création');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Logistique</h1>
          <p className="text-sm text-gray-500">Gestion des flottes, chauffeurs, planification et suivi.</p>
        </div>
        <Button variant="outline" onClick={fetchCoreData} disabled={loading}>
          <RefreshCcw className="mr-2 h-4 w-4" /> Actualiser
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="flottes">Flottes</TabsTrigger>
          <TabsTrigger value="vehicules">Véhicules</TabsTrigger>
          <TabsTrigger value="chauffeurs">Chauffeurs</TabsTrigger>
          <TabsTrigger value="planification">Planification</TabsTrigger>
          <TabsTrigger value="suivi">Suivi</TabsTrigger>
        </TabsList>

        <TabsContent value="flottes">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Flottes</CardTitle>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" /> Nouvelle flotte
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Créer une flotte</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <Input
                      placeholder="Nom"
                      value={fleetForm.name || ''}
                      onChange={(e) => setFleetForm({ ...fleetForm, name: e.target.value })}
                    />
                    <Textarea
                      placeholder="Description"
                      value={fleetForm.description || ''}
                      onChange={(e) => setFleetForm({ ...fleetForm, description: e.target.value })}
                    />
                    <select
                      className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                      value={fleetForm.manager || ''}
                      onChange={(e) => setFleetForm({ ...fleetForm, manager: e.target.value ? Number(e.target.value) : null })}
                    >
                      <option value="">Responsable (optionnel)</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.first_name} {user.last_name || user.username}
                        </option>
                      ))}
                    </select>
                  </div>
                  <DialogFooter>
                    <Button onClick={() => handleCreate('/logistics/fleets/', fleetForm, () => setFleetForm({ name: '', description: '', is_active: true }))}>
                      Enregistrer
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Responsable</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fleets.map((fleet) => (
                    <TableRow key={fleet.id}>
                      <TableCell>{fleet.name}</TableCell>
                      <TableCell>{fleet.manager_name || '-'}</TableCell>
                      <TableCell>{fleet.is_active ? 'Actif' : 'Inactif'}</TableCell>
                    </TableRow>
                  ))}
                  {fleets.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-sm text-gray-500">
                        Aucune flotte configurée.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vehicules">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Véhicules</CardTitle>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" /> Nouveau véhicule
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Créer un véhicule</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <Input
                      placeholder="Immatriculation"
                      value={vehicleForm.plate_number || ''}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, plate_number: e.target.value })}
                    />
                    <Input
                      placeholder="Marque"
                      value={vehicleForm.brand || ''}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, brand: e.target.value })}
                    />
                    <Input
                      placeholder="Modèle"
                      value={vehicleForm.model || ''}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })}
                    />
                    <select
                      className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                      value={vehicleForm.fleet || ''}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, fleet: e.target.value ? Number(e.target.value) : null })}
                    >
                      <option value="">Flotte (optionnel)</option>
                      {fleets.map((fleet) => (
                        <option key={fleet.id} value={fleet.id}>
                          {fleet.name}
                        </option>
                      ))}
                    </select>
                    <select
                      className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                      value={vehicleForm.status || 'actif'}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, status: e.target.value })}
                    >
                      <option value="actif">Actif</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="inactif">Inactif</option>
                      <option value="retire">Retiré</option>
                    </select>
                    <select
                      className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                      value={vehicleForm.fuel_type || 'diesel'}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, fuel_type: e.target.value })}
                    >
                      <option value="diesel">Diesel</option>
                      <option value="essence">Essence</option>
                      <option value="hybride">Hybride</option>
                      <option value="electrique">Électrique</option>
                      <option value="gaz">Gaz</option>
                      <option value="autre">Autre</option>
                    </select>
                  </div>
                  <DialogFooter>
                    <Button onClick={() => handleCreate('/logistics/vehicles/', vehicleForm, () => setVehicleForm({ plate_number: '', status: 'actif', fuel_type: 'diesel' }))}>
                      Enregistrer
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Immatriculation</TableHead>
                    <TableHead>Véhicule</TableHead>
                    <TableHead>Flotte</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehicles.map((vehicle) => (
                    <TableRow key={vehicle.id}>
                      <TableCell>{vehicle.plate_number}</TableCell>
                      <TableCell>{`${vehicle.brand || ''} ${vehicle.model || ''}`.trim() || '-'}</TableCell>
                      <TableCell>{vehicle.fleet_name || '-'}</TableCell>
                      <TableCell>{vehicle.status}</TableCell>
                    </TableRow>
                  ))}
                  {vehicles.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-sm text-gray-500">
                        Aucun véhicule enregistré.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chauffeurs">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Chauffeurs</CardTitle>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" /> Nouveau chauffeur
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Créer un chauffeur</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <Input
                      placeholder="Prénom"
                      value={driverForm.first_name || ''}
                      onChange={(e) => setDriverForm({ ...driverForm, first_name: e.target.value })}
                    />
                    <Input
                      placeholder="Nom"
                      value={driverForm.last_name || ''}
                      onChange={(e) => setDriverForm({ ...driverForm, last_name: e.target.value })}
                    />
                    <Input
                      placeholder="Téléphone"
                      value={driverForm.phone || ''}
                      onChange={(e) => setDriverForm({ ...driverForm, phone: e.target.value })}
                    />
                    <Input
                      placeholder="Email"
                      value={driverForm.email || ''}
                      onChange={(e) => setDriverForm({ ...driverForm, email: e.target.value })}
                    />
                    <select
                      className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                      value={driverForm.status || 'actif'}
                      onChange={(e) => setDriverForm({ ...driverForm, status: e.target.value })}
                    >
                      <option value="actif">Actif</option>
                      <option value="suspendu">Suspendu</option>
                      <option value="inactif">Inactif</option>
                    </select>
                  </div>
                  <DialogFooter>
                    <Button onClick={() => handleCreate('/logistics/drivers/', driverForm, () => setDriverForm({ first_name: '', last_name: '', status: 'actif' }))}>
                      Enregistrer
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Téléphone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drivers.map((driver) => (
                    <TableRow key={driver.id}>
                      <TableCell>{driver.full_name || `${driver.first_name} ${driver.last_name}`}</TableCell>
                      <TableCell>{driver.phone || '-'}</TableCell>
                      <TableCell>{driver.email || '-'}</TableCell>
                      <TableCell>{driver.status}</TableCell>
                    </TableRow>
                  ))}
                  {drivers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-sm text-gray-500">
                        Aucun chauffeur enregistré.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="planification">
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Trajets planifiés</CardTitle>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" /> Nouveau trajet
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Planifier un trajet</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                      <Input
                        placeholder="Titre"
                        value={tripForm.title || ''}
                        onChange={(e) => setTripForm({ ...tripForm, title: e.target.value })}
                      />
                      <select
                        className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                        value={tripForm.vehicle || ''}
                        onChange={(e) => setTripForm({ ...tripForm, vehicle: e.target.value ? Number(e.target.value) : null })}
                      >
                        <option value="">Véhicule (optionnel)</option>
                        {vehicles.map((vehicle) => (
                          <option key={vehicle.id} value={vehicle.id}>
                            {vehicle.plate_number}
                          </option>
                        ))}
                      </select>
                      <select
                        className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                        value={tripForm.driver || ''}
                        onChange={(e) => setTripForm({ ...tripForm, driver: e.target.value ? Number(e.target.value) : null })}
                      >
                        <option value="">Chauffeur (optionnel)</option>
                        {drivers.map((driver) => (
                          <option key={driver.id} value={driver.id}>
                            {driver.full_name || `${driver.first_name} ${driver.last_name}`}
                          </option>
                        ))}
                      </select>
                      <select
                        className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                        value={tripForm.status || 'planifie'}
                        onChange={(e) => setTripForm({ ...tripForm, status: e.target.value })}
                      >
                        <option value="planifie">Planifié</option>
                        <option value="en_cours">En cours</option>
                        <option value="termine">Terminé</option>
                        <option value="annule">Annulé</option>
                      </select>
                      <Input
                        type="datetime-local"
                        value={tripForm.planned_start || ''}
                        onChange={(e) => setTripForm({ ...tripForm, planned_start: e.target.value })}
                      />
                      <Input
                        type="datetime-local"
                        value={tripForm.planned_end || ''}
                        onChange={(e) => setTripForm({ ...tripForm, planned_end: e.target.value })}
                      />
                    </div>
                    <DialogFooter>
                      <Button onClick={() => handleCreate('/logistics/trips/', tripForm, () => setTripForm({ title: '', status: 'planifie' }))}>
                        Enregistrer
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Référence</TableHead>
                      <TableHead>Titre</TableHead>
                      <TableHead>Chauffeur</TableHead>
                      <TableHead>Véhicule</TableHead>
                      <TableHead>Début planifié</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trips.map((trip) => (
                      <TableRow key={trip.id}>
                        <TableCell>{trip.reference}</TableCell>
                        <TableCell>{trip.title}</TableCell>
                        <TableCell>{trip.driver_name || '-'}</TableCell>
                        <TableCell>{trip.vehicle_label || '-'}</TableCell>
                        <TableCell>{formatDate(trip.planned_start)}</TableCell>
                        <TableCell>{trip.status}</TableCell>
                      </TableRow>
                    ))}
                    {trips.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-sm text-gray-500">
                          Aucun trajet planifié.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Arrêts planifiés</CardTitle>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Plus className="mr-2 h-4 w-4" /> Ajouter un arrêt
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Créer un arrêt</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                      <select
                        className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                        value={tripStopForm.trip || ''}
                        onChange={(e) => setTripStopForm({ ...tripStopForm, trip: e.target.value ? Number(e.target.value) : undefined })}
                      >
                        <option value="">Trajet</option>
                        {trips.map((trip) => (
                          <option key={trip.id} value={trip.id}>
                            {trip.reference} - {trip.title}
                          </option>
                        ))}
                      </select>
                      <Input
                        type="number"
                        placeholder="Ordre"
                        value={tripStopForm.sequence || 1}
                        onChange={(e) => setTripStopForm({ ...tripStopForm, sequence: Number(e.target.value) })}
                      />
                      <Input
                        placeholder="Adresse"
                        value={tripStopForm.address || ''}
                        onChange={(e) => setTripStopForm({ ...tripStopForm, address: e.target.value })}
                      />
                      <Input
                        type="datetime-local"
                        value={tripStopForm.planned_arrival || ''}
                        onChange={(e) => setTripStopForm({ ...tripStopForm, planned_arrival: e.target.value })}
                      />
                    </div>
                    <DialogFooter>
                      <Button onClick={() => handleCreate('/logistics/trip-stops/', tripStopForm, () => setTripStopForm({ sequence: 1, address: '' }))}>
                        Enregistrer
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Trajet</TableHead>
                      <TableHead>Ordre</TableHead>
                      <TableHead>Adresse</TableHead>
                      <TableHead>Arrivée planifiée</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tripStops.map((stop) => (
                      <TableRow key={stop.id}>
                        <TableCell>{stop.trip}</TableCell>
                        <TableCell>{stop.sequence}</TableCell>
                        <TableCell>{stop.address}</TableCell>
                        <TableCell>{formatDate(stop.planned_arrival)}</TableCell>
                      </TableRow>
                    ))}
                    {tripStops.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-sm text-gray-500">
                          Aucun arrêt enregistré.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="suivi">
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Suivi en temps réel</CardTitle>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Plus className="mr-2 h-4 w-4" /> Ajouter un point
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Nouveau point de suivi</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                      <select
                        className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                        value={trackingForm.vehicle || ''}
                        onChange={(e) => setTrackingForm({ ...trackingForm, vehicle: e.target.value ? Number(e.target.value) : undefined })}
                      >
                        <option value="">Véhicule</option>
                        {vehicles.map((vehicle) => (
                          <option key={vehicle.id} value={vehicle.id}>
                            {vehicle.plate_number}
                          </option>
                        ))}
                      </select>
                      <select
                        className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                        value={trackingForm.trip || ''}
                        onChange={(e) => setTrackingForm({ ...trackingForm, trip: e.target.value ? Number(e.target.value) : null })}
                      >
                        <option value="">Trajet (optionnel)</option>
                        {trips.map((trip) => (
                          <option key={trip.id} value={trip.id}>
                            {trip.reference}
                          </option>
                        ))}
                      </select>
                      <Input
                        placeholder="Latitude"
                        value={trackingForm.latitude || ''}
                        onChange={(e) => setTrackingForm({ ...trackingForm, latitude: e.target.value })}
                      />
                      <Input
                        placeholder="Longitude"
                        value={trackingForm.longitude || ''}
                        onChange={(e) => setTrackingForm({ ...trackingForm, longitude: e.target.value })}
                      />
                      <select
                        className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                        value={trackingForm.status || 'inconnu'}
                        onChange={(e) => setTrackingForm({ ...trackingForm, status: e.target.value })}
                      >
                        <option value="en_route">En route</option>
                        <option value="arret">Arrêt</option>
                        <option value="incident">Incident</option>
                        <option value="inconnu">Inconnu</option>
                      </select>
                    </div>
                    <DialogFooter>
                      <Button onClick={() => handleCreate('/logistics/tracking-points/', trackingForm, () => setTrackingForm({ status: 'inconnu' }))}>
                        Enregistrer
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Véhicule</TableHead>
                      <TableHead>Trajet</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trackingPoints.map((point) => (
                      <TableRow key={point.id}>
                        <TableCell>{point.vehicle_label || point.vehicle}</TableCell>
                        <TableCell>{point.trip_reference || '-'}</TableCell>
                        <TableCell>{formatDate(point.recorded_at)}</TableCell>
                        <TableCell>{point.status}</TableCell>
                      </TableRow>
                    ))}
                    {trackingPoints.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-sm text-gray-500">
                          Aucun point de suivi.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Maintenance</CardTitle>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Plus className="mr-2 h-4 w-4" /> Ajouter
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Maintenance</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-3">
                        <select
                          className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                          value={maintenanceForm.vehicle || ''}
                          onChange={(e) => setMaintenanceForm({ ...maintenanceForm, vehicle: e.target.value ? Number(e.target.value) : undefined })}
                        >
                          <option value="">Véhicule</option>
                          {vehicles.map((vehicle) => (
                            <option key={vehicle.id} value={vehicle.id}>
                              {vehicle.plate_number}
                            </option>
                          ))}
                        </select>
                        <select
                          className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                          value={maintenanceForm.maintenance_type || 'preventif'}
                          onChange={(e) => setMaintenanceForm({ ...maintenanceForm, maintenance_type: e.target.value })}
                        >
                          <option value="preventif">Préventif</option>
                          <option value="correctif">Correctif</option>
                        </select>
                        <DateInput
                          value={parseDateInput(maintenanceForm.performed_at)}
                          onChange={(date) => setMaintenanceForm({ ...maintenanceForm, performed_at: formatDateInput(date) })}
                        />
                      </div>
                      <DialogFooter>
                        <Button onClick={() => handleCreate('/logistics/maintenances/', maintenanceForm, () => setMaintenanceForm({ maintenance_type: 'preventif' }))}>
                          Enregistrer
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Véhicule</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {maintenances.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.vehicle_label || item.vehicle}</TableCell>
                          <TableCell>{item.maintenance_type}</TableCell>
                          <TableCell>{item.performed_at}</TableCell>
                        </TableRow>
                      ))}
                      {maintenances.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-sm text-gray-500">
                            Aucun enregistrement.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Carburant</CardTitle>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Plus className="mr-2 h-4 w-4" /> Ajouter
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Carburant</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-3">
                        <select
                          className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                          value={fuelForm.vehicle || ''}
                          onChange={(e) => setFuelForm({ ...fuelForm, vehicle: e.target.value ? Number(e.target.value) : undefined })}
                        >
                          <option value="">Véhicule</option>
                          {vehicles.map((vehicle) => (
                            <option key={vehicle.id} value={vehicle.id}>
                              {vehicle.plate_number}
                            </option>
                          ))}
                        </select>
                        <select
                          className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                          value={fuelForm.driver || ''}
                          onChange={(e) => setFuelForm({ ...fuelForm, driver: e.target.value ? Number(e.target.value) : null })}
                        >
                          <option value="">Chauffeur (optionnel)</option>
                          {drivers.map((driver) => (
                            <option key={driver.id} value={driver.id}>
                              {driver.full_name || `${driver.first_name} ${driver.last_name}`}
                            </option>
                          ))}
                        </select>
                        <Input
                          type="number"
                          placeholder="Litres"
                          value={fuelForm.liters || ''}
                          onChange={(e) => setFuelForm({ ...fuelForm, liters: e.target.value })}
                        />
                        <Input
                          type="datetime-local"
                          value={fuelForm.filled_at || ''}
                          onChange={(e) => setFuelForm({ ...fuelForm, filled_at: e.target.value })}
                        />
                      </div>
                      <DialogFooter>
                        <Button onClick={() => handleCreate('/logistics/fuel-logs/', fuelForm, () => setFuelForm({}))}>
                          Enregistrer
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Véhicule</TableHead>
                        <TableHead>Litres</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fuelLogs.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.vehicle_label || item.vehicle}</TableCell>
                          <TableCell>{item.liters}</TableCell>
                          <TableCell>{formatDate(item.filled_at)}</TableCell>
                        </TableRow>
                      ))}
                      {fuelLogs.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-sm text-gray-500">
                            Aucun enregistrement.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Incidents</CardTitle>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Plus className="mr-2 h-4 w-4" /> Ajouter
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Incident</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-3">
                        <select
                          className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                          value={incidentForm.vehicle || ''}
                          onChange={(e) => setIncidentForm({ ...incidentForm, vehicle: e.target.value ? Number(e.target.value) : undefined })}
                        >
                          <option value="">Véhicule</option>
                          {vehicles.map((vehicle) => (
                            <option key={vehicle.id} value={vehicle.id}>
                              {vehicle.plate_number}
                            </option>
                          ))}
                        </select>
                        <select
                          className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                          value={incidentForm.driver || ''}
                          onChange={(e) => setIncidentForm({ ...incidentForm, driver: e.target.value ? Number(e.target.value) : null })}
                        >
                          <option value="">Chauffeur (optionnel)</option>
                          {drivers.map((driver) => (
                            <option key={driver.id} value={driver.id}>
                              {driver.full_name || `${driver.first_name} ${driver.last_name}`}
                            </option>
                          ))}
                        </select>
                        <select
                          className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                          value={incidentForm.severity || 'faible'}
                          onChange={(e) => setIncidentForm({ ...incidentForm, severity: e.target.value })}
                        >
                          <option value="faible">Faible</option>
                          <option value="moyen">Moyen</option>
                          <option value="eleve">Élevé</option>
                          <option value="critique">Critique</option>
                        </select>
                        <Textarea
                          placeholder="Description"
                          value={incidentForm.description || ''}
                          onChange={(e) => setIncidentForm({ ...incidentForm, description: e.target.value })}
                        />
                      </div>
                      <DialogFooter>
                        <Button onClick={() => handleCreate('/logistics/incidents/', incidentForm, () => setIncidentForm({ severity: 'faible', resolved: false }))}>
                          Enregistrer
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Véhicule</TableHead>
                        <TableHead>Gravité</TableHead>
                        <TableHead>Résolu</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {incidents.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.vehicle_label || item.vehicle}</TableCell>
                          <TableCell>{item.severity}</TableCell>
                          <TableCell>{item.resolved ? 'Oui' : 'Non'}</TableCell>
                        </TableRow>
                      ))}
                      {incidents.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-sm text-gray-500">
                            Aucun incident.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
