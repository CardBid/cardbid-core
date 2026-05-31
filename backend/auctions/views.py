from decimal import Decimal
import random
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import generics, permissions, status, filters
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import AllowAny, IsAuthenticated

from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone

from .permissions import IsStreamer
from .models import Card, Category, Auction, CardbidUser, Country, State, Bid, AuctionSlot, StreamRoom, Review, Notification
from .serializers import (
    CardSerializer, CategorySerializer, AuctionSerializer, UserProfileSerializer,
    RegisterSerializer, BidSerializer, StreamRoomSerializer,
    StateSerializer, CountrySerializer, ReviewSerializer, NotificationSerializer
)

from django.db import transaction
from .utils import calculate_fees
from decimal import Decimal, InvalidOperation

from .services import process_bid_logic

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
import urllib.parse

# Konfiguracja stripa
from .models import Transaction
from django.conf import settings
from django.http import JsonResponse
from django.http import HttpResponse, HttpResponseForbidden
from django.views.decorators.csrf import csrf_exempt
from django.db.models import F
import json
import stripe
import traceback
stripe.api_key = settings.STRIPE_SECRET_KEY
endpoint_secret = settings.STRIPE_WEBHOOK_SECRET

# Do top-apuw
def create_payment(request):
    print("TOP-UP HIT")
    if request.method != "POST":
        return JsonResponse({"error": "POST only"}, status=405)

    body = json.loads(request.body)

    amount = body.get("amount")

    intent = stripe.PaymentIntent.create(
        amount=amount,
        currency="usd",
        automatic_payment_methods={
            "enabled": True,
            "allow_redirects": "never"  # żeby returnurl nie cza
        }
    )
    
    # Stwórz rekord transakcji w db
    Transaction.objects.create(
        user=request.user,
        amount=amount,
        trans_type=Transaction.Type.PAYMENT_IN,
        trans_status=Transaction.Status.PENDING,
        stripe_intent_id=intent.id
    )

    return JsonResponse({
        "clientSecret": intent.client_secret
    })

# Do przetwarzania dalszej top apuwki
@csrf_exempt
def stripe_webhook(request):
    print("WEBHOOK HIT")
    payload = request.body
    sig_header = request.META.get("HTTP_STRIPE_SIGNATURE")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, endpoint_secret
        )
    except ValueError as e:
        return HttpResponse(status=400)
    except stripe.error.SignatureVerificationError as e:
        print("Error webhook!")
        return HttpResponse(status=400)

    event_type = event["type"]

    if event_type == "checkout.session.completed":
        session = event["data"]["object"]
        
        session_id = session["id"]
        
        user_id = session["client_reference_id"]
        
        if not user_id:
            print("Webhook ignored: empty client_reference_id")
            return HttpResponse(status=200)

        # Kwota pobrana z sesji (w groszach, więc dzielimy)
        amount = Decimal(session["amount_total"]) / Decimal("100")

        try:
            with transaction.atomic():
                user = CardbidUser.objects.select_for_update().get(id=user_id)
                
                t = Transaction.objects.filter(stripe_intent_id=session_id).first()
                if t:
                    if t.trans_status == Transaction.Status.COMPLETED:
                        print("Webhook ignored: transaction already completed")
                        return HttpResponse(status=200) # Już dodano
                    t.trans_status = Transaction.Status.COMPLETED
                    t.save()
                else:
                    Transaction.objects.create(
                        user=user,
                        amount=amount,
                        trans_type=Transaction.Type.PAYMENT_IN,
                        trans_status=Transaction.Status.COMPLETED,
                        stripe_intent_id=session_id
                    )

                user.balance += amount
                user.save()

        except CardbidUser.DoesNotExist:
            print(f"WEBHOOK ERROR: User {user_id} does not exist!")
            return HttpResponse(status=400)
            
    
    return HttpResponse(status=200)


def broadcast_auction_interrupted(auction):
    channel_layer = get_channel_layer()

    async_to_sync(channel_layer.group_send)(
        f"auction_{auction.id}",
        {
            "type": "auction_interrupted",
            "data": {
                "type": "auction_interrupted",
                "reason": "buy_now",
                "final_price": str(auction.current_price),
                "winner": auction.winner.username if auction.winner else None
            }
        }
    )


PSA_CARDS = [
    "Charizard", "Blastoise", "Venusaur", "Pikachu",
    "Mewtwo", "Mew", "Gengar", "Alakazam",
]

