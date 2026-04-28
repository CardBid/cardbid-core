from rest_framework import serializers
from .models import CardbidUser, Card, Category, Auction, Bid, Country, State
from django.contrib.auth.hashers import make_password

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

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = CardbidUser
        fields = [
            'username', 'email', 'password', 'password_confirm', 
            'role', 'country', 'state', 'shipping_address'
        ]

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "Passwords do not match."})
        
        country = attrs.get('country')
        state = attrs.get('state')

        if country and country.name == "USA" and not state:
            raise serializers.ValidationError({"state": "For USA, selecting a state is required for tax calculation."})
        
        if state and state.country != country:
            raise serializers.ValidationError({"state": f"State {state.name} does not belong to country {country.name}."})

        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        validated_data['password'] = make_password(validated_data['password'])
        
        if 'role' not in validated_data:
            validated_data['role'] = 'bidder'
            
        return super().create(validated_data)