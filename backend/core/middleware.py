
from urllib.parse import parse_qs
from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from channels.db import database_sync_to_async

User = get_user_model()


class JWTAuthMiddleware:
    def __init__(self, app):
        self.app = app
        
    async def __call__(self, scope, receive, send):
        """
        scope   - who and what is connecting (JSON)
        receive - async function for getting incoming data (JSON as result)
        send    - async function for sending data to client (in JSON)
        """ 
        
        # Extract token
        query_string = scope.get("query_string", b"").decode()
        query_params = parse_qs(query_string)

        token = query_params.get("token")

        scope["user"] = AnonymousUser()

        if token:
            try:
                # Decode JWT to obtain user id
                access_token = AccessToken(token[0])
                user_id = access_token["user_id"]

                # Get user by the id, and attach it to the scope afterwards
                user = await self.get_user(user_id)
                scope["user"] = user

            except Exception:
                
                # In case of fallback, just pretend to be anonymous user
                scope["user"] = AnonymousUser()

        # In the end, pass control to the next ASGI layer, which now can work with
        # the websocket data translated by us above (user setting).
        return await self.app(scope, receive, send)

    @database_sync_to_async
    def get_user(self, user_id):
        return User.objects.get(id=user_id)
