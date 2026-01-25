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
        # Envoyer typing_stopped pour toutes les conversations actives
        if hasattr(self, 'typing_conversations'):
            for conv_id in self.typing_conversations:
                await self.channel_layer.group_send(
                    f"conversation_{conv_id}",
                    {
                        "type": "typing_stopped",
                        "user": {
                            "id": str(self.user.id),
                            "username": self.user.username
                        },
                        "conversation_id": conv_id
                    }
                )

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

            elif message_type == 'typing_started':
                conversation_id = data.get('conversation_id')
                if conversation_id:
                    await self.handle_typing_started(conversation_id)

            elif message_type == 'typing_stopped':
                conversation_id = data.get('conversation_id')
                if conversation_id:
                    await self.handle_typing_stopped(conversation_id)

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

    async def handle_typing_started(self, conversation_id):
        """Gère le début de frappe"""
        is_participant = await self.is_conversation_participant(conversation_id)
        if not is_participant:
            return

        if not hasattr(self, 'typing_conversations'):
            self.typing_conversations = set()
        self.typing_conversations.add(conversation_id)

        await self.channel_layer.group_send(
            f"conversation_{conversation_id}",
            {
                "type": "typing_started",
                "user": {
                    "id": str(self.user.id),
                    "username": self.user.username,
                    "full_name": f"{self.user.first_name} {self.user.last_name}".strip() or self.user.username
                },
                "conversation_id": conversation_id
            }
        )

    async def handle_typing_stopped(self, conversation_id):
        """Gère la fin de frappe"""
        if hasattr(self, 'typing_conversations'):
            self.typing_conversations.discard(conversation_id)

        await self.channel_layer.group_send(
            f"conversation_{conversation_id}",
            {
                "type": "typing_stopped",
                "user": {
                    "id": str(self.user.id),
                    "username": self.user.username
                },
                "conversation_id": conversation_id
            }
        )

    @database_sync_to_async
    def is_conversation_participant(self, conversation_id):
        """Vérifie si l'utilisateur est participant de la conversation"""
        try:
            conversation = Conversation.objects.get(id=conversation_id)
            return self.user in conversation.participants.all()
        except Conversation.DoesNotExist:
            return False

    # Event handlers

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

    async def message_edited(self, event):
        """Gère la modification d'un message"""
        await self.send(text_data=json.dumps({
            'type': 'message_edited',
            'message': event['message']
        }))

    async def message_deleted(self, event):
        """Gère la suppression d'un message"""
        await self.send(text_data=json.dumps({
            'type': 'message_deleted',
            'message': event['message']
        }))

    async def reaction_added(self, event):
        """Gère l'ajout d'une réaction"""
        await self.send(text_data=json.dumps({
            'type': 'reaction_added',
            'message': event['message']
        }))

    async def reaction_removed(self, event):
        """Gère la suppression d'une réaction"""
        await self.send(text_data=json.dumps({
            'type': 'reaction_removed',
            'message': event['message']
        }))

    async def typing_started(self, event):
        """Gère le début de frappe d'un utilisateur"""
        # Ne pas envoyer à l'utilisateur qui tape
        if str(self.user.id) != event['user']['id']:
            await self.send(text_data=json.dumps({
                'type': 'typing_started',
                'user': event['user'],
                'conversation_id': event['conversation_id']
            }))

    async def typing_stopped(self, event):
        """Gère la fin de frappe d'un utilisateur"""
        if str(self.user.id) != event['user']['id']:
            await self.send(text_data=json.dumps({
                'type': 'typing_stopped',
                'user': event['user'],
                'conversation_id': event['conversation_id']
            }))

    async def group_created(self, event):
        """Gère la création d'un groupe"""
        await self.send(text_data=json.dumps({
            'type': 'group_created',
            'conversation': event['conversation']
        }))

    async def member_added(self, event):
        """Gère l'ajout d'un membre au groupe"""
        await self.send(text_data=json.dumps({
            'type': 'member_added',
            'conversation_id': event['conversation_id'],
            'member': event['member']
        }))

    async def member_removed(self, event):
        """Gère la suppression d'un membre du groupe"""
        await self.send(text_data=json.dumps({
            'type': 'member_removed',
            'conversation_id': event['conversation_id'],
            'user_id': event['user_id']
        }))

