from decimal import Decimal, InvalidOperation
from django.db import transaction
from .models import Auction, Bid, CardbidUser, Notification
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
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
        
        previous_highest_bid = auction.bids.order_by('-amount').first()
        loser = None
        if previous_highest_bid and previous_highest_bid.user != user:
            loser = previous_highest_bid.user

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

        if loser:
            Notification.objects.create(
                user=loser,
                notification_type=Notification.Type.OUTBID,
                message=f"You were outbid on {auction.card.name}! Current price is {auction.current_price} PLN."
            )
        
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f"user_{loser.id}",
                {
                    "type": "notify",
                    "data": {
                        "type": "outbid_alert",
                        "auction_id": auction.id,
                        "message": f"You were outbid on {auction.card.name}! Current price is {auction.current_price} PLN."
                    }
                }
            )

        return True, "Bid accepted!", auction, total_cost
        


# =====================================================
# ESCROW / FUNDS
# =====================================================


class InsufficientFunds(Exception):
    pass


class InvalidFrozenFunds(Exception):
    pass


def lock_user(user):
    """
    pobiera ŚWIEŻĄ wersję użytkownika z bazy, jest to sposób pracy z instancją
    użytkownika zapobiegający race conditionsah.
    """
    return (
        user.__class__.objects
        .select_for_update()
        .get(pk=user.pk)
    )


@transaction.atomic
def freeze_funds(user, amount: Decimal):
    user = lock_user(user)

    if amount <= 0:
        raise ValueError("Amount musi byc liczba dodatnia")

    if user.balance < amount:
        raise InsufficientFunds()

    # Przenieś określoność dynamicznego salda do mrożonki (żeby zapobiegać licytacji
    # większej ilości hajsu niż sie ma).
    user.balance -= amount
    user.frozen_balance += amount

    user.save(update_fields=[
        "balance",
        "frozen_balance",
    ])

    return user


@transaction.atomic
def unfreeze_funds(user, amount: Decimal):
    user = lock_user(user)

    if amount <= 0:
        raise ValueError("Amount musi byc liczba dodatnia")

    if user.frozen_balance < amount:
        raise InvalidFrozenFunds()

    # Zwróć określoność zamrożonych środków do dynamicznego salda
    user.frozen_balance -= amount
    user.balance += amount

    user.save(update_fields=[
        "balance",
        "frozen_balance",
    ])

    return user
    

@transaction.atomic
def capture_funds(user, amount: Decimal):
    user = lock_user(user)

    if amount <= 0:
        raise ValueError("Amount musi byc liczba dodatnia")

    if user.frozen_balance < amount:
        raise InvalidFrozenFunds()

    # Zabierz środki z zamrożonego salda, bo wygrało się aukcję
    user.frozen_balance -= amount

    user.save(update_fields=[
        "frozen_balance",
    ])

    return user

