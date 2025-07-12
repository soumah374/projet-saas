from django.contrib import admin
from .models import Service, IntervenantProfile, Category

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "created_at")
    search_fields = ("name",)
    ordering = ("name",)

@admin.register(IntervenantProfile)
class IntervenantProfileAdmin(admin.ModelAdmin):
    list_display = ("name", "created_at")
    search_fields = ("name",)
    ordering = ("name",)

@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "price", "duration", "profile_intervenant", "is_active", "created_at")
    search_fields = ("name", "category__name")
    list_filter = ("is_active", "category", "profile_intervenant")
    ordering = ("-created_at",)
