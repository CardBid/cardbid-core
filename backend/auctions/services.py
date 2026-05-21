from decimal import Decimal, InvalidOperation
from django.db import transaction
from .models import Auction, Bid, CardbidUser
from .utils import calculate_fees

def process_bid_logic(user, auction_id, amount_raw):
    """
    Wspólna logika licytacji dla REST API i WebSocketów.
    """
    with transaction.atomic():
        try:
            auction = Auction.objects.select_for_update().get(pk=auction_id)
        except Auction.DoesNotExist:
            return False, "Auction does not exist or is closed.", None, None

        if auction.status != "active":
            return False, "Auction ended", None, None

        if amount_raw is None:
            return False, "Amount is required.", None, None

        try:
            bid_amount = Decimal(str(amount_raw))
        except (TypeError, ValueError, InvalidOperation):
            return False, "Invalid bid amount format.", None, None

        if bid_amount < auction.current_price + auction.min_increment:
            return False, f"You must bid at least {auction.min_increment} higher than current price", None, None

        fees = calculate_fees(bid_amount, user)
        total_cost = fees['total_cost']

        if user.balance < total_cost:
            return False, {
                "error": "Insufficient funds in account (including taxes and duties).",
                "required_total": float(total_cost),
                "current_balance": float(user.balance)
            }, None, None

        previous_winner = auction.winner
        previous_price = auction.current_price

        if previous_winner and previous_winner.id != user.id:
            prev_user_locked = CardbidUser.objects.select_for_update().get(id=previous_winner.id)

            previous_fees = calculate_fees(previous_price, prev_user_locked)
            refund_amount = previous_fees['total_cost']

            prev_user_locked.balance += refund_amount
            prev_user_locked.save()

        user_locked = CardbidUser.objects.select_for_update().get(id=user.id)
        user_locked.balance -= total_cost
        user_locked.save()

        Bid.objects.create(
            auction=auction,
            user=user_locked,
            amount=bid_amount
        )

        auction.current_price = bid_amount
        auction.winner = user_locked
        auction.save()

        return True, "Bid accepted!", auction, total_cost