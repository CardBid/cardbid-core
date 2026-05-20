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
from .models import Card, Category, Auction, CardbidUser, Country, State, Bid, AuctionSlot
from .serializers import (
    CardSerializer, CategorySerializer, AuctionSerializer, UserProfileSerializer,
    RegisterSerializer, BidSerializer, StreamRoomSerializer,
    StateSerializer, CountrySerializer
)

from django.db import transaction
from .utils import calculate_fees
from decimal import Decimal, InvalidOperation

from .services import process_bid_logic

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

# Konfiguracja stripa
from .models import Transaction
from django.conf import settings
from django.http import JsonResponse
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.db.models import F
import json
import stripe
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
        currency="pln",
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
    sig_header = request.META["HTTP_STRIPE_SIGNATURE"]

    # Weryfikuj też sygnaturę dla bezpieczeństwa
    try:
        event = stripe.Webhook.construct_event(
            payload,
            sig_header,
            endpoint_secret
        )

    except Exception as e:
        print("🔥 WEBHOOK CRASH:", e)
        traceback.print_exc()
        return HttpResponse(status=500)

    event_type = event["type"]

    # PAYMENT SUCCESS
    if event_type == "payment_intent.succeeded":

        payment_intent = event["data"]["object"]

        intent_id = payment_intent["id"]

        try:
            with transaction.atomic():

                t = Transaction.objects.select_for_update().get(
                    stripe_intent_id=intent_id
                )

                # zabezpieczenie przed podwójnym webhookiem
                if t.trans_status == Transaction.Status.COMPLETED:
                    return HttpResponse(status=200)

                t.trans_status = Transaction.Status.COMPLETED
                t.save()

                # Stripe zwraca w najmniejszych jednostkach waluty, zatem trzeba
                # np. w groszach zdzielić na 100 żeby mieć w oryginalnej walucie (zł np.)
                amount = Decimal(payment_intent["amount"]) / Decimal("100")

                user = t.user

                # Funkcja F zabezpiecza przed race conditions w db przy czytaniu
                # wartości odrazu zmienianej.
                CardbidUser.objects.filter(id=user.id).update(
                    balance=F("balance") + amount
                )

        except Transaction.DoesNotExist:
            print("NO TRANSACTION FOR INTENT:", intent_id)
            return HttpResponse(status=500)

    # PAYMENT FAILED
    elif event_type == "payment_intent.payment_failed":

        payment_intent = event["data"]["object"]

        intent_id = payment_intent["id"]

        try:
            t = Transaction.objects.get(
                stripe_intent_id=intent_id
            )

            t.trans_status = Transaction.Status.FAILED
            t.save()

        except Transaction.DoesNotExist:
            pass

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
        return Response({"message": f"Witaj {request.user.username}! Masz uprawnienia streamera."})


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
        amount_str = request.data.get('amount')
        if not amount_str:
            return Response({"error": "Please provide 'amount'"}, status=400)
            
        try:
            amount = Decimal(str(amount_str))
            user = request.user
            user.balance += amount
            user.save()
            return Response({
                "message": f"Account topped up by {amount}",
                "new_balance": user.balance
            })
        except Exception as e:
            return Response({"error": "Invalid amount"}, status=400)

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
    queryset = Auction.objects.filter(status=Auction.Status.ACTIVE)
    serializer_class = AuctionSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    
    search_fields = ['card__name', 'card__certificate_number', 'card__category__name']
    
    ordering_fields = ['end_date', 'current_price']

    def perform_create(self, serializer):
        serializer.save(seller=self.request.user)

class AuctionDetailView(generics.RetrieveAPIView):
    queryset = Auction.objects.all()
    serializer_class = AuctionSerializer

class PlaceBidView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        success, message, auction, total_cost = process_bid_logic(
            request.user, pk, request.data.get('amount')
        )

        if not success:
            if isinstance(message, dict):
                return Response(message, status=status.HTTP_400_BAD_REQUEST)
            return Response({"error": message}, status=status.HTTP_400_BAD_REQUEST)

        channel_layer = get_channel_layer()
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
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Auction.objects.filter(winner=self.request.user, status=Auction.Status.ACTIVE)

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
        return StreamRoom.objects.filter(is_live=True)

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
    queryset = Country.objects.all()
    serializer_class = CountrySerializer
    permission_classes = [AllowAny]


class BuyNowView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            auction_to_broadcast = None

            with transaction.atomic():
                try:
                    auction = Auction.objects.select_for_update().get(pk=pk)

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
