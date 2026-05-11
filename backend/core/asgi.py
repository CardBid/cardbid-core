
import os
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

django_asgi_app = get_asgi_application()

from .middleware import JWTAuthMiddleware
from channels.routing import ProtocolTypeRouter, URLRouter
import auctions.routing

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": JWTAuthMiddleware(
        URLRouter(
            auctions.routing.websocket_urlpatterns
        )
    ),
})
