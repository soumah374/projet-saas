import uuid
from django.db import models
from django.utils import timezone
from django.contrib.auth import get_user_model
from apps.projects.models import Project

User = get_user_model()


class Fleet(models.Model):
    name = models.CharField(max_length=150, unique=True, verbose_name="Nom")
    description = models.TextField(blank=True, verbose_name="Description")
    manager = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="managed_fleets",
        verbose_name="Responsable"
    )
    is_active = models.BooleanField(default=True, verbose_name="Actif")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Flotte"
        verbose_name_plural = "Flottes"
        ordering = ["name"]

    def __str__(self):
        return self.name


class Vehicle(models.Model):
    FUEL_TYPES = [
        ("essence", "Essence"),
        ("diesel", "Diesel"),
        ("hybride", "Hybride"),
        ("electrique", "Électrique"),
        ("gaz", "Gaz"),
        ("autre", "Autre"),
    ]
    STATUS_CHOICES = [
        ("actif", "Actif"),
        ("maintenance", "En maintenance"),
        ("inactif", "Inactif"),
        ("retire", "Retiré"),
    ]

    fleet = models.ForeignKey(
        Fleet,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="vehicles",
        verbose_name="Flotte"
    )
    plate_number = models.CharField(max_length=30, unique=True, verbose_name="Immatriculation")
    vin = models.CharField(max_length=64, blank=True, null=True, unique=True, verbose_name="VIN")
    brand = models.CharField(max_length=100, blank=True, verbose_name="Marque")
    model = models.CharField(max_length=100, blank=True, verbose_name="Modèle")
    year = models.PositiveIntegerField(null=True, blank=True, verbose_name="Année")
    color = models.CharField(max_length=50, blank=True, verbose_name="Couleur")
    fuel_type = models.CharField(max_length=20, choices=FUEL_TYPES, default="diesel", verbose_name="Carburant")
    capacity_kg = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Capacité (kg)")
    capacity_volume = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Capacité (m3)")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="actif", verbose_name="Statut")
    odometer_km = models.PositiveIntegerField(default=0, verbose_name="Kilométrage (km)")
    last_service_date = models.DateField(null=True, blank=True, verbose_name="Dernière maintenance")
    next_service_date = models.DateField(null=True, blank=True, verbose_name="Prochaine maintenance")
    insurance_expiry = models.DateField(null=True, blank=True, verbose_name="Expiration assurance")
    registration_expiry = models.DateField(null=True, blank=True, verbose_name="Expiration carte grise")
    notes = models.TextField(blank=True, verbose_name="Notes")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Véhicule"
        verbose_name_plural = "Véhicules"
        ordering = ["plate_number"]

    def __str__(self):
        return f"{self.plate_number} - {self.brand} {self.model}".strip()


class Driver(models.Model):
    STATUS_CHOICES = [
        ("actif", "Actif"),
        ("suspendu", "Suspendu"),
        ("inactif", "Inactif"),
    ]

    user = models.OneToOneField(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="driver_profile",
        verbose_name="Utilisateur"
    )
    first_name = models.CharField(max_length=100, verbose_name="Prénom")
    last_name = models.CharField(max_length=100, verbose_name="Nom")
    phone = models.CharField(max_length=30, blank=True, verbose_name="Téléphone")
    email = models.EmailField(blank=True, verbose_name="Email")
    license_number = models.CharField(max_length=50, blank=True, verbose_name="Permis")
    license_expiry = models.DateField(null=True, blank=True, verbose_name="Expiration permis")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="actif", verbose_name="Statut")
    hire_date = models.DateField(null=True, blank=True, verbose_name="Date d'embauche")
    notes = models.TextField(blank=True, verbose_name="Notes")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Chauffeur"
        verbose_name_plural = "Chauffeurs"
        ordering = ["last_name", "first_name"]

    def __str__(self):
        return self.get_full_name()

    def get_full_name(self):
        if self.user:
            return self.user.get_full_name() or self.user.username
        return f"{self.first_name} {self.last_name}".strip()


class DriverAssignment(models.Model):
    driver = models.ForeignKey(Driver, on_delete=models.CASCADE, related_name="assignments", verbose_name="Chauffeur")
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name="assignments", verbose_name="Véhicule")
    start_date = models.DateField(default=timezone.now, verbose_name="Date de début")
    end_date = models.DateField(null=True, blank=True, verbose_name="Date de fin")
    is_primary = models.BooleanField(default=True, verbose_name="Principal")
    notes = models.TextField(blank=True, verbose_name="Notes")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Affectation chauffeur"
        verbose_name_plural = "Affectations chauffeurs"
        ordering = ["-start_date"]
        unique_together = ["driver", "vehicle", "start_date"]

    def __str__(self):
        return f"{self.driver.get_full_name()} -> {self.vehicle.plate_number}"


class Trip(models.Model):
    STATUS_CHOICES = [
        ("planifie", "Planifié"),
        ("en_cours", "En cours"),
        ("termine", "Terminé"),
        ("annule", "Annulé"),
    ]

    reference = models.CharField(max_length=36, unique=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200, verbose_name="Titre")
    description = models.TextField(blank=True, verbose_name="Description")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="planifie", verbose_name="Statut")
    project = models.ForeignKey(
        Project,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="logistics_trips",
        verbose_name="Projet"
    )
    fleet = models.ForeignKey(
        Fleet,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="trips",
        verbose_name="Flotte"
    )
    vehicle = models.ForeignKey(
        Vehicle,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="trips",
        verbose_name="Véhicule"
    )
    driver = models.ForeignKey(
        Driver,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="trips",
        verbose_name="Chauffeur"
    )
    origin_address = models.CharField(max_length=255, blank=True, verbose_name="Origine")
    destination_address = models.CharField(max_length=255, blank=True, verbose_name="Destination")
    planned_start = models.DateTimeField(null=True, blank=True, verbose_name="Début planifié")
    planned_end = models.DateTimeField(null=True, blank=True, verbose_name="Fin planifiée")
    actual_start = models.DateTimeField(null=True, blank=True, verbose_name="Début réel")
    actual_end = models.DateTimeField(null=True, blank=True, verbose_name="Fin réelle")
    distance_km = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Distance (km)")
    cargo_description = models.TextField(blank=True, verbose_name="Chargement")
    cargo_weight_kg = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Poids (kg)")
    created_by = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="created_trips",
        verbose_name="Créé par"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Trajet"
        verbose_name_plural = "Trajets"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.reference} - {self.title}"


