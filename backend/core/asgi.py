"""
ASGI config for core project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/6.0/howto/deployment/asgi/
"""

import os

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack

from core.middleware import JWTAuthMiddleware
from core.routing import websocket_urlpatterns

# Tell where are the settings (settings.py file)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

application = ProtocolTypeRouter({
    # Route http to application, nothing fancy
    "http": get_asgi_application(),
    # Route web sockets to JWT middleware, which will process them. Normally django
    # does not know how to handle such web sockets, so we do it with our own script
    "websocket": JWTAuthMiddleware(
        AuthMiddlewareStack(
            URLRouter(websocket_urlpatterns)
        )
    ),
})
