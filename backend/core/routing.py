
"""
Literal routing (mapping) of websocket endpoints to 'consumers' i.e. connection
handlers, defined in auctions.consumers module.

Provided by Whisper.
"""

from auctions.consumers import AuctionConsumer
from django.urls        import path


websocket_urlpatterns = [
    path("ws/chat/", AuctionConsumer.as_asgi()),
]
