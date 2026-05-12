from decimal import Decimal
import random
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.permissions import AllowAny
from django.db import transaction
from django.shortcuts import get_object_or_404
from .models import Auction, AuctionSlot

from .permissions import IsStreamer


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
    return date aubout action to fronted
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


class AuctionBuyNowView(APIView):
    """
        Handle "Buy Now" action for an auction.
    Endpoint: POST /api/v1/auctions/{id}/buy-now/
    """
    permission_classes = [AllowAny] 

    def post(self, request, pk):
        with transaction.atomic():
           
            auction = get_object_or_404(
                Auction.objects.select_for_update(),
                pk=pk
            )

           
            allowed_types = [Auction.Type.BUY_NOW, Auction.Type.HYBRID]
            if auction.auction_type not in allowed_types:
                return Response(
                    {"error": "Ta aukcja nie obsługuje opcji Kup Teraz."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

           
            if auction.status != Auction.Status.ACTIVE:
                return Response(
                    {"error": "Ta aukcja nie jest już aktywna."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

           
            auction.winner = request.user if request.user.is_authenticated else None
            auction.status = Auction.Status.ENDED
            auction.save()

        return Response({
            "message": "Zakup zakończony sukcesem.",
            "auction_id": auction.pk,
            "card_name": auction.card.name,
            "price_paid": auction.buy_now_price,
        }, status=status.HTTP_200_OK)
