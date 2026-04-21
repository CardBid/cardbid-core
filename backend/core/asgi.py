
"""
General request (HTTP, WebSocket, etc.) procesor.

Provided by Whisper.
"""

from django.core.asgi   import get_asgi_application
import os


os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")

django_asgi_app = get_asgi_application()

from channels.auth      import AuthMiddlewareStack
from channels.routing   import ProtocolTypeRouter, URLRouter
from core.middleware    import JWTAuthMiddleware
from core.routing       import websocket_urlpatterns

application = ProtocolTypeRouter({

    # HTTP requests does not need any special care. It eventually ends up in some
    # controller from auctions.views module.
    "http":         django_asgi_app,
    
    # Django does not know how to handle JWT web socket connection by default,
    # so we provide our 'middleware' that makes the data django-like (includes user).
    # It eventually ends up inside some controller from auctions.consumers module.
    "websocket":    JWTAuthMiddleware(
        AuthMiddlewareStack(
            URLRouter(websocket_urlpatterns)
        )
    ),
})
