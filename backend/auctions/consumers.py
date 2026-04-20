
"""
Provides class(es) allowing for the real-time WebSocket-based communication.
For now there is only an auction consumer (i.e. user, the one experiencing) which
is provided data by core.asgi module. 

Provided by Whisper.
"""

from channels.generic.websocket import AsyncWebsocketConsumer
from json                       import loads


class AuctionConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        """
        Runs when connection opens.
        """
        await self.accept()

    async def disconnect(self, close_code):
        """
        Runs when connection closes.
        """
        pass

    async def receive(self, text_data):
        """
        Runs when a client sends some data to us.
        """
        data = loads(text_data)

        await self.send(text_data=json.dumps({
            "message":  "received",
            "data":     data
        }))