PSA_SETS = [
    "Base Set", "Jungle", "Fossil",
    "Team Rocket", "Neo Genesis", "Neo Discovery",
]

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        token['role'] = user.role
        token['username'] = user.username
        
        return token

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

TokenObtainPairView = MyTokenObtainPairView

class StreamerTestView(APIView):
    permission_classes = [IsStreamer]

    def get(self, request):
        return Response({"message": f"Hello {request.user.username}! You have streamer privileges."})


class PSAVerifyView(APIView):
    """
    Mock serwisu PSA do weryfikacji autentyczności kart.
    Endpoint: GET /api/v1/psa-verify/?cert_number=<numer>

    Walidacja: numer musi składać się dokładnie z 8 cyfr.
    - Poprawny numer → 200 OK z danymi karty
    - Niepoprawny numer → 404 Not Found
    """
    permission_classes = [AllowAny]

    def get(self, request):
        cert_number = request.query_params.get("cert_number", "").strip()

        if not cert_number.isdigit() or len(cert_number) != 8:
            return Response(
                {
                    "error": "Certificate not found.",
                    "detail": "cert_number must be exactly 8 digits.",
                    "cert_number": cert_number,
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        random.seed(int(cert_number))

        return Response(
            {
                "cert_number": cert_number,
                "card_name": random.choice(PSA_CARDS),
                "set_name": random.choice(PSA_SETS),
                "year": random.randint(1996, 2003),
                "grade": random.randint(1, 10),
                "population_count": random.randint(1, 500),
                "status": "verified",
            },
            status=status.HTTP_200_OK,
        )

class AuctionLiveDataView(APIView):
    """
    return data about auction to frontend
    Endpoint: GET /api/v1/auctions/{id}/live-data/
    """
    permission_classes = [AllowAny]

    def get(self, request, pk):
        auction = get_object_or_404(Auction, pk=pk)
        card = auction.card

        
        card_data = {
            "name": card.name,
            "description": card.description,
            "certificate_number": card.certificate_number,
            "grade": card.grade,
            "image_url": request.build_absolute_uri(card.image.url) if card.image else None,
        }

       
        auction_data = {
            "auction_type": auction.auction_type,
            "starting_price": auction.starting_price,
            "current_price": auction.current_price,
            "min_bid_increment": round(auction.current_price * Decimal("0.05"), 2) if auction.current_price else None,
            "buy_now_price": auction.buy_now_price,
            "status": auction.status,
            "start_date": auction.start_date,
            "end_date": auction.end_date,
        }

     
        last_bids = auction.bids.select_related("user").order_by("-created_at")[:5]
        bids_data = [
            {
                "username": bid.user.username,
                "amount": bid.amount,
                "placed_at": bid.created_at,
            }
            for bid in last_bids
        ]

      
        try:
            current_slot = auction.auctionslot
            next_slots = AuctionSlot.objects.filter(
                room=current_slot.room,
                status=AuctionSlot.Status.PENDING,
                order__gt=current_slot.order,
            ).select_related("auction__card").order_by("order")[:3]

            slots_data = [
                {
                    "order": slot.order,
                    "card_name": slot.auction.card.name,
                    "card_grade": slot.auction.card.grade,
                    "starting_price": slot.auction.starting_price,
                }
                for slot in next_slots
            ]
        except AuctionSlot.DoesNotExist:
            slots_data = []

        return Response({
            "card": card_data,
            "auction": auction_data,
            "last_bids": bids_data,
            "upcoming_slots": slots_data,
        }, status=status.HTTP_200_OK)

class TaxCalculatorView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            amount = Decimal(request.query_params.get('amount', 0))
            fees = calculate_fees(amount, request.user)
            return Response(fees)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

class TopUpBalanceView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            data = request.data
            if isinstance(data, str):
                data = json.loads(data)
            
            amount = float(data.get('amount', 0))
            
            if amount < 5.00:
                return Response({"error": "Amount must be at least $5.00."}, status=400)

            session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[{
                    'price_data': {
                        'currency': 'usd',
                        'product_data': {
                            'name': 'CardBid Balance Top-up',
                            'description': f'Top-up for {request.user.username}'
                        },
                        'unit_amount': int(amount * 100),
                    },
                    'quantity': 1,
                }],
                mode='payment',
                client_reference_id=str(request.user.id),
                success_url='https://cardbid-core.vercel.app/account?topup=success',
                cancel_url='https://cardbid-core.vercel.app/top-up?topup=cancelled',
            )
            
            return Response({"url": session.url})

        except Exception as e:
            print(f"🔥 Stripe error: {e}") 
            return Response({"error": f"Payment error: {str(e)}"}, status=500)

class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

class CardListCreateView(generics.ListCreateAPIView):
    serializer_class = CardSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Card.objects.filter(id__in=self.request.user.auctions_selling.values_list('card_id', flat=True)) | Card.objects.all() 
    
    def perform_create(self, serializer):
        serializer.save()

class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]

