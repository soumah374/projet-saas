from rest_framework import serializers
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


class FleetSerializer(serializers.ModelSerializer):
    manager_name = serializers.SerializerMethodField()

    class Meta:
        model = Fleet
        fields = "__all__"
        read_only_fields = ["created_at", "updated_at", "manager_name"]

    def get_manager_name(self, obj):
        if obj.manager:
            return obj.manager.get_full_name() or obj.manager.username
        return None


class VehicleSerializer(serializers.ModelSerializer):
    fleet_name = serializers.SerializerMethodField()

    class Meta:
        model = Vehicle
        fields = "__all__"
        read_only_fields = ["created_at", "updated_at", "fleet_name"]

    def get_fleet_name(self, obj):
        return obj.fleet.name if obj.fleet else None


class DriverSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = Driver
        fields = "__all__"
        read_only_fields = ["created_at", "updated_at", "full_name"]

    def get_full_name(self, obj):
        return obj.get_full_name()


class DriverAssignmentSerializer(serializers.ModelSerializer):
    driver_name = serializers.SerializerMethodField()
    vehicle_label = serializers.SerializerMethodField()

    class Meta:
        model = DriverAssignment
        fields = "__all__"
        read_only_fields = ["created_at", "driver_name", "vehicle_label"]

    def get_driver_name(self, obj):
        return obj.driver.get_full_name()

    def get_vehicle_label(self, obj):
        return obj.vehicle.plate_number


class TripSerializer(serializers.ModelSerializer):
    driver_name = serializers.SerializerMethodField()
    vehicle_label = serializers.SerializerMethodField()
    fleet_name = serializers.SerializerMethodField()
    project_title = serializers.SerializerMethodField()

    class Meta:
        model = Trip
        fields = "__all__"
        read_only_fields = ["created_at", "updated_at", "driver_name", "vehicle_label", "fleet_name", "project_title"]

    def get_driver_name(self, obj):
        return obj.driver.get_full_name() if obj.driver else None

    def get_vehicle_label(self, obj):
        return obj.vehicle.plate_number if obj.vehicle else None

    def get_fleet_name(self, obj):
        return obj.fleet.name if obj.fleet else None

    def get_project_title(self, obj):
        return obj.project.title if obj.project else None


class TripStopSerializer(serializers.ModelSerializer):
    class Meta:
        model = TripStop
        fields = "__all__"


class TrackingPointSerializer(serializers.ModelSerializer):
    vehicle_label = serializers.SerializerMethodField()
    trip_reference = serializers.SerializerMethodField()

    class Meta:
        model = TrackingPoint
        fields = "__all__"
        read_only_fields = ["created_at", "vehicle_label", "trip_reference"]

    def get_vehicle_label(self, obj):
        return obj.vehicle.plate_number

    def get_trip_reference(self, obj):
        return obj.trip.reference if obj.trip else None


class MaintenanceRecordSerializer(serializers.ModelSerializer):
    vehicle_label = serializers.SerializerMethodField()

    class Meta:
        model = MaintenanceRecord
        fields = "__all__"
        read_only_fields = ["created_at", "vehicle_label"]

    def get_vehicle_label(self, obj):
        return obj.vehicle.plate_number


class FuelLogSerializer(serializers.ModelSerializer):
    vehicle_label = serializers.SerializerMethodField()
    driver_name = serializers.SerializerMethodField()

    class Meta:
        model = FuelLog
        fields = "__all__"
        read_only_fields = ["created_at", "vehicle_label", "driver_name"]

    def get_vehicle_label(self, obj):
        return obj.vehicle.plate_number

    def get_driver_name(self, obj):
        return obj.driver.get_full_name() if obj.driver else None


class IncidentSerializer(serializers.ModelSerializer):
    vehicle_label = serializers.SerializerMethodField()
    driver_name = serializers.SerializerMethodField()
    trip_reference = serializers.SerializerMethodField()

    class Meta:
        model = Incident
        fields = "__all__"
        read_only_fields = ["created_at", "vehicle_label", "driver_name", "trip_reference"]

    def get_vehicle_label(self, obj):
        return obj.vehicle.plate_number

    def get_driver_name(self, obj):
        return obj.driver.get_full_name() if obj.driver else None

    def get_trip_reference(self, obj):
        return obj.trip.reference if obj.trip else None
