"""
Middleware pour l'authentification GraphQL avec JWT
"""
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

User = get_user_model()


class GraphQLJWTMiddleware:
    """
    Middleware pour authentifier les requêtes GraphQL avec JWT
    """
    def resolve(self, next, root, info, **args):
        # Récupérer le token depuis les headers
        request = info.context
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        
        if auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            try:
                jwt_auth = JWTAuthentication()
                validated_token = jwt_auth.get_validated_token(token)
                user = jwt_auth.get_user(validated_token)
                request.user = user
            except (InvalidToken, TokenError):
                request.user = AnonymousUser()
        else:
            request.user = AnonymousUser()
        
        return next(root, info, **args)

