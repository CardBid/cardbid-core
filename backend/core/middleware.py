
"""
Gives classes for implementing 'translation' layers for things that django does not
natively support.

Provided by Whisper.
"""

from channels.db                        import database_sync_to_async
from django.contrib.auth                import get_user_model
from django.contrib.auth.models         import AnonymousUser
from urllib.parse                       import parse_qs
from rest_framework_simplejwt.tokens    import AccessToken


User = get_user_model()

class JWTAuthMiddleware:
    
    def __init__(self, app):
        self.app = app
        
    async def __call__(self, scope, receive, send):
        """
        Acquires user for django by parsing JWT token, parameters description:
        - scope     - who is connecting (as JSON)
        - receive   - async function for getting incoming data (as JSON)
        - send      - async function for sending data to client (in JSON)
        """ 
        
        # Extract JWT token
        query_string    = scope.get("query_string", b"").decode()
        query_params    = parse_qs(query_string)
        token           = query_params.get("token")

        scope["user"] = AnonymousUser()

        if token:
            try:
                # Decode JWT token to obtain user id
                access_token    = AccessToken(token[0])
                user_id         = access_token["user_id"]

                # Find user by obtained id, and assign it for django afterwards
                user            = await self.get_user(user_id)
                scope["user"]   = user

            except Exception:
                # In case of fallback, continue as anonymous user ...
                pass

        # Pass the control to django, which can now work with the retrieved user
        return await self.app(scope, receive, send)

    @database_sync_to_async
    def get_user(self, user_id):
        return User.objects.get(id=user_id)

