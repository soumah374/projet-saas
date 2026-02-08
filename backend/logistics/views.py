from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from .models import (
    Fleet,
    Vehicle,
    Driver,
    DriverAssignment,
    Trip,
    TripStop,
    TrackingPoint,
    MaintenanceRecord,
    FuelLog,
    Incident,
)
from .serializers import (
    FleetSerializer,
    VehicleSerializer,
    DriverSerializer,
    DriverAssignmentSerializer,
    TripSerializer,
    TripStopSerializer,
    TrackingPointSerializer,
    MaintenanceRecordSerializer,
    FuelLogSerializer,
    IncidentSerializer,
)


class FleetViewSet(viewsets.ModelViewSet):
    queryset = Fleet.objects.all()
    serializer_class = FleetSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["is_active", "manager"]
    search_fields = ["name", "description", "manager__first_name", "manager__last_name"]
    ordering_fields = ["name", "created_at", "updated_at"]
    ordering = ["name"]


class VehicleViewSet(viewsets.ModelViewSet):
    queryset = Vehicle.objects.all()
    serializer_class = VehicleSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["fleet", "status", "fuel_type"]
    search_fields = ["plate_number", "vin", "brand", "model"]
    ordering_fields = ["plate_number", "created_at", "updated_at", "odometer_km"]
    ordering = ["plate_number"]


class DriverViewSet(viewsets.ModelViewSet):
    queryset = Driver.objects.all()
    serializer_class = DriverSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["status", "user"]
    search_fields = ["first_name", "last_name", "email", "phone", "license_number"]
    ordering_fields = ["last_name", "first_name", "created_at"]
    ordering = ["last_name"]


class DriverAssignmentViewSet(viewsets.ModelViewSet):
    queryset = DriverAssignment.objects.select_related("driver", "vehicle")
    serializer_class = DriverAssignmentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["driver", "vehicle", "is_primary"]
    search_fields = ["driver__first_name", "driver__last_name", "vehicle__plate_number"]
    ordering_fields = ["start_date", "created_at"]
    ordering = ["-start_date"]


class TripViewSet(viewsets.ModelViewSet):
    queryset = Trip.objects.select_related("driver", "vehicle", "fleet", "project")
    serializer_class = TripSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["status", "driver", "vehicle", "fleet", "project"]
    search_fields = ["reference", "title", "origin_address", "destination_address"]
    ordering_fields = ["planned_start", "planned_end", "created_at"]
    ordering = ["-created_at"]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class TripStopViewSet(viewsets.ModelViewSet):
    queryset = TripStop.objects.select_related("trip")
    serializer_class = TripStopSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ["trip"]
    ordering_fields = ["sequence"]
    ordering = ["sequence"]


class TrackingPointViewSet(viewsets.ModelViewSet):
    queryset = TrackingPoint.objects.select_related("vehicle", "trip")
    serializer_class = TrackingPointSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ["vehicle", "trip", "status"]
    ordering_fields = ["recorded_at", "created_at"]
    ordering = ["-recorded_at"]


class MaintenanceRecordViewSet(viewsets.ModelViewSet):
    queryset = MaintenanceRecord.objects.select_related("vehicle")
    serializer_class = MaintenanceRecordSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ["vehicle", "maintenance_type"]
    ordering_fields = ["performed_at", "created_at"]
    ordering = ["-performed_at"]


class FuelLogViewSet(viewsets.ModelViewSet):
    queryset = FuelLog.objects.select_related("vehicle", "driver")
    serializer_class = FuelLogSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ["vehicle", "driver"]
    ordering_fields = ["filled_at", "created_at"]
    ordering = ["-filled_at"]


class IncidentViewSet(viewsets.ModelViewSet):
    queryset = Incident.objects.select_related("vehicle", "driver", "trip")
    serializer_class = IncidentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ["vehicle", "driver", "trip", "resolved", "severity"]
    ordering_fields = ["reported_at", "created_at"]
    ordering = ["-reported_at"]
