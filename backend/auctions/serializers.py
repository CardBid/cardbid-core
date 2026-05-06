from rest_framework import serializers
from .models import CardbidUser, Card, Category, Auction, Bid, Country, State, StreamRoom
from django.contrib.auth.hashers import make_password
from datetime import date

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
        fields = ['id', 'username', 'email', 'role', 'balance', 'country', 'state', 'shipping_address', 'birth_date']
        read_only_fields = ['balance', 'role']

class AuctionSerializer(serializers.ModelSerializer):
    card_details = CardSerializer(source='card', read_only=True)
    seller_name = serializers.ReadOnlyField(source='seller.username')
    winner_name = serializers.ReadOnlyField(source='winner.username')

    class Meta:
        model = Auction
        fields = [
            'id', 'seller', 'seller_name', 'card', 'card_details', 
            'auction_type', 'starting_price', 'current_price', 
            'buy_now_price', 'start_date', 'end_date', 'status', 'winner', 'winner_name'
        ]
        read_only_fields = ['current_price', 'winner', 'status']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = CardbidUser
        fields = [
            'username', 'email', 'password', 'password_confirm', 
            'role', 'country', 'state', 'shipping_address', 'birth_date'
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

        birth_date = attrs.get('birth_date')
        if not birth_date:
            raise serializers.ValidationError({"birth_date": "Date of birth is required."})
            
        today = date.today()
        age = today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
        
        if age < 18:
            raise serializers.ValidationError({"birth_date": "You must be at least 18 years old to create an account and place bids."})

        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        validated_data['password'] = make_password(validated_data['password'])
        
        if 'role' not in validated_data:
            validated_data['role'] = 'buyer'
            
        return super().create(validated_data)

class BidSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = Bid
        fields = ['id', 'username', 'amount', 'created_at']

class StreamRoomSerializer(serializers.ModelSerializer):
    streamer_name = serializers.ReadOnlyField(source='streamer.username')

    class Meta:
        model = StreamRoom
        fields = ['id', 'streamer_name', 'title', 'is_live', 'stream_key']

class StateSerializer(serializers.ModelSerializer):
    class Meta:
        model = State
        fields = ['id', 'name', 'code']

class CountrySerializer(serializers.ModelSerializer):
    states = StateSerializer(many=True, read_only=True)

    class Meta:
        model = Country
        fields = ['id', 'name', 'code', 'has_states', 'default_vat', 'states']