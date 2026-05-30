from decimal import Decimal, InvalidOperation
from django.db import transaction
from .models import Auction, Bid, CardbidUser, Notification
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .utils import calculate_fees

def process_bid_logic(user, auction_id, amount_raw):
    with transaction.atomic():
        auction = Auction.objects.select_for_update().get(pk=auction_id)
        
        if auction.status != "active":
            return False, "Auction ended", None, None

        try:
            bid_amount = Decimal(str(amount_raw))
        except (TypeError, ValueError, InvalidOperation):
            return False, "Invalid bid amount.", None, None

        if bid_amount < auction.current_price + auction.min_increment:
            return False, "Bid too low.", None, None

        fees = calculate_fees(bid_amount, user)
        total_cost = fees['total_cost']

        if user.balance < total_cost:
            return False, {
                "error": "Insufficient funds in account (including taxes and duties).",
                "required_total": float(total_cost),
                "current_balance": float(user.balance)
            }, None, None

        user_locked = lock_user(user)

        previous_winner = auction.winner
        previous_price = auction.current_price

        try:
            if previous_winner and previous_winner.id == user_locked.id:
                additional_needed = total_cost - user_locked.frozen_balance
                if additional_needed > 0:
                    freeze_funds(user_locked, additional_needed)
            
            else:
                if previous_winner:
                    prev_winner_locked = lock_user(previous_winner)
                    prev_fees = calculate_fees(previous_price, prev_winner_locked)
                    refund_amount = prev_fees['total_cost'].quantize(Decimal('0.01'))
                    unfreeze_funds(prev_winner_locked, refund_amount)
                
                freeze_funds(user_locked, total_cost)

        except (InsufficientFunds, InvalidFrozenFunds) as e:
            return False, {"error": "Funds error: " + str(e)}, None, None

        Bid.objects.create(auction=auction, user=user_locked, amount=bid_amount)
        auction.current_price = bid_amount
        auction.winner = user_locked
        auction.save()

        return True, "Bid accepted!", auction, total_cost


def lock_user(user):
    return user.__class__.objects.select_for_update().get(pk=user.pk)

def freeze_funds(user, amount):
    if amount <= 0: raise ValueError("Amount > 0")
    if user.balance < amount: raise InsufficientFunds()
    user.balance -= amount
    user.frozen_balance += amount
    user.save(update_fields=["balance", "frozen_balance"])
    return user

def unfreeze_funds(user, amount):
    if amount <= 0: raise ValueError("Amount > 0")
    if user.frozen_balance < amount: raise InvalidFrozenFunds()
    user.frozen_balance -= amount
    user.balance += amount
    user.save(update_fields=["balance", "frozen_balance"])
    return user