class AuctionListCreateView(generics.ListCreateAPIView):
    serializer_class = AuctionSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['card__name', 'card__certificate_number', 'card__category__name']
    ordering_fields = ['end_date', 'current_price']

    def get_queryset(self):
        queryset = Auction.objects.filter(status=Auction.Status.ACTIVE).select_related('card', 'card__category')

        category_id = self.request.query_params.get('category')
        if category_id and category_id != 'all':
            queryset = queryset.filter(card__category_id=category_id)
            
        return queryset

    def perform_create(self, serializer):
        serializer.save(seller=self.request.user)

class AuctionDetailView(generics.RetrieveAPIView):
    queryset = Auction.objects.all()
    serializer_class = AuctionSerializer

class PlaceBidView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        auction = get_object_or_404(Auction, pk=pk)

        if auction.seller == request.user:
            return Response(
                {"error": "You cannot bid on your own auction."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        success, message, auction, total_cost = process_bid_logic(
            request.user, pk, request.data.get('amount')
        )

        if not success:
            if isinstance(message, dict):
                return Response(message, status=status.HTTP_400_BAD_REQUEST)
            return Response({"error": message}, status=status.HTTP_400_BAD_REQUEST)
        
        channel_layer = get_channel_layer()

        if hasattr(auction, 'room') and auction.room:
            async_to_sync(channel_layer.group_send)(
                f"room_{auction.room.id}",
                {
                    "type": "bid_update",
                    "data": {
                        "type": "bid_update",
                        "current_price": str(auction.current_price),
                        "bidder": request.user.username,
                        "auction_id": auction.id
                    }
                }
            )

        async_to_sync(channel_layer.group_send)(
            f"auction_{auction.id}",
            {
                "type": "bid_update",
                "data": {
                    "type": "bid_update",
                    "current_price": str(auction.current_price),
                    "bidder": request.user.username,
                    "auction_id": auction.id
                }
            }
        )

        return Response({
            "message": message,
            "new_price": auction.current_price,
            "total_cost_with_tax": total_cost
        }, status=status.HTTP_201_CREATED)

class RegisterView(generics.CreateAPIView):
    queryset = CardbidUser.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response({
            "message": "User registered successfully.",
            "user": {
                "username": user.username,
                "email": user.email,
                "role": user.role
            }
        }, status=status.HTTP_201_CREATED)

class UserInventoryView(generics.ListAPIView):
    serializer_class = AuctionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Auction.objects.filter(winner=self.request.user, status=Auction.Status.ENDED)

class UserActiveBidsView(generics.ListAPIView):
    """
    Zwraca listę aukcji, w których zalogowany użytkownik jest AKTUALNYM liderem
    (wygrywa), a aukcja jest nadal AKTYWNA.
    """
    serializer_class = AuctionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Auction.objects.filter(
            winner=self.request.user, 
            status=Auction.Status.ACTIVE
        ).order_by('end_date')

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"message": "Logout successful."}, status=status.HTTP_205_RESET_CONTENT)
        except Exception as e:
            return Response({"error": "Invalid or expired token."}, status=status.HTTP_400_BAD_REQUEST)

class AuctionBidHistoryView(generics.ListAPIView):
    serializer_class = BidSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return Bid.objects.filter(auction_id=self.kwargs['pk'])

class LiveRoomsListView(generics.ListAPIView):
    serializer_class = StreamRoomSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return StreamRoom.objects.all()

class StreamRoomToggleView(APIView):
    permission_classes = [IsAuthenticated, IsStreamer]

    def post(self, request):
        room, created = StreamRoom.objects.get_or_create(
            streamer=request.user,
            defaults={'title': f"Room {request.user.username}"}
        )
        
        is_live = request.data.get('is_live', True)
        room.is_live = is_live
        
        if 'title' in request.data:
            room.title = request.data['title']
            
        room.save()
        
        status_msg = "Live now!" if is_live else "Live ended."
        return Response({"message": status_msg, "room": StreamRoomSerializer(room).data})

