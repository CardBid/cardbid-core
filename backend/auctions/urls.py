from django.urls import path
from .views import (
    PSAVerifyView, StreamerTestView, TaxCalculatorView, 
    TopUpBalanceView, UserProfileView, CardListCreateView,
    CategoryListView, AuctionListCreateView, AuctionDetailView, PlaceBidView, UserInventoryView, UserActiveBidsView,
    AuctionBidHistoryView, LiveRoomsListView, StreamRoomToggleView, CountryListView, BuyNowView, AuctionLiveDataView
)

urlpatterns = [
    # --- AUTH & PROFILE ---
    path('v1/psa-verify/', PSAVerifyView.as_view(), name='psa-verify'),
    path('user/profile/', UserProfileView.as_view(), name='user-profile'),
    path('test-streamer/', StreamerTestView.as_view(), name='test-streamer'),

    # --- FINANCES ---
    path('tax-calc/', TaxCalculatorView.as_view(), name='tax-calculator'),
    path('top-up/', TopUpBalanceView.as_view(), name='top-up-balance'),

    # --- CARDS ---
    path('cards/', CardListCreateView.as_view(), name='card-list'), 
    path('categories/', CategoryListView.as_view(), name='category-list'),

    # --- USER DASHBOARD ---
    path('user/inventory/', UserInventoryView.as_view(), name='user_inventory'),
    path('user/active-bids/', UserActiveBidsView.as_view(), name='user_active_bids'),

    # --- AUCTIONS ---
    path('auctions/', AuctionListCreateView.as_view(), name='auction-list'),
    path('auctions/<int:pk>/', AuctionDetailView.as_view(), name='auction-detail'),
    path('auctions/<int:pk>/bid/', PlaceBidView.as_view(), name='place-bid'),
    path('auctions/<int:pk>/bids/', AuctionBidHistoryView.as_view(), name='auction-bids'),
    path('auctions/<int:pk>/buy-now/', BuyNowView.as_view(), name='buy-now'),

    # --- LIVE STREAMING ---
    path('auctions/<int:pk>/live-data/', AuctionLiveDataView.as_view(), name='auction-live-data'),
    path('live-rooms/', LiveRoomsListView.as_view(), name='live-rooms-list'),
    path('live-rooms/toggle/', StreamRoomToggleView.as_view(), name='live-rooms-toggle'),

    # --- COUNTRIES & STATES ---
    path('countries/', CountryListView.as_view(), name='country-list'),
]
