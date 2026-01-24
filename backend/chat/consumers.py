import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from .models import Conversation, Message

User = get_user_model()


class ChatConsumer(AsyncWebsocketConsumer):
    """Consumer WebSocket pour le chat en temps réel"""
    
    async def connect(self):
        """Gère la connexion WebSocket"""
        # L'utilisateur est déjà authentifié via le middleware JWT
        self.user = self.scope.get("user")
        
        if not self.user or not self.user.is_authenticated:
            await self.close()
            return
        
        # Rejoindre le groupe de l'utilisateur pour recevoir les notifications
        self.user_group = f"user_{self.user.id}"
        await self.channel_layer.group_add(
            self.user_group,
            self.channel_name
        )
        
        await self.accept()
    
    async def disconnect(self, close_code):
        """Gère la déconnexion WebSocket"""
        if hasattr(self, 'user_group'):
            await self.channel_layer.group_discard(
                self.user_group,
                self.channel_name
            )
        
        # Quitter tous les groupes de conversations
        if hasattr(self, 'conversation_groups'):
            for group in self.conversation_groups:
                await self.channel_layer.group_discard(
                    group,
                    self.channel_name
                )
    
    async def receive(self, text_data):
        """Reçoit un message du WebSocket"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'subscribe_conversation':
                conversation_id = data.get('conversation_id')
                if conversation_id:
                    await self.subscribe_to_conversation(conversation_id)
            
            elif message_type == 'unsubscribe_conversation':
                conversation_id = data.get('conversation_id')
                if conversation_id:
                    await self.unsubscribe_from_conversation(conversation_id)
        
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'error': 'Invalid JSON'
            }))
    
    async def subscribe_to_conversation(self, conversation_id):
        """S'abonne à une conversation spécifique"""
        # Vérifier que l'utilisateur fait partie de la conversation
        is_participant = await self.is_conversation_participant(conversation_id)
        
        if not is_participant:
            await self.send(text_data=json.dumps({
                'error': 'Vous n\'êtes pas autorisé à accéder à cette conversation'
            }))
            return
        
        group_name = f"conversation_{conversation_id}"
        await self.channel_layer.group_add(
            group_name,
            self.channel_name
        )
        
        if not hasattr(self, 'conversation_groups'):
            self.conversation_groups = set()
        self.conversation_groups.add(group_name)
        
        await self.send(text_data=json.dumps({
            'type': 'subscribed',
            'conversation_id': conversation_id
        }))
    
    async def unsubscribe_from_conversation(self, conversation_id):
        """Se désabonne d'une conversation"""
        group_name = f"conversation_{conversation_id}"
        await self.channel_layer.group_discard(
            group_name,
            self.channel_name
        )
        
        if hasattr(self, 'conversation_groups'):
            self.conversation_groups.discard(group_name)
        
        await self.send(text_data=json.dumps({
            'type': 'unsubscribed',
            'conversation_id': conversation_id
        }))
    
    @database_sync_to_async
    def is_conversation_participant(self, conversation_id):
        """Vérifie si l'utilisateur est participant de la conversation"""
        try:
            conversation = Conversation.objects.get(id=conversation_id)
            return self.user in conversation.participants.all()
        except Conversation.DoesNotExist:
            return False
    
    async def new_message(self, event):
        """Gère la réception d'un nouveau message"""
        await self.send(text_data=json.dumps({
            'type': 'new_message',
            'message': event['message']
        }))
    
    async def message_added(self, event):
        """Gère l'ajout d'un message dans une conversation"""
        await self.send(text_data=json.dumps({
            'type': 'message_added',
            'message': event['message']
        }))

