from celery import shared_task
from django.utils import timezone
from .models import Auction
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
import logging

logger = logging.getLogger(__name__)

@shared_task
def close_expired_auctions():
    """
    Zadanie zamykające aukcje, których czas (end_date) minął.
    """
    now = timezone.now()
    expired_auctions = Auction.objects.filter(status='active', end_date__lte=now)
    
    closed_count = 0
    channel_layer = get_channel_layer()

    for auction in expired_auctions:
        auction.status = Auction.Status.ENDED
        auction.save()
        closed_count += 1

        try:
            async_to_sync(channel_layer.group_send)(
                f"auction_{auction.id}",
                {
                    "type": "auction_interrupted",
                    "data": {
                        "type": "auction_interrupted",
                        "reason": "time_ended",
                        "final_price": str(auction.current_price),
                        "winner": auction.winner.username if auction.winner else None
                    }
                }
            )
        except Exception as e:
            logger.error(f"Error sending socket for auction {auction.id}: {e}")

    if closed_count > 0:
        logger.info(f"Celery: Closed {closed_count} expired auctions.")
        
    return closed_count