class CountryListView(generics.ListAPIView):
    queryset = Country.objects.prefetch_related('states').all()
    serializer_class = CountrySerializer
    permission_classes = [AllowAny]
    pagination_class = None


class BuyNowView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            auction_to_broadcast = None

            with transaction.atomic():
                try:
                    auction = Auction.objects.select_for_update().get(pk=pk)

                    if auction.seller == request.user:
                        return Response(
                            {"error": "You cannot buy your own auction."}, 
                            status=status.HTTP_400_BAD_REQUEST
                        )

                    if auction.status != "active":
                        return Response({"error": "Auction not active."}, status=404)
                except Auction.DoesNotExist:
                    return Response({"error": "Auction not active."}, status=404)

                if not auction.buy_now_price:
                    return Response({"error": "Buy now not available"}, status=400)

                fees = calculate_fees(auction.buy_now_price, request.user)
                total_cost = fees['total_cost']

                user_locked = CardbidUser.objects.select_for_update().get(id=request.user.id)

                if user_locked.balance < total_cost:
                    return Response({
                        "error": "Insufficient funds.",
                        "required_total": float(total_cost),
                        "current_balance": float(user_locked.balance)
                    }, status=400)

                user_locked.balance -= total_cost
                user_locked.save()

                auction.status = Auction.Status.ENDED
                auction.end_date = timezone.now()
                auction.winner = user_locked
                auction.current_price = auction.buy_now_price
                auction.save()

                auction_to_broadcast = auction

            if auction_to_broadcast:
                    broadcast_auction_interrupted(auction_to_broadcast)

            return Response({
                "message": "Item bought instantly!",
                "price": auction.buy_now_price,
                "total_cost_with_tax": total_cost
            }, status=200)

        except Exception as e:
            return Response({"error": str(e)}, status=400)


