from django.contrib import admin
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


@admin.register(Fleet)
class FleetAdmin(admin.ModelAdmin):
    list_display = ("name", "manager", "is_active", "created_at")
    search_fields = ("name", "manager__first_name", "manager__last_name")
    list_filter = ("is_active",)


@admin.register(Vehicle)
class VehicleAdmin(admin.ModelAdmin):
    list_display = ("plate_number", "brand", "model", "status", "fleet")
    search_fields = ("plate_number", "vin", "brand", "model")
    list_filter = ("status", "fuel_type", "fleet")


@admin.register(Driver)
class DriverAdmin(admin.ModelAdmin):
    list_display = ("last_name", "first_name", "status", "phone", "email")
    search_fields = ("first_name", "last_name", "email", "phone", "license_number")
    list_filter = ("status",)


@admin.register(DriverAssignment)
class DriverAssignmentAdmin(admin.ModelAdmin):
    list_display = ("driver", "vehicle", "start_date", "end_date", "is_primary")
    list_filter = ("is_primary",)
    search_fields = ("driver__first_name", "driver__last_name", "vehicle__plate_number")


@admin.register(Trip)
class TripAdmin(admin.ModelAdmin):
    list_display = ("reference", "title", "status", "vehicle", "driver", "planned_start")
    search_fields = ("reference", "title", "origin_address", "destination_address")
    list_filter = ("status", "fleet")


@admin.register(TripStop)
class TripStopAdmin(admin.ModelAdmin):
    list_display = ("trip", "sequence", "address", "planned_arrival", "actual_arrival")
    search_fields = ("address", "trip__reference")


@admin.register(TrackingPoint)
class TrackingPointAdmin(admin.ModelAdmin):
    list_display = ("vehicle", "trip", "recorded_at", "status")
    list_filter = ("status",)
    search_fields = ("vehicle__plate_number", "trip__reference")


@admin.register(MaintenanceRecord)
class MaintenanceRecordAdmin(admin.ModelAdmin):
    list_display = ("vehicle", "maintenance_type", "performed_at", "cost")
    list_filter = ("maintenance_type",)
    search_fields = ("vehicle__plate_number", "provider")


@admin.register(FuelLog)
class FuelLogAdmin(admin.ModelAdmin):
    list_display = ("vehicle", "driver", "filled_at", "liters", "cost")
    search_fields = ("vehicle__plate_number", "driver__first_name", "driver__last_name")


@admin.register(Incident)
class IncidentAdmin(admin.ModelAdmin):
    list_display = ("vehicle", "severity", "reported_at", "resolved")
    list_filter = ("severity", "resolved")
    search_fields = ("vehicle__plate_number", "description")
