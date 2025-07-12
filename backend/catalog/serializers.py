from rest_framework import serializers
from .models import Service, IntervenantProfile, Category

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name']

class IntervenantProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = IntervenantProfile
        fields = ['id', 'name']

class ServiceSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source='category', write_only=True, required=False, allow_null=True
    )
    profile_intervenant = IntervenantProfileSerializer(read_only=True)
    profile_intervenant_id = serializers.PrimaryKeyRelatedField(
        queryset=IntervenantProfile.objects.all(), source='profile_intervenant', write_only=True, required=False, allow_null=True
    )
    class Meta:
        model = Service
        fields = '__all__'  # duration inclus automatiquement 