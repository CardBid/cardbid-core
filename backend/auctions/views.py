import random
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import generics, permissions, status
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.permissions import AllowAny, IsAuthenticated

from .permissions import IsStreamer
from .models import Card, Category, Auction, CardbidUser
from .serializers import CardSerializer, CategorySerializer, AuctionSerializer, UserProfileSerializer

from .utils import calculate_fees
from decimal import Decimal


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
    queryset = Auction.objects.filter(status='active')
    serializer_class = AuctionSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(seller=self.request.user)

class AuctionDetailView(generics.RetrieveAPIView):
    queryset = Auction.objects.all()
    serializer_class = AuctionSerializer

class PlaceBidView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            auction = Auction.objects.get(pk=pk, status='active')
            bid_amount = Decimal(request.data.get('amount'))
        except Auction.DoesNotExist:
            return Response({"error": "Auction does not exist or is closed."}, status=404)
        except (TypeError, ValueError):
            return Response({"error": "Invalid bid amount."}, status=400)

        if bid_amount <= auction.current_price:
            return Response({"error": f"You must bid more than {auction.current_price}"}, status=400)

        fees = calculate_fees(bid_amount, request.user)
        total_cost = fees['total_cost']

        if request.user.balance < total_cost:
            return Response({
                "error": "Insufficient funds in account (including taxes and duties).",
                "required_total": total_cost,
                "current_balance": request.user.balance
            }, status=400)

        auction.current_price = bid_amount
        auction.winner = request.user
        auction.save()

        return Response({
            "message": "Bid accepted!",
            "new_price": auction.current_price,
            "total_cost_with_tax": total_cost
        })