
from django.urls import re_path, path
from .consumers import AuctionConsumer, StreamRoomConsumer

websocket_urlpatterns = [
    re_path(r'ws/auction/(?P<auction_id>\d+)/$', AuctionConsumer.as_asgi()),

    path('ws/rooms/<int:room_id>/', StreamRoomConsumer.as_asgi()),
]