class RoomTimelineView(APIView):
    """
    Endpoint: GET /api/v1/rooms/<int:room_id>/timeline/
    Zwraca harmonogram licytacji dla konkretnego pokoju, podzielony na 4 sekcje.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, room_id):
        slots = AuctionSlot.objects.filter(room_id=room_id).select_related(
            'auction', 'auction__card', 'auction__winner'
        ).order_by('order')

        timeline = {
            "opened": [],
            "waiting_to_open": [],
            "current": None,
            "queue": []
        }

        for slot in slots:
            auction = slot.auction
            
            slot_data = {
                "slot_id": slot.id,
                "order": slot.order,
                "auction_id": auction.id,
                "card_name": auction.card.name,
                "price": float(auction.current_price),
                "winner": auction.winner.username if auction.winner else None,
                # "image_url": request.build_absolute_uri(auction.card.image.url) if auction.card.image else None,
            }

            
            if auction.status == Auction.Status.ENDED:
                if getattr(slot, 'is_opened', False): 
                    timeline["opened"].append(slot_data)
                else:
                    timeline["waiting_to_open"].append(slot_data)
                    
            elif auction.status == Auction.Status.ACTIVE and slot.status == getattr(AuctionSlot.Status, 'ACTIVE', 'active'):
                timeline["current"] = slot_data
                
            else:
                timeline["queue"].append(slot_data)

        return Response(timeline, status=status.HTTP_200_OK)

class SlotOpenView(APIView):
    """
    Endpoint: POST /api/v1/slots/<int:slot_id>/open/
    Streamer klika to, gdy fizycznie rozerwie paczkę na wizji.
    """

    permission_classes = [IsAuthenticated] 

    def post(self, request, slot_id):
        slot = get_object_or_404(AuctionSlot, id=slot_id)

        if slot.room.streamer != request.user:
            return Response({"error": "This is not your stream!"}, status=status.HTTP_403_FORBIDDEN)

        if slot.auction.status != Auction.Status.ENDED:
            return Response(
                {"error": "You cannot open a card that has not been sold yet (status must be ENDED)."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        if slot.is_opened:
            return Response(
                {"error": "This package has already been opened!"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        slot.is_opened = True
        slot.save()

        try:
            channel_layer = get_channel_layer()
            room_group_name = f"room_{slot.room.id}"
            
            async_to_sync(channel_layer.group_send)(
                room_group_name,
                {
                    "type": "package_opened",
                    "data": {
                        "event": "package_opened",
                        "slot_id": slot.id,
                        "card_name": slot.auction.card.name
                    }
                }
            )
        except Exception as ws_error:
            print(f"Error with WS (package_opened): {ws_error}")

        return Response({
            "message": "Package opened successfully!", 
            "slot_id": slot.id,
            "card_name": slot.auction.card.name
        }, status=status.HTTP_200_OK)

class UserBalanceView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = CardbidUser.objects.get(pk=request.user.pk)
        return Response({
            "balance": user.balance + user.frozen_balance, 
            "frozen_balance": user.frozen_balance,
            "available_balance": user.balance
        })

class CreateAuctionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        data = request.data
        user = request.user

        try:
            category = Category.objects.get(id=data.get('category_id'))

            card = Card.objects.create(
                name=data.get('card_name'),
                description=data.get('description', ''),
                category=category,
                grade=data.get('grade', 'Raw'),
                certificate_number=data.get('certificate_number', ''),
                image=request.FILES.get('image')
            )

            start_date_str = data.get('start_date')
            start_date = timezone.now()
            if start_date_str:
                start_date = timezone.datetime.fromisoformat(start_date_str)

            end_date_str = data.get('end_date')
            if end_date_str:
                end_date = timezone.datetime.fromisoformat(end_date_str)
            else:
                end_date = start_date + timezone.timedelta(days=7)

            auction = Auction.objects.create(
                seller=user,
                card=card,
                auction_type=data.get('auction_type', 'bidding'),
                starting_price=Decimal(data.get('starting_price')) if data.get('starting_price') else None,
                buy_now_price=Decimal(data.get('buy_now_price')) if data.get('buy_now_price') else None,
                status=Auction.Status.ACTIVE if start_date <= timezone.now() else Auction.Status.PENDING,
                start_date=start_date,
                end_date=end_date
            )

            return Response({
                "message": "Auction created successfully!",
                "auction_id": auction.id,
                "start_date": auction.start_date,
                "end_date": auction.end_date,
                "status": auction.status
            }, status=status.HTTP_201_CREATED)

        except Category.DoesNotExist:
            return Response({"error": "The specified category does not exist."}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
class UserSettingsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            "first_name": user.first_name,
            "last_name": user.last_name,
            "shipping_address": user.shipping_address,
            "country_code": user.country.code if user.country else None,
            "state_code": user.state.code if user.state else None,
        })

    def patch(self, request):
        user = request.user
        data = request.data

        if 'shipping_address' in data:
            user.shipping_address = data['shipping_address']
        if 'country_id' in data:
            user.country_id = data['country_id']
        if 'state_id' in data:
            user.state_id = data['state_id']
            
        if 'username' in data:
            new_username = data['username']
            if CardbidUser.objects.filter(username=new_username).exclude(id=user.id).exists():
                return Response({"error": "Username is already taken."}, status=400)
            user.username = new_username

        try:
            user.save()
            return Response({"message": "Settings have been saved.", "username": user.username})
        except Exception as e:
            return Response({"error": str(e)}, status=400)

class ActivateSlotView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, slot_id):
        user = request.user

        slot = get_object_or_404(AuctionSlot, id=slot_id)

        if slot.status == 'active':
            return Response({"error": "This slot is already activated!"}, status=400)
        if slot.status == 'finished':
            return Response({"error": "This slot has already been finished and opened!"}, status=400)

        if slot.room.streamer != user:
            return Response({"error": "This is not your stream!"}, status=status.HTTP_403_FORBIDDEN)

        active_slots = AuctionSlot.objects.filter(room=slot.room, status='active')
        for old_slot in active_slots:
            old_slot.status = 'finished'
            old_slot.save()
            
            old_auction = old_slot.auction
            old_auction.status = 'ended'
            old_auction.end_date = timezone.now()
            old_auction.save()

        slot.status = 'active'
        slot.save()

        current_auction = slot.auction
        current_auction.status = 'active'
        current_auction.start_date = timezone.now()
        current_auction.save()

        try:
            channel_layer = get_channel_layer()
            room_group_name = f"room_{slot.room.id}" 
            
            async_to_sync(channel_layer.group_send)(
                room_group_name,
                {
                    "type": "slot_changed",
                    "data": {
                        "event": "slot_changed",
                        "active_slot_id": slot.id,
                        "auction_id": current_auction.id,
                        "card_name": current_auction.card.name
                    }
                }
            )
        except Exception as ws_error:
            print(f"Cannot send WebSocket notification: {ws_error}")

        return Response({
            "message": f"Slot {slot.order} (Auction {current_auction.id}) is now active!",
            "start_date": current_auction.start_date
        })

class ReviewCreateView(generics.CreateAPIView):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(buyer=self.request.user)

class SellerReviewsView(generics.ListAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        seller_id = self.kwargs['seller_id']
        return Review.objects.filter(seller_id=seller_id).order_by('-created_at')

class UserNotificationsView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')

class MarkNotificationReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            notif = Notification.objects.get(pk=pk, user=request.user)
            notif.is_read = True
            notif.save()
            return Response({"message": "Notification marked as read."})
        except Notification.DoesNotExist:
            return Response({"error": "Notification not found."}, status=404)
        
class UserSellingAuctionsView(generics.ListAPIView):
    """Pobiera wszystkie aukcje, które wystawił zalogowany użytkownik"""
    serializer_class = AuctionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Auction.objects.filter(seller=self.request.user).order_by('-start_date')

class UserAuctionManageView(APIView):
    """Zarządzanie własną aukcją (Edycja / Usuwanie)"""
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        auction = get_object_or_404(Auction, pk=pk, seller=request.user)
        
        if auction.status == Auction.Status.ENDED:
            return Response({"error": "You cannot delete an ended auction."}, status=status.HTTP_400_BAD_REQUEST)
        
        if auction.bids.exists():
            return Response({"error": "You cannot delete an auction that already has bids. You must sell it to the highest bidder."}, status=status.HTTP_400_BAD_REQUEST)
        
        card = auction.card
        auction.delete()
        card.delete()
        return Response({"message": "Auction deleted successfully."})

    def patch(self, request, pk):
        auction = get_object_or_404(Auction, pk=pk, seller=request.user)
        
        if auction.status == Auction.Status.ENDED:
            return Response({"error": "You cannot edit an ended auction."}, status=status.HTTP_400_BAD_REQUEST)

        data = request.data
        card = auction.card
        has_bids = auction.bids.exists()
        
        if 'card_name' in data: 
            card.name = data['card_name']
        if 'description' in data: 
            card.description = data['description']
        card.save()

        if 'start_date' in data and data['start_date']:
            new_start = timezone.datetime.fromisoformat(data['start_date'].replace('Z', '+00:00'))
            
            if auction.start_date <= timezone.now() and new_start != auction.start_date:
                return Response({"error": "You cannot change the start date because the auction has already started."}, status=status.HTTP_400_BAD_REQUEST)
            auction.start_date = new_start

        if 'end_date' in data and data['end_date']:
            auction.end_date = timezone.datetime.fromisoformat(data['end_date'].replace('Z', '+00:00'))

        if 'starting_price' in data and data['starting_price']:
            new_starting_price = Decimal(str(data['starting_price']))
            
            if has_bids and new_starting_price != auction.starting_price:
                return Response({"error": "Cannot change starting price after someone has already placed a bid."}, status=status.HTTP_400_BAD_REQUEST)
            elif not has_bids:
                auction.starting_price = new_starting_price
                auction.current_price = new_starting_price

        if 'buy_now_price' in data and data['buy_now_price']: 
            auction.buy_now_price = Decimal(str(data['buy_now_price']))
            
        auction.save()
        return Response({"message": "Auction updated successfully."})
    
@csrf_exempt
def stream_start(request):
    """Webhook wywoływany przez MediaMTX przy próbie połączenia z OBS"""
    if request.method == 'POST':
        room_id = request.POST.get('room_id')
        query = request.POST.get('query', '')

        parsed_query = urllib.parse.parse_qs(query)
        stream_key = parsed_query.get('key', [None])[0]

        if not stream_key or not room_id:
            return HttpResponseForbidden("Missing stream key or room ID")

        try:
            room = StreamRoom.objects.get(id=room_id, stream_key=stream_key)
            room.is_live = True
            room.save()
            return HttpResponse("OK", status=200)
        except StreamRoom.DoesNotExist:
            return HttpResponseForbidden("Invalid stream key or room")
            
    return HttpResponseForbidden("POST only")

@csrf_exempt
def stream_stop(request):
    """Webhook wywoływany przez MediaMTX po wyłączeniu OBS"""
    if request.method == 'POST':
        room_id = request.POST.get('room_id')
        if room_id:
            StreamRoom.objects.filter(id=room_id).update(is_live=False)
    return HttpResponse("OK", status=200)