class TripStop(models.Model):
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name="stops", verbose_name="Trajet")
    sequence = models.PositiveIntegerField(verbose_name="Ordre")
    address = models.CharField(max_length=255, verbose_name="Adresse")
    planned_arrival = models.DateTimeField(null=True, blank=True, verbose_name="Arrivée planifiée")
    actual_arrival = models.DateTimeField(null=True, blank=True, verbose_name="Arrivée réelle")
    notes = models.TextField(blank=True, verbose_name="Notes")

    class Meta:
        verbose_name = "Arrêt de trajet"
        verbose_name_plural = "Arrêts de trajet"
        ordering = ["sequence"]
        unique_together = ["trip", "sequence"]

    def __str__(self):
        return f"{self.trip.reference} - {self.sequence}"


class TrackingPoint(models.Model):
    STATUS_CHOICES = [
        ("en_route", "En route"),
        ("arret", "Arrêt"),
        ("incident", "Incident"),
        ("inconnu", "Inconnu"),
    ]

    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name="tracking_points", verbose_name="Véhicule")
    trip = models.ForeignKey(Trip, null=True, blank=True, on_delete=models.SET_NULL, related_name="tracking_points", verbose_name="Trajet")
    recorded_at = models.DateTimeField(default=timezone.now, verbose_name="Date")
    latitude = models.DecimalField(max_digits=9, decimal_places=6, verbose_name="Latitude")
    longitude = models.DecimalField(max_digits=9, decimal_places=6, verbose_name="Longitude")
    speed_kmh = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True, verbose_name="Vitesse (km/h)")
    odometer_km = models.PositiveIntegerField(null=True, blank=True, verbose_name="Kilométrage (km)")
    fuel_level = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, verbose_name="Niveau carburant (%)")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="inconnu", verbose_name="Statut")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Point de suivi"
        verbose_name_plural = "Points de suivi"
        ordering = ["-recorded_at"]

    def __str__(self):
        return f"{self.vehicle.plate_number} - {self.recorded_at}"


class MaintenanceRecord(models.Model):
    TYPE_CHOICES = [
        ("preventif", "Préventif"),
        ("correctif", "Correctif"),
    ]

    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name="maintenances", verbose_name="Véhicule")
    maintenance_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default="preventif", verbose_name="Type")
    description = models.TextField(blank=True, verbose_name="Description")
    provider = models.CharField(max_length=150, blank=True, verbose_name="Prestataire")
    cost = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, verbose_name="Coût")
    performed_at = models.DateField(default=timezone.now, verbose_name="Date")
    next_due_date = models.DateField(null=True, blank=True, verbose_name="Prochaine échéance")
    odometer_km = models.PositiveIntegerField(null=True, blank=True, verbose_name="Kilométrage (km)")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Maintenance"
        verbose_name_plural = "Maintenances"
        ordering = ["-performed_at"]

    def __str__(self):
        return f"{self.vehicle.plate_number} - {self.performed_at}"


class FuelLog(models.Model):
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name="fuel_logs", verbose_name="Véhicule")
    driver = models.ForeignKey(Driver, null=True, blank=True, on_delete=models.SET_NULL, related_name="fuel_logs", verbose_name="Chauffeur")
    filled_at = models.DateTimeField(default=timezone.now, verbose_name="Date")
    liters = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Litres")
    cost = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, verbose_name="Coût")
    odometer_km = models.PositiveIntegerField(null=True, blank=True, verbose_name="Kilométrage (km)")
    station = models.CharField(max_length=150, blank=True, verbose_name="Station")
    notes = models.TextField(blank=True, verbose_name="Notes")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Carburant"
        verbose_name_plural = "Carburants"
        ordering = ["-filled_at"]

    def __str__(self):
        return f"{self.vehicle.plate_number} - {self.liters}L"


class Incident(models.Model):
    SEVERITY_CHOICES = [
        ("faible", "Faible"),
        ("moyen", "Moyen"),
        ("eleve", "Élevé"),
        ("critique", "Critique"),
    ]

    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name="incidents", verbose_name="Véhicule")
    driver = models.ForeignKey(Driver, null=True, blank=True, on_delete=models.SET_NULL, related_name="incidents", verbose_name="Chauffeur")
    trip = models.ForeignKey(Trip, null=True, blank=True, on_delete=models.SET_NULL, related_name="incidents", verbose_name="Trajet")
    reported_at = models.DateTimeField(default=timezone.now, verbose_name="Date")
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default="faible", verbose_name="Gravité")
    description = models.TextField(verbose_name="Description")
    resolved = models.BooleanField(default=False, verbose_name="Résolu")
    resolved_at = models.DateTimeField(null=True, blank=True, verbose_name="Résolu le")
    resolution_notes = models.TextField(blank=True, verbose_name="Notes de résolution")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Incident"
        verbose_name_plural = "Incidents"
        ordering = ["-reported_at"]

    def __str__(self):
        return f"{self.vehicle.plate_number} - {self.severity}"
