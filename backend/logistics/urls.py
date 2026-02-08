from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    FleetViewSet,
    VehicleViewSet,
    DriverViewSet,
    DriverAssignmentViewSet,
    TripViewSet,
    TripStopViewSet,
    TrackingPointViewSet,
    MaintenanceRecordViewSet,
    FuelLogViewSet,
    IncidentViewSet,
)

router = DefaultRouter()
router.register(r'fleets', FleetViewSet, basename='fleet')
router.register(r'vehicles', VehicleViewSet, basename='vehicle')
router.register(r'drivers', DriverViewSet, basename='driver')
router.register(r'assignments', DriverAssignmentViewSet, basename='driver-assignment')
router.register(r'trips', TripViewSet, basename='trip')
router.register(r'trip-stops', TripStopViewSet, basename='trip-stop')
router.register(r'tracking-points', TrackingPointViewSet, basename='tracking-point')
router.register(r'maintenances', MaintenanceRecordViewSet, basename='maintenance')
router.register(r'fuel-logs', FuelLogViewSet, basename='fuel-log')
router.register(r'incidents', IncidentViewSet, basename='incident')

urlpatterns = [
    path('', include(router.urls)),
]
