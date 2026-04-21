
"""
Provides class(es) allowing for the real-time WebSocket-based communication.
For now there is only an auction consumer (i.e. user, the one experiencing) which
is provided data by core.asgi module. 

Provided by Whisper.
"""

from channels.generic.websocket import AsyncWebsocketConsumer
import json


class AuctionConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.auction_id = self.scope["url_route"]["kwargs"]["auction_id"]
        self.group_name = f"auction_{self.auction_id}"

        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        """
        Gdy otrzymamy wiadomość (np. nowy bid) od klienta
        """
        data = json.loads(text_data)

        await self.channel_layer.group_send(
            self.group_name,
            {
                "type": "auction.message",
                "message": data.get("message", "Brak treści"),
                "data": data
            }
        )

    async def auction_message(self, event):
        """
        Ta metoda wysyła dane do konkretnego klienta przez WebSocket
        """
        await self.send(text_data=json.dumps({
            "message": event["message"],
            "data": event.get("data", {})
        }))