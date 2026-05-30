
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

import time

from .services import process_bid_logic

import asyncio


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

        self.heartbeat_task = asyncio.create_task(self.heartbeat())

    async def heartbeat(self):
        while True:
            await asyncio.sleep(5)
            try:
                await self.send(text_data=json.dumps({"type": "ping"}))
            except Exception:
                break

    async def disconnect(self, close_code):
        if hasattr(self, 'heartbeat_task'):
            self.heartbeat_task.cancel()
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )


    async def receive(self, text_data):
        data = json.loads(text_data)
        action_type = data.get('type')

        if action_type == "place_bid":
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


class StreamRoomConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_id = self.scope["url_route"]["kwargs"]["room_id"]
        self.group_name = f"room_{self.room_id}"

        self.last_message_time = 0

        if self.scope["user"].is_anonymous:
            await self.close()
            return

        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        await self.accept()

        self.heartbeat_task = asyncio.create_task(self.heartbeat())

    async def heartbeat(self):
        while True:
            await asyncio.sleep(5)
            try:
                await self.send(text_data=json.dumps({"type": "ping"}))
            except Exception:
                break

    async def disconnect(self, close_code):
        if hasattr(self, 'heartbeat_task'):
            self.heartbeat_task.cancel()

        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        action_type = data.get('type')

        if action_type == "place_bid":
            target_auction_id = data.get("auction_id")
            if not target_auction_id:
                await self.send(text_data=json.dumps({"success": False, "error": "Missing auction_id"}))
                return

            success, message, auction, _ = await database_sync_to_async(process_bid_logic)(
                self.scope["user"], target_auction_id, data.get("amount")
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

        elif action_type == "chat_message":
            # Anty-spam
            current_time = time.time()
            if current_time - self.last_message_time < 2.0:
                await self.send(text_data=json.dumps({
                    "type": "chat_error",
                    "message": "You are sending messages too quickly!"
                }))
                return 
            
            self.last_message_time = current_time

            message_text = data.get('message')
            if not message_text or len(message_text.strip()) == 0:
                return
            if len(message_text) > 200:
                message_text = message_text[:200] + "..."

            username = self.scope["user"].username if self.scope["user"].is_authenticated else "Anonymous"

            await self.channel_layer.group_send(
                self.group_name,
                {
                    "type": "chat_message_broadcast",
                    "data": {
                        "type": "chat_message",
                        "username": username,
                        "message": message_text
                    }
                }
            )

    async def bid_update(self, event):
        await self.send(text_data=json.dumps(event["data"]))

    async def auction_interrupted(self, event):
        await self.send(text_data=json.dumps(event["data"]))

    async def chat_message_broadcast(self, event):
        await self.send(text_data=json.dumps(event["data"]))

    async def slot_changed(self, event):
        await self.send(text_data=json.dumps(event["data"]))

    async def package_opened(self, event):
        await self.send(text_data=json.dumps(event["data"]))

class UserNotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        if self.scope["user"].is_anonymous:
            await self.close()
            return

        self.group_name = f"user_{self.scope['user'].id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        self.heartbeat_task = asyncio.create_task(self.heartbeat())

    async def heartbeat(self):
        while True:
            await asyncio.sleep(5)
            try:
                await self.send(text_data=json.dumps({"type": "ping"}))
            except Exception:
                break

    async def disconnect(self, close_code):
        if hasattr(self, 'heartbeat_task'):
            self.heartbeat_task.cancel()
        if not self.scope["user"].is_anonymous:
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def notify(self, event):
        await self.send(text_data=json.dumps(event["data"]))