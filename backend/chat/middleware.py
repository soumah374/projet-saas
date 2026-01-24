from urllib.parse import parse_qs
from channels.middleware import BaseMiddleware
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.contrib.auth.models import AnonymousUser

User = get_user_model()


class JWTAuthMiddleware(BaseMiddleware):
    """
    Middleware d'authentification JWT pour WebSocket
    """

    def __init__(self, inner):
        super().__init__(inner)
        self.inner = inner

    async def __call__(self, scope, receive, send):
        # Récupérer le token depuis les query params
        query_string = scope.get("query_string", b"").decode()
        query_params = parse_qs(query_string)
        token = query_params.get("token", [None])[0]

        if token:
            try:
                # Valider le token
                UntypedToken(token)
                jwt_auth = JWTAuthentication()
                validated_token = jwt_auth.get_validated_token(token)
                user = await self.get_user_from_token(validated_token)
                scope["user"] = user
            except (InvalidToken, TokenError, Exception) as e:
                scope["user"] = AnonymousUser()
        else:
            scope["user"] = AnonymousUser()

        return await super().__call__(scope, receive, send)

    @database_sync_to_async
    def get_user_from_token(self, validated_token):
        jwt_auth = JWTAuthentication()
        return jwt_auth.get_user(validated_token)


def JWTAuthMiddlewareStack(inner):
    return JWTAuthMiddleware(inner)

