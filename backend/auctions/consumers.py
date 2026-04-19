
# Handles websocket connections

from channels.generic.websocket import AsyncWebsocketConsumer
import json

class AuctionConsumer(AsyncWebsocketConsumer):

    # Runs when websocket connects
    async def connect(self):
        await self.accept()

    # Runs when connection closes
    async def disconnect(self, close_code):
        pass

    # Runs when client sends a message to us
    async def receive(self, text_data):
        data = json.loads(text_data)

        await self.send(text_data=json.dumps({
            "message": "received",
            "data": data
        }))
        
    # There is also `send` method, which sends message back to client
