from django.urls import path
from .views import (
    PSAVerifyView, StreamerTestView, TaxCalculatorView, 
    TopUpBalanceView, UserProfileView, CardListCreateView,
    CategoryListView, AuctionListCreateView, AuctionDetailView, PlaceBidView
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

    # --- AUCTIONS ---
    path('auctions/', AuctionListCreateView.as_view(), name='auction-list'),
    path('auctions/<int:pk>/', AuctionDetailView.as_view(), name='auction-detail'),
    path('auctions/<int:pk>/bid/', PlaceBidView.as_view(), name='place-bid'),
]