
"""
Provides class(es) allowing for the real-time WebSocket-based communication.
For now there is only an auction consumer (i.e. user, the one experiencing) which
is provided data by core.asgi module. 

Provided by Whisper.
"""

from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.db import transaction
import json

from .services import process_bid_logic


class AuctionConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.auction_id = self.scope["url_route"]["kwargs"]["auction_id"]
        self.group_name = f"auction_{self.auction_id}"

        if self.scope["user"].is_anonymous:
            await self.close()
            return

        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )

        await self.accept()

        state = await self.get_state()
        await self.send(text_data=json.dumps(state))


    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )


    async def receive(self, text_data):
        data = json.loads(text_data)

        if data.get("type") == "place_bid":
            success, message, auction, _ = await database_sync_to_async(process_bid_logic)(
                self.scope["user"], self.auction_id, data.get("amount")
            )

            if success:
                await self.channel_layer.group_send(
                    self.group_name,
                    {
                        "type": "bid_update",
                        "data": {
                            "type": "bid_update",
                            "current_price": str(auction.current_price),
                            "bidder": self.scope["user"].username,
                            "auction_id": auction.id
                        }
                    }
                )
            else:
                error_response = message if isinstance(message, dict) else {"error": message}
                error_response["success"] = False
                await self.send(text_data=json.dumps(error_response))


    async def bid_update(self, event):
        await self.send(text_data=json.dumps(event["data"]))


    async def auction_interrupted(self, event):
        await self.send(text_data=json.dumps(event["data"]))


    @database_sync_to_async
    def place_bid(self, data):
        from .models import Auction, Bid

        with transaction.atomic():
            auction = Auction.objects.select_for_update().get(id=self.auction_id)

            if auction.status != "active":
                return {"success": False, "error": "Auction ended"}

            amount = data.get("amount")

            if amount < auction.current_price + auction.min_increment:
                return {"success": False, "error": "Bid too low"}

            auction.current_price = amount
            auction.save()

            Bid.objects.create(
                auction=auction,
                user=self.scope["user"],
                amount=amount
            )

            return {
                "success": True,
                "data": {
                    "type": "bid_update",
                    "current_price": float(amount),
                    "bidder": self.scope["user"].username
                }
            }


    @database_sync_to_async
    def get_state(self):
        from .models import Auction

        auction = Auction.objects.get(id=self.auction_id)

        return {
            "type": "initial_state",
            "current_price": float(auction.current_price),
            "status": auction.status
        }
