from rest_framework import serializers
from .models import Service, Category, Activity, IntervenantProfile, TauxHoraire, ActivityProfile

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name']

class IntervenantProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = IntervenantProfile
        fields = ['id', 'name']

class ActivityProfileSerializer(serializers.ModelSerializer):
    profile_intervenant = IntervenantProfileSerializer(read_only=True)
    profile_intervenant_id = serializers.PrimaryKeyRelatedField(
        queryset=IntervenantProfile.objects.all(), 
        source='profile_intervenant', 
        write_only=True
    )
    
    class Meta:
        model = ActivityProfile
        fields = ['id', 'profile_intervenant', 'profile_intervenant_id', 'temps_intervenant']

class ServiceSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source='category', write_only=True, required=False, allow_null=True
    )
    
    class Meta:
        model = Service
        fields = '__all__'

class ServiceDetailSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source='category', write_only=True, required=False, allow_null=True
    )
    activities = serializers.SerializerMethodField()
    
    class Meta:
        model = Service
        fields = '__all__'
    
    def get_activities(self, obj):
        activities = Activity.objects.filter(service=obj)
        return ActivitySerializer(activities, many=True).data

class ActivitySerializer(serializers.ModelSerializer):
    service = ServiceSerializer(read_only=True)
    service_id = serializers.PrimaryKeyRelatedField(
        queryset=Service.objects.all(), 
        source='service', 
        write_only=True
    )
    activity_profiles = ActivityProfileSerializer(many=True, read_only=True, source='activityprofile_set')
    profiles_data = serializers.ListField(
        child=serializers.DictField(),
        write_only=True,
        required=False
    )
    
    class Meta:
        model = Activity
        fields = '__all__'
    
    def create(self, validated_data):
        profiles_data = validated_data.pop('profiles_data', [])
        activity = Activity.objects.create(**validated_data)
        
        # Créer les relations ActivityProfile
        for profile_data in profiles_data:
            ActivityProfile.objects.create(
                activity=activity,
                profile_intervenant_id=profile_data['profile_intervenant_id'],
                temps_intervenant=profile_data['temps_intervenant']
            )
        
        return activity
    
    def update(self, instance, validated_data):
        profiles_data = validated_data.pop('profiles_data', [])
        
        # Mettre à jour l'activité
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Supprimer les anciennes relations
        instance.activityprofile_set.all().delete()
        
        # Créer les nouvelles relations
        for profile_data in profiles_data:
            ActivityProfile.objects.create(
                activity=instance,
                profile_intervenant_id=profile_data['profile_intervenant_id'],
                temps_intervenant=profile_data['temps_intervenant']
            )
        
        return instance

class TauxHoraireSerializer(serializers.ModelSerializer):
    activity = ActivitySerializer(read_only=True)
    activity_id = serializers.PrimaryKeyRelatedField(
        queryset=Activity.objects.all(), 
        source='activity', 
        write_only=True
    )
    profile_intervenant = IntervenantProfileSerializer(read_only=True)
    profile_intervenant_id = serializers.PrimaryKeyRelatedField(
        queryset=IntervenantProfile.objects.all(), 
        source='profile_intervenant', 
        write_only=True
    )
    
    class Meta:
        model = TauxHoraire
        fields = '__all__' 