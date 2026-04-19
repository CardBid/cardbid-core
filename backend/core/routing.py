
# = Web sockets routing

from django.urls import path
from auctions.consumers import AuctionConsumer

websocket_urlpatterns = [
    path("ws/chat/", AuctionConsumer.as_asgi()),
]
