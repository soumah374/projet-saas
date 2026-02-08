from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from .models import Notification
from .serializers import NotificationSerializer

# Create your views here.

class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """
        Retourne les notifications de l'utilisateur connecté.
        Supporte le filtrage par type et état de lecture.
        """
        queryset = Notification.objects.filter(recipient=self.request.user)
        
        # Filtrage par type
        notification_type = self.request.query_params.get('type', None)
        if notification_type:
            queryset = queryset.filter(type=notification_type)
        
        # Filtrage par état de lecture
        is_read = self.request.query_params.get('is_read', None)
        if is_read is not None:
            is_read = is_read.lower() == 'true'
            queryset = queryset.filter(is_read=is_read)
            
        return queryset

    def perform_create(self, serializer):
        serializer.save(recipient=self.request.user)

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """
        Marque toutes les notifications non lues comme lues.
        """
        self.get_queryset().filter(is_read=False).update(is_read=True)
        return Response({'status': 'notifications marked as read'})

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """
        Marque une notification spécifique comme lue.
        """
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({'status': 'notification marked as read'})

    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """
        Retourne le nombre de notifications non lues.
        """
        count = self.get_queryset().filter(is_read=False).count()
        return Response({'unread_count': count})

    def list(self, request, *args, **kwargs):
        """
        Liste les notifications avec support de pagination.
        """
        queryset = self.get_queryset()
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
