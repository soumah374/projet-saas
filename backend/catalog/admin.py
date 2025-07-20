from django.contrib import admin
from .models import Service, Category, Activity, IntervenantProfile, TauxHoraire, ActivityProfile, UniteStandard

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "created_at")
    search_fields = ("name",)
    ordering = ("name",)

@admin.register(UniteStandard)
class UniteStandardAdmin(admin.ModelAdmin):
    list_display = ("intitule", "code", "is_active", "created_at")
    search_fields = ("intitule", "code", "description")
    list_filter = ("is_active", "created_at")
    ordering = ("intitule",)

@admin.register(IntervenantProfile)
class IntervenantProfileAdmin(admin.ModelAdmin):
    list_display = ("name", "created_at")
    search_fields = ("name",)
    ordering = ("name",)

@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "is_active", "created_at")
    search_fields = ("name", "category__name")
    list_filter = ("is_active", "category")
    ordering = ("-created_at",)

@admin.register(Activity)
class ActivityAdmin(admin.ModelAdmin):
    list_display = ("name", "service", "duree_standard", "get_profiles_intervenant", "is_active", "created_at")
    search_fields = ("name", "service__name")
    list_filter = ("is_active", "service")
    ordering = ("-created_at",)

    def get_profiles_intervenant(self, obj):
        profiles = obj.activityprofile_set.all()
        if profiles:
            return ", ".join([f"{p.profile_intervenant.name} ({p.temps_intervenant}h)" for p in profiles])
        return "Aucun profil"
    get_profiles_intervenant.short_description = "Profils intervenant"

@admin.register(ActivityProfile)
class ActivityProfileAdmin(admin.ModelAdmin):
    list_display = ['activity', 'profile_intervenant', 'temps_intervenant', 'created_at']
    list_filter = ['activity__service', 'profile_intervenant', 'created_at']
    search_fields = ['activity__name', 'profile_intervenant__name']
    ordering = ['-created_at']

@admin.register(TauxHoraire)
class TauxHoraireAdmin(admin.ModelAdmin):
    list_display = ("activity", "profile_intervenant", "niveau_intervenant", "taux_heure", "is_active", "created_at")
    search_fields = ("activity__name", "profile_intervenant__name")
    list_filter = ("niveau_intervenant", "is_active", "activity", "profile_intervenant")
    ordering = ("-created_at",)
