from rest_framework import serializers
from .models import CardbidUser, Card, Category, Auction, Bid, Country, State

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug']

class CardSerializer(serializers.ModelSerializer):
    category_name = serializers.ReadOnlyField(source='category.name')

    class Meta:
        model = Card
        fields = ['id', 'name', 'category', 'category_name', 'grade', 'certificate_number', 'description', 'image']

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CardbidUser
        fields = ['id', 'username', 'email', 'role', 'balance', 'country', 'state', 'shipping_address']
        read_only_fields = ['balance', 'role']

class AuctionSerializer(serializers.ModelSerializer):
    card_details = CardSerializer(source='card', read_only=True)
    seller_name = serializers.ReadOnlyField(source='seller.username')

    class Meta:
        model = Auction
        fields = [
            'id', 'seller', 'seller_name', 'card', 'card_details', 
            'auction_type', 'starting_price', 'current_price', 
            'buy_now_price', 'start_date', 'end_date', 'status', 'winner'
        ]
        read_only_fields = ['current_price', 'winner', 'status']