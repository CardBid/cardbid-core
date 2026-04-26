import random
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

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
